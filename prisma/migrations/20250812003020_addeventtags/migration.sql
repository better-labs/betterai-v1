-- CreateTable
CREATE TABLE "public"."tags" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "slug" TEXT,
    "force_show" BOOLEAN,
    "provider_updated_at" TIMESTAMP(6),
    "provider" TEXT,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_tags" (
    "event_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "event_tags_pkey" PRIMARY KEY ("event_id","tag_id")
);

-- CreateIndex
CREATE INDEX "idx_tags_label" ON "public"."tags"("label");

-- CreateIndex
CREATE INDEX "idx_tags_slug" ON "public"."tags"("slug");

-- CreateIndex
CREATE INDEX "idx_event_tags_tag_id" ON "public"."event_tags"("tag_id");

-- AddForeignKey
ALTER TABLE "public"."event_tags" ADD CONSTRAINT "event_tags_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."event_tags" ADD CONSTRAINT "event_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
