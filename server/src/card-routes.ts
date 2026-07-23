import { Router } from 'express'


import { search_filter, SearchFilters } from './utils.js';

import { validJwt, requireAdmin} from './middleware.js';
import { login, register, getUserById } from './models/UserM.js'
import { get_cards, get_price, get_card, get_sets, runCardSync, runPriceSync, getAdminStats } from './models/CardM.js';
import { get_featured_cards, get_market_movers } from './models/MarketM.js';


const cards_router = Router();


cards_router.get('/cards',async (req,res)=>
{   

  const page = Number(req.query.page);
  const limit = Number(req.query.limit);
  const filter : SearchFilters = search_filter.parse(req.query);


  const data = await get_cards(page,limit,filter);
  res.send(data);
})


cards_router.get('/price/:id', async (req, res)=>{
  
  const id = req.params.id
  const price = await get_price(id);
  
  res.send(price);

});
cards_router.get('/cards/:card_id', async (req, res)=>
{
  const card_id = req.params.card_id;
  const data = await get_card(card_id);

  res.send(data);
})

cards_router.get('/sets', async (req, res)=>
{
  const sets = await get_sets();
  res.send(sets);
})


cards_router.get('/cards/featured' ,  async (req, res)=>
{
  try{
    const feat_cards = await get_featured_cards();
  res.status(200).json(feat_cards);
  }
  catch (error: any) {
    res.status(400).json({ message: error?.message ?? "Erro ao recuperar featured_cards." });
  }

})


/* MARKET ROUTES*/
cards_router.get('/market/movers', async (req, res)=>
{
  try{
    const movers = await get_market_movers();
    res.status(200).json(movers);
  }catch(error : any)
  {
    res.status(500).json({ message: error?.message ?? "Erro ao buscar maiores variacoes" });
  }
})
// Retorna os dados do usuário autenticado a partir do token enviado.



export default cards_router;
