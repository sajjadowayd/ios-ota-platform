# iOS OTA App Distribution Platform

A full-stack platform for distributing iOS applications Over-The-Air (OTA) without the App Store. Admins upload IPA files through a web panel; users browse and install apps directly on their iPhone or iPad through Safari using Apple's `itms-services://` protocol.

---

## Table of Contents

- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [HTTPS Setup](#https-setup)
- [Admin Panel](#admin-panel)
- [OTA Install Flow](#ota-install-flow)
- [Database Schema](#database-schema)
- [Seeding Dummy Data](#seeding-dummy-data)
- [Telegram Integration](#telegram-integration)
- [Security](#security)

---

## How It Works

Apple devices support a special installation protocol called `itms-services://`. When Safari on an iPhone or iPad encounters this link, it fetches a `manifest.plist` file from a server, reads the app metadata, and prompts the user to install the IPA file directly.

```
itms-services://?action=download-manifest&url=https://your-server.com/api/apps/<id>/manifest.plist
```

The `manifest.plist` is an Apple XML file that contains:
- The bundle identifier (e.g. `com.example.app`)
- The version number
- The direct HTTPS URL to the `.ipa` file
- The HTTPS URL to the app icon

> **Important:** The manifest URL and IPA URL **must be served over HTTPS**. Apple will reject plain HTTP on real devices.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Express.js + TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Auth | JWT (jsonwebtoken) |
| File Upload | Multer |
| HTTPS Tunnel | Cloudflare Quick Tunnel (`cloudflared`) |

---

## Project Structure

```
ios-ota-platform/
├── backend/
│   ├── src/
│   │   ├── index.ts                  # Express entry point
│   │   ├── routes/
│   │   │   ├── auth.ts               # POST /api/auth/login
│   │   │   ├── apps.ts               # GET / POST / DELETE /api/apps
│   │   │   ├── manifest.ts           # GET /api/apps/:id/manifest.plist
│   │   │   └── files.ts              # GET /files/ipa/:f  /files/icons/:f
│   │   ├── middleware/
│   │   │   ├── auth.ts               # JWT verification guard
│   │   │   └── upload.ts             # Multer config (IPA + icon)
│   │   ├── services/
│   │   │   └── plist.ts              # Apple manifest XML generator
│   │   └── lib/
│   │       └── prisma.ts             # Prisma client singleton
│   ├── prisma/
│   │   ├── schema.prisma             # App database model
│   │   ├── seed.ts                   # 6 dummy apps for testing
│   │   └── migrations/               # Auto-generated SQL migrations
│   ├── uploads/
│   │   ├── ipa/                      # Stored IPA files (UUID names)
│   │   └── icons/                    # Stored icon images (UUID names)
│   ├── .env                          # Local config (not committed)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx            # Root layout + nav header
│   │   │   ├── page.tsx              # / — App library with search
│   │   │   ├── apps/[id]/page.tsx    # /apps/:id — App detail + install
│   │   │   └── admin/
│   │   │       ├── page.tsx          # /admin — Login
│   │   │       └── dashboard/page.tsx# /admin/dashboard — Upload & manage
│   │   ├── components/
│   │   │   ├── AppCard.tsx           # App grid card
│   │   │   ├── InstallButton.tsx     # OTA install + Telegram redirect
│   │   │   └── SearchBar.tsx         # Live search input
│   │   └── lib/
│   │       └── api.ts                # Typed fetch wrappers
│   ├── .env.local                    # Local config (not committed)
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── .env.example                      # Config template with instructions
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 16 running locally
- `cloudflared` for HTTPS tunneling (required for real device testing)

### 1. Clone the repository

```bash
git clone https://github.com/sajjadowayd/ios-ota-platform.git
cd ios-ota-platform
```

### 2. Configure the backend

```bash
cd backend
cp ../.env.example .env   # then edit .env with your values
npm install
npx prisma migrate deploy
npx prisma generate
```

### 3. Configure the frontend

```bash
cd ../frontend
# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
npm install
```

### 4. Start the backend

```bash
cd backend
npm run dev
# Running on http://localhost:3001
```

### 5. Start the frontend

```bash
cd frontend
npm run dev
# Running on http://localhost:3000
```

### 6. Seed dummy data (optional)

```bash
cd backend
npx prisma db seed
```

This creates 6 sample apps with generated icons and placeholder IPA files so you can explore the UI immediately.

---

## Environment Variables

### `backend/.env`

```env
# PostgreSQL connection
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ota_db

# JWT secret — change this to a long random string in production
JWT_SECRET=change-me-to-a-long-random-secret

# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Public base URL of the backend — used to build manifest.plist URLs
# Must be HTTPS for real device OTA testing
BASE_URL=http://localhost:3001

# Server port
PORT=3001

# Allowed CORS origins (comma-separated)
CORS_ORIGIN=http://localhost:3000
```

### `frontend/.env.local`

```env
# Must match BASE_URL in backend — must be HTTPS for real device testing
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Admin login — returns JWT token |

**Request body:**
```json
{ "username": "admin", "password": "admin123" }
```

**Response:**
```json
{ "token": "eyJhbGciOiJIUzI1NiIs..." }
```

---

### Apps

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/apps` | No | List all apps. Add `?search=name` to filter |
| `GET` | `/api/apps/:id` | No | Get single app by ID |
| `POST` | `/api/apps` | Yes | Upload a new app (multipart/form-data) |
| `DELETE` | `/api/apps/:id` | Yes | Delete app and its files |

**POST `/api/apps` — form fields:**

| Field | Type | Required |
|-------|------|----------|
| `name` | text | Yes |
| `bundleId` | text | Yes |
| `version` | text | Yes |
| `description` | text | Yes |
| `category` | text | No |
| `ipa` | file (`.ipa`) | Yes |
| `icon` | file (image) | Yes |

---

### Manifest

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/apps/:id/manifest.plist` | Returns Apple plist XML (`application/xml`) |

---

### Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/files/ipa/:filename` | Download IPA file (increments download count) |
| `GET` | `/files/icons/:filename` | Get app icon image |

---

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Returns `{ "status": "ok" }` |

---

## HTTPS Setup

Apple requires the manifest URL and IPA URL to be served over **HTTPS** for OTA installation to work on real devices. For local development, use a tunnel.

### Option 1 — Cloudflare Quick Tunnel (Recommended)

No account required. Provides a `.trycloudflare.com` URL instantly.

```bash
# Download cloudflared (Windows)
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe -o cloudflared.exe

# Start backend tunnel (port 3001)
./cloudflared.exe tunnel --url http://localhost:3001

# Start frontend tunnel (port 3000) — in a second terminal
./cloudflared.exe tunnel --url http://localhost:3000
```

After starting, update your env files with the HTTPS URLs:

```env
# backend/.env
BASE_URL=https://your-backend-url.trycloudflare.com
CORS_ORIGIN=http://localhost:3000,https://your-frontend-url.trycloudflare.com

# frontend/.env.local
NEXT_PUBLIC_API_URL=https://your-backend-url.trycloudflare.com
```

Then touch `backend/src/index.ts` to trigger a hot-reload so the backend picks up the new `BASE_URL`.

### Option 2 — ngrok

Free account required at [ngrok.com](https://ngrok.com).

```bash
ngrok config add-authtoken <your-token>
ngrok http 3001   # backend
ngrok http 3000   # frontend (separate terminal)
```

### Option 3 — localhost.run (no install)

```bash
ssh -R 80:localhost:3001 nokey@localhost.run
```

---

## Admin Panel

Access the admin panel at `/admin`.

**Default credentials:**
```
Username: admin
Password: admin123
```

Change these in `backend/.env` before deploying.

### Uploading an App

1. Go to `http://localhost:3000/admin`
2. Sign in with admin credentials
3. Click **+ Upload App**
4. Fill in:
   - **App Name** — display name shown to users
   - **Bundle ID** — e.g. `com.yourcompany.appname`
   - **Version** — e.g. `1.0.0`
   - **Description** — shown on the app detail page
   - **Category** — optional label (e.g. Productivity, Games)
   - **IPA File** — your signed `.ipa` file
   - **App Icon** — PNG or JPG, ideally 512×512px
5. Click **Upload App**

The app immediately appears in the public library.

---

## OTA Install Flow

```
Admin uploads IPA + icon
        │
        └─► Files saved to uploads/ with UUID filenames
        └─► App record created in PostgreSQL

User opens Safari on iPhone → visits the frontend URL
        │
        └─► Sees app library grid

User taps an app card → detail page
        │
        └─► Icon, name, version, description displayed
        └─► "Install" button visible

User taps "Install"
        │
        ├─► Safari intercepts itms-services:// link
        │       └─► Fetches manifest.plist from backend (HTTPS)
        │       └─► Reads bundle ID, version, IPA URL
        │       └─► Shows native iOS install confirmation
        │       └─► Downloads and installs the .ipa
        │
        └─► After 2 seconds → redirected to https://t.me/appos4
```

---

## Database Schema

```prisma
model App {
  id            String   @id @default(uuid())
  name          String
  bundleId      String
  version       String
  description   String
  category      String?
  ipaFilename   String        // UUID-based filename in uploads/ipa/
  iconFilename  String        // UUID-based filename in uploads/icons/
  downloadCount Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## Seeding Dummy Data

```bash
cd backend
npx prisma db seed
```

Creates 6 sample apps:

| App | Bundle ID | Category | Version |
|-----|-----------|----------|---------|
| TaskFlow Pro | com.taskflow.pro | Productivity | 2.1.0 |
| FitTrack | com.fittrack.app | Health & Fitness | 1.5.3 |
| SnapEdit | com.snapedit.photo | Photo & Video | 3.0.1 |
| CryptoWatch | com.cryptowatch.finance | Finance | 1.2.0 |
| GameZone | com.gamezone.arcade | Games | 4.1.2 |
| DevConsole | com.devconsole.tools | Developer Tools | 1.0.4 |

The seed script skips if apps already exist to prevent duplicates.

---

## Telegram Integration

When a user taps **Install**, the platform automatically redirects them to the Telegram channel after 2 seconds:

```
https://t.me/appos4
```

This is implemented in `InstallButton.tsx` using `window.location.href` (page navigation) rather than `window.open` — because iOS Safari blocks `window.open` calls inside `setTimeout` as they are not considered a direct user gesture.

A persistent Telegram link is also displayed below the Install button so users can join the channel independently.

---

## Security

| Concern | Solution |
|---------|----------|
| Path traversal on file serving | Filenames validated — no `..` or `/` allowed |
| Unauthorized uploads | JWT required on `POST /api/apps` and `DELETE /api/apps/:id` |
| Malicious file types | Multer validates `.ipa` for IPA field, `image/*` for icon field |
| Filename collisions | All stored files use UUID-based names |
| Exposed credentials | `.env` and `.env.local` are gitignored |
| CORS | Backend only accepts configured origins |

---

## GitHub Repository

[https://github.com/sajjadowayd/ios-ota-platform](https://github.com/sajjadowayd/ios-ota-platform)
