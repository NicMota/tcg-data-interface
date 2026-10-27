export interface PriceRecord { price_usd: string | number | null; date: string }
export interface TcgCard {
  id: number;
  card_id: string;
  name: string | null;
  type_line: string | null;
  set_name: string | null;
  foil: boolean | null;
  image_uris?: { normal?: string; large?: string; small?: string } | null;
  prices?: { usd?: string | null } | null;
  card_prices?: PriceRecord[];
}
export interface MarketMover {
  card_id: string;
  card: Pick<TcgCard, 'name' | 'set_name' | 'image_uris'> | null;
  previous_price: number;
  current_price: number;
  change: number;
  percent_change: number;
}
