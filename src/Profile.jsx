import { useEffect, useRef, useState } from 'react';
import { supabase } from './lib/supabase';
import { getProfile, updateProfile } from './lib/profiles';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const previewUrlRef = useRef(null);

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

          setAvatarUrl(
            data.avatar_url || ''
          );

          setSavedAvatarUrl(
            data.avatar_url || ''
          );

          setAccountType(
            data.account_type || 'Student'
          );

          // Major stays under the student's name
          setMajor(data.major || '');

          setYear(data.year || '');

          setGuestTitle(
            data.guest_title || ''
          );

          // Club information
          setClubName(
            data.club_name || ''
          );

          setClubPosition(
            data.club_position || ''
          );

          // About Me
          setDescription(
            data.description || ''
          );
        }
      } catch (err) {
        console.error(
          'Profile loading error:',
          err
        );

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
        URL.revokeObjectURL(
          previewUrlRef.current
        );
      }
    };
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setError(null);
    setMessage(null);

    if (!file.type.startsWith('image/')) {
      setError(
        'Please select an image file.'
      );

      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        'Image must be smaller than 5MB.'
      );

      e.target.value = '';
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(
        previewUrlRef.current
      );
    }

    const previewUrl =
      URL.createObjectURL(file);

    previewUrlRef.current = previewUrl;

    setAvatarFile(file);
    setAvatarUrl(previewUrl);
  };

  const getAvatarPathFromUrl = (url) => {
    if (!url) return null;

    try {
      const marker =
        '/storage/v1/object/public/avatars/';

      const markerIndex =
        url.indexOf(marker);

      if (markerIndex === -1) {
        return null;
      }

      const path = url.substring(
        markerIndex + marker.length
      );

      return decodeURIComponent(
        path.split('?')[0]
      );
    } catch (err) {
      console.error(
        'Avatar path parsing error:',
        err
      );

      return null;
    }
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
        throw new Error(
          'User is not logged in.'
        );
      }

      const cleanedName =
        fullName.trim();

      const cleanedClubName =
        clubName.trim();

      const cleanedDescription =
        description.trim();

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

      const wordCount =
        cleanedDescription
          ? cleanedDescription.split(/\s+/)
              .length
          : 0;

      if (wordCount > 200) {
        throw new Error(
          'Your description must be 200 words or less.'
        );
      }

      let newAvatarUrl =
        savedAvatarUrl;

      // Upload new profile picture
      if (avatarFile) {
        const originalExtension =
          avatarFile.name
            .split('.')
            .pop()
            ?.toLowerCase() || 'jpg';

        const safeExtension =
          originalExtension === 'jpeg'
            ? 'jpg'
            : originalExtension;

        const fileName =
          `${user.id}/${Date.now()}.${safeExtension}`;

        uploadedAvatarPath =
          fileName;

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
              contentType:
                avatarFile.type,
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

        if (
          !publicUrlData?.publicUrl
        ) {
          throw new Error(
            'The profile picture uploaded, but its URL could not be created.'
          );
        }

        newAvatarUrl =
          publicUrlData.publicUrl;
      }

      // Update profile
      const {
        error: updateError,
      } = await updateProfile(
        user.id,
        {
          name: cleanedName,
          avatar_url: newAvatarUrl,

          year:
            accountType === 'Guest'
              ? null
              : year,

          description:
            cleanedDescription,

          club_name:
            cleanedClubName,

          club_position:
            clubPosition,
        }
      );

      if (updateError) {
        throw updateError;
      }

      // Delete old avatar
      if (
        avatarFile &&
        savedAvatarUrl &&
        newAvatarUrl !==
          savedAvatarUrl
      ) {
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
          await supabase.storage
            .from('avatars')
            .remove([
              oldAvatarPath,
            ]);
        }
      }

      // Reload profile
      const {
        data: updatedProfile,
        error: profileError,
      } = await getProfile(user.id);

      if (profileError) {
        throw profileError;
      }

      if (updatedProfile) {
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
          updatedProfile.club_position ||
            ''
        );

        setDescription(
          updatedProfile.description || ''
        );
      }

      if (previewUrlRef.current) {
        URL.revokeObjectURL(
          previewUrlRef.current
        );

        previewUrlRef.current = null;
      }

      setAvatarFile(null);

      setMessage(
        'Profile updated successfully!'
      );
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

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading profile...
      </div>
    );
  }

  const descriptionWordCount =
    description.trim()
      ? description.trim().split(/\s+/)
          .length
      : 0;

  return (
    <div style={styles.wrapper}>

      <h1 style={styles.title}>
        Student Profile
      </h1>

      {error && (
        <div style={styles.errorBox}>
          {error}
        </div>
      )}

      {message && (
        <div style={styles.successBox}>
          {message}
        </div>
      )}

      <div style={styles.card}>

        {/* PROFILE HEADER */}

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

            {/* NAME */}

            <h2 style={styles.profileName}>
              {fullName || 'Student'}
            </h2>

            {/* MAJOR */}

            {major && (
              <p
                style={
                  styles.profileMajor
                }
              >
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

        {/* ONBOARDING INFORMATION */}

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

              <span
                style={styles.infoValue}
              >
                {accountType}
              </span>

            </div>

            {/* CLUB */}

            <div style={styles.infoItem}>

              <span style={styles.infoKey}>
                Club
              </span>

              <span
                style={styles.infoValue}
              >
                {clubName || '—'}
              </span>

              {clubPosition && (
                <span
                  style={
                    styles.clubPosition
                  }
                >
                  {clubPosition}
                </span>
              )}

            </div>

            {/* YEAR */}

            {accountType ===
            'Guest' ? (

              <div
                style={styles.infoItem}
              >

                <span
                  style={styles.infoKey}
                >
                  Title
                </span>

                <span
                  style={styles.infoValue}
                >
                  {guestTitle || '—'}
                </span>

              </div>

            ) : (

              <div
                style={styles.infoItem}
              >

                <span
                  style={styles.infoKey}
                >
                  Year
                </span>

                <span
                  style={styles.infoValue}
                >
                  {year || '—'}
                </span>

              </div>

            )}

          </div>
        </div>

        <div style={styles.divider} />

        {/* PERSONAL DETAILS */}

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
              onChange={
                handleAvatarChange
              }
              disabled={saving}
              style={styles.fileInput}
            />

            <span style={styles.hint}>
              JPG, PNG, WEBP or GIF up
              to 5MB.
            </span>

            {avatarFile && (
              <div
                style={
                  styles.selectedFileRow
                }
              >

                <span
                  style={
                    styles.selectedFileText
                  }
                >
                  Selected:{' '}
                  {avatarFile.name}
                </span>

                <button
                  type="button"
                  onClick={
                    handleCancelAvatar
                  }
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

          {accountType !==
            'Guest' && (
            <div
              style={styles.inputGroup}
            >

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

            </div>
          )}

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
                  descriptionWordCount >=
                  200
                    ? styles.wordCountLimit
                    : styles.wordCount
                }
              >
                {descriptionWordCount}/200
                words
              </span>

            </div>

          </div>

          {/* SAVE BUTTON */}

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
      </div>
    </div>
  );
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
    border:
      '1px solid #F1F5F9',
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
    border:
      '3px solid #F1F5F9',
    backgroundColor:
      '#F8FAFC',
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

  profileMajor: {
    margin: '0',
    color: '#667085',
    fontSize: '15px',
    fontWeight: '600',
    lineHeight: '1.4',
    wordBreak: 'break-word',
  },

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
    border:
      '1px solid #D1D5DB',
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
    border:
      '1px solid #D1D5DB',
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
    border:
      '1px solid #D1D5DB',
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
    transition:
      'background-color 0.2s ease',
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
    border:
      '1px solid #FECDCA',
    fontSize: '14px',
  },

  successBox: {
    color: '#067647',
    fontWeight: '700',
    marginBottom: '15px',
    padding: '12px 15px',
    borderRadius: '10px',
    backgroundColor: '#ECFDF3',
    border:
      '1px solid #ABEFC6',
    fontSize: '14px',
  },
};