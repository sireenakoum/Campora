import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pencil,
  BadgeCheck,
  GraduationCap,
  User,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Upload,
  Trash2,
  FileText,
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { getProfile, updateProfile } from './lib/profiles';
import { signOut } from './lib/auth';
import { parseScheduleFile, expandScheduleEvents, importScheduleRows } from './lib/scheduleImport';
import PageShell from './components/luminous';

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
  .profile-avatar-edit { position: absolute; right: 3px; bottom: 3px; width: 38px; height: 38px; border: none; border-radius: 50%; background: var(--campora-navy-solid); color: var(--on-primary); display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 6px 18px rgba(0, 45, 98, 0.3); transition: transform 0.2s ease; }
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
  .profile-textarea { height: auto; min-height: 110px; padding: 12px 16px; resize: vertical; line-height: 1.5; }
  .profile-wordcount-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .profile-wordcount { font-size: 12px; font-weight: 600; color: var(--campora-muted); }
  .profile-wordcount-limit { color: var(--campora-urgent); }
  .profile-save { align-self: flex-start; min-width: 160px; }

  .profile-schedule-upload { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px 16px; border: 2px dashed var(--divider); border-radius: var(--radius-sm); background: var(--surface-container-lowest); cursor: pointer; color: var(--campora-muted); font-size: 13px; font-weight: 600; text-align: center; transition: border-color 0.2s ease, background 0.2s ease; }
  .profile-schedule-upload:hover { border-color: var(--campora-navy); }
  .profile-schedule-upload-active { border-color: var(--campora-navy); background: var(--tone-primary-soft); }
  .profile-schedule-upload-info { display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--campora-text); }
  .profile-schedule-upload-meta { font-size: 12px; color: var(--campora-muted); }
  .profile-schedule-remove { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border: none; border-radius: 6px; background: transparent; color: var(--campora-urgent); font-size: 12px; font-weight: 700; cursor: pointer; }
  .profile-schedule-remove:hover { background: var(--tone-error-soft); }

  .profile-signout-wrap { display: flex; justify-content: center; margin-top: 24px; }
  .profile-loading { display: flex; justify-content: center; align-items: center; min-height: 200px; font-size: 16px; font-weight: 600; color: var(--campora-muted); }
`;

const CLUB_POSITIONS = [
  'President',
  'Vice President',
  'Secretary',
  'Treasurer',
  'Member at Large',
  'Public Relations',
  'Events Coordinator',
  'Marketing Coordinator',
  'Social Media Coordinator',
  'Media/Design',
  'Other',
];

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
  const scheduleInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Class schedule upload
  const [scheduleFile, setScheduleFile] = useState(null);
  const [schedulePreview, setSchedulePreview] = useState(null);
  const [scheduleDragging, setScheduleDragging] = useState(false);

  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savedAvatarUrl, setSavedAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);

  const [accountType, setAccountType] = useState('Student');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('');
  const [guestTitle, setGuestTitle] = useState('');

  // Club information
  const [clubName, setClubName] = useState('');
  const [clubPosition, setClubPosition] = useState('');

  // About Me
  const [description, setDescription] = useState('');

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

          // Club information
          setClubName(data.club_name || '');
          setClubPosition(data.club_position || '');

          // About Me
          setDescription(data.description || '');
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

  const handleScheduleFileChange = async (file) => {
    if (!file) return;

    setError(null);
    setMessage(null);

    try {
      const events = await parseScheduleFile(file);

      if (!events.length) {
        setScheduleFile(null);
        setSchedulePreview(null);
        setError(
          'No events were found in that file. Please try a .pdf, .ics or .csv file.'
        );
        return;
      }

      const rows = expandScheduleEvents(events);
      setScheduleFile(file);
      setSchedulePreview({ events: events.length, entries: rows.length });
    } catch (err) {
      setScheduleFile(null);
      setSchedulePreview(null);
      setError(
        err?.message || 'Could not read that file. Please try another one.'
      );
    }
  };

  const removeScheduleFile = (e) => {
    e?.stopPropagation?.();
    setScheduleFile(null);
    setSchedulePreview(null);
    setError(null);
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

  const handleDescriptionChange = (e) => {
    const value = e.target.value;

    const words = value.trim()
      ? value.trim().split(/\s+/)
      : [];

    if (words.length <= 200) {
      setDescription(value);
      setError(null);
    } else {
      setError(
        'Your description cannot exceed 200 words.'
      );
    }

    setMessage(null);
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
      const cleanedClubName = clubName.trim();
      const cleanedDescription = description.trim();

      if (!cleanedName) {
        throw new Error('Please enter your full name.');
      }

      if (accountType !== 'Guest' && !year) {
        throw new Error('Please select your year.');
      }

      const wordCount = cleanedDescription
        ? cleanedDescription.split(/\s+/).length
        : 0;

      if (wordCount > 200) {
        throw new Error(
          'Your description must be 200 words or less.'
        );
      }

      let newAvatarUrl = savedAvatarUrl;

      // Upload new profile picture
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

      // Save profile
      const { error: updateError } = await updateProfile(user.id, {
        name: cleanedName,
        avatar_url: newAvatarUrl,
        year: accountType === 'Guest' ? null : year,
        description: cleanedDescription,

        // Club information
        club_name: cleanedClubName,
        club_position: clubPosition,
      });

      if (updateError) throw updateError;

      // Delete old avatar
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

      // Reload updated profile
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

        // Club information
        setClubName(updatedProfile.club_name || '');
        setClubPosition(updatedProfile.club_position || '');

        // About Me
        setDescription(updatedProfile.description || '');
      }

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }

      setAvatarFile(null);

      // Add uploaded class schedule to the Planner
      if (scheduleFile) {
        const events = await parseScheduleFile(scheduleFile);
        const rows = expandScheduleEvents(events);

        const { error: importError } = await importScheduleRows({
          userId: user.id,
          rows,
        });

        if (importError) {
          throw new Error(
            `Your profile was saved, but your schedule could not be added to Planner: ${importError.message}`
          );
        }

        setScheduleFile(null);
        setSchedulePreview(null);
      }

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

  const descriptionWordCount = description.trim()
    ? description.trim().split(/\s+/).length
    : 0;

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

          <div className="profile-onboard-row">
            <div className="profile-onboard-text">
              <span className="profile-onboard-title">Club</span>
              <span className="profile-onboard-desc">
                {clubName || 'Not specified'}
                {clubName && clubPosition ? ` • ${clubPosition}` : ''}
              </span>
            </div>
            <span className="pill profile-pill-done">
              <CheckCircle2 size={13} />
              {clubName ? 'Joined' : 'Optional'}
            </span>
            <ChevronRight size={18} className="profile-onboard-chevron" />
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
              <DetailField
                label="Club"
                value={
                  clubName
                    ? clubPosition
                      ? `${clubName} • ${clubPosition}`
                      : clubName
                    : '—'
                }
              />
              <DetailField
                label="About Me"
                value={description || '—'}
              />
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

              <div className="profile-form-group">
                <label className="label-caps" htmlFor="clubName">
                  Club Name
                </label>
                <input
                  id="clubName"
                  type="text"
                  className="profile-input"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="Enter the club name"
                />
              </div>

              <div className="profile-form-group">
                <label className="label-caps" htmlFor="clubPosition">
                  Club Position
                </label>
                <select
                  id="clubPosition"
                  className="profile-input"
                  value={clubPosition}
                  onChange={(e) => setClubPosition(e.target.value)}
                >
                  <option value="">Select your position</option>
                  {CLUB_POSITIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="profile-form-group">
                <label className="label-caps" htmlFor="aboutMe">
                  About Me
                </label>
                <textarea
                  id="aboutMe"
                  className="profile-input profile-textarea"
                  value={description}
                  onChange={handleDescriptionChange}
                  placeholder="Tell others a little about yourself..."
                />
                <div className="profile-wordcount-row">
                  <span className="profile-hint">
                    Maximum 200 words.
                  </span>
                  <span
                    className={
                      descriptionWordCount >= 200
                        ? 'profile-wordcount profile-wordcount-limit'
                        : 'profile-wordcount'
                    }
                  >
                    {descriptionWordCount}/200 words
                  </span>
                </div>
              </div>

              <div className="profile-form-group">
                <label className="label-caps" htmlFor="classSchedule">
                  Class Schedule
                </label>
                <div
                  id="classSchedule"
                  className={
                    scheduleDragging
                      ? 'profile-schedule-upload profile-schedule-upload-active'
                      : 'profile-schedule-upload'
                  }
                  onClick={() => scheduleInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setScheduleDragging(true);
                  }}
                  onDragLeave={() => setScheduleDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setScheduleDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleScheduleFileChange(file);
                  }}
                >
                  {scheduleFile && schedulePreview ? (
                    <div className="profile-schedule-upload-info">
                      <FileText size={18} />
                      <span>{scheduleFile.name}</span>
                      <span className="profile-schedule-upload-meta">
                        {schedulePreview.events}{' '}
                        event{schedulePreview.events === 1 ? '' : 's'} →{' '}
                        {schedulePreview.entries}{' '}
                        Planner entr{schedulePreview.entries === 1 ? 'y' : 'ies'}{' '}
                        on save
                      </span>
                      <button
                        type="button"
                        className="profile-schedule-remove"
                        onClick={removeScheduleFile}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload size={20} />
                      <span>
                        Upload a .pdf, .ics or .csv schedule — it will be added to
                        your Planner automatically
                      </span>
                    </>
                  )}
                </div>
                <input
                  ref={scheduleInputRef}
                  type="file"
                  accept=".pdf,.ics,.csv,application/pdf,text/calendar,text/csv"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleScheduleFileChange(file);
                    e.target.value = '';
                  }}
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
