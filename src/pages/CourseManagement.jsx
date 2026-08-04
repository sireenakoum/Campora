import React, { useState, useEffect } from 'react';
import { Plus, X, BookOpen, FileText, FolderPlus, ArrowLeft, Save, Trash2, RefreshCw, Paperclip, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseFiles, setCourseFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const [newCourse, setNewCourse] = useState({ name: '', color: '#E0F2FE' });
  const [activeNotes, setActiveNotes] = useState("");

  const pastelColors = [
    { bg: '#E0F2FE', text: '#0369A1' }, { bg: '#FCE7F3', text: '#BE185D' },
    { bg: '#F3E8FF', text: '#7E22CE' }, { bg: '#DCFCE7', text: '#15803D' },
    { bg: '#FEE2E2', text: '#B91C1C' }, { bg: '#FFEDD5', text: '#C2410C' }
  ];

  const fetchCourses = async () => {
    setLoading(true);
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    setCourses(data || []);
    setLoading(false);
  };

  const fetchFiles = async (courseId) => {
    const { data } = await supabase.from('course_resources').select('*').eq('course_id', courseId);
    setCourseFiles(data || []);
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleAddCourse = async (e) => {
    e.preventDefault();
    await supabase.from('courses').insert([newCourse]);
    setIsModalOpen(false);
    fetchCourses();
  };

  const handleSaveNotes = async () => {
    await supabase.from('courses').update({ notes: activeNotes }).eq('id', selectedCourse.id);
    alert("Notes successfully saved!");
  };

  const uploadFile = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      const filePath = `${selectedCourse.id}/${Math.random()}_${file.name}`;

      let { error: uploadError } = await supabase.storage.from('course-files').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('course-files').getPublicUrl(filePath);

      await supabase.from('course_resources').insert([{ course_id: selectedCourse.id, file_name: file.name, file_url: urlData.publicUrl }]);
      fetchFiles(selectedCourse.id);
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  if (selectedCourse) {
    return (
      <div style={{ width: '100%', animation: 'fadeIn 0.4s ease' }}>
        {/* FIXED: Back Button Aligned with Arrow */}
        <button onClick={() => setSelectedCourse(null)} style={backBtnStyle}>
          <ArrowLeft size={20} strokeWidth={3} /> <span>Back to Courses</span>
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', marginTop: '10px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#0B1A3F', margin: 0 }}>{selectedCourse.name}</h1>
          <button onClick={() => { if(window.confirm("Delete course?")) supabase.from('courses').delete().eq('id', selectedCourse.id).then(() => {setSelectedCourse(null); fetchCourses();})}} style={{ background: 'none', border: 'none', color: '#EE5D50', cursor: 'pointer' }}>
            <Trash2 size={24} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '30px' }}>
          <div style={{ flex: 1.5 }}>
            <div className="card" style={{ background: selectedCourse.color, minHeight: '500px', padding: '40px', borderRadius: '2px 2px 40px 2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontWeight: '900', fontSize: '20px' }}>Course Notes</h3>
                <button onClick={handleSaveNotes} style={iconBtnStyle}><Save size={20} /></button>
              </div>
              <textarea 
                value={activeNotes} onChange={(e) => setActiveNotes(e.target.value)}
                style={workspaceNotesStyle} placeholder="Start typing..."
              />
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div className="card" style={{ height: '100%', border: '2px solid #E9EDF7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <h3 style={{ margin: 0, fontWeight: '900' }}>Resources</h3>
                <label style={{ cursor: 'pointer' }}>
                    <input type="file" hidden onChange={uploadFile} disabled={uploading} />
                    {uploading ? <RefreshCw className="animate-spin" size={20} /> : <FolderPlus size={24} color="#0B1A3F" />}
                </label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {courseFiles.map(file => (
                  <a key={file.id} href={file.file_url} target="_blank" rel="noreferrer" style={fileRowStyle}>
                    <Paperclip size={16} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.file_name}</span>
                    <ExternalLink size={14} opacity={0.4} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#0B1A3F', margin: 0 }}>Courses</h1>
        {/* FIXED: Add Course aligned with Plus */}
        <button onClick={() => setIsModalOpen(true)} style={addBtnStyle}>
          <Plus size={22} strokeWidth={3} /> <span>Add Course</span>
        </button>
      </div>

      {/* FIXED: Bigger Grid Columns (min 380px) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '30px' }}>
        {loading && <RefreshCw className="animate-spin" style={{ color: '#0B1A3F', margin: '20px auto' }} />}
        
        {courses.map(course => (
          <div 
            key={course.id} 
            onClick={() => { setSelectedCourse(course); setActiveNotes(course.notes || ""); fetchFiles(course.id); }} 
            style={{ ...courseCardStyle, background: course.color }}
          >
            <div style={{ background: 'white', width: '45px', height: '45px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '25px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
              <BookOpen size={22} color="#0B1A3F" />
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0B1A3F', margin: '0 0 10px 0' }}>{course.name}</h2>
            <p style={{ margin: 0, fontWeight: '800', color: '#0B1A3F', opacity: 0.5, fontSize: '15px' }}>Open Workspace →</p>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div style={overlayStyle}>
          <div className="card" style={{ width: '450px', border: '2px solid #0B1A3F', padding: '40px' }}>
            <h2 style={{ marginBottom: '25px', fontWeight: '900' }}>New Hub</h2>
            <form onSubmit={handleAddCourse} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <input type="text" placeholder="Course Name" required style={modalInput} value={newCourse.name} onChange={e => setNewCourse({...newCourse, name: e.target.value})} />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {pastelColors.map(c => <div key={c.bg} onClick={() => setNewCourse({...newCourse, color: c.bg})} style={{ width: '35px', height: '35px', borderRadius: '50%', background: c.bg, cursor: 'pointer', border: newCourse.color === c.bg ? '3px solid #0B1A3F' : '1px solid #ddd' }} />)}
              </div>
              <button type="submit" style={saveBtnStyle}>Create Workspace</button>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontWeight: '900', color: '#A3AED0', cursor: 'pointer', marginTop: '10px' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- UPDATED STYLES ---
const addBtnStyle = { 
  background: '#0B1A3F', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '18px', 
  fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px' 
};

const backBtnStyle = { 
  background: 'white', border: '2px solid #E2E8F0', padding: '10px 20px', borderRadius: '14px', 
  fontWeight: '900', color: '#0B1A3F', cursor: 'pointer', marginBottom: '25px', display: 'flex', 
  alignItems: 'center', gap: '10px', fontSize: '14px' 
};

const courseCardStyle = { 
  padding: '50px', borderRadius: '35px', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease', 
  boxShadow: '0 15px 30px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', minHeight: '260px' 
};

const workspaceNotesStyle = { 
  width: '100%', flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', 
  fontSize: '18px', fontWeight: '800', color: '#0B1A3F', lineHeight: '1.6', fontFamily: 'inherit', minHeight: '350px' 
};

const fileRowStyle = { 
  display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: '#F8FAFF', 
  borderRadius: '15px', textDecoration: 'none', color: '#0B1A3F', fontWeight: '800', fontSize: '14px', border: '1px solid #F1F5F9' 
};

const modalInput = { padding: '15px', borderRadius: '15px', border: '2px solid #E2E8F0', fontWeight: '800', outline: 'none', fontSize: '15px', color: '#0B1A3F' };
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(11,26,57,0.4)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const saveBtnStyle = { background: '#0B1A3F', color: 'white', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: '900', fontSize: '16px', cursor: 'pointer' };
const iconBtnStyle = { background: 'white', border: 'none', padding: '10px', borderRadius: '12px', color: '#0B1A3F', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' };
