import { useState } from 'react';
import { supabase } from './lib/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Password updated successfully! You can now log in.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <h2>Set New Password</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <form onSubmit={handleUpdatePassword}>
        <div>
          <label>New Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            minLength={6}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Updating Password...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
