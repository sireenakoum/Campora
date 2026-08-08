import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Users, Volume2, MessageSquare, ArrowRight, 
  Search, X, ArrowLeft, BookmarkCheck, LayoutGrid, 
  Sliders, UserPlus, Trash2, Edit3, Send, Crown, Check,
  Bell, BellOff, Lock, Target
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ALL MAJORS LIST FOR CIRCLE CREATION & EDITING
const MAJORS_CREATION = [
  "All Majors Welcome", "Architecture", "Biology", "Business / Finance", "Computer Science", 
  "Civil Engineering", "Mechanical Engineering", "Electrical Engineering", 
  "Chemical Engineering", "Economics", "Graphic Design", "History", 
  "Mathematics", "Media & Communication", "Nursing", "Nutrition", 
  "Philosophy", "Physics", "Political Science", "Psychology", "Sociology"
];

const MAJORS_PREFERENCES = MAJORS_CREATION.filter(m => m !== "All Majors Welcome");

const STUDY_GOALS = [
  "Exam Prep", "Homework / Assignments", "Final Project", "General Review", "Reading / Discussion"
];

const NOISE_LEVELS = [
  "Dead Silent", "Library Soft", "Background Music", "Social & Talkative"
];

const STUDY_MODES = ["In-person", "Online"];

export default function StudyGroups() {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [joinedGroupIds, setJoinedGroupIds] = useState([]);
  // Views: 'browse' | 'created' | 'joined' | 'preferences' | 'create' | 'details' | 'chat'
  const [view, setView] = useState('browse'); 
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [editingGroup, setEditingGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- CHAT & NOTIFICATIONS STATE ---
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [notificationsMuted, setNotificationsMuted] = useState({});
  const chatBottomRef = useRef(null);

  // --- PREFERENCES ---
  const [myPrefs, setMyPrefs] = useState(() => {
    const saved = localStorage.getItem('campora_user_prefs');
    return saved ? JSON.parse(saved) : { 
      major: 'Computer Science', 
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
    description: '', major: 'All Majors Welcome', goal: 'Exam Prep'
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
      setCurrentUser(user);

      const { data: groupsData } = await supabase
        .from('study_groups')
        .select('*, group_members(count)')
        .order('created_at', { ascending: false });

      if (user) {
        const { data: memberData } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);
        setJoinedGroupIds(memberData?.map(m => m.group_id) || []);
      }
      setGroups(groupsData || []);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchData(); 
    localStorage.setItem('campora_user_prefs', JSON.stringify(myPrefs)); 
  }, [myPrefs]);

  // --- FETCH GROUP MEMBERS & REALTIME CHAT (MEMBERS ONLY) ---
  useEffect(() => {
    if (!selectedGroup || (view !== 'details' && view !== 'chat')) return;

    const isMember = joinedGroupIds.includes(selectedGroup.id) || selectedGroup.creator_id === currentUser?.id;

    const fetchMembers = async () => {
      const { data } = await supabase
        .from('group_members')
        .select('user_id, profiles(full_name, major, email)')
        .eq('group_id', selectedGroup.id);
      
      setGroupMembers(data || []);
    };

    fetchMembers();

    if (isMember) {
      const fetchMessages = async () => {
        const { data } = await supabase
          .from('group_messages')
          .select('*')
          .eq('group_id', selectedGroup.id)
          .order('created_at', { ascending: true });
        setMessages(data || []);
      };

      fetchMessages();

      const channel = supabase
        .channel(`public:group_messages:group_id=eq.${selectedGroup.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'group_messages',
          filter: `group_id=eq.${selectedGroup.id}`
        }, (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setMessages([]);
    }
  }, [selectedGroup, view, joinedGroupIds, currentUser]);

  useEffect(() => {
    if (view === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, view]);

  const toggleNotifications = (groupId) => {
    setNotificationsMuted((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // --- GROUP ACTIONS ---
  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('study_groups')
      .insert([{ ...newGroup, creator_id: user.id }])
      .select();

    if (!error && data) {
      await supabase.from('group_members').insert([{ group_id: data[0].id, user_id: user.id }]);
      setView('created'); 
      fetchData();
    }
    setActionLoading(false);
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    if (!editingGroup) return;
    setActionLoading(true);

    const { error } = await supabase
      .from('study_groups')
      .update({
        name: editingGroup.name,
        major: editingGroup.major,
        goal: editingGroup.goal,
        environment: editingGroup.environment,
        mode: editingGroup.mode,
        max_size: editingGroup.max_size,
        description: editingGroup.description,
        color: editingGroup.color
      })
      .eq('id', editingGroup.id);

    if (!error) {
      setSelectedGroup(editingGroup);
      setEditingGroup(null);
      fetchData();
    }
    setActionLoading(false);
  };

  const handleDeleteGroup = async (groupId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this study group? This action cannot be undone.")) return;

    setActionLoading(true);
    await supabase.from('group_messages').delete().eq('group_id', groupId);
    await supabase.from('group_members').delete().eq('group_id', groupId);
    const { error } = await supabase.from('study_groups').delete().eq('id', groupId);

    if (!error) {
      if (selectedGroup?.id === groupId) {
        setView('browse');
        setSelectedGroup(null);
      }
      fetchData();
    }
    setActionLoading(false);
  };

  const handleJoin = async (groupId) => {
    setActionLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('group_members').insert([{ group_id: groupId, user_id: user.id }]);
    await fetchData(); 
    setActionLoading(false); 
    setView('joined');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroup || !currentUser) return;

    const senderName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || "Student";

    const messageData = {
      group_id: selectedGroup.id,
      user_id: currentUser.id,
      sender_name: senderName,
      content: newMessage.trim()
    };

    setNewMessage('');
    await supabase.from('group_messages').insert([messageData]);
  };

  // --- MATCHMAKING ENGINE ---
  const calculateMatch = (group) => {
    let score = 0;
    if (group.major === "All Majors Welcome" || group.major === myPrefs.major) score += 30;
    if (group.goal === myPrefs.goal) score += 20;
    if (group.environment === myPrefs.env) score += 20;
    if (group.study_style === myPrefs.style) score += 15;
    if (group.mode === myPrefs.mode) score += 15;
    return Math.min(score, 100);
  };

  const discoverGroups = groups.filter(g => 
    (g.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (g.subject || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.major || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createdGroups = groups.filter(g => g.creator_id === currentUser?.id);
  const joinedOnlyGroups = groups.filter(g => joinedGroupIds.includes(g.id) && g.creator_id !== currentUser?.id);

  // --- STYLES ---
  const cardStyle = {
    padding: '24px',
    borderRadius: '24px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    justify: 'space-between',
    minHeight: '260px',
    border: '1px solid rgba(0,0,0,0.05)'
  };

  const tagStyle = {
    padding: '4px 10px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.8)',
    fontSize: '11px',
    fontWeight: '800',
    color: '#0B1A3F',
    textTransform: 'uppercase'
  };

  const infoLine = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#0B1A3F'
  };

  const cardBtn = {
    marginTop: '20px',
    padding: '12px',
    borderRadius: '14px',
    border: 'none',
    background: '#0B1A3F',
    color: 'white',
    fontWeight: '800',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };

  const iconBtnStyle = {
    background: 'rgba(255,255,255,0.7)',
    border: 'none',
    padding: '8px',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const activeTab = {
    padding: '10px 18px',
    borderRadius: '12px',
    border: 'none',
    background: '#0B1A3F',
    color: 'white',
    fontWeight: '800',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const inactiveTab = {
    padding: '10px 18px',
    borderRadius: '12px',
    border: 'none',
    background: '#F4F7FE',
    color: '#A3AED0',
    fontWeight: '800',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const addBtnStyle = {
    padding: '12px 22px',
    borderRadius: '16px',
    border: 'none',
    background: '#0B1A3F',
    color: 'white',
    fontWeight: '900',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 8px 16px rgba(11, 26, 63, 0.2)'
  };

  const searchBarContainer = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'white',
    padding: '12px 20px',
    borderRadius: '18px',
    border: '1.5px solid #E9EDF7',
    marginBottom: '30px'
  };

  const searchField = {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontWeight: '700',
    fontSize: '14px',
    color: '#0B1A3F'
  };

  const formSectionStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  };

  const labelStyle = {
    fontSize: '11px',
    fontWeight: '900',
    color: '#A3AED0',
    letterSpacing: '0.5px'
  };

  const inputStyle = {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1.5px solid #E2E8F0',
    fontSize: '14px',
    fontWeight: '700',
    color: '#0B1A3F',
    outline: 'none',
    background: '#F8FAFC'
  };

  const chipGridStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  };

  const chipStyle = {
    padding: '8px 16px',
    borderRadius: '10px',
    border: '1.5px solid #E2E8F0',
    background: '#F8FAFC',
    color: '#64748B',
    fontSize: '12px',
    fontWeight: '800',
    cursor: 'pointer'
  };

  const activeChipStyle = {
    ...chipStyle,
    background: '#0B1A3F',
    color: 'white',
    borderColor: '#0B1A3F'
  };

  const saveBtn = {
    padding: '14px 24px',
    borderRadius: '14px',
    border: 'none',
    background: '#0B1A3F',
    color: 'white',
    fontWeight: '900',
    fontSize: '14px',
    cursor: 'pointer'
  };

  const backBtn = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: 'none',
    background: 'none',
    color: '#A3AED0',
    fontWeight: '800',
    cursor: 'pointer',
    fontSize: '13px'
  };

  const overlay = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(11, 26, 63, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  };

  const GroupCard = ({ group, buttonLabel }) => {
    const match = calculateMatch(group);
    const count = group.group_members?.[0]?.count || 1;
    const isCreator = group.creator_id === currentUser?.id;

    return (
      <div className="card" onClick={() => { setSelectedGroup(group); setView('details'); }} 
           style={{ ...cardStyle, background: group.color }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={tagStyle}>{group.major}</span>
              {isCreator && (
                <span style={{ ...tagStyle, background: '#0B1A3F', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Crown size={10} /> Creator
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '9px', fontWeight: '900', color: '#0B1A3F', opacity: 0.5 }}>COMPATIBILITY</p>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#0B1A3F' }}>{match}%</p>
              </div>
              {isCreator && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingGroup(group); }} 
                    style={iconBtnStyle} 
                    title="Edit Circle"
                  >
                    <Edit3 size={14} color="#0B1A3F" />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteGroup(group.id, e)} 
                    style={{ ...iconBtnStyle, background: '#FEE2E2' }} 
                    title="Delete Circle"
                  >
                    <Trash2 size={14} color="#B91C1C" />
                  </button>
                </div>
              )}
            </div>
        </div>
        <h2 style={{ fontSize: '26px', margin: '15px 0', color: '#0B1A3F', fontWeight: '900' }}>{group.name}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.8 }}>
            <div style={infoLine}><Target size={14}/> {group.goal}</div>
            <div style={infoLine}><Volume2 size={14}/> {group.environment}</div>
            <div style={infoLine}><Users size={14}/> {count} / {group.max_size} Members</div>
        </div>
        <button style={cardBtn}>
          {buttonLabel} <ArrowRight size={16}/>
        </button>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.4s ease', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* HEADER & TOP NAV TABS */}
      {view !== 'chat' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#0B1A3F', margin: 0 }}>Study Groups</h1>
            <div style={{ display: 'flex', gap: '20px', marginTop: '15px', flexWrap: 'wrap' }}>
                <button onClick={() => setView('browse')} style={view === 'browse' ? activeTab : inactiveTab}>
                  <LayoutGrid size={16} /> Discover
                </button>
                <button onClick={() => setView('created')} style={view === 'created' ? activeTab : inactiveTab}>
                  <Crown size={16} /> Circles I Created ({createdGroups.length})
                </button>
                <button onClick={() => setView('joined')} style={view === 'joined' ? activeTab : inactiveTab}>
                  <BookmarkCheck size={16} /> Joined Circles ({joinedOnlyGroups.length})
                </button>
                <button onClick={() => setView('preferences')} style={view === 'preferences' ? activeTab : inactiveTab}>
                  <Sliders size={16} /> My Vibe Settings
                </button>
            </div>
          </div>
          <button onClick={() => setView('create')} style={addBtnStyle}>
            <Plus size={22} strokeWidth={3} /> Create Circle
          </button>
        </div>
      )}

      {/* VIEW: CREATED GROUPS */}
      {view === 'created' && (
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0B1A3F', marginBottom: '20px' }}>
            Circles Created By Me
          </h2>
          {createdGroups.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '30px' }}>
              {createdGroups.map(g => (
                <GroupCard key={g.id} group={g} buttonLabel="Open Circle Details" />
              ))}
            </div>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '30px', border: '2px dashed #E9EDF7' }}>
              <p style={{ color: '#A3AED0', fontWeight: '800', fontSize: '16px', margin: '0 0 20px 0' }}>You haven't created any study circles yet.</p>
              <button onClick={() => setView('create')} style={{ ...addBtnStyle, margin: 'auto' }}>
                <Plus size={18} /> Create Your First Circle
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW: JOINED GROUPS */}
      {view === 'joined' && (
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0B1A3F', marginBottom: '20px' }}>
            Circles I've Joined
          </h2>
          {joinedOnlyGroups.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '30px' }}>
              {joinedOnlyGroups.map(g => (
                <GroupCard key={g.id} group={g} buttonLabel="Open Circle Details" />
              ))}
            </div>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '30px', border: '2px dashed #E9EDF7' }}>
              <p style={{ color: '#A3AED0', fontWeight: '800', fontSize: '16px', margin: '0 0 20px 0' }}>You haven't joined any study groups yet.</p>
              <button onClick={() => setView('browse')} style={{ ...addBtnStyle, margin: 'auto' }}>
                Explore Available Circles
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW: PREFERENCES */}
      {view === 'preferences' && (
        <div style={{ maxWidth: '750px', margin: '0 auto', background: '#FFFFFF', borderRadius: '28px', border: '1px solid #E2E8F0', padding: '40px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: '#0B1A3F' }}>Your Ideal Study Vibe</h2>
            <p style={{ color: '#64748B', fontWeight: '600', marginTop: '6px', fontSize: '15px' }}>Customize your parameters so we can match you with compatible study circles.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div style={formSectionStyle}>
              <label style={labelStyle}>YOUR MAJOR</label>
              <select style={inputStyle} value={myPrefs.major} onChange={e => setMyPrefs({...myPrefs, major: e.target.value})}>
                {MAJORS_PREFERENCES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div style={formSectionStyle}>
              <label style={labelStyle}>PRIMARY STUDY GOAL</label>
              <div style={chipGridStyle}>
                {STUDY_GOALS.map(goal => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setMyPrefs({ ...myPrefs, goal })}
                    style={myPrefs.goal === goal ? activeChipStyle : chipStyle}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            <div style={formSectionStyle}>
              <label style={labelStyle}>PREFERRED NOISE LEVEL</label>
              <div style={chipGridStyle}>
                {NOISE_LEVELS.map(env => (
                  <button
                    key={env}
                    type="button"
                    onClick={() => setMyPrefs({ ...myPrefs, env })}
                    style={myPrefs.env === env ? activeChipStyle : chipStyle}
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>

            <div style={formSectionStyle}>
              <label style={labelStyle}>STUDY LOCATION PREFERENCE</label>
              <div style={chipGridStyle}>
                {STUDY_MODES.map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setMyPrefs({ ...myPrefs, mode })}
                    style={myPrefs.mode === mode ? activeChipStyle : chipStyle}
                  >
                    {mode === 'In-person' ? 'On Campus' : 'Online / Zoom'}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setView('browse')} style={{ ...saveBtn, marginTop: '10px' }}>
              Save Vibe & View Matches
            </button>
          </div>
        </div>
      )}

      {/* VIEW: CREATE */}
      {view === 'create' && (
        <div style={{ maxWidth: '800px', margin: '0 auto', background: '#FFFFFF', borderRadius: '28px', border: '1px solid #E2E8F0', padding: '40px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
          <button onClick={() => setView('browse')} style={backBtn}><ArrowLeft size={16}/> Back to Discover</button>
          
          <div style={{ margin: '20px 0 30px 0' }}>
            <h2 style={{ margin: 0, fontWeight: '900', fontSize: '30px', color: '#0B1A3F' }}>Launch a Study Circle</h2>
            <p style={{ color: '#64748B', fontWeight: '600', marginTop: '6px', fontSize: '15px' }}>Setup a new group and start collaborating with peers.</p>
          </div>

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={formSectionStyle}>
                <label style={labelStyle}>CIRCLE NAME</label>
                <input type="text" placeholder="e.g. Psychology Finals Prep" required style={inputStyle} value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} />
              </div>
              <div style={formSectionStyle}>
                <label style={labelStyle}>MAJOR / FIELD</label>
                <select style={inputStyle} value={newGroup.major} onChange={e => setNewGroup({...newGroup, major: e.target.value})}>
                  {MAJORS_CREATION.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={formSectionStyle}>
                <label style={labelStyle}>MAX CAPACITY</label>
                <select style={inputStyle} value={newGroup.max_size} onChange={e => setNewGroup({...newGroup, max_size: parseInt(e.target.value)})}>
                  {[2,3,4,5,6,8,10,12,15,20].map(n => <option key={n} value={n}>{n} People</option>)}
                </select>
              </div>
              <div style={formSectionStyle}>
                <label style={labelStyle}>FORMAT</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {STUDY_MODES.map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setNewGroup({ ...newGroup, mode })}
                      style={newGroup.mode === mode ? activeChipStyle : chipStyle}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={formSectionStyle}>
              <label style={labelStyle}>STUDY GOAL</label>
              <div style={chipGridStyle}>
                {STUDY_GOALS.map(goal => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setNewGroup({ ...newGroup, goal })}
                    style={newGroup.goal === goal ? activeChipStyle : chipStyle}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            <div style={formSectionStyle}>
              <label style={labelStyle}>NOISE VIBE</label>
              <div style={chipGridStyle}>
                {NOISE_LEVELS.map(env => (
                  <button
                    key={env}
                    type="button"
                    onClick={() => setNewGroup({ ...newGroup, environment: env })}
                    style={newGroup.environment === env ? activeChipStyle : chipStyle}
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>

            <div style={formSectionStyle}>
              <label style={labelStyle}>DESCRIPTION & RULES</label>
              <textarea 
                placeholder="Tell everyone how you'll study, where to meet, and what to bring..." 
                style={{ ...inputStyle, height: '110px', resize: 'vertical' }} 
                value={newGroup.description}
                onChange={e => setNewGroup({...newGroup, description: e.target.value})} 
              />
            </div>

            <div style={formSectionStyle}>
              <label style={labelStyle}>CIRCLE THEME COLOR</label>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                 {pastelColors.map(c => (
                   <button
                     type="button"
                     key={c.bg} 
                     onClick={() => setNewGroup({...newGroup, color: c.bg})} 
                     style={{ 
                       width: '44px', 
                       height: '44px', 
                       borderRadius: '50%', 
                       background: c.bg, 
                       cursor: 'pointer', 
                       border: newGroup.color === c.bg ? '3px solid #0B1A3F' : '1px solid #CBD5E1',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       boxShadow: newGroup.color === c.bg ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                       transition: 'all 0.2s ease'
                     }}
                   >
                     {newGroup.color === c.bg && <Check size={18} color="#0B1A3F" strokeWidth={3} />}
                   </button>
                 ))}
              </div>
            </div>

            <button type="submit" disabled={actionLoading} style={{ ...saveBtn, marginTop: '10px' }}>
              Confirm & Launch Circle
            </button>
          </form>
        </div>
      )}

      {/* DISCOVER GRID */}
      {view === 'browse' && (
        <>
          <div style={searchBarContainer}>
            <Search size={20} color="#A3AED0" />
            <input type="text" placeholder="Search major, goal or name..." style={searchField} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '30px' }}>
            {discoverGroups.map(g => (
              <GroupCard 
                key={g.id} 
                group={g} 
                buttonLabel="View Details" 
              />
            ))}
          </div>
        </>
      )}

      {/* VIEW: GROUP DETAILS */}
      {view === 'details' && selectedGroup && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <button onClick={() => setView('browse')} style={{ ...backBtn, marginBottom: '20px' }}><ArrowLeft size={16}/> Back to Discover</button>
          
          <div style={{ background: 'white', borderRadius: '28px', border: '1px solid #E2E8F0', padding: '36px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ ...tagStyle, background: selectedGroup.color }}>{selectedGroup.major}</span>
                <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0B1A3F', margin: '12px 0 6px 0' }}>{selectedGroup.name}</h1>
                <p style={{ color: '#64748B', fontWeight: '600', margin: 0 }}>{selectedGroup.description || 'No description provided.'}</p>
              </div>

              {joinedGroupIds.includes(selectedGroup.id) || selectedGroup.creator_id === currentUser?.id ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => toggleNotifications(selectedGroup.id)} 
                    style={{ ...iconBtnStyle, background: '#F4F7FE', border: '1px solid #E2E8F0' }}
                    title={notificationsMuted[selectedGroup.id] ? "Unmute Notifications" : "Mute Notifications"}
                  >
                    {notificationsMuted[selectedGroup.id] ? <BellOff size={18} color="#94A3B8" /> : <Bell size={18} color="#0B1A3F" />}
                  </button>
                  <button onClick={() => setView('chat')} style={addBtnStyle}>
                    <MessageSquare size={18} /> Open Group Chat
                  </button>
                </div>
              ) : (
                <button onClick={() => handleJoin(selectedGroup.id)} disabled={actionLoading} style={addBtnStyle}>
                  <UserPlus size={18} /> Join Circle
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', margin: '30px 0', padding: '20px', background: '#F8FAFC', borderRadius: '18px' }}>
              <div>
                <span style={labelStyle}>GOAL</span>
                <p style={{ margin: '4px 0 0 0', fontWeight: '800', color: '#0B1A3F', fontSize: '14px' }}>{selectedGroup.goal}</p>
              </div>
              <div>
                <span style={labelStyle}>VIBE</span>
                <p style={{ margin: '4px 0 0 0', fontWeight: '800', color: '#0B1A3F', fontSize: '14px' }}>{selectedGroup.environment}</p>
              </div>
              <div>
                <span style={labelStyle}>FORMAT</span>
                <p style={{ margin: '4px 0 0 0', fontWeight: '800', color: '#0B1A3F', fontSize: '14px' }}>{selectedGroup.mode}</p>
              </div>
            </div>

            {!(joinedGroupIds.includes(selectedGroup.id) || selectedGroup.creator_id === currentUser?.id) && (
              <div style={{ marginTop: '30px', padding: '24px', background: '#FFFBEB', borderRadius: '18px', border: '1px solid #FCD34D', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <Lock size={28} color="#D97706" />
                <h4 style={{ margin: 0, color: '#92400E', fontSize: '16px', fontWeight: '900' }}>Chat Messages Are Protected</h4>
                <p style={{ margin: 0, color: '#B45309', fontSize: '13px', fontWeight: '600', maxWidth: '420px' }}>
                  You must join this circle to view active group discussions and participate in meetings.
                </p>
                <button onClick={() => handleJoin(selectedGroup.id)} disabled={actionLoading} style={{ ...saveBtn, marginTop: '10px', background: '#D97706' }}>
                  Join Circle to Unlock Chat
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: FULL SCREEN CHAT */}
      {view === 'chat' && selectedGroup && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <button onClick={() => setView('details')} style={{ ...backBtn, marginBottom: '16px' }}>
            <ArrowLeft size={16}/> Back to Group Details
          </button>

          <div style={{
            background: selectedGroup.color || '#E0F2FE',
            borderRadius: '28px',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            padding: '28px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            height: '680px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '18px', borderBottom: '1px solid rgba(11, 26, 63, 0.1)' }}>
              <div>
                <span style={{ ...tagStyle, background: 'rgba(255,255,255,0.9)' }}>{selectedGroup.major}</span>
                <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0B1A3F', margin: '6px 0 0 0' }}>
                  {selectedGroup.name}
                </h2>
              </div>
              <button 
                onClick={() => toggleNotifications(selectedGroup.id)} 
                style={{ ...iconBtnStyle, background: 'white' }}
                title={notificationsMuted[selectedGroup.id] ? "Unmute Notifications" : "Mute Notifications"}
              >
                {notificationsMuted[selectedGroup.id] ? <BellOff size={18} color="#94A3B8" /> : <Bell size={18} color="#0B1A3F" />}
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {messages.length > 0 ? (
                messages.map((m) => (
                  <div key={m.id} style={{ alignSelf: m.user_id === currentUser?.id ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#0B1A3F', opacity: 0.6, marginLeft: '4px', display: 'block', marginBottom: '2px' }}>
                      {m.sender_name}
                    </span>
                    <div style={{ 
                      background: m.user_id === currentUser?.id ? '#0B1A3F' : '#FFFFFF', 
                      color: m.user_id === currentUser?.id ? '#FFFFFF' : '#0B1A3F', 
                      padding: '12px 18px', 
                      borderRadius: '18px', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)' 
                    }}>
                      {m.content}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.6 }}>
                  <MessageSquare size={36} color="#0B1A3F" style={{ marginBottom: '8px' }} />
                  <p style={{ color: '#0B1A3F', fontWeight: '800', fontSize: '14px', margin: 0 }}>No messages in this circle yet.</p>
                  <p style={{ color: '#0B1A3F', fontSize: '12px', margin: '4px 0 0 0' }}>Say hi to start the conversation!</p>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid rgba(11, 26, 63, 0.1)' }}>
              <input 
                type="text" 
                placeholder="Message your circle..." 
                style={{ ...inputStyle, flex: 1, background: '#FFFFFF', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
              />
              <button type="submit" style={{ ...saveBtn, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Send <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL - FULLY SYNCED WITH ALL CREATION OPTIONS */}
      {editingGroup && (
        <div style={overlay}>
          <div style={{ width: '700px', maxHeight: '90vh', overflowY: 'auto', background: 'white', borderRadius: '24px', padding: '36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, color: '#0B1A3F', fontSize: '24px', fontWeight: '900' }}>Edit Study Circle</h2>
                <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '13px', fontWeight: '600' }}>Update your circle's settings and preferences.</p>
              </div>
              <X style={{ cursor: 'pointer' }} onClick={() => setEditingGroup(null)} color="#0B1A3F" />
            </div>

            <form onSubmit={handleUpdateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={formSectionStyle}>
                  <label style={labelStyle}>CIRCLE NAME</label>
                  <input style={inputStyle} value={editingGroup.name} onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })} required />
                </div>
                <div style={formSectionStyle}>
                  <label style={labelStyle}>MAJOR / FIELD</label>
                  <select style={inputStyle} value={editingGroup.major} onChange={e => setEditingGroup({ ...editingGroup, major: e.target.value })}>
                    {MAJORS_CREATION.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={formSectionStyle}>
                  <label style={labelStyle}>MAX CAPACITY</label>
                  <select style={inputStyle} value={editingGroup.max_size} onChange={e => setEditingGroup({ ...editingGroup, max_size: parseInt(e.target.value) })}>
                    {[2,3,4,5,6,8,10,12,15,20].map(n => <option key={n} value={n}>{n} People</option>)}
                  </select>
                </div>
                <div style={formSectionStyle}>
                  <label style={labelStyle}>FORMAT</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {STUDY_MODES.map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setEditingGroup({ ...editingGroup, mode })}
                        style={editingGroup.mode === mode ? activeChipStyle : chipStyle}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={formSectionStyle}>
                <label style={labelStyle}>STUDY GOAL</label>
                <div style={chipGridStyle}>
                  {STUDY_GOALS.map(goal => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => setEditingGroup({ ...editingGroup, goal })}
                      style={editingGroup.goal === goal ? activeChipStyle : chipStyle}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>

              <div style={formSectionStyle}>
                <label style={labelStyle}>NOISE VIBE</label>
                <div style={chipGridStyle}>
                  {NOISE_LEVELS.map(env => (
                    <button
                      key={env}
                      type="button"
                      onClick={() => setEditingGroup({ ...editingGroup, environment: env })}
                      style={editingGroup.environment === env ? activeChipStyle : chipStyle}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>

              <div style={formSectionStyle}>
                <label style={labelStyle}>DESCRIPTION & RULES</label>
                <textarea 
                  style={{ ...inputStyle, height: '90px', resize: 'vertical' }} 
                  value={editingGroup.description || ''} 
                  onChange={e => setEditingGroup({ ...editingGroup, description: e.target.value })} 
                />
              </div>

              <div style={formSectionStyle}>
                <label style={labelStyle}>CIRCLE THEME COLOR</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                  {pastelColors.map(c => (
                    <button
                      type="button"
                      key={c.bg} 
                      onClick={() => setEditingGroup({ ...editingGroup, color: c.bg })} 
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        background: c.bg, 
                        cursor: 'pointer', 
                        border: editingGroup.color === c.bg ? '3px solid #0B1A3F' : '1px solid #CBD5E1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: editingGroup.color === c.bg ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {editingGroup.color === c.bg && <Check size={16} color="#0B1A3F" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={actionLoading} style={{ ...saveBtn, marginTop: '10px' }}>
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}