import express from 'express'
const router = express.Router();
import { load_cards_data, get_cards, update_prices, get_price, get_card } from './model.js';
import { search_filter, SearchFilters } from './utils.js';
import {z} from 'zod';
import { validJwt, AuthRequest } from './middleware.js';
import { login, register, getUserById } from './auth.js';

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
  try {
    const {email,password} = req.body;
    const result = await login(email,password);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({ message: error?.message ?? "Usuário ou senha inválidos." });
  }
})

router.post('/register', async (req, res)=>
{
  try {
    const {email,name,password} = req.body;
    const result = await register({email,name,password});
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error?.message ?? "Erro ao criar conta." });
  }
});

// Retorna os dados do usuário autenticado a partir do token enviado.
router.get('/me', validJwt, async (req: AuthRequest, res) => {
  try {
    const user = await getUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ message: "Usuário não encontrado." });
      return;
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar usuário." });
  }
});


export default router;
