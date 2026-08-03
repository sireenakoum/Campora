import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, X, Clock, 
  Bell, BellOff, BookOpen, CheckSquare, AlertCircle, 
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
  const [editingEvent, setEditingEvent] = useState(null);
  const [personalNotes, setPersonalNotes] = useState("");

  const [newEntry, setNewEntry] = useState({
    name: '', date: new Date().toISOString().split('T')[0],
    type: 'Class', start_time: '09:00', end_time: '10:00',
    color: '#E0F2FE', reminder: false, is_completed: false
  });

  const pastelColors = [
    { bg: '#E0F2FE', text: '#0369A1' }, { bg: '#FCE7F3', text: '#BE185D' },
    { bg: '#F3E8FF', text: '#7E22CE' }, { bg: '#DCFCE7', text: '#15803D' },
    { bg: '#FEE2E2', text: '#B91C1C' }, { bg: '#FFEDD5', text: '#C2410C' }
  ];

  const types = [
    { id: 'Class', icon: BookOpen },
    { id: 'Task', icon: CheckSquare },
    { id: 'Exam', icon: AlertCircle }
  ];

  // --- DATABASE ACTIONS ---
  const fetchCourses = async () => {
    setLoading(true);
    const { data } = await supabase.from('planner_courses').select('*').order('start_time', { ascending: true });
    setCourses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (editingEvent) {
      await supabase.from('planner_courses').update(newEntry).eq('id', editingEvent.id);
    } else {
      await supabase.from('planner_courses').insert([newEntry]);
    }
    closeModal();
    fetchCourses();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setNewEntry({ name: '', date: new Date().toISOString().split('T')[0], type: 'Class', start_time: '09:00', end_time: '10:00', color: '#E0F2FE', reminder: false, is_completed: false });
  };

  const handleEdit = (ev) => {
    setEditingEvent(ev);
    setNewEntry(ev);
    setIsModalOpen(true);
  };

  const toggleComplete = async (ev) => {
    await supabase.from('planner_courses').update({ is_completed: !ev.is_completed }).eq('id', ev.id);
    fetchCourses();
  };

  const handleDelete = async (id) => {
    if(window.confirm("Delete this event?")) {
      await supabase.from('planner_courses').delete().eq('id', id);
      fetchCourses();
    }
  };

  const handleNoteSubmit = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      alert("Note Saved to Workspace!");
    }
  };

  const formatDate = (d) => d.toISOString().split('T')[0];
  const selectedDayEvents = courses.filter(c => c.date === formatDate(selectedDate));

  // --- DYNAMIC VIEW LOGIC ---
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
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
    <div style={{ display: 'flex', gap: '30px', width: '100%', height: 'calc(100vh - 180px)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* LEFT: CALENDAR AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0B1A3F', margin: 0 }}>
            {viewType === 'Month' ? viewDate.toLocaleString('default', { month: 'long', year: 'numeric' }) : selectedDate.toDateString()}
          </h1>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={switcherGroup}>
              {['Month', 'Week', 'Day'].map(v => (
                <button key={v} onClick={() => setViewType(v)} style={viewType === v ? activeToggle : toggle}>{v}</button>
              ))}
            </div>
            <button onClick={() => { const now = new Date(); setViewDate(now); setSelectedDate(now); }} style={navBtn}>Today</button>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} style={navBtn}><ChevronLeft size={18}/></button>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} style={navBtn}><ChevronRight size={18}/></button>
            
            <button onClick={() => setIsModalOpen(true)} style={addBtn}>
              <Plus size={18} strokeWidth={3} /> <span style={{marginLeft: '4px'}}>New</span>
            </button>
          </div>
        </div>

        <div className="card" style={{ flex: 1, padding: '30px', position: 'relative', border: '1.5px solid #E9EDF7', overflowY: 'auto' }}>
          {loading && <div style={loader}><RefreshCw className="animate-spin" /></div>}
          
          <div style={{ display: 'grid', gridTemplateColumns: viewType === 'Day' ? '1fr' : 'repeat(7, 1fr)', gap: '12px' }}>
            {viewType !== 'Day' && days.map(d => <div key={d} style={dayHeader}>{d.toUpperCase()}</div>)}
            {viewType === 'Month' && [...Array(startPadding)].map((_, i) => <div key={`pad-${i}`} />)}
            
            {dateArray.map((dateObj, idx) => {
              const dateStr = formatDate(dateObj);
              const isSelected = dateStr === formatDate(selectedDate);
              const dayEvents = courses.filter(c => c.date === dateStr);

              return (
                <div 
                  key={idx} 
                  onClick={() => { setSelectedDate(dateObj); setViewDate(dateObj); setNewEntry({...newEntry, date: dateStr}); setIsModalOpen(true); }}
                  style={{
                    height: viewType === 'Day' ? '400px' : '110px', 
                    padding: '12px', borderRadius: '16px', cursor: 'pointer', textAlign: 'right', transition: '0.2s',
                    border: isSelected ? '2.5px solid #0B1A3F' : '1px solid #F1F4F9',
                    background: isSelected ? '#F8FAFF' : 'white',
                    display: 'flex', flexDirection: 'column'
                  }}
                >
                  <span style={{ fontWeight: '800', color: '#0B1A3F', fontSize: viewType === 'Day' ? '40px' : '16px' }}>{dateObj.getDate()}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', overflow: 'hidden' }}>
                    {dayEvents.map(ev => (
                      <div key={ev.id} style={{ 
                        background: ev.is_completed ? '#f1f1f1' : ev.color, 
                        fontSize: '9px', fontWeight: '800', padding: '4px 6px', borderRadius: '6px', 
                        color: '#0B1A3F', textDecoration: ev.is_completed ? 'line-through' : 'none',
                        textAlign: 'left', whiteSpace: 'nowrap'
                      }}>
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

      {/* RIGHT: SIDEBAR */}
      <div style={{ width: '340px', display: 'flex', flexDirection: 'column' }}>
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1.5px solid #E9EDF7' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: '900', color: '#0B1A3F' }}>Day Summary</h3>
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#A3AED0', marginBottom: '25px' }}>{selectedDate.toDateString()}</p>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedDayEvents.length > 0 ? selectedDayEvents.map(ev => (
              <div key={ev.id} style={{ padding: '18px', borderRadius: '20px', background: ev.is_completed ? '#F8FAFF' : ev.color, border: '1px solid rgba(0,0,0,0.03)', opacity: ev.is_completed ? 0.6 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                   <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                     {ev.reminder && <Bell size={12} color="#0B1A3F" />}
                     <span style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', color: '#0B1A3F', opacity: 0.6 }}>{ev.type}</span>
                   </div>
                   <div style={{display: 'flex', gap: '8px'}}>
                     <CheckCircle2 size={16} onClick={() => toggleComplete(ev)} style={{cursor: 'pointer', color: ev.is_completed ? '#05CD99' : '#A3AED0'}} />
                     <Edit3 size={16} onClick={() => handleEdit(ev)} style={{cursor: 'pointer', color: '#0B1A3F'}} />
                     <Trash2 size={16} onClick={() => handleDelete(ev.id)} style={{cursor: 'pointer', color: '#EE5D50'}} />
                   </div>
                </div>
                <p style={{ margin: '0 0 8px 0', fontWeight: '800', fontSize: '15px', color: '#0B1A3F', textDecoration: ev.is_completed ? 'line-through' : 'none' }}>{ev.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '700', color: '#0B1A3F' }}>
                  <Clock size={13} /> {ev.start_time} - {ev.end_time}
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', marginTop: '40px', opacity: 0.4 }}><CalIcon size={40} /><p style={{fontSize: '12px', fontWeight: '700'}}>Nothing planned</p></div>
            )}
          </div>

          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #F4F7FE' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '900', color: '#0B1A3F', marginBottom: '10px' }}><StickyNote size={14} style={{verticalAlign: 'middle', marginRight: '5px'}}/> Personal Notes</h4>
            <textarea 
              placeholder="Press Enter to save..." 
              style={notesInput} 
              onKeyDown={handleNoteSubmit}
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div style={overlay}>
          <div className="card" style={{ width: '450px', border: '1.5px solid #0B1A3F', padding: '40px' }}>
            <h2 style={{ marginBottom: '25px', fontWeight: '900', color: '#0B1A3F' }}>{editingEvent ? 'Edit Entry' : 'New Entry'}</h2>
            <form onSubmit={handleSaveEntry} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <input type="text" placeholder="Task Name" required style={modalInput} value={newEntry.name} onChange={e => setNewEntry({...newEntry, name: e.target.value})} />
              <input type="date" style={modalInput} value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} />
              
              <div style={{display: 'flex', gap: '10px'}}>
                {types.map(t => (
                  <button key={t.id} type="button" onClick={() => setNewEntry({...newEntry, type: t.id})} style={{
                    flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid #E9EDF7', cursor: 'pointer',
                    background: newEntry.type === t.id ? '#0B1A3F' : 'white',
                    color: newEntry.type === t.id ? 'white' : '#0B1A3F'
                  }}>
                    <t.icon size={16} /> <span style={{fontSize: '10px', fontWeight: '800', display: 'block'}}>{t.id}</span>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="time" style={modalInput} value={newEntry.start_time} onChange={e => setNewEntry({...newEntry, start_time: e.target.value})} />
                <input type="time" style={modalInput} value={newEntry.end_time} onChange={e => setNewEntry({...newEntry, end_time: e.target.value})} />
              </div>

              <button type="button" onClick={() => setNewEntry({...newEntry, reminder: !newEntry.reminder})} style={{ 
                background: 'none', border: '1.5px solid #E9EDF7', padding: '10px', borderRadius: '10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '800', fontSize: '12px',
                color: newEntry.reminder ? '#4318FF' : '#A3AED0'
              }}>
                {newEntry.reminder ? <Bell size={16}/> : <BellOff size={16}/>}
                {newEntry.reminder ? 'Notification Enabled' : 'No Reminders'}
              </button>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {pastelColors.map(c => <div key={c.bg} onClick={() => setNewEntry({...newEntry, color: c.bg})} style={{ width: '30px', height: '30px', borderRadius: '50%', background: c.bg, cursor: 'pointer', border: newEntry.color === c.bg ? '2.5px solid #0B1A3F' : '1px solid #eee' }} />)}
              </div>
              <button type="submit" style={addBtn}>{editingEvent ? 'Update Event' : 'Confirm Event'}</button>
              <button type="button" onClick={closeModal} style={{ background: 'none', border: 'none', fontWeight: '900', color: '#A3AED0', cursor: 'pointer', marginTop: '10px' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES ---
const switcherGroup = { display: 'flex', background: '#F4F7FE', padding: '4px', borderRadius: '12px' };
const toggle = { background: 'none', border: 'none', padding: '6px 12px', fontSize: '11px', fontWeight: '700', color: '#A3AED0', cursor: 'pointer', borderRadius: '8px' };
const activeToggle = { ...toggle, background: 'white', color: '#0B1A3F', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const navBtn = { background: 'white', border: '1px solid #E9EDF7', padding: '8px 12px', borderRadius: '10px', fontWeight: '700', color: '#0B1A3F', cursor: 'pointer', fontSize: '12px' };
const addBtn = { background: '#0B1A3F', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const dayHeader = { textAlign: 'center', fontWeight: '800', color: '#94A3B8', fontSize: '11px', paddingBottom: '10px' };
const notesInput = { width: '100%', height: '100px', borderRadius: '12px', border: '1px solid #E9EDF7', padding: '12px', fontSize: '12px', outline: 'none', background: '#F8FAFF', fontWeight: '600', color: '#0B1A3F', resize: 'none' };
const modalInput = { padding: '12px', borderRadius: '10px', border: '1.5px solid #E9EDF7', fontWeight: '700', outline: 'none', fontSize: '13px', background: 'white', color: '#0B1A3F' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(11,26,63,0.3)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const loader = { position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.8)', borderRadius: '24px', zIndex: 10 };