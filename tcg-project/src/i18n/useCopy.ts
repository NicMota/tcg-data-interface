import { useLanguage } from "../context/LanguageContext";
export function useCopy() {
  const { language } = useLanguage();
  return (en: string, pt: string) => (language === "pt" ? pt : en);
}
