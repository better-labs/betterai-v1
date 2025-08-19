-- Migration: Add test field to ai_models table for GitHub Actions testing
-- This is a safe migration that adds a nullable column with no data impact

-- Add test_field column to ai_models table
ALTER TABLE "ai_models" ADD COLUMN "test_field" TEXT;

-- Add comment for documentation
COMMENT ON COLUMN "ai_models"."test_field" IS 'Test field for GitHub Actions migration workflow';
