import axios from "axios";

const baseURL = import.meta.env.VITE_SERVER_URL;
// Kept in sync with AuthContext.tsx's TOKEN_KEY.
const TOKEN_KEY = "tcg_token";

const axs = axios.create({
    baseURL:baseURL
});

// Without this, no request ever carried the auth token, so any
// protected route (/me, /admin/*) would always be rejected as
// unauthenticated regardless of a valid stored session.
axs.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
    if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
});

export default axs;