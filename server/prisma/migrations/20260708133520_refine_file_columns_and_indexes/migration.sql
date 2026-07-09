/*
  Warnings:

  - You are about to alter the column `storageKey` on the `files` table. The data in that column could be lost. The data in that column will be cast from `VarChar(768)` to `VarChar(512)`.

*/
-- AlterTable
ALTER TABLE `files` MODIFY `storageKey` VARCHAR(512) NULL,
    MODIFY `mimeType` VARCHAR(255) NULL,
    ALTER COLUMN `uploadStartedAt` DROP DEFAULT;

-- CreateIndex
CREATE INDEX `files_parentId_deletedAt_idx` ON `files`(`parentId`, `deletedAt`);
