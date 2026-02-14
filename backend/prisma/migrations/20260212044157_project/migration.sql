/*
  Warnings:

  - You are about to drop the column `userId` on the `impact_logs` table. All the data in the column will be lost.
  - Added the required column `projectId` to the `impact_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `impact_logs` DROP FOREIGN KEY `impact_logs_userId_fkey`;

-- DropIndex
DROP INDEX `impact_logs_userId_idx` ON `impact_logs`;

-- AlterTable
ALTER TABLE `impact_logs` DROP COLUMN `userId`,
    ADD COLUMN `projectId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `projects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `projects_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `impact_logs_projectId_idx` ON `impact_logs`(`projectId`);

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `impact_logs` ADD CONSTRAINT `impact_logs_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
