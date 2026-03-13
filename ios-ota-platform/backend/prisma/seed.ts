import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const IPA_DIR = path.join(UPLOADS_DIR, 'ipa');
const ICONS_DIR = path.join(UPLOADS_DIR, 'icons');

// ─── Dummy app definitions ────────────────────────────────────────────────────

const DUMMY_APPS = [
  {
    name: 'TaskFlow Pro',
    bundleId: 'com.taskflow.pro',
    version: '2.1.0',
    description:
      'The ultimate task and project management app for professionals. Create boards, set deadlines, assign tasks, and track progress — all in one place. Syncs across all your devices in real time.',
    category: 'Productivity',
    color: '#4F46E5',
    bg: '#EEF2FF',
    downloadCount: 142,
  },
  {
    name: 'FitTrack',
    bundleId: 'com.fittrack.app',
    version: '1.5.3',
    description:
      'Your personal health and fitness companion. Log workouts, track calories, monitor sleep, and visualise your progress with beautiful charts. Supports Apple Health and wearables.',
    category: 'Health & Fitness',
    color: '#16A34A',
    bg: '#F0FDF4',
    downloadCount: 89,
  },
  {
    name: 'SnapEdit',
    bundleId: 'com.snapedit.photo',
    version: '3.0.1',
    description:
      'Professional-grade photo and video editing right on your iPhone. One-tap AI enhancements, advanced filters, curves, layers, and direct export to social media. No subscription required.',
    category: 'Photo & Video',
    color: '#9333EA',
    bg: '#FAF5FF',
    downloadCount: 317,
  },
  {
    name: 'CryptoWatch',
    bundleId: 'com.cryptowatch.finance',
    version: '1.2.0',
    description:
      'Real-time cryptocurrency portfolio tracker with price alerts, market news, and detailed candlestick charts. Track 10,000+ coins, set custom watchlists, and get push notifications on price movements.',
    category: 'Finance',
    color: '#D97706',
    bg: '#FFFBEB',
    downloadCount: 54,
  },
  {
    name: 'GameZone',
    bundleId: 'com.gamezone.arcade',
    version: '4.1.2',
    description:
      'A collection of 20 retro-style arcade games optimised for mobile. Compete on global leaderboards, unlock achievements, and challenge your friends via Game Center. Completely offline-capable.',
    category: 'Games',
    color: '#DC2626',
    bg: '#FEF2F2',
    downloadCount: 503,
  },
  {
    name: 'DevConsole',
    bundleId: 'com.devconsole.tools',
    version: '1.0.4',
    description:
      'A developer utility belt for iOS: JSON formatter, HTTP request tester, Base64 encoder/decoder, JWT inspector, regex tester, and a local server log viewer. Essential for mobile developers on the go.',
    category: 'Developer Tools',
    color: '#0F172A',
    bg: '#F8FAFC',
    downloadCount: 28,
  },
];

// ─── SVG icon generator ───────────────────────────────────────────────────────

function generateSvgIcon(name: string, color: string, bg: string): string {
  const initial = name.charAt(0).toUpperCase();
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="115" fill="${bg}"/>
  <rect x="20" y="20" width="472" height="472" rx="100" fill="${color}" opacity="0.12"/>
  <text
    x="256"
    y="256"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="260"
    font-weight="700"
    fill="${color}"
    text-anchor="middle"
    dominant-baseline="central"
  >${initial}</text>
</svg>`;
}

// ─── Minimal placeholder IPA (ZIP end-of-central-directory signature) ─────────
// A real IPA is a ZIP archive. We write a valid-ish placeholder that
// satisfies `fs.existsSync` checks in the file-serving route.

function createPlaceholderIpa(): Buffer {
  // "PK\x05\x06" + 18 zero bytes = minimal valid ZIP (empty archive)
  const buf = Buffer.alloc(22, 0);
  buf.write('PK\x05\x06', 0, 'binary');
  return buf;
}

// ─── Main seed ────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding database with dummy apps...\n');

  // Ensure upload dirs exist
  fs.mkdirSync(IPA_DIR, { recursive: true });
  fs.mkdirSync(ICONS_DIR, { recursive: true });

  // Clear existing seeded data (safe for dev — only if table is empty or force)
  const existing = await prisma.app.count();
  if (existing > 0) {
    console.log(`Found ${existing} existing app(s). Skipping seed to avoid duplicates.`);
    console.log('To reseed, delete all apps from the admin dashboard first.\n');
    return;
  }

  for (const def of DUMMY_APPS) {
    const ipaFilename = `${uuidv4()}.ipa`;
    const iconFilename = `${uuidv4()}.svg`;

    // Write placeholder IPA file
    fs.writeFileSync(path.join(IPA_DIR, ipaFilename), createPlaceholderIpa());

    // Write SVG icon file
    fs.writeFileSync(
      path.join(ICONS_DIR, iconFilename),
      generateSvgIcon(def.name, def.color, def.bg),
      'utf8'
    );

    // Insert DB record
    const app = await prisma.app.create({
      data: {
        name: def.name,
        bundleId: def.bundleId,
        version: def.version,
        description: def.description,
        category: def.category,
        ipaFilename,
        iconFilename,
        downloadCount: def.downloadCount,
      },
    });

    console.log(`  ✓ ${app.name} (${app.id})`);
  }

  console.log(`\nDone! Seeded ${DUMMY_APPS.length} apps.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
