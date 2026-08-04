import React, { useState, useEffect } from 'react';
import { 
  Plus, Users, MapPin, Volume2, MessageSquare, ArrowRight, 
  Search, RefreshCw, X, Monitor, ArrowLeft, BookmarkCheck, 
  LayoutGrid, Settings, UserPlus, LogOut, Sliders, MessageCircle, BookOpen, GraduationCap, Target
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// --- CONSTANTS FOR DROPDOWNS ---
const MAJORS = [
  "Architecture", "Biology", "Business / Finance", "Computer Science", 
  "Civil Engineering", "Mechanical Engineering", "Electrical Engineering", 
  "Chemical Engineering", "Economics", "Graphic Design", "History", 
  "Mathematics", "Media & Communication", "Nursing", "Nutrition", 
  "Philosophy", "Physics", "Political Science", "Psychology", "Sociology"
];

const STUDY_GOALS = [
  "Exam Prep", "Homework / Assignments", "Final Project", "General Review", "Reading / Discussion"
];

const NOISE_LEVELS = [
  "Dead Silent", "Library Soft", "Background Music", "Social & Talkative"
];

export default function StudyGroups() {
  // --- STATE ---
  const [groups, setGroups] = useState([]);
  const [joinedGroupIds, setJoinedGroupIds] = useState([]);
  const [view, setView] = useState('browse'); 
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- LARA'S PREFERENCES ---
  const [myPrefs, setMyPrefs] = useState(() => {
    const saved = localStorage.getItem('campora_user_prefs');
    return saved ? JSON.parse(saved) : { 
      major: 'Biology', 
      env: 'Library Soft', 
      style: 'Silent', 
      mode: 'In-person',
      goal: 'Exam Prep'
    };
  });

  // --- NEW GROUP SETUP ---
  const [newGroup, setNewGroup] = useState({
    name: '', subject: '', environment: 'Library Soft', study_style: 'Silent', 
    location: '', mode: 'In-person', color: '#E0F2FE', max_size: 4, 
    description: '', major: 'Biology', goal: 'Exam Prep'
  });

  const pastelColors = [
    { bg: '#E0F2FE', name: 'Blue' }, { bg: '#FCE7F3', name: 'Pink' },
    { bg: '#F3E8FF', name: 'Purple' }, { bg: '#DCFCE7', name: 'Green' },
    { bg: '#FEE2E2', name: 'Red' }, { bg: '#FFEDD5', name: 'Yellow' }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { data: groupsData } = await supabase.from('study_groups').select('*, group_members(count)').order('created_at', { ascending: false });
      if (user) {
        const { data: memberData } = await supabase.from('group_members').select('group_id').eq('user_id', user.id);
        setJoinedGroupIds(memberData?.map(m => m.group_id) || []);
      }
      setGroups(groupsData || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchData(); 
    localStorage.setItem('campora_user_prefs', JSON.stringify(myPrefs)); 
  }, [myPrefs]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('study_groups').insert([{ ...newGroup, creator_id: user.id }]).select();
    if (!error && data) {
        await supabase.from('group_members').insert([{ group_id: data[0].id, user_id: user.id }]);
        setView('browse'); fetchData();
    }
    setActionLoading(false);
  };

  const handleJoin = async (groupId) => {
    setActionLoading(true);
    await supabase.from('group_members').insert([{ group_id: groupId }]);
    await fetchData(); setActionLoading(false); setView('my-groups');
  };

  // --- MATCHMAKING ENGINE (Weighted) ---
  const calculateMatch = (group) => {
    let score = 0;
    if (group.major === myPrefs.major) score += 30; // Major is most important
    if (group.goal === myPrefs.goal) score += 20;
    if (group.environment === myPrefs.env) score += 20;
    if (group.study_style === myPrefs.style) score += 15;
    if (group.mode === myPrefs.mode) score += 15;
    return Math.min(score, 100);
  };

  const filteredGroups = groups.filter(g => 
    (g.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (g.subject || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.major || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const GroupCard = ({ group }) => {
    const match = calculateMatch(group);
    const count = group.group_members?.[0]?.count || 1;
    return (
      <div className="card" onClick={() => { setSelectedGroup(group); setView('details'); }} 
           style={{ ...cardStyle, background: group.color }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={tagStyle}>{group.major}</span>
            <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '9px', fontWeight: '900', color: '#0B1A3F', opacity: 0.5 }}>COMPATIBILITY</p>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: match > 80 ? '#05CD99' : '#0B1A3F' }}>{match}%</p>
            </div>
        </div>
        <h2 style={{ fontSize: '26px', margin: '15px 0', color: '#0B1A3F', fontWeight: '900' }}>{group.name}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.8 }}>
            <div style={infoLine}><Target size={14}/> {group.goal}</div>
            <div style={infoLine}><Volume2 size={14}/> {group.environment}</div>
            <div style={infoLine}><Users size={14}/> {count} / {group.max_size} Members</div>
        </div>
        <button style={cardBtn}>Join Circle <ArrowRight size={16}/></button>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.4s ease' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
           <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#0B1A3F', margin: 0 }}>Study Groups</h1>
           <div style={{ display: 'flex', gap: '25px', marginTop: '15px' }}>
              <button onClick={() => setView('browse')} style={view === 'browse' || view === 'details' ? activeTab : inactiveTab}><LayoutGrid size={16} /> Discover</button>
              <button onClick={() => setView('my-groups')} style={view === 'my-groups' ? activeTab : inactiveTab}><BookmarkCheck size={16} /> My Circles</button>
              <button onClick={() => setView('preferences')} style={view === 'preferences' ? activeTab : inactiveTab}><Sliders size={16} /> My Vibe Settings</button>
           </div>
        </div>
        <button onClick={() => setView('create')} style={addBtnStyle}>
          <Plus size={22} strokeWidth={3} /> Create Circle
        </button>
      </div>

      {/* VIEW: PREFERENCES */}
      {view === 'preferences' && (
        <div className="card" style={{ maxWidth: '800px', border: '2.5px solid #0B1A3F', padding: '50px' }}>
            <h2 style={{ marginBottom: '10px', fontSize: '28px', fontWeight: '900' }}>Your Ideal Study Vibe</h2>
            <p style={{ color: '#A3AED0', fontWeight: '700', marginBottom: '40px' }}>We match you with circles that fit your academic lifestyle.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                <div style={inputGroup}><label style={labelStyle}>MY MAJOR</label>
                <select style={inputStyle} value={myPrefs.major} onChange={e => setMyPrefs({...myPrefs, major: e.target.value})}>
                  {MAJORS.map(m => <option key={m} value={m}>{m}</option>)}
                </select></div>
                
                <div style={inputGroup}><label style={labelStyle}>STUDY GOAL</label>
                <select style={inputStyle} value={myPrefs.goal} onChange={e => setMyPrefs({...myPrefs, goal: e.target.value})}>
                  {STUDY_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                </select></div>

                <div style={inputGroup}><label style={labelStyle}>IDEAL NOISE LEVEL</label>
                <select style={inputStyle} value={myPrefs.env} onChange={e => setMyPrefs({...myPrefs, env: e.target.value})}>
                  {NOISE_LEVELS.map(n => <option key={n} value={n}>{n}</option>)}
                </select></div>

                <div style={inputGroup}><label style={labelStyle}>WHERE I STUDY</label>
                <select style={inputStyle} value={myPrefs.mode} onChange={e => setMyPrefs({...myPrefs, mode: e.target.value})}><option value="In-person">On Campus</option><option value="Online">Online / Zoom</option></select></div>

                <button onClick={() => setView('browse')} style={{ ...saveBtn, gridColumn: 'span 2', marginTop: '20px' }}>Save Vibe & View Matches</button>
            </div>
        </div>
      )}

      {/* VIEW: CREATE */}
      {view === 'create' && (
        <div className="card" style={{ maxWidth: '850px', border: '2.5px solid #0B1A3F', padding: '50px' }}>
          <button onClick={() => setView('browse')} style={backBtn}><ArrowLeft size={16}/> Back</button>
          <h2 style={{ margin: '20px 0 40px', fontWeight: '900', fontSize: '32px' }}>Launch a Circle</h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div style={inputGroup}><label style={labelStyle}>CIRCLE NAME</label><input type="text" placeholder="e.g. Psychology Finals" required style={inputStyle} onChange={e => setNewGroup({...newGroup, name: e.target.value})} /></div>
            
            <div style={inputGroup}><label style={labelStyle}>MAJOR / FIELD</label>
            <select style={inputStyle} onChange={e => setNewGroup({...newGroup, major: e.target.value})}>
              {MAJORS.map(m => <option key={m} value={m}>{m}</option>)}
            </select></div>

            <div style={inputGroup}><label style={labelStyle}>MAX MEMBERS</label><select style={inputStyle} onChange={e => setNewGroup({...newGroup, max_size: parseInt(e.target.value)})}>{[2,3,4,5,6,8,10,12,15,20].map(n => <option key={n} value={n}>{n} People</option>)}</select></div>
            <div style={inputGroup}><label style={labelStyle}>STUDY GOAL</label>
            <select style={inputStyle} onChange={e => setNewGroup({...newGroup, goal: e.target.value})}>
              {STUDY_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
            </select></div>

            <div style={inputGroup}><label style={labelStyle}>NOISE VIBE</label>
            <select style={inputStyle} onChange={e => setNewGroup({...newGroup, environment: e.target.value})}>
              {NOISE_LEVELS.map(n => <option key={n} value={n}>{n}</option>)}
            </select></div>

            <div style={inputGroup}><label style={labelStyle}>FORMAT</label><select style={inputStyle} onChange={e => setNewGroup({...newGroup, mode: e.target.value})}><option value="In-person">In-person</option><option value="Online">Online</option></select></div>
            
            <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>STICKY NOTES (RULES & DETAILS)</label>
                <textarea placeholder="Tell everyone how you'll study, where to meet, and what to bring..." style={{ ...inputStyle, height: '100px', width: '100%', resize: 'none' }} onChange={e => setNewGroup({...newGroup, description: e.target.value})} />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>CIRCLE THEME COLOR</label>
                <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                   {pastelColors.map(c => (<div key={c.bg} onClick={() => setNewGroup({...newGroup, color: c.bg})} style={{ width: '45px', height: '45px', borderRadius: '15px', background: c.bg, cursor: 'pointer', border: newGroup.color === c.bg ? '3px solid #0B1A3F' : '1px solid #ddd' }} />))}
                </div>
            </div>
            <button type="submit" disabled={actionLoading} style={saveBtn}>Confirm & Launch Circle</button>
          </form>
        </div>
      )}

      {/* DISCOVER GRID */}
      {view === 'browse' && (
        <>
          <div style={searchBarContainer}><Search size={20} color="#A3AED0" /><input type="text" placeholder="Search major, goal or name..." style={searchField} onChange={e => setSearchQuery(e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '30px' }}>
            {filteredGroups.map(g => <GroupCard key={g.id} group={g} />)}
          </div>
        </>
      )}

      {/* MY CIRCLES VIEW */}
      {view === 'my-groups' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '30px' }}>
          {groups.filter(g => joinedGroupIds.includes(g.id)).map(g => <GroupCard key={g.id} group={g} />)}
        </div>
      )}

      {/* DETAILS MODAL */}
      {view === 'details' && selectedGroup && (
        <div style={overlay}>
            <div className="card" style={{ width: '650px', padding: '50px', border: `4px solid ${selectedGroup.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <span style={tagStyle}>{selectedGroup.major}</span>
                    <X onClick={() => setView('browse')} style={{ cursor: 'pointer' }} />
                </div>
                <h1 style={{ fontSize: '42px', marginBottom: '15px', color: '#0B1A3F' }}>{selectedGroup.name}</h1>
                
                <div style={{ background: 'white', padding: '25px', borderRadius: '20px', border: '1.5px solid #F4F7FE', marginBottom: '30px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <MessageCircle size={16} color="#0B1A3F" />
                      <p style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#0B1A3F' }}>ABOUT THIS CIRCLE</p>
                   </div>
                   <p style={{ fontWeight: '800', color: '#0B1A3F', lineHeight: '1.6', margin: 0 }}>{selectedGroup.description || "No specific rules shared yet."}</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '25px', background: '#F4F7FE', borderRadius: '25px' }}>
                    <div><p style={label}>GOAL</p><p style={val}>{selectedGroup.goal}</p></div>
                    <div><p style={label}>VIBE</p><p style={val}>{selectedGroup.environment}</p></div>
                    <div><p style={label}>CAPACITY</p><p style={val}>{selectedGroup.group_members?.[0]?.count || 1} / {selectedGroup.max_size} Members</p></div>
                    <div><p style={label}>COMPATIBILITY</p><p style={{ ...val, color: '#4318FF' }}>{calculateMatch(selectedGroup)}%</p></div>
                </div>

                {joinedGroupIds.includes(selectedGroup.id) ? (
                    <button onClick={() => supabase.from('group_members').delete().eq('group_id', selectedGroup.id).then(fetchData).then(() => setView('browse'))} style={{ ...saveBtn, width: '100%', background: '#FEE2E2', color: '#B91C1C', marginTop: '30px' }}>Leave this Circle</button>
                ) : (
                    <button onClick={() => handleJoin(selectedGroup.id)} style={{ ...saveBtn, width: '100%', marginTop: '30px' }}>Join Circle</button>
                )}
            </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES ---
const activeTab = { background: 'none', border: 'none', color: '#0B1A3F', fontWeight: '900', fontSize: '15px', borderBottom: '4px solid #0B1A3F', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' };
const inactiveTab = { ...activeTab, color: '#A3AED0', borderBottom: '4px solid transparent' };
const addBtnStyle = { background: '#0B1A3F', color: 'white', border: 'none', padding: '15px 30px', borderRadius: '18px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px' };
const cardStyle = { padding: '40px', cursor: 'pointer', borderRadius: '35px', display: 'flex', flexDirection: 'column', minHeight: '320px', border: '1px solid rgba(0,0,0,0.05)' };
const backBtn = { background: 'none', border: 'none', fontWeight: '900', color: '#A3AED0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle = { fontSize: '11px', fontWeight: '900', color: '#A3AED0', letterSpacing: '1.2px' };
const inputStyle = { padding: '18px', borderRadius: '18px', border: '2px solid #F4F7FE', background: '#F4F7FE', fontWeight: '800', color: '#0B1A3F', outline: 'none' };
const saveBtn = { background: '#0B1A3F', color: 'white', border: 'none', padding: '20px', borderRadius: '20px', fontWeight: '900', fontSize: '18px', cursor: 'pointer', gridColumn: 'span 2', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' };
const tagStyle = { padding: '8px 16px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', color: '#0B1A3F', textTransform: 'uppercase', background: 'white' };
const infoLine = { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '800', color: '#0B1A3F' };
const cardBtn = { marginTop: 'auto', background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.05)', padding: '15px', borderRadius: '15px', fontWeight: '900', color: '#0B1A3F', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' };
const searchBarContainer = { display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '18px 30px', borderRadius: '50px', border: '1.5px solid #E9EDF7', marginBottom: '40px', maxWidth: '500px' };
const searchField = { border: 'none', outline: 'none', width: '100%', fontSize: '15px', fontWeight: '700', color: '#0B1A3F' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(11,26,57,0.5)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const label = { margin: '0 0 5px 0', fontSize: '11px', fontWeight: '900', color: '#A3AED0' };
const val = { margin: 0, fontWeight: '800', color: '#0B1A3F', fontSize: '18px' };