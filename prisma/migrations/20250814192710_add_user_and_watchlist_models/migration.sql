-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "wallet_address" TEXT,
    "username" TEXT,
    "avatar" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_watchlist" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "market_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_users_email" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "idx_users_wallet_address" ON "public"."users"("wallet_address");

-- CreateIndex
CREATE INDEX "idx_users_username" ON "public"."users"("username");

-- CreateIndex
CREATE INDEX "idx_user_watchlist_user_id" ON "public"."user_watchlist"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_watchlist_market_id" ON "public"."user_watchlist"("market_id");

-- CreateIndex
CREATE INDEX "idx_user_watchlist_added_at" ON "public"."user_watchlist"("added_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_watchlist_user_market" ON "public"."user_watchlist"("user_id", "market_id");

-- AddForeignKey
ALTER TABLE "public"."predictions" ADD CONSTRAINT "predictions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_watchlist" ADD CONSTRAINT "user_watchlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_watchlist" ADD CONSTRAINT "user_watchlist_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
