import React, { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { getProfile, getNextClass } from '../lib/queries';

export default function CourseManagement() {
  const [profile, setProfile] = useState(null);
  const [nextClass, setNextClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const profileData = await getProfile();
        if (!profileData) throw new Error('no profile in Supabase');
        const classData = await getNextClass(profileData.id);
        if (!cancelled) {
          setProfile(profileData);
          setNextClass(classData);
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
    return <p style={{ color: 'var(--campora-muted)', fontWeight: '700' }}>Loading courses...</p>;
  }

  if (error || !profile) {
    return <p style={{ color: 'var(--campora-muted)', fontWeight: '700' }}>Couldn't load course data ({error}).</p>;
  }

  return (
    <div style={{ width: '100%' }}>
      <div className="grid">
        <div className="card" style={{gridColumn: 'span 8', display: 'flex', justifyContent: 'space-between'}}>
          <div>
            <p style={{color: 'var(--campora-blue)', fontWeight: '900', fontSize: '11px'}}>ACADEMIC STANDING</p>
            <h1 style={{fontSize: '48px', margin: '15px 0', fontWeight: '900', color: '#0B1A3F'}}>Dean's List Status</h1>
            <div style={{display: 'flex', gap: '50px', marginTop: '30px'}}>
              <div><h2 style={{fontSize: '36px', margin: 0, color: '#0B1A3F'}}>{profile.gpa}</h2><small style={{fontWeight: '800'}}>GPA</small></div>
              <div><h2 style={{fontSize: '36px', margin: 0, color: '#0B1A3F'}}>{profile.credit_hours}</h2><small style={{fontWeight: '800'}}>CREDITS</small></div>
            </div>
          </div>
          <div style={{width: '120px', height: '120px', borderRadius: '50%', border: '12px solid var(--campora-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '24px', color: '#0B1A3F'}}>{profile.standing_percent}%</div>
        </div>
        <div className="card hero-card" style={{gridColumn: 'span 4', display: 'flex', flexDirection: 'column', background: 'var(--campora-navy)'}}>
          <BookOpen size={30} style={{marginBottom: '20px', color: 'white'}}/>
          <p style={{fontSize: '10px', opacity: 0.6, color: 'white', fontWeight: '800'}}>NEXT CLASS</p>
          <h2 style={{color: 'white', fontSize: '24px', fontWeight: '800'}}>{nextClass ? nextClass.title : 'No upcoming classes'}</h2>
          {nextClass?.join_url ? (
            <a
              href={nextClass.join_url}
              style={{marginTop: 'auto', background: 'white', color: '#0B1A3F', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '900', textAlign: 'center', textDecoration: 'none'}}
            >
              Join Lobby
            </a>
          ) : (
            <button disabled style={{marginTop: 'auto', background: 'white', color: '#0B1A3F', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '900', opacity: 0.5}}>
              Join Lobby
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
