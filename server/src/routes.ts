import express from 'express'
const router = express.Router();
import { load_cards_data, get_cards, update_prices, get_price, get_card } from './model.js';
import { search_filter, SearchFilters } from './utils.js';
import {z} from 'zod';

router.get('/cards',async (req,res)=>
{   

  const page = Number(req.query.page);
  const limit = Number(req.query.limit);
  const filter : SearchFilters = search_filter.parse(req.query);

  console.log({page,limit});
  const data = await get_cards(page,limit,filter);
  res.send(data);
})


router.get('/price/:id', async (req, res)=>{
  
  const id = req.params.id
  const price = await get_price(id);
  
  res.send(price);

});
router.get('/cards/:card_id', async (req, res)=>
{
  const card_id = req.params.card_id;
  const data = await get_card(card_id);

  res.send(data);
})

export default router;