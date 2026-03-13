import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const storageBase = path.join(process.cwd(), 'storage');
  const uploadsBase = path.join(process.cwd(), 'uploads');

  // Ensure storage base exists
  if (!fs.existsSync(storageBase)) {
    fs.mkdirSync(storageBase, { recursive: true });
  }

  const apps = await prisma.app.findMany();
  console.log(`Found ${apps.length} apps to migrate`);

  for (const app of apps) {
    console.log(`Migrating app: ${app.name} (${app.id})`);

    const appDir = path.join(storageBase, 'apps', app.id);
    const versionsDir = path.join(appDir, 'versions');

    // Ensure directories
    fs.mkdirSync(versionsDir, { recursive: true });

    // Migrate icon
    if (app.iconFilename) {
      const oldIconPath = path.join(uploadsBase, 'icons', app.iconFilename);
      const newIconPath = path.join(appDir, 'icon.png');
      if (fs.existsSync(oldIconPath) && !fs.existsSync(newIconPath)) {
        fs.copyFileSync(oldIconPath, newIconPath);
        console.log(`  Copied icon: ${app.iconFilename} -> icon.png`);
      }
    }

    // Check if app already has versions
    const existingVersions = await prisma.appVersion.findMany({
      where: { appId: app.id },
    });

    if (existingVersions.length === 0 && app.ipaFilename) {
      // Create an AppVersion for the existing IPA
      const version = await prisma.appVersion.create({
        data: {
          appId: app.id,
          version: app.version,
          originalIpaPath: `apps/${app.id}/versions/PLACEHOLDER/original.ipa`,
          signingStatus: 'SKIPPED',
          fileSize: null,
        },
      });

      const versionDir = path.join(versionsDir, version.id);
      fs.mkdirSync(versionDir, { recursive: true });

      // Migrate IPA
      const oldIpaPath = path.join(uploadsBase, 'ipa', app.ipaFilename);
      const newIpaPath = path.join(versionDir, 'original.ipa');
      if (fs.existsSync(oldIpaPath) && !fs.existsSync(newIpaPath)) {
        fs.copyFileSync(oldIpaPath, newIpaPath);
        const stats = fs.statSync(newIpaPath);
        console.log(`  Copied IPA: ${app.ipaFilename} -> versions/${version.id}/original.ipa`);

        // Update paths
        await prisma.appVersion.update({
          where: { id: version.id },
          data: {
            originalIpaPath: `apps/${app.id}/versions/${version.id}/original.ipa`,
            fileSize: BigInt(stats.size),
          },
        });
      } else {
        // Update path even if file doesn't exist
        await prisma.appVersion.update({
          where: { id: version.id },
          data: {
            originalIpaPath: `apps/${app.id}/versions/${version.id}/original.ipa`,
          },
        });
      }
    }

    // Update app iconPath
    await prisma.app.update({
      where: { id: app.id },
      data: { iconPath: `apps/${app.id}/icon.png` },
    });
  }

  console.log('\nMigration complete!');
  console.log('Legacy files in uploads/ have been COPIED (not moved) to storage/.');
  console.log('You can safely delete the uploads/ directory after verifying the migration.');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
