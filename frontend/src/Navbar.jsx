import { signOut } from './lib/auth';

export default function Navbar({ user }) {
  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <nav className="navbar" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f5f5f5' }}>
      <div className="logo">
        <h3>Campora</h3>
      </div>
      <div className="nav-links">
        {user ? (
          <>
            <span style={{ marginRight: '1rem' }}>Welcome, {user.email}</span>
            <button onClick={handleLogout}>Log Out</button>
          </>
        ) : (
          <a href="/login">Log In</a>
        )}
      </div>
    </nav>
  );
}
