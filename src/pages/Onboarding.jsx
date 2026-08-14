import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, User, ArrowLeft, ArrowRight, Check, X, Upload, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { parseScheduleFile, expandScheduleEvents, importScheduleRows } from '../lib/scheduleImport';

const STEPS = ['About You', 'Academic Info', 'Courses Taken', 'Schedule'];

const MAJORS = [
  'Undecided',
  'Agriculture',
  'Architecture',
  'Biology',
  'Business Administration',
  'Chemistry',
  'Civil Engineering',
  'Computer Science',
  'Economics',
  'Electrical Engineering',
  'English Literature',
  'Finance',
  'Graphic Design',
  'History',
  'International Affairs',
  'Journalism',
  'Mathematics',
  'Mechanical Engineering',
  'Medicine',
  'Nursing',
  'Nutrition',
  'Physics',
  'Political Science',
  'Psychology',
  'Public Health',
  'Sociology',
  'Other',
];

const STUDENT_YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', "Master's", 'PhD'];

const GUEST_TITLES = ['Alumni', 'Visiting Researcher', 'Community Member', 'Other'];

const COURSE_SUGGESTIONS = [
  'CMPS 200', 'CMPS 202', 'CMPS 209', 'CMPS 211', 'CMPS 212', 'CMPS 214', 'CMPS 250',
  'CMPS 278', 'CMPS 283', 'CMPS 284', 'CMPS 285',
  'MATH 101', 'MATH 201', 'MATH 202', 'MATH 203', 'MATH 219', 'MATH 233', 'MATH 236', 'MATH 251',
  'PHYS 101', 'PHYS 102', 'PHYS 210', 'PHYS 211',
  'CHEM 101', 'CHEM 102', 'CHEM 211',
  'ECON 211', 'ECON 212', 'ECON 213', 'ECON 231',
  'ENGL 203', 'ENGL 204', 'ENGL 205',
  'ARAB 201', 'ARAB 202',
  'CVSP 201', 'CVSP 203',
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [accountType, setAccountType] = useState('');
  const [major, setMajor] = useState('');
  const [customMajor, setCustomMajor] = useState('');
  const [year, setYear] = useState('');
  const [guestTitle, setGuestTitle] = useState('');
  const [courseInput, setCourseInput] = useState('');
  const [coursesTaken, setCoursesTaken] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [scheduleFile, setScheduleFile] = useState(null);
  const [schedulePreview, setSchedulePreview] = useState(null);
  const [scheduleDragging, setScheduleDragging] = useState(false);
  const isFinishing = useRef(false);
  const fileInputRef = useRef(null);

  const navigate = useNavigate();

  // Auth guard: not logged in -> login; already onboarded -> dashboard.
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user) {
          navigate('/login', { replace: true });
          return;
        }
        const { data } = await supabase
          .from('profiles')
          .select('onboarding_completed, account_type, major, year, guest_title, courses_taken')
          .eq('id', user.id)
          .maybeSingle();
        if (cancelled) return;
        if (data?.onboarding_completed) {
          navigate('/dashboard', { replace: true });
          return;
        }
        // Pre-fill with anything already saved so a mid-flow refresh isn't lost.
        if (data) {
          setAccountType(data.account_type || '');
          setMajor(data.major || '');
          setYear(data.year || '');
          setGuestTitle(data.guest_title || '');
          setCoursesTaken(data.courses_taken || []);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Could not load your setup. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [navigate]);

  const addCourse = () => {
    const value = courseInput.trim().toUpperCase();
    if (value && !coursesTaken.includes(value)) {
      setCoursesTaken((prev) => [...prev, value]);
    }
    setCourseInput('');
  };

  // Course list including anything still sitting in the input box, so a
  // suggestion clicked from the datalist (which never adds a chip) still
  // gets saved on Finish.
  const collectCourses = () => {
    const pending = courseInput.trim().toUpperCase();
    if (pending && !coursesTaken.includes(pending)) {
      return [...coursesTaken, pending];
    }
    return coursesTaken;
  };

  const removeCourse = (value) => {
    setCoursesTaken((prev) => prev.filter((c) => c !== value));
  };

  const handleContinue = () => {
    setError(null);
    if (step === 0 && !accountType) {
      setError('Please choose whether you are a student or a guest.');
      return;
    }
    if (step === 1) {
      const finalMajor = major === 'Other' ? customMajor.trim() : major;
      if (!finalMajor) {
        setError('Please select your major.');
        return;
      }
      if (accountType === 'Student' && !year) {
        setError('Please select your year in university.');
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleScheduleFile = async (file) => {
    setError(null);
    try {
      const events = await parseScheduleFile(file);
      if (!events.length) {
        setScheduleFile(null);
        setSchedulePreview(null);
        setError('No events were found in that file. Please try a .pdf, .ics or .csv file.');
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

  const removeScheduleFile = () => {
    setScheduleFile(null);
    setSchedulePreview(null);
    setError(null);
  };

  const handleSkip = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message || 'Could not log out. Please try again.');
      return;
    }
    navigate('/login', { replace: true });
  };

  const handleFinish = async () => {
    if (isFinishing.current) return;
    isFinishing.current = true;
    setSaving(true);
    setError(null);

    const fail = (message) => {
      setError(message);
      setSaving(false);
      isFinishing.current = false;
    };

    const finalMajor = major === 'Other' ? customMajor.trim() : major;
    const finalYear = accountType === 'Student' ? year : null;
    const finalGuestTitle = accountType === 'Guest' ? guestTitle : null;
    const finalCourses = collectCourses();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail('You must be logged in to finish setup.');

    // Connect the selected courses to the Courses page by creating a course
    // workspace for each code the user added during onboarding. This runs
    // BEFORE marking onboarding complete so a failure here stays retryable
    // instead of leaving the profile "completed" with no course workspaces.
    const { data: existingCourses, error: existingError } = await supabase
      .from('courses')
      .select('name')
      .eq('profile_id', user.id);
    if (existingError) return fail(existingError.message || 'Could not set up your courses. Please try again.');

    const ownedNames = new Set((existingCourses || []).map((c) => c.name));
    const toCreate = finalCourses
      .filter((code) => !ownedNames.has(code))
      .map((code) => ({ profile_id: user.id, name: code, color: '#E0F2FE' }));

    if (toCreate.length > 0) {
      const { error: courseError } = await supabase.from('courses').insert(toCreate);
      if (courseError) return fail(courseError.message || 'Could not set up your courses. Please try again.');
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        account_type: accountType,
        major: finalMajor || null,
        year: finalYear || null,
        guest_title: finalGuestTitle || null,
        courses_taken: finalCourses,
        onboarding_completed: true,
        updated_at: new Date(),
      })
      .eq('id', user.id);

    if (updateError) return fail(updateError.message || 'Could not save your information. Please try again.');

    if (scheduleFile) {
      try {
        const events = await parseScheduleFile(scheduleFile);
        const rows = expandScheduleEvents(events);
        const scheduleGroupIds = rows.map((row) => row.group_id).filter(Boolean);

        const { error: scheduleError } = await importScheduleRows({
          userId: user.id,
          rows,
        });

        if (scheduleError) {
          if (scheduleGroupIds.length > 0) {
            await supabase
              .from('planner_courses')
              .delete()
              .eq('user_id', user.id)
              .in('group_id', scheduleGroupIds);
          }
          return fail(scheduleError.message || 'Could not add your schedule to Planner.');
        }
      } catch (err) {
        return fail(err?.message || 'Could not read your schedule file.');
      }
    }

    navigate('/dashboard', { replace: true });
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={styles.loadingText}>Loading your setup…</p>
      </div>
    );
  }

  const isLastStep = step === STEPS.length - 1;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.logoTitle}>Campora</h1>
          <p style={styles.subtitle}>Let's get you set up</p>
        </div>

        {/* Progress indicator */}
        <div style={styles.progressWrap}>
          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${((step + 1) / STEPS.length) * 100}%`,
              }}
            />
          </div>
          <p style={styles.progressLabel}>
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </p>
        </div>

        {error && typeof error === 'string' && (
          <div style={styles.errorBox}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={styles.errorClose}>✕</button>
          </div>
        )}

        {step === 0 && (
          <div style={styles.stepBody}>
            <p style={styles.prompt}>Are you a student or a guest?</p>
            <div style={styles.choiceGrid}>
              <button
                type="button"
                onClick={() => setAccountType('Student')}
                style={accountType === 'Student' ? { ...styles.choiceCard, ...styles.choiceCardActive } : styles.choiceCard}
              >
                <GraduationCap size={34} color={accountType === 'Student' ? '#FFFFFF' : '#002D62'} />
                <span style={{ fontWeight: '900', fontSize: '1.05rem' }}>Student</span>
                <small style={styles.choiceHint}>I'm enrolled at AUB</small>
              </button>
              <button
                type="button"
                onClick={() => setAccountType('Guest')}
                style={accountType === 'Guest' ? { ...styles.choiceCard, ...styles.choiceCardActive } : styles.choiceCard}
              >
                <User size={34} color={accountType === 'Guest' ? '#FFFFFF' : '#002D62'} />
                <span style={{ fontWeight: '900', fontSize: '1.05rem' }}>Guest</span>
                <small style={styles.choiceHint}>Alumni, visitor, or community member</small>
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={styles.stepBody}>
            <p style={styles.prompt}>
              {accountType === 'Student' ? 'Tell us about your studies.' : 'Tell us about yourself.'}
            </p>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Major</label>
              <select
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                style={styles.input}
              >
                <option value="">Select your major…</option>
                {MAJORS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {major === 'Other' && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Your Major</label>
                <input
                  type="text"
                  placeholder="e.g. Data Science"
                  value={customMajor}
                  onChange={(e) => setCustomMajor(e.target.value)}
                  style={styles.input}
                />
              </div>
            )}

            {accountType === 'Student' ? (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Year in University</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  style={styles.input}
                >
                  <option value="">Select your year…</option>
                  {STUDENT_YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={styles.inputGroup}>
                <label style={styles.label}>I am a…</label>
                <select
                  value={guestTitle}
                  onChange={(e) => setGuestTitle(e.target.value)}
                  style={styles.input}
                >
                  <option value="">Select one…</option>
                  {GUEST_TITLES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div style={styles.stepBody}>
            <p style={styles.prompt}>Which courses have you taken?</p>
            <p style={styles.hint}>Type a course code and press Enter. You can add as many as you like.</p>

            <div style={styles.inputGroup}>
              <input
                type="text"
                placeholder="e.g. CMPS 200"
                value={courseInput}
                list="campora-course-suggestions"
                onChange={(e) => setCourseInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCourse();
                  }
                }}
                style={styles.input}
              />
              <datalist id="campora-course-suggestions">
                {COURSE_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <button type="button" onClick={addCourse} style={styles.addBtn}>
                <span style={{ marginRight: '6px' }}>+</span> Add Course
              </button>
            </div>

            {coursesTaken.length > 0 && (
              <div style={styles.tagWrap}>
                {coursesTaken.map((c) => (
                  <span key={c} style={styles.tag}>
                    {c}
                    <button type="button" onClick={() => removeCourse(c)} style={styles.tagRemove}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {coursesTaken.length === 0 && (
              <p style={styles.hint}>No courses added yet — that's fine, you can skip this.</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div style={styles.stepBody}>
            <p style={styles.prompt}>Upload your class schedule</p>
            <p style={styles.hint}>
              Add a .pdf, .ics or .csv file and we'll place it on your Planner automatically.
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setScheduleDragging(true); }}
              onDragLeave={() => setScheduleDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setScheduleDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleScheduleFile(file);
              }}
              style={scheduleDragging ? { ...styles.uploadBox, ...styles.uploadBoxActive } : styles.uploadBox}
            >
              <Upload size={26} color={scheduleDragging ? '#002D62' : '#6B7280'} />
              <p style={styles.uploadTitle}>
                {scheduleFile ? scheduleFile.name : 'Drag & drop or click to upload'}
              </p>
              <p style={styles.hint}>
                {scheduleFile
                  ? `Scheduled to be added on Finish · ${(scheduleFile.size / 1024).toFixed(1)} KB`
                  : 'Supports .pdf, .ics and .csv files'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.ics,.csv,application/pdf,text/calendar,text/csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleScheduleFile(file);
                  e.target.value = '';
                }}
              />
            </div>

            {schedulePreview && (
              <div style={styles.schedulePreview}>
                <span style={styles.previewText}>
                  Found <strong>{schedulePreview.events}</strong> event{schedulePreview.events === 1 ? '' : 's'} →{' '}
                  <strong>{schedulePreview.entries}</strong> Planner entr{schedulePreview.entries === 1 ? 'y' : 'ies'}
                </span>
                <button type="button" onClick={removeScheduleFile} style={styles.removeBtn}>
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            )}

            {!scheduleFile && (
              <p style={styles.hint}>No file yet — you can also skip this step and add it later from your profile.</p>
            )}
          </div>
        )}

        <div style={styles.navRow}>
          {step > 0 && (
            <button
              type="button"
              onClick={() => { setError(null); setStep((s) => s - 1); }}
              style={styles.backBtn}
            >
              <ArrowLeft size={18} /> Back
            </button>
          )}

          {!isLastStep ? (
            <button type="button" onClick={handleContinue} style={styles.primaryBtn}>
              Continue <ArrowRight size={18} />
            </button>
          ) : (
            <button type="button" onClick={handleFinish} disabled={saving} style={saving ? { ...styles.primaryBtn, ...styles.primaryBtnDisabled } : styles.primaryBtn}>
              {saving ? 'Saving…' : 'Finish Setup'}
              {!saving && <Check size={18} />}
            </button>
          )}
        </div>

        <div style={styles.footer}>
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#6B7280' }}>
            Done for now?{' '}
            <button type="button" onClick={handleSkip} style={styles.link}>
              Skip and log out
            </button>
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
    padding: '2rem 1rem',
  },
  loadingText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: '3rem',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
    width: '100%',
    maxWidth: '480px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1.75rem',
  },
  logoTitle: {
    color: '#111827',
    fontSize: '2rem',
    fontWeight: '800',
    margin: '0 0 0.25rem 0',
  },
  subtitle: {
    color: '#6B7280',
    fontSize: '1rem',
    margin: 0,
  },
  progressWrap: {
    marginBottom: '1.75rem',
  },
  progressTrack: {
    height: '8px',
    borderRadius: '10px',
    backgroundColor: '#FAF9FE',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '10px',
    backgroundColor: '#002D62',
    transition: 'width 0.3s ease',
  },
  progressLabel: {
    marginTop: '8px',
    marginBottom: 0,
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'right',
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
    marginBottom: '1.25rem',
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
  stepBody: {
    minHeight: '220px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  prompt: {
    margin: 0,
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#111827',
  },
  hint: {
    margin: 0,
    fontSize: '0.85rem',
    color: '#6B7280',
  },
  choiceGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  choiceCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '1.75rem 1rem',
    borderRadius: '16px',
    border: '2px solid #E3E2E7',
    backgroundColor: '#fff',
    color: '#1A1B1F',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center',
  },
  choiceCardActive: {
    borderColor: '#002D62',
    backgroundColor: '#002D62',
    color: '#FFFFFF',
  },
  choiceHint: {
    fontSize: '0.78rem',
    color: 'inherit',
    opacity: 0.75,
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
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.7rem 1rem',
    borderRadius: '10px',
    border: '2px dashed #CBD5E1',
    backgroundColor: '#D8E2FF',
    color: '#1A1B1F',
    fontWeight: '700',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  uploadBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '2rem 1.25rem',
    borderRadius: '14px',
    border: '2px dashed #CBD5E1',
    backgroundColor: '#F9FAFB',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'border-color 0.2s ease, background-color 0.2s ease',
  },
  uploadBoxActive: {
    borderColor: '#002D62',
    backgroundColor: '#EEF2FF',
  },
  uploadTitle: {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#1F2937',
    wordBreak: 'break-all',
  },
  schedulePreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    padding: '0.7rem 0.9rem',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
  },
  previewText: {
    fontSize: '0.85rem',
    color: '#1F2937',
  },
  removeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '0.4rem 0.7rem',
    borderRadius: '8px',
    border: '1px solid #FECACA',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  tagWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0.45rem 0.85rem',
    borderRadius: '20px',
    backgroundColor: '#FAF9FE',
    color: '#1A1B1F',
    fontSize: '0.85rem',
    fontWeight: '700',
  },
  tagRemove: {
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    color: '#1A1B1F',
    opacity: 0.6,
    cursor: 'pointer',
    padding: 0,
  },
  navRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    marginTop: '2rem',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0.9rem 1.4rem',
    borderRadius: '10px',
    border: '1px solid #D1D5DB',
    backgroundColor: '#fff',
    color: '#1F2937',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#1F2937',
    color: '#FFFFFF',
    padding: '0.9rem 1.6rem',
    borderRadius: '10px',
    border: 'none',
    fontSize: '0.95rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    marginLeft: 'auto',
  },
  primaryBtnDisabled: {
    backgroundColor: '#9CA3AF',
    cursor: 'not-allowed',
  },
  footer: {
    marginTop: '1.5rem',
    textAlign: 'center',
  },
  link: {
    color: '#2563EB',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '500',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
};
