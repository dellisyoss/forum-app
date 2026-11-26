import Icon from './Icon';

export default function Header({ user, onLogin, onLogout, onHome }) {
  return (
    <header className="header">
      <button className="brand" onClick={onHome}>
        <span className="brand-icon"><Icon.Brand /></span>
        <span>Forum</span>
      </button>
      {user ? (
        <div className="header-user">
          <span className="avatar small"><Icon.User /></span>
          <span className="header-name">{user.username}</span>
          <button className="link-btn" onClick={onLogout}>Logout</button>
        </div>
      ) : (
        <button className="header-login" onClick={onLogin}>
          <span className="avatar small lilac-bg"><Icon.User /></span>
          Login
        </button>
      )}
    </header>
  );
}
