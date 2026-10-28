CREATE TABLE "InventoryItem" (
 "id" TEXT NOT NULL, "sku" TEXT NOT NULL, "cardId" TEXT, "name" TEXT NOT NULL,
 "setCode" TEXT NOT NULL DEFAULT '', "condition" TEXT NOT NULL DEFAULT 'NM',
 "language" TEXT NOT NULL DEFAULT 'EN', "finish" TEXT NOT NULL DEFAULT 'nonfoil',
 "quantity" INTEGER NOT NULL DEFAULT 0, "reserved" INTEGER NOT NULL DEFAULT 0,
 "costBrl" DECIMAL(12,2) NOT NULL DEFAULT 0, "priceBrl" DECIMAL(12,2) NOT NULL DEFAULT 0,
 "reorderPoint" INTEGER NOT NULL DEFAULT 2, "location" TEXT NOT NULL DEFAULT '',
 "version" INTEGER NOT NULL DEFAULT 1, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "stock_nonnegative" CHECK ("quantity" >= 0 AND "reserved" >= 0 AND "reserved" <= "quantity"),
 CONSTRAINT "money_nonnegative" CHECK ("costBrl" >= 0 AND "priceBrl" >= 0 AND "reorderPoint" >= 0),
 CONSTRAINT "InventoryItem_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("card_id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "InventoryItem_sku_key" ON "InventoryItem"("sku");
CREATE INDEX "InventoryItem_name_idx" ON "InventoryItem"("name");
CREATE TABLE "StockMovement" (
 "id" TEXT NOT NULL, "itemId" TEXT NOT NULL, "actorId" TEXT NOT NULL, "type" TEXT NOT NULL,
 "quantityDelta" INTEGER NOT NULL, "reservedDelta" INTEGER NOT NULL DEFAULT 0,
 "quantityAfter" INTEGER NOT NULL, "reservedAfter" INTEGER NOT NULL,
 "reason" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "StockMovement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "StockMovement_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "StockMovement_itemId_createdAt_idx" ON "StockMovement"("itemId", "createdAt");
CREATE TABLE "StockImport" (
 "id" TEXT NOT NULL, "digest" TEXT NOT NULL, "filename" TEXT NOT NULL, "rowCount" INTEGER NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "StockImport_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StockImport_digest_key" ON "StockImport"("digest");
CREATE INDEX "card_prices_date_idx" ON "card_prices"("date");
