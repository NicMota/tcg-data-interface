-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "card_prices" (
    "id" SERIAL NOT NULL,
    "card_id" TEXT,
    "price_usd" DECIMAL(10,4),
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isMod" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "emailConfirmed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" SERIAL NOT NULL,
    "card_id" TEXT,
    "name" TEXT,
    "released_at" DATE,
    "scryfall_uri" TEXT,
    "mana_cost" TEXT,
    "type_line" TEXT,
    "colors" TEXT[],
    "color_identity" TEXT[],
    "foil" BOOLEAN,
    "nonfoil" BOOLEAN,
    "set_code" TEXT,
    "set_name" TEXT,
    "set_type" TEXT,
    "set_uri" TEXT,
    "set_search_uri" TEXT,
    "scryfall_set_uri" TEXT,
    "rarity" TEXT,
    "prices" JSONB,
    "related_uri" JSONB,
    "image_uris" JSONB,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "card_prices_card_id_date_key" ON "card_prices"("card_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cards_card_id_key" ON "cards"("card_id");

-- AddForeignKey
ALTER TABLE "card_prices" ADD CONSTRAINT "card_prices_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("card_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

