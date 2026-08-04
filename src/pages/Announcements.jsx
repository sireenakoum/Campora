import React, { useEffect, useState } from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { getCampusEvents, getProfile, getBriefingItems } from '../lib/queries';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';

export default function Announcements() {
  const [events, setEvents] = useState([]);
  const [urgent, setUrgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [eventData, profileData] = await Promise.all([getCampusEvents(), getProfile()]);
        const briefingData = profileData ? await getBriefingItems(profileData.id) : [];
        if (!cancelled) {
          setEvents(eventData);
          setUrgent(briefingData.find((item) => item.type === 'urgent') ?? null);
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
    return <p style={{ color: 'var(--campora-muted)', fontWeight: '700' }}>Loading announcements...</p>;
  }

  if (error) {
    return <p style={{ color: 'var(--campora-muted)', fontWeight: '700' }}>Couldn't load announcements ({error}).</p>;
  }

  const featured = events[0];

  return (
    <div style={{ width: '100%' }}>
      <h1 style={{ marginBottom: '30px', fontSize: '42px', fontWeight: '900', color: '#0B1A3F' }}>Campora</h1>
      <div className="grid">
        <div className="card" style={{ gridColumn: 'span 8', padding: '0', overflow: 'hidden' }}>
          <div style={{ height: '240px', background: '#222' }}>
            <img
              src={featured?.image_url || FALLBACK_IMAGE}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              alt={featured?.title || 'campus event'}
            />
          </div>
          <div style={{ padding: '30px' }}>
            <h3 style={{fontWeight: '800', color: '#0B1A3F'}}>{featured ? featured.title : 'No campus events yet'}</h3>
            <button style={{ color: 'var(--campora-blue)', background: 'none', border: 'none', fontWeight: 'bold', marginTop: '15px', cursor: 'pointer' }}>Read More <ChevronRight size={16} style={{ verticalAlign: 'middle' }}/></button>
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 4', backgroundColor: '#FEE2E2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--campora-urgent)', marginBottom: '15px' }}>
            <Bell size={20} /> <span style={{ fontSize: '10px', fontWeight: '900' }}>URGENT NOTICE</span>
          </div>
          <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#0B1A3F' }}>{urgent ? urgent.label : 'No urgent notices'}</h3>
          <p style={{ color: '#991B1B', opacity: 0.8, fontWeight: '700' }}>{urgent ? urgent.body : "You're all caught up."}</p>
        </div>
      </div>
    </div>
  );
}
