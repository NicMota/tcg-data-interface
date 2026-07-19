import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import axs from "../axios";

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    isMod?: boolean;
    isAdmin?: boolean;
    emailConfirmed?: boolean;
}

interface AuthContextValue {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string, remember?: boolean) => Promise<void>;
    register: (
        name: string,
        email: string,
        password: string,
        remember?: boolean
    ) => Promise<void>;
    logout: () => void;
}

const TOKEN_KEY = "tcg_token";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

function clearStoredToken() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
}

function persistToken(token: string, remember: boolean) {
    clearStoredToken();
    if (remember) {
        localStorage.setItem(TOKEN_KEY, token);
    } else {
        sessionStorage.setItem(TOKEN_KEY, token);
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function hydrate() {
            const token = readStoredToken();

            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const { data } = await axs.get("/me");
                if (!cancelled) {
                    setUser(data.user);
                }
            } catch {
                clearStoredToken();
                if (!cancelled) {
                    setUser(null);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        hydrate();

        return () => {
            cancelled = true;
        };
    }, []);

    async function login(email: string, password: string, remember = false) {
        const { data } = await axs.post("/login", { email, password });
        persistToken(data.token, remember);
        setUser(data.user);
    }

    async function register(
        name: string,
        email: string,
        password: string,
        remember = false
    ) {
        const { data } = await axs.post("/register", { name, email, password });
        persistToken(data.token, remember);
        setUser(data.user);
    }

    function logout() {
        clearStoredToken();
        setUser(null);
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth deve ser usado dentro de um AuthProvider");
    }
    return ctx;
}
