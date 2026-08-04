import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, X, Clock, 
  Bell, BookOpen, CheckSquare, AlertCircle, 
  Edit3, Calendar as CalIcon, StickyNote, RefreshCw, CheckCircle2, Trash2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Planner() {
  // --- STATE ---
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewType, setViewType] = useState('Month'); 
  const [deleteConfirmation, setDeleteConfirmation] = useState(null); 

  const [stickyText, setStickyText] = useState(() => localStorage.getItem('campora_sticky_text') || "");
  const [stickyColor, setStickyColor] = useState(() => localStorage.getItem('campora_sticky_color') || "#FFEDD5");

  const [newEntry, setNewEntry] = useState({
    name: '', date: '', 
    type: 'Class', start_time: '09:00', end_time: '10:00',
    color: '#E0F2FE', repeat: 'none' 
  });

  const pastelColors = [
    { bg: '#E0F2FE', text: '#0369A1' }, { bg: '#FCE7F3', text: '#BE185D' },
    { bg: '#F3E8FF', text: '#7E22CE' }, { bg: '#DCFCE7', text: '#15803D' },
    { bg: '#FEE2E2', text: '#B91C1C' }, { bg: '#FFEDD5', text: '#C2410C' }
  ];

  useEffect(() => {
    localStorage.setItem('campora_sticky_text', stickyText);
    localStorage.setItem('campora_sticky_color', stickyColor);
  }, [stickyText, stickyColor]);

  const fetchCourses = async () => {
    setLoading(true);
    const { data } = await supabase.from('planner_courses').select('*').order('start_time', { ascending: true });
    setCourses(data || []);
    setLoading(false);
  };
  useEffect(() => { fetchCourses(); }, []);

  // --- FIX 1: ADD ON CLICKED DATE ---
  const handleOpenModal = (dateStr) => {
    setNewEntry({
      ...newEntry,
      name: '',
      date: dateStr, 
      repeat: 'none'
    });
    setIsModalOpen(true);
  };

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    let entriesToSave = [];
    const groupId = crypto.randomUUID(); // Series identifier
    
    const toDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const cleanEntry = (date, isRecurring) => {
        const { repeat, ...dataForDb } = newEntry; 
        return { ...dataForDb, date, group_id: isRecurring ? groupId : null };
    };

    if (newEntry.type === 'Class' && newEntry.repeat !== 'none') {
      const targetDays = newEntry.repeat === 'MWF' ? [1, 3, 5] : [2, 4];
      let [y, m, d] = newEntry.date.split('-').map(Number);
      let current = new Date(y, m - 1, d);
      const limit = new Date(current); 
      limit.setMonth(limit.getMonth() + 3);

      while (current <= limit) {
        if (targetDays.includes(current.getDay())) {
          entriesToSave.push(cleanEntry(toDateString(current), true));
        }
        current.setDate(current.getDate() + 1);
      }
    } else {
      entriesToSave.push(cleanEntry(newEntry.date, false));
    }

const { data: savedEntries, error: plannerError } = await supabase
  .from('planner_courses')
  .insert(entriesToSave)
  .select();

if (plannerError) {
  console.error('Could not save planner entries:', plannerError);
  alert('Could not save the planner entry.');
  return;
}

const {
  data: { user },
  error: userError
} = await supabase.auth.getUser();

if (userError || !user) {
  console.error('Could not identify the signed-in user:', userError);
  alert('You must be signed in to create reminders.');
  return;
}

const reminderTypeMap = {
  Class: 'class',
  Task: 'personal',
  Exam: 'exam'
};

const remindersToSave = savedEntries.map((entry) => ({
  profile_id: user.id,
  title: entry.name,
  description: `${entry.type} scheduled from ${entry.start_time} to ${entry.end_time}`,
  reminder_type: reminderTypeMap[entry.type] || 'personal',
  source_id: entry.id,
  remind_at: new Date(
    `${entry.date}T${entry.start_time}`
  ).toISOString(),
  status: 'pending'
}));

const { error: reminderError } = await supabase
  .from('reminders')
  .insert(remindersToSave);

if (reminderError) {
  console.error('Could not generate reminders:', reminderError);
  alert('The planner entry was saved, but its reminder could not be created.');
}    setIsModalOpen(false);
    fetchCourses();
  };

  // --- FIX 2: RECURRING DELETE OPTIONS ---
  const requestDelete = (ev) => {
    if (ev.group_id) {
        setDeleteConfirmation(ev); // Show the choice modal
    } else {
        if(window.confirm("Delete this event?")) executeDelete(ev.id, false);
    }
  };

  const executeDelete = async (id, deleteAllInSeries, groupId = null) => {
    let query = supabase.from('planner_courses').delete();
    
    if (deleteAllInSeries && groupId) {
        query = query.eq('group_id', groupId);
    } else {
        query = query.eq('id', id);
    }

    const { error } = await query;
    if (!error) {
        setDeleteConfirmation(null);
        fetchCourses();
    }
  };

  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDayEvents = courses.filter(c => c.date === formatDate(selectedDate));
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // View Switching Logic
  const getDatesToDisplay = () => {
    if (viewType === 'Month') {
      const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
      const count = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
      const dateArray = Array.from({ length: count }, (_, i) => new Date(viewDate.getFullYear(), viewDate.getMonth(), i + 1));
      return { startPadding: start, dateArray };
    }
    if (viewType === 'Week') {
      const curr = new Date(selectedDate);
      const first = curr.getDate() - curr.getDay();
      const dateArray = Array.from({ length: 7 }, (_, i) => new Date(curr.getFullYear(), curr.getMonth(), first + i));
      return { startPadding: 0, dateArray };
    }
    return { startPadding: 0, dateArray: [selectedDate] };
  };

  const { startPadding, dateArray } = getDatesToDisplay();

  return (
    <div style={{ display: 'flex', gap: '30px', width: '100%', height: 'calc(100vh - 160px)', overflow: 'hidden' }}>
      
      {/* LEFT: CALENDAR AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0B1A3F', margin: 0 }}>
            {viewType === 'Month' ? viewDate.toLocaleString('default', { month: 'long', year: 'numeric' }) : "Schedule Focus"}
          </h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={switcherGroup}>
              {['Month', 'Week', 'Day'].map(v => (
                <button key={v} onClick={() => setViewType(v)} style={viewType === v ? activeToggle : toggleStyle}>{v}</button>
              ))}
            </div>
            <button onClick={() => { const n = new Date(); setViewDate(n); setSelectedDate(n); }} style={navBtn}>Today</button>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} style={navBtn}><ChevronLeft size={18}/></button>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} style={navBtn}><ChevronRight size={18}/></button>
          </div>
        </div>

        <div className="card" style={{ flex: 1, padding: '25px', position: 'relative', border: '1.5px solid #E9EDF7', overflowY: 'auto' }}>
          {loading && <RefreshCw className="animate-spin" style={{ position: 'absolute', top: '50%', left: '50%', color: '#0B1A3F', zIndex: 20 }} />}
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: viewType === 'Day' ? '1fr' : 'repeat(7, 1fr)', 
            gridAutoRows: viewType === 'Day' ? '500px' : '125px', 
            gap: '12px' 
          }}>
            {viewType !== 'Day' && days.map(d => <div key={d} style={dayHeader}>{d.toUpperCase()}</div>)}
            {viewType === 'Month' && [...Array(startPadding)].map((_, i) => <div key={i} />)}
            
            {dateArray.map((dateObj, idx) => {
              const dateStr = formatDate(dateObj);
              const isSelected = dateStr === formatDate(selectedDate);
              const dayEvents = courses.filter(c => c.date === dateStr);
              return (
                <div key={idx} onClick={() => setSelectedDate(dateObj)} style={{
                    height: '125px', padding: '12px', borderRadius: '15px', cursor: 'pointer', transition: '0.2s',
                    border: isSelected ? '2px solid #0B1A3F' : '1px solid #F1F4F9',
                    background: isSelected ? '#F8FAFF' : 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minHeight: '26px' }}>
                    <div style={{ minWidth: '26px' }}> 
                      {isSelected && (
                        <button onClick={(e) => { e.stopPropagation(); handleOpenModal(dateStr); }} style={cellAddIcon}>
                          <Plus size={14} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                    <span style={{ fontWeight: '900', color: '#0B1A3F', fontSize: '15px' }}>{dateObj.getDate()}</span>
                  </div>
                  <div style={{ flex: 1, marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden' }}>
                    {dayEvents.slice(0, 3).map(ev => (
                      <div key={ev.id} style={{ background: ev.is_completed ? '#eee' : ev.color, fontSize: '9px', fontWeight: '900', padding: '4px 6px', borderRadius: '6px', color: '#0B1A3F', textDecoration: ev.is_completed ? 'line-through' : 'none', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{opacity: 0.6, marginRight: '4px'}}>{ev.start_time.substring(0, 5)}</span>
                        {ev.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div style={{ width: '340px', display: 'flex', flexDirection: 'column', gap: '20px', flexShrink: 0 }}>
        <div className="card" style={{ height: '380px', display: 'flex', flexDirection: 'column', border: '1.5px solid #E9EDF7', overflow: 'hidden' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0B1A3F' }}>Agenda</h3>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#A3AED0', marginBottom: '15px' }}>{selectedDate.toDateString()}</p>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {selectedDayEvents.length > 0 ? selectedDayEvents.map(ev => (
              <div key={ev.id} style={{ padding: '12px', borderRadius: '15px', background: ev.is_completed ? '#F8FAFF' : ev.color, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '900', fontSize: '14px', color: '#0B1A3F', textDecoration: ev.is_completed ? 'line-through' : 'none' }}>{ev.name}</span>
                  <span style={{ fontSize: '10px', fontWeight: '700', opacity: 0.6 }}>{ev.start_time} - {ev.end_time}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <CheckCircle2 size={16} onClick={() => supabase.from('planner_courses').update({is_completed: !ev.is_completed}).eq('id', ev.id).then(fetchCourses)} style={{ cursor: 'pointer', color: ev.is_completed ? '#05CD99' : '#A3AED0' }} />
                    <Trash2 size={16} onClick={() => requestDelete(ev)} style={{ color: '#EE5D50', cursor: 'pointer' }} />
                </div>
              </div>
            )) : <div style={{textAlign:'center', marginTop:'30px', opacity:0.3}}><CalIcon size={40}/><p>Free Day</p></div>}
          </div>
        </div>

        {/* STICKIES */}
        <div className="card" style={{ flex: 1, border: '1.5px solid #E9EDF7', display: 'flex', flexDirection: 'column', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '900', color: '#0B1A3F', margin: 0 }}>STICKIES</h4>
            <div style={{ display: 'flex', gap: '5px' }}>
              {pastelColors.map(c => (
                <div key={c.bg} onClick={() => setStickyColor(c.bg)} style={{ width: '14px', height: '14px', borderRadius: '50%', background: c.bg, cursor: 'pointer', border: stickyColor === c.bg ? '2px solid #0B1A3F' : '1px solid #ddd' }} />
              ))}
            </div>
          </div>
          <div style={{ background: stickyColor, flex: 1, padding: '18px', borderRadius: '2px 2px 35px 2px', boxShadow: '0 10px 20px -10px rgba(0,0,0,0.2)', display: 'flex' }}>
            <textarea placeholder="Sticky memo..." value={stickyText} onChange={(e) => setStickyText(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontWeight: '800', color: '#0B1A3F', fontSize: '13px', lineHeight: '1.5', fontFamily: 'inherit' }} />
          </div>
        </div>
      </div>

      {/* --- SMART DELETE MODAL --- */}
      {deleteConfirmation && (
        <div style={overlay}>
          <div className="card" style={{ width: '400px', border: '2.5px solid #0B1A3F', padding: '40px', textAlign: 'center' }}>
            <AlertCircle size={40} color="#EE5D50" style={{ marginBottom: '20px' }} />
            <h2 style={{ marginBottom: '10px', fontWeight: '900', color: '#0B1A3F' }}>Repeating Series</h2>
            <p style={{ color: '#A3AED0', fontWeight: '800', marginBottom: '30px' }}>Do you want to delete only this occurrence or the entire semester series?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button onClick={() => executeDelete(deleteConfirmation.id, false)} style={seriesBtnStyle}>Only this instance</button>
                <button onClick={() => executeDelete(deleteConfirmation.id, true, deleteConfirmation.group_id)} style={seriesBtnStyle}>Entire series</button>
                <button onClick={() => setDeleteConfirmation(null)} style={{ background: '#eee', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', color: '#0B1A3F' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* NEW ENTRY MODAL */}
      {isModalOpen && (
        <div style={overlay}>
          <div className="card" style={{ width: '420px', border: '1.5px solid #0B1A3F', padding: '40px' }}>
            <h2 style={{ marginBottom: '25px', fontWeight: '900', color: '#0B1A3F' }}>New Entry</h2>
            <form onSubmit={handleSaveEntry} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" placeholder="Title" required style={modalInput} value={newEntry.name} onChange={e => setNewEntry({...newEntry, name: e.target.value})} />
              <div style={{display: 'flex', gap: '10px'}}>
                <select style={modalInput} value={newEntry.type} onChange={e => setNewEntry({...newEntry, type: e.target.value})}><option value="Class">Class</option><option value="Task">Task</option><option value="Exam">Exam</option></select>
                <input type="date" style={modalInput} value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} />
              </div>
              {newEntry.type === 'Class' && (
                <div style={{ display: 'flex', gap: '10px', padding: '10px', background: '#F8FAFF', borderRadius: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: '900' }}>REPEAT:</span>
                  {['none', 'MWF', 'TTH'].map(r => (
                    <button type="button" key={r} onClick={() => setNewEntry({...newEntry, repeat: r})} style={{ padding: '5px 12px', borderRadius: '8px', border: 'none', fontSize: '10px', fontWeight: '900', cursor: 'pointer', background: newEntry.repeat === r ? '#0B1A3F' : '#E2E8F0', color: newEntry.repeat === r ? 'white' : '#0B1A3F' }}>{r}</button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="time" style={modalInput} value={newEntry.start_time} onChange={e => setNewEntry({...newEntry, start_time: e.target.value})} />
                <input type="time" style={modalInput} value={newEntry.end_time} onChange={e => setNewEntry({...newEntry, end_time: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {pastelColors.map(c => <div key={c.bg} onClick={() => setNewEntry({...newEntry, color: c.bg})} style={{ width: '30px', height: '30px', borderRadius: '50%', background: c.bg, cursor: 'pointer', border: newEntry.color === c.bg ? '2.5px solid #0B1A3F' : '1px solid #eee' }} />)}
              </div>
              <button type="submit" style={saveBtn}>Confirm</button>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontWeight: '900', color: '#A3AED0', cursor: 'pointer', marginTop: '10px' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Fixed Styles
const switcherGroup = { display: 'flex', background: '#F4F7FE', padding: '4px', borderRadius: '12px' };
const toggleStyle = { background: 'none', border: 'none', padding: '6px 12px', fontSize: '11px', fontWeight: '900', color: '#A3AED0', cursor: 'pointer', borderRadius: '8px' };
const activeToggle = { ...toggleStyle, background: 'white', color: '#0B1A3F', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const navBtn = { background: 'white', border: '1.5px solid #E2E8F0', padding: '6px 12px', borderRadius: '10px', fontWeight: '900', color: '#0B1A3F', cursor: 'pointer', fontSize: '12px' };
const saveBtn = { background: '#0B1A3F', border: 'none', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' };
const seriesBtnStyle = { background: '#0B1A3F', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' };
const dayHeader = { textAlign: 'center', fontWeight: '900', color: '#94A3B8', fontSize: '11px', paddingBottom: '10px' };
const cellAddIcon = { width: '26px', height: '26px', borderRadius: '50%', background: '#0B1A3F', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: '0.2s' };
const modalInput = { padding: '12px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontWeight: '800', outline: 'none', fontSize: '13px', flex: 1, color: '#0B1A3F' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(11,26,57,0.4)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };


