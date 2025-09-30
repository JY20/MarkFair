import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';

export default function App() {
  return (
    <>
      <header className="header">
        <div className="brand">MarkFair</div>
        <div className="auth">
          <SignedOut>
            <div className="auth-buttons">
              <SignUpButton mode="modal">
                <button className="btn btn-primary">Sign up</button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="btn btn-secondary">Sign in</button>
              </SignInButton>
            </div>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>
      <main className="container">
        <SignedIn>
          <WalletLinkForm />
          <AddVideoForm />
        </SignedIn>
      </main>
    </>
  );
}

function WalletLinkForm() {
  const { getToken, isSignedIn } = useAuth();
  const [wallet, setWallet] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!isSignedIn) {
      setError('Please sign in first.');
      return;
    }
    if (!wallet.trim()) {
      setError('Wallet address is required.');
      return;
    }
    setLoading(true);
    try {
      const token = await getToken({ template: 'backend' });
      const res = await fetch(`${API_BASE}/api/wallet/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ wallet_address: wallet.trim() }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to link wallet');
      }
      setMessage('Wallet linked successfully');
      setWallet('');
    } catch (err: any) {
      setError(err.message || 'Failed to link wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Link your wallet</h2>
      <p className="muted">Submit a wallet address to link it to your account.</p>
      <form className="form" onSubmit={onSubmit}>
        <input
          className="input"
          placeholder="0x..."
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
        />
        <button className="btn btn-primary" disabled={loading}>
          {loading ? 'Linking…' : 'Link wallet'}
        </button>
      </form>
      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}
      <div className="tip muted">
        We will link your Youtube channel ID and wallet address together.
      </div>
    </div>
  );
}

export function Page() {
  return (
    <main className="container">
      <SignedIn>
        <WalletLinkForm />
        <AddVideoForm />
      </SignedIn>
    </main>
  );
}

function AddVideoForm() {
  const { getToken } = useAuth();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

  // Load latest video from backend on mount so refresh shows persisted result
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken({ template: 'backend' });
        const res = await fetch(`${API_BASE}/api/youtube/videos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const v = list[0]; // latest first
          setResult({
            id: v.id,
            video_url: v.video_url,
            likes: v.likes,
            views: v.views,
            subscribers: v.subscribers_at_add ?? 0,
            channel_title: v.channel_title, // may be undefined
          });
        }
      } catch (_) {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!url.trim()) { setError('Please paste a YouTube URL.'); return; }
    setLoading(true);
    try {
      const token = await getToken({ template: 'backend' });
      const res = await fetch(`${API_BASE}/api/youtube/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ video_url: url.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
      setUrl('');
    } catch (err: any) {
      setError(err.message || 'Failed to add video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2 className="card-title">Add YouTube video</h2>
      <p className="muted">We’ll fetch likes, views, channel subscribers and channel name.</p>
      <form className="form" onSubmit={onSubmit}>
        <input className="input" placeholder="https://youtu.be/... or https://www.youtube.com/watch?v=..." value={url} onChange={(e) => setUrl(e.target.value)} />
        <button className="btn btn-primary" disabled={loading}>{loading ? 'Adding…' : 'Add video'}</button>
      </form>
      {error && <div className="alert error">{error}</div>}
      {result && (
        <div className="result-card">
          <div className="result-row">
            <div className="result-label">Video</div>
            <div className="result-value">
              {result.video_url ? (
                <a href={result.video_url} target="_blank" rel="noreferrer">{result.video_url}</a>
              ) : '—'}
            </div>
          </div>
          <div className="stats-grid" style={{ marginTop: 12 }}>
            <div className="stat"><div className="label">Channel</div><div className="value">{result.channel_title || '—'}</div></div>
            <div className="stat"><div className="label">Subscribers</div><div className="value">{result.subscribers ?? 0}</div></div>
            <div className="stat"><div className="label">Likes</div><div className="value">{result.likes}</div></div>
            <div className="stat"><div className="label">Views</div><div className="value">{result.views}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}