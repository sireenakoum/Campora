import React, { useEffect, useState } from 'react';
import { getProfile, getClassesInRange, getDeadlinesInRange } from '../lib/queries';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Planner() {
  const [markedDays, setMarkedDays] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const profile = await getProfile();
        if (!profile) throw new Error('no profile in Supabase');
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0, 23, 59, 59);
        const [classes, deadlines] = await Promise.all([
          getClassesInRange(profile.id, start, end),
          getDeadlinesInRange(profile.id, start, end),
        ]);
        const days = new Set([
          ...classes.map((c) => new Date(c.starts_at).getDate()),
          ...deadlines.map((d) => new Date(d.due_at).getDate()),
        ]);
        if (!cancelled) setMarkedDays(days);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [year, month]);

  return (
    <div style={{ width: '100%' }}>
      <h1 style={{ fontSize: '42px', fontWeight: '900', marginBottom: '30px', color: '#0B1A3F' }}>{monthLabel}</h1>
      <div className="card" style={{ padding: '30px' }}>
        {error && (
          <p style={{ color: 'var(--campora-muted)', fontWeight: '700', marginBottom: '15px' }}>
            Couldn't load your schedule ({error}).
          </p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '15px' }}>
          {DAYS.map(day => (
            <div key={day} style={{ fontWeight: '900', color: '#0B1A3F', fontSize: '12px', paddingBottom: '15px', textAlign: 'center' }}>
              {day.toUpperCase()}
            </div>
          ))}
          {Array.from({ length: firstWeekday }).map((_, i) => <div key={`pad-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(date => (
            <div key={date} style={{
              height: '110px', border: '1px solid #f0f3f9', borderRadius: '15px', padding: '12px', textAlign: 'right', fontWeight: '900', color: '#0B1A3F', position: 'relative'
            }}>
              {date}
              {!loading && markedDays.has(date) && (
                <div style={{ position: 'absolute', bottom: '12px', right: '12px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--campora-blue)' }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
