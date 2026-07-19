import {
    createContext,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { translations, type Language } from "../i18n/translations";

interface LanguageContextValue {
    language: Language;
    setLanguage: (lang: Language) => void;
    /** Looks up a dot-path key (e.g. "home.searchPlaceholder") and optionally
     * interpolates {placeholders} with values from `vars`. Falls back to the
     * key itself if nothing is found, so missing translations never crash the UI. */
    t: (key: string, vars?: Record<string, string | number>) => string;
    /** Returns a raw (non-string) value from the dictionary, e.g. an array of steps. */
    tRaw: <T = unknown>(key: string) => T;
}

const STORAGE_KEY = "tcg_language";

const LanguageContext = createContext<LanguageContextValue | undefined>(
    undefined
);

function detectDefaultLanguage(): Language {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "pt") return stored;

    return navigator.language?.toLowerCase().startsWith("pt") ? "pt" : "en";
}

function resolve(path: string, lang: Language): unknown {
    return path
        .split(".")
        .reduce<any>((acc, part) => (acc == null ? acc : acc[part]), translations[lang]);
}

function interpolate(template: string, vars?: Record<string, string | number>) {
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (_, key) =>
        key in vars ? String(vars[key]) : `{${key}}`
    );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>(detectDefaultLanguage);

    function setLanguage(lang: Language) {
        localStorage.setItem(STORAGE_KEY, lang);
        setLanguageState(lang);
    }

    const value = useMemo<LanguageContextValue>(() => {
        function t(key: string, vars?: Record<string, string | number>) {
            const found = resolve(key, language);
            if (typeof found !== "string") return key;
            return interpolate(found, vars);
        }

        function tRaw<T = unknown>(key: string): T {
            return resolve(key, language) as T;
        }

        return { language, setLanguage, t, tRaw };
    }, [language]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) {
        throw new Error("useLanguage deve ser usado dentro de um LanguageProvider");
    }
    return ctx;
}
