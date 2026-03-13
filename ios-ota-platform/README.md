# iOS OTA App Distribution Platform

A full-stack platform for distributing iOS applications Over-The-Air (OTA) without the App Store. Admins upload IPA files, sign them with certificates, and users install apps directly on their iPhone or iPad through Safari using Apple's `itms-services://` protocol.

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
| Backend | NestJS + TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Auth | JWT (Passport.js) |
| File Upload | Multer |
| IPA Signing | zsign |
| Certificate Parsing | node-forge |
| HTTPS Tunnel | Cloudflare Quick Tunnel (`cloudflared`) |

---

## Project Structure

```
ios-ota-platform/
├── backend/
│   ├── src/
│   │   ├── main.ts                      # NestJS bootstrap
│   │   ├── app.module.ts                # Root module
│   │   ├── auth/                        # JWT authentication
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts       # POST /api/auth/login
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/jwt.strategy.ts
│   │   │   └── dto/login.dto.ts
│   │   ├── apps/                        # App CRUD
│   │   │   ├── apps.module.ts
│   │   │   ├── apps.controller.ts       # GET/POST/DELETE /api/apps
│   │   │   ├── apps.service.ts
│   │   │   └── dto/
│   │   ├── versions/                    # Version history
│   │   │   ├── versions.module.ts
│   │   │   ├── versions.controller.ts   # GET/POST /api/apps/:id/versions
│   │   │   ├── versions.service.ts
│   │   │   └── dto/
│   │   ├── certificates/                # Certificate management
│   │   │   ├── certificates.module.ts
│   │   │   ├── certificates.controller.ts
│   │   │   ├── certificates.service.ts
│   │   │   └── dto/
│   │   ├── signer/                      # IPA signing (zsign)
│   │   │   ├── signer.module.ts
│   │   │   ├── signer.controller.ts
│   │   │   └── signer.service.ts
│   │   ├── manifest/                    # manifest.plist generation
│   │   │   ├── manifest.module.ts
│   │   │   ├── manifest.controller.ts
│   │   │   └── manifest.service.ts
│   │   ├── files/                       # File serving + download tracking
│   │   │   ├── files.module.ts
│   │   │   ├── files.controller.ts
│   │   │   └── files.service.ts
│   │   ├── storage/                     # Structured file storage
│   │   │   ├── storage.module.ts
│   │   │   └── storage.service.ts
│   │   ├── prisma/                      # Prisma client module
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   └── common/
│   │       ├── guards/jwt-auth.guard.ts
│   │       ├── crypto/encryption.service.ts
│   │       ├── pipes/file-validation.pipe.ts
│   │       └── filters/http-exception.filter.ts
│   ├── prisma/
│   │   ├── schema.prisma                # Database models
│   │   ├── seed.ts
│   │   ├── migrate-storage.ts           # Data migration script
│   │   └── migrations/
│   ├── storage/                         # Structured file storage
│   │   ├── apps/{appId}/
│   │   │   ├── icon.png
│   │   │   └── versions/{versionId}/
│   │   │       ├── original.ipa
│   │   │       ├── signed.ipa
│   │   │       └── manifest.plist
│   │   └── certs/{certId}/
│   │       ├── cert.p12
│   │       └── profile.mobileprovision
│   ├── .env
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx               # Root layout + nav header
│   │   │   ├── page.tsx                 # / — App library with search
│   │   │   ├── apps/[id]/page.tsx       # /apps/:id — Detail + install + versions
│   │   │   └── admin/
│   │   │       ├── page.tsx             # /admin — Login
│   │   │       └── dashboard/
│   │   │           ├── layout.tsx       # Sidebar layout
│   │   │           ├── page.tsx         # Apps management
│   │   │           ├── certificates/    # Certificate management
│   │   │           └── signing/         # IPA signing workflow
│   │   ├── components/
│   │   │   ├── AppCard.tsx
│   │   │   ├── InstallButton.tsx
│   │   │   └── SearchBar.tsx
│   │   └── lib/
│   │       └── api.ts                   # Typed fetch wrappers
│   ├── .env.local
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── .env.example
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 16 running locally
- `zsign` installed (for IPA signing — optional for basic usage)
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

### 6. Migrate existing data (if upgrading)

```bash
cd backend
npm run migrate-storage
```

---

## Environment Variables

### `backend/.env`

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ota_db
JWT_SECRET=change-me-to-a-long-random-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
BASE_URL=http://localhost:3001
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Optional: 64-char hex string for certificate password encryption
# If empty, a key is derived from JWT_SECRET
ENCRYPTION_KEY=
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Admin login — returns JWT token |

### Apps

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/apps` | No | List apps (search, category, pagination) |
| `GET` | `/api/apps/:id` | No | Get app with versions |
| `POST` | `/api/apps` | Yes | Upload new app (multipart) |
| `DELETE` | `/api/apps/:id` | Yes | Delete app + all versions |

### Versions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/apps/:appId/versions` | No | List all versions |
| `POST` | `/api/apps/:appId/versions` | Yes | Upload new version |
| `POST` | `/api/apps/:appId/versions/:vId/sign` | Yes | Sign version with certificate |

### Certificates

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/certificates` | Yes | List certificates |
| `POST` | `/api/certificates` | Yes | Upload .p12 + provisioning profile |
| `DELETE` | `/api/certificates/:id` | Yes | Delete certificate |
| `PATCH` | `/api/certificates/:id/default` | Yes | Set default certificate |

### Manifest & Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/apps/:id/manifest.plist` | Apple plist XML |
| `GET` | `/files/apps/:appId/icon` | App icon |
| `GET` | `/files/apps/:appId/versions/:vId/ipa` | Download IPA |
| `GET` | `/health` | Health check |

---

## HTTPS Setup

Apple requires the manifest URL and IPA URL to be served over **HTTPS** for OTA installation to work on real devices.

### Cloudflare Quick Tunnel (Recommended)

```bash
cloudflared tunnel --url http://localhost:3001   # backend
cloudflared tunnel --url http://localhost:3000   # frontend (second terminal)
```

Update your env files with the HTTPS URLs.

---

## Admin Panel

Access at `/admin`. Default credentials: `admin` / `admin123`.

The admin dashboard has a **sidebar layout** with three sections:

1. **Apps** — Upload, view, and delete apps
2. **Certificates** — Upload .p12 certificates and provisioning profiles, set defaults
3. **Signing** — Select a certificate and sign app versions with zsign

---

## OTA Install Flow

```
Admin uploads IPA + icon + metadata
  └─► Files saved to storage/apps/{id}/
  └─► App record + AppVersion created

Admin uploads certificate (.p12 + provisioning profile)
  └─► Password validated and encrypted (AES-256-GCM)
  └─► Certificate info extracted via node-forge

Admin signs an app version
  └─► zsign re-signs the IPA with the selected certificate
  └─► manifest.plist auto-generated

User opens Safari → visits frontend URL
  └─► Sees app library grid
  └─► Taps app → detail page with version history
  └─► Taps "Install"
        └─► Safari intercepts itms-services:// link
        └─► Fetches manifest.plist → downloads signed IPA
        └─► Native iOS install prompt
```

---

## Database Schema

- **App** — name, bundleId, version, description, category, iconPath, downloadCount
- **AppVersion** — version, originalIpaPath, signedIpaPath, manifestPath, signingStatus, fileSize, downloadCount
- **Certificate** — name, teamName, expiresAt, p12Path, encryptedPassword, provisionProfilePath, isDefault
- **Download** — appId, versionId, ipAddress, userAgent, timestamp
- **SigningStatus** — PENDING, SIGNING, SIGNED, FAILED, SKIPPED

---

## Security

| Concern | Solution |
|---------|----------|
| Path traversal | StorageService validates all paths relative to base directory |
| Unauthorized access | JWT auth guard on all admin endpoints |
| File validation | IPA ZIP magic bytes checked, MIME type validation for icons |
| Certificate passwords | Encrypted with AES-256-GCM, never stored in plaintext |
| Shell injection | `execFile` (not `exec`) used for zsign — no shell interpolation |
| Upload limits | 500MB IPA, 10MB icon, 50MB certificates |
| CORS | Only configured origins accepted |
| Rate limiting | Throttler module limits request rates |
| HTTP headers | Helmet middleware adds security headers |
