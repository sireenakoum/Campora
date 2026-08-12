import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, MessageSquare, Star, Bell, BellOff, 
  Search, Plus, ArrowRight, ArrowLeftRight, Check, X, 
  UserCheck, EyeOff, Send, MessageCircle, FileText, 
  Sparkles, RefreshCw, AlertCircle, Award, Compass, ThumbsUp, Edit3, Trash2, CornerDownRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Sample Majors and Curriculum Data
const MAJORS = [
  "Computer Science", "Business / Finance", "Mechanical Engineering",
  "Electrical Engineering", "Biology", "Architecture", "Economics", "Psychology"
];

const CURRICULUM_ROADMAPS = {
  "Computer Science": [
    { year: "Year 1", courses: ["CS 101: Intro to Programming", "MATH 101: Calculus I", "ENG 101: Writing"] },
    { year: "Year 2", courses: ["CS 201: Data Structures", "CS 202: Algorithms", "MATH 201: Linear Algebra"] },
    { year: "Year 3", courses: ["CS 301: Operating Systems", "CS 302: Database Systems", "CS 305: Web Dev"] },
    { year: "Year 4", courses: ["CS 490: Senior Capstone", "CS 401: AI & ML", "Elective Advanced CS"] }
  ],
  "Business / Finance": [
    { year: "Year 1", courses: ["BUS 101: Financial Accounting", "ECON 101: Microeconomics", "MATH 105: Statistics"] },
    { year: "Year 2", courses: ["BUS 201: Managerial Accounting", "FIN 201: Corporate Finance", "MKT 201: Marketing"] },
    { year: "Year 3", courses: ["FIN 301: Investments", "BUS 305: Business Law", "MGMT 301: Organizational Leadership"] },
    { year: "Year 4", courses: ["BUS 490: Strategic Management Capstone", "FIN 402: Financial Modeling"] }
  ]
};

export default function Registration() {
  const [activeTab, setActiveTab] = useState('match'); // 'match' | 'reviews' | 'curriculum' | 'reminders'
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userName, setUserName] = useState("Student");

  // --- MATCH / SWAP STATE ---
  const [swapPosts, setSwapPosts] = useState([]);
  const [matchResult, setMatchResult] = useState(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [searchPref, setSearchPref] = useState({
    haveCourse: '',
    haveSection: '',
    haveProf: '',
    wantCourse: '',
    wantSection: '',
    wantProf: '',
    isAnonymous: false
  });

  // --- DIRECT CHAT MODAL STATE ---
  const [activeDmUser, setActiveDmUser] = useState(null);
  const [dmMessage, setDmMessage] = useState('');

  // --- REVIEWS STATE ---
  const [reviews, setReviews] = useState([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newReview, setNewReview] = useState({
    course_code: '',
    professor_name: '',
    rating: 5,
    difficulty: 3,
    comment: '',
    is_anonymous: false
  });

  // --- CURRICULUM / MAJOR DISCUSSION STATE ---
  const [selectedMajor, setSelectedMajor] = useState("Computer Science");
  const [majorQuestions, setMajorQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({ title: '', content: '', is_anonymous: false });
  const [replyingToQId, setReplyingToQId] = useState(null);
  const [replyText, setReplyText] = useState('');

  // --- COURSE REMINDERS STATE ---
  const [reminders, setReminders] = useState([]);
  const [newReminder, setNewReminder] = useState({ course_code: '', section: '', professor: '' });

  // Load User and Initial Data
  useEffect(() => {
    fetchUserDataAndData();
  }, []);

  const fetchUserDataAndData = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      setCurrentUserId(userData.user.id);
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', userData.user.id).maybeSingle();
      setUserName(profile?.name || "Student");
    }

    // Fetch Swap Posts
    const { data: swaps } = await supabase.from('registration_swaps').select('*').order('created_at', { ascending: false });
    setSwapPosts(swaps || []);

    // Fetch Reviews
    const { data: revs } = await supabase.from('course_reviews').select('*').order('created_at', { ascending: false });
    setReviews(revs || []);

    // Fetch Major Q&As
    const { data: qas } = await supabase.from('major_questions').select('*').order('created_at', { ascending: false });
    setMajorQuestions(qas || []);

    // Fetch Reminders
    const { data: rems } = await supabase.from('course_reminders').select('*').order('created_at', { ascending: false });
    setReminders(rems || []);

    setLoading(false);
  };

  // --- MATCHING ENGINE & SWAP EDIT/DELETE LOGIC ---
  const handleFindOrPostMatch = async (e) => {
    e.preventDefault();
    if (!searchPref.haveCourse || !searchPref.wantCourse) {
      alert("Please enter the course you currently have and the course you want!");
      return;
    }

    if (editingPostId) {
      // Handle Edit Update
      const payload = {
        have_course: searchPref.haveCourse.toUpperCase(),
        have_section: searchPref.haveSection,
        have_prof: searchPref.haveProf,
        want_course: searchPref.wantCourse.toUpperCase(),
        want_section: searchPref.wantSection,
        want_prof: searchPref.wantProf,
        is_anonymous: searchPref.isAnonymous
      };

      const { error } = await supabase.from('registration_swaps').update(payload).eq('id', editingPostId);
      if (!error) {
        setSwapPosts(swapPosts.map(p => p.id === editingPostId ? { ...p, ...payload } : p));
      } else {
        setSwapPosts(swapPosts.map(p => p.id === editingPostId ? { ...p, ...payload } : p));
      }
      setIsMatchModalOpen(false);
      setEditingPostId(null);
      setSearchPref({ haveCourse: '', haveSection: '', haveProf: '', wantCourse: '', wantSection: '', wantProf: '', isAnonymous: false });
      return;
    }

    // Look for reciprocal match
    const reciprocalMatch = swapPosts.find(p => 
      p.have_course?.toLowerCase() === searchPref.wantCourse?.toLowerCase() &&
      p.want_course?.toLowerCase() === searchPref.haveCourse?.toLowerCase() &&
      p.user_id !== currentUserId
    );

    if (reciprocalMatch) {
      setMatchResult({ found: true, post: reciprocalMatch });
    } else {
      setMatchResult({ found: false });
    }
  };

  const handleConfirmPostMatch = async () => {
    const payload = {
      user_id: currentUserId,
      author_name: searchPref.isAnonymous ? "Anonymous Student" : userName,
      have_course: searchPref.haveCourse.toUpperCase(),
      have_section: searchPref.haveSection,
      have_prof: searchPref.haveProf,
      want_course: searchPref.wantCourse.toUpperCase(),
      want_section: searchPref.wantSection,
      want_prof: searchPref.wantProf,
      is_anonymous: searchPref.isAnonymous
    };

    const { error, data } = await supabase.from('registration_swaps').insert([payload]).select().single();
    if (!error) {
      setSwapPosts([data || payload, ...swapPosts]);
    } else {
      setSwapPosts([{ id: Date.now(), ...payload, created_at: new Date().toISOString() }, ...swapPosts]);
    }
    setIsMatchModalOpen(false);
    setMatchResult(null);
    setSearchPref({ haveCourse: '', haveSection: '', haveProf: '', wantCourse: '', wantSection: '', wantProf: '', isAnonymous: false });
  };

  const handleEditSwap = (post) => {
    setEditingPostId(post.id);
    setSearchPref({
      haveCourse: post.have_course || '',
      haveSection: post.have_section || '',
      haveProf: post.have_prof || '',
      wantCourse: post.want_course || '',
      wantSection: post.want_section || '',
      wantProf: post.want_prof || '',
      isAnonymous: post.is_anonymous || false
    });
    setIsMatchModalOpen(true);
  };

  const handleDeleteSwap = async (id) => {
    if (!window.confirm("Are you sure you want to delete this swap request?")) return;
    await supabase.from('registration_swaps').delete().eq('id', id);
    setSwapPosts(swapPosts.filter(p => p.id !== id));
  };

  // --- REVIEWS LOGIC ---
  const handleCreateReview = async (e) => {
    e.preventDefault();
    const payload = {
      user_id: currentUserId,
      author_name: newReview.is_anonymous ? "Anonymous Student" : userName,
      ...newReview,
      course_code: newReview.course_code.toUpperCase()
    };

    const { error, data } = await supabase.from('course_reviews').insert([payload]).select().single();
    if (!error) {
      setReviews([data || payload, ...reviews]);
    } else {
      setReviews([{ id: Date.now(), ...payload, created_at: new Date().toISOString() }, ...reviews]);
    }
    setIsReviewModalOpen(false);
    setNewReview({ course_code: '', professor_name: '', rating: 5, difficulty: 3, comment: '', is_anonymous: false });
  };

  // --- MAJOR QUESTION & REPLIES LOGIC ---
  const handlePostQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.title || !newQuestion.content) return;

    const payload = {
      user_id: currentUserId,
      major: selectedMajor,
      author_name: newQuestion.is_anonymous ? "Anonymous Student" : userName,
      title: newQuestion.title,
      content: newQuestion.content,
      is_anonymous: newQuestion.is_anonymous,
      replies: []
    };

    const { error, data } = await supabase.from('major_questions').insert([payload]).select().single();
    if (!error) {
      setMajorQuestions([data || payload, ...majorQuestions]);
    } else {
      setMajorQuestions([{ id: Date.now(), ...payload, created_at: new Date().toISOString() }, ...majorQuestions]);
    }
    setNewQuestion({ title: '', content: '', is_anonymous: false });
  };

  const handleAddReply = async (questionId) => {
    if (!replyText.trim()) return;

    const newReplyObj = {
      id: Date.now(),
      user_id: currentUserId,
      author_name: userName,
      content: replyText.trim(),
      created_at: new Date().toISOString()
    };

    const question = majorQuestions.find(q => q.id === questionId);
    const updatedReplies = [...(question.replies || []), newReplyObj];

    await supabase.from('major_questions').update({ replies: updatedReplies }).eq('id', questionId);

    setMajorQuestions(majorQuestions.map(q => q.id === questionId ? { ...q, replies: updatedReplies } : q));
    setReplyText('');
    setReplyingToQId(null);
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Delete this discussion question?")) return;
    await supabase.from('major_questions').delete().eq('id', id);
    setMajorQuestions(majorQuestions.filter(q => q.id !== id));
  };

  // --- COURSE REMINDERS LOGIC ---
  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!newReminder.course_code) return;

    const payload = {
      user_id: currentUserId,
      course_code: newReminder.course_code.toUpperCase(),
      section: newReminder.section,
      professor: newReminder.professor,
      is_active: true
    };

    const { error, data } = await supabase.from('course_reminders').insert([payload]).select().single();
    if (!error) {
      setReminders([data || payload, ...reminders]);
    } else {
      setReminders([{ id: Date.now(), ...payload, created_at: new Date().toISOString() }, ...reminders]);
    }
    setNewReminder({ course_code: '', section: '', professor: '' });
  };

  const handleSendDirectMessage = async () => {
    if (!dmMessage.trim() || !activeDmUser) return;

    await supabase.from('direct_messages').insert([{
      sender_id: currentUserId,
      receiver_id: activeDmUser.id,
      message: dmMessage
    }]);

    alert(`Message sent to ${activeDmUser.name}!`);
    setActiveDmUser(null);
    setDmMessage('');
  };

  return (
    <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', border: '1.5px solid #E2E8F0', padding: '6px 14px', borderRadius: '30px', fontSize: '11px', fontWeight: '800', color: '#0B1A3F', marginBottom: '10px' }}>
            <Compass size={14} color="#0B1A3F" /> ACADEMIC REGISTRATION HUB
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0B1A3F', margin: 0, letterSpacing: '-0.5px' }}>Registration & Swap Hub</h1>
          <p style={{ color: '#A3AED0', fontWeight: '700', marginTop: '6px', fontSize: '14px' }}>
            Match course sections, read course & prof reviews, manage seat alerts, and explore curriculum guides.
          </p>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '5px' }}>
        <button onClick={() => setActiveTab('match')} style={activeTab === 'match' ? activeTabBtn : inactiveTabBtn}>
          <ArrowLeftRight size={16} /> Course Match & Swap
        </button>
        <button onClick={() => setActiveTab('reviews')} style={activeTab === 'reviews' ? activeTabBtn : inactiveTabBtn}>
          <Star size={16} /> Course & Prof Reviews
        </button>
        <button onClick={() => setActiveTab('curriculum')} style={activeTab === 'curriculum' ? activeTabBtn : inactiveTabBtn}>
          <BookOpen size={16} /> Curriculum & Major Q&A
        </button>
        <button onClick={() => setActiveTab('reminders')} style={activeTab === 'reminders' ? activeTabBtn : inactiveTabBtn}>
          <Bell size={16} /> Seat Opening Reminders
        </button>
      </div>

      {/* ==================== TAB 1: COURSE MATCH & SWAP ==================== */}
      {activeTab === 'match' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          {/* SEARCH / MATCH ACTION CARD */}
          <div style={{ background: '#0B1A3F', color: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(11,26,57,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <Sparkles color="#38BDF8" size={24} />
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>Find Your Ideal Course Match</h2>
            </div>
            <p style={{ color: '#94A3B8', fontSize: '14px', fontWeight: '600', marginBottom: '25px' }}>
              Enter the section you currently have and what section/professor you're looking for. Our engine will check for instant mutual swaps!
            </p>

            <button onClick={() => { setEditingPostId(null); setIsMatchModalOpen(true); }} style={matchSearchBtn}>
              <Plus size={18} /> Check Match / Post Swap Request
            </button>
          </div>

          {/* PUBLIC SWAP POSTS FEED */}
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0B1A3F', marginBottom: '15px' }}>Recent Swap Requests</h3>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#A3AED0' }}><RefreshCw className="animate-spin" /></div>
            ) : swapPosts.length === 0 ? (
              <div style={emptyCard}>No swap requests posted yet. Be the first to create one!</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {swapPosts.map(post => (
                  <div key={post.id} style={swapCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={avatarCircle}>{post.author_name?.charAt(0) || 'S'}</div>
                        <div>
                          <p style={{ margin: 0, fontWeight: '900', color: '#0B1A3F', fontSize: '14px' }}>{post.author_name}</p>
                          <span style={{ fontSize: '10px', color: '#A3AED0', fontWeight: '700' }}>
                            {post.is_anonymous ? 'Anonymous' : 'Verified Student'}
                          </span>
                        </div>
                      </div>

                      {/* EDIT / DELETE FOR OWNER */}
                      {post.user_id === currentUserId && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleEditSwap(post)} style={iconActionBtn} title="Edit Post">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => handleDeleteSwap(post.id)} style={{ ...iconActionBtn, color: '#EF4444' }} title="Delete Post">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', border: '1.5px solid #E2E8F0', padding: '12px 16px', borderRadius: '16px', marginBottom: '15px' }}>
                      <div>
                        <span style={badgeRed}>HAVE</span>
                        <p style={{ margin: '4px 0 0 0', fontWeight: '900', color: '#0B1A3F', fontSize: '14px' }}>{post.have_course}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#64748B', fontWeight: '700' }}>Sec {post.have_section} | {post.have_prof}</p>
                      </div>

                      <ArrowRight color="#A3AED0" size={20} />

                      <div>
                        <span style={badgeGreen}>WANTS</span>
                        <p style={{ margin: '4px 0 0 0', fontWeight: '900', color: '#0B1A3F', fontSize: '14px' }}>{post.want_course}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#64748B', fontWeight: '700' }}>Sec {post.want_section} | {post.want_prof}</p>
                      </div>
                    </div>

                    {!post.is_anonymous && post.user_id !== currentUserId && (
                      <button 
                        onClick={() => setActiveDmUser({ id: post.user_id, name: post.author_name })}
                        style={dmBtnStyle}
                      >
                        <MessageCircle size={15} /> Direct Message
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: COURSE & PROFESSOR REVIEWS ==================== */}
      {activeTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0B1A3F', margin: 0 }}>Course & Professor Feedback</h3>
            <button onClick={() => setIsReviewModalOpen(true)} style={primaryActionBtn}>
              <Plus size={18} /> Write Review
            </button>
          </div>

          {reviews.length === 0 ? (
            <div style={emptyCard}>No course reviews written yet. Share your experience to help classmates!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {reviews.map(rev => (
                <div key={rev.id} style={reviewCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '18px', color: '#0B1A3F', fontWeight: '900' }}>
                        {rev.course_code} — <span style={{ color: '#0B1A3F' }}>Prof. {rev.professor_name}</span>
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#A3AED0', fontWeight: '700' }}>
                        By {rev.author_name} • {new Date(rev.created_at || Date.now()).toLocaleDateString()}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={reviewTag}>Rating: {rev.rating}/5 ⭐</span>
                      </div>
                      <div>
                        <span style={{ ...reviewTag, background: '#FEE2E2', color: '#DC2626' }}>Diff: {rev.difficulty}/5</span>
                      </div>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '14px', color: '#1E293B', fontWeight: '600', lineHeight: '1.5' }}>
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 3: CURRICULUM & MAJOR Q&A ==================== */}
      {activeTab === 'curriculum' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* MAJOR SELECTOR */}
          <div style={{ background: 'white', padding: '20px 25px', borderRadius: '20px', border: '1.5px solid #E9EDF7' }}>
            <label style={{ fontSize: '12px', fontWeight: '900', color: '#0B1A3F', marginBottom: '8px', display: 'block' }}>
              SELECT MAJOR TO VIEW ROADMAP & Q&A
            </label>
            <select 
              value={selectedMajor} 
              onChange={e => setSelectedMajor(e.target.value)}
              style={selectInputStyle}
            >
              {MAJORS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* CURRICULUM ROADMAP VISUALIZER */}
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0B1A3F', marginBottom: '15px' }}>
              📜 {selectedMajor} Curriculum Map
            </h3>
            
            {CURRICULUM_ROADMAPS[selectedMajor] ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                {CURRICULUM_ROADMAPS[selectedMajor].map((yearData, idx) => (
                  <div key={idx} style={curriculumYearCard}>
                    <div style={yearHeader}>{yearData.year}</div>
                    <ul style={{ paddingLeft: '18px', margin: '10px 0 0 0' }}>
                      {yearData.courses.map((c, cIdx) => (
                        <li key={cIdx} style={{ fontSize: '13px', fontWeight: '700', color: '#0B1A3F', marginBottom: '6px' }}>{c}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div style={emptyCard}>Curriculum roadmap coming soon for {selectedMajor}.</div>
            )}
          </div>

          {/* MAJOR Q&A DISCUSSION */}
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0B1A3F', marginBottom: '15px' }}>💬 Major Advice & Discussions</h3>
            
            {/* POST QUESTION FORM */}
            <form onSubmit={handlePostQuestion} style={{ ...reviewCard, marginBottom: '20px' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: '900', color: '#0B1A3F', fontSize: '14px' }}>Ask a Question about {selectedMajor}</p>
              <input 
                type="text" 
                placeholder="Question title (e.g., Is CS 202 hard in Year 2?)" 
                style={{ ...modalInput, marginBottom: '10px' }} 
                value={newQuestion.title}
                onChange={e => setNewQuestion({ ...newQuestion, title: e.target.value })}
              />
              <textarea 
                placeholder="Details about your question..." 
                style={{ ...modalInput, height: '80px', resize: 'none', marginBottom: '10px' }}
                value={newQuestion.content}
                onChange={e => setNewQuestion({ ...newQuestion, content: e.target.value })}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                  <input 
                    type="checkbox" 
                    checked={newQuestion.is_anonymous} 
                    onChange={e => setNewQuestion({ ...newQuestion, is_anonymous: e.target.checked })} 
                  />
                  Post Anonymously
                </label>
                <button type="submit" style={primaryActionBtn}>Post Question</button>
              </div>
            </form>

            {/* QUESTIONS LIST */}
            {majorQuestions.filter(q => q.major === selectedMajor).length === 0 ? (
              <div style={emptyCard}>No questions yet for {selectedMajor}. Be the first to ask!</div>
            ) : (
              majorQuestions.filter(q => q.major === selectedMajor).map(q => (
                <div key={q.id} style={{ ...reviewCard, marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: 0, color: '#0B1A3F', fontWeight: '900', fontSize: '16px' }}>{q.title}</h4>
                    {q.user_id === currentUserId && (
                      <button onClick={() => handleDeleteQuestion(q.id)} style={{ ...iconActionBtn, color: '#EF4444' }} title="Delete Question">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  
                  <p style={{ margin: '4px 0 10px 0', fontSize: '11px', color: '#A3AED0', fontWeight: '700' }}>
                    Asked by {q.author_name} • {new Date(q.created_at || Date.now()).toLocaleDateString()}
                  </p>
                  <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#334155', fontWeight: '600' }}>{q.content}</p>

                  {/* REPLIES SECTION */}
                  {q.replies && q.replies.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', paddingLeft: '15px', borderLeft: '2px solid #E2E8F0' }}>
                      {q.replies.map((reply, rIdx) => (
                        <div key={rIdx} style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                          <p style={{ margin: 0, fontWeight: '800', fontSize: '12px', color: '#0B1A3F' }}>{reply.author_name}</p>
                          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#475569', fontWeight: '600' }}>{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* REPLY INPUT TOGGLE */}
                  <div style={{ marginTop: '12px' }}>
                    {replyingToQId === q.id ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          placeholder="Write a reply..." 
                          style={{ ...modalInput, flex: 1 }}
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                        />
                        <button onClick={() => handleAddReply(q.id)} style={primaryActionBtn}>Reply</button>
                        <button onClick={() => setReplyingToQId(null)} style={{ ...iconActionBtn, height: '40px', width: '40px' }}>
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setReplyingToQId(q.id)} style={{ background: 'none', border: 'none', color: '#0B1A3F', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', padding: 0 }}>
                        <CornerDownRight size={14} /> Reply to Student
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: SEAT OPENING REMINDERS ==================== */}
      {activeTab === 'reminders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          <div style={reviewCard}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: '900', color: '#0B1A3F' }}>🔔 Set Course Seat Alert</h3>
            <form onSubmit={handleAddReminder} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Course Code (e.g. CS201)" 
                required 
                style={modalInput}
                value={newReminder.course_code}
                onChange={e => setNewReminder({ ...newReminder, course_code: e.target.value })}
              />
              <input 
                type="text" 
                placeholder="Section (Optional)" 
                style={modalInput}
                value={newReminder.section}
                onChange={e => setNewReminder({ ...newReminder, section: e.target.value })}
              />
              <input 
                type="text" 
                placeholder="Professor (Optional)" 
                style={modalInput}
                value={newReminder.professor}
                onChange={e => setNewReminder({ ...newReminder, professor: e.target.value })}
              />
              <button type="submit" style={primaryActionBtn}>Add Reminder Alert</button>
            </form>
          </div>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0B1A3F', marginBottom: '15px' }}>Active Seat Reminders</h3>
            {reminders.length === 0 ? (
              <div style={emptyCard}>No course seat alerts set yet. Add one above to get notified!</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                {reminders.map(rem => (
                  <div key={rem.id} style={swapCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Bell color="#0B1A3F" size={20} />
                        <div>
                          <h4 style={{ margin: 0, fontWeight: '900', color: '#0B1A3F', fontSize: '16px' }}>{rem.course_code}</h4>
                          <p style={{ margin: 0, fontSize: '11px', color: '#A3AED0', fontWeight: '700' }}>
                            {rem.section ? `Sec ${rem.section}` : 'Any Section'} {rem.professor && `• Prof. ${rem.professor}`}
                          </p>
                        </div>
                      </div>
                      <span style={badgeGreen}>ACTIVE</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODAL: CHECK / POST / EDIT MATCH ==================== */}
      {isMatchModalOpen && (
        <div style={overlay}>
          <div className="card" style={{ width: '520px', padding: '30px', background: '#FFFFFF', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0B1A3F' }}>
                {editingPostId ? 'Edit Swap Request' : 'Set Swap Preferences'}
              </h2>
              <X onClick={() => { setIsMatchModalOpen(false); setMatchResult(null); setEditingPostId(null); }} style={{ cursor: 'pointer', color: '#A3AED0' }} />
            </div>

            {!matchResult ? (
              <form onSubmit={handleFindOrPostMatch} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={fieldLabel}>COURSE YOU HAVE RIGHT NOW</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '6px' }}>
                    <input type="text" placeholder="Course Code (e.g. CS101)" required style={modalInput} value={searchPref.haveCourse} onChange={e => setSearchPref({...searchPref, haveCourse: e.target.value})} />
                    <input type="text" placeholder="Section" style={modalInput} value={searchPref.haveSection} onChange={e => setSearchPref({...searchPref, haveSection: e.target.value})} />
                  </div>
                  <input type="text" placeholder="Current Professor Name" style={modalInput} value={searchPref.haveProf} onChange={e => setSearchPref({...searchPref, haveProf: e.target.value})} />
                </div>

                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                  <label style={fieldLabel}>DESIRED COURSE YOU WANT</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '6px' }}>
                    <input type="text" placeholder="Course Code (e.g. CS101)" required style={modalInput} value={searchPref.wantCourse} onChange={e => setSearchPref({...searchPref, wantCourse: e.target.value})} />
                    <input type="text" placeholder="Section" style={modalInput} value={searchPref.wantSection} onChange={e => setSearchPref({...searchPref, wantSection: e.target.value})} />
                  </div>
                  <input type="text" placeholder="Desired Professor Name" style={modalInput} value={searchPref.wantProf} onChange={e => setSearchPref({...searchPref, wantProf: e.target.value})} />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: '#0B1A3F' }}>
                  <input type="checkbox" checked={searchPref.isAnonymous} onChange={e => setSearchPref({...searchPref, isAnonymous: e.target.checked})} />
                  Post Anonymously
                </label>

                <button type="submit" style={primarySaveBtn}>
                  {editingPostId ? 'Update Post Request' : <><Search size={16} /> Run Match Engine</>}
                </button>
              </form>
            ) : matchResult.found ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ background: '#DCFCE7', color: '#15803D', padding: '15px', borderRadius: '16px', fontWeight: '800', marginBottom: '20px' }}>
                  🎉 PERFECT RECIPROCAL MATCH FOUND!
                </div>
                <p style={{ fontSize: '14px', color: '#0B1A3F', fontWeight: '700' }}>
                  {matchResult.post.author_name} wants to swap <strong>{matchResult.post.have_course}</strong> for <strong>{matchResult.post.want_course}</strong>!
                </p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => { setActiveDmUser({ id: matchResult.post.user_id, name: matchResult.post.author_name }); setIsMatchModalOpen(false); }} style={primarySaveBtn}>
                    <MessageCircle size={16} /> Connect & Message Student
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ background: '#FEF3C7', color: '#B45309', padding: '15px', borderRadius: '16px', fontWeight: '800', marginBottom: '20px' }}>
                  No immediate reciprocal match found right now.
                </div>
                <p style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                  Would you like to post your request to the public board so other students can see it and match with you?
                </p>
                <button onClick={handleConfirmPostMatch} style={primarySaveBtn}>
                  Post Request to Board
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODAL: DIRECT CHAT ==================== */}
      {activeDmUser && (
        <div style={overlay}>
          <div style={{ background: 'white', width: '400px', padding: '25px', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#0B1A3F', fontWeight: '900' }}>Chat with {activeDmUser.name}</h3>
              <X onClick={() => setActiveDmUser(null)} style={{ cursor: 'pointer', color: '#A3AED0' }} />
            </div>
            <textarea 
              placeholder="Send a direct message regarding course swap..." 
              value={dmMessage} 
              onChange={e => setDmMessage(e.target.value)} 
              style={{ ...modalInput, height: '100px', resize: 'none', marginBottom: '15px' }}
            />
            <button onClick={handleSendDirectMessage} style={primarySaveBtn}>
              <Send size={16} /> Send Direct Message
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// --- STYLES ---
const activeTabBtn = {
  display: 'flex', alignItems: 'center', gap: '8px',
  background: '#0B1A3F', color: 'white', border: 'none',
  padding: '12px 20px', borderRadius: '14px', fontWeight: '800',
  fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap'
};

const inactiveTabBtn = {
  display: 'flex', alignItems: 'center', gap: '8px',
  background: '#FFFFFF', color: '#64748B', border: '1.5px solid #E2E8F0',
  padding: '12px 20px', borderRadius: '14px', fontWeight: '800',
  fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap'
};

const matchSearchBtn = {
  background: 'white', color: '#0B1A3F', border: 'none',
  padding: '12px 24px', borderRadius: '14px', fontWeight: '900',
  fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
};

const primaryActionBtn = {
  background: '#0B1A3F', color: 'white', border: 'none',
  padding: '10px 18px', borderRadius: '12px', fontWeight: '800',
  fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
};

const primarySaveBtn = {
  width: '100%', background: '#0B1A3F', color: 'white', border: 'none',
  padding: '14px', borderRadius: '14px', fontWeight: '900',
  fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
};

const swapCard = {
  background: '#FFFFFF', padding: '20px', borderRadius: '20px',
  border: '1.5px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
};

const reviewCard = {
  background: '#FFFFFF', padding: '20px', borderRadius: '20px',
  border: '1.5px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
};

const curriculumYearCard = {
  background: '#FFFFFF', padding: '18px', borderRadius: '18px',
  border: '1.5px solid #E2E8F0'
};

const yearHeader = {
  background: '#FFFFFF', border: '1.5px solid #E2E8F0', color: '#0B1A3F',
  padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '900', display: 'inline-block'
};

const emptyCard = {
  background: '#FFFFFF', border: '1.5px dashed #CBD5E1', padding: '30px',
  borderRadius: '20px', textAlign: 'center', color: '#94A3B8', fontWeight: '700', fontSize: '14px'
};

const avatarCircle = {
  width: '36px', height: '36px', borderRadius: '50%', background: '#FFFFFF', border: '1.5px solid #E2E8F0',
  color: '#0B1A3F', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
};

const badgeRed = {
  background: '#FEE2E2', color: '#DC2626', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '900'
};

const badgeGreen = {
  background: '#DCFCE7', color: '#16A34A', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '900'
};

const reviewTag = {
  background: '#FEF3C7', color: '#D97706', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800'
};

const dmBtnStyle = {
  width: '100%', background: '#FFFFFF', border: '1.5px solid #E2E8F0', color: '#0B1A3F',
  padding: '10px', borderRadius: '12px', fontWeight: '800', fontSize: '13px',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
};

const modalInput = {
  width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0',
  fontSize: '13px', fontWeight: '700', color: '#0B1A3F', outline: 'none', background: '#FFFFFF'
};

const selectInputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0',
  fontSize: '14px', fontWeight: '800', color: '#0B1A3F', outline: 'none', background: '#FFFFFF'
};

const fieldLabel = {
  fontSize: '11px', fontWeight: '900', color: '#0B1A3F', marginBottom: '6px', display: 'block', letterSpacing: '0.5px'
};

const overlay = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(11, 26, 63, 0.4)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};

const iconActionBtn = {
  background: '#FFFFFF', border: '1.5px solid #E2E8F0', padding: '6px',
  borderRadius: '8px', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center'
};