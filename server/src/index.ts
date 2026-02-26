import express from 'express';
import axios from 'axios';
import cors from 'cors';
import router from './routes.js';
import { update_prices } from './model.js';
const app = express();
const PORT = 8000;

var corscfg = {
    origin: '*',
}


app.use(cors(corscfg));
app.use(router);


app.listen(PORT,async ()=>
{   
  //await update_prices();
  console.log('running on port ' + PORT); 
})