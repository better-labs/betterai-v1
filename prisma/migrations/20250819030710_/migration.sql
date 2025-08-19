-- CreateTable
CREATE TABLE "public"."testerson1" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "testerson1_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_testerson1_name" ON "public"."testerson1"("name");

-- CreateIndex
CREATE INDEX "idx_testerson1_is_active" ON "public"."testerson1"("is_active");
