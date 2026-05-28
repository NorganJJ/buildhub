/*
  Warnings:

  - You are about to drop the column `changelog` on the `projects` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "project_files" ADD COLUMN     "scanStatus" TEXT NOT NULL DEFAULT 'clean';

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "changelog",
ADD COLUMN     "creatorName" TEXT,
ADD COLUMN     "creatorUrl" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "project_versions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_versions_projectId_version_key" ON "project_versions"("projectId", "version");

-- AddForeignKey
ALTER TABLE "project_versions" ADD CONSTRAINT "project_versions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
