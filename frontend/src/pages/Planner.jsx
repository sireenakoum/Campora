import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Planner() {
  // --- STATE ---
  const [viewDate, setViewDate] = useState(new Date());
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: '', date: '', color: '#E0F2FE' });

  // PASTEL COLOR PALETTE
  const pastelColors = [
    { name: 'Blue', bg: '#E0F2FE', text: '#0369A1' },
    { name: 'Pink', bg: '#FCE7F3', text: '#BE185D' },
    { name: 'Purple', bg: '#F3E8FF', text: '#7E22CE' },
    { name: 'Green', bg: '#DCFCE7', text: '#15803D' },
    { name: 'Red', bg: '#FEE2E2', text: '#B91C1C' },
    { name: 'Orange', bg: '#FFEDD5', text: '#C2410C' },
  ];

  // --- DATABASE ACTIONS ---
  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('planner_courses').select('*');
    if (error) console.error('Error:', error);
    else setCourses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleAddCourse = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('planner_courses').insert([newCourse]);
    if (error) alert(error.message);
    else {
      setIsModalOpen(false);
      setNewCourse({ name: '', date: '', color: '#E0F2FE' });
      fetchCourses();
    }
  };

  const deleteCourse = async (id) => {
    const { error } = await supabase.from('planner_courses').delete().eq('id', id);
    if (!error) fetchCourses();
  };

  // --- DATE LOGIC ---
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

  const changeMonth = (offset) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const changeYear = (offset) => {
    setViewDate(new Date(viewDate.getFullYear() + offset, viewDate.getMonth(), 1));
  };

  return (
    <div style={{ width: '100%' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#0B1A3F', margin: 0 }}>
            {monthNames[viewDate.getMonth()]} <span style={{ opacity: 0.3 }}>{viewDate.getFullYear()}</span>
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ display: 'flex', background: 'white', borderRadius: '15px', padding: '5px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <button onClick={() => changeYear(-1)} style={navBtnStyle}>Year -</button>
            <button onClick={() => changeMonth(-1)} style={navBtnStyle}><ChevronLeft size={20}/></button>
            <button onClick={() => setViewDate(new Date())} style={navBtnStyle}>Today</button>
            <button onClick={() => changeMonth(1)} style={navBtnStyle}><ChevronRight size={20}/></button>
            <button onClick={() => changeYear(1)} style={navBtnStyle}>Year +</button>
          </div>
          <button onClick={() => setIsModalOpen(true)} style={addBtnStyle}>
            <Plus size={20} /> Add Course
          </button>
        </div>
      </div>

      {/* CALENDAR GRID */}
      <div className="card" style={{ padding: '30px', position: 'relative', border: '1px solid #E9EDF7' }}>
        {loading && <div style={loaderOverlay}><Loader2 className="animate-spin" /></div>}
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '15px' }}>
          {days.map(day => (
            <div key={day} style={{ fontWeight: '900', color: '#A3AED0', fontSize: '13px', paddingBottom: '20px', textAlign: 'center', letterSpacing: '1px' }}>
              {day.toUpperCase()}
            </div>
          ))}

          {[...Array(startOfMonth)].map((_, i) => <div key={`empty-${i}`} />)}

          {[...Array(daysInMonth)].map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayCourses = courses.filter(c => c.date === dateStr);

            return (
              <div key={dayNum} style={cellStyle}>
                <span style={{ fontWeight: '900', color: '#0B1A3F', fontSize: '16px' }}>{dayNum}</span>
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {dayCourses.map(course => {
                    const colorData = pastelColors.find(c => c.bg === course.color) || pastelColors[0];
                    return (
                      <div key={course.id} style={{ 
                        backgroundColor: colorData.bg, 
                        color: colorData.text, 
                        fontSize: '11px', 
                        padding: '6px 10px', 
                        borderRadius: '8px', 
                        fontWeight: '800', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.name}</span>
                        <X size={12} onClick={() => deleteCourse(course.id)} style={{ cursor: 'pointer', flexShrink: 0, marginLeft: '5px' }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div className="card" style={{ width: '450px', padding: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginBottom: '25px', color: '#0B1A3F', fontSize: '24px' }}>New Calendar Entry</h2>
            <form onSubmit={handleAddCourse} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={inputGroup}>
                <label style={labelStyle}>COURSE NAME</label>
                <input type="text" placeholder="e.g. Advanced Algorithms" required style={inputStyle} value={newCourse.name} onChange={(e) => setNewCourse({...newCourse, name: e.target.value})} />
              </div>
              
              <div style={inputGroup}>
                <label style={labelStyle}>SELECT DATE</label>
                <input type="date" required style={inputStyle} value={newCourse.date} onChange={(e) => setNewCourse({...newCourse, date: e.target.value})} />
              </div>
              
              <div>
                <label style={labelStyle}>CHOOSE PASTEL THEME</label>
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  {pastelColors.map(c => (
                    <div key={c.bg} onClick={() => setNewCourse({...newCourse, color: c.bg})} style={{ 
                      width: '35px', height: '35px', borderRadius: '10px', backgroundColor: c.bg, cursor: 'pointer', 
                      border: newCourse.color === c.bg ? `3px solid ${c.text}` : '2px solid transparent',
                      transition: '0.2s'
                    }} />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="submit" style={saveBtnStyle}>Add to Schedule</button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={cancelBtnStyle}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES ---
const navBtnStyle = { background: 'transparent', border: 'none', padding: '8px 15px', borderRadius: '10px', cursor: 'pointer', color: '#0B1A3F', fontWeight: '800', fontSize: '13px' };
const addBtnStyle = { background: '#0B1A3F', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(11,26,63,0.15)' };
const cellStyle = { height: '130px', border: '1px solid #f0f3f9', borderRadius: '18px', padding: '12px', textAlign: 'right', overflowY: 'auto', transition: '0.2s' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(11, 26, 63, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle = { fontSize: '11px', fontWeight: '900', color: '#A3AED0', letterSpacing: '1px' };
const inputStyle = { padding: '15px', borderRadius: '12px', border: '2px solid #F4F7FE', fontWeight: '700', color: '#0B1A3F', outline: 'none', background: '#F4F7FE' };
const saveBtnStyle = { flex: 2, background: '#0B1A3F', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' };
const cancelBtnStyle = { flex: 1, background: '#F4F7FE', color: '#0B1A3F', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' };
const loaderOverlay = { position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '30px', zIndex: 5 };