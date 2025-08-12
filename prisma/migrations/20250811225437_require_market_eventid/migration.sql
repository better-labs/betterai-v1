/*
  Warnings:

  - Made the column `event_id` on table `markets` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."markets" ALTER COLUMN "event_id" SET NOT NULL;
