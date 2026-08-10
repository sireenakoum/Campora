import React, { useState, useEffect } from 'react';
import { 
  Plus, MessageSquare, Heart, Share2, Search, X, 
  Image as ImageIcon, MoreHorizontal, Filter, MessageCircle, 
  RefreshCw, Send, Edit3, Trash2, EyeOff, UserCheck, Sparkles, Reply, CornerDownRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const CATEGORIES = ["All", "Clubs & Events", "Questions", "Campus Life", "Complaints", "Lost & Found", "Opportunities", "Other"];

// Enhanced color scheme including soft card backgrounds and matching borders
const CATEGORY_STYLES = {
  "Clubs & Events": { bg: "#EEF2FF", text: "#4936E5", border: "#C7D2FE", accent: "#4936E5", cardBg: "#F5F7FF" },
  "Questions": { bg: "#FEF3C7", text: "#D97706", border: "#FDE68A", accent: "#D97706", cardBg: "#FFFDF5" },
  "Campus Life": { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0", accent: "#059669", cardBg: "#F4FBF7" },
  "Complaints": { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA", accent: "#DC2626", cardBg: "#FFF8F8" },
  "Lost & Found": { bg: "#F3E8FF", text: "#9333EA", border: "#E9D5FF", accent: "#9333EA", cardBg: "#FAF5FF" },
  "Opportunities": { bg: "#E0F2FE", text: "#0284C7", border: "#BAE6FD", accent: "#0284C7", cardBg: "#F0F9FF" },
  "Other": { bg: "#F1F5F9", text: "#475569", border: "#E2E8F0", accent: "#475569", cardBg: "#F8FAFC" }
};

export default function CampusPulse() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // User state
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userName, setUserName] = useState("Student");
  const [userLikes, setUserLikes] = useState(new Set());

  // Post creation state
  const [newPost, setNewPost] = useState({ 
    title: '', 
    content: '', 
    category: 'Campus Life', 
    image_url: '', 
    is_anonymous: false 
  });

  // Edit post state
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostData, setEditPostData] = useState({ title: '', content: '', category: '' });

  // Dropdown toggle & Comment states
  const [activeMenuPostId, setActiveMenuPostId] = useState(null);
  const [commentsState, setCommentsState] = useState({});
  const [replyingToComment, setReplyingToComment] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isReplyAnonymous, setIsReplyAnonymous] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    let uid = null;
    if (userData?.user) {
      uid = userData.user.id;
      setCurrentUserId(uid);
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', uid).maybeSingle();
      setUserName(profile?.name || "Student");

      const { data: likesData } = await supabase
        .from('campus_pulse_likes')
        .select('post_id')
        .eq('user_id', uid);

      if (likesData) {
        setUserLikes(new Set(likesData.map(l => l.post_id)));
      }
    }

    const { data } = await supabase.from('campus_pulse_posts')
      .select('*, campus_pulse_comments(count)')
      .order('created_at', { ascending: false });

    setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (isSubmitting || !currentUserId) return;
    setIsSubmitting(true);

    const fullPayload = {
      user_id: currentUserId,
      author_name: newPost.is_anonymous ? "Anonymous Student" : userName,
      title: newPost.title.trim() || null,
      content: newPost.content.trim(),
      category: newPost.category,
      image_url: newPost.image_url.trim() || null,
      is_anonymous: newPost.is_anonymous
    };

    let { error } = await supabase.from('campus_pulse_posts').insert([fullPayload]);

    if (error && error.message.includes('column')) {
      const fallbackPayload = {
        user_id: currentUserId,
        author_name: newPost.is_anonymous ? "Anonymous Student" : userName,
        content: newPost.content.trim(),
        category: newPost.category,
        image_url: newPost.image_url.trim() || null
      };
      const retry = await supabase.from('campus_pulse_posts').insert([fallbackPayload]);
      error = retry.error;
    }

    setIsSubmitting(false);

    if (error) {
      alert(`Could not create post: ${error.message}`);
    } else {
      setIsModalOpen(false);
      setNewPost({ title: '', content: '', category: 'Campus Life', image_url: '', is_anonymous: false });
      fetchData();
    }
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('campus_pulse_posts')
      .update({ title: editPostData.title, content: editPostData.content, category: editPostData.category })
      .eq('id', editingPostId);

    if (!error) {
      setEditingPostId(null);
      fetchData();
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    const { error } = await supabase.from('campus_pulse_posts').delete().eq('id', postId);
    if (!error) setPosts(posts.filter(p => p.id !== postId));
  };

  const handleLikeToggle = async (postId) => {
    if (!currentUserId) return;

    const isLiked = userLikes.has(postId);
    const newLikesSet = new Set(userLikes);

    if (isLiked) {
      newLikesSet.delete(postId);
      setUserLikes(newLikesSet);
      setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: Math.max(0, (p.likes_count || 1) - 1) } : p));

      await supabase.from('campus_pulse_likes').delete().eq('post_id', postId).eq('user_id', currentUserId);
    } else {
      newLikesSet.add(postId);
      setUserLikes(newLikesSet);
      setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));

      await supabase.from('campus_pulse_likes').insert([{ post_id: postId, user_id: currentUserId }]);
    }
  };

  const toggleComments = async (postId) => {
    const currentState = commentsState[postId] || { open: false, comments: [], text: '', is_anonymous: false, loading: false };
    
    if (currentState.open) {
      setCommentsState(prev => ({ ...prev, [postId]: { ...currentState, open: false } }));
      return;
    }

    setCommentsState(prev => ({ ...prev, [postId]: { ...currentState, open: true, loading: true } }));
    
    const { data } = await supabase
      .from('campus_pulse_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    setCommentsState(prev => ({
      ...prev,
      [postId]: { ...currentState, open: true, comments: data || [], loading: false }
    }));
  };

  const handleAddComment = async (postId, parentComment = null) => {
    const postCommentState = commentsState[postId];
    const textToSend = parentComment ? replyText : postCommentState?.text;
    const isAnon = parentComment ? isReplyAnonymous : postCommentState?.is_anonymous;

    if (!textToSend?.trim() || !currentUserId) return;

    const payload = {
      post_id: postId,
      user_id: currentUserId,
      author_name: isAnon ? "Anonymous Student" : userName,
      content: textToSend.trim(),
      parent_id: parentComment ? parentComment.id : null
    };

    let { data, error } = await supabase.from('campus_pulse_comments').insert([payload]).select().maybeSingle();

    if (error && error.message.includes('column')) {
      delete payload.parent_id;
      const retry = await supabase.from('campus_pulse_comments').insert([payload]).select().maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      alert(`Could not add comment: ${error.message}`);
      return;
    }

    const newComment = data || { id: Date.now().toString(), ...payload, created_at: new Date().toISOString() };

    setCommentsState(prev => ({
      ...prev,
      [postId]: { 
        ...postCommentState, 
        text: parentComment ? postCommentState.text : '', 
        comments: [...(postCommentState.comments || []), newComment] 
      }
    }));

    if (parentComment) {
      setReplyingToComment(null);
      setReplyText('');
    }

    setPosts(posts.map(p => {
      if (p.id === postId) {
        const currentCount = p.campus_pulse_comments_count ?? (p.campus_pulse_comments?.[0]?.count || 0);
        return { ...p, campus_pulse_comments_count: currentCount + 1 };
      }
      return p;
    }));
  };

  const handleDeleteComment = async (postId, commentId) => {
    const { error } = await supabase.from('campus_pulse_comments').delete().eq('id', commentId);
    if (!error) {
      setCommentsState(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          comments: prev[postId].comments.filter(c => c.id !== commentId && c.parent_id !== commentId)
        }
      }));
    }
  };

  const filteredPosts = posts.filter(p => 
    (activeCategory === "All" || p.category === activeCategory) &&
    (p.content?.toLowerCase().includes(searchQuery.toLowerCase()) || p.title?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ width: '100%', maxWidth: '820px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '35px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F4F7FE', padding: '6px 14px', borderRadius: '30px', fontSize: '11px', fontWeight: '800', color: '#0B1A3F', marginBottom: '10px', border: '1px solid #E9EDF7' }}>
            <Sparkles size={14} color="#0B1A3F" /> CAMPUS FEED
          </div>
          <h1 style={{ fontSize: '38px', fontWeight: '900', color: '#0B1A3F', margin: 0, letterSpacing: '-0.5px' }}>Campus Pulse</h1>
          <p style={{ color: '#A3AED0', fontWeight: '700', marginTop: '6px', fontSize: '15px' }}>What's happening in your student community today?</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={addBtnStyle}>
          <Plus size={20} strokeWidth={3} /> Create Post
        </button>
      </div>

      {/* SEARCH & FILTERS */}
      <div style={{ marginBottom: '35px' }}>
        <div style={searchBarContainer}>
          <Search size={20} color="#0B1A3F" />
          <input 
            type="text" 
            placeholder="Search discussions, announcements, lost items..." 
            style={searchField} 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} 
          />
          {searchQuery && <X size={18} color="#A3AED0" style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />}
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => {
            const catStyle = CATEGORY_STYLES[cat];
            const isActive = activeCategory === cat;
            return (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '50px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  border: isActive ? '1.5px solid #0B1A3F' : `1.5px solid ${catStyle?.border || '#E9EDF7'}`,
                  background: isActive ? '#0B1A3F' : (catStyle?.bg || 'white'),
                  color: isActive ? 'white' : (catStyle?.text || '#707EAE'),
                  boxShadow: isActive ? '0 6px 15px rgba(11, 26, 63, 0.2)' : 'none'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* FEED LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#0B1A3F' }}>
            <RefreshCw className="animate-spin" style={{ margin: '0 auto 10px auto' }} size={32} color="#0B1A3F" />
            <p style={{ fontWeight: '800', color: '#0B1A3F' }}>Loading latest posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '24px', border: '1.5px dashed #E9EDF7' }}>
            <MessageCircle size={40} color="#A3AED0" style={{ marginBottom: '12px' }} />
            <h3 style={{ margin: 0, color: '#0B1A3F', fontWeight: '900' }}>No posts found</h3>
            <p style={{ color: '#A3AED0', fontWeight: '700', marginTop: '4px' }}>Be the first one to share something under {activeCategory}!</p>
          </div>
        ) : (
          filteredPosts.map(post => {
            const isOwner = post.user_id === currentUserId;
            const pCommentState = commentsState[post.id] || {};
            const commentCount = post.campus_pulse_comments_count ?? (post.campus_pulse_comments?.[0]?.count || 0);
            const hasLiked = userLikes.has(post.id);
            const catBadge = CATEGORY_STYLES[post.category] || CATEGORY_STYLES["Other"];

            const allComments = pCommentState.comments || [];
            
            const commentsById = {};
            allComments.forEach(c => commentsById[c.id] = c);

            const buildCommentTree = (comments) => {
              const map = {};
              const roots = [];
              comments.forEach(c => map[c.id] = { ...c, replies: [] });
              comments.forEach(c => {
                if (c.parent_id && map[c.parent_id]) {
                  map[c.parent_id].replies.push(map[c.id]);
                } else {
                  roots.push(map[c.id]);
                }
              });
              return roots;
            };

            const commentTree = buildCommentTree(allComments);

            return (
              <div key={post.id} style={{ 
                ...postCardStyle, 
                background: catBadge.cardBg,
                borderColor: catBadge.border,
                borderTop: `4px solid ${catBadge.accent}` 
              }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      ...avatarCircle,
                      background: post.is_anonymous ? '#0B1A3F' : catBadge.bg,
                      color: post.is_anonymous ? '#FFF' : catBadge.text,
                      border: `1px solid ${post.is_anonymous ? 'transparent' : catBadge.border}`
                    }}>
                      {post.is_anonymous ? <EyeOff size={18} /> : (post.author_name?.charAt(0) || 'S')}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <p style={{ margin: 0, fontWeight: '900', color: '#0B1A3F', fontSize: '15px' }}>{post.author_name}</p>
                        {post.is_anonymous && (
                          <span style={{ fontSize: '10px', background: '#F4F7FE', color: '#A3AED0', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>
                            ANONYMOUS
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '11px', color: '#A3AED0', fontWeight: '700' }}>
                        {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
                    <span style={{
                      background: catBadge.bg,
                      color: catBadge.text,
                      border: `1px solid ${catBadge.border}`,
                      padding: '5px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '800',
                      letterSpacing: '0.3px'
                    }}>
                      {post.category}
                    </span>
                    
                    {isOwner && (
                      <div>
                        <button 
                          onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)} 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A3AED0', padding: '4px' }}
                        >
                          <MoreHorizontal size={20} />
                        </button>

                        {activeMenuPostId === post.id && (
                          <div style={dropdownMenu}>
                            <button onClick={() => {
                              setEditingPostId(post.id);
                              setEditPostData({ title: post.title || '', content: post.content || '', category: post.category });
                              setActiveMenuPostId(null);
                            }} style={dropdownItem}>
                              <Edit3 size={15} /> Edit Post
                            </button>
                            <button onClick={() => {
                              handleDeletePost(post.id);
                              setActiveMenuPostId(null);
                            }} style={{ ...dropdownItem, color: '#EE5D50' }}>
                              <Trash2 size={15} /> Delete Post
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                {editingPostId === post.id ? (
                  <form onSubmit={handleUpdatePost} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '15px' }}>
                    <input type="text" value={editPostData.title} onChange={e => setEditPostData({ ...editPostData, title: e.target.value })} style={inputStyle} placeholder="Title" />
                    <textarea value={editPostData.content} onChange={e => setEditPostData({ ...editPostData, content: e.target.value })} style={{ ...inputStyle, height: '100px', resize: 'none' }} required />
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setEditingPostId(null)} style={cancelBtn}>Cancel</button>
                      <button type="submit" style={saveBtnSmall}>Save Changes</button>
                    </div>
                  </form>
                ) : (
                  <>
                    {post.title && <h2 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 8px 0', color: '#0B1A3F' }}>{post.title}</h2>}
                    <p style={{ fontSize: '15px', color: '#2B3674', lineHeight: '1.6', fontWeight: '600', margin: 0, whiteSpace: 'pre-line' }}>{post.content}</p>
                    {post.image_url && <img src={post.image_url} style={postImage} alt="Post Attachment" />}
                  </>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '20px', marginTop: '20px', paddingTop: '15px', borderTop: `1.5px solid ${catBadge.border}` }}>
                  <button onClick={() => handleLikeToggle(post.id)} style={actionBtn}>
                    <Heart size={18} fill={hasLiked ? '#FF4D4D' : 'none'} color={hasLiked ? '#FF4D4D' : '#A3AED0'} style={{ transition: 'all 0.2s ease' }} /> 
                    <span style={{ color: hasLiked ? '#FF4D4D' : '#A3AED0', fontWeight: '800' }}>{post.likes_count || 0}</span>
                  </button>
                  <button onClick={() => toggleComments(post.id)} style={actionBtn}>
                    <MessageCircle size={18} color={pCommentState.open ? '#0B1A3F' : '#A3AED0'} /> 
                    <span style={{ color: pCommentState.open ? '#0B1A3F' : '#A3AED0' }}>{commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}</span>
                  </button>
                  <button onClick={() => navigator.clipboard.writeText(window.location.href)} style={{ ...actionBtn, marginLeft: 'auto' }}>
                    <Share2 size={18} />
                  </button>
                </div>

                {/* NESTED COMMENTS SECTION */}
                {pCommentState.open && (
                  <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: `1px dashed ${catBadge.border}` }}>
                    
                    {/* Primary Post Comment Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                          type="text" 
                          placeholder={pCommentState.is_anonymous ? "Write an anonymous comment..." : "Write a comment..."} 
                          value={pCommentState.text || ''} 
                          onChange={e => setCommentsState(prev => ({ ...prev, [post.id]: { ...prev[post.id], text: e.target.value } }))}
                          onKeyDown={e => e.key === 'Enter' && handleAddComment(post.id)}
                          style={{ ...inputStyle, padding: '12px 18px', fontSize: '14px', borderColor: catBadge.border }}
                        />
                        <button onClick={() => handleAddComment(post.id)} style={sendBtn}>
                          <Send size={16} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start' }}>
                        <button 
                          type="button" 
                          onClick={() => setCommentsState(prev => ({ ...prev, [post.id]: { ...prev[post.id], is_anonymous: !prev[post.id]?.is_anonymous } }))}
                          style={{
                            background: pCommentState.is_anonymous ? '#0B1A3F' : '#F4F7FE',
                            color: pCommentState.is_anonymous ? '#FFF' : '#0B1A3F',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          {pCommentState.is_anonymous ? <EyeOff size={12} /> : <UserCheck size={12} />}
                          {pCommentState.is_anonymous ? 'Commenting Anonymously' : 'Comment as ' + userName}
                        </button>
                      </div>
                    </div>

                    {/* Comment Thread List */}
                    {pCommentState.loading ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#0B1A3F' }}>
                        <RefreshCw className="animate-spin" size={20} style={{ margin: '0 auto 6px auto' }} color="#0B1A3F" />
                        <p style={{ fontSize: '12px', fontWeight: '800', margin: 0, color: '#A3AED0' }}>Loading discussion...</p>
                      </div>
                    ) : allComments.length === 0 ? (
                      <p style={{ fontSize: '13px', color: '#A3AED0', fontWeight: '700', textAlign: 'center', margin: '15px 0' }}>No comments yet. Start the conversation!</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {commentTree.map(comment => (
                          <CommentItem 
                            key={comment.id}
                            comment={comment}
                            commentsById={commentsById}
                            postId={post.id}
                            currentUserId={currentUserId}
                            userName={userName}
                            replyingToComment={replyingToComment}
                            setReplyingToComment={setReplyingToComment}
                            replyText={replyText}
                            setReplyText={setReplyText}
                            isReplyAnonymous={isReplyAnonymous}
                            setIsReplyAnonymous={setIsReplyAnonymous}
                            handleAddComment={handleAddComment}
                            handleDeleteComment={handleDeleteComment}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* CREATE POST MODAL */}
      {isModalOpen && (
        <div style={overlay}>
          <div style={{ width: '100%', maxWidth: '540px', padding: '32px', borderRadius: '24px', background: 'white', boxShadow: '0 20px 50px rgba(11,26,63,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#0B1A3F' }}>Create Post</h2>
              <X onClick={() => setIsModalOpen(false)} style={{ cursor: 'pointer', color: '#A3AED0' }} />
            </div>

            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>CATEGORY</label>
                <select style={inputStyle} value={newPost.category} onChange={e => setNewPost({...newPost, category: e.target.value})}>
                  {CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>TITLE (OPTIONAL)</label>
                <input type="text" placeholder="e.g. Lost Keys near Library" style={inputStyle} value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} />
              </div>

              <div>
                <label style={labelStyle}>CONTENT</label>
                <textarea placeholder="What's on your mind?" required style={{ ...inputStyle, height: '120px', resize: 'none' }} value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} />
              </div>

              <div>
                <label style={labelStyle}>IMAGE ATTACHMENT (OPTIONAL URL)</label>
                <input type="url" placeholder="https://example.com/image.jpg" style={inputStyle} value={newPost.image_url} onChange={e => setNewPost({...newPost, image_url: e.target.value})} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  id="anonymousCheck" 
                  checked={newPost.is_anonymous} 
                  onChange={e => setNewPost({...newPost, is_anonymous: e.target.checked})} 
                />
                <label htmlFor="anonymousCheck" style={{ fontSize: '13px', fontWeight: '700', color: '#0B1A3F', cursor: 'pointer' }}>Post Anonymously</label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={cancelBtn}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={saveBtnSmall}>
                  {isSubmitting ? 'Posting...' : 'Post to Feed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function CommentItem({ 
  comment, 
  commentsById,
  postId, 
  currentUserId, 
  userName,
  replyingToComment, 
  setReplyingToComment, 
  replyText, 
  setReplyText, 
  isReplyAnonymous, 
  setIsReplyAnonymous, 
  handleAddComment, 
  handleDeleteComment 
}) {
  const isReplying = replyingToComment?.id === comment.id;
  const parentAuthor = comment.parent_id && commentsById[comment.parent_id] ? commentsById[comment.parent_id].author_name : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* Individual Comment Card */}
      <div style={{
        background: isReplying ? '#F4F7FE' : '#FFFFFF',
        borderRadius: '14px',
        padding: '12px 16px',
        border: isReplying ? '1.5px solid #0B1A3F' : '1px solid #E2E8F0',
        transition: 'all 0.15s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '900', fontSize: '13px', color: '#0B1A3F' }}>
              {comment.author_name}
            </span>

            {parentAuthor && (
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                color: '#0B1A3F',
                background: '#E2E8F0',
                padding: '2px 8px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Reply size={10} /> replied to @{parentAuthor}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={() => {
                if (isReplying) {
                  setReplyingToComment(null);
                  setReplyText('');
                } else {
                  setReplyingToComment({ id: comment.id, author_name: comment.author_name, postId });
                  setReplyText('');
                }
              }} 
              style={{
                background: 'none',
                border: 'none',
                color: '#0B1A3F',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: 0
              }}
            >
              <Reply size={12} /> {isReplying ? 'Cancel' : 'Reply'}
            </button>

            {comment.user_id === currentUserId && (
              <button 
                onClick={() => handleDeleteComment(postId, comment.id)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EE5D50', padding: 0 }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        <p style={{ margin: 0, fontSize: '13px', color: '#2B3674', fontWeight: '600', lineHeight: '1.4' }}>
          {comment.content}
        </p>
      </div>

      {/* Inline Reply Form */}
      {isReplying && (
        <div style={{ marginLeft: '16px', paddingLeft: '10px', borderLeft: '2px solid #0B1A3F', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder={`Replying to @${comment.author_name}...`} 
              value={replyText} 
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddComment(postId, comment)}
              style={{ ...inputStyle, padding: '8px 12px', fontSize: '12px' }}
              autoFocus
            />
            <button onClick={() => handleAddComment(postId, comment)} style={{ ...sendBtn, padding: '0 12px' }}>
              <Send size={14} />
            </button>
          </div>
          <button 
            type="button" 
            onClick={() => setIsReplyAnonymous(!isReplyAnonymous)}
            style={{
              alignSelf: 'flex-start',
              background: 'none',
              border: 'none',
              color: '#0B1A3F',
              fontSize: '11px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {isReplyAnonymous ? <EyeOff size={11} /> : <UserCheck size={11} />}
            {isReplyAnonymous ? 'Replying Anonymously' : 'Replying as ' + userName}
          </button>
        </div>
      )}

      {/* Child Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div style={{
          marginLeft: '18px',
          paddingLeft: '12px',
          borderLeft: '2px solid #CBD5E1',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginTop: '4px'
        }}>
          {comment.replies.map(reply => (
            <CommentItem 
              key={reply.id}
              comment={reply}
              commentsById={commentsById}
              postId={postId}
              currentUserId={currentUserId}
              userName={userName}
              replyingToComment={replyingToComment}
              setReplyingToComment={setReplyingToComment}
              replyText={replyText}
              setReplyText={setReplyText}
              isReplyAnonymous={isReplyAnonymous}
              setIsReplyAnonymous={setIsReplyAnonymous}
              handleAddComment={handleAddComment}
              handleDeleteComment={handleDeleteComment}
            />
          ))}
        </div>
      )}

    </div>
  );
}

// STYLES
const postCardStyle = { borderRadius: '20px', padding: '24px', borderStyle: 'solid', borderWidth: '1px' };
const avatarCircle = { width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' };

const addBtnStyle = { 
  background: '#0B1A3F', 
  color: 'white', 
  border: 'none', 
  borderRadius: '14px', 
  padding: '10px 18px', 
  fontWeight: '800', 
  cursor: 'pointer', 
  display: 'flex', 
  alignItems: 'center', 
  gap: '6px',
  boxShadow: '0 8px 20px rgba(11,26,63,0.2)'
};

const searchBarContainer = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  background: 'white',
  padding: '12px 18px',
  borderRadius: '16px',
  border: '1px solid #E9EDF7',
  marginBottom: '16px'
};

const searchField = {
  border: 'none',
  outline: 'none',
  width: '100%',
  fontSize: '14px',
  fontWeight: '600',
  color: '#0B1A3F'
};

const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E9EDF7', outline: 'none', fontSize: '13px', color: '#0B1A3F', boxSizing: 'border-box' };
const actionBtn = { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: '#A3AED0' };

const sendBtn = { background: '#0B1A3F', color: 'white', border: 'none', borderRadius: '10px', padding: '0 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

const overlay = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(11,26,63,0.4)',
  backdropFilter: 'blur(5px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100
};

const labelStyle = { fontSize: '11px', fontWeight: '800', color: '#A3AED0', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' };
const cancelBtn = { background: '#F4F7FE', color: '#0B1A3F', border: 'none', borderRadius: '12px', padding: '10px 18px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' };

const saveBtnSmall = { 
  background: '#0B1A3F', 
  color: 'white', 
  border: 'none', 
  borderRadius: '12px', 
  padding: '10px 18px', 
  fontWeight: '800', 
  fontSize: '13px', 
  cursor: 'pointer',
  boxShadow: '0 6px 15px rgba(11,26,63,0.2)'
};

const postImage = { width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '14px', marginTop: '12px' };

const dropdownMenu = {
  position: 'absolute',
  right: 0,
  top: '28px',
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 10px 25px rgba(11,26,63,0.15)',
  border: '1px solid #E9EDF7',
  padding: '6px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  zIndex: 10
};

const dropdownItem = {
  background: 'none',
  border: 'none',
  padding: '8px 12px',
  fontSize: '12px',
  fontWeight: '700',
  color: '#0B1A3F',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  borderRadius: '8px',
  whiteSpace: 'nowrap'
};