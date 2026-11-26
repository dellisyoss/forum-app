import { useState } from 'react';
import { isValidUserId } from './api';
import Header from './components/Header';
import AuthPage from './pages/AuthPage';
import ForumPage from './pages/ForumPage';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('forum-user'));
      return isValidUserId(savedUser?.id) ? savedUser : null;
    } catch {
      return null;
    }
  });
  const [view, setView] = useState('feed');

  function handleAuth(u) {
    setUser(u);
    localStorage.setItem('forum-user', JSON.stringify(u));
    setView('feed');
  }

  function logout() {
    setUser(null);
    localStorage.removeItem('forum-user');
  }

  function showLogin() {
    setView('auth');
  }

  return (
    <div className="page">
      <div className="shell">
        <Header
          user={user}
          onLogin={showLogin}
          onLogout={logout}
          onHome={() => setView('feed')}
        />

        <div className="body">
          {view === 'auth' && <AuthPage onSuccess={handleAuth} />}
          <ForumPage active={view === 'feed'} user={user} onLogin={showLogin} />
        </div>
      </div>
    </div>
  );
}
