import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { load_cards_data } from './model.js';

const app = express();
const PORT = 8000;

var corscfg = {
    origin: '*',
}
const axs = axios.create({
  baseURL: 'https://api.scryfall.com',
  headers:  {
    'User-Agent':'TCGAnal/1.0',
    'Accept':'*/*',
    'Content-Type':'application/json',
  }
})

app.use(cors(corscfg));
app.get('/cards',async (req,res)=>
{   
    try{
        const response = await axs.get('/cards/23551');
        res.json(response.data);
    }catch(error)
    {
        console.log(error);
    }
})




app.listen(PORT,async ()=>
{   
    await load_cards_data();
    console.log('running on port ' + PORT); 
})