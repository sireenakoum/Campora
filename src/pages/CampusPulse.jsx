import './CamporaMobileCompat.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  Plus,
  Heart,
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
  Clock3,
  Bell,
  AlarmClock,
  CheckCheck,
  BellOff,
  Maximize2,
  Minimize2} from 'lucide-react';

import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';

import {
  SectionHeader,
} from '../components/luminous';

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
    bg: '#002D62',
    text: '#FFFFFF',
    border: '#002D62',
    accent: '#002D62'
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

  if (hex.length !== 6) return '#002D62';

  const red = parseInt(hex.substring(0, 2), 16);
  const green = parseInt(hex.substring(2, 4), 16);
  const blue = parseInt(hex.substring(4, 6), 16);

  const luminance =
    (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance < 0.58 ? '#FFFFFF' : '#002D62';
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


const getCampusPulseAlertStorageKey = (userId) =>
  `campora-campus-pulse-alert-links-${userId}`;

const saveCampusPulseAlertLink = (userId, postId, alert) => {
  if (!userId || !postId || !alert?.type || alert.type === 'none') return;

  try {
    const key = getCampusPulseAlertStorageKey(userId);
    const links = JSON.parse(localStorage.getItem(key) || '{}');

    links[postId] = {
      ...alert,
      created_at: new Date().toISOString()
    };

    localStorage.setItem(key, JSON.stringify(links));
  } catch (error) {
    console.error('Could not save Campus Pulse local alert:', error);
  }
};


const openCentralMessagesForUser = (profile) => {
  if (!profile?.id) {
    window.location.assign('/messages');
    return;
  }

  try {
    localStorage.setItem(
      'campora_pending_message_recipient',
      JSON.stringify({
        id: profile.id,
        name: profile.name || profile.full_name || 'Student',
        email: profile.email || '',
        source: 'Campus Pulse'
      })
    );
  } catch (error) {
    console.error('Could not save pending message recipient:', error);
  }

  window.location.assign('/messages');
};

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
    is_anonymous: false,
    reply_alert_preference: 'both',
    reminder_date: '',
    reminder_time: ''
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
  const [dmNotificationPrefs, setDmNotificationPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('campora-pulse-dm-notifications') || '{}');
    } catch {
      return {};
    }
  });

  const isPulseDmNotificationOn = (userId) =>
    dmNotificationPrefs[userId] !== false;

  const togglePulseDmNotification = (userId) => {
    setDmNotificationPrefs((previous) => {
      const next = { ...previous, [userId]: previous[userId] === false };
      localStorage.setItem('campora-pulse-dm-notifications', JSON.stringify(next));
      return next;
    });
  };

  const [dmLoading, setDmLoading] = useState(false);
  const [dmFullscreen, setDmFullscreen] = useState(false);

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

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`campus_pulse_dm_notifications_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${currentUserId}`
        },
        (payload) => {
          const incoming = payload.new;
          if (!incoming?.sender_id || !isPulseDmNotificationOn(incoming.sender_id)) return;
          toast('New direct message');
          fetchDmInbox({ silent: true });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUserId, dmNotificationPrefs]);

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
        'This person posted anonymously, so their identity stays private and cannot be messaged.'
      );
      return;
    }

    if (userId === currentUserId) return;

    openCentralMessagesForUser({
      id: userId,
      name: name || 'Student',
      email: dmInboxProfiles[userId]?.email || '',
      context
    });
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

    const effectiveReminderDate = newPost.reminder_date || '';
    const effectiveReminderTime = newPost.reminder_time || '09:00';

    if (
      (newPost.reply_alert_preference === 'reminder' ||
        newPost.reply_alert_preference === 'both') &&
      !effectiveReminderDate
    ) {
      alert('Please choose a reminder date.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        user_id: currentUserId,
        author_name: newPost.is_anonymous
          ? 'Anonymous Student'
          : userName,
        title: newPost.title.trim() || null,
        content: newPost.content.trim(),
        category: newPost.category,
        image_url: newPost.image_url.trim() || null,
        is_anonymous: newPost.is_anonymous,
        reply_alert_preference: newPost.reply_alert_preference,
        reminder_date:
          newPost.reply_alert_preference === 'reminder' ||
          newPost.reply_alert_preference === 'both'
            ? effectiveReminderDate
            : null,
        reminder_time:
          newPost.reply_alert_preference === 'reminder' ||
          newPost.reply_alert_preference === 'both'
            ? effectiveReminderTime
            : null
      };

      let result = await supabase
        .from('campus_pulse_posts')
        .insert([payload])
        .select()
        .maybeSingle();

      if (
        result.error &&
        result.error.message?.toLowerCase().includes('column')
      ) {
        const fallbackPayload = {
          user_id: currentUserId,
          author_name: newPost.is_anonymous
            ? 'Anonymous Student'
            : userName,
          title: newPost.title.trim() || null,
          content: newPost.content.trim(),
          category: newPost.category,
          image_url: newPost.image_url.trim() || null
        };

        result = await supabase
          .from('campus_pulse_posts')
          .insert([fallbackPayload])
          .select()
          .maybeSingle();
      }

      if (result.error) {
        alert(`Could not create post: ${result.error.message}`);
        return;
      }

      const createdId = result.data?.id || `local-${Date.now()}`;

      saveCampusPulseAlertLink(currentUserId, createdId, {
        type: newPost.reply_alert_preference,
        title: newPost.title.trim() || 'Campus Pulse',
        details: newPost.content.trim(),
        date: effectiveReminderDate,
        time: effectiveReminderTime
      });

      if (newPost.reply_alert_preference === 'both') {
        toast(
          `Notification + reminder set for ${effectiveReminderDate} at ${effectiveReminderTime}`
        );
      } else if (newPost.reply_alert_preference === 'reminder') {
        toast(
          `Reminder set for ${effectiveReminderDate} at ${effectiveReminderTime}`
        );
      } else if (newPost.reply_alert_preference === 'notification') {
        toast('Notification set for this Campus Pulse post');
      } else {
        toast('Campus Pulse post created');
      }

      setIsModalOpen(false);

      setNewPost({
        title: '',
        content: '',
        category: 'Campus Life',
        image_url: '',
        is_anonymous: false,
        reply_alert_preference: 'both',
        reminder_date: '',
        reminder_time: ''
      });

      await fetchData();
    } catch (error) {
      console.error('Campus Pulse create post error:', error);
      alert(`Could not create post: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
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

  const createCampusPulseReplyNotification = async ({
    recipientUserId,
    postId,
    replyText,
    isCommentReply = false
  }) => {
    if (!recipientUserId || recipientUserId === currentUserId) return;

    const title = isCommentReply
      ? 'New reply to your Campus Pulse comment'
      : 'New reply to your Campus Pulse post';

    const message =
      replyText?.trim()
        ? `${userName || 'A student'} replied: ${replyText.trim().slice(0, 140)}`
        : `${userName || 'A student'} replied to you on Campus Pulse.`;

    const basePayload = {
      user_id: recipientUserId,
      title,
      message,
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

    if (
      result.error &&
      result.error.message?.toLowerCase().includes('category')
    ) {
      result = await supabase
        .from('notifications')
        .insert([basePayload]);
    }

    if (
      result.error &&
      result.error.message?.toLowerCase().includes('message')
    ) {
      result = await supabase
        .from('notifications')
        .insert([
          {
            user_id: recipientUserId,
            title,
            content: message,
            read: false
          }
        ]);
    }

    if (result.error) {
      console.error('Could not create Campus Pulse reply notification:', result.error);
    }
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

    const relatedPost = posts.find(post => post.id === postId);

    if (
      parentComment?.user_id &&
      parentComment.user_id !== currentUserId
    ) {
      await createCampusPulseReplyNotification({
        recipientUserId: parentComment.user_id,
        postId,
        replyText: textToSend,
        isCommentReply: true
      });
    } else if (
      relatedPost?.user_id &&
      relatedPost.user_id !== currentUserId &&
      relatedPost.reply_alert_preference !== 'none'
    ) {
      await createCampusPulseReplyNotification({
        recipientUserId: relatedPost.user_id,
        postId,
        replyText: textToSend,
        isCommentReply: false
      });
    }

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
    <div className="campora-mobile-page campus-pulse-mobile" style={campusPulsePageShellStyle}>
      <div ref={pageTopRef}>
        <div className="stack" style={{ gap: '14px' }}>
          <SectionHeader
            title="Campus Pulse"
            subtitle="What's happening in your student community today?"
            action={
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
              >
                <Plus size={20} strokeWidth={3} />
                Create Post
              </button>
            }
          />
        </div>

        <div style={{ marginTop: '22px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: 0,
              background: 'transparent',
              border: 'none',
              borderRadius: 0
            }}
          >
            {[
              { value: 'feed', label: 'Feed', icon: Sparkles }
            ].map(({ value, label, icon: Icon }) => {
              const selected = activeView === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveView(value)}
                  style={{
                    minHeight: '38px',
                    padding: '0 16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    border: selected
                      ? '1px solid #0B1A3F'
                      : '1px solid transparent',
                    borderRadius: '9999px',
                    background: selected ? '#0B1A3F' : '#FFFFFF',
                    color: selected ? '#FFFFFF' : '#66758E',
                    fontFamily: 'inherit',
                    fontSize: '12px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    outline: 'none',
                    overflow: 'hidden',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    boxShadow: selected
                      ? '0 4px 12px rgba(11,26,63,.12)'
                      : '0 2px 7px rgba(11,26,63,.035)'
                  }}
                >
                  <Icon size={15} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

      {activeView === 'feed' && (
        <>
          <div className="stack" style={{ gap: '22px', marginTop: '22px', marginBottom: '26px' }}>
            <div
              className="panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#FFFFFF',
                border: '1px solid #E5EAF2',
                borderRadius: '16px',
                boxShadow: '0 6px 18px rgba(11,26,63,0.035)'
              }}
            >
              <Search size={20} className="text-primary" />

              <input
                type="text"
                placeholder="Search discussions, announcements, lost items..."
                className="search-field"
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '14px',
                  fontWeight: '750',
                  color: 'var(--campora-text)',
                  background: 'transparent'
                }}
                value={searchQuery}
                onChange={event =>
                  setSearchQuery(event.target.value)
                }
              />

              {searchQuery && (
                <X
                  size={18}
                  className="muted"
                  style={{ cursor: 'pointer', flexShrink: 0 }}
                  onClick={() => setSearchQuery('')}
                />
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '9px',
                width: '100%',
                background: 'transparent',
                border: 'none',
                boxShadow: 'none'
              }}
            >
              {CATEGORIES.map(category => {
                const isActive =
                  activeCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() =>
                      setActiveCategory(category)
                    }
                    className={`filter-chip ${isActive ? 'active' : ''}`}
                    style={
                      isActive
                        ? {
                            background:
                              category === 'All'
                                ? '#0B1A3F'
                                : CATEGORY_STYLES[category]?.accent,
                            color: '#FFFFFF',
                            borderColor:
                              category === 'All'
                                ? '#0B1A3F'
                                : CATEGORY_STYLES[category]?.accent,
                            boxShadow: `0 5px 16px ${CATEGORY_STYLES[category]?.accent}30`,
                            transform: 'translateY(-1px)'
                          }
                        : {
                            background:
                              category === 'All'
                                ? '#EEF3FB'
                                : CATEGORY_STYLES[category]?.bg,
                            color:
                              category === 'All'
                                ? '#0B1A3F'
                                : CATEGORY_STYLES[category]?.text,
                            borderColor:
                              category === 'All'
                                ? '#D8E2FF'
                                : CATEGORY_STYLES[category]?.border,
                            boxShadow: 'none'
                          }
                    }
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="stack" style={{ gap: '18px', marginTop: '8px' }}>
            {loading ? (
              <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '40px 20px' }}>
                <RefreshCw
                  className="animate-spin text-primary"
                  size={32}
                />
                <p className="muted" style={{ fontWeight: 700 }}>Loading latest posts...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div
                style={{
                  minHeight: '220px',
                  border: '1px solid #E6EAF0',
                  borderRadius: '18px',
                  background: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '28px'
                }}
              >
                <div
                  style={{
                    width: '58px',
                    height: '58px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    color: '#1A1B1F',
                    border: '1px solid #E6EAF0',
                    boxShadow: '0 10px 26px rgba(11,26,63,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '14px'
                  }}
                >
                  <MessageCircle size={26} />
                </div>

                <h3
                  style={{
                    margin: 0,
                    color: '#737B88',
                    fontSize: '17px',
                    fontWeight: 600
                  }}
                >
                  No posts found
                </h3>

                <p
                  style={{
                    margin: '7px 0 0',
                    color: '#6F7D93',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}
                >
                  Be the first one to share something under {activeCategory}!
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
                  <article
                    key={post.id}
                    className="panel"
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      border: '1px solid #E5EAF2',
                      borderLeft: `4px solid ${categoryBadge.accent}`,
                      borderRadius: '18px',
                      background: '#FFFFFF',
                      boxShadow: '0 8px 22px rgba(11,26,63,0.04)',
                      marginBottom: '24px'
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
                              ? 'var(--campora-navy)'
                              : getAvatarColor(
                                  post.author_name || 'Student'
                                ),
                            color: post.is_anonymous
                              ? 'var(--surface-container-lowest)'
                              : getAvatarTextColor(
                                  getAvatarColor(
                                    post.author_name || 'Student'
                                  )
                                ),
                            border: '1px solid var(--hairline)'
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
                                    color: 'var(--campora-urgent)'
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
                            className="btn btn-ghost btn-sm"
                          >
                            Cancel
                          </button>

                          <button
                            type="submit"
                            className="btn btn-primary btn-sm"
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
                              : 'var(--campora-muted)'
                          }
                        />

                        <span
                          style={{
                            color:
                              hasLiked
                                ? '#FF4D4D'
                                : 'var(--campora-muted)',
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
                              ? 'var(--campora-navy)'
                              : 'var(--campora-muted)'
                          }
                        />

                        <span
                          style={{
                            color:
                              postCommentState.open
                                ? 'var(--campora-navy)'
                                : 'var(--campora-muted)'
                          }}
                        >
                          {commentCount}{' '}
                          {commentCount === 1
                            ? 'Comment'
                            : 'Comments'}
                        </span>
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
                                  ? 'var(--campora-navy)'
                                  : 'var(--campora-bg)',
                              color:
                                postCommentState.is_anonymous
                                  ? 'var(--surface-container-lowest)'
                                  : 'var(--campora-navy)'
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
                              color="var(--campora-navy)"
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
                  </article>
                );
              })
            )}
          </div>
        </>
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
                  style={{
                    ...inputStyle,
                    minHeight: '54px',
                    padding: '14px 16px',
                    fontSize: '14px',
                    borderRadius: '13px'
                  }}
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
                    height: '145px',
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

              <div>
                <label style={labelStyle}>
                  WHEN SOMEONE REPLIES
                </label>

                <div style={replyPreferenceGridStyle}>
                  {[
                    {
                      value: 'notification',
                      label: 'Notify me',
                      icon: Bell,
                      accent: '#6684AE',
                      soft: '#F1F5FA'
                    },
                    {
                      value: 'reminder',
                      label: 'Remind me',
                      icon: AlarmClock,
                      accent: '#7F7897',
                      soft: '#F4F2F8'
                    },
                    {
                      value: 'both',
                      label: 'Both',
                      icon: CheckCheck,
                      accent: '#0B1A3F',
                      soft: '#F4F7FB'
                    },
                    {
                      value: 'none',
                      label: 'None',
                      icon: X,
                      accent: '#0B1A3F',
                      soft: '#F8FAFC'
                    }
                  ].map(option => {
                    const active =
                      newPost.reply_alert_preference === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setNewPost({
                            ...newPost,
                            reply_alert_preference: option.value,
                            reminder_date:
                              option.value === 'reminder' || option.value === 'both'
                                ? newPost.reminder_date
                                : '',
                            reminder_time:
                              option.value === 'reminder' || option.value === 'both'
                                ? newPost.reminder_time
                                : ''
                          })
                        }
                        style={{
                          ...replyPreferenceButtonStyle,
                          background: active ? option.accent : option.soft,
                          color: active ? '#FFFFFF' : option.accent,
                          borderColor: active ? option.accent : '#E1E7EF',
                          boxShadow: active
                            ? `0 6px 16px ${option.accent}24`
                            : '0 4px 12px rgba(11, 26, 63, 0.05)'
                        }}
                      >
                        {option.icon &&
                          React.createElement(option.icon, {
                            size: 15,
                            strokeWidth: 2.2,
                            color: active ? '#FFFFFF' : option.accent
                          })}
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                {(newPost.reply_alert_preference === 'reminder' ||
                  newPost.reply_alert_preference === 'both') && (
                  <div
                    style={{
                      marginTop: '12px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <label style={labelStyle}>REMINDER DATE</label>
                      <input
                        type="date"
                        value={newPost.reminder_date}
                        onChange={event =>
                          setNewPost({
                            ...newPost,
                            reminder_date: event.target.value
                          })
                        }
                        style={{
                          ...inputStyle,
                          background: '#F7F8FA',
                          color: '#1A1B1F',
                          WebkitTextFillColor: '#0B1A3F',
                          opacity: 1,
                          border: '1px solid #E2E7EE'
                        }}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>REMINDER TIME</label>
                      <input
                        type="time"
                        value={newPost.reminder_time}
                        onChange={event =>
                          setNewPost({
                            ...newPost,
                            reminder_time: event.target.value
                          })
                        }
                        style={{
                          ...inputStyle,
                          background: '#F7F8FA',
                          color: '#1A1B1F',
                          WebkitTextFillColor: '#0B1A3F',
                          opacity: 1,
                          border: '1px solid #E2E7EE'
                        }}
                      />
                    </div>
                  </div>
                )}
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
    </div>
  );
}

const campusPulsePageShellStyle = {
  width: '100%',
  minHeight: '100%',
  boxSizing: 'border-box',
  background: 'transparent',
  padding: '8px 4px 28px'
};

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
            ? 'var(--surface-container-high)'
            : 'var(--surface-container-lowest)',
          border: isReplying
            ? '1.5px solid var(--divider)'
            : '1px solid var(--divider)'
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
                  ? 'var(--campora-navy)'
                  : getAvatarColor(
                      comment.author_name || 'Student'
                    ),
                color: isAnonymous
                  ? 'var(--surface-container-lowest)'
                  : getAvatarTextColor(
                      getAvatarColor(
                        comment.author_name || 'Student'
                      )
                    ),
                border: '1px solid var(--hairline)'
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
  fontWeight: 600,
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
  fontWeight: '750',
  color: 'var(--campora-text)',
  fontSize: '15px'
};

const anonymousTagStyle = {
  fontSize: '10px',
  background: 'var(--campora-bg)',
  color: '#717786',
  padding: '2px 8px',
  borderRadius: '10px',
  fontWeight: '800'
};

const postDateStyle = {
  margin: '2px 0 0',
  fontSize: '11px',
  color: '#717786',
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
  color: '#717786',
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
  color: 'var(--campora-text)'
};

const postContentStyle = {
  fontSize: '15px',
  color: 'var(--campora-text)',
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
  minHeight: '46px',
  padding: '12px 15px',
  borderRadius: '12px',
  border: '1.5px solid var(--divider)',
  outline: 'none',
  fontSize: '14px',
  fontWeight: 600,
  color: '#252A33',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  background: 'var(--surface-container-lowest)'
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
  color: '#717786',
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
  background: 'var(--campora-navy-solid)',
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
  color: '#717786',
  fontSize: '12px',
  fontWeight: '800'
};

const noCommentsStyle = {
  fontSize: '13px',
  color: '#717786',
  fontWeight: '700',
  textAlign: 'center',
  margin: '15px 0'
};

const commentsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
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
  background: 'var(--surface-container-lowest)',
  borderRadius: '12px',
  boxShadow: 'var(--shadow-soft)',
  border: '1px solid var(--divider)',
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
  color: 'var(--campora-text)',
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
  background: 'rgba(8, 11, 20, 0.55)',
  backdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px'
};

const modalCardStyle = {
  width: '100%',
  maxWidth: '640px',
  padding: '38px 40px',
  borderRadius: 'var(--radius)',
  background: 'var(--surface-container-lowest)',
  boxShadow: 'var(--shadow-lift)'
};

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  color: 'var(--campora-text)'
};

const modalCloseStyle = {
  border: 'none',
  background: 'transparent',
  color: '#717786',
  cursor: 'pointer',
  display: 'flex'
};

const modalFormStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const labelStyle = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#2F3540',
  display: 'block',
  marginBottom: '8px',
  letterSpacing: '0.45px'
};

const replyPreferenceGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: '9px'
};

const replyPreferenceButtonStyle = {
  minHeight: '44px',
  padding: '10px 12px',
  borderRadius: '12px',
  border: '1px solid #E1E5EB',
  background: '#F8F9FB',
  color: '#555E6C',
  fontSize: '12px',
  fontWeight: 650,
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '7px',
  transition: 'all 0.18s ease'
};

const replyPreferenceButtonActiveStyle = {
  background: '#0B1A3F',
  color: '#FFFFFF',
  borderColor: '#0B1A3F'
};

const anonymousPostRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '700',
  color: 'var(--campora-text)'
};

const modalFooterStyle = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'flex-end',
  marginTop: '10px'
};

const cancelBtn = {
  background: 'var(--campora-bg)',
  color: 'var(--campora-text)',
  border: 'none',
  borderRadius: '12px',
  padding: '10px 18px',
  fontWeight: '800',
  fontSize: '13px',
  cursor: 'pointer',
  fontFamily: 'inherit'
};

const saveBtnSmall = {
  background: 'var(--campora-navy-solid)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '12px',
  padding: '10px 18px',
  fontWeight: '800',
  fontSize: '13px',
  cursor: 'pointer',
  boxShadow: '0 6px 15px rgba(0,45,98,0.2)',
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
  fontWeight: '700',
  fontSize: '13px',
  color: 'var(--campora-text)'
};

const commentActionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
};

const replyButtonStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--campora-text)',
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
  color: 'var(--campora-urgent)',
  padding: 0
};

const replyingToTagStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  color: '#717786',
  background: 'var(--surface-container-low)',
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
  color: 'var(--campora-text)',
  fontWeight: '600',
  lineHeight: '1.4'
};

const inlineReplyWrapStyle = {
  marginLeft: '18px',
  padding: '10px 0 2px 12px',
  borderLeft: '2px solid var(--divider)',
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
  color: 'var(--campora-text)',
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
  borderLeft: '2px solid var(--divider)',
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
  background: 'var(--surface-container-lowest)',
  border: '1px solid var(--divider)',
  borderRadius: 'var(--radius-secondary)',
  overflow: 'hidden',

  boxShadow: 'var(--shadow-soft)'
};

const instagramDmSidebar = { borderRight: '1px solid var(--divider)', display: 'flex',
flexDirection: 'column', minWidth: 0, background: 'var(--surface-container-lowest)' };

const instagramDmSidebarHeader = { padding: '24px 22px 16px', display: 'flex',
alignItems: 'center', justifyContent: 'space-between', gap: '12px' };

const instagramDmSidebarTitle = { margin: 0, color: 'var(--campora-text)', fontSize: '22px',
fontWeight: '900' };

const instagramDmSidebarSubtitle = { margin: '4px 0 0', color: '#717786',
fontSize: '11px', fontWeight: '700' };

const instagramSearchWrap = {
  border: '1px solid #E6EBF2',
  background: '#FFFFFF', padding: '0 18px 16px' };

const instagramSearchBar = { height: '50px', border: '1.5px solid var(--divider)',
borderRadius: '15px', background: 'var(--surface-container-high)', display: 'flex', alignItems:
'center', gap: '10px', padding: '0 15px', boxSizing: 'border-box' };

const instagramSearchIcon = {
  color: '#A0A7B3',
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
  background: '#FFFFFF',
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
  color: '#A0A7B3',
  cursor: 'pointer',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const instagramSearchResults = {
  margin: '0 16px 12px',
  border: '1px solid var(--divider)',
  borderRadius: '14px',
  padding: '6px',
  maxHeight: '250px',
  overflowY: 'auto',
  background: 'var(--surface-container-lowest)',
  boxShadow: 'var(--shadow-soft)',
  zIndex: 2
};

const instagramSearchStatus = {
  padding: '14px',
  textAlign: 'center',
  color: '#717786',
  fontSize: '12px',
  fontWeight: '700'
};

const instagramSearchResultRow = {
  width: '100%',
  border: 'none',
  background: 'var(--surface-container-lowest)',
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

const instagramThreadRowActive = { background: 'var(--surface-container-low)' };

const instagramAvatar = {
  width: '54px',
  height: '54px',
  borderRadius: '50%',
  flexShrink: 0,
  border: '1px solid var(--hairline)',
  background: '#E0F2FE',
  color: '#7D899A',
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
  color: 'var(--campora-text)',
  fontSize: '14px',
  fontWeight: '900',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const instagramPersonMeta = {
  margin: '3px 0 0',
  color: '#717786',
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
  color: '#717786',
  fontSize: '8px',
  fontWeight: '700',
  flexShrink: 0
};

const instagramMessagePreview = {
  margin: '5px 0 0',
  color: '#717786',
  fontSize: '11px',
  fontWeight: '600',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const instagramEmptyThreads = {
  padding: '32px 14px',
  textAlign: 'center',
  color: '#717786',
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
  background: 'var(--surface-container-lowest)',
  overflow: 'hidden'
};

const instagramChatHeader = { minHeight: '86px', padding: '16px 24px',
borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center',
justifyContent: 'space-between', gap: '14px' };

const instagramChatName = {
  margin: 0,
  color: 'var(--campora-text)',
  fontSize: '18px',
  fontWeight: '900'
};

const instagramChatEmail = {
  margin: '4px 0 0',
  color: '#717786',
  fontSize: '11px',
  fontWeight: '700'
};

const instagramHeaderPin = {
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  border: 'none',
  background: 'var(--surface-container-lowest)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const instagramChatHistory = { position: 'relative', flex: '1 1 auto', minHeight: 0,
overflowY: 'auto', overflowX: 'hidden', overscrollBehavior: 'contain',
WebkitOverflowScrolling: 'touch', padding: '26px 24px', background:
'var(--surface-container-lowest)' };

const instagramEmptyChat = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#717786',
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
  border: 'none',
  color: 'var(--campora-text)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '14px'
};

const instagramNoChatTitle = {
  margin: 0,
  color: 'var(--campora-text)',
  fontSize: '18px',
  fontWeight: '900'
};

const instagramNoChatText = {
  margin: '7px 0 0',
  color: '#717786',
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
  background: 'var(--campora-navy-solid)',
  color: '#FFFFFF',
  borderBottomRightRadius: '6px'
};

const instagramBubbleTheirs = {
  background: 'var(--surface-container-low)',
  color: 'var(--campora-text)',
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
  background: 'var(--surface-container-lowest)',
  borderLeft: '3px solid var(--campora-navy)',
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
  border: '1px solid var(--divider)',
  background: 'var(--surface-container-lowest)',
  borderRadius: '999px',
  padding: '3px 7px',
  fontSize: '10px',
  cursor: 'pointer'
};

const instagramMessageMenuButton = { position: 'absolute', top: '8px', border:
'none', background: 'transparent', color: '#717786', cursor: 'pointer', padding:
'4px 7px', fontWeight: '900', letterSpacing: '1px' };

const instagramMessageMenu = { position: 'absolute', top: '34px', background:
'var(--surface-container-lowest)', border: '1px solid var(--divider)', borderRadius: '13px', padding: '7px',
boxShadow: 'var(--shadow-soft)', zIndex: 40, display: 'flex',
alignItems: 'center', gap: '3px', flexWrap: 'wrap', minWidth: '250px', maxWidth:
'min(310px, calc(100vw - 80px))' };

const instagramEmojiButton = { border: 'none', background: 'transparent',
fontSize: '16px', cursor: 'pointer', padding: '4px' };

const instagramMenuAction = { border: 'none', background: 'var(--surface-container-high)', color:
'var(--campora-text)', borderRadius: '8px', padding: '6px 8px', display: 'flex', alignItems:
'center', gap: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' };

const instagramReplyComposerPreview = {
  borderTop: '1px solid var(--divider)',
  padding: '10px 20px',
  background: 'var(--surface-container-high)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '10px',
  flexShrink: 0
};

const instagramReplyClose = {
  border: 'none',
  background: 'transparent',
  color: '#717786',
  cursor: 'pointer',
  display: 'flex'
};

const instagramPinnedWrap = {
  background: 'var(--tone-tertiary-soft)',
  borderTop: '1px solid var(--tone-tertiary)',
  borderBottom: '1px solid var(--tone-tertiary)',
  padding: '10px 14px',
  flexShrink: 0
};

const instagramPinnedTitle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginBottom: '8px',
  color: 'var(--tone-tertiary)',
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
  background: 'var(--surface-container-lowest)',
  border: '1px solid var(--tone-tertiary)'
};

const instagramPinnedMessageText = {
  color: 'var(--campora-text)',
  fontSize: '11px',
  fontWeight: '700',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const instagramPinnedRemove = {
  border: 'none',
  background: 'transparent',
  color: 'var(--tone-tertiary)',
  cursor: 'pointer',
  display: 'flex',
  padding: '2px',
  flexShrink: 0
};

const instagramComposer = { borderTop: '1px solid var(--divider)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', flexShrink: 0, position: 'relative', zIndex: 3 };

const instagramComposerInput = { flex: 1, height: '50px', minWidth: 0,
borderRadius: '20px', border: '1.5px solid var(--divider)', background: '#FFFFFF',
padding: '0 16px', fontSize: '13px', fontWeight: '700', color: '#0B1A3F', outline:
'none', boxSizing: 'border-box', fontFamily: 'inherit' };

const instagramSendButton = {
  width: '52px',
  height: '52px',
  borderRadius: '50%',
  border: 'none',
  background: 'var(--campora-navy-solid)',
  color: '#98A2B3',
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
