-- CreateTable
CREATE TABLE `files` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ownerId` VARCHAR(191) NOT NULL,
    `parentId` INTEGER NULL,
    `displayName` VARCHAR(255) NOT NULL,
    `storageKey` VARCHAR(768) NULL,
    `mimeType` VARCHAR(127) NULL,
    `size` BIGINT NOT NULL DEFAULT 0,
    `type` ENUM('FILE', 'FOLDER') NOT NULL DEFAULT 'FILE',
    `status` ENUM('PENDING', 'READY', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `uploadStartedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `files_storageKey_key`(`storageKey`),
    INDEX `files_ownerId_idx`(`ownerId`),
    INDEX `files_parentId_idx`(`parentId`),
    INDEX `files_status_idx`(`status`),
    INDEX `files_ownerId_parentId_idx`(`ownerId`, `parentId`),
    INDEX `files_ownerId_deletedAt_idx`(`ownerId`, `deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `storage_stats` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `usedStorage` BIGINT NOT NULL DEFAULT 0,
    `storageLimit` BIGINT NOT NULL DEFAULT 104857600,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `storage_stats_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `files`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `storage_stats` ADD CONSTRAINT `storage_stats_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
