import axios from "axios";

const baseURL = import.meta.env.VITE_SERVER_URL;
const axs = axios.create({
    baseURL:baseURL
});


export default axs;