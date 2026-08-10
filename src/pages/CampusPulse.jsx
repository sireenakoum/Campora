import React, { useState, useEffect } from 'react';
import { 
  Plus, MessageSquare, Heart, Share2, Search, X, 
  Image as ImageIcon, MoreHorizontal, Filter, MessageCircle, 
  RefreshCw, Send, Edit3, Trash2, EyeOff, UserCheck, CornerDownRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const CATEGORIES = ["All", "Clubs & Events", "Questions", "Campus Life", "Complaints", "Lost & Found", "Opportunities", "Other"];

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

  // Post action dropdown toggle
  const [activeMenuPostId, setActiveMenuPostId] = useState(null);

  // Comment state tracking
  const [commentsState, setCommentsState] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    let uid = null;
    if (userData?.user) {
      uid = userData.user.id;
      setCurrentUserId(uid);
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', uid).maybeSingle();
      setUserName(profile?.name || "Student");

      // Fetch user's existing likes
      const { data: likesData } = await supabase
        .from('campus_pulse_likes')
        .select('post_id')
        .eq('user_id', uid);

      if (likesData) {
        setUserLikes(new Set(likesData.map(l => l.post_id)));
      }
    }

    const { data, error } = await supabase.from('campus_pulse_posts')
      .select('*, campus_pulse_comments(count)')
      .order('created_at', { ascending: false });

    if (error) console.error("Error fetching posts:", error);
    setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- SAFE POST CREATION FIX ---
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!currentUserId) {
      alert("You must be logged in to create a post.");
      return;
    }

    setIsSubmitting(true);

    // Primary Payload
    const fullPayload = {
      user_id: currentUserId,
      author_name: newPost.is_anonymous ? "Anonymous Student" : userName,
      title: newPost.title.trim() || null,
      content: newPost.content.trim(),
      category: newPost.category,
      image_url: newPost.image_url.trim() || null,
      is_anonymous: newPost.is_anonymous
    };

    // First attempt with all fields
    let { error } = await supabase.from('campus_pulse_posts').insert([fullPayload]);

    // Fallback attempt: remove optional fields in case table schema lacks 'is_anonymous' or 'title'
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
      console.error("Post Creation Error:", error);
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
      .update({
        title: editPostData.title,
        content: editPostData.content,
        category: editPostData.category
      })
      .eq('id', editingPostId);

    if (!error) {
      setEditingPostId(null);
      fetchData();
    } else {
      alert(`Could not update post: ${error.message}`);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    const { error } = await supabase.from('campus_pulse_posts').delete().eq('id', postId);
    if (!error) {
      setPosts(posts.filter(p => p.id !== postId));
    } else {
      alert(`Could not delete post: ${error.message}`);
    }
  };

  // --- TOGGLE LIKE / UNLIKE ---
  const handleLikeToggle = async (postId, currentLikesCount) => {
    if (!currentUserId) return;

    const isLiked = userLikes.has(postId);
    const newLikesSet = new Set(userLikes);

    if (isLiked) {
      newLikesSet.delete(postId);
      setUserLikes(newLikesSet);
      setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: Math.max(0, (p.likes_count || 1) - 1) } : p));

      await supabase
        .from('campus_pulse_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', currentUserId);
    } else {
      newLikesSet.add(postId);
      setUserLikes(newLikesSet);
      setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));

      await supabase
        .from('campus_pulse_likes')
        .insert([{ post_id: postId, user_id: currentUserId }]);
    }
  };

  // --- COMMENT ACTIONS ---
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

  const handleAddComment = async (postId) => {
    const postCommentState = commentsState[postId];
    if (!postCommentState?.text?.trim() || !currentUserId) return;

    const payload = {
      post_id: postId,
      user_id: currentUserId,
      author_name: postCommentState.is_anonymous ? "Anonymous Student" : userName,
      content: postCommentState.text.trim()
    };

    const { data, error } = await supabase
      .from('campus_pulse_comments')
      .insert([payload])
      .select()
      .maybeSingle();

    if (error) {
      console.error("Comment error:", error);
      alert(`Could not add comment: ${error.message}`);
      return;
    }

    const newComment = data || {
      id: Date.now().toString(),
      ...payload,
      created_at: new Date().toISOString()
    };

    setCommentsState(prev => ({
      ...prev,
      [postId]: {
        ...postCommentState,
        text: '',
        comments: [...(postCommentState.comments || []), newComment]
      }
    }));

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
          comments: prev[postId].comments.filter(c => c.id !== commentId)
        }
      }));
    }
  };

  const handleUpdateComment = async (postId, commentId) => {
    const { error } = await supabase
      .from('campus_pulse_comments')
      .update({ content: editCommentText })
      .eq('id', commentId);

    if (!error) {
      setCommentsState(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          comments: prev[postId].comments.map(c => c.id === commentId ? { ...c, content: editCommentText } : c)
        }
      }));
      setEditingCommentId(null);
      setEditCommentText('');
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#E0E5F2', padding: '6px 14px', borderRadius: '30px', fontSize: '11px', fontWeight: '800', color: '#0B1A3F', marginBottom: '10px' }}>
            <MessageSquare size={14} color="#4318FF" /> CAMPUS FEED
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
          <Search size={20} color="#A3AED0" />
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
          {CATEGORIES.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              style={activeCategory === cat ? activeFilter : inactiveFilter}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FEED LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#A3AED0' }}>
            <RefreshCw className="animate-spin" style={{ margin: '0 auto 10px auto' }} size={28} />
            <p style={{ fontWeight: '700' }}>Loading latest posts...</p>
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

            return (
              <div key={post.id} style={postCardStyle}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      ...avatarCircle,
                      background: post.is_anonymous ? '#0B1A3F' : '#F4F7FE',
                      color: post.is_anonymous ? '#FFF' : '#0B1A3F'
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
                    <span style={categoryTag}>{post.category}</span>
                    
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

                {/* Content / Edit Form */}
                {editingPostId === post.id ? (
                  <form onSubmit={handleUpdatePost} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '15px' }}>
                    <input 
                      type="text" 
                      value={editPostData.title} 
                      onChange={e => setEditPostData({ ...editPostData, title: e.target.value })} 
                      style={inputStyle} 
                      placeholder="Title" 
                    />
                    <textarea 
                      value={editPostData.content} 
                      onChange={e => setEditPostData({ ...editPostData, content: e.target.value })} 
                      style={{ ...inputStyle, height: '100px', resize: 'none' }} 
                      required 
                    />
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

                {/* Interactions Bar */}
                <div style={{ display: 'flex', gap: '20px', marginTop: '20px', paddingTop: '15px', borderTop: '1.5px solid #F4F7FE' }}>
                  <button onClick={() => handleLikeToggle(post.id, post.likes_count || 0)} style={actionBtn}>
                    <Heart size={18} fill={hasLiked ? '#EE5D50' : 'none'} color={hasLiked ? '#EE5D50' : '#A3AED0'} /> 
                    <span style={{ color: hasLiked ? '#EE5D50' : '#A3AED0' }}>{post.likes_count || 0}</span>
                  </button>
                  <button onClick={() => toggleComments(post.id)} style={actionBtn}>
                    <MessageCircle size={18} /> 
                    <span>{commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}</span>
                  </button>
                  <button onClick={() => navigator.clipboard.writeText(window.location.href)} style={{ ...actionBtn, marginLeft: 'auto' }}>
                    <Share2 size={18} />
                  </button>
                </div>

                {/* COMMENT SECTION */}
                {pCommentState.open && (
                  <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed #E9EDF7' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                          type="text" 
                          placeholder={pCommentState.is_anonymous ? "Write an anonymous comment..." : "Write a comment..."} 
                          value={pCommentState.text || ''} 
                          onChange={e => setCommentsState(prev => ({
                            ...prev,
                            [post.id]: { ...prev[post.id], text: e.target.value }
                          }))}
                          onKeyDown={e => e.key === 'Enter' && handleAddComment(post.id)}
                          style={{ ...inputStyle, padding: '12px 18px', fontSize: '14px' }}
                        />
                        <button onClick={() => handleAddComment(post.id)} style={sendBtn}>
                          <Send size={16} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start' }}>
                        <button 
                          type="button" 
                          onClick={() => setCommentsState(prev => ({
                            ...prev,
                            [post.id]: { ...prev[post.id], is_anonymous: !prev[post.id]?.is_anonymous }
                          }))}
                          style={{
                            background: pCommentState.is_anonymous ? '#0B1A3F' : '#F4F7FE',
                            color: pCommentState.is_anonymous ? '#FFF' : '#A3AED0',
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

                    {pCommentState.loading ? (
                      <p style={{ fontSize: '13px', color: '#A3AED0', fontWeight: '700', textAlign: 'center' }}>Loading comments...</p>
                    ) : pCommentState.comments?.length === 0 ? (
                      <p style={{ fontSize: '13px', color: '#A3AED0', fontWeight: '700', textAlign: 'center', margin: '15px 0' }}>No comments yet. Start the conversation!</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {pCommentState.comments?.map(comment => {
                          const isCommentOwner = comment.user_id === currentUserId;

                          return (
                            <div key={comment.id} style={commentItemStyle}>
                              <CornerDownRight size={14} color="#A3AED0" style={{ marginTop: '4px', flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontWeight: '900', fontSize: '13px', color: '#0B1A3F' }}>{comment.author_name}</span>
                                    <span style={{ fontSize: '10px', color: '#A3AED0', fontWeight: '700' }}>
                                      {new Date(comment.created_at).toLocaleDateString()}
                                    </span>
                                  </div>

                                  {isCommentOwner && (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <button onClick={() => {
                                        setEditingCommentId(comment.id);
                                        setEditCommentText(comment.content);
                                      }} style={iconBtn}><Edit3 size={13} /></button>
                                      <button onClick={() => handleDeleteComment(post.id, comment.id)} style={{ ...iconBtn, color: '#EE5D50' }}><Trash2 size={13} /></button>
                                    </div>
                                  )}
                                </div>

                                {editingCommentId === comment.id ? (
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                    <input 
                                      type="text" 
                                      value={editCommentText} 
                                      onChange={e => setEditCommentText(e.target.value)} 
                                      style={{ ...inputStyle, padding: '6px 12px', fontSize: '13px' }} 
                                    />
                                    <button onClick={() => handleUpdateComment(post.id, comment.id)} style={saveBtnSmall}>Save</button>
                                    <button onClick={() => setEditingCommentId(null)} style={cancelBtn}>Cancel</button>
                                  </div>
                                ) : (
                                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#2B3674', fontWeight: '600' }}>{comment.content}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
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
          <div className="card" style={{ width: '100%', maxWidth: '540px', padding: '32px', borderRadius: '24px', background: 'white', boxShadow: '0 20px 50px rgba(11,26,63,0.2)' }}>
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
                <label style={labelStyle}>IMAGE ATTACHMENT (OPTIONAL)</label>
                <div style={{ position: 'relative' }}>
                  <ImageIcon size={18} style={{ position: 'absolute', left: '15px', top: '15px', color: '#A3AED0' }} />
                  <input type="text" placeholder="https://..." style={{ ...inputStyle, paddingLeft: '45px' }} value={newPost.image_url} onChange={e => setNewPost({...newPost, image_url: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: '#F4F7FE', borderRadius: '16px', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {newPost.is_anonymous ? <EyeOff size={20} color="#0B1A3F" /> : <UserCheck size={20} color="#4318FF" />}
                  <div>
                    <p style={{ margin: 0, fontWeight: '900', fontSize: '13px', color: '#0B1A3F' }}>
                      {newPost.is_anonymous ? 'Post Anonymously' : `Post as ${userName}`}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#A3AED0', fontWeight: '700' }}>
                      {newPost.is_anonymous ? 'Your real name will be hidden' : 'Your name will be visible to everyone'}
                    </p>
                  </div>
                </div>

                <input 
                  type="checkbox" 
                  checked={newPost.is_anonymous} 
                  onChange={e => setNewPost({ ...newPost, is_anonymous: e.target.checked })} 
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#0B1A3F' }}
                />
              </div>

              <button type="submit" disabled={isSubmitting} style={{ ...saveBtn, opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting ? 'Posting...' : 'Post to Pulse'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// --- STYLES ---
const postCardStyle = { background: 'white', borderRadius: '24px', padding: '28px', border: '1.5px solid #E9EDF7', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', position: 'relative' };
const addBtnStyle = { background: '#0B1A3F', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '16px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(11,26,63,0.2)', transition: '0.2s' };
const searchBarContainer = { display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '14px 22px', borderRadius: '50px', border: '1.5px solid #E9EDF7', marginBottom: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.01)' };
const searchField = { border: 'none', outline: 'none', width: '100%', fontSize: '14px', fontWeight: '700', color: '#0B1A3F' };
const inactiveFilter = { background: 'white', border: '1.5px solid #E9EDF7', padding: '8px 18px', borderRadius: '50px', fontSize: '12px', fontWeight: '800', color: '#A3AED0', cursor: 'pointer', whiteSpace: 'nowrap' };
const activeFilter = { ...inactiveFilter, background: '#0B1A3F', color: 'white', border: '1.5px solid #0B1A3F' };
const avatarCircle = { width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', flexShrink: 0 };
const categoryTag = { background: '#F4F7FE', padding: '5px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', color: '#4318FF', textTransform: 'uppercase', letterSpacing: '0.5px' };
const actionBtn = { background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#A3AED0', fontWeight: '800', fontSize: '13px', cursor: 'pointer' };
const postImage = { width: '100%', borderRadius: '18px', marginTop: '16px', maxHeight: '380px', objectFit: 'cover' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(11,26,57,0.4)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' };
const inputStyle = { padding: '12px 16px', borderRadius: '14px', border: '1.5px solid #E9EDF7', background: '#F4F7FE', fontWeight: '700', color: '#0B1A3F', outline: 'none', width: '100%', fontSize: '14px' };
const labelStyle = { display: 'block', fontSize: '10px', fontWeight: '900', color: '#A3AED0', marginBottom: '6px', letterSpacing: '0.5px' };
const saveBtn = { background: '#0B1A3F', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: '900', fontSize: '15px', cursor: 'pointer', marginTop: '8px' };
const sendBtn = { background: '#0B1A3F', color: 'white', border: 'none', width: '45px', height: '45px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 };
const dropdownMenu = { position: 'absolute', right: 0, top: '30px', background: 'white', border: '1.5px solid #E9EDF7', borderRadius: '16px', padding: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '130px' };
const dropdownItem = { background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', color: '#2B3674', cursor: 'pointer', textAlign: 'left', width: '100%' };
const commentItemStyle = { display: 'flex', gap: '10px', background: '#F4F7FE', padding: '12px 16px', borderRadius: '16px' };
const iconBtn = { background: 'none', border: 'none', color: '#A3AED0', cursor: 'pointer', padding: 0 };
const saveBtnSmall = { background: '#0B1A3F', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' };
const cancelBtn = { background: 'none', border: 'none', color: '#A3AED0', padding: '6px 12px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' };