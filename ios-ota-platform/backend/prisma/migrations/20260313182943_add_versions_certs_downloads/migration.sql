-- CreateEnum
CREATE TYPE "SigningStatus" AS ENUM ('PENDING', 'SIGNING', 'SIGNED', 'FAILED', 'SKIPPED');

-- AlterTable
ALTER TABLE "App" ADD COLUMN     "iconPath" TEXT,
ALTER COLUMN "ipaFilename" DROP NOT NULL,
ALTER COLUMN "iconFilename" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AppVersion" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "buildNumber" TEXT,
    "releaseNotes" TEXT,
    "originalIpaPath" TEXT NOT NULL,
    "signedIpaPath" TEXT,
    "manifestPath" TEXT,
    "signingStatus" "SigningStatus" NOT NULL DEFAULT 'PENDING',
    "signingError" TEXT,
    "certificateId" TEXT,
    "fileSize" BIGINT,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teamName" TEXT,
    "teamId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "p12Path" TEXT NOT NULL,
    "p12PasswordEncrypted" TEXT NOT NULL,
    "provisionProfilePath" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Download" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "versionId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Download_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppVersion_appId_idx" ON "AppVersion"("appId");

-- CreateIndex
CREATE INDEX "Download_appId_idx" ON "Download"("appId");

-- CreateIndex
CREATE INDEX "Download_versionId_idx" ON "Download"("versionId");

-- CreateIndex
CREATE INDEX "Download_createdAt_idx" ON "Download"("createdAt");

-- AddForeignKey
ALTER TABLE "AppVersion" ADD CONSTRAINT "AppVersion_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppVersion" ADD CONSTRAINT "AppVersion_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Download" ADD CONSTRAINT "Download_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Download" ADD CONSTRAINT "Download_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "AppVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
