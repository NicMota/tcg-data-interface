/* eslint-disable react-hooks/set-state-in-effect -- Request lifecycle state is synchronized with the API. */
import { useEffect, useState } from 'react';
import axs from '../axios';
import type { TcgCard } from '../types';
import { Card } from '../components/Card';
import { CollectionNav } from '../components/CollectionNav';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../context/FavoritesContext';
export function Favorites() {
  const { t } = useLanguage();
  const { ids } = useFavorites();
  const [cards, setCards] = useState<TcgCard[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(false);
    axs.get('/favorites', { params: { page, limit: 20 }, signal: controller.signal }).then(({ data }) => {
      setCards(data.data); setPages(data.totalPages);
      if (page > Math.max(1, data.totalPages)) setPage(Math.max(1, data.totalPages));
    }).catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, ids, retry]);
  return <main className="app-page"><CollectionNav /><h1>{t('nav.favorites')}</h1>
    {loading ? <p role="status">{t('common.loading')}</p> : error ? <div role="alert">{t('common.error')} <button className="action" onClick={() => setRetry(v => v + 1)}>{t('common.retry')}</button></div> : cards.length ?
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{cards.map(c => <Card c={c} key={c.card_id} />)}</div> : <p>{t('favorites.empty')}</p>}
    {pages > 1 && <div className="pager"><button className="action" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}>{t('home.previous')}</button><span>{page} / {pages}</span><button className="action" disabled={page >= pages || loading} onClick={() => setPage(p => p + 1)}>{t('home.next')}</button></div>}
  </main>;
}
