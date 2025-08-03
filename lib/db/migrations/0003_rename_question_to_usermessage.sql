-- First add the new column without NOT NULL constraint
ALTER TABLE "predictions" ADD COLUMN "user_message" text;--> statement-breakpoint

-- Copy data from question to user_message
UPDATE "predictions" SET "user_message" = "question" WHERE "question" IS NOT NULL;--> statement-breakpoint

-- Set default value for any remaining NULL values
UPDATE "predictions" SET "user_message" = 'No user message provided' WHERE "user_message" IS NULL;--> statement-breakpoint

-- Make user_message NOT NULL
ALTER TABLE "predictions" ALTER COLUMN "user_message" SET NOT NULL;--> statement-breakpoint

-- Drop the old question column
ALTER TABLE "predictions" DROP COLUMN "question";--> statement-breakpoint 