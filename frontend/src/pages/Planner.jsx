import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, X, Loader2, Clock, 
  Bell, BellOff, BookOpen, CheckSquare, AlertCircle, 
  CheckCircle2, Circle 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Planner() {
  const [viewDate, setViewDate] = useState(new Date());
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newEntry, setNewEntry] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Class',
    start_time: '09:00',
    end_time: '10:00',
    color: '#E0F2FE',
    reminder: false
  });

  const pastelColors = [
    { name: 'Blue', bg: '#E0F2FE', text: '#0369A1' },
    { name: 'Pink', bg: '#FCE7F3', text: '#BE185D' },
    { name: 'Purple', bg: '#F3E8FF', text: '#7E22CE' },
    { name: 'Green', bg: '#DCFCE7', text: '#15803D' },
    { name: 'Red', bg: '#FEE2E2', text: '#B91C1C' },
    { name: 'Orange', bg: '#FFEDD5', text: '#C2410C' },
  ];

  const types = [
    { id: 'Class', icon: BookOpen, label: 'Class' },
    { id: 'Task', icon: CheckSquare, label: 'Task' },
    { id: 'Exam', icon: AlertCircle, label: 'Exam' }
  ];

  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('planner_courses').select('*').order('start_time', { ascending: true });
    if (!error) setCourses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const openModal = (dateString = '') => {
    setNewEntry({ 
      ...newEntry, 
      date: dateString || new Date().toISOString().split('T')[0] 
    });
    setIsModalOpen(true);
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('planner_courses').insert([newEntry]);
    if (error) alert(error.message);
    else {
      setIsModalOpen(false);
      setNewEntry({ ...newEntry, name: '', reminder: false });
      fetchCourses();
    }
  };

  const toggleComplete = async (id, currentStatus) => {
    const { error } = await supabase
      .from('planner_courses')
      .update({ is_completed: !currentStatus })
      .eq('id', id);
    if (!error) fetchCourses();
  };

  const deleteCourse = async (id) => {
    const { error } = await supabase.from('planner_courses').delete().eq('id', id);
    if (!error) fetchCourses();
  };

  // --- CALENDAR LOGIC ---
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

  return (
    <div style={{ width: '100%' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#0B1A3F', margin: 0 }}>
          {monthNames[viewDate.getMonth()]} <span style={{ opacity: 0.2 }}>{viewDate.getFullYear()}</span>
        </h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={navGroupStyle}>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))} style={navBtnStyle}><ChevronLeft size={18}/></button>
            <button onClick={() => setViewDate(new Date())} style={{...navBtnStyle, fontSize: '12px'}}>Today</button>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))} style={navBtnStyle}><ChevronRight size={18}/></button>
          </div>
          <button onClick={() => openModal()} style={addBtnStyle}><Plus size={20} /> New Event</button>
        </div>
      </div>

      {/* GRID */}
      <div className="card" style={{ padding: '30px', position: 'relative' }}>
        {loading && <div style={loaderOverlay}><Loader2 className="animate-spin" /></div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}>
          {days.map(d => <div key={d} style={dayHeaderStyle}>{d}</div>)}
          {[...Array(startOfMonth)].map((_, i) => <div key={i} />)}
          {[...Array(daysInMonth)].map((_, i) => {
            const d = i + 1;
            const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayEvents = courses.filter(c => c.date === dateStr);
            return (
              <div key={d} onClick={() => openModal(dateStr)} style={cellStyle}>
                <span style={{ fontWeight: '900', color: '#0B1A3F', opacity: 0.4 }}>{d}</span>
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {dayEvents.map(ev => (
                    <div 
                      key={ev.id} 
                      onClick={(e) => { e.stopPropagation(); toggleComplete(ev.id, ev.is_completed); }}
                      style={{ 
                        backgroundColor: ev.is_completed ? '#F4F7FE' : ev.color, 
                        color: ev.is_completed ? '#A3AED0' : '#0B1A3F',
                        padding: '6px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        textDecoration: ev.is_completed ? 'line-through' : 'none',
                        opacity: ev.is_completed ? 0.6 : 1,
                        transition: '0.3s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                         {ev.is_completed ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                         {ev.name}
                      </div>
                      <X size={12} onClick={(e) => { e.stopPropagation(); deleteCourse(ev.id); }} style={{ cursor: 'pointer', opacity: 0.5 }} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ENHANCED MODAL */}
      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div className="card" style={{ width: '500px', padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
              <h2 style={{ margin: 0 }}>Create Event</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A3AED0' }}><X /></button>
            </div>

            <form onSubmit={handleAddEntry} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div>
                <label style={labelStyle}>WHAT'S THE PLAN?</label>
                <input type="text" placeholder="Add title" required style={bigInputStyle} value={newEntry.name} onChange={(e) => setNewEntry({...newEntry, name: e.target.value})} />
              </div>

              {/* DATE PICKER INSIDE MODAL */}
              <div>
                <label style={labelStyle}>WHEN?</label>
                <input type="date" required style={dateInputStyle} value={newEntry.date} onChange={(e) => setNewEntry({...newEntry, date: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {types.map(t => (
                  <div key={t.id} onClick={() => setNewEntry({...newEntry, type: t.id})} style={{
                    flex: 1, padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                    background: newEntry.type === t.id ? '#F4F7FE' : 'white',
                    border: newEntry.type === t.id ? '2px solid #0B1A3F' : '2px solid #F4F7FE'
                  }}>
                    <t.icon size={18} color={newEntry.type === t.id ? '#0B1A3F' : '#A3AED0'} />
                    <span style={{ fontSize: '10px', fontWeight: '800', color: newEntry.type === t.id ? '#0B1A3F' : '#A3AED0' }}>{t.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Clock size={20} color="#A3AED0" />
                <input type="time" style={timeInputStyle} value={newEntry.start_time} onChange={(e) => setNewEntry({...newEntry, start_time: e.target.value})} />
                <span style={{ fontWeight: '800', color: '#A3AED0' }}>to</span>
                <input type="time" style={timeInputStyle} value={newEntry.end_time} onChange={(e) => setNewEntry({...newEntry, end_time: e.target.value})} />
              </div>

              <div onClick={() => setNewEntry({...newEntry, reminder: !newEntry.reminder})} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                {newEntry.reminder ? <Bell size={20} color="#4318FF" /> : <BellOff size={20} color="#A3AED0" />}
                <span style={{ fontSize: '13px', fontWeight: '800', color: newEntry.reminder ? '#4318FF' : '#A3AED0' }}>
                  {newEntry.reminder ? 'Notification Set' : 'No Reminders'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {pastelColors.map(c => (
                  <div key={c.bg} onClick={() => setNewEntry({...newEntry, color: c.bg})} style={{ width: '35px', height: '35px', borderRadius: '50%', background: c.bg, cursor: 'pointer', border: newEntry.color === c.bg ? '3px solid #0B1A3F' : 'none' }} />
                ))}
              </div>

              <button type="submit" style={saveBtnStyle}>Confirm Schedule</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES ---
const navGroupStyle = { display: 'flex', background: 'white', borderRadius: '15px', padding: '5px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', border: '1px solid #E9EDF7' };
const navBtnStyle = { background: 'none', border: 'none', padding: '8px 12px', cursor: 'pointer', fontWeight: '800', color: '#0B1A3F' };
const addBtnStyle = { background: '#0B1A3F', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };
const dayHeaderStyle = { fontWeight: '900', color: '#A3AED0', fontSize: '11px', textAlign: 'center', paddingBottom: '15px', letterSpacing: '1.5px' };
const cellStyle = { height: '140px', border: '1px solid #F4F7FE', borderRadius: '20px', padding: '12px', textAlign: 'right', cursor: 'pointer', transition: '0.2s', backgroundColor: 'white' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(11, 26, 63, 0.3)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const labelStyle = { fontSize: '10px', fontWeight: '900', color: '#A3AED0', letterSpacing: '1px', display: 'block', marginBottom: '8px' };
const bigInputStyle = { fontSize: '24px', fontWeight: '800', border: 'none', borderBottom: '2px solid #F4F7FE', padding: '10px 0', outline: 'none', color: '#0B1A3F', width: '100%' };
const dateInputStyle = { padding: '12px', borderRadius: '12px', border: 'none', background: '#F4F7FE', fontWeight: '800', color: '#0B1A3F', outline: 'none', width: '100%', fontSize: '14px' };
const timeInputStyle = { padding: '8px 12px', borderRadius: '10px', background: '#F4F7FE', border: 'none', fontWeight: '800', color: '#0B1A3F', outline: 'none' };
const saveBtnStyle = { background: '#0B1A3F', color: 'white', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: '900', fontSize: '15px', cursor: 'pointer', marginTop: '10px' };
const loaderOverlay = { position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '30px', zIndex: 5 };