import React, { useState, useEffect } from 'react';

import {
  Plus,
  BookOpen,
  FolderPlus,
  ArrowLeft,
  Save,
  Trash2,
  RefreshCw,
  ExternalLink,
  FolderCheck,
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  Edit2,
  Check,
  X,
  Search,
  GraduationCap
} from 'lucide-react';

import { supabase } from '../lib/supabase';

function NotepadIcon({ size = 32, color = "#0B1A3F" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', margin: '0 auto' }}>
      <rect x="24" y="22" width="58" height="66" rx="12" stroke={color} strokeWidth="6" fill="none" />
      {[34, 43, 52, 61, 70].map((x, i) => (
        <g key={i}>
          <path d={`M ${x} 22 V 14 C ${x} 11, ${x + 6} 11, ${x + 6} 14 V 22`} stroke={color} strokeWidth="5" strokeLinecap="round" fill="none" />
          <circle cx={x + 3} cy="26" r="3.5" fill={color} />
        </g>
      ))}
      {[32, 42, 52, 62, 72].map((y, i) => (
        <path key={i} d={`M 24 ${y} C 18 ${y}, 18 ${y + 4}, 24 ${y + 4}`} stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
      ))}
      <line x1="36" y1="38" x2="70" y2="38" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <line x1="38" y1="52" x2="68" y2="52" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <line x1="38" y1="62" x2="68" y2="68" stroke={color} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseFiles, setCourseFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const [newCourse, setNewCourse] = useState({ name: '', professor: '', days: 'MWF', color: '#E0F2FE' });
  const [userId, setUserId] = useState(null);

  const [savedNotes, setSavedNotes] = useState([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [activeNotes, setActiveNotes] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [savingNote, setSavingNote] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [customFileName, setCustomFileName] = useState('');
  const [folderMode, setFolderMode] = useState('existing');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [saveBanner, setSaveBanner] = useState(null);
  const [activeFolderView, setActiveFolderView] = useState(null);

  const [customFolders, setCustomFolders] = useState([]);
  const [editingFolderName, setEditingFolderName] = useState(null);
  const [renamedFolderValue, setRenamedFolderValue] = useState('');

  const pastelColors = [
    { bg: '#E0F2FE', text: '#0369A1' }, { bg: '#FCE7F3', text: '#BE185D' },
    { bg: '#F3E8FF', text: '#7E22CE' }, { bg: '#DCFCE7', text: '#15803D' },
    { bg: '#FEE2E2', text: '#B91C1C' }, { bg: '#FFEDD5', text: '#C2410C' }
  ];

  // Removed default folders list
  const defaultFolders = [];

  const existingFolders = Array.from(
    new Set([...defaultFolders, ...customFolders, ...courseFiles.map(f => f.folder_name).filter(Boolean)])
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (userId) fetchCourses();
  }, [userId]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      let query = supabase.from('courses').select('*');
      if (userId) query = query.eq('user_id', userId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setCourses(data || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async (courseId) => {
    try {
      const { data, error } = await supabase
        .from('course_resources')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCourseFiles(data || []);
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  };

  const fetchNotes = async (courseId) => {
    try {
      const { data, error } = await supabase
        .from('course_notes')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSavedNotes(data || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      const courseData = { ...newCourse };
      if (userId) courseData.user_id = userId;

      const { error } = await supabase.from('courses').insert([courseData]);
      if (error) throw error;

      setNewCourse({ name: '', professor: '', days: 'MWF', color: '#E0F2FE' });
      setIsModalOpen(false);
      fetchCourses();
    } catch (err) {
      alert("Error adding course: " + err.message);
    }
  };

  const handleSaveNotes = async () => {
    if (!noteTitle.trim()) {
      alert("Please enter a title for your note!");
      return;
    }

    try {
      setSavingNote(true);
      const payload = { 
        course_id: selectedCourse.id, 
        title: noteTitle.trim(), 
        content: activeNotes 
      };
      if (userId) payload.user_id = userId;

      if (editingNoteId) {
        const { error } = await supabase
          .from('course_notes')
          .update(payload)
          .eq('id', editingNoteId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('course_notes')
          .insert([payload]);
        if (error) throw error;
      }

      setNoteTitle('');
      setActiveNotes('');
      setEditingNoteId(null);
      fetchNotes(selectedCourse.id);
    } catch (err) {
      alert('Error saving note: ' + err.message);
    } finally {
      setSavingNote(false);
    }
  };

  const handleSelectNote = (note) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setActiveNotes(note.content);
  };

  const handleNewNote = () => {
    setEditingNoteId(null);
    setNoteTitle('');
    setActiveNotes('');
  };

  const handleDeleteNote = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this note?")) {
      await supabase.from('course_notes').delete().eq('id', id);
      if (editingNoteId === id) handleNewNote();
      fetchNotes(selectedCourse.id);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setCustomFileName(nameWithoutExt);

      if (existingFolders.length === 0) {
        setFolderMode('new');
        setSelectedFolder('');
      } else {
        setFolderMode('existing');
        setSelectedFolder(existingFolders[0]);
      }

      setIsFileModalOpen(true);
    }
  };

  const uploadFile = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploading(true);
      
      const targetFolder = folderMode === 'new' 
        ? (newFolderName.trim() || 'General Resources') 
        : (selectedFolder || 'General Resources');

      const extension = selectedFile.name.includes('.') ? selectedFile.name.split('.').pop() : '';
      const finalFileName = customFileName.trim() ? `${customFileName}.${extension}` : selectedFile.name;
      
      const sanitizedFileName = finalFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const safePath = `${userId || 'public'}/${selectedCourse.id}/${Date.now()}_${sanitizedFileName}`;

      const { error: uploadError } = await supabase.storage.from('course-files').upload(safePath, selectedFile, {
        cacheControl: '3600',
        upsert: false
      });
      
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('course-files').getPublicUrl(safePath);

      const resourceData = { 
        course_id: selectedCourse.id, 
        file_name: finalFileName, 
        file_url: urlData.publicUrl,
        folder_name: targetFolder,
        user_id: userId
      };

      const { error: dbError } = await supabase.from('course_resources').insert([resourceData]);

      if (dbError) throw dbError;

      if (folderMode === 'new' && !customFolders.includes(targetFolder)) {
        setCustomFolders([...customFolders, targetFolder]);
      }

      setSaveBanner({ fileName: finalFileName, folderName: targetFolder });
      setTimeout(() => setSaveBanner(null), 5000);

      setIsFileModalOpen(false);
      setSelectedFile(null);
      setCustomFileName('');
      setNewFolderName('');
      fetchFiles(selectedCourse.id);
    } catch (error) {
      console.error("Upload error details:", error);
      alert("Upload failed: " + (error.message || "Security or schema error."));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId, e) => {
    e.stopPropagation();
    if (window.confirm("Remove this file?")) {
      await supabase.from('course_resources').delete().eq('id', fileId);
      fetchFiles(selectedCourse.id);
    }
  };

  const handleRenameFolder = async (oldFolderName, e) => {
    e.stopPropagation();
    if (!renamedFolderValue.trim() || renamedFolderValue === oldFolderName) {
      setEditingFolderName(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('course_resources')
        .update({ folder_name: renamedFolderValue.trim() })
        .eq('course_id', selectedCourse.id)
        .eq('folder_name', oldFolderName);

      if (error) throw error;

      setCustomFolders(customFolders.map(f => f === oldFolderName ? renamedFolderValue.trim() : f));
      setEditingFolderName(null);
      fetchFiles(selectedCourse.id);
    } catch (err) {
      alert("Error renaming folder: " + err.message);
    }
  };

  const handleDeleteFolder = async (folderName, e) => {
    e.stopPropagation();
    if (window.confirm(`Delete folder "${folderName}" and all files inside it?`)) {
      try {
        await supabase
          .from('course_resources')
          .delete()
          .eq('course_id', selectedCourse.id)
          .eq('folder_name', folderName);

        setCustomFolders(customFolders.filter(f => f !== folderName));
        if (activeFolderView === folderName) setActiveFolderView(null);
        fetchFiles(selectedCourse.id);
      } catch (err) {
        alert("Error deleting folder: " + err.message);
      }
    }
  };

  if (selectedCourse) {
    const themeColor = selectedCourse.color || '#E0F2FE';

    const filesByFolder = existingFolders.reduce((acc, folder) => {
      acc[folder] = courseFiles.filter(f => f.folder_name === folder);
      return acc;
    }, {});

    return (
      <div style={{ width: '100%', animation: 'fadeIn 0.4s ease' }}>
        <button onClick={() => { setSelectedCourse(null); setActiveFolderView(null); }} style={backBtnStyle}>
          <ArrowLeft size={20} strokeWidth={3} /> <span>Back to Courses</span>
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div>
            <h1 style={{ fontSize: '44px', fontWeight: '900', color: '#0B1A3F', margin: 0 }}>{selectedCourse.name}</h1>
            <div style={{ display: 'flex', gap: '20px', marginTop: '6px', fontSize: '14px', fontWeight: '800', color: '#64748B' }}>
              {selectedCourse.professor && <span>Prof. {selectedCourse.professor}</span>}
              {selectedCourse.days && <span>{selectedCourse.days}</span>}
            </div>
          </div>
          <button onClick={() => { if(window.confirm("Delete course?")) supabase.from('courses').delete().eq('id', selectedCourse.id).then(() => {setSelectedCourse(null); fetchCourses();})}} style={{ background: 'none', border: 'none', color: '#EE5D50', cursor: 'pointer' }}>
            <Trash2 size={24} />
          </button>
        </div>

        {saveBanner && (
          <div style={bannerStyle}>
            <FolderCheck size={28} color="#15803D" />
            <div>
              <div style={{ fontWeight: '900', color: '#15803D', fontSize: '15px' }}>Saved to Folder!</div>
              <div style={{ fontSize: '13px', color: '#166534' }}>
                <strong>{saveBanner.fileName}</strong> stored inside 📂 <em>{saveBanner.folderName}</em>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '30px' }}>
          {/* Notepad Workspace */}
          <div style={{ flex: 1.5 }}>
            <div style={{ ...notepadCardStyle, background: themeColor }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={notepadTag}>
                  <NotepadIcon size={20} color="#0B1A3F" /> {editingNoteId ? 'Editing Note' : 'New Note'}
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {editingNoteId && (
                    <button onClick={handleNewNote} style={smallNoteBtn}>
                      + New Page
                    </button>
                  )}
                  <button onClick={handleSaveNotes} disabled={savingNote} style={saveNotepadBtn}>
                    {savingNote ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />} 
                    <span>{savingNote ? 'Saving...' : 'Save Note'}</span>
                  </button>
                </div>
              </div>

              <input 
                type="text"
                placeholder="Note Title..."
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                style={notepadTitleInput}
              />

              <textarea 
                value={activeNotes} 
                onChange={(e) => setActiveNotes(e.target.value)}
                style={notepadTextArea} 
                placeholder="Write your note contents here..."
              />
            </div>

            {/* Saved Notes Grid */}
            <div style={{ marginTop: '30px' }}>
              <h4 style={{ fontWeight: '900', color: '#0B1A3F', fontSize: '18px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <NotepadIcon size={22} color="#0B1A3F" /> Saved Notes ({savedNotes.length})
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' }}>
                {savedNotes.map((note) => (
                  <div 
                    key={note.id} 
                    onClick={() => handleSelectNote(note)}
                    style={{
                      ...dynamicNoteCard,
                      background: themeColor,
                      border: editingNoteId === note.id ? '2px solid #0B1A3F' : '1px solid rgba(11,26,57,0.15)'
                    }}
                  >
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={(e) => handleDeleteNote(note.id, e)} style={deleteNoteBtn}>
                        <Trash2 size={13} color="#EE5D50" />
                      </button>
                    </div>

                    <div style={dynamicNoteTitle}>
                      {note.title || 'Untitled Note'}
                    </div>

                    <NotepadIcon size={34} color="#0B1A3F" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resources & Folder Navigation Sidebar */}
          <div style={{ flex: 1 }}>
            <div className="card" style={{ height: '100%', border: '2px solid #E9EDF7', borderRadius: '24px', padding: '25px', background: 'white' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontWeight: '900', color: '#0B1A3F', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                  {activeFolderView ? (
                    <>
                      <button onClick={() => setActiveFolderView(null)} style={iconBackBtn}>
                        <ArrowLeft size={16} />
                      </button>
                      <FolderOpen color="#0369A1" size={20} />
                      <span>{activeFolderView}</span>
                    </>
                  ) : (
                    <>
                      <Folder color="#0B1A3F" size={20} />
                      <span>Course Folders</span>
                    </>
                  )}
                </h3>

                <label style={uploadIconLabel}>
                  <input type="file" hidden onChange={handleFileSelect} disabled={uploading} />
                  <FolderPlus size={18} color="#0B1A3F" />
                  <span style={{ fontSize: '13px', fontWeight: '800' }}>Add File</span>
                </label>
              </div>

              {!activeFolderView ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {existingFolders.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#A3AED0', fontSize: '14px', padding: '40px 0' }}>
                      No folders created yet.<br />Click <strong>"+ Add File"</strong> above to upload files and create your first folder!
                    </div>
                  ) : (
                    existingFolders.map((folderName) => {
                      const count = filesByFolder[folderName]?.length || 0;
                      const isEditing = editingFolderName === folderName;

                      return (
                        <div 
                          key={folderName} 
                          onClick={() => !isEditing && setActiveFolderView(folderName)}
                          style={folderCardStyle}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            <Folder size={22} color="#0369A1" fill="#E0F2FE" />
                            
                            {isEditing ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }} onClick={e => e.stopPropagation()}>
                                <input 
                                  type="text" 
                                  value={renamedFolderValue} 
                                  onChange={e => setRenamedFolderValue(e.target.value)} 
                                  style={{ ...modalInput, padding: '4px 8px', fontSize: '13px' }}
                                  autoFocus
                                />
                                <button onClick={(e) => handleRenameFolder(folderName, e)} style={iconActionBtn}>
                                  <Check size={14} color="#15803D" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setEditingFolderName(null); }} style={iconActionBtn}>
                                  <X size={14} color="#EE5D50" />
                                </button>
                              </div>
                            ) : (
                              <div>
                                <div style={{ fontWeight: '900', color: '#0B1A3F', fontSize: '15px' }}>{folderName}</div>
                                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>{count} {count === 1 ? 'file' : 'files'}</div>
                              </div>
                            )}
                          </div>

                          {!isEditing && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setEditingFolderName(folderName); 
                                  setRenamedFolderValue(folderName); 
                                }} 
                                style={iconActionBtn}
                                title="Rename folder"
                              >
                                <Edit2 size={14} color="#0369A1" />
                              </button>
                              <button 
                                onClick={(e) => handleDeleteFolder(folderName, e)} 
                                style={iconActionBtn}
                                title="Delete folder"
                              >
                                <Trash2 size={14} color="#EE5D50" />
                              </button>
                              <ChevronRight size={18} color="#A3AED0" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filesByFolder[activeFolderView]?.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#A3AED0', fontSize: '14px', padding: '30px 0' }}>
                      Folder is empty. Click "+ Add File" above to save files here.
                    </div>
                  ) : (
                    filesByFolder[activeFolderView]?.map(file => (
                      <div key={file.id} style={fileRowStyle}>
                        <a href={file.file_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, textDecoration: 'none', overflow: 'hidden' }}>
                          <FileText size={18} color="#0B1A3F" />
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '800', color: '#0B1A3F' }}>
                            {file.file_name}
                          </div>
                          <ExternalLink size={14} color="#0369A1" style={{ flexShrink: 0 }} />
                        </a>
                        <button onClick={(e) => handleDeleteFile(file.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                          <Trash2 size={14} color="#EE5D50" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Upload File Modal */}
        {isFileModalOpen && (
          <div style={overlayStyle}>
            <div className="card" style={{ width: '440px', border: '2px solid #0B1A3F', padding: '30px', borderRadius: '24px', background: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <FolderPlus size={26} color="#0B1A3F" />
                <h3 style={{ margin: 0, fontWeight: '900', color: '#0B1A3F', fontSize: '20px' }}>Upload & Organize File</h3>
              </div>

              <form onSubmit={uploadFile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={fieldLabel}>1. Rename File Title:</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Enter file display name..."
                    value={customFileName} 
                    onChange={(e) => setCustomFileName(e.target.value)}
                    style={modalInput}
                  />
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', fontWeight: '600' }}>Original: {selectedFile?.name}</div>
                </div>

                <div>
                  <label style={fieldLabel}>2. Destination Folder:</label>
                  
                  {existingFolders.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                      <button 
                        type="button" 
                        onClick={() => setFolderMode('existing')} 
                        style={folderMode === 'existing' ? activeTabBtn : inactiveTabBtn}
                      >
                        Existing Folder
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setFolderMode('new')} 
                        style={folderMode === 'new' ? activeTabBtn : inactiveTabBtn}
                      >
                        + Create New Folder
                      </button>
                    </div>
                  )}

                  {folderMode === 'existing' && existingFolders.length > 0 ? (
                    <select 
                      value={selectedFolder} 
                      onChange={(e) => setSelectedFolder(e.target.value)}
                      style={modalInput}
                    >
                      {existingFolders.map(folder => (
                        <option key={folder} value={folder}>📂 {folder}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Lecture Notes, Midterms, Lab Work..."
                      value={newFolderName} 
                      onChange={(e) => setNewFolderName(e.target.value)}
                      style={modalInput}
                    />
                  )}
                </div>

                <button type="submit" disabled={uploading} style={saveBtnStyle}>
                  {uploading ? <RefreshCw className="animate-spin" size={18} style={{ margin: '0 auto' }} /> : '📁 Save to Folder'}
                </button>
                <button type="button" onClick={() => setIsFileModalOpen(false)} style={cancelBtnStyle}>Cancel</button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
   
  <div
    style={{
      width: '100%',
      maxWidth: '1250px',
      margin: '0 auto',
    }}
  >
    {/* HEADER */}
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '34px',
        gap: '20px',
        flexWrap: 'wrap',
      }}
    >
      <div>
        <h1
          style={{
            fontSize: '48px',
            fontWeight: '900',
            color: '#0B1A3F',
            margin: 0,
          }}
        >
          Courses
        </h1>

        <p
          style={{
            margin: '8px 0 0',
            color: '#7C8AB8',
            fontWeight: '700',
            fontSize: '15px',
          }}
        >
          View and manage your courses, assignments, and resources.
        </p>
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        style={{
          ...addBtnStyle,
          padding: '14px 24px',
          borderRadius: '16px',
        }}
      >
        <Plus size={20} strokeWidth={3} />
        <span>Add Course</span>
      </button>
    </div>

    {/* STATS */}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '20px',
        marginBottom: '28px',
      }}
    >
      <StatCard
        icon={<BookOpen size={24} />}
        label="Total Courses"
        value={courses.length}
        bg="#F0ECFF"
        iconColor="#6C63FF"
      />

      <StatCard
        icon={<Check size={24} />}
        label="Assignments"
        value={0}
        bg="#E7F8F0"
        iconColor="#25C98A"
      />

      <StatCard
        icon={<RefreshCw size={24} />}
        label="Upcoming"
        value={0}
        bg="#FFF4DA"
        iconColor="#F4A300"
      />

      <StatCard
        icon={<FolderOpen size={24} />}
        label="Resources"
        value={0}
        bg="#E8F2FF"
        iconColor="#3B82F6"
      />
    </div>

    {/* SEARCH / FILTER ROW */}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 260px',
        gap: '22px',
        marginBottom: '28px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: '#FFFFFF',
          border: '1.5px solid #E2E8F0',
          borderRadius: '18px',
          padding: '0 18px',
          minHeight: '58px',
        }}
      >
        <Search size={21} color="#95A4C7" />

        <input
          type="text"
          placeholder="Search courses..."
          style={{
            border: 'none',
            outline: 'none',
            width: '100%',
            fontSize: '15px',
            fontWeight: '700',
            color: '#0B1A3F',
            background: 'transparent',
          }}
        />
      </div>

      <select
        style={{
          width: '100%',
          minHeight: '58px',
          padding: '0 18px',
          borderRadius: '18px',
          border: '1.5px solid #E2E8F0',
          background: '#FFFFFF',
          color: '#0B1A3F',
          fontWeight: '800',
          fontSize: '14px',
          outline: 'none',
        }}
      >
        <option>All Semesters</option>
        <option>Fall</option>
        <option>Spring</option>
        <option>Summer</option>
      </select>
    </div>

    {/* CONTENT */}
    {loading ? (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '360px',
        }}
      >
        <RefreshCw
          className="animate-spin"
          size={28}
          color="#0B1A3F"
        />
      </div>
    ) : courses.length === 0 ? (
      <div
        style={{
          background: '#FFFFFF',
          border: '1.5px solid #E7EBF4',
          borderRadius: '26px',
          minHeight: '420px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          boxShadow: '0 16px 40px rgba(11, 26, 63, 0.05)',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            maxWidth: '420px',
          }}
        >
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              background: '#F1EEFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <GraduationCap size={46} color="#5D5FEF" />
          </div>

          <h2
            style={{
              margin: '0 0 10px',
              color: '#0B1A3F',
              fontSize: '27px',
              fontWeight: '900',
            }}
          >
            No courses yet
          </h2>

          <p
            style={{
              margin: '0 0 26px',
              color: '#8C9BC0',
              fontSize: '15px',
              fontWeight: '700',
              lineHeight: '1.6',
            }}
          >
            You haven't added any courses yet.
            <br />
            Add your courses to get started.
          </p>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{
              border: 'none',
              background:
                'linear-gradient(135deg, #5D5FEF 0%, #4B3DF5 100%)',
              color: '#FFFFFF',
              borderRadius: '16px',
              padding: '14px 26px',
              fontWeight: '900',
              fontSize: '15px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '9px',
              boxShadow: '0 10px 24px rgba(93, 95, 239, 0.25)',
            }}
          >
            <Plus size={19} strokeWidth={3} />
            Add Course
          </button>
        </div>
      </div>
    ) : (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '26px',
        }}
      >
        {courses.map((course) => (
          <div
            key={course.id}
            onClick={() => {
              setSelectedCourse(course);
              fetchNotes(course.id);
              fetchFiles(course.id);
            }}
            style={{
              ...courseCardStyle,
              background: course.color,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '18px',
              }}
            >
              <div
                style={{
                  background: '#FFFFFF',
                  width: '45px',
                  height: '45px',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                }}
              >
                <BookOpen size={22} color="#0B1A3F" />
              </div>

              {(course.professor || course.days) && (
                <div style={sideInfoBoxStyle}>
                  {course.days && (
                    <span style={sideInfoTag}>{course.days}</span>
                  )}

                  {course.professor && (
                    <span style={sideInfoText}>
                      Prof. {course.professor}
                    </span>
                  )}
                </div>
              )}
            </div>

            <h2
              style={{
                fontSize: '28px',
                fontWeight: '900',
                color: '#0B1A3F',
                margin: '0 0 10px 0',
              }}
            >
              {course.name}
            </h2>

            <p
              style={{
                margin: 'auto 0 0 0',
                fontWeight: '800',
                color: '#0B1A3F',
                opacity: 0.5,
                fontSize: '15px',
              }}
            >
              Open Workspace →
            </p>
          </div>
        ))}
      </div>
    )}


      {/* New Course Modal */}
      {isModalOpen && (
        <div style={overlayStyle}>
          <div className="card" style={{ width: '450px', border: '2px solid #0B1A3F', padding: '35px', borderRadius: '24px', background: 'white' }}>
            <h2 style={{ marginBottom: '20px', fontWeight: '900', color: '#0B1A3F', fontSize: '24px' }}>Create New Course</h2>
            <form onSubmit={handleAddCourse} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={fieldLabel}>Course Name:</label>
                <input 
                  type="text" 
                  placeholder="e.g. MECH 310" 
                  required 
                  style={modalInput} 
                  value={newCourse.name} 
                  onChange={e => setNewCourse({...newCourse, name: e.target.value})} 
                />
              </div>

              <div>
                <label style={fieldLabel}>Professor Name:</label>
                <input 
                  type="text" 
                  placeholder="e.g. Dr. Smith" 
                  style={modalInput} 
                  value={newCourse.professor} 
                  onChange={e => setNewCourse({...newCourse, professor: e.target.value})} 
                />
              </div>

              <div>
                <label style={fieldLabel}>Schedule / Days:</label>
                <select 
                  value={newCourse.days} 
                  onChange={e => setNewCourse({...newCourse, days: e.target.value})} 
                  style={modalInput}
                >
                  <option value="MWF">MWF</option>
                  <option value="TTH">TTH</option>
                  <option value="Lab">Lab</option>
                  <option value="None">None / Online</option>
                </select>
              </div>

              <div>
                <label style={fieldLabel}>Card Theme Color:</label>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '6px' }}>
                  {pastelColors.map(c => (
                    <div 
                      key={c.bg} 
                      onClick={() => setNewCourse({...newCourse, color: c.bg})} 
                      style={{ 
                        width: '35px', 
                        height: '35px', 
                        borderRadius: '50%', 
                        background: c.bg, 
                        cursor: 'pointer', 
                        border: newCourse.color === c.bg ? '3px solid #0B1A3F' : '1px solid #ddd' 
                      }} 
                    />
                  ))}
                </div>
              </div>

              <button type="submit" style={saveBtnStyle}>Create Workspace</button>
              <button type="button" onClick={() => setIsModalOpen(false)} style={cancelBtnStyle}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
function StatCard({ icon, label, value, bg, iconColor }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1.5px solid #EDF1F7',
        borderRadius: '20px',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        minHeight: '92px',
        boxShadow: '0 10px 25px rgba(11, 26, 63, 0.04)',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '16px',
          background: bg,
          color: iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            color: '#0B1A3F',
            fontSize: '24px',
            fontWeight: '900',
            lineHeight: 1,
            marginBottom: '7px',
          }}
        >
          {value}
        </div>

        <div
          style={{
            color: '#7180AA',
            fontSize: '13px',
            fontWeight: '800',
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}
// --- STYLES ---
const sideInfoBoxStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '4px',
  background: 'rgba(255, 255, 255, 0.65)',
  padding: '6px 12px',
  borderRadius: '12px',
  backdropFilter: 'blur(4px)'
};

const sideInfoTag = {
  fontWeight: '900',
  fontSize: '11px',
  color: '#0B1A3F',
  letterSpacing: '0.5px'
};

const sideInfoText = {
  fontWeight: '800',
  fontSize: '12px',
  color: '#475569'
};

const notepadCardStyle = {
  borderRadius: '24px',
  padding: '28px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.04)',
  backgroundImage: 'linear-gradient(transparent 95%, rgba(11,26,57,0.07) 95%)',
  backgroundSize: '100% 28px'
};

const notepadTag = {
  fontSize: '12px',
  fontWeight: '900',
  color: '#0B1A3F',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  background: 'rgba(255,255,255,0.7)',
  padding: '4px 10px',
  borderRadius: '8px'
};

const notepadTitleInput = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '12px',
  border: '2px solid rgba(11,26,57,0.12)',
  background: 'white',
  fontSize: '18px',
  fontWeight: '900',
  color: '#0B1A3F',
  outline: 'none',
  marginBottom: '15px'
};

const notepadTextArea = {
  width: '100%',
  minHeight: '280px',
  background: 'transparent',
  border: 'none',
  outline: 'none',
  resize: 'none',
  fontSize: '16px',
  fontWeight: '700',
  color: '#0B1A3F',
  lineHeight: '28px',
  fontFamily: 'inherit'
};

const saveNotepadBtn = {
  background: '#0B1A3F',
  color: 'white',
  border: 'none',
  padding: '8px 14px',
  borderRadius: '10px',
  fontWeight: '900',
  fontSize: '13px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
};

const smallNoteBtn = {
  background: 'white',
  border: '1px solid #CBD5E1',
  padding: '6px 12px',
  borderRadius: '10px',
  fontSize: '12px',
  fontWeight: '800',
  color: '#0B1A3F',
  cursor: 'pointer'
};

const dynamicNoteCard = {
  padding: '12px',
  borderRadius: '18px',
  cursor: 'pointer',
  boxShadow: '0 3px 8px rgba(0,0,0,0.03)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justify: 'space-between',
  gap: '8px'
};

const dynamicNoteTitle = {
  fontWeight: '900',
  color: '#0B1A3F',
  fontSize: '13px',
  textAlign: 'center',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  width: '100%'
};

const addBtnStyle = { 
  background: '#0B1A3F', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '18px', 
  fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px' 
};

const backBtnStyle = { 
  background: 'white', border: '2px solid #E2E8F0', padding: '10px 20px', borderRadius: '14px', 
  fontWeight: '900', color: '#0B1A3F', cursor: 'pointer', marginBottom: '20px', display: 'flex', 
  alignItems: 'center', gap: '10px', fontSize: '14px' 
};

const iconBackBtn = {
  background: '#F1F5F9', border: 'none', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#0B1A3F'
};

const iconActionBtn = {
  background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center'
};

const courseCardStyle = { 
  padding: '35px', borderRadius: '35px', cursor: 'pointer', transition: 'transform 0.2s ease', 
  boxShadow: '0 15px 30px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', minHeight: '240px' 
};

const deleteNoteBtn = { background: 'none', border: 'none', cursor: 'pointer', padding: '0' };

const folderCardStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#F8FAFC',
  borderRadius: '16px', cursor: 'pointer', border: '1px solid #E2E8F0', transition: 'all 0.15s ease'
};

const fileRowStyle = { 
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 15px', background: '#F8FAFF', 
  borderRadius: '14px', fontSize: '14px', border: '1px solid #F1F5F9' 
};

const bannerStyle = {
  display: 'flex', alignItems: 'center', gap: '12px', background: '#DCFCE7', border: '1px solid #86EFAC',
  padding: '12px 20px', borderRadius: '16px', marginBottom: '20px'
};

const uploadIconLabel = {
  display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: '#F1F5F9',
  padding: '8px 14px', borderRadius: '12px', color: '#0B1A3F'
};

const activeTabBtn = {
  flex: 1, padding: '8px', borderRadius: '10px', border: '2px solid #0B1A3F', background: '#0B1A3F', color: 'white', fontWeight: '800', fontSize: '12px', cursor: 'pointer'
};

const inactiveTabBtn = {
  flex: 1, padding: '8px', borderRadius: '10px', border: '2px solid #E2E8F0', background: 'white', color: '#64748B', fontWeight: '800', fontSize: '12px', cursor: 'pointer'
};

const fieldLabel = { fontSize: '12px', fontWeight: '800', color: '#0B1A3F', marginBottom: '6px', display: 'block' };
const modalInput = { width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #E2E8F0', fontWeight: '800', outline: 'none', fontSize: '14px', color: '#0B1A3F' };
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(11,26,57,0.4)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const saveBtnStyle = { background: '#0B1A3F', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '900', fontSize: '15px', cursor: 'pointer' };
const cancelBtnStyle = { background: 'none', border: 'none', fontWeight: '900', color: '#A3AED0', cursor: 'pointer', marginTop: '5px' };