-- Migration: Add migration_test_note to ai_models table
-- This is a safe migration that adds a nullable column for testing production workflow

-- Add migration_test_note column to ai_models table
ALTER TABLE "ai_models" ADD COLUMN "migration_test_note" TEXT;

-- Add comment for documentation
COMMENT ON COLUMN "ai_models"."migration_test_note" IS 'Test field for validating production migration workflow - can be safely removed after testing';
