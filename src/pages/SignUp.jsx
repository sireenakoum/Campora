import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../lib/auth';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Clear any HMR-preserved stale state on fresh mount
  useEffect(() => {
    setError(null);
    setMessage(null);
  }, []);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.endsWith('@mail.aub.edu')) {
      setError('Access restricted: You must use a valid @mail.aub.edu email address.');
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await signUp(cleanEmail, password, { full_name: fullName });

    if (signUpError) {
      setError(signUpError?.message || 'An error occurred. Please try again.');
    } else {
      setMessage('Account created! Please check your email to confirm registration.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <Link to="/" style={styles.backHome}>
          ← Back to Home
        </Link>

        <div style={styles.header}>
          <h1 style={styles.logoTitle}>Campora</h1>
          <p style={styles.subtitle}>Create Your Account</p>
        </div>

        {error && typeof error === 'string' && (
          <div style={styles.errorBox}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={styles.errorClose}>✕</button>
          </div>
        )}

        {message && (
          <div style={styles.successBox}>
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSignUp} style={styles.form} noValidate>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="username@mail.aub.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={loading ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#6B7280' }}>
            Already have an account?{' '}
            <Link to="/login" style={styles.link}>
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: '3rem',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
    width: '100%',
    maxWidth: '420px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2.5rem',
  },
  backHome: {
    display: 'inline-flex',
    alignItems: 'center',
    color: '#6B7280',
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: '600',
    marginBottom: '1.25rem',
    transition: 'color 0.2s ease',
    paddingLeft: '2px',
  },
  logoTitle: {
    color: '#111827',
    fontSize: '2.25rem',
    fontWeight: '800',
    margin: '0 0 0.5rem 0',
  },
  subtitle: {
    color: '#6B7280',
    fontSize: '1rem',
    margin: 0,
  },
  errorBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    color: '#DC2626',
    padding: '0.85rem 1.1rem',
    borderRadius: '10px',
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
  },
  errorClose: {
    background: 'none',
    border: 'none',
    color: '#DC2626',
    cursor: 'pointer',
    fontSize: '0.85rem',
    padding: 0,
    marginLeft: '8px',
  },
  successBox: {
    backgroundColor: '#F0FDF4',
    border: '1px solid #BBF7D0',
    color: '#16A34A',
    padding: '0.85rem 1.1rem',
    borderRadius: '10px',
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#1F2937',
  },
  input: {
    padding: '0.9rem 1.25rem',
    borderRadius: '10px',
    border: '1px solid #D1D5DB',
    fontSize: '1rem',
    color: '#111827',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#1F2937',
    color: '#FFFFFF',
    padding: '1rem',
    borderRadius: '10px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    cursor: 'not-allowed',
  },
  footer: {
    marginTop: '2rem',
    textAlign: 'center',
  },
  link: {
    color: '#2563EB',
    textDecoration: 'none',
    fontSize: '0.95rem',
    fontWeight: '500',
  },
};
