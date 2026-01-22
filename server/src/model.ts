import fs from 'fs';
import pkg from 'pg';


const QUERY = `INSERT INTO cards 
(name, released_at, scryfall_uri, mana_cost, type_line, colors, 
color_identity, foil, nonfoil, "set", set_name, set_type, set_uri,
set_search_uri, scryfall_set_uri, rarity, prices, related_uri) values 
($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18);`;



const {Client} = pkg;

const client =  new Client({
    user:'postgres',
    password:'',
    database:'tcg_cards',
    host:'localhost',
    port:5432,
});


export async function load_cards_data()
{   try{
        await client.connect();
        console.log('loading cards...')
        const data = JSON.parse(fs.readFileSync('./default_cards.json','utf8'));
        for(const card of data)
        {
            await client.query(QUERY,[
                card.name, card.released_at, card.scryfall_uri, card.mana_cost, card.type_line, card.colors, 
                card.color_identity, card.foil, card.nonfoil, card.set, card.set_name, card.set_type, card.set_uri,
                card.set_search_uri, card.scryfall_set_uri, card.rarity, card.prices, card.related_uri,
            ]);
        }
      
    }catch(err){
        console.log(err);
    }finally{
        await client.end();
    }
}
    
   

await client.end();
