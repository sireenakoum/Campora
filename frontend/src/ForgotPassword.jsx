import { useState } from 'react';
import { resetPassword } from './lib/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await resetPassword(email);

    if (error) {
      setError(error.message);
    } else {
      setMessage('Password reset link sent! Check your email inbox.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <h2>Forgot Password</h2>
      <p>Enter your email and we'll send you a link to reset your password.</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <form onSubmit={handleReset}>
        <div>
          <label>Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Sending link...' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  );
}
