import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  Plus,
  Heart,
  Share2,
  Search,
  X,
  MoreHorizontal,
  MessageCircle,
  RefreshCw,
  Send,
  Edit3,
  Trash2,
  EyeOff,
  UserCheck,
  Sparkles,
  Reply,
  Pin,
  MessageSquare,
  BellPlus,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';

import { supabase } from '../lib/supabase';

// =========================================================
// CATEGORIES
// =========================================================

const CATEGORIES = [
  'All',
  'Clubs & Events',
  'Questions',
  'Campus Life',
  'Complaints',
  'Lost & Found',
  'Opportunities',
  'Other'
];

// =========================================================
// CAMPORA PASTEL CATEGORY COLORS
// MATCHES CAMPUS HUB + NOTIFICATIONS
// =========================================================

const CATEGORY_STYLES = {
  All: {
    bg: '#F4F7FE',
    text: '#0B1A3F',
    border: '#DDE3EE',
    accent: '#0B1A3F'
  },

  'Clubs & Events': {
    bg: '#F2F9F7',
    text: '#5E9A8B',
    border: '#D9EBE6',
    accent: '#5E9A8B'
  },

  Questions: {
    bg: '#F3F7FD',
    text: '#648CCB',
    border: '#DDE7F5',
    accent: '#648CCB'
  },

  'Campus Life': {
    bg: '#FFF6F2',
    text: '#D9896A',
    border: '#F3DDD4',
    accent: '#D9896A'
  },

  Complaints: {
    bg: '#FFF5F6',
    text: '#C76E7D',
    border: '#F0DDE1',
    accent: '#C76E7D'
  },

  'Lost & Found': {
    bg: '#F7F4FC',
    text: '#8B78B8',
    border: '#E7E0F2',
    accent: '#8B78B8'
  },

  Opportunities: {
    bg: '#FFF9F1',
    text: '#C99758',
    border: '#F0E2CB',
    accent: '#C99758'
  },

  Other: {
    bg: '#F6F8FB',
    text: '#75839A',
    border: '#E4E8EF',
    accent: '#75839A'
  }
};

const DM_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

// =========================================================
// SHARED CAMPORA PROFILE COLORS
// SAME PALETTE / LOGIC AS STUDY GROUPS + REGISTRATION
// =========================================================

const AVATAR_PALETTE = [
  '#E0F2FE',
  '#FCE7F3',
  '#F3E8FF',
  '#DCFCE7',
  '#FFEDD5',
  '#CFFAFE',
  '#E0E7FF',
  '#D1FAE5'
];

const getAvatarColor = (name) => {
  const string = name || 'S';

  let hash = 0;

  for (let i = 0; i < string.length; i++) {
    hash =
      string.charCodeAt(i) +
      ((hash << 5) - hash);
  }

  return AVATAR_PALETTE[
    Math.abs(hash) % AVATAR_PALETTE.length
  ];
};

const getAvatarTextColor = (backgroundColor) => {
  const hex = String(backgroundColor || '')
    .replace('#', '')
    .trim();

  if (hex.length !== 6) return '#0B1A3F';

  const red = parseInt(hex.substring(0, 2), 16);
  const green = parseInt(hex.substring(2, 4), 16);
  const blue = parseInt(hex.substring(4, 6), 16);

  const luminance =
    (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance < 0.58 ? '#FFFFFF' : '#0B1A3F';
};

// =========================================================
// HELPERS
// =========================================================

const getInitials = (name = 'Student') => {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return 'S';

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
};

const formatMessageDate = value => {
  if (!value) return '';

  const date = new Date(value);
  const now = new Date();

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return date.toLocaleDateString([], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const createDmMetadataMarker = ({
  context = null,
  reply = null
} = {}) => {
  const meta = {};

  if (context) {
    meta.source = {
      type: context.type || 'campus_pulse',
      postId: context.postId || null,
      commentId: context.commentId || null,
      label: context.label || ''
    };
  }

  if (reply) {
    meta.reply = {
      id: reply.id,
      sender: reply.sender || 'Student',
      text: reply.text || ''
    };
  }

  if (Object.keys(meta).length === 0) {
    return '';
  }

  try {
    return `[[CAMPORA_DM:${encodeURIComponent(
      JSON.stringify(meta)
    )}]]`;
  } catch {
    return '';
  }
};

const parseDirectMessage = rawMessage => {
  const raw = String(rawMessage || '');

  const metaMatch = raw.match(
    /^\[\[CAMPORA_DM:([^\]]+)\]\]/
  );

  if (metaMatch) {
    try {
      const meta = JSON.parse(
        decodeURIComponent(metaMatch[1])
      );

      return {
        text: raw.replace(
          /^\[\[CAMPORA_DM:([^\]]+)\]\]/,
          ''
        ),
        source: meta.source || null,
        reply: meta.reply || null
      };
    } catch {
      return {
        text: raw.replace(
          /^\[\[CAMPORA_DM:[^\]]+\]\]/,
          ''
        ),
        source: null,
        reply: null
      };
    }
  }

  const legacy = raw.match(
    /^\[\[CAMPORA_SOURCE:([^\]]+)\]\]/
  );

  if (legacy) {
    try {
      return {
        text: raw.replace(
          /^\[\[CAMPORA_SOURCE:([^\]]+)\]\]/,
          ''
        ),
        source: JSON.parse(
          decodeURIComponent(legacy[1])
        ),
        reply: null
      };
    } catch {
      return {
        text: raw.replace(
          /^\[\[CAMPORA_SOURCE:[^\]]+\]\]/,
          ''
        ),
        source: null,
        reply: null
      };
    }
  }

  return {
    text: raw
      .replace(
        /^\[\[CAMPORA_DM:[^\]]+\]\]/,
        ''
      )
      .replace(
        /^\[\[CAMPORA_SOURCE:[^\]]+\]\]/,
        ''
      ),
    source: null,
    reply: null
  };
};

// =========================================================
// MAIN COMPONENT
// =========================================================

export default function CampusPulse() {
  const pageTopRef = useRef(null);
  const [activeView, setActiveView] = useState('feed');

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [userName, setUserName] = useState('Student');

  const [userLikes, setUserLikes] = useState(new Set());

  const [remindedPostIds, setRemindedPostIds] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('campora_campus_pulse_reminded_posts') || '[]'
      );
    } catch {
      return [];
    }
  });

  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'Campus Life',
    image_url: '',
    is_anonymous: false
  });

  const [editingPostId, setEditingPostId] = useState(null);

  const [editPostData, setEditPostData] = useState({
    title: '',
    content: '',
    category: ''
  });

  const [activeMenuPostId, setActiveMenuPostId] = useState(null);

  const [commentsState, setCommentsState] = useState({});

  const [replyingToComment, setReplyingToComment] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isReplyAnonymous, setIsReplyAnonymous] = useState(false);

  const [dmInboxMessages, setDmInboxMessages] = useState([]);
  const [dmInboxProfiles, setDmInboxProfiles] = useState({});
  const [dmInboxLoading, setDmInboxLoading] = useState(false);

  const [activeDmUser, setActiveDmUser] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [dmLoading, setDmLoading] = useState(false);

  const [dmSearchQuery, setDmSearchQuery] = useState('');
  const [dmSearchResults, setDmSearchResults] = useState([]);
  const [dmSearching, setDmSearching] = useState(false);

  const [dmMessage, setDmMessage] = useState('');
  const [dmReplyingTo, setDmReplyingTo] = useState(null);

  const [pinnedDmUsers, setPinnedDmUsers] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('campora_registration_pinned_dm_users') || '[]'
      );
    } catch {
      return [];
    }
  });

  const [pinnedDmMessages, setPinnedDmMessages] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem(
          'campora_registration_pinned_dm_messages'
        ) || '{}'
      );
    } catch {
      return {};
    }
  });

  const [dmLocalReactions, setDmLocalReactions] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem(
          'campora_registration_dm_reactions'
        ) || '{}'
      );
    } catch {
      return {};
    }
  });

  const [activeDmMessageMenu, setActiveDmMessageMenu] = useState(null);

  const dmChatHistoryRef = useRef(null);
  const dmChatBottomRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(
      'campora_registration_pinned_dm_users',
      JSON.stringify(Array.isArray(pinnedDmUsers) ? pinnedDmUsers : [])
    );
  }, [pinnedDmUsers]);

  useEffect(() => {
    localStorage.setItem(
      'campora_registration_pinned_dm_messages',
      JSON.stringify(
        pinnedDmMessages &&
        typeof pinnedDmMessages === 'object'
          ? pinnedDmMessages
          : {}
      )
    );
  }, [pinnedDmMessages]);

  useEffect(() => {
    localStorage.setItem(
      'campora_registration_dm_reactions',
      JSON.stringify(
        dmLocalReactions &&
        typeof dmLocalReactions === 'object'
          ? dmLocalReactions
          : {}
      )
    );
  }, [dmLocalReactions]);

  useEffect(() => {
    localStorage.setItem(
      'campora_campus_pulse_reminded_posts',
      JSON.stringify(
        Array.isArray(remindedPostIds) ? remindedPostIds : []
      )
    );
  }, [remindedPostIds]);

  const fetchData = async () => {
    setLoading(true);

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      let uid = null;

      if (user) {
        uid = user.id;

        setCurrentUserId(uid);

        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', uid)
          .maybeSingle();

        setUserName(profile?.name || 'Student');

        const { data: likesData, error: likesError } = await supabase
          .from('campus_pulse_likes')
          .select('post_id')
          .eq('user_id', uid);

        if (likesError) {
          console.error('Could not fetch Campus Pulse likes:', likesError);
        }

        setUserLikes(
          new Set((likesData || []).map(like => like.post_id))
        );
      }

      const { data, error } = await supabase
        .from('campus_pulse_posts')
        .select(`
          *,
          campus_pulse_comments(count),
          campus_pulse_likes(count)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Campus Pulse fetch error:', error);

        const fallback = await supabase
          .from('campus_pulse_posts')
          .select('*, campus_pulse_comments(count)')
          .order('created_at', { ascending: false });

        const fallbackPosts = fallback.data || [];

        if (!fallbackPosts.length) {
          setPosts([]);
          return;
        }

        const postIds = fallbackPosts.map(post => post.id);

        let counts = {};

        if (postIds.length) {
          const likesResult = await supabase
            .from('campus_pulse_likes')
            .select('post_id')
            .in('post_id', postIds);

          (likesResult.data || []).forEach(like => {
            counts[like.post_id] = (counts[like.post_id] || 0) + 1;
          });
        }

        setPosts(
          fallbackPosts.map(post => ({
            ...post,
            campus_pulse_comments_count:
              post.campus_pulse_comments?.[0]?.count || 0,
            likes_count: counts[post.id] || 0
          }))
        );

        return;
      }

      setPosts(
        (data || []).map(post => ({
          ...post,
          campus_pulse_comments_count:
            post.campus_pulse_comments?.[0]?.count || 0,
          likes_count:
            post.campus_pulse_likes?.[0]?.count || 0
        }))
      );
    } catch (error) {
      console.error('Campus Pulse load error:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      const element = pageTopRef.current;

      if (!element) return;

      element.scrollIntoView({
        behavior: 'auto',
        block: 'start'
      });
    });
  }, [activeView]);

  const fetchDmInbox = async ({ silent = false } = {}) => {
    if (!currentUserId) return;

    if (!silent) {
      setDmInboxLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(
          `sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      const messages = data || [];
      setDmInboxMessages(messages);

      const partnerIds = [
        ...new Set(
          messages
            .map(message =>
              message.sender_id === currentUserId
                ? message.receiver_id
                : message.sender_id
            )
            .filter(Boolean)
        )
      ];

      if (!partnerIds.length) {
        if (!silent) {
          setDmInboxProfiles({});
        }
        return;
      }

      const profileMap = {};

      const { data: directoryRows, error: directoryError } =
        await supabase.rpc('get_student_directory_by_ids', {
          user_ids: partnerIds
        });

      if (directoryError) {
        console.error(
          'Could not resolve Campus Pulse DM student names:',
          directoryError
        );
      }

      (directoryRows || []).forEach(profile => {
        profileMap[profile.id] = {
          name:
            profile.name ||
            profile.email?.split('@')[0] ||
            'Student',
          email: profile.email || ''
        };
      });

      posts
        .filter(post => !post.is_anonymous)
        .forEach(post => {
          if (!post.user_id || profileMap[post.user_id]) return;

          profileMap[post.user_id] = {
            name: post.author_name || 'Student',
            email: ''
          };
        });

      setDmInboxProfiles(profileMap);

      if (activeDmUser?.id && profileMap[activeDmUser.id]) {
        setActiveDmUser(previous =>
          previous
            ? {
                ...previous,
                name:
                  profileMap[previous.id]?.name ||
                  previous.name,
                email:
                  profileMap[previous.id]?.email ||
                  previous.email || ''
              }
            : previous
        );
      }
    } catch (error) {
      console.error('Campus Pulse DM inbox error:', error);

      // Keep the currently visible conversation list during silent realtime
      // refresh failures instead of making the sidebar appear to reset.
      if (!silent) {
        setDmInboxMessages([]);
      }
    } finally {
      if (!silent) {
        setDmInboxLoading(false);
      }
    }
  };

  useEffect(() => {
    if (activeView !== 'messages' || !currentUserId) return;

    fetchDmInbox();

    const channel = supabase
      .channel(`campus_pulse_direct_messages_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages'
        },
        () => {
          fetchDmInbox({ silent: true });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeView, currentUserId]);

  useEffect(() => {
    if (activeView !== 'messages') return;

    const query = dmSearchQuery.trim();

    if (!query) {
      setDmSearchResults([]);
      setDmSearching(false);
      return;
    }

    setDmSearching(true);

    const timeout = window.setTimeout(async () => {
      const { data, error } = await supabase.rpc(
        'search_student_directory',
        { search_text: query }
      );

      if (error) {
        console.error('Campus Pulse student search error:', error);
        setDmSearchResults([]);
      } else {
        setDmSearchResults(
          (data || []).filter(profile => profile.id !== currentUserId)
        );
      }

      setDmSearching(false);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [dmSearchQuery, activeView, currentUserId]);

  const startNewDmWithUser = profile => {
    if (!profile?.id || profile.id === currentUserId) return;

    const name =
      profile.name ||
      profile.email?.split('@')[0] ||
      'Student';

    setDmInboxProfiles(previous => ({
      ...previous,
      [profile.id]: {
        name,
        email: profile.email || ''
      }
    }));

    setActiveDmUser({
      id: profile.id,
      name,
      email: profile.email || '',
      context: null
    });

    setDmSearchQuery('');
    setDmSearchResults([]);
  };

  const fetchConversation = async ({ silent = false } = {}) => {
    if (!activeDmUser || !currentUserId) return;

    if (!silent) {
      setDmLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${activeDmUser.id}),and(sender_id.eq.${activeDmUser.id},receiver_id.eq.${currentUserId})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;

      setDmMessages(data || []);
    } catch (error) {
      console.error('Campus Pulse conversation error:', error);
      setDmMessages([]);
    } finally {
      if (!silent) {
        setDmLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!activeDmUser?.id || !currentUserId) {
      setDmMessages([]);
      return;
    }

    fetchConversation();

    const channel = supabase
      .channel(
        `campus_pulse_conversation_${currentUserId}_${activeDmUser.id}`
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages'
        },
        () => {
          fetchConversation({ silent: true });
          fetchDmInbox({ silent: true });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeDmUser?.id, currentUserId]);

  useEffect(() => {
    const history = dmChatHistoryRef.current;

    if (!history) return;

    history.scrollTop = history.scrollHeight;
  }, [dmMessages, activeDmUser?.id]);

  const openDmFromCampusPulse = ({
    userId,
    name,
    isAnonymous,
    context
  }) => {
    if (!userId || !currentUserId) return;

    if (isAnonymous) {
      alert(
        'This person posted anonymously, so their identity stays private and cannot be opened in Direct Messages.'
      );
      return;
    }

    if (userId === currentUserId) {
      return;
    }

    setDmInboxProfiles(previous => ({
      ...previous,
      [userId]: {
        name: name || 'Student',
        email: previous[userId]?.email || ''
      }
    }));

    setActiveDmUser({
      id: userId,
      name: name || 'Student',
      email: dmInboxProfiles[userId]?.email || '',
      context
    });

    setActiveView('messages');
  };

  const handleSendDirectMessage = async () => {
    if (
      !dmMessage.trim() ||
      !activeDmUser ||
      !currentUserId
    ) {
      return;
    }

    const marker = createDmMetadataMarker({
      context: activeDmUser.context || null,
      reply: dmReplyingTo
        ? {
            id: dmReplyingTo.id,
            sender: dmReplyingTo.sender,
            text: dmReplyingTo.text
          }
        : null
    });

    const payload = {
      sender_id: currentUserId,
      receiver_id: activeDmUser.id,
      content: `${marker}${dmMessage.trim()}`
    };

    const { data, error } = await supabase
      .from('direct_messages')
      .insert([payload])
      .select()
      .single();

    if (error) {
      alert(
        `Could not send message: ${error.message}`
      );
      return;
    }

    setDmMessages(previous => {
      if (previous.some(item => item.id === data.id)) {
        return previous;
      }

      return [...previous, data];
    });

    setDmInboxMessages(previous => [
      data,
      ...previous.filter(
        item => item.id !== data.id
      )
    ]);

    setDmMessage('');
    setDmReplyingTo(null);
    setActiveDmMessageMenu(null);

    // Keep the user inside the same conversation after sending.
    setActiveView('messages');

    window.requestAnimationFrame(() => {
      const history =
        dmChatHistoryRef.current;

      if (history) {
        history.scrollTo({
          top: history.scrollHeight,
          behavior: 'smooth'
        });
      }
    });
  };

  const handleDeleteMessage = async message => {
    if (message.sender_id !== currentUserId) return;

    const { error } = await supabase
      .from('direct_messages')
      .delete()
      .eq('id', message.id)
      .eq('sender_id', currentUserId);

    if (error) {
      alert(`Could not delete message: ${error.message}`);
      return;
    }

    setDmMessages(previous =>
      previous.filter(item => item.id !== message.id)
    );

    setDmInboxMessages(previous =>
      previous.filter(item => item.id !== message.id)
    );
  };

  const togglePinDmUser = userId => {
    setPinnedDmUsers(previous => {
      const safePrevious = Array.isArray(previous)
        ? previous
        : [];

      return safePrevious.includes(userId)
        ? safePrevious.filter(id => id !== userId)
        : [...safePrevious, userId];
    });
  };

  const togglePinDmMessage = messageId => {
    if (!activeDmUser?.id) return;

    setPinnedDmMessages(previous => {
      const safePrevious =
        previous && typeof previous === 'object'
          ? previous
          : {};

      const key = activeDmUser.id;

      const current = Array.isArray(
        safePrevious[key]
      )
        ? safePrevious[key]
        : [];

      return {
        ...safePrevious,
        [key]: current.includes(messageId)
          ? current.filter(id => id !== messageId)
          : [...current, messageId]
      };
    });

    setActiveDmMessageMenu(null);
  };

  const toggleLocalDmReaction = (messageId, emoji) => {
    if (!currentUserId) return;

    setDmLocalReactions(previous => {
      const safePrevious =
        previous && typeof previous === 'object'
          ? previous
          : {};

      const messageReactions =
        safePrevious[messageId] &&
        typeof safePrevious[messageId] === 'object'
          ? safePrevious[messageId]
          : {};

      const users = Array.isArray(messageReactions[emoji])
        ? messageReactions[emoji]
        : [];

      const nextUsers = users.includes(currentUserId)
        ? users.filter(id => id !== currentUserId)
        : [...users, currentUserId];

      return {
        ...safePrevious,
        [messageId]: {
          ...messageReactions,
          [emoji]: nextUsers
        }
      };
    });
  };

  const dmConversations = useMemo(() => {
    if (!currentUserId) return [];

    const map = {};

    dmInboxMessages.forEach(message => {
      const otherUserId =
        message.sender_id === currentUserId
          ? message.receiver_id
          : message.sender_id;

      if (!otherUserId) return;

      if (!map[otherUserId]) {
        map[otherUserId] = {
          userId: otherUserId,
          latestMessage: message
        };
      }
    });

    const safePinned = Array.isArray(pinnedDmUsers)
      ? pinnedDmUsers
      : [];

    return Object.values(map).sort((a, b) => {
      const aPinned = safePinned.includes(a.userId);
      const bPinned = safePinned.includes(b.userId);

      if (aPinned !== bPinned) {
        return aPinned ? -1 : 1;
      }

      return (
        new Date(b.latestMessage?.created_at || 0) -
        new Date(a.latestMessage?.created_at || 0)
      );
    });
  }, [dmInboxMessages, currentUserId, pinnedDmUsers]);

  const handleCreatePost = async event => {
    event.preventDefault();

    if (isSubmitting || !currentUserId) return;

    if (!newPost.content.trim()) {
      alert('Please write something before posting.');
      return;
    }

    setIsSubmitting(true);

    const fullPayload = {
      user_id: currentUserId,
      author_name: newPost.is_anonymous
        ? 'Anonymous Student'
        : userName,
      title: newPost.title.trim() || null,
      content: newPost.content.trim(),
      category: newPost.category,
      image_url: newPost.image_url.trim() || null,
      is_anonymous: newPost.is_anonymous
    };

    let { error } = await supabase
      .from('campus_pulse_posts')
      .insert([fullPayload]);

    if (
      error &&
      error.message?.toLowerCase().includes('column')
    ) {
      const fallbackPayload = {
        user_id: currentUserId,
        author_name: newPost.is_anonymous
          ? 'Anonymous Student'
          : userName,
        content: newPost.content.trim(),
        category: newPost.category,
        image_url: newPost.image_url.trim() || null
      };

      const retry = await supabase
        .from('campus_pulse_posts')
        .insert([fallbackPayload]);

      error = retry.error;
    }

    setIsSubmitting(false);

    if (error) {
      alert(`Could not create post: ${error.message}`);
      return;
    }

    setIsModalOpen(false);

    setNewPost({
      title: '',
      content: '',
      category: 'Campus Life',
      image_url: '',
      is_anonymous: false
    });

    await fetchData();
  };

  const handleUpdatePost = async event => {
    event.preventDefault();

    const { error } = await supabase
      .from('campus_pulse_posts')
      .update({
        title: editPostData.title,
        content: editPostData.content,
        category: editPostData.category
      })
      .eq('id', editingPostId);

    if (error) {
      alert(`Could not update post: ${error.message}`);
      return;
    }

    setEditingPostId(null);

    await fetchData();
  };

  const handleDeletePost = async postId => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    const { error } = await supabase
      .from('campus_pulse_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      alert(`Could not delete post: ${error.message}`);
      return;
    }

    setPosts(previous =>
      previous.filter(post => post.id !== postId)
    );
  };

  const handleAddPostReminder = async post => {
    if (!currentUserId || !post?.id) return;

    if (
      Array.isArray(remindedPostIds) &&
      remindedPostIds.includes(post.id)
    ) {
      return;
    }

    const reminderTitle =
      post.title?.trim() ||
      `${post.category || 'Campus Pulse'} update`;

    const reminderMessage =
      post.content?.trim() ||
      'Open Campus Pulse to view this update.';

    const basePayload = {
      user_id: currentUserId,
      title: `Campus Pulse: ${reminderTitle}`,
      message: reminderMessage,
      read: false
    };

    let result = await supabase
      .from('notifications')
      .insert([
        {
          ...basePayload,
          category: 'Campus Pulse'
        }
      ]);

    // Some versions of the notifications table may not have a category column.
    if (
      result.error &&
      result.error.message?.toLowerCase().includes('category')
    ) {
      result = await supabase
        .from('notifications')
        .insert([basePayload]);
    }

    // Older schemas may use content instead of message.
    if (
      result.error &&
      result.error.message?.toLowerCase().includes('message')
    ) {
      result = await supabase
        .from('notifications')
        .insert([
          {
            user_id: currentUserId,
            title: `Campus Pulse: ${reminderTitle}`,
            content: reminderMessage,
            read: false
          }
        ]);
    }

    if (result.error) {
      alert(
        `Could not add reminder: ${result.error.message}`
      );
      return;
    }

    setRemindedPostIds(previous => {
      const safePrevious = Array.isArray(previous)
        ? previous
        : [];

      return safePrevious.includes(post.id)
        ? safePrevious
        : [...safePrevious, post.id];
    });
  };

  const handleLikeToggle = async postId => {
    if (!currentUserId) return;

    const isLiked = userLikes.has(postId);

    setUserLikes(previous => {
      const next = new Set(previous);

      if (isLiked) {
        next.delete(postId);
      } else {
        next.add(postId);
      }

      return next;
    });

    setPosts(previous =>
      previous.map(post =>
        post.id === postId
          ? {
              ...post,
              likes_count: isLiked
                ? Math.max(0, (post.likes_count || 0) - 1)
                : (post.likes_count || 0) + 1
            }
          : post
      )
    );

    if (isLiked) {
      const { error } = await supabase
        .from('campus_pulse_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', currentUserId);

      if (error) {
        console.error('Unlike error:', error);
        await fetchData();
      }

      return;
    }

    const { error } = await supabase
      .from('campus_pulse_likes')
      .insert([
        {
          post_id: postId,
          user_id: currentUserId
        }
      ]);

    if (error) {
      console.error('Like error:', error);
      await fetchData();
    }
  };

  const toggleComments = async postId => {
    const currentState =
      commentsState[postId] || {
        open: false,
        comments: [],
        text: '',
        is_anonymous: false,
        loading: false
      };

    if (currentState.open) {
      setCommentsState(previous => ({
        ...previous,
        [postId]: {
          ...currentState,
          open: false
        }
      }));

      return;
    }

    setCommentsState(previous => ({
      ...previous,
      [postId]: {
        ...currentState,
        open: true,
        loading: true
      }
    }));

    const { data, error } = await supabase
      .from('campus_pulse_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Comment fetch error:', error);
    }

    setCommentsState(previous => ({
      ...previous,
      [postId]: {
        ...currentState,
        open: true,
        comments: data || [],
        loading: false
      }
    }));
  };

  const handleAddComment = async (
    postId,
    parentComment = null
  ) => {
    const postCommentState =
      commentsState[postId] || {
        comments: [],
        text: '',
        is_anonymous: false
      };

    const textToSend = parentComment
      ? replyText
      : postCommentState.text;

    const isAnonymous = parentComment
      ? isReplyAnonymous
      : postCommentState.is_anonymous;

    if (!textToSend?.trim() || !currentUserId) return;

    const payload = {
      post_id: postId,
      user_id: currentUserId,
      author_name: isAnonymous
        ? 'Anonymous Student'
        : userName,
      content: textToSend.trim(),
      parent_id: parentComment
        ? parentComment.id
        : null
    };

    let { data, error } = await supabase
      .from('campus_pulse_comments')
      .insert([payload])
      .select()
      .maybeSingle();

    if (
      error &&
      error.message?.toLowerCase().includes('column')
    ) {
      const fallbackPayload = {
        ...payload
      };

      delete fallbackPayload.parent_id;

      const retry = await supabase
        .from('campus_pulse_comments')
        .insert([fallbackPayload])
        .select()
        .maybeSingle();

      data = retry.data;
      error = retry.error;
    }

    if (error) {
      alert(`Could not add comment: ${error.message}`);
      return;
    }

    const newComment =
      data || {
        id: `${Date.now()}-${Math.random()}`,
        ...payload,
        created_at: new Date().toISOString()
      };

    setCommentsState(previous => ({
      ...previous,
      [postId]: {
        ...postCommentState,
        text: parentComment
          ? postCommentState.text
          : '',
        comments: [
          ...(postCommentState.comments || []),
          newComment
        ]
      }
    }));

    if (parentComment) {
      setReplyingToComment(null);
      setReplyText('');
      setIsReplyAnonymous(false);
    }

    setPosts(previous =>
      previous.map(post =>
        post.id === postId
          ? {
              ...post,
              campus_pulse_comments_count:
                (post.campus_pulse_comments_count || 0) + 1
            }
          : post
      )
    );
  };

  const handleDeleteComment = async (
    postId,
    commentId
  ) => {
    const { error } = await supabase
      .from('campus_pulse_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      alert(`Could not delete comment: ${error.message}`);
      return;
    }

    setCommentsState(previous => {
      const current =
        previous[postId] || {
          comments: []
        };

      const removedCount = (current.comments || []).filter(
        comment =>
          comment.id === commentId ||
          comment.parent_id === commentId
      ).length;

      setPosts(previousPosts =>
        previousPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                campus_pulse_comments_count: Math.max(
                  0,
                  (post.campus_pulse_comments_count || 0) -
                    Math.max(1, removedCount)
                )
              }
            : post
        )
      );

      return {
        ...previous,
        [postId]: {
          ...current,
          comments: (current.comments || []).filter(
            comment =>
              comment.id !== commentId &&
              comment.parent_id !== commentId
          )
        }
      };
    });
  };

  const filteredPosts = posts.filter(post => {
    const matchesCategory =
      activeCategory === 'All' ||
      post.category === activeCategory;

    const query = searchQuery
      .trim()
      .toLowerCase();

    const matchesSearch =
      !query ||
      post.content?.toLowerCase().includes(query) ||
      post.title?.toLowerCase().includes(query) ||
      post.author_name?.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  return (
    <div ref={pageTopRef} style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={campusFeedBadgeStyle}>
            <Sparkles size={14} color="#0B1A3F" />
            CAMPUS FEED
          </div>

          <h1 style={pageTitleStyle}>Campus Pulse</h1>

          <p style={pageSubtitleStyle}>
            What's happening in your student community today?
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={addBtnStyle}
        >
          <Plus size={20} strokeWidth={3} />
          Create Post
        </button>
      </div>

      {/* FEED + DIRECT MESSAGES BOTH USE CAMPORA NAVY */}
      <div style={viewTabsWrapStyle}>
        <button
          type="button"
          onClick={() => setActiveView('feed')}
          style={{
            ...viewTabStyle,
            background:
              activeView === 'feed'
                ? '#0B1A3F'
                : '#F4F7FE',
            color:
              activeView === 'feed'
                ? '#FFFFFF'
                : '#0B1A3F',
            borderColor:
              activeView === 'feed'
                ? '#0B1A3F'
                : '#DDE3EE',
            boxShadow:
              activeView === 'feed'
                ? '0 6px 16px rgba(11,26,63,0.18)'
                : 'none'
          }}
        >
          <Sparkles size={16} />
          Feed
        </button>

        <button
          type="button"
          onClick={() => setActiveView('messages')}
          style={{
            ...viewTabStyle,
            background:
              activeView === 'messages'
                ? '#0B1A3F'
                : '#F4F7FE',
            color:
              activeView === 'messages'
                ? '#FFFFFF'
                : '#0B1A3F',
            borderColor:
              activeView === 'messages'
                ? '#0B1A3F'
                : '#DDE3EE',
            boxShadow:
              activeView === 'messages'
                ? '0 6px 16px rgba(11,26,63,0.18)'
                : 'none'
          }}
        >
          <MessageSquare size={16} />
          Direct Messages
        </button>
      </div>

      {activeView === 'feed' && (
        <>
          <div style={{ marginBottom: '28px' }}>
            <div style={searchBarContainer}>
              <Search size={20} color="#0B1A3F" />

              <input
                type="text"
                placeholder="Search discussions, announcements, lost items..."
                style={searchField}
                value={searchQuery}
                onChange={event =>
                  setSearchQuery(event.target.value)
                }
              />

              {searchQuery && (
                <X
                  size={18}
                  color="#A3AED0"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSearchQuery('')}
                />
              )}
            </div>

            <div style={categoryTabsStyle}>
              {CATEGORIES.map(category => {
                const categoryStyle =
                  CATEGORY_STYLES[category] ||
                  CATEGORY_STYLES.Other;

                const isActive =
                  activeCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() =>
                      setActiveCategory(category)
                    }
                    style={{
                      padding: '8px 18px',
                      borderRadius: '50px',
                      fontSize: '12px',
                      fontWeight: '900',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                      background: isActive
                        ? categoryStyle.accent
                        : categoryStyle.bg,
                      color: isActive
                        ? '#FFFFFF'
                        : categoryStyle.text,
                      border: isActive
                        ? `1.5px solid ${categoryStyle.accent}`
                        : `1.5px solid ${categoryStyle.border}`,
                      boxShadow: isActive
                        ? `0 5px 14px ${categoryStyle.accent}22`
                        : 'none'
                    }}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={feedListStyle}>
            {loading ? (
              <div style={loadingStateStyle}>
                <RefreshCw
                  className="animate-spin"
                  size={32}
                  color="#0B1A3F"
                />
                <p>Loading latest posts...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div style={emptyFeedStyle}>
                <MessageCircle size={40} color="#A3AED0" />
                <h3>No posts found</h3>
                <p>
                  Be the first one to share something under{' '}
                  {activeCategory}!
                </p>
              </div>
            ) : (
              filteredPosts.map(post => {
                const isOwner =
                  post.user_id === currentUserId;

                const postCommentState =
                  commentsState[post.id] || {};

                const commentCount =
                  post.campus_pulse_comments_count ?? 0;

                const hasLiked =
                  userLikes.has(post.id);

                const categoryBadge =
                  CATEGORY_STYLES[post.category] ||
                  CATEGORY_STYLES.Other;

                const allComments =
                  postCommentState.comments || [];

                const commentsById = {};
                allComments.forEach(comment => {
                  commentsById[comment.id] = comment;
                });

                const buildCommentTree = comments => {
                  const map = {};
                  const roots = [];

                  comments.forEach(comment => {
                    map[comment.id] = {
                      ...comment,
                      replies: []
                    };
                  });

                  comments.forEach(comment => {
                    if (
                      comment.parent_id &&
                      map[comment.parent_id]
                    ) {
                      map[comment.parent_id].replies.push(
                        map[comment.id]
                      );
                    } else {
                      roots.push(map[comment.id]);
                    }
                  });

                  return roots;
                };

                const commentTree =
                  buildCommentTree(allComments);

                const postContext = {
                  type: 'post',
                  postId: post.id,
                  label:
                    post.title ||
                    post.content?.slice(0, 70) ||
                    'Campus Pulse post'
                };

                return (
                  <div
                    key={post.id}
                    style={{
                      ...postCardStyle,
                      borderColor: categoryBadge.accent,
                      borderTop:
                        `10px solid ${categoryBadge.accent}`
                    }}
                  >
                    <div style={postHeaderStyle}>
                      <button
                        type="button"
                        onClick={() =>
                          openDmFromCampusPulse({
                            userId: post.user_id,
                            name: post.author_name,
                            isAnonymous:
                              !!post.is_anonymous ||
                              post.author_name ===
                                'Anonymous Student',
                            context: postContext
                          })
                        }
                        disabled={
                          !post.user_id ||
                          post.user_id === currentUserId
                        }
                        style={profileButtonStyle}
                        title={
                          post.is_anonymous
                            ? 'Anonymous profiles stay private'
                            : post.user_id === currentUserId
                            ? 'This is your post'
                            : `Message ${post.author_name}`
                        }
                      >
                        <div
                          style={{
                            ...avatarCircle,
                            background: post.is_anonymous
                              ? '#0B1A3F'
                              : getAvatarColor(
                                  post.author_name || 'Student'
                                ),
                            color: post.is_anonymous
                              ? '#FFFFFF'
                              : getAvatarTextColor(
                                  getAvatarColor(
                                    post.author_name || 'Student'
                                  )
                                ),
                            border: '1px solid rgba(11,26,63,0.08)'
                          }}
                        >
                          {post.is_anonymous ? (
                            <EyeOff size={18} />
                          ) : (
                            getInitials(
                              post.author_name || 'Student'
                            )
                          )}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div style={postAuthorRowStyle}>
                            <p style={postAuthorNameStyle}>
                              {post.author_name}
                            </p>

                            {post.is_anonymous && (
                              <span style={anonymousTagStyle}>
                                ANONYMOUS
                              </span>
                            )}
                          </div>

                          <p style={postDateStyle}>
                            {new Date(
                              post.created_at
                            ).toLocaleDateString(
                              undefined,
                              {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }
                            )}
                          </p>
                        </div>
                      </button>

                      <div style={postHeaderActionsStyle}>
                        <span
                          style={{
                            background: categoryBadge.bg,
                            color: categoryBadge.text,
                            border:
                              `1px solid ${categoryBadge.border}`,
                            padding: '5px 12px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '800',
                            letterSpacing: '0.3px'
                          }}
                        >
                          {post.category}
                        </span>

                        {isOwner && (
                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMenuPostId(
                                  activeMenuPostId ===
                                    post.id
                                    ? null
                                    : post.id
                                )
                              }
                              style={moreButtonStyle}
                            >
                              <MoreHorizontal size={20} />
                            </button>

                            {activeMenuPostId === post.id && (
                              <div style={dropdownMenu}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPostId(post.id);

                                    setEditPostData({
                                      title: post.title || '',
                                      content:
                                        post.content || '',
                                      category:
                                        post.category
                                    });

                                    setActiveMenuPostId(null);
                                  }}
                                  style={dropdownItem}
                                >
                                  <Edit3 size={15} />
                                  Edit Post
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDeletePost(post.id);
                                    setActiveMenuPostId(null);
                                  }}
                                  style={{
                                    ...dropdownItem,
                                    color: '#EE5D50'
                                  }}
                                >
                                  <Trash2 size={15} />
                                  Delete Post
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {editingPostId === post.id ? (
                      <form
                        onSubmit={handleUpdatePost}
                        style={editFormStyle}
                      >
                        <input
                          type="text"
                          value={editPostData.title}
                          onChange={event =>
                            setEditPostData({
                              ...editPostData,
                              title: event.target.value
                            })
                          }
                          style={inputStyle}
                          placeholder="Title"
                        />

                        <textarea
                          value={editPostData.content}
                          onChange={event =>
                            setEditPostData({
                              ...editPostData,
                              content: event.target.value
                            })
                          }
                          style={{
                            ...inputStyle,
                            height: '100px',
                            resize: 'none'
                          }}
                          required
                        />

                        <div style={editActionsStyle}>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingPostId(null)
                            }
                            style={cancelBtn}
                          >
                            Cancel
                          </button>

                          <button
                            type="submit"
                            style={saveBtnSmall}
                          >
                            Save Changes
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        {post.title && (
                          <h2 style={postTitleStyle}>
                            {post.title}
                          </h2>
                        )}

                        <p style={postContentStyle}>
                          {post.content}
                        </p>

                        {post.image_url && (
                          <img
                            src={post.image_url}
                            style={postImage}
                            alt="Post Attachment"
                          />
                        )}
                      </>
                    )}

                    <div
                      style={{
                        ...postActionsRowStyle,
                        borderTop:
                          `1.5px solid ${categoryBadge.border}`
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleLikeToggle(post.id)
                        }
                        style={actionBtn}
                      >
                        <Heart
                          size={18}
                          fill={
                            hasLiked
                              ? '#FF4D4D'
                              : 'none'
                          }
                          color={
                            hasLiked
                              ? '#FF4D4D'
                              : '#A3AED0'
                          }
                        />

                        <span
                          style={{
                            color:
                              hasLiked
                                ? '#FF4D4D'
                                : '#A3AED0',
                            fontWeight: '800'
                          }}
                        >
                          {post.likes_count || 0}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleComments(post.id)
                        }
                        style={actionBtn}
                      >
                        <MessageCircle
                          size={18}
                          color={
                            postCommentState.open
                              ? '#0B1A3F'
                              : '#A3AED0'
                          }
                        />

                        <span
                          style={{
                            color:
                              postCommentState.open
                                ? '#0B1A3F'
                                : '#A3AED0'
                          }}
                        >
                          {commentCount}{' '}
                          {commentCount === 1
                            ? 'Comment'
                            : 'Comments'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleAddPostReminder(post)
                        }
                        disabled={
                          Array.isArray(remindedPostIds) &&
                          remindedPostIds.includes(post.id)
                        }
                        title={
                          Array.isArray(remindedPostIds) &&
                          remindedPostIds.includes(post.id)
                            ? 'Reminder added'
                            : 'Add this to your notifications'
                        }
                        style={{
                          ...actionBtn,
                          color:
                            Array.isArray(remindedPostIds) &&
                            remindedPostIds.includes(post.id)
                              ? categoryBadge.accent
                              : '#A3AED0',
                          opacity:
                            Array.isArray(remindedPostIds) &&
                            remindedPostIds.includes(post.id)
                              ? 0.85
                              : 1
                        }}
                      >
                        <BellPlus size={18} />
                        <span>
                          {Array.isArray(remindedPostIds) &&
                          remindedPostIds.includes(post.id)
                            ? 'Reminder added'
                            : 'Remind me'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            window.location.href
                          )
                        }
                        style={{
                          ...actionBtn,
                          marginLeft: 'auto'
                        }}
                      >
                        <Share2 size={18} />
                      </button>
                    </div>

                    {postCommentState.open && (
                      <div
                        style={{
                          marginTop: '20px',
                          paddingTop: '15px',
                          borderTop:
                            `1px dashed ${categoryBadge.border}`
                        }}
                      >
                        <div style={commentComposerWrapStyle}>
                          <div style={commentComposerRowStyle}>
                            <input
                              type="text"
                              placeholder={
                                postCommentState.is_anonymous
                                  ? 'Write an anonymous comment...'
                                  : 'Write a comment...'
                              }
                              value={
                                postCommentState.text || ''
                              }
                              onChange={event =>
                                setCommentsState(
                                  previous => ({
                                    ...previous,
                                    [post.id]: {
                                      ...previous[post.id],
                                      text:
                                        event.target.value
                                    }
                                  })
                                )
                              }
                              onKeyDown={event => {
                                if (
                                  event.key === 'Enter'
                                ) {
                                  event.preventDefault();
                                  handleAddComment(post.id);
                                }
                              }}
                              style={{
                                ...inputStyle,
                                padding: '12px 18px',
                                fontSize: '15px',
                                borderColor:
                                  categoryBadge.border
                              }}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                handleAddComment(post.id)
                              }
                              style={sendBtn}
                            >
                              <Send size={16} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setCommentsState(
                                previous => ({
                                  ...previous,
                                  [post.id]: {
                                    ...previous[post.id],
                                    is_anonymous:
                                      !previous[post.id]
                                        ?.is_anonymous
                                  }
                                })
                              )
                            }
                            style={{
                              ...anonymousCommentButtonStyle,
                              background:
                                postCommentState.is_anonymous
                                  ? '#0B1A3F'
                                  : '#F4F7FE',
                              color:
                                postCommentState.is_anonymous
                                  ? '#FFFFFF'
                                  : '#0B1A3F'
                            }}
                          >
                            {postCommentState.is_anonymous ? (
                              <EyeOff size={12} />
                            ) : (
                              <UserCheck size={12} />
                            )}

                            {postCommentState.is_anonymous
                              ? 'Commenting Anonymously'
                              : `Comment as ${userName}`}
                          </button>
                        </div>

                        {postCommentState.loading ? (
                          <div style={commentsLoadingStyle}>
                            <RefreshCw
                              className="animate-spin"
                              size={20}
                              color="#0B1A3F"
                            />
                            <p>Loading discussion...</p>
                          </div>
                        ) : allComments.length === 0 ? (
                          <p style={noCommentsStyle}>
                            No comments yet. Start the
                            conversation!
                          </p>
                        ) : (
                          <div style={commentsListStyle}>
                            {commentTree.map(comment => (
                              <CommentItem
                                key={comment.id}
                                comment={comment}
                                commentsById={commentsById}
                                postId={post.id}
                                postContext={postContext}
                                currentUserId={
                                  currentUserId
                                }
                                userName={userName}
                                replyingToComment={
                                  replyingToComment
                                }
                                setReplyingToComment={
                                  setReplyingToComment
                                }
                                replyText={replyText}
                                setReplyText={
                                  setReplyText
                                }
                                isReplyAnonymous={
                                  isReplyAnonymous
                                }
                                setIsReplyAnonymous={
                                  setIsReplyAnonymous
                                }
                                handleAddComment={
                                  handleAddComment
                                }
                                handleDeleteComment={
                                  handleDeleteComment
                                }
                                openDmFromCampusPulse={
                                  openDmFromCampusPulse
                                }
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
        </>
      )}

      {activeView === 'messages' && (
        <div>
          <div style={{ marginBottom: '18px' }}>
            <h2
              style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '900',
                color: '#0B1A3F'
              }}
            >
              Direct Messages
            </h2>

            <p
              style={{
                margin: '5px 0 0',
                color: '#94A3B8',
                fontSize: '13px',
                fontWeight: '700'
              }}
            >
              Search by student name or email and keep your private
              conversations in one place.
            </p>
          </div>

          <div style={instagramDmShell}>
            <aside style={instagramDmSidebar}>
              <div style={instagramDmSidebarHeader}>
                <div>
                  <h4 style={instagramDmSidebarTitle}>Messages</h4>
                  <p style={instagramDmSidebarSubtitle}>
                    Your conversations
                  </p>
                </div>

                <MessageCircle size={20} color="#0B1A3F" />
              </div>

              <div style={instagramSearchWrap}>
                <div style={instagramSearchBar}>
                  <Search size={18} style={instagramSearchIcon} />

                  <input
                    type="text"
                    value={dmSearchQuery}
                    onChange={event =>
                      setDmSearchQuery(event.target.value)
                    }
                    placeholder="Search name or email"
                    style={instagramSearchInput}
                  />

                  {dmSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setDmSearchQuery('')}
                      style={instagramSearchClear}
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>

              {dmSearchQuery.trim() && (
                <div style={instagramSearchResults}>
                  {dmSearching ? (
                    <div style={instagramSearchStatus}>
                      Searching students...
                    </div>
                  ) : dmSearchResults.length === 0 ? (
                    <div style={instagramSearchStatus}>
                      No students found.
                    </div>
                  ) : (
                    dmSearchResults.map(profile => {
                      const resultName =
                        profile.name ||
                        profile.email?.split('@')[0] ||
                        'Student';

                      return (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() => startNewDmWithUser(profile)}
                          style={instagramSearchResultRow}
                        >
                          <div
                            style={{
                              ...instagramAvatar,
                              background: getAvatarColor(resultName),
                              color: getAvatarTextColor(
                                getAvatarColor(resultName)
                              )
                            }}
                          >
                            {getInitials(resultName)}
                          </div>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={instagramPersonName}>{resultName}</p>
                            <p style={instagramPersonMeta}>
                              {profile.email || 'Student'}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              <div style={instagramThreadList}>
                {dmInboxLoading ? (
                  <div style={instagramEmptyThreads}>
                    Loading conversations...
                  </div>
                ) : dmConversations.length === 0 ? (
                  <div style={instagramEmptyThreads}>
                    <MessageSquare size={34} strokeWidth={1.5} />
                    <p style={{ margin: '10px 0 0' }}>
                      No conversations yet.
                    </p>
                    <p style={{ margin: '4px 0 0', fontWeight: '600' }}>
                      Search above or click a named Campus Pulse user.
                    </p>
                  </div>
                ) : (
                  dmConversations.map(conversation => {
                    const profile =
                      dmInboxProfiles[conversation.userId] || {
                        name: 'Student',
                        email: ''
                      };

                    const parsed = parseDirectMessage(
                      conversation.latestMessage?.content
                    );

                    const safePinned = Array.isArray(pinnedDmUsers)
                      ? pinnedDmUsers
                      : [];

                    const isPinned = safePinned.includes(
                      conversation.userId
                    );

                    const selected =
                      activeDmUser?.id === conversation.userId;

                    return (
                      <button
                        key={conversation.userId}
                        type="button"
                        onClick={() =>
                          setActiveDmUser({
                            id: conversation.userId,
                            name: profile.name || 'Student',
                            email: profile.email || '',
                            context: parsed.source || null
                          })
                        }
                        style={{
                          ...instagramThreadRow,
                          ...(selected ? instagramThreadRowActive : {})
                        }}
                      >
                        <div
                          style={{
                            ...instagramAvatar,
                            background: getAvatarColor(
                              profile.name || 'Student'
                            ),
                            color: getAvatarTextColor(
                              getAvatarColor(
                                profile.name || 'Student'
                              )
                            )
                          }}
                        >
                          {getInitials(profile.name)}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={instagramThreadTopLine}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                minWidth: 0
                              }}
                            >
                              {isPinned && (
                                <Pin
                                  size={11}
                                  fill="#0B1A3F"
                                  color="#0B1A3F"
                                />
                              )}

                              <p style={instagramPersonName}>
                                {profile.name || 'Student'}
                              </p>
                            </div>

                            {conversation.latestMessage?.created_at && (
                              <span style={instagramThreadDate}>
                                {new Date(
                                  conversation.latestMessage.created_at
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {profile.email && (
                            <p style={instagramPersonMeta}>{profile.email}</p>
                          )}

                          <p style={instagramMessagePreview}>
                            {parsed.text || 'Click to view conversation'}
                          </p>
                        </div>

                        <span
                          onClick={event => {
                            event.stopPropagation();
                            togglePinDmUser(conversation.userId);
                          }}
                          style={instagramPinButton}
                        >
                          <Pin
                            size={15}
                            fill={isPinned ? '#0B1A3F' : 'none'}
                            color={isPinned ? '#0B1A3F' : '#A3AED0'}
                          />
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            <section style={instagramChatPanel}>
              {!activeDmUser ? (
                <div style={instagramNoChat}>
                  <div style={instagramNoChatIcon}>
                    <MessageCircle size={32} />
                  </div>

                  <h4 style={instagramNoChatTitle}>Your messages</h4>

                  <p style={instagramNoChatText}>
                    Select a conversation on the left or search for a student
                    to start chatting.
                  </p>
                </div>
              ) : (
                <>
                  <div style={instagramChatHeader}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '13px',
                        minWidth: 0
                      }}
                    >
                      <div
                        style={{
                          ...instagramAvatarLarge,
                          background: getAvatarColor(
                            activeDmUser.name || 'Student'
                          ),
                          color: getAvatarTextColor(
                            getAvatarColor(
                              activeDmUser.name || 'Student'
                            )
                          )
                        }}
                      >
                        {getInitials(activeDmUser.name)}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <h4 style={instagramChatName}>{activeDmUser.name}</h4>
                        <p style={instagramChatEmail}>
                          {activeDmUser.email || 'Campora Student'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => togglePinDmUser(activeDmUser.id)}
                      style={instagramHeaderPin}
                    >
                      <Pin
                        size={16}
                        color={
                          (Array.isArray(pinnedDmUsers)
                            ? pinnedDmUsers
                            : []
                          ).includes(activeDmUser.id)
                            ? '#0B1A3F'
                            : '#64748B'
                        }
                        fill={
                          (Array.isArray(pinnedDmUsers)
                            ? pinnedDmUsers
                            : []
                          ).includes(activeDmUser.id)
                            ? '#0B1A3F'
                            : 'none'
                        }
                      />
                    </button>
                  </div>

                  {(pinnedDmMessages[activeDmUser.id] || []).length > 0 && (
                    <div style={instagramPinnedWrap}>
                      <div style={instagramPinnedTitle}>
                        <Pin size={13} fill="#B45309" color="#B45309" />
                        PINNED MESSAGES (
                        {(pinnedDmMessages[activeDmUser.id] || []).length})
                      </div>

                      <div style={instagramPinnedList}>
                        {(pinnedDmMessages[activeDmUser.id] || []).map(
                          pinnedId => {
                            const pinnedMessage = dmMessages.find(
                              message => message.id === pinnedId
                            );

                            if (!pinnedMessage) return null;

                            const parsedPinned = parseDirectMessage(
                              pinnedMessage.content
                            );

                            return (
                              <div key={pinnedId} style={instagramPinnedChip}>
                                <div style={{ minWidth: 0 }}>
                                  <div style={instagramPinnedMessageText}>
                                    {parsedPinned.text || 'Message'}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => togglePinDmMessage(pinnedId)}
                                  style={instagramPinnedRemove}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}

                  <div ref={dmChatHistoryRef} style={instagramChatHistory}>
                    {dmLoading ? (
                      <div style={instagramEmptyChat}>
                        Loading conversation...
                      </div>
                    ) : dmMessages.length === 0 ? (
                      <div style={instagramEmptyChat}>
                        <div
                          style={{
                            ...instagramAvatarLarge,
                            width: '64px',
                            height: '64px',
                            marginBottom: '10px',
                            background: getAvatarColor(
                              activeDmUser.name || 'Student'
                            ),
                            color: getAvatarTextColor(
                              getAvatarColor(
                                activeDmUser.name || 'Student'
                              )
                            )
                          }}
                        >
                          {getInitials(activeDmUser.name)}
                        </div>

                        <strong
                          style={{
                            color: '#0B1A3F',
                            fontSize: '15px'
                          }}
                        >
                          {activeDmUser.name}
                        </strong>

                        <span style={{ marginTop: '5px' }}>
                          Start your private conversation.
                        </span>
                      </div>
                    ) : (
                      dmMessages.map(message => {
                        const isMe = message.sender_id === currentUserId;
                        const parsed = parseDirectMessage(message.content);
                        const reactionMap =
                          dmLocalReactions[message.id] || {};

                        const isPinnedMessage = (
                          pinnedDmMessages[activeDmUser.id] || []
                        ).includes(message.id);

                        return (
                          <div
                            key={message.id}
                            style={{
                              display: 'flex',
                              justifyContent: isMe ? 'flex-end' : 'flex-start',
                              marginBottom: '14px',
                              position: 'relative'
                            }}
                          >
                            <div
                              style={{
                                maxWidth: '76%',
                                position: 'relative'
                              }}
                            >
                              <div
                                style={{
                                  ...instagramBubble,
                                  maxWidth: '100%',
                                  ...(isMe
                                    ? instagramBubbleMine
                                    : instagramBubbleTheirs)
                                }}
                              >
                                {parsed.reply && (
                                  <div
                                    style={{
                                      ...instagramReplyQuote,
                                      ...(isMe
                                        ? instagramReplyQuoteMine
                                        : {})
                                    }}
                                  >
                                    <strong>{parsed.reply.sender}</strong>
                                    <span>{parsed.reply.text}</span>
                                  </div>
                                )}

                                <p style={instagramBubbleText}>{parsed.text}</p>

                                <div style={instagramBubbleFooter}>
                                  <span>
                                    {message.created_at
                                      ? new Date(
                                          message.created_at
                                        ).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })
                                      : ''}
                                  </span>

                                  {isMe && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteMessage(message)
                                      }
                                      style={dmBubbleDeleteStyle}
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {Object.entries(reactionMap).some(
                                ([, users]) =>
                                  Array.isArray(users) && users.length
                              ) && (
                                <div
                                  style={{
                                    ...instagramReactionRow,
                                    justifyContent: isMe
                                      ? 'flex-end'
                                      : 'flex-start'
                                  }}
                                >
                                  {Object.entries(reactionMap).map(
                                    ([emoji, users]) =>
                                      Array.isArray(users) && users.length ? (
                                        <button
                                          key={emoji}
                                          type="button"
                                          onClick={() =>
                                            toggleLocalDmReaction(
                                              message.id,
                                              emoji
                                            )
                                          }
                                          style={instagramReactionPill}
                                        >
                                          {emoji} {users.length}
                                        </button>
                                      ) : null
                                  )}
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  setActiveDmMessageMenu(
                                    activeDmMessageMenu === message.id
                                      ? null
                                      : message.id
                                  )
                                }
                                style={{
                                  ...instagramMessageMenuButton,
                                  ...(isMe
                                    ? { right: '100%' }
                                    : { left: '100%' })
                                }}
                              >
                                •••
                              </button>

                              {activeDmMessageMenu === message.id && (
                                <div
                                  style={{
                                    ...instagramMessageMenu,
                                    ...(isMe ? { right: '0' } : { left: '0' })
                                  }}
                                >
                                  {DM_REACTIONS.map(emoji => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() =>
                                        toggleLocalDmReaction(
                                          message.id,
                                          emoji
                                        )
                                      }
                                      style={instagramEmojiButton}
                                    >
                                      {emoji}
                                    </button>
                                  ))}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDmReplyingTo({
                                        id: message.id,
                                        sender: isMe
                                          ? 'You'
                                          : activeDmUser.name,
                                        text: parsed.text
                                      });

                                      setActiveDmMessageMenu(null);
                                    }}
                                    style={instagramMenuAction}
                                  >
                                    <Reply size={13} /> Reply
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      togglePinDmMessage(message.id)
                                    }
                                    style={instagramMenuAction}
                                  >
                                    <Pin size={13} />{' '}
                                    {isPinnedMessage ? 'Unpin' : 'Pin'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}

                    <div
                      ref={dmChatBottomRef}
                      style={{ height: '1px', flexShrink: 0 }}
                    />
                  </div>

                  {dmReplyingTo && (
                    <div style={instagramReplyComposerPreview}>
                      <div style={{ minWidth: 0 }}>
                        <strong>Replying to {dmReplyingTo.sender}</strong>
                        <p>{dmReplyingTo.text}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDmReplyingTo(null)}
                        style={instagramReplyClose}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  )}

                  <form
                    onSubmit={event => {
                      event.preventDefault();
                      handleSendDirectMessage();
                    }}
                    style={instagramComposer}
                  >
                    <input
                      type="text"
                      placeholder={`Message ${activeDmUser.name}...`}
                      value={dmMessage}
                      onChange={event => setDmMessage(event.target.value)}
                      style={instagramComposerInput}
                    />

                    <button
                      type="submit"
                      disabled={!dmMessage.trim()}
                      style={{
                        ...instagramSendButton,
                        opacity: dmMessage.trim() ? 1 : 0.5
                      }}
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </>
              )}
            </section>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div style={overlay}>
          <div style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <h2>Create Post</h2>

              <button
                type="button"
                onClick={() =>
                  setIsModalOpen(false)
                }
                style={modalCloseStyle}
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={handleCreatePost}
              style={modalFormStyle}
            >
              <div>
                <label style={labelStyle}>
                  CATEGORY
                </label>

                <select
                  style={inputStyle}
                  value={newPost.category}
                  onChange={event =>
                    setNewPost({
                      ...newPost,
                      category: event.target.value
                    })
                  }
                >
                  {CATEGORIES.filter(
                    category =>
                      category !== 'All'
                  ).map(category => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  TITLE (OPTIONAL)
                </label>

                <input
                  type="text"
                  placeholder="e.g. Lost Keys near Library"
                  style={inputStyle}
                  value={newPost.title}
                  onChange={event =>
                    setNewPost({
                      ...newPost,
                      title: event.target.value
                    })
                  }
                />
              </div>

              <div>
                <label style={labelStyle}>
                  CONTENT
                </label>

                <textarea
                  placeholder="What's on your mind?"
                  required
                  style={{
                    ...inputStyle,
                    height: '120px',
                    resize: 'none'
                  }}
                  value={newPost.content}
                  onChange={event =>
                    setNewPost({
                      ...newPost,
                      content: event.target.value
                    })
                  }
                />
              </div>

              <div>
                <label style={labelStyle}>
                  IMAGE ATTACHMENT (OPTIONAL URL)
                </label>

                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  style={inputStyle}
                  value={newPost.image_url}
                  onChange={event =>
                    setNewPost({
                      ...newPost,
                      image_url: event.target.value
                    })
                  }
                />
              </div>

              <label style={anonymousPostRowStyle}>
                <input
                  type="checkbox"
                  checked={newPost.is_anonymous}
                  onChange={event =>
                    setNewPost({
                      ...newPost,
                      is_anonymous:
                        event.target.checked
                    })
                  }
                />

                <span>Post Anonymously</span>
              </label>

              <div style={modalFooterStyle}>
                <button
                  type="button"
                  onClick={() =>
                    setIsModalOpen(false)
                  }
                  style={cancelBtn}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    ...saveBtnSmall,
                    opacity: isSubmitting
                      ? 0.6
                      : 1
                  }}
                >
                  {isSubmitting
                    ? 'Posting...'
                    : 'Post to Feed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================
// COMMENT COMPONENT
// =========================================================

function CommentItem({
  comment,
  commentsById,
  postId,
  postContext,
  currentUserId,
  userName,
  replyingToComment,
  setReplyingToComment,
  replyText,
  setReplyText,
  isReplyAnonymous,
  setIsReplyAnonymous,
  handleAddComment,
  handleDeleteComment,
  openDmFromCampusPulse
}) {
  const isReplying =
    replyingToComment?.id === comment.id;

  const parentAuthor =
    comment.parent_id &&
    commentsById[comment.parent_id]
      ? commentsById[comment.parent_id].author_name
      : null;

  const isAnonymous =
    comment.author_name === 'Anonymous Student';

  const commentContext = {
    type: 'comment',
    postId,
    commentId: comment.id,
    label:
      comment.content?.slice(0, 70) ||
      postContext?.label ||
      'Campus Pulse comment'
  };

  return (
    <div style={commentItemWrapStyle}>
      <div
        style={{
          ...commentCardStyle,
          background: isReplying
            ? '#F8FAFC'
            : '#FFFFFF',
          border: isReplying
            ? '1.5px solid #CBD5E1'
            : '1px solid #E2E8F0'
        }}
      >
        <div style={commentTopRowStyle}>
          <button
            type="button"
            disabled={
              !comment.user_id ||
              comment.user_id === currentUserId
            }
            onClick={() =>
              openDmFromCampusPulse({
                userId: comment.user_id,
                name: comment.author_name,
                isAnonymous,
                context: commentContext
              })
            }
            style={commentProfileButtonStyle}
          >
            <div
              style={{
                ...commentAvatarStyle,
                background: isAnonymous
                  ? '#0B1A3F'
                  : getAvatarColor(
                      comment.author_name || 'Student'
                    ),
                color: isAnonymous
                  ? '#FFFFFF'
                  : getAvatarTextColor(
                      getAvatarColor(
                        comment.author_name || 'Student'
                      )
                    ),
                border: '1px solid rgba(11,26,63,0.08)'
              }}
            >
              {isAnonymous ? (
                <EyeOff size={12} />
              ) : (
                getInitials(
                  comment.author_name
                )
              )}
            </div>

            <span style={commentAuthorStyle}>
              {comment.author_name}
            </span>
          </button>

          <div style={commentActionsStyle}>
            <button
              type="button"
              onClick={() => {
                if (isReplying) {
                  setReplyingToComment(null);
                  setReplyText('');
                } else {
                  setReplyingToComment({
                    id: comment.id,
                    author_name:
                      comment.author_name,
                    postId
                  });

                  setReplyText('');
                }
              }}
              style={replyButtonStyle}
            >
              <Reply size={12} />

              {isReplying
                ? 'Cancel'
                : 'Reply'}
            </button>

            {comment.user_id ===
              currentUserId && (
              <button
                type="button"
                onClick={() =>
                  handleDeleteComment(
                    postId,
                    comment.id
                  )
                }
                style={deleteCommentButtonStyle}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {parentAuthor && (
          <div style={replyingToTagStyle}>
            <Reply size={10} />
            replied to @{parentAuthor}
          </div>
        )}

        <p style={commentContentStyle}>
          {comment.content}
        </p>
      </div>

      {isReplying && (
        <div style={inlineReplyWrapStyle}>
          <div style={inlineReplyRowStyle}>
            <input
              type="text"
              placeholder={`Replying to @${comment.author_name}...`}
              value={replyText}
              onChange={event =>
                setReplyText(event.target.value)
              }
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();

                  handleAddComment(
                    postId,
                    comment
                  );
                }
              }}
              style={{
                ...inputStyle,
                padding: '8px 12px',
                fontSize: '12px'
              }}
              autoFocus
            />

            <button
              type="button"
              onClick={() =>
                handleAddComment(
                  postId,
                  comment
                )
              }
              style={{
                ...sendBtn,
                padding: '0 12px'
              }}
            >
              <Send size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              setIsReplyAnonymous(
                !isReplyAnonymous
              )
            }
            style={replyAnonymousButtonStyle}
          >
            {isReplyAnonymous ? (
              <EyeOff size={11} />
            ) : (
              <UserCheck size={11} />
            )}

            {isReplyAnonymous
              ? 'Replying Anonymously'
              : `Replying as ${userName}`}
          </button>
        </div>
      )}

      {comment.replies &&
        comment.replies.length > 0 && (
          <div style={nestedRepliesStyle}>
            {comment.replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                commentsById={commentsById}
                postId={postId}
                postContext={postContext}
                currentUserId={currentUserId}
                userName={userName}
                replyingToComment={
                  replyingToComment
                }
                setReplyingToComment={
                  setReplyingToComment
                }
                replyText={replyText}
                setReplyText={setReplyText}
                isReplyAnonymous={
                  isReplyAnonymous
                }
                setIsReplyAnonymous={
                  setIsReplyAnonymous
                }
                handleAddComment={
                  handleAddComment
                }
                handleDeleteComment={
                  handleDeleteComment
                }
                openDmFromCampusPulse={
                  openDmFromCampusPulse
                }
              />
            ))}
          </div>
        )}
    </div>
  );
}

// =========================================================
// STYLES
// =========================================================

const pageStyle = {
  width: '100%',
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '8px 20px 70px',
  boxSizing: 'border-box',
  scrollMarginTop: '8px',
  fontFamily: 'inherit'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: '20px',
  flexWrap: 'wrap',
  marginBottom: '26px'
};

const campusFeedBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  background: '#F4F7FE',
  padding: '6px 14px',
  borderRadius: '30px',
  fontSize: '11px',
  fontWeight: '800',
  color: '#0B1A3F',
  marginBottom: '10px',
  border: '1px solid #E9EDF7'
};

const pageTitleStyle = {
  fontSize: '40px',
  fontWeight: '900',
  color: '#0B1A3F',
  margin: 0,
  letterSpacing: '-0.7px'
};

const pageSubtitleStyle = {
  color: '#8A98B8',
  fontWeight: '700',
  margin: '6px 0 0',
  fontSize: '14px'
};

const addBtnStyle = {
  background: '#0B1A3F',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '14px',
  padding: '11px 18px',
  fontWeight: '900',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
  boxShadow: '0 8px 20px rgba(11,26,63,0.14)',
  fontFamily: 'inherit'
};

const viewTabsWrapStyle = {
  display: 'flex',
  gap: '10px',
  marginTop: '4px',
  marginBottom: '24px',
  flexWrap: 'wrap'
};

const viewTabStyle = {
  border: '1.5px solid #E2E8F0',
  borderRadius: '14px',
  padding: '9px 14px',
  fontWeight: '900',
  fontSize: '12px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 0.18s ease'
};

const searchBarContainer = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  background: '#FFFFFF',
  padding: '13px 18px',
  minHeight: '52px',
  borderRadius: '18px',
  border: '1.5px solid #E2E8F0',
  marginBottom: '14px',
  boxSizing: 'border-box'
};

const searchField = {
  border: 'none',
  outline: 'none',
  width: '100%',
  fontSize: '14px',
  fontWeight: '700',
  color: '#0B1A3F',
  background: 'transparent',
  fontFamily: 'inherit'
};

const categoryTabsStyle = {
  display: 'flex',
  gap: '8px',
  overflowX: 'auto',
  overflowY: 'visible',
  paddingTop: '8px',
  paddingBottom: '8px',
  scrollbarWidth: 'none'
};

const feedListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px'
};

const loadingStateStyle = {
  textAlign: 'center',
  padding: '60px',
  color: '#0B1A3F',
  fontWeight: '800'
};

const emptyFeedStyle = {
  textAlign: 'center',
  padding: '60px',
  background: '#FFFFFF',
  borderRadius: '24px',
  border: '1.5px dashed #E2E8F0',
  color: '#0B1A3F'
};

const postCardStyle = {
  background: '#FFFFFF',
  borderRadius: '22px',
  padding: '24px',
  borderStyle: 'solid',
  borderWidth: '2px',
  boxShadow: '0 10px 26px rgba(11,26,63,0.045)',
  overflow: 'hidden'
};

const postHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '14px',
  marginBottom: '16px'
};

const profileButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  minWidth: 0,
  border: 'none',
  background: 'transparent',
  padding: 0,
  textAlign: 'left',
  cursor: 'pointer',
  fontFamily: 'inherit'
};

const avatarCircle = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '900',
  fontSize: '11px',
  flexShrink: 0
};

const postAuthorRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap'
};

const postAuthorNameStyle = {
  margin: 0,
  fontWeight: '900',
  color: '#0B1A3F',
  fontSize: '15px'
};

const anonymousTagStyle = {
  fontSize: '10px',
  background: '#F4F7FE',
  color: '#A3AED0',
  padding: '2px 8px',
  borderRadius: '10px',
  fontWeight: '800'
};

const postDateStyle = {
  margin: '2px 0 0',
  fontSize: '11px',
  color: '#A3AED0',
  fontWeight: '700'
};

const postHeaderActionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  position: 'relative',
  flexShrink: 0
};

const moreButtonStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#A3AED0',
  padding: '4px'
};

const editFormStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  marginBottom: '15px'
};

const editActionsStyle = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'flex-end'
};

const postTitleStyle = {
  fontSize: '20px',
  fontWeight: '900',
  margin: '0 0 8px',
  color: '#0B1A3F'
};

const postContentStyle = {
  fontSize: '15px',
  color: '#2B3674',
  lineHeight: '1.6',
  fontWeight: '600',
  margin: 0,
  whiteSpace: 'pre-line'
};

const postActionsRowStyle = {
  display: 'flex',
  gap: '20px',
  marginTop: '20px',
  paddingTop: '15px'
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1.5px solid #E9EDF7',
  outline: 'none',
  fontSize: '13px',
  color: '#0B1A3F',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  background: '#FFFFFF'
};

const actionBtn = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '13px',
  fontWeight: '800',
  color: '#A3AED0',
  padding: 0,
  fontFamily: 'inherit'
};

const commentComposerWrapStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginBottom: '25px'
};

const commentComposerRowStyle = {
  display: 'flex',
  gap: '10px'
};

const sendBtn = {
  background: '#0B1A3F',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '10px',
  padding: '0 16px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const anonymousCommentButtonStyle = {
  alignSelf: 'flex-start',
  border: 'none',
  padding: '5px 11px',
  borderRadius: '12px',
  fontSize: '11px',
  fontWeight: '800',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  fontFamily: 'inherit'
};

const commentsLoadingStyle = {
  textAlign: 'center',
  padding: '20px',
  color: '#A3AED0',
  fontSize: '12px',
  fontWeight: '800'
};

const noCommentsStyle = {
  fontSize: '13px',
  color: '#A3AED0',
  fontWeight: '700',
  textAlign: 'center',
  margin: '15px 0'
};

const commentsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const postImage = {
  width: '100%',
  maxHeight: '350px',
  objectFit: 'cover',
  borderRadius: '14px',
  marginTop: '12px'
};

const dropdownMenu = {
  position: 'absolute',
  right: 0,
  top: '28px',
  background: '#FFFFFF',
  borderRadius: '12px',
  boxShadow: '0 10px 25px rgba(11,26,63,0.15)',
  border: '1px solid #E9EDF7',
  padding: '6px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  zIndex: 20
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
  whiteSpace: 'nowrap',
  fontFamily: 'inherit'
};

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(11,26,63,0.4)',
  backdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px'
};

const modalCardStyle = {
  width: '100%',
  maxWidth: '540px',
  padding: '32px',
  borderRadius: '24px',
  background: '#FFFFFF',
  boxShadow: '0 20px 50px rgba(11,26,63,0.2)'
};

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  color: '#0B1A3F'
};

const modalCloseStyle = {
  border: 'none',
  background: 'transparent',
  color: '#A3AED0',
  cursor: 'pointer',
  display: 'flex'
};

const modalFormStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const labelStyle = {
  fontSize: '11px',
  fontWeight: '800',
  color: '#A3AED0',
  display: 'block',
  marginBottom: '6px',
  letterSpacing: '0.5px'
};

const anonymousPostRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '700',
  color: '#0B1A3F'
};

const modalFooterStyle = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'flex-end',
  marginTop: '10px'
};

const cancelBtn = {
  background: '#F4F7FE',
  color: '#0B1A3F',
  border: 'none',
  borderRadius: '12px',
  padding: '10px 18px',
  fontWeight: '800',
  fontSize: '13px',
  cursor: 'pointer',
  fontFamily: 'inherit'
};

const saveBtnSmall = {
  background: '#0B1A3F',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '12px',
  padding: '10px 18px',
  fontWeight: '800',
  fontSize: '13px',
  cursor: 'pointer',
  boxShadow: '0 6px 15px rgba(11,26,63,0.2)',
  fontFamily: 'inherit'
};

const commentItemWrapStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const commentCardStyle = {
  borderRadius: '14px',
  padding: '12px 16px',
  transition: 'all 0.15s ease'
};

const commentTopRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '5px'
};

const commentProfileButtonStyle = {
  border: 'none',
  background: 'transparent',
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
  cursor: 'pointer',
  padding: 0,
  fontFamily: 'inherit'
};

const commentAvatarStyle = {
  width: '27px',
  height: '27px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '9px',
  fontWeight: '900'
};

const commentAuthorStyle = {
  fontWeight: '900',
  fontSize: '13px',
  color: '#0B1A3F'
};

const commentActionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
};

const replyButtonStyle = {
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
};

const deleteCommentButtonStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#EE5D50',
  padding: 0
};

const replyingToTagStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  color: '#64748B',
  background: '#F1F5F9',
  fontSize: '10px',
  fontWeight: '800',
  padding: '5px 8px',
  borderRadius: '8px',
  marginTop: '2px',
  marginBottom: '8px'
};

const commentContentStyle = {
  margin: 0,
  fontSize: '13px',
  color: '#2B3674',
  fontWeight: '600',
  lineHeight: '1.4'
};

const inlineReplyWrapStyle = {
  marginLeft: '18px',
  padding: '10px 0 2px 12px',
  borderLeft: '2px solid #CBD5E1',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginTop: '8px',
  marginBottom: '4px'
};

const inlineReplyRowStyle = {
  display: 'flex',
  gap: '10px',
  alignItems: 'stretch'
};

const replyAnonymousButtonStyle = {
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
};

const nestedRepliesStyle = {
  marginLeft: '20px',
  padding: '8px 0 2px 14px',
  borderLeft: '2px solid #CBD5E1',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginTop: '8px'
};

const instagramDmShell = {
  display: 'grid',
  gridTemplateColumns: '390px minmax(0, 1fr)',
  minHeight: '700px',
  height: '76vh',
  maxHeight: '880px',
  background: '#FFFFFF',
  border: '1.5px solid #E2E8F0',
  borderRadius: '24px',
  overflow: 'hidden',

  boxShadow: '0 10px 30px rgba(11,26,57,0.08)'
};

const instagramDmSidebar = { borderRight: '1px solid #E2E8F0', display: 'flex',
flexDirection: 'column', minWidth: 0, background: '#FFFFFF' };

const instagramDmSidebarHeader = { padding: '24px 22px 16px', display: 'flex',
alignItems: 'center', justifyContent: 'space-between', gap: '12px' };

const instagramDmSidebarTitle = { margin: 0, color: '#0B1A3F', fontSize: '22px',
fontWeight: '900' };

const instagramDmSidebarSubtitle = { margin: '4px 0 0', color: '#94A3B8',
fontSize: '11px', fontWeight: '700' };

const instagramSearchWrap = { padding: '0 18px 16px' };

const instagramSearchBar = { height: '50px', border: '1.5px solid #E2E8F0',
borderRadius: '15px', background: '#F8FAFC', display: 'flex', alignItems:
'center', gap: '10px', padding: '0 15px', boxSizing: 'border-box' };

const instagramSearchIcon = {
  color: '#94A3B8',
  pointerEvents: 'none',
  flexShrink: 0
};

const instagramSearchInput = {
  width: '100%',
  minWidth: 0,
  height: '100%',
  border: 'none',
  outline: 'none',
  padding: 0,
  margin: 0,
  background: 'transparent',
  color: '#0B1A3F',
  fontSize: '13px',
  fontWeight: '700',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  lineHeight: 1
};

const instagramSearchClear = {
  border: 'none',
  background: 'transparent',
  color: '#94A3B8',
  cursor: 'pointer',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const instagramSearchResults = {
  margin: '0 16px 12px',
  border: '1px solid #E2E8F0',
  borderRadius: '14px',
  padding: '6px',
  maxHeight: '250px',
  overflowY: 'auto',
  background: '#FFFFFF',
  boxShadow: '0 8px 22px rgba(11,26,57,0.08)',
  zIndex: 2
};

const instagramSearchStatus = {
  padding: '14px',
  textAlign: 'center',
  color: '#94A3B8',
  fontSize: '12px',
  fontWeight: '700'
};

const instagramSearchResultRow = {
  width: '100%',
  border: 'none',
  background: '#FFFFFF',
  borderRadius: '11px',
  padding: '11px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  textAlign: 'left',
  cursor: 'pointer',
  fontFamily: 'inherit'
};

const instagramThreadList = { flex: 1, overflowY: 'auto', padding: '6px 10px 16px' };

const instagramThreadRow = { width: '100%', border: 'none', background:
'transparent', borderRadius: '16px', padding: '13px 12px', display: 'flex', gap:
'13px', alignItems: 'center', textAlign: 'left', cursor: 'pointer', fontFamily:
'inherit' };

const instagramThreadRowActive = { background: '#F1F5F9' };

const instagramAvatar = {
  width: '54px',
  height: '54px',
  borderRadius: '50%',
  flexShrink: 0,
  border: '1px solid rgba(11,26,63,0.08)',
  background: '#E0F2FE',
  color: '#0B1A3F',
  fontSize: '14px',
  fontWeight: '900',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const instagramAvatarLarge = {
  ...instagramAvatar,
  width: '58px',
  height: '58px',
  fontSize: '16px'
};

const instagramPersonName = {
  margin: 0,
  color: '#0B1A3F',
  fontSize: '14px',
  fontWeight: '900',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const instagramPersonMeta = {
  margin: '3px 0 0',
  color: '#A3AED0',
  fontSize: '10px',
  fontWeight: '700',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const instagramThreadTopLine = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px'
};

const instagramThreadDate = {
  color: '#A3AED0',
  fontSize: '8px',
  fontWeight: '700',
  flexShrink: 0
};

const instagramMessagePreview = {
  margin: '5px 0 0',
  color: '#64748B',
  fontSize: '11px',
  fontWeight: '600',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const instagramEmptyThreads = {
  padding: '32px 14px',
  textAlign: 'center',
  color: '#A3AED0',
  fontSize: '11px',
  fontWeight: '700'
};

const instagramPinButton = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  padding: '5px',
  display: 'flex',
  flexShrink: 0
};

const instagramChatPanel = {
  minWidth: 0,
  minHeight: 0,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: '#FFFFFF',
  overflow: 'hidden'
};

const instagramChatHeader = { minHeight: '86px', padding: '16px 24px',
borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center',
justifyContent: 'space-between', gap: '14px' };

const instagramChatName = {
  margin: 0,
  color: '#0B1A3F',
  fontSize: '18px',
  fontWeight: '900'
};

const instagramChatEmail = {
  margin: '4px 0 0',
  color: '#94A3B8',
  fontSize: '11px',
  fontWeight: '700'
};

const instagramHeaderPin = {
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  border: '1px solid #E2E8F0',
  background: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const instagramChatHistory = { position: 'relative', flex: '1 1 auto', minHeight: 0,
overflowY: 'auto', overflowX: 'hidden', overscrollBehavior: 'contain',
WebkitOverflowScrolling: 'touch', padding: '26px 24px', background:
'#FFFFFF' };

const instagramEmptyChat = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#A3AED0',
  fontSize: '12px',
  fontWeight: '700'
};

const instagramNoChat = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: '35px'
};

const instagramNoChatIcon = {
  width: '72px',
  height: '72px',
  borderRadius: '50%',
  border: '2px solid #0B1A3F',
  color: '#0B1A3F',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '14px'
};

const instagramNoChatTitle = {
  margin: 0,
  color: '#0B1A3F',
  fontSize: '18px',
  fontWeight: '900'
};

const instagramNoChatText = {
  margin: '7px 0 0',
  color: '#94A3B8',
  maxWidth: '320px',
  fontSize: '11px',
  fontWeight: '700',
  lineHeight: 1.5
};

const instagramBubble = {
  maxWidth: '76%',
  padding: '13px 16px',
  borderRadius: '20px',
  fontSize: '13.5px'
};

const instagramBubbleMine = {
  background: '#0B1A3F',
  color: '#FFFFFF',
  borderBottomRightRadius: '6px'
};

const instagramBubbleTheirs = {
  background: '#F1F5F9',
  color: '#0B1A3F',
  borderBottomLeftRadius: '6px'
};

const instagramBubbleText = {
  margin: 0,
  fontSize: '13px',
  lineHeight: 1.5,
  fontWeight: '600',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word'
};

const instagramBubbleFooter = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
  marginTop: '5px',
  fontSize: '8px',
  opacity: 0.7
};

const instagramReplyQuote = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  padding: '7px 9px',
  marginBottom: '7px',
  borderRadius: '9px',
  background: '#FFFFFF',
  borderLeft: '3px solid #0B1A3F',
  fontSize: '10px'
};

const instagramReplyQuoteMine = {
  background: 'rgba(255,255,255,0.12)',
  borderLeft: '3px solid rgba(255,255,255,0.75)'
};

const instagramReactionRow = {
  display: 'flex',
  gap: '4px',
  flexWrap: 'wrap',
  marginTop: '4px'
};

const instagramReactionPill = {
  border: '1px solid #E2E8F0',
  background: '#FFFFFF',
  borderRadius: '999px',
  padding: '3px 7px',
  fontSize: '10px',
  cursor: 'pointer'
};

const instagramMessageMenuButton = { position: 'absolute', top: '8px', border:
'none', background: 'transparent', color: '#A3AED0', cursor: 'pointer', padding:
'4px 7px', fontWeight: '900', letterSpacing: '1px' };

const instagramMessageMenu = { position: 'absolute', top: '34px', background:
'#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '13px', padding: '7px',
boxShadow: '0 10px 25px rgba(11,26,57,0.12)', zIndex: 40, display: 'flex',
alignItems: 'center', gap: '3px', flexWrap: 'wrap', minWidth: '250px', maxWidth:
'min(310px, calc(100vw - 80px))' };

const instagramEmojiButton = { border: 'none', background: 'transparent',
fontSize: '16px', cursor: 'pointer', padding: '4px' };

const instagramMenuAction = { border: 'none', background: '#F8FAFC', color:
'#0B1A3F', borderRadius: '8px', padding: '6px 8px', display: 'flex', alignItems:
'center', gap: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' };

const instagramReplyComposerPreview = {
  borderTop: '1px solid #E2E8F0',
  padding: '10px 20px',
  background: '#F8FAFC',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '10px',
  flexShrink: 0
};

const instagramReplyClose = {
  border: 'none',
  background: 'transparent',
  color: '#94A3B8',
  cursor: 'pointer',
  display: 'flex'
};

const instagramPinnedWrap = {
  background: '#FFF8DD',
  borderTop: '1px solid #F6D26D',
  borderBottom: '1px solid #F6D26D',
  padding: '10px 14px',
  flexShrink: 0
};

const instagramPinnedTitle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginBottom: '8px',
  color: '#B45309',
  fontSize: '11px',
  fontWeight: '900'
};

const instagramPinnedList = {
  display: 'flex',
  gap: '8px',
  overflowX: 'auto',
  paddingBottom: '2px'
};

const instagramPinnedChip = {
  minWidth: '220px',
  maxWidth: '320px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
  padding: '8px 10px',
  borderRadius: '10px',
  background: 'rgba(255,255,255,0.82)',
  border: '1px solid #F6D26D'
};

const instagramPinnedMessageText = {
  color: '#0B1A3F',
  fontSize: '11px',
  fontWeight: '700',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const instagramPinnedRemove = {
  border: 'none',
  background: 'transparent',
  color: '#B45309',
  cursor: 'pointer',
  display: 'flex',
  padding: '2px',
  flexShrink: 0
};

const instagramComposer = { borderTop: '1px solid #E2E8F0', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', flexShrink: 0, position: 'relative', zIndex: 3 };

const instagramComposerInput = { flex: 1, height: '50px', minWidth: 0,
borderRadius: '20px', border: '1.5px solid #E2E8F0', background: '#F8FAFC',
padding: '0 16px', fontSize: '13px', fontWeight: '700', color: '#0B1A3F', outline:
'none', boxSizing: 'border-box', fontFamily: 'inherit' };

const instagramSendButton = {
  width: '52px',
  height: '52px',
  borderRadius: '50%',
  border: 'none',
  background: '#0B1A3F',
  color: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0
};

const dmBubbleDeleteStyle = {
  border: 'none',
  background: 'transparent',
  color: 'inherit',
  padding: 0,
  display: 'flex',
  cursor: 'pointer'
};
