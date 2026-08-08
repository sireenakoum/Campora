import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, X, Clock, 
  Bell, BellOff, BookOpen, CheckSquare, AlertCircle, 
  Edit3, Calendar as CalIcon, StickyNote, RefreshCw, CheckCircle2, Trash2, FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Planner() {
  // --- STATE ---
  const [user, setUser] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null); // Holds entry being edited
  const [viewType, setViewType] = useState('Month'); 
  const [deleteConfirmation, setDeleteConfirmation] = useState(null); 

  const [stickyText, setStickyText] = useState(() => localStorage.getItem('campora_sticky_text') || "");
  const [stickyColor, setStickyColor] = useState(() => localStorage.getItem('campora_sticky_color') || "#FFEDD5");

  const getDefaultEndDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  };

  const initialEntryState = {
    name: '', 
    description: '', 
    date: '', 
    until_date: getDefaultEndDate(),
    type: 'Class', 
    start_time: '09:00', 
    end_time: '10:00',
    color: '#E0F2FE', 
    repeat: 'none', 
    reminder: false
  };

  const [newEntry, setNewEntry] = useState(initialEntryState);

  const pastelColors = [
    { bg: '#E0F2FE', text: '#0369A1' }, { bg: '#FCE7F3', text: '#BE185D' },
    { bg: '#F3E8FF', text: '#7E22CE' }, { bg: '#DCFCE7', text: '#15803D' },
    { bg: '#FEE2E2', text: '#B91C1C' }, { bg: '#FFEDD5', text: '#C2410C' }
  ];

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('campora_sticky_text', stickyText);
    localStorage.setItem('campora_sticky_color', stickyColor);
  }, [stickyText, stickyColor]);

  // --- DATA FETCHING ---
  const fetchCourses = async (userId) => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('planner_courses')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });
    setCourses(data || []);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        fetchCourses(user.id);
      }
    };
    init();
  }, []);

  // --- DATE HELPERS ---
  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // --- VIEW LOGIC ---
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
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // --- ACTIONS ---
  const handleOpenModal = (dateStr) => {
    setEditingEntry(null);
    setNewEntry({ 
      ...initialEntryState, 
      date: dateStr, 
      until_date: getDefaultEndDate()
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entry) => {
    setEditingEntry(entry);
    setNewEntry({
      name: entry.name || '',
      description: entry.description || '',
      date: entry.date || '',
      until_date: getDefaultEndDate(),
      type: entry.type || 'Class',
      start_time: entry.start_time || '09:00',
      end_time: entry.end_time || '10:00',
      color: entry.color || '#E0F2FE',
      repeat: 'none',
      reminder: !!entry.reminder
    });
    setIsModalOpen(true);
  };

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (editingEntry) {
      // UPDATE SINGLE ENTRY
      const updatedData = {
        name: newEntry.name,
        description: newEntry.description,
        type: newEntry.type,
        date: newEntry.date,
        start_time: newEntry.start_time,
        end_time: newEntry.end_time,
        color: newEntry.color,
        reminder: newEntry.reminder
      };

      const { error } = await supabase
        .from('planner_courses')
        .update(updatedData)
        .eq('id', editingEntry.id);

      if (!error && newEntry.reminder) {
        await supabase.from('reminders').upsert({
          profile_id: user.id,
          title: newEntry.name,
          source_id: editingEntry.id,
          remind_at: new Date(`${newEntry.date}T${newEntry.start_time}`).toISOString()
        });
      }
    } else {
      // INSERT NEW ENTRY / SERIES
      let entriesToSave = [];
      const seriesId = crypto.randomUUID();

      const cleanEntry = (date, isRecurring) => {
        const { repeat, until_date, ...dataForDb } = newEntry; 
        return { ...dataForDb, date, group_id: isRecurring ? seriesId : null, user_id: user.id };
      };

      if ((newEntry.type === 'Class' || newEntry.type === 'Lab') && newEntry.repeat !== 'none') {
        let [y, m, d] = newEntry.date.split('-').map(Number);
        let curr = new Date(y, m - 1, d);

        let [endY, endM, endD] = newEntry.until_date.split('-').map(Number);
        const limit = new Date(endY, endM - 1, endD); 

        if (newEntry.repeat === 'Labs') {
          while (curr <= limit) {
            entriesToSave.push(cleanEntry(formatDate(curr), true));
            curr.setDate(curr.getDate() + 7);
          }
        } else {
          const targetDays = newEntry.repeat === 'MWF' ? [1, 3, 5] : [2, 4];
          while (curr <= limit) {
            if (targetDays.includes(curr.getDay())) {
              entriesToSave.push(cleanEntry(formatDate(curr), true));
            }
            curr.setDate(curr.getDate() + 1);
          }
        }
      } else {
        entriesToSave.push(cleanEntry(newEntry.date, false));
      }

      const { data: savedEntries, error: err } = await supabase.from('planner_courses').insert(entriesToSave).select();
      if (!err && newEntry.reminder) {
        const reminders = savedEntries.map(entry => ({
          profile_id: user.id, title: entry.name, source_id: entry.id,
          remind_at: new Date(`${entry.date}T${entry.start_time}`).toISOString()
        }));
        await supabase.from('reminders').insert(reminders);
      }
    }

    setIsModalOpen(false);
    fetchCourses(user.id);
  };

  const executeDelete = async (id, deleteAllInSeries, groupId = null) => {
    let query = supabase.from('planner_courses').delete().eq('user_id', user.id);
    if (deleteAllInSeries && groupId) query = query.eq('group_id', groupId);
    else query = query.eq('id', id);
    await query;
    setDeleteConfirmation(null);
    fetchCourses(user.id);
  };

  const selectedDayEvents = courses.filter(c => c.date === formatDate(selectedDate));

  return (
    <div style={{ display: 'flex', gap: '25px', width: '100%', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
      
      {/* LEFT: CALENDAR AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0B1A3F', margin: 0 }}>
            {viewType === 'Month' ? viewDate.toLocaleString('default', { month: 'long', year: 'numeric' }) : 
             viewType === 'Week' ? `Week of ${dateArray[0].toLocaleDateString()}` : selectedDate.toDateString()}
          </h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={switcherGroup}>
              {['Month', 'Week', 'Day'].map(v => (
                <button key={v} onClick={() => setViewType(v)} style={viewType === v ? activeToggle : toggleStyle}>{v}</button>
              ))}
            </div>
            <button onClick={() => { const n = new Date(); setViewDate(n); setSelectedDate(n); }} style={navBtn}>Today</button>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - (viewType === 'Month' ? 1 : 0), viewType === 'Week' ? viewDate.getDate() - 7 : viewDate.getDate() - 1))} style={navBtn}><ChevronLeft size={18}/></button>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + (viewType === 'Month' ? 1 : 0), viewType === 'Week' ? viewDate.getDate() + 7 : viewDate.getDate() + 1))} style={navBtn}><ChevronRight size={18}/></button>
          </div>
        </div>

        <div className="card" style={{ flex: 1, padding: '20px', position: 'relative', border: '1.5px solid #E9EDF7', overflowY: 'auto' }}>
          {loading && <RefreshCw className="animate-spin" style={{ position: 'absolute', top: '50%', left: '50%', color: '#0B1A3F', zIndex: 20 }} />}
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: viewType === 'Day' ? '1fr' : 'repeat(7, minmax(0, 1fr))', 
            gridAutoRows: viewType === 'Month' ? 'minmax(130px, auto)' : 'minmax(480px, auto)', 
            gap: '10px' 
          }}>
            {viewType !== 'Day' && days.map(d => <div key={d} style={dayHeader}>{d.toUpperCase()}</div>)}
            {viewType === 'Month' && [...Array(startPadding)].map((_, i) => <div key={`pad-${i}`} />)}
            
            {dateArray.map((dateObj, idx) => {
              const dateStr = formatDate(dateObj);
              const isSelected = dateStr === formatDate(selectedDate);
              const dayEvents = courses.filter(c => c.date === dateStr);
              return (
                <div key={idx} onClick={() => setSelectedDate(dateObj)} style={{
                    height: viewType === 'Month' ? '130px' : '480px',
                    padding: '10px', borderRadius: '14px', cursor: 'pointer', transition: '0.2s',
                    border: isSelected ? '2px solid #0B1A3F' : '1px solid #F1F4F9',
                    background: isSelected ? '#F8FAFF' : 'white',
                    display: 'flex', flexDirection: 'column',
                    boxSizing: 'border-box'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ minWidth: '24px' }}> 
                      {isSelected && <button onClick={(e) => { e.stopPropagation(); handleOpenModal(dateStr); }} style={cellAddIcon}><Plus size={12} strokeWidth={3} /></button>}
                    </div>
                    <span style={{ fontWeight: '900', color: '#0B1A3F', fontSize: viewType === 'Day' ? '28px' : '14px' }}>{dateObj.getDate()}</span>
                  </div>

                  {/* Internal Scroll Box so contents stay neatly inside card */}
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '2px' }}>
                    {dayEvents.map(ev => (
                      <div key={ev.id} onClick={(e) => { e.stopPropagation(); handleOpenEditModal(ev); }} style={{ 
                        background: ev.is_completed ? '#F1F5F9' : ev.color, 
                        fontSize: viewType === 'Month' ? '10px' : '12px', 
                        fontWeight: '800', 
                        padding: '6px 8px', 
                        borderRadius: '8px', 
                        color: '#0B1A3F', 
                        textDecoration: ev.is_completed ? 'line-through' : 'none', 
                        wordBreak: 'break-word',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        border: '1px solid rgba(0,0,0,0.05)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                          <span style={{ opacity: 0.75, fontSize: '9px', fontWeight: '700' }}>{ev.start_time.substring(0, 5)} - {ev.end_time.substring(0, 5)}</span>
                          <Edit3 size={11} style={{ opacity: 0.5, flexShrink: 0 }} />
                        </div>
                        <div style={{ fontWeight: '900', marginTop: '2px', lineHeight: '1.2' }}>{ev.name}</div>
                        
                        {viewType !== 'Month' && ev.description && (
                          <div style={{ fontSize: '10px', opacity: 0.85, marginTop: '4px', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '4px', fontWeight: '500', lineHeight: '1.3' }}>
                            {ev.description}
                          </div>
                        )}
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
      <div style={{ width: '330px', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0 }}>
        <div className="card" style={{ flex: 1, maxHeight: '55%', display: 'flex', flexDirection: 'column', border: '1.5px solid #E9EDF7', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#0B1A3F' }}>Agenda</h3>
            <button onClick={() => { if(window.confirm("Erase all?")) supabase.from('planner_courses').delete().eq('user_id', user.id).then(() => fetchCourses(user.id)) }} style={{ color: '#EE5D50', background: 'none', border: 'none', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>Erase All</button>
          </div>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#A3AED0', marginBottom: '12px' }}>{selectedDate.toDateString()}</p>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '2px' }}>
            {selectedDayEvents.length > 0 ? selectedDayEvents.map(ev => (
              <div key={ev.id} style={{ padding: '10px 12px', borderRadius: '12px', background: ev.is_completed ? '#F8FAFF' : ev.color, display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{display:'flex', alignItems:'center', gap:'4px'}}>
                      {ev.reminder && <Bell size={10} color="#0B1A3F"/>}
                      <span style={{ fontWeight: '900', fontSize: '13px', color: '#0B1A3F', textDecoration: ev.is_completed ? 'line-through' : 'none' }}>{ev.name}</span>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: '700', opacity: 0.6 }}>{ev.start_time} - {ev.end_time}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Edit3 size={15} onClick={() => handleOpenEditModal(ev)} style={{ cursor: 'pointer', color: '#0B1A3F' }} />
                    <CheckCircle2 size={15} onClick={() => supabase.from('planner_courses').update({is_completed: !ev.is_completed}).eq('id', ev.id).then(() => fetchCourses(user.id))} style={{ cursor: 'pointer', color: ev.is_completed ? '#05CD99' : '#A3AED0' }} />
                    <Trash2 size={15} onClick={() => { if(ev.group_id) setDeleteConfirmation(ev); else if(window.confirm("Delete?")) executeDelete(ev.id, false); }} style={{ color: '#EE5D50', cursor: 'pointer' }} />
                  </div>
                </div>
                {ev.description && (
                  <p style={{ margin: 0, fontSize: '11px', fontWeight: '600', color: '#0B1A3F', opacity: 0.85, background: 'rgba(255,255,255,0.5)', padding: '6px 8px', borderRadius: '6px', lineHeight: '1.3' }}>
                    {ev.description}
                  </p>
                )}
              </div>
            )) : <div style={{textAlign:'center', marginTop:'30px', opacity:0.3}}><CalIcon size={36}/><p style={{fontSize:'12px', fontWeight:'700'}}>Free Day</p></div>}
          </div>
        </div>

        <div className="card" style={{ flex: 1, border: '1.5px solid #E9EDF7', display: 'flex', flexDirection: 'column', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '900', color: '#0B1A3F', margin: 0, letterSpacing: '0.5px' }}>STICKIES</h4>
            <div style={{ display: 'flex', gap: '5px' }}>
              {pastelColors.map(c => (
                <div key={c.bg} onClick={() => setStickyColor(c.bg)} style={{ width: '13px', height: '13px', borderRadius: '50%', background: c.bg, cursor: 'pointer', border: stickyColor === c.bg ? '2px solid #0B1A3F' : '1px solid #ddd' }} />
              ))}
            </div>
          </div>
          <div style={{ background: stickyColor, flex: 1, padding: '14px', borderRadius: '2px 2px 25px 2px', boxShadow: '0 8px 16px -8px rgba(0,0,0,0.15)', display: 'flex' }}>
            <textarea placeholder="Sticky memo..." value={stickyText} onChange={(e) => setStickyText(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontWeight: '800', color: '#0B1A3F', fontSize: '12px', lineHeight: '1.4', fontFamily: 'inherit' }} />
          </div>
        </div>
      </div>

      {/* RECURRING DELETE MODAL */}
      {deleteConfirmation && (
        <div style={overlay}>
          <div className="card" style={{ width: '380px', border: '2px solid #0B1A3F', padding: '30px', textAlign: 'center' }}>
            <AlertCircle size={36} color="#EE5D50" style={{ marginBottom: '16px' }} />
            <h2 style={{ marginBottom: '8px', fontWeight: '900', color: '#0B1A3F', fontSize: '20px' }}>Series Options</h2>
            <p style={{ color: '#A3AED0', fontWeight: '800', marginBottom: '24px', fontSize: '13px' }}>Delete this instance or the entire repeating series?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => executeDelete(deleteConfirmation.id, false)} style={seriesBtnStyle}>Only this instance</button>
                <button onClick={() => executeDelete(deleteConfirmation.id, true, deleteConfirmation.group_id)} style={seriesBtnStyle}>Entire series</button>
                <button onClick={() => setDeleteConfirmation(null)} style={{ background: '#eee', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', color: '#0B1A3F' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT ENTRY MODAL */}
      {isModalOpen && (
        <div style={overlay}>
          <div className="card" style={{ width: '400px', border: '1.5px solid #0B1A3F', padding: '30px' }}>
            <h2 style={{ marginBottom: '20px', fontWeight: '900', color: '#0B1A3F', fontSize: '20px' }}>
              {editingEntry ? 'Edit Entry' : 'New Entry'}
            </h2>
            <form onSubmit={handleSaveEntry} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="Title" required style={modalInput} value={newEntry.name} onChange={e => setNewEntry({...newEntry, name: e.target.value})} />
              
              <textarea placeholder="Add small notes..." style={{ ...modalInput, resize: 'none', height: '55px', fontFamily: 'inherit' }} value={newEntry.description} onChange={e => setNewEntry({...newEntry, description: e.target.value})} />

              <div style={{display: 'flex', gap: '10px'}}>
                <select style={modalInput} value={newEntry.type} onChange={e => setNewEntry({...newEntry, type: e.target.value})}>
                  <option value="Class">Class</option>
                  <option value="Lab">Lab</option>
                  <option value="Task">Task</option>
                  <option value="Exam">Exam</option>
                </select>
                <input type="date" style={modalInput} value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} />
              </div>

              {!editingEntry && (newEntry.type === 'Class' || newEntry.type === 'Lab') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', background: '#F8FAFF', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '900' }}>REPEAT:</span>
                    {['none', 'MWF', 'TTH', 'Labs'].map(r => (
                      <button type="button" key={r} onClick={() => setNewEntry({...newEntry, repeat: r})} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', fontSize: '10px', fontWeight: '900', cursor: 'pointer', background: newEntry.repeat === r ? '#0B1A3F' : '#E2E8F0', color: newEntry.repeat === r ? 'white' : '#0B1A3F' }}>{r}</button>
                    ))}
                  </div>

                  {newEntry.repeat !== 'none' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '900', color: '#0B1A3F' }}>UNTIL:</span>
                      <input type="date" style={{ ...modalInput, padding: '4px 8px', fontSize: '11px' }} value={newEntry.until_date} onChange={e => setNewEntry({...newEntry, until_date: e.target.value})} />
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="time" style={modalInput} value={newEntry.start_time} onChange={e => setNewEntry({...newEntry, start_time: e.target.value})} />
                <input type="time" style={modalInput} value={newEntry.end_time} onChange={e => setNewEntry({...newEntry, end_time: e.target.value})} />
              </div>

              <button type="button" onClick={() => setNewEntry({...newEntry, reminder: !newEntry.reminder})} style={{ ...modalInput, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: newEntry.reminder ? '#F8FAFF' : 'white' }}>
                {newEntry.reminder ? <Bell size={15} color="#0B1A3F"/> : <BellOff size={15} color="#A3AED0"/>}
                <span style={{color: newEntry.reminder ? '#0B1A3F' : '#A3AED0', fontSize: '12px'}}>{newEntry.reminder ? 'Notification Set' : 'Add Reminder'}</span>
              </button>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '4px 0' }}>
                {pastelColors.map(c => <div key={c.bg} onClick={() => setNewEntry({...newEntry, color: c.bg})} style={{ width: '26px', height: '26px', borderRadius: '50%', background: c.bg, cursor: 'pointer', border: newEntry.color === c.bg ? '2.5px solid #0B1A3F' : '1px solid #eee' }} />)}
              </div>

              <button type="submit" style={saveBtn}>{editingEntry ? 'Save Changes' : 'Confirm'}</button>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontWeight: '900', color: '#A3AED0', cursor: 'pointer', marginTop: '4px' }}>Cancel</button>
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
const saveBtn = { background: '#0B1A3F', border: 'none', color: 'white', padding: '10px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '13px' };
const seriesBtnStyle = { background: '#0B1A3F', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '12px' };
const dayHeader = { textAlign: 'center', fontWeight: '900', color: '#94A3B8', fontSize: '11px', paddingBottom: '6px' };
const cellAddIcon = { width: '22px', height: '22px', borderRadius: '50%', background: '#0B1A3F', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: '0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' };
const modalInput = { padding: '10px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontWeight: '800', outline: 'none', fontSize: '12px', flex: 1, color: '#0B1A3F' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(11,26,57,0.4)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };