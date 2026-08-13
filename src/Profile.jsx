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

  .profile-signout-wrap { display: flex; justify-content: center; margin-top: 24px; }
  .profile-loading { display: flex; justify-content: center; align-items: center; min-height: 200px; font-size: 16px; font-weight: 600; color: var(--campora-muted); }
`;

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
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);
  const previewUrlRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savedAvatarUrl, setSavedAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);

  const [accountType, setAccountType] = useState('Student');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('');
  const [guestTitle, setGuestTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coursesTaken, setCoursesTaken] = useState([]);

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProfileData() {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error('User is not logged in.');

        const { data, error: profileError } = await getProfile(user.id);

        if (profileError) throw profileError;

        if (data) {
          setFullName(data.name || '');
          setAvatarUrl(data.avatar_url || '');
          setSavedAvatarUrl(data.avatar_url || '');
          setAccountType(data.account_type || 'Student');
          setMajor(data.major || '');
          setYear(data.year || '');
          setGuestTitle(data.guest_title || '');
          setDescription(data.description || '');
          setCoursesTaken(data.courses_taken || []);
        }
      } catch (err) {
        console.error('Profile loading error:', err);
        setError(
          err?.message ||
            'Something went wrong while loading your profile.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();

    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setError(null);
    setMessage(null);

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      e.target.value = '';
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;

    setAvatarFile(file);
    setAvatarUrl(previewUrl);
  };

  const getAvatarPathFromUrl = (url) => {
    if (!url) return null;

    try {
      const marker = '/storage/v1/object/public/avatars/';
      const markerIndex = url.indexOf(marker);

      if (markerIndex === -1) return null;

      const path = url.substring(markerIndex + marker.length);
      return decodeURIComponent(path.split('?')[0]);
    } catch (err) {
      console.error('Avatar path parsing error:', err);
      return null;
    }
  };

  const getYearOptions = () => {
    if (major.toLowerCase().includes('engineering')) {
      return [
        'Freshman',
        'Sophomore',
        'Junior',
        'E3 - Senior',
        'E4 - Senior',
        'Masters',
        'Ph.D',
      ];
    }

    if (major.toLowerCase().includes('medicine')) {
      return [
        'Freshman',
        'Sophomore',
        'Junior',
        'Senior',
        'M1',
        'M2',
        'M3',
        'M4',
      ];
    }

    return [
      'Freshman',
      'Sophomore',
      'Junior',
      'Senior',
      'Masters',
      'Ph.D',
    ];
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
      setError('Failed to sign out. Please try again.');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (saving) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    let uploadedAvatarPath = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error('User is not logged in.');

      const cleanedName = fullName.trim();
      const cleanedDescription = description.trim();

      if (!cleanedName) {
        throw new Error('Please enter your full name.');
      }

      if (accountType !== 'Guest' && !year) {
        throw new Error('Please select your year.');
      }

      let newAvatarUrl = savedAvatarUrl;

      if (avatarFile) {
        const originalExtension =
          avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg';

        const safeExtension =
          originalExtension === 'jpeg' ? 'jpg' : originalExtension;

        const fileName = `${user.id}/${Date.now()}.${safeExtension}`;
        uploadedAvatarPath = fileName;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: avatarFile.type,
          });

        if (uploadError) {
          throw new Error(
            uploadError.message ||
              'Could not upload your profile picture.'
          );
        }

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        if (!publicUrlData?.publicUrl) {
          throw new Error(
            'The profile picture uploaded, but its URL could not be created.'
          );
        }

        newAvatarUrl = publicUrlData.publicUrl;
      }

      const { error: updateError } = await updateProfile(user.id, {
        name: cleanedName,
        avatar_url: newAvatarUrl,
        year: accountType === 'Guest' ? null : year,
        description: cleanedDescription,
      });

      if (updateError) throw updateError;

      if (
        avatarFile &&
        savedAvatarUrl &&
        newAvatarUrl !== savedAvatarUrl
      ) {
        const oldAvatarPath = getAvatarPathFromUrl(savedAvatarUrl);

        if (oldAvatarPath && oldAvatarPath.startsWith(`${user.id}/`)) {
          await supabase.storage
            .from('avatars')
            .remove([oldAvatarPath]);
        }
      }

      const {
        data: updatedProfile,
        error: profileError,
      } = await getProfile(user.id);

      if (profileError) throw profileError;

      if (updatedProfile) {
        setFullName(updatedProfile.name || '');
        setAvatarUrl(updatedProfile.avatar_url || '');
        setSavedAvatarUrl(updatedProfile.avatar_url || '');
        setAccountType(updatedProfile.account_type || 'Student');
        setMajor(updatedProfile.major || '');
        setYear(updatedProfile.year || '');
        setGuestTitle(updatedProfile.guest_title || '');
        setDescription(updatedProfile.description || '');
        setCoursesTaken(updatedProfile.courses_taken || []);
      }

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }

      setAvatarFile(null);
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Profile update error:', err);

      if (uploadedAvatarPath) {
        await supabase.storage
          .from('avatars')
          .remove([uploadedAvatarPath]);
      }

      setError(
        err?.message ||
          'Something went wrong while updating your profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageShell className="profile-page">
        <style>{PROFILE_CSS}</style>
        <div className="profile-loading">Loading profile...</div>
      </PageShell>
    );
  }

  const onboardingSteps = [
    {
      title: 'Account Type',
      desc: accountType,
    },
    {
      title: 'Major',
      desc: major || 'Not specified',
    },
  ];

  return (
    <PageShell className="profile-page">
      <style>{PROFILE_CSS}</style>

      {error && (
        <div className="profile-alert profile-alert-error">{error}</div>
      )}
      {message && (
        <div className="profile-alert profile-alert-success">{message}</div>
      )}

      {/* Identity Section */}
      <section className="profile-section profile-identity">
        <div className="profile-avatar-wrap">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName}
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar profile-avatar-placeholder">
              {fullName ? fullName.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          <button
            type="button"
            className="profile-avatar-edit"
            onClick={() => avatarInputRef.current?.click()}
            title="Change Profile Picture"
          >
            <Pencil size={18} />
          </button>
          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>

        <h1 className="profile-name">{fullName || 'Student'}</h1>
        <p className="profile-degree">
          {accountType === 'Guest'
            ? guestTitle || 'Guest'
            : `${major || 'Undeclared'} • ${year || 'Student'}`}
        </p>

        <div className="profile-chip-row">
          <span className="pill profile-chip-neutral">
            <User size={13} />
            {accountType}
          </span>
          <span className="pill profile-chip-active">
            <BadgeCheck size={13} />
            Verified Student
          </span>
        </div>
      </section>

      {/* Onboarding Summary Card */}
      <section className="profile-section">
        <div className="profile-onboard-card">
          {onboardingSteps.map((step) => (
            <div key={step.title} className="profile-onboard-row">
              <div className="profile-onboard-text">
                <span className="profile-onboard-title">{step.title}</span>
                <span className="profile-onboard-desc">{step.desc}</span>
              </div>
              <span className="pill profile-pill-done">
                <CheckCircle2 size={13} />
                Completed
              </span>
              <ChevronRight size={18} className="profile-onboard-chevron" />
            </div>
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

      {/* Details & Edit Form Section */}
      <section className="profile-section">
        <div className="profile-details-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span className="label-caps">Academic Details</span>
            <button
              type="button"
              className="profile-edit-btn"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Pencil size={14} />
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>

          {!isEditing ? (
            <div className="profile-details-grid">
              <DetailField
                label="Full Name"
                value={fullName}
                icon={BadgeCheck}
              />
              {accountType !== 'Guest' && (
                <DetailField
                  label="Academic Year"
                  value={year}
                  icon={GraduationCap}
                />
              )}
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="profile-form">
              <div className="profile-form-group">
                <label className="label-caps" htmlFor="fullName">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  className="profile-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              {accountType !== 'Guest' && (
                <div className="profile-form-group">
                  <label className="label-caps" htmlFor="academicYear">
                    Academic Year
                  </label>
                  <select
                    id="academicYear"
                    className="profile-input"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  >
                    <option value="">Select Year</option>
                    {getYearOptions().map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

      {/* Sign Out Button */}
      <div className="profile-signout-wrap">
        <button
          type="button"
          className="btn btn-error"
          onClick={handleSignOut}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </PageShell>
  );
}