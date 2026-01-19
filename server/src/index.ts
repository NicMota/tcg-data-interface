import express from 'express';
import axios from 'axios';
import cors from 'cors';
import 'dotenv/config'
const apikey = process.env.tcgapikey;
const app = express();
const PORT = 8000;

var corscfg = {
    origin: '*',
}
const axs = axios.create({
  baseURL: 'https://api.tcgapis.com/api/v1',
  headers:  {
    'X-Api-Key':apikey,
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




app.listen(PORT,()=>
{
    console.log('running on port ' + PORT); 
})