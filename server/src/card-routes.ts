import { Router } from 'express';
import { pagination, search_filter } from './utils.js';
import { get_cards, get_price, get_card, get_sets } from './models/CardM.js';
import { get_featured_cards, get_market_movers } from './models/MarketM.js';

const router = Router();
router.get('/cards', async (req, res) => {
  const { page, limit } = pagination.parse(req.query);
  res.json(await get_cards(page, limit, search_filter.parse(req.query)));
});
// Static routes must precede the card-id route.
router.get('/cards/featured', async (_req, res) => res.json(await get_featured_cards()));
router.get('/cards/:card_id', async (req, res) => {
  const card = await get_card(req.params.card_id);
  if (!card) { res.status(404).json({ message: 'Carta não encontrada.' }); return; }
  res.json(card);
});
router.get('/price/:id', async (req, res) => res.json(await get_price(req.params.id)));
router.get('/sets', async (_req, res) => res.json(await get_sets()));
router.get('/market/movers', async (_req, res) => res.json(await get_market_movers()));
export default router;
