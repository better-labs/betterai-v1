/*
  Warnings:

  - The `category` column on the `events` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `category` column on the `markets` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."Category" AS ENUM ('elections', 'geopolitics', 'economy', 'financial_markets', 'cryptocurrency', 'science_technology', 'business', 'sports', 'culture_entertainment', 'climate_environment');

-- AlterTable
ALTER TABLE "public"."events" DROP COLUMN "category",
ADD COLUMN     "category" "public"."Category";

-- AlterTable
ALTER TABLE "public"."markets" DROP COLUMN "category",
ADD COLUMN     "category" "public"."Category";

-- CreateIndex
CREATE INDEX "idx_events_category" ON "public"."events"("category");
