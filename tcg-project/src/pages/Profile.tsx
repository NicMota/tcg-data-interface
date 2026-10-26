import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CollectionNav } from '../components/CollectionNav';
export function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.name ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try { await updateProfile(name); setMessage('profile.saved'); }
    catch { setMessage('common.error'); }
    finally { setBusy(false); }
  }
  return <main className="app-page"><CollectionNav /><h1>{t('nav.profile')}</h1>
    <form onSubmit={submit} className="profile-form">
      <label htmlFor="profile-name">{t('profile.name')}</label>
      <input id="profile-name" required maxLength={100} value={name} onChange={e => setName(e.target.value)} />
      <label htmlFor="profile-email">Email</label><input id="profile-email" value={user?.email ?? ''} readOnly />
      <button className="action" disabled={busy || !name.trim()}>{t('profile.save')}</button>
      {message && <p role="status">{t(message)}</p>}
    </form><button className="action" onClick={logout}>{t('nav.logout')}</button>
  </main>;
}
