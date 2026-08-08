import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Code2, Landmark, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import {
  getProfile,
  getBriefingItems,
  getTodayClasses,
  getUpcomingDeadlines,
  getCampusEvents,
  updateProfileProgress,
  addDeadline,
  updateDeadline,
  deleteDeadline,
  addClass,
  updateClass,
  deleteClass,
  addBriefingItem,
  updateBriefingItem,
  deleteBriefingItem,
} from '../lib/queries';

const CLASS_ICONS = { architecture: Landmark, code: Code2, auto_stories: BookOpen };

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function formatTimeRange(startsAt, endsAt) {
  const opts = { hour: 'numeric', minute: '2-digit' };
  return `${new Date(startsAt).toLocaleTimeString('en-US', opts)} - ${new Date(endsAt).toLocaleTimeString('en-US', opts)}`;
}

function formatDue(dueAt) {
  const due = new Date(dueAt);
  const time = due.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (due.toDateString() === new Date().toDateString()) return `Due today, ${time}`;
  return `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`;
}

function toLocalInputValue(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(value) {
  return value ? new Date(value).toISOString() : new Date().toISOString();
}

function clampPercent(n) {
  return Math.max(0, Math.min(100, n));
}

const editBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--campora-muted)',
  padding: '4px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
};

const inputStyle = {
  padding: '8px 10px',
  borderRadius: '10px',
  border: '1px solid #D1D5DB',
  fontSize: '13px',
  color: '#0B1A3F',
  outline: 'none',
  width: '100%',
  backgroundColor: '#fff',
};

const saveBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: 'var(--campora-navy)',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  padding: '9px 16px',
  fontWeight: '800',
  fontSize: '13px',
  cursor: 'pointer',
};

const cancelBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: 'white',
  color: 'var(--campora-muted)',
  border: '1px solid #D1D5DB',
  borderRadius: '10px',
  padding: '9px 16px',
  fontWeight: '800',
  fontSize: '13px',
  cursor: 'pointer',
};

const trashBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#DC2626',
  padding: '4px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const addBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: '#F8FAFF',
  color: 'var(--campora-navy)',
  border: '1px dashed #CBD5E1',
  borderRadius: '10px',
  padding: '8px 14px',
  fontWeight: '800',
  fontSize: '13px',
  cursor: 'pointer',
  alignSelf: 'flex-start',
};

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [briefing, setBriefing] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [editingProgress, setEditingProgress] = useState(false);
  const [progressDraft, setProgressDraft] = useState({ credits_percent: 0, attendance_percent: 0 });

  const [editingDeadlines, setEditingDeadlines] = useState(false);
  const [deadlineDrafts, setDeadlineDrafts] = useState([]);

  const [editingSchedule, setEditingSchedule] = useState(false);
  const [classDrafts, setClassDrafts] = useState([]);

  const [editingUrgent, setEditingUrgent] = useState(false);
  const [urgentDraft, setUrgentDraft] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let profileData = null;
        try {
          profileData = await getProfile();
        } catch {
          profileData = null;
        }

        const activeProfile = profileData ?? {
          id: 'demo',
          name: 'Student',
          year: 'Senior Year',
          credits_percent: 85,
          attendance_percent: 94,
        };

        const [briefingData, classesData, deadlinesData, eventsData] = await Promise.all([
          getBriefingItems(activeProfile.id).catch(() => []),
          getTodayClasses(activeProfile.id).catch(() => []),
          getUpcomingDeadlines(activeProfile.id).catch(() => []),
          getCampusEvents().catch(() => []),
        ]);

        if (!cancelled) {
          setProfile(activeProfile);
          setBriefing(briefingData);
          setTodayClasses(classesData);
          setDeadlines(deadlinesData);
          setAnnouncement(eventsData[0] ?? null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // ---- Semester progress editing ----
  const startEditingProgress = () => {
    setProgressDraft({
      credits_percent: profile.credits_percent ?? 0,
      attendance_percent: profile.attendance_percent ?? 0,
    });
    setSaveError(null);
    setEditingProgress(true);
  };

  const saveProgress = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const updates = {
        credits_percent: clampPercent(Number(progressDraft.credits_percent) || 0),
        attendance_percent: clampPercent(Number(progressDraft.attendance_percent) || 0),
        updated_at: new Date(),
      };
      const updated = await updateProfileProgress(profile.id, updates);
      setProfile((p) => ({ ...p, ...(updated?.[0] ?? updates) }));
      setEditingProgress(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ---- Deadlines editing ----
  const startEditingDeadlines = () => {
    setDeadlineDrafts(deadlines.map((d) => ({
      id: d.id,
      title: d.title,
      tag: d.tag,
      tag_style: d.tag_style,
      percent_complete: d.percent_complete,
      due_at: toLocalInputValue(d.due_at),
    })));
    setSaveError(null);
    setEditingDeadlines(true);
  };

  const addDeadlineDraft = () => {
    setDeadlineDrafts((prev) => [
      ...prev,
      { id: null, title: '', tag: 'Assignment', tag_style: 'secondary', percent_complete: 0, due_at: toLocalInputValue(new Date()) },
    ]);
  };

  const updateDeadlineDraft = (index, patch) => {
    setDeadlineDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const removeDeadlineDraft = async (index) => {
    const draft = deadlineDrafts[index];
    if (draft.id && !window.confirm(`Delete "${draft.title}"?`)) return;
    if (draft.id) {
      try {
        await deleteDeadline(draft.id);
        setDeadlines((prev) => prev.filter((x) => x.id !== draft.id));
      } catch (err) {
        setSaveError(err.message);
        return;
      }
    }
    setDeadlineDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  const saveDeadlines = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const kept = [];
      for (const draft of deadlineDrafts) {
        const title = draft.title.trim();
        if (!title) continue;
        const payload = {
          title,
          tag: draft.tag.trim() || 'Assignment',
          tag_style: draft.tag_style === 'error' ? 'error' : 'secondary',
          percent_complete: clampPercent(Number(draft.percent_complete) || 0),
          due_at: fromLocalInputValue(draft.due_at),
        };
        if (draft.id) {
          const updated = await updateDeadline(draft.id, payload);
          kept.push(updated?.[0] ?? { ...draft, ...payload });
        } else {
          const created = await addDeadline({ profile_id: profile.id, ...payload });
          kept.push(created?.[0] ?? { ...draft, ...payload });
        }
      }
      setDeadlines(kept);
      setEditingDeadlines(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ---- Today's schedule editing ----
  const startEditingSchedule = () => {
    setClassDrafts(todayClasses.map((c) => ({
      id: c.id,
      title: c.title,
      professor: c.professor || '',
      location: c.location || '',
      icon: c.icon || 'auto_stories',
      starts_at: toLocalInputValue(c.starts_at),
      ends_at: toLocalInputValue(c.ends_at),
    })));
    setSaveError(null);
    setEditingSchedule(true);
  };

  const addClassDraft = () => {
    const start = new Date();
    start.setMinutes(start.getMinutes() + 60 - start.getMinutes() % 60, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    setClassDrafts((prev) => [
      ...prev,
      {
        id: null,
        title: '',
        professor: '',
        location: '',
        icon: 'auto_stories',
        starts_at: toLocalInputValue(start),
        ends_at: toLocalInputValue(end),
      },
    ]);
  };

  const updateClassDraft = (index, patch) => {
    setClassDrafts((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const removeClassDraft = async (index) => {
    const draft = classDrafts[index];
    if (draft.id && !window.confirm(`Delete "${draft.title}"?`)) return;
    if (draft.id) {
      try {
        await deleteClass(draft.id);
        setTodayClasses((prev) => prev.filter((x) => x.id !== draft.id));
      } catch (err) {
        setSaveError(err.message);
        return;
      }
    }
    setClassDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  const saveSchedule = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const kept = [];
      for (const draft of classDrafts) {
        const title = draft.title.trim();
        if (!title) continue;
        const payload = {
          title,
          professor: draft.professor.trim(),
          location: draft.location.trim(),
          icon: draft.icon || 'auto_stories',
          starts_at: fromLocalInputValue(draft.starts_at),
          ends_at: fromLocalInputValue(draft.ends_at),
        };
        if (draft.id) {
          const updated = await updateClass(draft.id, payload);
          kept.push(updated?.[0] ?? { ...draft, ...payload });
        } else {
          const created = await addClass({ profile_id: profile.id, ...payload });
          kept.push(created?.[0] ?? { ...draft, ...payload });
        }
      }
      setTodayClasses(kept);
      setEditingSchedule(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ---- Urgent banner editing ----
  const startEditingUrgent = () => {
    setUrgentDraft(briefing.find((item) => item.type === 'urgent')?.body ?? '');
    setSaveError(null);
    setEditingUrgent(true);
  };

  const saveUrgent = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const urgentItem = briefing.find((item) => item.type === 'urgent');
      const body = urgentDraft.trim();
      if (urgentItem) {
        if (!body) {
          await deleteBriefingItem(urgentItem.id);
          setBriefing((prev) => prev.filter((i) => i.id !== urgentItem.id));
        } else if (body !== urgentItem.body) {
          const updated = await updateBriefingItem(urgentItem.id, { body });
          setBriefing((prev) => prev.map((i) => (i.id === urgentItem.id ? (updated?.[0] ?? { ...i, body }) : i)));
        }
      } else if (body) {
        const created = await addBriefingItem({ profile_id: profile.id, type: 'urgent', label: 'Urgent', body });
        setBriefing((prev) => [...prev, created?.[0] ?? { id: '', type: 'urgent', label: 'Urgent', body }]);
      }
      setEditingUrgent(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ color: 'var(--campora-muted)', fontWeight: '700' }}>Loading dashboard...</p>;
  }

  if (error || !profile) {
    return <p style={{ color: 'var(--campora-muted)', fontWeight: '700' }}>Couldn't load your dashboard ({error}).</p>;
  }

  const isDemo = profile.id === 'demo';
  const dateLabel = new Date()
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    .toUpperCase();
  const urgent = briefing.find((item) => item.type === 'urgent');

  return (
    <div style={{ width: '100%', textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: 'var(--campora-muted)', fontWeight: '800', letterSpacing: '2px', fontSize: '12px', marginBottom: '10px' }}>{dateLabel}</p>
          <h1 style={{ fontSize: '42px', fontWeight: '900', marginBottom: '40px', color: '#0B1A3F' }}>{greeting()}, {profile.name}</h1>
        </div>
        <Link
          to="/login"
          style={{
            padding: '12px 22px',
            borderRadius: '15px',
            fontWeight: 'bold',
            textDecoration: 'none',
            background: 'var(--campora-navy)',
            color: 'white',
            whiteSpace: 'nowrap',
          }}
        >
          Log In / Sign Up
        </Link>
      </div>

      {saveError && <p style={{ color: '#DC2626', fontWeight: '700', marginBottom: '16px' }}>{saveError}</p>}

      <div className="grid" style={{ marginBottom: '25px' }}>
        <div className="card" style={{ gridColumn: 'span 8', background: 'var(--campora-navy)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
            <h2 style={{ color: 'white', fontSize: '32px', marginBottom: '20px', fontWeight: '800' }}>{urgent ? 'You have urgent items to address.' : 'Your day is looking highly productive.'}</h2>
            {!isDemo && !editingUrgent && (
              <button onClick={startEditingUrgent} style={{ ...editBtnStyle, color: 'rgba(255,255,255,0.7)' }} aria-label="Edit urgent note" title="Edit note">
                <Pencil size={16} />
              </button>
            )}
          </div>
          {editingUrgent ? (
            <div>
              <textarea
                value={urgentDraft}
                onChange={(e) => setUrgentDraft(e.target.value)}
                placeholder="Write an urgent note for yourself…"
                rows={2}
                style={{ ...inputStyle, minHeight: '70px', resize: 'vertical', fontSize: '16px' }}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button onClick={saveUrgent} disabled={saving} style={{ ...saveBtnStyle, background: 'white', color: 'var(--campora-navy)' }}>
                  <Save size={15} /> {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setEditingUrgent(false)} style={{ ...cancelBtnStyle, color: 'white', borderColor: 'rgba(255,255,255,0.4)', background: 'transparent' }}>
                  <X size={15} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <p style={{ opacity: 0.8, fontSize: '18px' }}>{urgent ? urgent.body : 'No urgent items on your plate right now.'}</p>
          )}
          <button style={{ marginTop: '40px', padding: '14px 28px', borderRadius: '15px', border: 'none', fontWeight: 'bold', cursor: 'pointer', background: 'white', color: 'var(--campora-navy)' }}>Ask Assistant</button>
        </div>

        <div className="card" style={{ gridColumn: 'span 4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <p style={{ fontSize: '12px', fontWeight: '900', color: '#0B1A3F' }}>SEMESTER PROGRESS</p>
            {!isDemo && !editingProgress && (
              <button onClick={startEditingProgress} style={editBtnStyle} aria-label="Edit semester progress" title="Edit">
                <Pencil size={16} />
              </button>
            )}
          </div>
          {editingProgress ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: 'var(--campora-muted)', marginBottom: '6px' }}>Credits %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progressDraft.credits_percent}
                  onChange={(e) => setProgressDraft((prev) => ({ ...prev, credits_percent: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: 'var(--campora-muted)', marginBottom: '6px' }}>Attendance %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progressDraft.attendance_percent}
                  onChange={(e) => setProgressDraft((prev) => ({ ...prev, attendance_percent: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={saveProgress} disabled={saving} style={saveBtnStyle}><Save size={15} /> {saving ? 'Saving…' : 'Save'}</button>
                <button onClick={() => setEditingProgress(false)} style={cancelBtnStyle}><X size={15} /> Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}><h3 style={{ fontSize: '36px', color: '#0B1A3F' }}>{profile.credits_percent}%</h3><small style={{ fontWeight: '800' }}>CREDITS</small></div>
              <div style={{ textAlign: 'center' }}><h3 style={{ fontSize: '36px', color: '#0B1A3F' }}>{profile.attendance_percent}%</h3><small style={{ fontWeight: '800' }}>ATTENDANCE</small></div>
            </div>
          )}
        </div>
      </div>

      <div className="grid" style={{ marginBottom: '25px' }}>
        <div className="card" style={{ gridColumn: 'span 7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <p style={{ fontSize: '12px', fontWeight: '900', color: '#0B1A3F' }}>TODAY'S SCHEDULE</p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {!editingSchedule && (
                <Link
                  to="/planner"
                  style={{ fontSize: '12px', fontWeight: '900', color: 'var(--campora-blue)', textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  Open in Planner →
                </Link>
              )}
              {!isDemo && !editingSchedule && (
                <button onClick={startEditingSchedule} style={editBtnStyle} aria-label="Edit schedule" title="Edit">
                  <Pencil size={16} />
                </button>
              )}
            </div>
          </div>
          {editingSchedule ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {classDrafts.map((c, index) => (
                <div key={c.id ?? `new-${index}`} style={{ border: '1px solid #EEF2F7', borderRadius: '14px', padding: '14px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <input
                      type="text"
                      value={c.title}
                      onChange={(e) => updateClassDraft(index, { title: e.target.value })}
                      placeholder="Class title"
                      style={inputStyle}
                    />
                    <select value={c.icon} onChange={(e) => updateClassDraft(index, { icon: e.target.value })} style={{ ...inputStyle, width: 'auto', flexShrink: 0 }}>
                      <option value="auto_stories">Book</option>
                      <option value="architecture">Building</option>
                      <option value="code">Code</option>
                    </select>
                    <button onClick={() => removeClassDraft(index)} style={trashBtnStyle} aria-label="Remove class" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      value={c.professor}
                      onChange={(e) => updateClassDraft(index, { professor: e.target.value })}
                      placeholder="Professor"
                      style={inputStyle}
                    />
                    <input
                      type="text"
                      value={c.location}
                      onChange={(e) => updateClassDraft(index, { location: e.target.value })}
                      placeholder="Location"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <input
                      type="datetime-local"
                      value={c.starts_at}
                      onChange={(e) => updateClassDraft(index, { starts_at: e.target.value })}
                      style={inputStyle}
                    />
                    <input
                      type="datetime-local"
                      value={c.ends_at}
                      onChange={(e) => updateClassDraft(index, { ends_at: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>
              ))}
              <button onClick={addClassDraft} style={addBtnStyle}><Plus size={16} /> Add Class</button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={saveSchedule} disabled={saving} style={saveBtnStyle}><Save size={15} /> {saving ? 'Saving…' : 'Save'}</button>
                <button onClick={() => setEditingSchedule(false)} style={cancelBtnStyle}><X size={15} /> Cancel</button>
              </div>
            </div>
          ) : todayClasses.length === 0 ? (
            <p style={{ color: 'var(--campora-muted)', fontWeight: '700' }}>No classes today.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {todayClasses.map((c) => {
                const Icon = CLASS_ICONS[c.icon] || BookOpen;
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#F4F7FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={20} color="#0B1A3F" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '800', color: '#0B1A3F', fontSize: '15px' }}>{c.title}</p>
                      <p style={{ fontSize: '12px', color: 'var(--campora-muted)', fontWeight: '700' }}>{c.professor} · {c.location}</p>
                    </div>
                    <p style={{ fontSize: '12px', fontWeight: '900', color: '#0B1A3F', whiteSpace: 'nowrap' }}>{formatTimeRange(c.starts_at, c.ends_at)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ gridColumn: 'span 5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <p style={{ fontSize: '12px', fontWeight: '900', color: '#0B1A3F' }}>UPCOMING DEADLINES</p>
            {!isDemo && !editingDeadlines && (
              <button onClick={startEditingDeadlines} style={editBtnStyle} aria-label="Edit deadlines" title="Edit">
                <Pencil size={16} />
              </button>
            )}
          </div>
          {editingDeadlines ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {deadlineDrafts.map((d, index) => (
                <div key={d.id ?? `new-${index}`} style={{ border: '1px solid #EEF2F7', borderRadius: '14px', padding: '14px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <input
                      type="text"
                      value={d.title}
                      onChange={(e) => updateDeadlineDraft(index, { title: e.target.value })}
                      placeholder="Deadline title"
                      style={inputStyle}
                    />
                    <button onClick={() => removeDeadlineDraft(index)} style={trashBtnStyle} aria-label="Remove deadline" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <input
                      type="text"
                      value={d.tag}
                      onChange={(e) => updateDeadlineDraft(index, { tag: e.target.value })}
                      placeholder="Tag"
                      style={inputStyle}
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={d.percent_complete}
                      onChange={(e) => updateDeadlineDraft(index, { percent_complete: e.target.value })}
                      title="Percent complete"
                      style={inputStyle}
                    />
                    <select
                      value={d.tag_style}
                      onChange={(e) => updateDeadlineDraft(index, { tag_style: e.target.value })}
                      title="Tag style"
                      style={{ ...inputStyle, width: 'auto', flexShrink: 0 }}
                    >
                      <option value="secondary">Normal</option>
                      <option value="error">Urgent</option>
                    </select>
                  </div>
                  <input
                    type="datetime-local"
                    value={d.due_at}
                    onChange={(e) => updateDeadlineDraft(index, { due_at: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              ))}
              <button onClick={addDeadlineDraft} style={addBtnStyle}><Plus size={16} /> Add Deadline</button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={saveDeadlines} disabled={saving} style={saveBtnStyle}><Save size={15} /> {saving ? 'Saving…' : 'Save'}</button>
                <button onClick={() => setEditingDeadlines(false)} style={cancelBtnStyle}><X size={15} /> Cancel</button>
              </div>
            </div>
          ) : deadlines.length === 0 ? (
            <p style={{ color: 'var(--campora-muted)', fontWeight: '700' }}>Nothing due soon.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {deadlines.map((d) => (
                <div key={d.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <p style={{ fontWeight: '800', color: '#0B1A3F', fontSize: '14px' }}>{d.title}</p>
                    <span style={{
                      fontSize: '10px', fontWeight: '900', padding: '4px 10px', borderRadius: '20px',
                      background: d.tag_style === 'error' ? '#FEE2E2' : '#F4F7FE',
                      color: d.tag_style === 'error' ? '#991B1B' : 'var(--campora-muted)',
                    }}>{d.tag}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--campora-muted)', fontWeight: '700', marginBottom: '6px' }}>{formatDue(d.due_at)}</p>
                  <div style={{ height: '6px', borderRadius: '10px', background: '#F4F7FE', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${d.percent_complete}%`, background: 'var(--campora-navy)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Link to="/announcements" className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', width: '100%' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: '900', color: 'var(--campora-blue)', marginBottom: '8px' }}>{announcement ? announcement.category.toUpperCase() : 'ANNOUNCEMENTS'}</p>
          <p style={{ fontWeight: '800', color: '#0B1A3F', fontSize: '18px' }}>{announcement ? announcement.title : 'No announcements yet'}</p>
        </div>
        <span style={{ color: 'var(--campora-blue)', fontWeight: '900', fontSize: '13px', whiteSpace: 'nowrap' }}>View all →</span>
      </Link>
    </div>
  );
}
