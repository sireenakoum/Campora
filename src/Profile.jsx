import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pencil,
  BadgeCheck,
  GraduationCap,
  User,
  Calendar,
  LogOut,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { getProfile, updateProfile } from './lib/profiles';
import { signOut } from './lib/auth';
import PageShell, { SectionHeader, IconChip } from './components/luminous';

const PROFILE_CSS = `
  .page-shell.profile-page { max-width: 720px; }

  .profile-title { font-size: 30px; font-weight: 800; letter-spacing: -0.03em; margin: 0; color: var(--campora-text); }

  .profile-alert { font-size: 14px; font-weight: 700; padding: 12px 16px; border-radius: var(--radius-sm); }
  .profile-alert-error { color: var(--campora-urgent); background: var(--tone-error-soft); }
  .profile-alert-success { color: var(--tone-success); background: var(--tone-success-soft); }

  .profile-section { display: flex; flex-direction: column; gap: 16px; }

  .profile-identity { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; }
  .profile-avatar-wrap { position: relative; width: 128px; height: 128px; margin-bottom: 8px; }
  .profile-avatar-wrap:hover .profile-avatar { transform: scale(1.045); }
  .profile-avatar { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; box-shadow: var(--shadow-soft); background: var(--surface-container-high); transition: transform 0.25s ease; }
  .profile-avatar-placeholder { display: flex; align-items: center; justify-content: center; font-size: 46px; font-weight: 800; color: var(--campora-navy); }
  .profile-avatar-edit { position: absolute; right: 3px; bottom: 3px; width: 38px; height: 38px; border: none; border-radius: 50%; background: var(--campora-navy); color: var(--on-primary); display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 6px 18px rgba(0, 45, 98, 0.3); transition: transform 0.2s ease; }
  .profile-avatar-edit:hover { transform: scale(1.08); }

  .profile-name { margin: 0; font-size: 30px; font-weight: 800; letter-spacing: -0.03em; color: var(--campora-text); }
  .profile-degree { margin: 0; font-size: 16px; font-weight: 500; color: var(--campora-muted); }
  .profile-chip-row { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
  .profile-chip-neutral { background: var(--surface-container-high); color: var(--campora-body); }
  .profile-chip-active { background: var(--tone-success-soft); color: var(--tone-success); }

  .profile-onboard-card { display: flex; flex-direction: column; background: var(--surface-container-low); border-radius: var(--radius); padding: 8px; }
  .profile-onboard-row { display: flex; align-items: center; gap: 14px; width: 100%; padding: 14px; border: none; background: transparent; text-align: left; cursor: pointer; color: inherit; font: inherit; border-radius: 16px; transition: background 0.2s ease; }
  .profile-onboard-row + .profile-onboard-row { border-top: 1px solid var(--hairline); }
  .profile-onboard-row:hover { background: var(--surface-container-high); }
  .profile-onboard-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
  .profile-onboard-title { font-size: 15px; font-weight: 700; color: var(--campora-text); }
  .profile-onboard-desc { font-size: 13px; font-weight: 500; color: var(--campora-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .profile-onboard-chevron { color: var(--campora-muted); flex-shrink: 0; transition: color 0.2s ease; }
  .profile-onboard-row:hover .profile-onboard-chevron { color: var(--campora-navy); }
  .profile-pill-done { background: var(--tone-success-soft); color: var(--tone-success); white-space: nowrap; }

  .profile-courses { display: flex; flex-direction: column; gap: 12px; border-top: 1px solid var(--hairline); margin-top: 8px; padding: 16px 14px 10px; }
  .profile-courses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
  .profile-course-chip { background: var(--surface-container-highest); color: var(--campora-body); justify-content: center; }
  .profile-courses-empty { font-size: 14px; font-weight: 500; color: var(--campora-muted); }

  .profile-details-card { display: flex; flex-direction: column; gap: 20px; background: var(--surface-container-low); border-radius: var(--radius); padding: 20px; }
  .profile-details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
  .profile-detail-field { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
  .profile-detail-value { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 16px; border-radius: var(--radius-sm); background: var(--surface-container-lowest); border: 1px solid var(--hairline); color: var(--campora-text); font-size: 14px; font-weight: 600; }
  .profile-verified { color: var(--campora-navy); flex-shrink: 0; }
  .profile-edit-btn { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: none; background: transparent; color: var(--campora-navy); cursor: pointer; }

  .profile-form { display: flex; flex-direction: column; gap: 18px; border-top: 1px solid var(--hairline); padding-top: 20px; }
  .profile-form-group { display: flex; flex-direction: column; gap: 8px; }
  .profile-hint { margin: 0; font-size: 12px; font-weight: 600; color: var(--campora-muted); }
  .profile-input { height: 44px; width: 100%; padding: 0 16px; border: 1px solid var(--divider); border-radius: var(--radius-sm); background: var(--surface-container-lowest); color: var(--campora-text); font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; outline: none; }
  .profile-input:focus { border-color: var(--campora-navy); }
  .profile-file { width: 100%; padding: 10px 14px; border: 1px dashed var(--divider); border-radius: var(--radius-sm); background: var(--surface-container-lowest); color: var(--campora-muted); font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; }
  .profile-save { align-self: flex-start; min-width: 160px; }
`;

const s = {
  signOut: { display: 'flex', justifyContent: 'center' },
};

function DetailField({ label, value, icon: Icon }) {
  return (
    <div className="profile-detail-field">
      <span className="label-caps">{label}</span>
      <span className="profile-detail-value">
        {value || '—'}
        {Icon ? <Icon size={14} className="profile-verified" /> : null}
      </span>
    </div>
  );
}

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

  const [editing, setEditing] = useState(true);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProfileData() {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('User is not logged in.');
        }

        const { data, error } = await getProfile(user.id);

        if (error) {
          throw error;
        }

        if (data) {
          setFullName(data.name || '');
          setAvatarUrl(data.avatar_url || '');
          setAccountType(data.account_type || 'Student');
          setMajor(data.major || '');
          setYear(data.year || '');
          setGuestTitle(data.guest_title || '');
          setCoursesTaken(data.courses_taken || []);
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

    if (!file) {
      return;
    }

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
        const fileExtension =
          avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg';

        const fileName = `${user.id}/${Date.now()}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, {
            upsert: false,
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
      }

      const { error: updateError } = await updateProfile(user.id, {
        name: fullName,
        avatar_url: newAvatarUrl,
      });

      if (updateError) {
        throw updateError;
      }

      const {
        data: updatedProfile,
        error: profileError,
      } = await getProfile(user.id);

      if (profileError) {
        throw profileError;
      }

      if (updatedProfile) {
        setFullName(updatedProfile.name || '');
        setAvatarUrl(updatedProfile.avatar_url || '');
        setAccountType(updatedProfile.account_type || 'Student');
        setMajor(updatedProfile.major || '');
        setYear(updatedProfile.year || '');
        setGuestTitle(updatedProfile.guest_title || '');
        setCoursesTaken(updatedProfile.courses_taken || []);
      }

      setAvatarFile(null);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  const yearOrTitleLabel = accountType === 'Guest' ? 'Title' : 'Year';
  const yearOrTitleValue = accountType === 'Guest' ? guestTitle : year;

  return (
    <PageShell className="profile-page">
      <style>{PROFILE_CSS}</style>

      <h1 className="profile-title">Student Profile</h1>

      {error && <p className="profile-alert profile-alert-error">{error}</p>}
      {message && <p className="profile-alert profile-alert-success">{message}</p>}

      <div className="profile-identity">
        <div className="profile-avatar-wrap">
          {avatarUrl ? (
            <img src={avatarUrl} className="profile-avatar" alt="Profile" />
          ) : (
            <div className="profile-avatar profile-avatar-placeholder">
              {fullName ? fullName.charAt(0).toUpperCase() : '?'}
            </div>
          )}

          <button
            type="button"
            className="profile-avatar-edit"
            aria-label="Edit profile picture"
            onClick={() => fileInputRef.current?.click()}
          >
            <Pencil size={15} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            hidden
          />
        </div>

        <h1 className="profile-name">{fullName || 'Student'}</h1>
        <p className="profile-degree">{major || 'Student'}</p>

        <div className="profile-chip-row">
          <span className="pill profile-chip-neutral">{accountType || 'Student'}</span>
          <span className="pill profile-chip-active">
            <BadgeCheck size={14} fill="currentColor" />
            Active
          </span>
        </div>
      </div>

      <section className="profile-section">
        <SectionHeader title="Onboarding Information" />

        <div className="profile-onboard-card">
          {[
            { icon: User, tone: 'secondary', title: 'Account Type', desc: accountType || '—' },
            { icon: GraduationCap, tone: 'tertiary', title: 'Major', desc: major || '—' },
            { icon: Calendar, tone: 'error', title: yearOrTitleLabel, desc: yearOrTitleValue || '—' },
          ].map(({ icon, tone, title, desc }) => (
            <button
              key={title}
              type="button"
              className="profile-onboard-row"
              onClick={() => {}}
            >
              <IconChip icon={icon} tone={tone} size={18} />
              <span className="profile-onboard-text">
                <span className="profile-onboard-title">{title}</span>
                <span className="profile-onboard-desc">{desc}</span>
              </span>
              <span className="pill profile-pill-done">
                <CheckCircle2 size={13} />
                Completed
              </span>
              <ChevronRight size={18} className="profile-onboard-chevron" />
            </button>
          ))}

          <div className="profile-courses">
            <span className="label-caps">Courses Taken</span>
            {coursesTaken.length === 0 ? (
              <span className="profile-courses-empty">—</span>
            ) : (
              <div className="profile-courses-grid">
                {coursesTaken.map((course) => (
                  <span key={course} className="pill profile-course-chip">
                    {course}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="profile-section">
        <SectionHeader
          title="Personal Details"
          action={
            <button
              type="button"
              className="label-caps profile-edit-btn"
              onClick={() => setEditing((current) => !current)}
            >
              <Pencil size={13} />
              Edit
            </button>
          }
        />

        <div className="profile-details-card">
          <div className="profile-details-grid">
            <DetailField label="Full Name" value={fullName} />
            <DetailField label="Preferred Name" value="" />
            <DetailField label="Email" value="" icon={CheckCircle2} />
            <DetailField label="Phone Number" value="" />
            <DetailField label="Date of Birth" value="" />
          </div>

          {editing && (
            <form onSubmit={handleUpdate} className="profile-form">
              <div className="profile-form-group">
                <label className="label-caps">Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="profile-file"
                />
                <p className="profile-hint">
                  JPG, PNG, or other image files up to 5MB.
                </p>
              </div>

              <div className="profile-form-group">
                <label className="label-caps">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="profile-input"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary profile-save"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          )}
        </div>
      </section>

      <div style={s.signOut}>
        <button type="button" className="btn btn-error" onClick={handleSignOut}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </PageShell>
  );
}