/*
  Warnings:

  - You are about to drop the column `migration_test_note` on the `ai_models` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."ai_models" DROP COLUMN "migration_test_note";
