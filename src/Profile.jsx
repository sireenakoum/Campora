import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { getProfile, updateProfile } from './lib/profiles';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [accountType, setAccountType] = useState('Student');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('');
  const [coursesTaken, setCoursesTaken] = useState([]);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProfileData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await getProfile(user.id);
          if (error) throw error;
          if (data) {
            setFullName(data.name || '');
            setAvatarUrl(data.avatar_url || '');
            setAccountType(data.account_type || 'Student');
            setMajor(data.major || '');
            setYear(data.year || '');
            setCoursesTaken(data.courses_taken || []);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await updateProfile(user.id, {
      name: fullName,
      avatar_url: avatarUrl,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Profile updated successfully!');
    }
    setSaving(false);
  };

  if (loading) return <p style={styles.hint}>Loading profile...</p>;

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>Student Profile</h1>

      {error && <p style={styles.errorText}>{error}</p>}
      {message && <p style={styles.successText}>{message}</p>}

      <div style={styles.card}>
        {/* Onboarding info (read-only) */}
        <div style={styles.section}>
          <p style={styles.sectionLabel}>Onboarding Information</p>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoKey}>Account Type</span>
              <span style={styles.infoValue}>{accountType}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoKey}>Major</span>
              <span style={styles.infoValue}>{major || '—'}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoKey}>Year</span>
              <span style={styles.infoValue}>{year || '—'}</span>
            </div>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoKey}>Courses Taken</span>
            <div style={styles.tagWrap}>
              {coursesTaken.length === 0 ? (
                <span style={styles.infoValue}>—</span>
              ) : (
                coursesTaken.map((c) => (
                  <span key={c} style={styles.tag}>{c}</span>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={styles.divider} />

        {/* Editable fields */}
        <form onSubmit={handleUpdate} style={styles.form}>
          <p style={styles.sectionLabel}>Personal Details</p>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Avatar URL</label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={saving} style={saving ? { ...styles.button, ...styles.buttonDisabled } : styles.button}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    width: '100%',
    maxWidth: '720px',
  },
  title: {
    fontSize: '42px',
    fontWeight: '900',
    color: '#0B1A3F',
    margin: '0 0 30px 0',
  },
  card: {
    background: '#fff',
    borderRadius: '24px',
    padding: '35px',
    boxShadow: '0 15px 30px rgba(0,0,0,0.04)',
    border: '1px solid #F1F5F9',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  sectionLabel: {
    fontSize: '12px',
    fontWeight: '900',
    color: '#A3AED0',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    margin: 0,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoKey: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#A3AED0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  infoValue: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0B1A3F',
  },
  tagWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '4px',
  },
  tag: {
    padding: '6px 14px',
    borderRadius: '20px',
    backgroundColor: '#F4F7FE',
    color: '#0B1A3F',
    fontSize: '13px',
    fontWeight: '800',
  },
  divider: {
    height: '1px',
    background: '#F1F5F9',
    margin: '30px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
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
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#0B1A3F',
    color: '#FFFFFF',
    padding: '1rem',
    borderRadius: '12px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    alignSelf: 'flex-start',
    paddingLeft: '2rem',
    paddingRight: '2rem',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    cursor: 'not-allowed',
  },
  errorText: {
    color: '#DC2626',
    fontWeight: '700',
  },
  successText: {
    color: '#16A34A',
    fontWeight: '700',
  },
  hint: {
    color: '#A3AED0',
    fontWeight: '700',
  },
};
