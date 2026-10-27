-- Reconcile the initial migration with the existing Prisma schema.
-- Stop with an actionable constraint error if legacy rows have null Scryfall IDs;
-- do not silently delete user data to apply the migration.
ALTER TABLE "cards" ALTER COLUMN "card_id" SET NOT NULL;
ALTER TABLE "card_prices" ALTER COLUMN "card_id" SET NOT NULL;
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "quality_score" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE "Favorite" (
  "userId" TEXT NOT NULL,
  "cardId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId", "cardId"),
  CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Favorite_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("card_id") ON DELETE CASCADE ON UPDATE CASCADE
);
