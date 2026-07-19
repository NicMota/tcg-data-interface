import type { CSSProperties } from "react";
import { useLanguage } from "../context/LanguageContext";
import type { Language } from "../i18n/translations";

const optionStyle: CSSProperties = {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.05em",
    padding: "5px 10px",
    borderRadius: "8px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s",
    border: "none",
};

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    function optionFor(lang: Language): CSSProperties {
        const active = language === lang;
        return {
            ...optionStyle,
            background: active
                ? "linear-gradient(135deg, #d4af37, #b8960c)"
                : "transparent",
            color: active ? "#080710" : "#9b8c6e",
        };
    }

    return (
        <div
            className="flex items-center flex-shrink-0"
            style={{
                border: "1px solid rgba(212,175,55,0.18)",
                borderRadius: "10px",
                padding: "2px",
                background: "rgba(212,175,55,0.04)",
                gap: "2px",
            }}
        >
            <button type="button" style={optionFor("pt")} onClick={() => setLanguage("pt")}>
                PT
            </button>
            <button type="button" style={optionFor("en")} onClick={() => setLanguage("en")}>
                EN
            </button>
        </div>
    );
}
