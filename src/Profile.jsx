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

  const [clubName, setClubName] = useState('');
  const [clubPosition, setClubPosition] = useState('');

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

        if (!user) {
          throw new Error('User is not logged in.');
        }

        const { data, error: profileError } =
          await getProfile(user.id);

        if (profileError) throw profileError;

        if (data) {
          setFullName(data.name || '');
          setAvatarUrl(data.avatar_url || '');
          setSavedAvatarUrl(data.avatar_url || '');

          setAccountType(
            data.account_type || 'Student'
          );

          // Major stays under the student's name
          setMajor(data.major || '');

          setYear(data.year || '');
          setGuestTitle(data.guest_title || '');

          // Club information
          setClubName(data.club_name || '');
          setClubPosition(data.club_position || '');

          // About Me
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
      const marker =
        '/storage/v1/object/public/avatars/';

      const markerIndex = url.indexOf(marker);

      if (markerIndex === -1) {
        return null;
      }

<<<<<<< HEAD
      const path = url.substring(
        markerIndex + marker.length
      );

      return decodeURIComponent(
        path.split('?')[0]
      );
=======
      const path = url.substring(markerIndex + marker.length);
      return decodeURIComponent(path.split('?')[0]);
>>>>>>> 979f9570c5c04824626119d37130ac889dcfcf28
    } catch (err) {
      console.error(
        'Avatar path parsing error:',
        err
      );

      return null;
    }
  };

<<<<<<< HEAD
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
=======
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
>>>>>>> 979f9570c5c04824626119d37130ac889dcfcf28
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

      if (!user) {
        throw new Error('User is not logged in.');
      }

      const cleanedName = fullName.trim();
      const cleanedClubName = clubName.trim();
      const cleanedDescription = description.trim();

      if (!cleanedName) {
        throw new Error(
          'Please enter your full name.'
        );
      }

      if (
        accountType !== 'Guest' &&
        !year
      ) {
        throw new Error(
          'Please select your year.'
        );
      }

      let newAvatarUrl = savedAvatarUrl;

      // Upload new profile picture
      if (avatarFile) {
        const originalExtension =
          avatarFile.name
            .split('.')
            .pop()
            ?.toLowerCase() || 'jpg';

        const safeExtension =
          originalExtension === 'jpeg' ? 'jpg' : originalExtension;

        const fileName = `${user.id}/${Date.now()}.${safeExtension}`;
        uploadedAvatarPath = fileName;

        const {
          error: uploadError,
        } = await supabase.storage
          .from('avatars')
          .upload(
            fileName,
            avatarFile,
            {
              cacheControl: '3600',
              upsert: false,
              contentType: avatarFile.type,
            }
          );

        if (uploadError) {
          throw new Error(
            uploadError.message ||
              'Could not upload your profile picture.'
          );
        }

        const {
          data: publicUrlData,
        } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        if (!publicUrlData?.publicUrl) {
          throw new Error(
            'The profile picture uploaded, but its URL could not be created.'
          );
        }

        newAvatarUrl =
          publicUrlData.publicUrl;
      }

      // Save profile
      const {
        error: updateError,
      } = await updateProfile(user.id, {
        name: cleanedName,
        avatar_url: newAvatarUrl,
        year:
          accountType === 'Guest'
            ? null
            : year,
        description: cleanedDescription,

        // Club information
        club_name: cleanedClubName,
        club_position: clubPosition,
      });

      if (updateError) {
        throw updateError;
      }

      // Delete old avatar
      if (
        avatarFile &&
        savedAvatarUrl &&
        newAvatarUrl !== savedAvatarUrl
      ) {
<<<<<<< HEAD
        const oldAvatarPath =
          getAvatarPathFromUrl(
            savedAvatarUrl
          );

        if (
          oldAvatarPath &&
          oldAvatarPath.startsWith(
            `${user.id}/`
          )
        ) {
=======
        const oldAvatarPath = getAvatarPathFromUrl(savedAvatarUrl);

        if (oldAvatarPath && oldAvatarPath.startsWith(`${user.id}/`)) {
>>>>>>> 979f9570c5c04824626119d37130ac889dcfcf28
          await supabase.storage
            .from('avatars')
            .remove([
              oldAvatarPath,
            ]);
        }
      }

      // Reload updated profile
      const {
        data: updatedProfile,
        error: profileError,
      } = await getProfile(user.id);

      if (profileError) {
        throw profileError;
      }

      if (updatedProfile) {
<<<<<<< HEAD
        setFullName(
          updatedProfile.name || ''
        );

        setAvatarUrl(
          updatedProfile.avatar_url || ''
        );

        setSavedAvatarUrl(
          updatedProfile.avatar_url || ''
        );

        setAccountType(
          updatedProfile.account_type ||
            'Student'
        );

        setMajor(
          updatedProfile.major || ''
        );

        setYear(
          updatedProfile.year || ''
        );

        setGuestTitle(
          updatedProfile.guest_title || ''
        );

        setClubName(
          updatedProfile.club_name || ''
        );

        setClubPosition(
          updatedProfile.club_position || ''
        );

        setDescription(
          updatedProfile.description || ''
        );
=======
        setFullName(updatedProfile.name || '');
        setAvatarUrl(updatedProfile.avatar_url || '');
        setSavedAvatarUrl(updatedProfile.avatar_url || '');
        setAccountType(updatedProfile.account_type || 'Student');
        setMajor(updatedProfile.major || '');
        setYear(updatedProfile.year || '');
        setGuestTitle(updatedProfile.guest_title || '');
        setDescription(updatedProfile.description || '');
        setCoursesTaken(updatedProfile.courses_taken || []);
>>>>>>> 979f9570c5c04824626119d37130ac889dcfcf28
      }

      if (previewUrlRef.current) {
        URL.revokeObjectURL(
          previewUrlRef.current
        );

        previewUrlRef.current = null;
      }

      setAvatarFile(null);
<<<<<<< HEAD

      setMessage(
        'Profile updated successfully!'
      );
=======
      setMessage('Profile updated successfully!');
      setIsEditing(false);
>>>>>>> 979f9570c5c04824626119d37130ac889dcfcf28
    } catch (err) {
      console.error(
        'Profile update error:',
        err
      );

      if (uploadedAvatarPath) {
        await supabase.storage
          .from('avatars')
          .remove([
            uploadedAvatarPath,
          ]);
      }

      setError(
        err?.message ||
          'Something went wrong while updating your profile.'
      );
    } finally {
      setSaving(false);
    }
  };

<<<<<<< HEAD
  const handleCancelAvatar = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(
        previewUrlRef.current
      );

      previewUrlRef.current = null;
    }

    setAvatarFile(null);
    setAvatarUrl(savedAvatarUrl);
    setError(null);
    setMessage(null);
  };

=======
>>>>>>> 979f9570c5c04824626119d37130ac889dcfcf28
  if (loading) {
    return (
      <PageShell className="profile-page">
        <style>{PROFILE_CSS}</style>
        <div className="profile-loading">Loading profile...</div>
      </PageShell>
    );
  }

<<<<<<< HEAD
  const descriptionWordCount =
    description.trim()
      ? description.trim().split(/\s+/).length
      : 0;

  return (
    <div style={styles.wrapper}>

      <h1 style={styles.title}>
        Student Profile
      </h1>
=======
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
>>>>>>> 979f9570c5c04824626119d37130ac889dcfcf28

      {error && (
        <div className="profile-alert profile-alert-error">{error}</div>
      )}
      {message && (
        <div className="profile-alert profile-alert-success">{message}</div>
      )}

<<<<<<< HEAD
      <div style={styles.card}>

        {/* =========================
            PROFILE HEADER
        ========================== */}

        <div style={styles.profileHeader}>

          <div style={styles.avatarContainer}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                style={styles.avatar}
              />
            ) : (
              <div
                style={
                  styles.avatarPlaceholder
                }
              >
                {fullName
                  ? fullName
                      .charAt(0)
                      .toUpperCase()
                  : '?'}
              </div>
            )}
          </div>

          <div style={styles.headerText}>

            {/* STUDENT NAME */}

            <h2 style={styles.profileName}>
              {fullName || 'Student'}
            </h2>

            {/* MAJOR */}

            {major && (
              <p style={styles.profileMajor}>
                {major}
              </p>
            )}

            {/* ABOUT ME */}

            {description && (
              <p style={styles.aboutMe}>
                {description}
              </p>
            )}

          </div>
        </div>

        {/* =========================
            ONBOARDING INFORMATION
        ========================== */}

        <div style={styles.section}>

          <p style={styles.sectionLabel}>
            Onboarding Information
          </p>

          <div style={styles.infoGrid}>

            {/* ACCOUNT TYPE */}

            <div style={styles.infoItem}>

              <span style={styles.infoKey}>
                Account Type
              </span>

              <span style={styles.infoValue}>
                {accountType}
              </span>

            </div>

            {/* CLUB */}

            <div style={styles.infoItem}>

              <span style={styles.infoKey}>
                Club
              </span>

              <span style={styles.infoValue}>
                {clubName || '—'}
              </span>

              {clubPosition && (
                <span style={styles.clubPosition}>
                  {clubPosition}
                </span>
              )}

            </div>

            {/* YEAR / TITLE */}

            {accountType === 'Guest' ? (

              <div style={styles.infoItem}>

                <span style={styles.infoKey}>
                  Title
                </span>

                <span style={styles.infoValue}>
                  {guestTitle || '—'}
                </span>

              </div>

            ) : (

              <div style={styles.infoItem}>

                <span style={styles.infoKey}>
                  Year
                </span>

                <span style={styles.infoValue}>
                  {year || '—'}
                </span>

              </div>

            )}

          </div>
        </div>

        <div style={styles.divider} />

        {/* =========================
            PERSONAL DETAILS
        ========================== */}

        <form
          onSubmit={handleUpdate}
          style={styles.form}
        >

          <p style={styles.sectionLabel}>
            Personal Details
          </p>

          {/* PROFILE PICTURE */}

          <div style={styles.inputGroup}>

            <label style={styles.label}>
              Profile Picture
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarChange}
              disabled={saving}
              style={styles.fileInput}
            />

            <span style={styles.hint}>
              JPG, PNG, WEBP or GIF up to 5MB.
            </span>

            {avatarFile && (
              <div style={styles.selectedFileRow}>

                <span style={styles.selectedFileText}>
                  Selected: {avatarFile.name}
                </span>

                <button
                  type="button"
                  onClick={handleCancelAvatar}
                  disabled={saving}
                  style={
                    styles.removeSelectionButton
                  }
                >
                  Cancel
                </button>

              </div>
            )}

          </div>

          {/* FULL NAME */}

          <div style={styles.inputGroup}>

            <label style={styles.label}>
              Full Name
            </label>

            <input
              type="text"
              value={fullName}
              onChange={(e) =>
                setFullName(
                  e.target.value
                )
              }
              disabled={saving}
              placeholder="Enter your full name"
              style={styles.input}
            />

          </div>

          {/* YEAR */}

          {accountType !== 'Guest' && (
            <div style={styles.inputGroup}>

              <label style={styles.label}>
                Year
              </label>

              <select
                value={year}
                onChange={(e) =>
                  setYear(
                    e.target.value
                  )
                }
                disabled={saving}
                style={styles.input}
              >

                <option value="">
                  Select your year
                </option>

                <option value="Freshman">
                  Freshman
                </option>

                <option value="Sophomore">
                  Sophomore
                </option>

                <option value="Junior">
                  Junior
                </option>

                <option value="Senior">
                  Senior
                </option>

                <option value="Masters">
                  Masters
                </option>

                <option value="Ph.D">
                  Ph.D
                </option>

              </select>

=======
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
>>>>>>> 979f9570c5c04824626119d37130ac889dcfcf28
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

<<<<<<< HEAD
          {/* CLUB NAME */}

          <div style={styles.inputGroup}>

            <label style={styles.label}>
              Club Name
            </label>

            <input
              type="text"
              value={clubName}
              onChange={(e) =>
                setClubName(
                  e.target.value
                )
              }
              disabled={saving}
              placeholder="Enter the club name"
              style={styles.input}
            />

          </div>

          {/* CLUB POSITION */}

          <div style={styles.inputGroup}>

            <label style={styles.label}>
              Club Position
            </label>

            <select
              value={clubPosition}
              onChange={(e) =>
                setClubPosition(
                  e.target.value
                )
              }
              disabled={saving}
              style={styles.input}
            >

              <option value="">
                Select your position
              </option>

              <option value="President">
                President
              </option>

              <option value="Vice President">
                Vice President
              </option>

              <option value="Secretary">
                Secretary
              </option>

              <option value="Treasurer">
                Treasurer
              </option>

              <option value="Member at Large">
                Member at Large
              </option>

              <option value="Public Relations">
                Public Relations
              </option>

              <option value="Events Coordinator">
                Events Coordinator
              </option>

              <option value="Marketing Coordinator">
                Marketing Coordinator
              </option>

              <option value="Social Media Coordinator">
                Social Media Coordinator
              </option>

              <option value="Media/Design">
                Media/Design
              </option>

              <option value="Other">
                Other
              </option>

            </select>

          </div>

          {/* ABOUT ME */}

          <div style={styles.inputGroup}>

            <label style={styles.label}>
              About Me
            </label>

            <textarea
              value={description}
              onChange={
                handleDescriptionChange
              }
              disabled={saving}
              placeholder="Tell others a little about yourself..."
              style={styles.textarea}
            />

            <div
              style={
                styles.descriptionFooter
              }
            >

              <span style={styles.hint}>
                Maximum 200 words.
              </span>

              <span
                style={
                  descriptionWordCount >= 200
                    ? styles.wordCountLimit
                    : styles.wordCount
                }
              >
                {descriptionWordCount}/200
                words
              </span>

            </div>

          </div>

          {/* SAVE */}

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
            {saving
              ? 'Saving...'
              : 'Save Profile'}
          </button>

        </form>
=======
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
>>>>>>> 979f9570c5c04824626119d37130ac889dcfcf28
      </div>
    </PageShell>
  );
<<<<<<< HEAD
}

const styles = {
  wrapper: {
    width: '100%',
    maxWidth: '720px',
  },

  loading: {
    color: '#0B1A3F',
    fontSize: '16px',
    fontWeight: '700',
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
    boxShadow:
      '0 15px 30px rgba(0,0,0,0.04)',
    border: '1px solid #F1F5F9',
  },

  profileHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
    marginBottom: '35px',
  },

  headerText: {
    minWidth: 0,
    flex: 1,
  },

  avatarContainer: {
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    border: '3px solid #F1F5F9',
    backgroundColor: '#F8FAFC',
  },

  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
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
    wordBreak: 'break-word',
  },

  // Major directly underneath the name
  profileMajor: {
    margin: '0',
    color: '#667085',
    fontSize: '15px',
    fontWeight: '600',
    lineHeight: '1.4',
    wordBreak: 'break-word',
  },

  // About Me underneath the major
  aboutMe: {
    margin: '10px 0 0 0',
    color: '#98A2B3',
    fontSize: '14px',
    fontWeight: '500',
    lineHeight: '1.5',
    maxWidth: '500px',
    wordBreak: 'break-word',
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
    gridTemplateColumns:
      'repeat(auto-fit, minmax(180px, 1fr))',
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
    wordBreak: 'break-word',
  },

  clubPosition: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#667085',
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
    boxSizing: 'border-box',
    width: '100%',
  },

  textarea: {
    padding: '0.9rem 1.25rem',
    borderRadius: '10px',
    border: '1px solid #D1D5DB',
    fontSize: '1rem',
    color: '#111827',
    outline: 'none',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    width: '100%',
    minHeight: '130px',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.5',
  },

  fileInput: {
    padding: '0.75rem',
    borderRadius: '10px',
    border: '1px solid #D1D5DB',
    fontSize: '0.95rem',
    color: '#111827',
    backgroundColor: '#fff',
    cursor: 'pointer',
    boxSizing: 'border-box',
    width: '100%',
  },

  hint: {
    color: '#A3AED0',
    fontWeight: '700',
    fontSize: '12px',
  },

  descriptionFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
  },

  wordCount: {
    color: '#667085',
    fontSize: '12px',
    fontWeight: '700',
  },

  wordCountLimit: {
    color: '#DC2626',
    fontSize: '12px',
    fontWeight: '800',
  },

  selectedFileRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '4px',
  },

  selectedFileText: {
    color: '#667085',
    fontSize: '12px',
    fontWeight: '700',
  },

  removeSelectionButton: {
    border: 'none',
    background: 'transparent',
    padding: 0,
    color: '#DC2626',
    fontSize: '12px',
    fontWeight: '800',
    cursor: 'pointer',
  },

  button: {
    backgroundColor: '#0B1A3F',
    color: '#FFFFFF',
    padding: '1rem 2rem',
    borderRadius: '12px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    alignSelf: 'flex-start',
  },

  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    cursor: 'not-allowed',
  },

  errorBox: {
    color: '#B42318',
    fontWeight: '700',
    marginBottom: '15px',
    padding: '12px 15px',
    borderRadius: '10px',
    backgroundColor: '#FEF3F2',
    border: '1px solid #FECDCA',
    fontSize: '14px',
  },

  successBox: {
    color: '#067647',
    fontWeight: '700',
    marginBottom: '15px',
    padding: '12px 15px',
    borderRadius: '10px',
    backgroundColor: '#ECFDF3',
    border: '1px solid #ABEFC6',
    fontSize: '14px',
  },
};
=======
}
>>>>>>> 979f9570c5c04824626119d37130ac889dcfcf28
