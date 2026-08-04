import React, { useState, useEffect } from 'react';
import { Plus, Users, MapPin, Volume2, MessageSquare, ArrowRight, X, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function StudyGroups() {
  const [groups, setGroups] = useState([]);
  const [view, setView] = useState('browse'); 
  const [loading, setLoading] = useState(true);
  
  // These would ideally come from the user's profile database
  const userPrefs = { level: 'Senior Year', env: 'Quiet', style: 'Silent', mode: 'In-person' };

  const [newGroup, setNewGroup] = useState({
    name: '', subject: '', max_size: 4, gender_pref: 'Mixed',
    environment: 'Quiet', study_style: 'Silent', location: '',
    available_days: '', mode: 'In-person', academic_level: 'Senior Year', notes: ''
  });

  const fetchGroups = async () => {
    setLoading(true);
    const { data } = await supabase.from('study_groups').select('*').order('created_at', { ascending: false });
    setGroups(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('study_groups').insert([newGroup]);
    if (!error) { setView('browse'); fetchGroups(); }
  };

  const calculateMatch = (group) => {
    let score = 0;
    if (group.environment === userPrefs.env) score += 25;
    if (group.study_style === userPrefs.style) score += 25;
    if (group.mode === userPrefs.mode) score += 25;
    if (group.academic_level === userPrefs.level) score += 25;
    return score;
  };

  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
           <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#0B1A3F', margin: 0 }}>Study Groups</h1>
           <p style={{ color: '#A3AED0', fontWeight: '800', margin: '5px 0' }}>Match with partners based on your study style</p>
        </div>
        <button onClick={() => setView(view === 'browse' ? 'create' : 'browse')} style={addBtnStyle}>
          {view === 'browse' ? <><Plus size={20} strokeWidth={3} /> Create Group</> : 'Back to Browse'}
        </button>
      </div>

      {view === 'create' ? (
        <div className="card" style={{ maxWidth: '800px', border: '2px solid #0B1A3F', padding: '40px' }}>
          <h2 style={{ marginBottom: '30px', color: '#0B1A3F' }}>Group Preferences</h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <input type="text" placeholder="Group Name" required style={modalInput} onChange={e => setNewGroup({...newGroup, name: e.target.value})} />
            <input type="text" placeholder="Subject/Course" required style={modalInput} onChange={e => setNewGroup({...newGroup, subject: e.target.value})} />
            
            <select style={modalInput} onChange={e => setNewGroup({...newGroup, environment: e.target.value})}>
              <option value="Quiet">Quiet (Library Vibes)</option>
              <option value="Social">Social (Cafe Vibes)</option>
            </select>

            <select style={modalInput} onChange={e => setNewGroup({...newGroup, study_style: e.target.value})}>
              <option value="Silent">Silent Studying</option>
              <option value="Discussion">Active Discussion</option>
            </select>

            <select style={modalInput} onChange={e => setNewGroup({...newGroup, mode: e.target.value})}>
              <option value="In-person">In-person</option>
              <option value="Online">Online</option>
            </select>

            <input type="text" placeholder="Location" style={modalInput} onChange={e => setNewGroup({...newGroup, location: e.target.value})} />
            
            <button type="submit" style={saveBtnStyle}>Launch Group</button>
          </form>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' }}>
          {loading && <RefreshCw className="animate-spin" style={{ color: '#0B1A3F' }} />}
          {groups.map(group => {
            const match = calculateMatch(group);
            return (
              <div key={group.id} className="card" style={{ padding: '30px', border: '1.5px solid #E9EDF7', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '20px', right: '20px', background: match > 70 ? '#DCFCE7' : '#F4F7FE', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '10px', fontWeight: '900', color: '#0B1A3F' }}>MATCH</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0B1A3F' }}>{match}%</p>
                </div>
                <span style={tagStyle}>{group.subject}</span>
                <h2 style={{ fontSize: '24px', margin: '15px 0 10px 0', color: '#0B1A3F' }}>{group.name}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                    <div style={infoRow}><Volume2 size={16}/> <span>{group.environment} Environment</span></div>
                    <div style={infoRow}><MessageSquare size={16}/> <span>{group.study_style} Study</span></div>
                    <div style={infoRow}><MapPin size={16}/> <span>{group.location || 'TBD'}</span></div>
                </div>
                <button style={joinBtnStyle}>Request to Join <ArrowRight size={16}/></button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const addBtnStyle = { background: '#0B1A3F', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' };
const modalInput = { padding: '15px', borderRadius: '12px', border: '2px solid #F4F7FE', fontWeight: '800', outline: 'none', color: '#0B1A3F', background: '#F4F7FE' };
const saveBtnStyle = { background: '#0B1A3F', color: 'white', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', gridColumn: 'span 2' };
const tagStyle = { background: '#F4F7FE', padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', color: '#0B1A3F', textTransform: 'uppercase' };
const infoRow = { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '800', color: '#0B1A3F', opacity: 0.8 };
const joinBtnStyle = { marginTop: '30px', width: '100%', background: '#F4F7FE', color: '#0B1A3F', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' };