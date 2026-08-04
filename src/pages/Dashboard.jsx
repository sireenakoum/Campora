import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Code2, Landmark } from 'lucide-react';
import { getProfile, getBriefingItems, getTodayClasses, getUpcomingDeadlines, getCampusEvents } from '../lib/queries';

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

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [briefing, setBriefing] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const profileData = await getProfile();
        if (!profileData) throw new Error('no profile in Supabase');
        const [briefingData, classesData, deadlinesData, eventsData] = await Promise.all([
          getBriefingItems(profileData.id),
          getTodayClasses(profileData.id),
          getUpcomingDeadlines(profileData.id),
          getCampusEvents(),
        ]);
        if (!cancelled) {
          setProfile(profileData);
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

  if (loading) {
    return <p style={{ color: 'var(--campora-muted)', fontWeight: '700' }}>Loading dashboard...</p>;
  }

  if (error || !profile) {
    return <p style={{ color: 'var(--campora-muted)', fontWeight: '700' }}>Couldn't load your dashboard ({error}).</p>;
  }

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

      <div className="grid" style={{ marginBottom: '25px' }}>
        <div className="card" style={{ gridColumn: 'span 8', background: 'var(--campora-navy)', color: 'white' }}>
          <h2 style={{ color: 'white', fontSize: '32px', marginBottom: '20px', fontWeight: '800' }}>Your day is looking highly productive.</h2>
          <p style={{ opacity: 0.8, fontSize: '18px' }}>{urgent ? urgent.body : 'No urgent items on your plate right now.'}</p>
          <button style={{ marginTop: '40px', padding: '14px 28px', borderRadius: '15px', border: 'none', fontWeight: 'bold', cursor: 'pointer', background: 'white', color: 'var(--campora-navy)' }}>Ask Assistant</button>
        </div>

        <div className="card" style={{ gridColumn: 'span 4' }}>
          <p style={{ fontSize: '12px', fontWeight: '900', color: '#0B1A3F', marginBottom: '40px' }}>SEMESTER PROGRESS</p>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
             <div style={{ textAlign: 'center' }}><h3 style={{ fontSize: '36px', color: '#0B1A3F' }}>{profile.credits_percent}%</h3><small style={{fontWeight: '800'}}>CREDITS</small></div>
             <div style={{ textAlign: 'center' }}><h3 style={{ fontSize: '36px', color: '#0B1A3F' }}>{profile.attendance_percent}%</h3><small style={{fontWeight: '800'}}>ATTENDANCE</small></div>
          </div>
        </div>
      </div>

      <div className="grid" style={{ marginBottom: '25px' }}>
        <div className="card" style={{ gridColumn: 'span 7' }}>
          <p style={{ fontSize: '12px', fontWeight: '900', color: '#0B1A3F', marginBottom: '25px' }}>TODAY'S SCHEDULE</p>
          {todayClasses.length === 0 ? (
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
          <p style={{ fontSize: '12px', fontWeight: '900', color: '#0B1A3F', marginBottom: '25px' }}>UPCOMING DEADLINES</p>
          {deadlines.length === 0 ? (
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
