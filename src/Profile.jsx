import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { getProfile, updateProfile } from './lib/profiles';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);

  const [accountType, setAccountType] = useState('Student');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('');
  const [guestTitle, setGuestTitle] = useState('');
  const [coursesTaken, setCoursesTaken] = useState([]);

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProfileData() {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await getProfile(user.id);

          if (error) throw error;

          if (data) {
            setFullName(data.name || '');
            setAvatarUrl(data.avatar_url || '');
            setAccountType(data.account_type || 'Student');
            setMajor(data.major || '');
            setYear(data.year || '');
            setGuestTitle(data.guest_title || '');
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

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }

    setError(null);
    setMessage(null);
    setAvatarFile(file);

    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User is not logged in.');
      }

      let newAvatarUrl = avatarUrl;

      if (avatarFile) {
        const fileExtension = avatarFile.name.split('.').pop();
        const fileName = `${user.id}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, {
            upsert: true,
            contentType: avatarFile.type,
          });

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        newAvatarUrl = publicUrl;
        setAvatarUrl(publicUrl);
      }

      const { error: updateError } = await updateProfile(user.id, {
        name: fullName,
        avatar_url: newAvatarUrl,
      });

      if (updateError) {
        throw updateError;
      }

      setAvatarFile(null);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>Student Profile</h1>

      {error && <p style={styles.errorText}>{error}</p>}
      {message && <p style={styles.successText}>{message}</p>}

      <div style={styles.card}>
        <div style={styles.profileHeader}>
          <div style={styles.avatarContainer}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                style={styles.avatar}
              />
            ) : (
              <div style={styles.avatarPlaceholder}>
                {fullName
                  ? fullName.charAt(0).toUpperCase()
                  : '?'}
              </div>
            )}
          </div>

          <div>
            <h2 style={styles.profileName}>
              {fullName || 'Student'}
            </h2>

            <p style={styles.profileMajor}>
              {major || 'Student'}
            </p>
          </div>
        </div>

        <div style={styles.section}>
          <p style={styles.sectionLabel}>
            Onboarding Information
          </p>

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoKey}>Account Type</span>
              <span style={styles.infoValue}>
                {accountType}
              </span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoKey}>Major</span>
              <span style={styles.infoValue}>
                {major || '—'}
              </span>
            </div>

            {accountType === 'Guest' ? (
              <div style={styles.infoItem}>
                <span style={styles.infoKey}>Title</span>
                <span style={styles.infoValue}>
                  {guestTitle || '—'}
                </span>
              </div>
            ) : (
              <div style={styles.infoItem}>
                <span style={styles.infoKey}>Year</span>
                <span style={styles.infoValue}>
                  {year || '—'}
                </span>
              </div>
            )}
          </div>

          <div style={styles.infoItem}>
            <span style={styles.infoKey}>Courses Taken</span>

            <div style={styles.tagWrap}>
              {coursesTaken.length === 0 ? (
                <span style={styles.infoValue}>—</span>
              ) : (
                coursesTaken.map((c) => (
                  <span key={c} style={styles.tag}>
                    {c}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={styles.divider} />

        <form onSubmit={handleUpdate} style={styles.form}>
          <p style={styles.sectionLabel}>
            Personal Details
          </p>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Profile Picture
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={styles.fileInput}
            />

            <span style={styles.hint}>
              JPG, PNG, or other image files up to 5MB.
            </span>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Full Name
            </label>

            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={
              saving
                ? {
                    ...styles.button,
                    ...styles.buttonDisabled,
                  }
                : styles.button
            }
          >
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

  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '35px',
  },

  avatarContainer: {
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
  },

  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    background: '#F1F3FF',
    color: '#6366F1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: '900',
  },

  profileName: {
    margin: '0 0 5px 0',
    color: '#0B1A3F',
    fontSize: '24px',
    fontWeight: '900',
  },

  profileMajor: {
    margin: 0,
    color: '#667085',
    fontSize: '15px',
    fontWeight: '600',
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

  fileInput: {
    padding: '0.75rem',
    borderRadius: '10px',
    border: '1px solid #D1D5DB',
    fontSize: '0.95rem',
    color: '#111827',
    backgroundColor: '#fff',
    cursor: 'pointer',
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
    marginBottom: '15px',
  },

  successText: {
    color: '#16A34A',
    fontWeight: '700',
    marginBottom: '15px',
  },

  hint: {
    color: '#A3AED0',
    fontWeight: '700',
    fontSize: '12px',
  },
};