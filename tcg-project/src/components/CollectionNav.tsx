import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
export function CollectionNav() {
  const { t } = useLanguage();
  return <nav aria-label={t('nav.collection')} className="collection-nav">
    {['cards', 'favorites', 'charts', 'profile'].map(path => <NavLink key={path} to={`/${path}`}>{t(`nav.${path}`)}</NavLink>)}
    <LanguageSwitcher />
  </nav>;
}
