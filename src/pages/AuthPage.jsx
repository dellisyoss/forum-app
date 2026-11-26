import { useState } from 'react';
import * as api from '../api';

export default function AuthPage({ onSuccess }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const credentials = [username.trim(), password.trim()];
    let accountCreated = false;
    try {
      if (mode === 'register') {
        const registration = await api.createUser(...credentials);
        if (!registration) throw new Error('Could not create the account. Try a different username or sign in if you already have one.');
        accountCreated = true;
        if (registration.user) {
          onSuccess(registration.user);
          return;
        }
      }
      const user = await api.login(...credentials);
      if (!user) throw new Error('Invalid username or password.');
      onSuccess(user);
    } catch (err) {
      if (accountCreated) {
        setMode('login');
        setError('Your account was created. Automatic sign-in failed. Please sign in.');
      } else {
        setError(err.message || 'Something went wrong.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="card tone-lilac auth-card" onSubmit={submit}>
        <h1>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p className="muted">
          {mode === 'login' ? 'Log in to post and reply.' : 'Sign up to join the forum.'}
        </p>

        <label>
          Username <span className="muted">(first name)</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
        </label>
        <label>
          Password <span className="muted">(last name)</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        {error && <div className="error">{error}</div>}

        <button className="btn" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
        </button>
        <button
          type="button"
          className="btn-dashed"
          disabled={busy}
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
          }}
        >
          {mode === 'login' ? 'Need an account? Create one' : 'Have an account? Login'}
        </button>
      </form>
    </div>
  );
}
