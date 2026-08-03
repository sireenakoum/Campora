import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { getProfile, updateProfile } from './lib/profiles';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
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
            setFullName(data.full_name || '');
            setAvatarUrl(data.avatar_url || '');
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
      full_name: fullName,
      avatar_url: avatarUrl,
      updated_at: new Date()
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Profile updated successfully!');
    }
    setSaving(false);
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div className="profile-container">
      <h2>Student Profile</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <form onSubmit={handleUpdate}>
        <div>
          <label>Full Name</label>
          <input 
            type="text" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
          />
        </div>

        <div>
          <label>Avatar URL</label>
          <input 
            type="text" 
            value={avatarUrl} 
            onChange={(e) => setAvatarUrl(e.target.value)} 
            placeholder="https://example.com/photo.jpg"
          />
        </div>

        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
