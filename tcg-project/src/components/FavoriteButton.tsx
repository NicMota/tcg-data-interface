import { useState } from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';
export function FavoriteButton({ cardId }: { cardId: string }) {
  const { ids, loading, error: loadError, toggle } = useFavorites();
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  async function save() {
    setPending(true); setError(false);
    try { await toggle(cardId); } catch { setError(true); }
    finally { setPending(false); }
  }
  return <div>
    <button className="action" aria-pressed={ids.has(cardId)} disabled={loading || loadError || pending} onClick={save}>
      {ids.has(cardId) ? '★' : '☆'} {t(ids.has(cardId) ? 'favorites.remove' : 'favorites.add')}
    </button>
    {(error || loadError) && <p role="alert">{t('common.error')}</p>}
  </div>;
}
