import axios from "axios";


const axs = axios.create({
  timeout: 120000,
  baseURL: 'https://api.scryfall.com',
  headers:  {
    'User-Agent':'TCGDataInterface/1.0',
    'Accept':'application/json',
    'Content-Type':'application/json',
  }
})

export default axs;