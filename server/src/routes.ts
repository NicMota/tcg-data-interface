import express from 'express'
const router = express.Router();
import { load_cards_data, get_cards, update_prices, get_price, get_card } from './model.js';


router.get('/cards',async (req,res)=>
{   
  const data = await get_cards();
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