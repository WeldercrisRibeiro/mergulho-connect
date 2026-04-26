/*
  Warnings:

  - A unique constraint covering the columns `[group_id,role_id,routine_key]` on the table `group_routines` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "group_routines_group_id_routine_key_key";

-- AlterTable
ALTER TABLE "group_routines" ADD COLUMN     "role_id" UUID;

-- AlterTable
ALTER TABLE "wz_dispatches" ADD COLUMN     "attachment_url" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "group_routines_group_id_role_id_routine_key_key" ON "group_routines"("group_id", "role_id", "routine_key");
