import { useLanguage } from "../context/LanguageContext";
export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="language-switcher" aria-label="Language / Idioma">
      {(["pt", "en"] as const).map((lang) => (
        <button
          type="button"
          key={lang}
          aria-pressed={language === lang}
          onClick={() => setLanguage(lang)}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
