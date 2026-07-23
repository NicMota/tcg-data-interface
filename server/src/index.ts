import express from 'express';
import cors from 'cors';
import router from './card-routes.js';
import cards_router from './card-routes.js';
import user_router from './user-routes.js';


const app = express();
app.use(express.json())
const PORT = 8000;

var corscfg = {
    origin: '*',
}


app.use(cors(corscfg));


app.use(cards_router);
app.use(user_router);


app.listen(PORT,"0.0.0.0",async ()=>
{   
  //await update_prices()

  console.log('running on port ' + PORT); 
})