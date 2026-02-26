import fs from 'fs';
import {Pool} from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

/* ideia: criar uma rotina,
todo dia verificar se bulk data adiciona uma carta nova e adiciona-la a tabela cards
apos isso buscar preco de todas as cartas incluindo as novas
1-verificar novas cartas
2-atualizar precos
*/

const axs = axios.create({
  baseURL: 'https://api.scryfall.com',
  headers:  {
    'User-Agent':'TCGAnal/1.0',
    'Accept':'*/*',
    'Content-Type':'application/json',
  }
})




const client =  new Pool({
    user:'postgres',
    password:'postgres',
    database:'tcg_cards',
    host:'localhost',
    port:5432,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ScryfallCard {
  name: string
  id: string
  released_at: string
  scryfall_uri: string
  mana_cost: string | null
  type_line: string
  colors: string[] | null
  color_identity: string[] | null
  foil: boolean
  nonfoil: boolean
  set: string
  set_name: string
  set_type: string
  set_uri: string
  set_search_uri: string
  scryfall_set_uri: string
  rarity: string
  prices: Record<string, string | null>
  related_uris: Record<string, string>
  image_uris?: {
    small?: string
    normal?: string
    large?: string
  }
}


export async function load_cards_data()
{   try{
        const QUERY = `INSERT INTO cards 
        (name, card_id, released_at, scryfall_uri, mana_cost, type_line, colors, 
        color_identity, foil, nonfoil, set_code, set_name, set_type, set_uri,
        set_search_uri, scryfall_set_uri, rarity, prices, related_uri, image_uris) values 
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20);`;
    
        console.log('loading cards...')
        const filepath = path.join(__dirname, 'default_cards.json')
        const data = JSON.parse(fs.readFileSync(filepath,'utf8'));
        
        await Promise.all(data.map((card : ScryfallCard)=>
        {
            return client.query(QUERY,[
                card.name, card.id, card.released_at, card.scryfall_uri, card.mana_cost, card.type_line, card.colors, 
                card.color_identity, card.foil, card.nonfoil, card.set, card.set_name, card.set_type, card.set_uri,
                card.set_search_uri, card.scryfall_set_uri, card.rarity, card.prices, card.related_uris,card.image_uris
            ]);
        }
        ))
        console.log('loaded!');
      
    }catch(err){
        console.log(err);
    }
}

export async function get_price(id : string) 
{
    try {
        const QUERY = `SELECT price_usd,date FROM card_prices WHERE card_id = $1 ORDER BY date DESC LIMIT 30;`;
        const {rows} = await client.query(QUERY, [id]);

        if(rows.length === 0){
            //console.log('no cards');
            return null;
        }
        
        console.log(rows);
        return rows;

    } catch (err) {
        console.log(err);
        return null;
    }
}


export async function get_card(id:string)
{
    try {
        const QUERY = `SELECT cards.* FROM cards WHERE cards.card_id = $1 LIMIT 1`;

        const {rows} = await client.query(QUERY,[id]);
        const prices = await get_price(id);

        console.log(prices);
        if(rows.length===0)
        {
            console.log('no cards');
            return null;
        }

        const card_info = {
            card_info: rows[0],
            prices:prices,
        }
      
        return card_info;

    } catch (error) {
         console.log(error);
    }

}
//melhorar esse metodo
export async function update_prices()
{
    
    const bulkInfo = await axs.get('https://api.scryfall.com/bulk-data/default_cards');
    const url = bulkInfo.data.download_uri;

    const cards =  await axs.get(url);

    for(const card of cards.data){
        // console.log('updating price...')
        // const {data} = await axs.get(`https://api.scryfall.com/cards/${card.card_id}`);
        // console.log('fetched card data')

        const price = card.prices?.usd;
        
        
        const QUERY = `INSERT INTO card_prices(card_id,price_usd,date) 
        VALUES ($1,$2,CURRENT_DATE) ON CONFLICT (card_id,date) DO NOTHING;`;
        try {
            console.log('updating...');
            await client.query(QUERY,[card.id,price]);
            console.log('updated!');
        } catch (error) {
            console.log(error);
        }
        
    }
}


export async function get_cards()
{
    try{
        console.log('getting cards...');
        const QUERY = `SELECT * FROM cards LIMIT 20`;
        const data = await client.query(QUERY);
        return data.rows;
        
    }catch(err)
    {
        console.log(err);
    }
}
   

