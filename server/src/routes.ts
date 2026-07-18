import express from 'express'
const router = express.Router();
import { load_cards_data, get_cards, update_prices, get_price, get_card } from './model.js';
import { search_filter, SearchFilters } from './utils.js';
import {z} from 'zod';
import { validJwt } from './middleware.js';
import { login, register } from './auth.js';
router.get('/cards',async (req,res)=>
{   

  const page = Number(req.query.page);
  const limit = Number(req.query.limit);
  const filter : SearchFilters = search_filter.parse(req.query);


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

router.post('/login', async (req, res)=>{
  const {email,password} = req.body;
  const token = await login(email,password);
  req.headers["authorization"] = "Bearer "+token;
  res.status(200).send("authenticated " + token);

  
})

router.post('/register', async (req, res)=>
{
  const {email,name,password} = req.body;
  const result = await register({email,name,password});
  if(result)
    res.status(200).send("successfully registered");
  else 
    res.status(404).send("error on register");


});


export default router;