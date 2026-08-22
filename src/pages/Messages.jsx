import './CamporaMobileCompat.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Inbox,
  Send,
  FileText,
  Users,
  BarChart2,
  MessageSquare,
  Search,
  Mail,
  X,
  Plus,
  ArrowLeft,
  Sparkles,
  UserRound,
  Bell,
  BellOff,
  Maximize2,
  Minimize2,
  Pin,
  MoreVertical,
  Reply,
  Paperclip,
  Trash2,
  Eraser,
  MoreHorizontal,
  ImageIcon,
  Archive,
  LogOut,
  Flag,
  Check} from 'lucide-react';

import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';


const FOLDERS = [
  { key: 'all', label: 'All Conversations', icon: MessageSquare },
  { key: 'inbox', label: 'Inbox', icon: Inbox },
  { key: 'sent', label: 'Sent', icon: Send },
  { key: 'drafts', label: 'Drafts', icon: FileText },
  { key: 'groups', label: 'Private Groups', icon: Users },
  { key: 'study-groups', label: 'Study Groups', icon: Users },
  { key: 'mentors', label: 'Mentors', icon: UserRound },
  { key: 'archive', label: 'Archived', icon: Archive },
];

const AVATAR_COLORS = [
  '#D8E7F7',
  '#DDD4F3',
  '#F2D8CC',
  '#D4E8E2',
  '#F0DFBE',
  '#F0D1D8',
];

function getInitials(name = 'Student') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'S';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
}

function avatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDate(value) {
  if (!value) return '';

  const date = new Date(value);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

function formatMessageTime(value) {
  if (!value) return '';

  const date = new Date(value);

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

const REPORT_REASONS = [
  'Spam or advertising',
  'Harassment or bullying',
  'Threatening or hateful content',
  'Inappropriate or explicit content',
  'Impersonation',
  'Something else',
];

function cleanMessageText(raw) {
  return String(raw || '')
    .replace(/^\[\[CAMPORA_ATTACHMENT:[^\]]*\]\]/, '')
    .replace(/^\[\[CAMPORA_SOURCE:[^\]]*\]\]/, '')
    .replace(/^\[\[CAMPORA_DM:[^\]]*\]\]/, '')
    .trim();
}

function parseDirectMessage(rawValue) {
  const raw = String(rawValue || '');

  const dmMatch = raw.match(/^\[\[CAMPORA_DM:([^\]]+)\]\]/);

  if (dmMatch) {
    try {
      const meta = JSON.parse(decodeURIComponent(dmMatch[1]));
      return {
        text: raw.replace(/^\[\[CAMPORA_DM:[^\]]+\]\]/, ''),
        source: meta?.source || null,
        reply: meta?.reply || null,
      };
    } catch {
      return {
        text: raw.replace(/^\[\[CAMPORA_DM:[^\]]+\]\]/, ''),
        source: null,
        reply: null,
      };
    }
  }

  const legacyMatch = raw.match(/^\[\[CAMPORA_SOURCE:([^\]]+)\]\]/);

  if (legacyMatch) {
    try {
      return {
        text: raw.replace(/^\[\[CAMPORA_SOURCE:[^\]]+\]\]/, ''),
        source: JSON.parse(decodeURIComponent(legacyMatch[1])),
        reply: null,
      };
    } catch {
      return {
        text: raw.replace(/^\[\[CAMPORA_SOURCE:[^\]]+\]\]/, ''),
        source: null,
        reply: null,
      };
    }
  }

  return {
    text: raw
      .replace(/^\[\[CAMPORA_DM:[^\]]+\]\]/, '')
      .replace(/^\[\[CAMPORA_SOURCE:[^\]]+\]\]/, ''),
    source: null,
    reply: null,
  };
}

function parseMessageAttachment(rawValue) {
  const value = String(rawValue || '');

  const match = value.match(
    /\[\[CAMPORA_ATTACHMENT:([^\]]+)\]\]/
  );

  if (!match) {
    return {
      attachment: null,
      text: value
    };
  }

  try {
    const attachment = JSON.parse(
      decodeURIComponent(match[1])
    );

    return {
      attachment,
      text: value.replace(match[0], '').trim()
    };
  } catch {
    return {
      attachment: null,
      text: value
    };
  }
}


function sourceLabel(message) {
  const raw =
    String(
      message?.content ||
      message?.message ||
      ''
    );

  const marker = raw.match(
    /\[\[CAMPORA_SOURCE:([^\]]+)\]\]/
  );

  if (marker) {
    try {
      const parsed = JSON.parse(
        decodeURIComponent(marker[1])
      );

      const type = String(
        parsed?.type ||
        parsed?.label ||
        ''
      ).toLowerCase();

      if (type.includes('registration')) {
        return 'Registration';
      }

      if (type.includes('study')) {
        return 'Study Groups';
      }

      if (type.includes('campus')) {
        return 'Campus Pulse';
      }
    } catch {
      // Fall through to Direct Message.
    }
  }

  return 'Direct Message';
}

function draftStorageKey(userId) {
  return `campora-central-message-drafts:${userId || 'guest'}`;
}

function readDrafts(userId) {
  try {
    return JSON.parse(
      localStorage.getItem(draftStorageKey(userId)) || '{}'
    );
  } catch {
    return {};
  }
}

function writeDrafts(userId, drafts) {
  localStorage.setItem(
    draftStorageKey(userId),
    JSON.stringify(drafts || {})
  );
}

function selectedDraftKey(selected) {
  if (!selected) return null;

  if (selected.type === 'dm') {
    return `dm:${selected.partnerId}`;
  }

  if (selected.type === 'custom-group') {
    return `custom-group:${selected.groupId}`;
  }

  return `group:${selected.groupId}`;
}


async function createMessagesNotification({
  userId,
  title,
  message,
  category = 'Direct'
}) {
  if (!userId) return;

  let result = await supabase
    .from('notifications')
    .insert([
      {
        user_id: userId,
        title,
        message,
        category,
        read: false,
      },
    ]);

  if (
    result.error &&
    result.error.message?.toLowerCase().includes('category')
  ) {
    result = await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          title,
          message,
          read: false,
        },
      ]);
  }

  if (result.error) {
    console.error('Could not create message notification:', result.error);
  }
}

const MESSAGE_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏'];

export default function Messages() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);

  const [folder, setFolder] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [pendingDmSource, setPendingDmSource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messagesFullscreen, setMessagesFullscreen] = useState(false);
  const detectPhoneViewport = () => {
    if (typeof window === 'undefined') return false;

    const ua = navigator.userAgent || '';
    const isPhoneDevice =
      /iPhone|iPod|Android.*Mobile|Windows Phone|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);

    return isPhoneDevice || window.matchMedia('(max-width: 700px)').matches;
  };

  const [isPhoneViewport, setIsPhoneViewport] = useState(detectPhoneViewport);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const query = window.matchMedia('(max-width: 700px)');
    const syncViewport = () => setIsPhoneViewport(detectPhoneViewport());

    syncViewport();
    window.addEventListener('resize', syncViewport);
    window.addEventListener('orientationchange', syncViewport);

    if (query.addEventListener) {
      query.addEventListener('change', syncViewport);
    } else if (query.addListener) {
      query.addListener(syncViewport);
    }

    return () => {
      window.removeEventListener('resize', syncViewport);
      window.removeEventListener('orientationchange', syncViewport);

      if (query.removeEventListener) {
        query.removeEventListener('change', syncViewport);
      } else if (query.removeListener) {
        query.removeListener(syncViewport);
      }
    };
  }, []);
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    document.body.classList.toggle('campora-phone-messages', isPhoneViewport);

    return () => {
      document.body.classList.remove('campora-phone-messages');
    };
  }, [isPhoneViewport]);

  useEffect(() => {
    if (messagesFullscreen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('campora-messages-fullscreen');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('campora-messages-fullscreen');
    }

    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('campora-messages-fullscreen');
    };
  }, [messagesFullscreen]);

  const [pinnedMessageChats, setPinnedMessageChats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('campora-messages-pinned-chats') || '[]');
    } catch {
      return [];
    }
  });

  const togglePinnedMessageChat = (key) => {
    if (!key) return;
    setPinnedMessageChats((previous) => {
      const exists = previous.includes(key);
      const next = exists
        ? previous.filter((item) => item !== key)
        : [...previous, key];

      localStorage.setItem(
        'campora-messages-pinned-chats',
        JSON.stringify(next)
      );

      return next;
    });
  };


  const [directMessages, setDirectMessages] = useState([]);
  const [messageNotificationPrefs, setMessageNotificationPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('campora-message-notifications') || '{}');
    } catch {
      return {};
    }
  });

  const isMessageNotificationOn = (key) =>
    messageNotificationPrefs[key] !== false;

  const toggleMessageNotification = (key) => {
    setMessageNotificationPrefs((previous) => {
      const next = { ...previous, [key]: previous[key] === false };
      localStorage.setItem('campora-message-notifications', JSON.stringify(next));
      return next;
    });
  };

  const [profiles, setProfiles] = useState({});

  const [groups, setGroups] = useState([]);
  const [groupMessages, setGroupMessages] = useState({});

  const [customGroups, setCustomGroups] = useState([]);
  const [customGroupMessages, setCustomGroupMessages] = useState({});

  const [selected, setSelected] = useState(null);
  useEffect(() => {
    setMessagesFullscreen(false);
  }, [selected?.type, selected?.partnerId, selected?.groupId]);

  const [activeMessageMenu, setActiveMessageMenu] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [chatActionsOpen, setChatActionsOpen] = useState(false);
  const [showSharedMedia, setShowSharedMedia] = useState(false);
  const [groupReadReceipts, setGroupReadReceipts] = useState({});
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [chatMemberRows, setChatMemberRows] = useState([]);
  const [chatMembersLoading, setChatMembersLoading] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollSubmitting, setPollSubmitting] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const attachmentInputRef = useRef(null);

  const [archivedChats, setArchivedChats] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('campora-archived-chats') || '{}'
      );
    } catch {
      return {};
    }
  });
  const [deletedChatsForMe, setDeletedChatsForMe] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('campora-deleted-chats-for-me') || '{}'
      );
    } catch {
      return {};
    }
  });


  const [clearedChats, setClearedChats] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('campora-cleared-chats') || '{}'
      );
    } catch {
      return {};
    }
  });


  const [localMessageReactions, setLocalMessageReactions] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('campora-central-message-reactions') || '{}'
      );
    } catch {
      return {};
    }
  });

  const [pinnedMessages, setPinnedMessages] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('campora-central-pinned-messages') || '{}'
      );
    } catch {
      return {};
    }
  });

  const toggleLocalMessageReaction = (messageId, emoji) => {
    if (!messageId) return;

    setLocalMessageReactions((previous) => {
      const current = previous[messageId] || {};
      const nextForMessage = {
        ...current,
        [emoji]: current[emoji] ? 0 : 1
      };

      const next = {
        ...previous,
        [messageId]: nextForMessage
      };

      localStorage.setItem(
        'campora-central-message-reactions',
        JSON.stringify(next)
      );

      return next;
    });

    setActiveMessageMenu(null);
  };

  const togglePinnedMessage = (conversationKey, messageId) => {
    if (!conversationKey || !messageId) return;

    setPinnedMessages((previous) => {
      const current = previous[conversationKey] || [];
      const exists = current.includes(messageId);
      const next = {
        ...previous,
        [conversationKey]: exists
          ? current.filter((id) => id !== messageId)
          : [...current, messageId]
      };

      localStorage.setItem(
        'campora-central-pinned-messages',
        JSON.stringify(next)
      );

      return next;
    });

    setActiveMessageMenu(null);
  };



  const [composer, setComposer] = useState('');
  const [drafts, setDrafts] = useState({});

  const [peopleSearch, setPeopleSearch] = useState('');
  const [peopleResults, setPeopleResults] = useState([]);
  const [peopleSearching, setPeopleSearching] = useState(false);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [groupSearchResults, setGroupSearchResults] = useState([]);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const [mentors, setMentors] = useState([]);
  const [mentorLoading, setMentorLoading] = useState(false);

  const chatBottomRef = useRef(null);
  const chatScreenRef = useRef(null);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    setDrafts(readDrafts(currentUser.id));
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;

    let pending = null;

    try {
      pending = JSON.parse(
        localStorage.getItem('campora_pending_message_recipient') || 'null'
      );
    } catch {
      pending = null;
    }

    if (!pending?.id || pending.id === currentUser.id) return;

    localStorage.removeItem('campora_pending_message_recipient');

    const source =
      pending.source === 'Registration' ||
      pending.source === 'Study Groups' ||
      pending.source === 'Campus Pulse'
        ? pending.source
        : 'Direct Message';

    setPendingDmSource({
      partnerId: pending.id,
      source
    });

    setFolder('all');
    setSourceFilter('all');

    openDm(pending.id, {
      id: pending.id,
      name: pending.name || 'Student',
      full_name: pending.name || 'Student',
      email: pending.email || ''
    });
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id || !selected) {
      setComposer('');
      return;
    }

    const key = selectedDraftKey(selected);
    setComposer(key ? drafts[key] || '' : '');
  }, [
    selected?.type,
    selected?.partnerId,
    selected?.groupId,
    currentUser?.id,
  ]);

  useEffect(() => {
    if (!currentUser?.id || !selected) return;

    const key = selectedDraftKey(selected);
    if (!key) return;

    setDrafts((current) => {
      const next = { ...current };

      if (composer.trim()) {
        next[key] = composer;
      } else {
        delete next[key];
      }

      writeDrafts(currentUser.id, next);
      return next;
    });
  }, [composer, currentUser?.id, selected?.type, selected?.partnerId, selected?.groupId]);

  useEffect(() => {
    if (
      !currentUser?.id ||
      selected?.type !== 'dm' ||
      !selected?.partnerId
    ) {
      return;
    }

    const hasUnreadFromPartner = directMessages.some(
      (message) =>
        message.sender_id === selected.partnerId &&
        message.receiver_id === currentUser.id &&
        message.read !== true
    );

    if (!hasUnreadFromPartner) return;

    let cancelled = false;

    const markConversationRead = async () => {
      const { error } = await supabase
        .from('direct_messages')
        .update({ read: true })
        .eq('sender_id', selected.partnerId)
        .eq('receiver_id', currentUser.id)
        .eq('read', false);

      if (error) {
        console.error('Could not mark direct messages as read:', error);
        return;
      }

      if (!cancelled) {
        setDirectMessages((current) =>
          current.map((message) =>
            message.sender_id === selected.partnerId &&
            message.receiver_id === currentUser.id
              ? { ...message, read: true }
              : message
          )
        );
      }
    };

    markConversationRead();

    return () => {
      cancelled = true;
    };
  }, [
    currentUser?.id,
    selected?.type,
    selected?.partnerId,
    directMessages
  ]);

  useEffect(() => {
    const query = peopleSearch.trim();

    if (!query || !currentUser?.id) {
      setPeopleResults([]);
      setPeopleSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setPeopleSearching(true);

      const { data, error } = await supabase.rpc(
        'search_student_directory',
        { search_text: query }
      );

      if (error) {
        console.error('Message directory search error:', error);
        setPeopleResults([]);
      } else {
        setPeopleResults(
          (data || []).filter(
            (profile) => profile.id !== currentUser.id
          )
        );
      }

      setPeopleSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [peopleSearch, currentUser?.id]);

  useEffect(() => {
    const query = groupSearch.trim();

    if (!query || !currentUser?.id) {
      setGroupSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const { data, error } = await supabase.rpc(
        'search_student_directory',
        { search_text: query }
      );

      if (error) {
        console.error('Group member search error:', error);
        setGroupSearchResults([]);
        return;
      }

      setGroupSearchResults(
        (data || []).filter(
          (profile) => profile.id !== currentUser.id
        )
      );
    }, 250);

    return () => clearTimeout(timer);
  }, [groupSearch, currentUser?.id]);

  // Scroll only when opening a different conversation.
  // This does NOT keep forcing the user back to the bottom while they scroll up.
  useEffect(() => {
    if (!selected) return;

    const root = chatScreenRef.current;
    if (!root) return;

    const mainContent = root.closest('.main-content');
    if (mainContent && mainContent.scrollTop !== 0) {
      mainContent.scrollTop = 0;
    }

    const history = root.querySelector('.wa-chat-history');
    if (!history) return;

    const frame = window.requestAnimationFrame(() => {
      history.scrollTop = history.scrollHeight;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selected?.type, selected?.partnerId, selected?.groupId]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const dmChannel = supabase
      .channel(`central_messages_dm_${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
        },
        () => loadDirectMessages(currentUser.id)
      )
      .subscribe();

    const studyGroupChannel = supabase
      .channel(`central_messages_study_groups_${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_messages',
        },
        () => {
          loadGroupsAndMessages(
            currentUser.id
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
        },
        () => {
          loadGroupsAndMessages(
            currentUser.id
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_groups',
        },
        () => {
          loadGroupsAndMessages(
            currentUser.id
          );
        }
      )
      .subscribe();

    const customGroupMessageChannel = supabase
      .channel(`central_messages_custom_groups_${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_group_messages',
        },
        () => loadCustomGroupsAndMessages(currentUser.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(studyGroupChannel);
      supabase.removeChannel(customGroupMessageChannel);
    };
  }, [currentUser?.id]);

  async function initialize() {
    setLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) return;

      setCurrentUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      setCurrentProfile(profile || null);

      await Promise.all([
        loadDirectMessages(user.id),
        loadGroupsAndMessages(user.id),
        loadCustomGroupsAndMessages(user.id),
        loadMentors(),
      ]);
    } catch (error) {
      console.error('Messages initialization error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function mergeProfilesByIds(ids) {
    const uniqueIds = [...new Set((ids || []).filter(Boolean))];
    if (!uniqueIds.length) return;

    const { data, error } = await supabase.rpc(
      'get_student_directory_by_ids',
      { user_ids: uniqueIds }
    );

    if (error) {
      console.error('Could not load profile directory rows:', error);
      return;
    }

    setProfiles((current) => {
      const next = { ...current };

      (data || []).forEach((profile) => {
        next[profile.id] = profile;
      });

      return next;
    });
  }

  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel(`central_dm_notifications_${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${currentUser.id}`,
        },
        (payload) => {
          const incoming = payload.new;
          if (!incoming?.sender_id || !isMessageNotificationOn(incoming.sender_id)) return;
          loadDirectMessages(currentUser.id);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUser?.id, messageNotificationPrefs]);

  async function loadDirectMessages(userId) {
    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Could not load central direct messages:', error);
      return;
    }

    const messages = data || [];
    setDirectMessages(messages);

    const partnerIds = messages
      .map((message) =>
        message.sender_id === userId
          ? message.receiver_id
          : message.sender_id
      )
      .filter(Boolean);

    await mergeProfilesByIds(partnerIds);
  }

  async function syncGroupReadReceipts(messagesList, userId) {
    const rows = (messagesList || []).filter(
      (message) =>
        message?.id &&
        !String(message.id).startsWith('temp-')
    );

    if (!rows.length || !userId) {
      setGroupReadReceipts({});
      return;
    }

    const toMark = rows
      .filter((message) => message.user_id !== userId)
      .map((message) => ({
        message_id: message.id,
        user_id: userId
      }));

    if (toMark.length) {
      const { error: markError } = await supabase
        .from('group_message_reads')
        .upsert(toMark, {
          onConflict: 'message_id,user_id',
          ignoreDuplicates: true
        });

      if (markError) {
        console.error('Could not mark Study Group messages read:', markError);
      }
    }

    const ids = rows.map((message) => message.id);

    const { data, error } = await supabase
      .from('group_message_reads')
      .select('message_id,user_id,read_at')
      .in('message_id', ids);

    if (error) {
      console.error('Could not load Study Group read receipts:', error);
      return;
    }

    const next = {};

    (data || []).forEach((row) => {
      if (!next[row.message_id]) next[row.message_id] = [];
      next[row.message_id].push(row);
    });

    setGroupReadReceipts(next);
  }

  async function loadGroupsAndMessages(userId) {
    if (!userId) return;

    try {
      const { data: membershipRows, error: membershipError } =
        await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', userId);

      if (membershipError) {
        console.error(
          'Could not load Study Group memberships:',
          membershipError
        );
      }

      const joinedGroupIds = [
        ...new Set(
          (membershipRows || [])
            .map((row) => row.group_id)
            .filter(Boolean)
        ),
      ];

      // Also include Study Group chats the user has participated in.
      // This protects older groups where the creator/member row was
      // not inserted correctly but group_messages already exist.
      const { data: participationRows, error: participationError } =
        await supabase
          .from('group_messages')
          .select('group_id')
          .eq('user_id', userId);

      if (participationError) {
        console.error(
          'Could not load Study Group chat participation:',
          participationError
        );
      }

      const participatedGroupIds = [
        ...new Set(
          (participationRows || [])
            .map((row) => row.group_id)
            .filter(Boolean)
        ),
      ];

      const accessibleGroupIds = [
        ...new Set([
          ...joinedGroupIds,
          ...participatedGroupIds,
        ]),
      ];

      const { data: ownedGroups, error: ownedError } =
        await supabase
          .from('study_groups')
          .select('*')
          .eq('creator_id', userId);

      if (ownedError) {
        console.error(
          'Could not load owned Study Groups:',
          ownedError
        );
      }

      let joinedGroups = [];

      if (accessibleGroupIds.length > 0) {
        const { data, error } = await supabase
          .from('study_groups')
          .select('*')
          .in('id', accessibleGroupIds);

        if (error) {
          console.error(
            'Could not load joined Study Groups:',
            error
          );
        } else {
          joinedGroups = data || [];
        }
      }

      const groupMap = new Map();

      [...(ownedGroups || []), ...joinedGroups].forEach(
        (group) => {
          if (group?.id) {
            groupMap.set(group.id, group);
          }
        }
      );

      const visibleGroups = [...groupMap.values()];

      setGroups(visibleGroups);

      if (visibleGroups.length === 0) {
        setGroupMessages({});
        return;
      }

      const visibleGroupIds =
        visibleGroups.map((group) => group.id);

      const { data: messages, error: messageError } =
        await supabase
          .from('group_messages')
          .select('*')
          .in('group_id', visibleGroupIds)
          .order('created_at', {
            ascending: true,
          });

      if (messageError) {
        console.error(
          'Could not load Study Group messages:',
          messageError
        );
        setGroupMessages({});
        return;
      }

      const messageMap = {};

      visibleGroupIds.forEach((groupId) => {
        messageMap[groupId] = [];
      });

      (messages || []).forEach((message) => {
        if (
          !visibleGroupIds.includes(message.group_id)
        ) {
          return;
        }

        if (!messageMap[message.group_id]) {
          messageMap[message.group_id] = [];
        }

        messageMap[message.group_id].push(message);
      });

      setGroupMessages(messageMap);

      await syncGroupReadReceipts(messages || [], userId);
    } catch (error) {
      console.error(
        'Study Group sync error:',
        error
      );

      setGroups([]);
      setGroupMessages({});
    }
  }

  async function loadCustomGroupsAndMessages(userId) {
    const { data: memberships, error: membershipError } =
      await supabase
        .from('message_group_members')
        .select('group_id')
        .eq('user_id', userId);

    if (membershipError) {
      console.error(
        'Could not load custom group memberships:',
        membershipError
      );
      return;
    }

    const groupIds = (memberships || []).map(
      (item) => item.group_id
    );

    if (!groupIds.length) {
      setCustomGroups([]);
      setCustomGroupMessages({});
      return;
    }

    const { data: groupsData, error: groupsError } = await supabase
      .from('message_groups')
      .select('*')
      .in('id', groupIds)
      .order('created_at', { ascending: false });

    if (groupsError) {
      console.error('Could not load custom groups:', groupsError);
      return;
    }

    setCustomGroups(groupsData || []);

    const { data: messagesData, error: messagesError } =
      await supabase
        .from('message_group_messages')
        .select('*')
        .in('group_id', groupIds)
        .order('created_at', { ascending: true });

    if (messagesError) {
      console.error(
        'Could not load custom group messages:',
        messagesError
      );
      return;
    }

    const messageMap = {};

    (messagesData || []).forEach((message) => {
      if (!messageMap[message.group_id]) {
        messageMap[message.group_id] = [];
      }

      messageMap[message.group_id].push(message);
    });

    setCustomGroupMessages(messageMap);

    await mergeProfilesByIds(
      (messagesData || []).map((message) => message.sender_id)
    );
  }

  async function loadMentors() {
    setMentorLoading(true);

    try {
      const { data, error } = await supabase
        .from('mentor_profiles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mentorRows = data || [];
      setMentors(mentorRows);

      await mergeProfilesByIds(
        mentorRows.map((mentor) => mentor.user_id)
      );
    } catch (error) {
      console.error('Could not load mentors:', error);
      setMentors([]);
    } finally {
      setMentorLoading(false);
    }
  }

  const getConversationSource = (partnerId) => {
    const related = directMessages
      .filter(
        (message) =>
          (
            message.sender_id === currentUser?.id &&
            message.receiver_id === partnerId
          ) ||
          (
            message.sender_id === partnerId &&
            message.receiver_id === currentUser?.id
          )
      )
      .sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      );

    for (const message of related) {
      const label = sourceLabel(message);

      if (label !== 'Direct Message') {
        return label;
      }
    }

    return 'Direct Message';
  };

  const conversations = useMemo(() => {
    if (!currentUser?.id) return [];

    const partnerMap = new Map();

    directMessages.forEach((message) => {
      const partnerId =
        message.sender_id === currentUser.id
          ? message.receiver_id
          : message.sender_id;

      if (!partnerId) return;

      const existing = partnerMap.get(partnerId);
      const currentDate = new Date(
        message.created_at || 0
      ).getTime();
      const existingDate = new Date(
        existing?.lastMessage?.created_at || 0
      ).getTime();

      if (!existing || currentDate > existingDate) {
        partnerMap.set(partnerId, {
          type: 'dm',
          partnerId,
          name:
            profiles[partnerId]?.name ||
            profiles[partnerId]?.full_name ||
            profiles[partnerId]?.email?.split('@')[0] ||
            'Student',
          email: profiles[partnerId]?.email || '',
          lastMessage: message,
          source: getConversationSource(partnerId),
          unread: directMessages.filter(
            (item) =>
              item.sender_id === partnerId &&
              item.receiver_id === currentUser.id &&
              !item.read_at
          ).length,
        });
      }
    });

    return [...partnerMap.values()].sort(
      (a, b) =>
        new Date(b.lastMessage?.created_at || 0) -
        new Date(a.lastMessage?.created_at || 0)
    );
  }, [directMessages, profiles, currentUser?.id]);

  const studyGroupConversations = useMemo(() => {
    return groups
      .map((group) => {
        const messages = groupMessages[group.id] || [];
        const lastMessage = messages[messages.length - 1] || null;

        return {
          type: 'group',
          groupId: group.id,
          name: group.name || group.title || 'Study Group',
          group,
          messages,
          lastMessage,
          sortDate:
            lastMessage?.created_at || group.created_at || null,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.sortDate || 0) -
          new Date(a.sortDate || 0)
      );
  }, [groups, groupMessages]);

  const customGroupConversations = useMemo(() => {
    return customGroups
      .map((group) => {
        const messages = customGroupMessages[group.id] || [];
        const lastMessage = messages[messages.length - 1] || null;

        return {
          type: 'custom-group',
          groupId: group.id,
          name: group.name || 'Group',
          group,
          messages,
          lastMessage,
          sortDate:
            lastMessage?.created_at || group.created_at || null,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.sortDate || 0) -
          new Date(a.sortDate || 0)
      );
  }, [customGroups, customGroupMessages]);

  const allRows = useMemo(() => {
    const dmRows = conversations.map((conversation) => ({
      ...conversation,
      sortDate: conversation.lastMessage?.created_at,
    }));

    return [
      ...dmRows,
      ...customGroupConversations,
      ...studyGroupConversations,
    ].sort(
      (a, b) =>
        new Date(b.sortDate || 0).getTime() -
        new Date(a.sortDate || 0).getTime()
    );
  }, [
    conversations,
    customGroupConversations,
    studyGroupConversations,
  ]);

  const inboxRows = useMemo(() => {
    if (!currentUser?.id) return [];

    return directMessages
      .filter(
        (message) => message.receiver_id === currentUser.id
      )
      .map((message) => ({
        ...message,
        partnerId: message.sender_id,
        profile: profiles[message.sender_id] || {},
        parsed: parseDirectMessage(
          message.content || message.message || ''
        ),
      }));
  }, [directMessages, profiles, currentUser?.id]);

  const sentRows = useMemo(() => {
    if (!currentUser?.id) return [];

    return directMessages
      .filter(
        (message) => message.sender_id === currentUser.id
      )
      .map((message) => ({
        ...message,
        partnerId: message.receiver_id,
        profile: profiles[message.receiver_id] || {},
        parsed: parseDirectMessage(
          message.content || message.message || ''
        ),
      }));
  }, [directMessages, profiles, currentUser?.id]);

  const draftRows = useMemo(() => {
    return Object.entries(drafts)
      .filter(([, text]) => String(text || '').trim())
      .map(([key, text]) => {
        if (key.startsWith('dm:')) {
          const partnerId = key.replace('dm:', '');

          return {
            key,
            type: 'dm',
            partnerId,
            text,
            name:
              profiles[partnerId]?.name ||
              profiles[partnerId]?.full_name ||
              'Student',
          };
        }

        if (key.startsWith('custom-group:')) {
          const groupId = key.replace('custom-group:', '');
          const group = customGroups.find(
            (item) => item.id === groupId
          );

          return {
            key,
            type: 'custom-group',
            groupId,
            text,
            name: group?.name || 'Group',
          };
        }

        const groupId = key.replace('group:', '');
        const group = groups.find((item) => item.id === groupId);

        return {
          key,
          type: 'group',
          groupId,
          text,
          name: group?.name || group?.title || 'Study Group',
        };
      });
  }, [drafts, profiles, groups, customGroups]);

  const selectedDmMessages = useMemo(() => {
    if (
      !selected ||
      selected.type !== 'dm' ||
      !currentUser?.id
    ) {
      return [];
    }

    const clearedAt =
      clearedChats[`dm:${selected.partnerId}`] || 0;

    return [...directMessages]
      .filter(
        (message) =>
          (
            (message.sender_id === currentUser.id &&
              message.receiver_id === selected.partnerId) ||
            (message.sender_id === selected.partnerId &&
              message.receiver_id === currentUser.id)
          ) &&
          new Date(message.created_at || 0).getTime() > clearedAt
      )
      .sort(
        (a, b) =>
          new Date(a.created_at || 0) -
          new Date(b.created_at || 0)
      );
  }, [selected, directMessages, currentUser?.id, clearedChats]);

  const selectedStudyGroupMessages = useMemo(() => {
    if (!selected || selected.type !== 'group') return [];

    const clearedAt =
      clearedChats[`study-group:${selected.groupId}`] || 0;

    return (groupMessages[selected.groupId] || []).filter(
      (message) =>
        new Date(message.created_at || 0).getTime() > clearedAt
    );
  }, [selected, groupMessages, clearedChats]);

  const selectedCustomGroupMessages = useMemo(() => {
    if (!selected || selected.type !== 'custom-group') return [];

    const clearedAt =
      clearedChats[`custom-group:${selected.groupId}`] || 0;

    return (customGroupMessages[selected.groupId] || []).filter(
      (message) =>
        new Date(message.created_at || 0).getTime() > clearedAt
    );
  }, [selected, customGroupMessages, clearedChats]);

  useEffect(() => {
    setShowSharedMedia(false);
    setShowMembersPanel(false);
    setShowPollModal(false);
    setChatActionsOpen(false);
  }, [selected?.type, selected?.partnerId, selected?.groupId]);

  const sharedAttachments = useMemo(() => {
    let sourceMessages = [];

    if (selected?.type === 'dm') {
      sourceMessages = selectedDmMessages;
    } else if (selected?.type === 'custom-group') {
      sourceMessages = selectedCustomGroupMessages;
    } else if (selected?.type === 'group') {
      sourceMessages = selectedStudyGroupMessages;
    }

    return sourceMessages
      .map((message) => {
        const raw = message?.content || message?.message || '';
        const { attachment } = parseMessageAttachment(raw);
        if (!attachment?.url) return null;

        const mine =
          selected?.type === 'group'
            ? message?.user_id === currentUser?.id
            : message?.sender_id === currentUser?.id;

        const senderId =
          message?.sender_id ||
          message?.user_id ||
          null;

        const senderProfile = senderId
          ? profiles[senderId]
          : null;

        const senderName = mine
          ? (
              currentProfile?.name ||
              currentProfile?.full_name ||
              currentUser?.email?.split('@')[0] ||
              'You'
            )
          : (
              senderProfile?.name ||
              senderProfile?.full_name ||
              message?.sender_name ||
              senderProfile?.email?.split('@')[0] ||
              selected?.name ||
              'Student'
            );

        return {
          ...attachment,
          messageId: message?.id,
          createdAt: message?.created_at,
          senderName,
          isImage: String(attachment?.type || '').startsWith('image/')
        };
      })
      .filter(Boolean)
      .reverse();
  }, [
    selected,
    selectedDmMessages,
    selectedCustomGroupMessages,
    selectedStudyGroupMessages,
    currentUser?.id,
    profiles,
    currentProfile
  ]);

  const getMessageSenderDisplay = (message, mine = false) => {
    if (mine) {
      return {
        id: currentUser?.id,
        name:
          currentProfile?.name ||
          currentProfile?.full_name ||
          currentUser?.email?.split('@')[0] ||
          'You',
        avatarUrl:
          currentProfile?.avatar_url ||
          currentProfile?.avatarUrl ||
          currentUser?.user_metadata?.avatar_url ||
          currentUser?.user_metadata?.avatarUrl ||
          ''
      };
    }

    const senderId =
      message?.sender_id ||
      message?.user_id ||
      null;

    const profile = senderId ? profiles[senderId] : null;

    return {
      id: senderId,
      name:
        profile?.name ||
        profile?.full_name ||
        message?.sender_name ||
        profile?.email?.split('@')[0] ||
        selected?.name ||
        'Student',
      avatarUrl:
        profile?.avatar_url ||
        profile?.avatarUrl ||
        ''
    };
  };

  const openMessageProfile = (sender) => {
    if (!sender?.id) return;

    const profile = profiles[sender.id] || {};

    setProfilePreview({
      id: sender.id,
      name:
        profile.name ||
        profile.full_name ||
        sender.name ||
        'Student',
      email: profile.email || '',
      major:
        profile.major ||
        profile.program ||
        '',
      year:
        profile.year ||
        profile.class_year ||
        '',
      avatarUrl:
        profile.avatar_url ||
        profile.avatarUrl ||
        ''
    });
  };

  const startDirectMessageFromProfile = () => {
    if (!profilePreview?.id) return;

    const person = {
      id: profilePreview.id,
      name: profilePreview.name,
      full_name: profilePreview.name,
      email: profilePreview.email || ''
    };

    setProfilePreview(null);
    openDm(profilePreview.id, person);
  };

  const loadSelectedChatMembers = async () => {
    if (
      !selected?.groupId ||
      !['group', 'custom-group'].includes(selected.type)
    ) {
      return;
    }

    setChatMembersLoading(true);

    try {
      const membershipTable =
        selected.type === 'group'
          ? 'group_members'
          : 'message_group_members';

      const { data: memberships, error: membershipError } =
        await supabase
          .from(membershipTable)
          .select('user_id')
          .eq('group_id', selected.groupId);

      if (membershipError) throw membershipError;

      const memberIds = [
        ...new Set(
          (memberships || [])
            .map((row) => row.user_id)
            .filter(Boolean)
        )
      ];

      if (!memberIds.length) {
        setChatMemberRows([]);
        return;
      }

      const { data: profileRows, error: profileError } =
        await supabase
          .from('profiles')
          .select('*')
          .in('id', memberIds);

      if (profileError) throw profileError;

      const profileMap = Object.fromEntries(
        (profileRows || []).map((profile) => [
          profile.id,
          profile
        ])
      );

      setChatMemberRows(
        memberIds.map((id) => {
          const profile = profileMap[id] || profiles[id] || {};

          return {
            id,
            name:
              profile.name ||
              profile.full_name ||
              profile.email?.split('@')[0] ||
              'Student',
            email: profile.email || '',
            major:
              profile.major ||
              profile.program ||
              '',
            avatarUrl:
              profile.avatar_url ||
              profile.avatarUrl ||
              ''
          };
        })
      );
    } catch (error) {
      console.error('Could not load chat members:', error);
      toast.error?.('Could not load group members.');
    } finally {
      setChatMembersLoading(false);
    }
  };

  const openMembersPanel = async () => {
    setShowMembersPanel(true);
    await loadSelectedChatMembers();
  };

  const updateStudyGroupPollVote = async (
    message,
    optionIndex
  ) => {
    if (
      !message?.id ||
      !message?.poll_data ||
      !currentUser?.id
    ) {
      return;
    }

    const currentOptions =
      Array.isArray(message.poll_data.options)
        ? message.poll_data.options
        : [];

    const nextOptions = currentOptions.map((option, index) => {
      const votes = Array.isArray(option.votes)
        ? option.votes.filter(Boolean)
        : [];

      const withoutMe = votes.filter(
        (userId) => userId !== currentUser.id
      );

      return {
        ...option,
        votes:
          index === optionIndex
            ? [...withoutMe, currentUser.id]
            : withoutMe
      };
    });

    const nextPollData = {
      ...message.poll_data,
      options: nextOptions
    };

    setGroupMessages((previous) => ({
      ...previous,
      [selected.groupId]: (
        previous[selected.groupId] || []
      ).map((item) =>
        item.id === message.id
          ? {
              ...item,
              poll_data: nextPollData
            }
          : item
      )
    }));

    const { error } = await supabase
      .from('group_messages')
      .update({
        poll_data: nextPollData
      })
      .eq('id', message.id);

    if (error) {
      console.error('Could not save poll vote:', error);
      await loadGroupsAndMessages(currentUser.id);
    }
  };

  const createStudyGroupPoll = async (event) => {
    event.preventDefault();

    if (
      selected?.type !== 'group' ||
      !selected.groupId ||
      !currentUser?.id
    ) {
      return;
    }

    const question = pollQuestion.trim();
    const options = pollOptions
      .map((option) => option.trim())
      .filter(Boolean);

    if (!question || options.length < 2) {
      return;
    }

    setPollSubmitting(true);

    try {
      const senderName =
        currentProfile?.name ||
        currentProfile?.full_name ||
        currentUser?.user_metadata?.full_name ||
        currentUser?.email?.split('@')[0] ||
        'Student';

      const pollData = {
        question,
        options: options.map((option) => ({
          text: option,
          votes: []
        }))
      };

      const { data, error } = await supabase
        .from('group_messages')
        .insert([
          {
            group_id: selected.groupId,
            user_id: currentUser.id,
            sender_name: senderName,
            content: question,
            type: 'poll',
            poll_data: pollData,
            reactions: {}
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setGroupMessages((previous) => ({
        ...previous,
        [selected.groupId]: [
          ...(previous[selected.groupId] || []),
          data
        ].sort(
          (a, b) =>
            new Date(a.created_at) -
            new Date(b.created_at)
        )
      }));

      setPollQuestion('');
      setPollOptions(['', '']);
      setShowPollModal(false);
    } catch (error) {
      console.error('Could not create poll:', error);
      window.alert(
        `Could not create poll: ${error.message}`
      );
    } finally {
      setPollSubmitting(false);
    }
  };

  const getSelectedChatKey = () => {
    if (!selected) return null;

    if (selected.type === 'dm') {
      return `dm:${selected.partnerId}`;
    }

    if (selected.type === 'group') {
      return `study-group:${selected.groupId}`;
    }

    if (selected.type === 'custom-group') {
      return `custom-group:${selected.groupId}`;
    }

    return null;
  };

  const archiveSelectedChat = () => {
    const key = getSelectedChatKey();
    if (!key) return;

    const next = {
      ...archivedChats,
      [key]: Date.now()
    };

    setArchivedChats(next);
    localStorage.setItem(
      'campora-archived-chats',
      JSON.stringify(next)
    );

    setChatActionsOpen(false);
    setSelected(null);
    setFolder('archive');
  };

  const restoreArchivedChat = (key) => {
    if (!key) return;

    const next = { ...archivedChats };
    delete next[key];

    setArchivedChats(next);
    localStorage.setItem(
      'campora-archived-chats',
      JSON.stringify(next)
    );
  };
  const deleteSelectedStudyGroupForMe = () => {
    if (selected?.type !== 'group') return;

    const confirmed = window.confirm(
      'Delete this Study Group chat from your Messages only? The Study Group itself and everyone else\'s chat will stay unchanged.'
    );

    if (!confirmed) return;

    const key = `study-group:${selected.groupId}`;
    const next = {
      ...deletedChatsForMe,
      [key]: Date.now()
    };

    setDeletedChatsForMe(next);
    localStorage.setItem(
      'campora-deleted-chats-for-me',
      JSON.stringify(next)
    );

    restoreArchivedChat(key);
    setChatActionsOpen(false);
    setSelected(null);
    setFolder('all');
  };

  const deleteSelectedPrivateGroupForMe = () => {
    if (selected?.type !== 'custom-group') return;

    const confirmed = window.confirm(
      'Delete this private group chat from your Messages only? The group and everyone else\'s chat will stay unchanged.'
    );

    if (!confirmed) return;

    const key = `custom-group:${selected.groupId}`;
    const next = {
      ...deletedChatsForMe,
      [key]: Date.now()
    };

    setDeletedChatsForMe(next);
    localStorage.setItem(
      'campora-deleted-chats-for-me',
      JSON.stringify(next)
    );

    restoreArchivedChat(key);
    setChatActionsOpen(false);
    setSelected(null);
    setFolder('all');
  };


  const deleteSelectedDirectConversationForEveryone = async () => {
    if (
      selected?.type !== 'dm' ||
      !currentUser?.id ||
      !selected.partnerId
    ) {
      return;
    }

    const confirmed = window.confirm(
      'Delete this entire direct-message conversation for both people? This cannot be undone.'
    );

    if (!confirmed) return;

    try {
      const first = await supabase
        .from('direct_messages')
        .delete()
        .eq('sender_id', currentUser.id)
        .eq('receiver_id', selected.partnerId);

      if (first.error) throw first.error;

      const second = await supabase
        .from('direct_messages')
        .delete()
        .eq('sender_id', selected.partnerId)
        .eq('receiver_id', currentUser.id);

      if (second.error) throw second.error;

      const key = `dm:${selected.partnerId}`;
      restoreArchivedChat(key);

      setChatActionsOpen(false);
      setSelected(null);
      await loadDirectMessages(currentUser.id);
    } catch (error) {
      console.error('Delete DM conversation error:', error);
      alert(
        `Could not delete the conversation for everyone: ${error.message}. You may need to run the Messages delete-permissions SQL.`
      );
    }
  };

  const leaveSelectedGroupForMe = async () => {
    if (!selected || !currentUser?.id) return;

    const isStudyGroup = selected.type === 'group';
    const isPrivateGroup = selected.type === 'custom-group';

    if (!isStudyGroup && !isPrivateGroup) return;

    const confirmed = window.confirm(
      isStudyGroup
        ? 'Leave this Study Group for your account?'
        : 'Leave this private message group for your account?'
    );

    if (!confirmed) return;

    try {
      const table = isStudyGroup
        ? 'group_members'
        : 'message_group_members';

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('group_id', selected.groupId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      const key = isStudyGroup
        ? `study-group:${selected.groupId}`
        : `custom-group:${selected.groupId}`;

      restoreArchivedChat(key);

      setChatActionsOpen(false);
      setSelected(null);

      if (isStudyGroup) {
        await loadGroupsAndMessages(currentUser.id);
      } else {
        await loadCustomGroupsAndMessages(currentUser.id);
      }
    } catch (error) {
      console.error('Leave group error:', error);
      alert(`Could not leave group: ${error.message}`);
    }
  };

  const clearSelectedChatForMe = () => {
    const key = getSelectedChatKey();
    if (!key) return;

    const confirmed = window.confirm(
      'Clear the visible message history for you? This does not delete messages from other people.'
    );

    if (!confirmed) return;

    const now = Date.now();
    const next = { ...clearedChats, [key]: now };

    setClearedChats(next);
    localStorage.setItem(
      'campora-cleared-chats',
      JSON.stringify(next)
    );

    setChatActionsOpen(false);
  };

  const canDeleteSelectedCustomGroup =
    selected?.type === 'custom-group' &&
    selected?.group?.created_by === currentUser?.id;

  const canDeleteSelectedStudyGroup =
    selected?.type === 'group' &&
    selected?.group?.creator_id === currentUser?.id;

  const deleteSelectedCustomGroup = async () => {
    if (!canDeleteSelectedCustomGroup) return;

    const confirmed = window.confirm(
      'Delete this private group permanently? This cannot be undone.'
    );

    if (!confirmed) return;

    try {
      const messagesDelete = await supabase
        .from('message_group_messages')
        .delete()
        .eq('group_id', selected.groupId);

      if (messagesDelete.error) throw messagesDelete.error;

      const membersDelete = await supabase
        .from('message_group_members')
        .delete()
        .eq('group_id', selected.groupId);

      if (membersDelete.error) throw membersDelete.error;

      const { error } = await supabase
        .from('message_groups')
        .delete()
        .eq('id', selected.groupId)
        .eq('created_by', currentUser.id);

      if (error) throw error;

      restoreArchivedChat(`custom-group:${selected.groupId}`);

      setChatActionsOpen(false);
      setSelected(null);
      await loadCustomGroupsAndMessages(currentUser.id);
    } catch (error) {
      console.error('Delete private group for everyone error:', error);
      alert(`Could not delete group: ${error.message}`);
    }
  };

  const deleteSelectedStudyGroupForEveryone = async () => {
    if (!canDeleteSelectedStudyGroup || !currentUser?.id) return;

    const confirmed = window.confirm(
      'Delete this Study Group for everyone? This removes the group, memberships, and messages and cannot be undone.'
    );

    if (!confirmed) return;

    try {
      const messagesDelete = await supabase
        .from('group_messages')
        .delete()
        .eq('group_id', selected.groupId);

      if (messagesDelete.error) throw messagesDelete.error;

      const membersDelete = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', selected.groupId);

      if (membersDelete.error) throw membersDelete.error;

      const groupDelete = await supabase
        .from('study_groups')
        .delete()
        .eq('id', selected.groupId)
        .eq('creator_id', currentUser.id);

      if (groupDelete.error) throw groupDelete.error;

      restoreArchivedChat(`study-group:${selected.groupId}`);

      setChatActionsOpen(false);
      setSelected(null);
      await loadGroupsAndMessages(currentUser.id);
    } catch (error) {
      console.error('Delete Study Group error:', error);
      alert(`Could not delete Study Group: ${error.message}`);
    }
  };

  const pickAttachment = () => {
    attachmentInputRef.current?.click();
  };

  const handleAttachmentSelected = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const maxBytes = 15 * 1024 * 1024;

    if (file.size > maxBytes) {
      alert('Please choose a file smaller than 15 MB.');
      event.target.value = '';
      return;
    }

    setPendingAttachment({
      file,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      previewUrl: file.type?.startsWith('image/')
        ? URL.createObjectURL(file)
        : null
    });

    event.target.value = '';
  };

  const clearPendingAttachment = () => {
    if (pendingAttachment?.previewUrl) {
      URL.revokeObjectURL(pendingAttachment.previewUrl);
    }

    setPendingAttachment(null);
  };

  const uploadPendingAttachment = async () => {
    if (!pendingAttachment?.file || !currentUser?.id) {
      return null;
    }

    setUploadingAttachment(true);

    try {
      const safeName = pendingAttachment.name.replace(
        /[^a-zA-Z0-9._-]/g,
        '_'
      );

      const path = `${currentUser.id}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(path, pendingAttachment.file, {
          cacheControl: '3600',
          upsert: false,
          contentType: pendingAttachment.type
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(path);

      return {
        name: pendingAttachment.name,
        type: pendingAttachment.type,
        size: pendingAttachment.size,
        url: data.publicUrl,
        path
      };
    } finally {
      setUploadingAttachment(false);
    }
  };

  async function openDm(partnerId, fallbackProfile = {}) {
    const profile = profiles[partnerId] || fallbackProfile || {};

    setSelected({
      type: 'dm',
      partnerId,
      name:
        profile.name ||
        profile.full_name ||
        profile.email?.split('@')[0] ||
        'Student',
      email: profile.email || '',
    });

    setPeopleSearch('');
    setPeopleResults([]);

    if (!currentUser?.id) return;

    await supabase
      .from('direct_messages')
      .update({
        read_at: new Date().toISOString(),
        read: true,
      })
      .eq('sender_id', partnerId)
      .eq('receiver_id', currentUser.id)
      .is('read_at', null);

    await loadDirectMessages(currentUser.id);
  }

  function openStudyGroup(group) {
    setSelected({
      type: 'group',
      groupId: group.id,
      name: group.name || group.title || 'Study Group',
      group,
    });
  }

  function openCustomGroup(group) {
    setSelected({
      type: 'custom-group',
      groupId: group.id,
      name: group.name || 'Group',
      group,
    });
  }

  function openDraft(draft) {
    if (draft.type === 'dm') {
      openDm(draft.partnerId);
      return;
    }

    if (draft.type === 'custom-group') {
      const group = customGroups.find(
        (item) => item.id === draft.groupId
      );
      if (group) openCustomGroup(group);
      return;
    }

    const group = groups.find(
      (item) => item.id === draft.groupId
    );
    if (group) openStudyGroup(group);
  }

  async function createCustomMessageGroup() {
    if (!newGroupName.trim()) {
      alert('Please enter a group name.');
      return;
    }

    if (!selectedGroupMembers.length) {
      alert('Please select at least one member.');
      return;
    }

    setCreatingGroup(true);

    try {
      const { data: groupId, error } = await supabase.rpc(
        'create_message_group',
        {
          group_name: newGroupName.trim(),
          member_ids: selectedGroupMembers.map(
            (member) => member.id
          ),
        }
      );

      if (error) throw error;

      const createdName = newGroupName.trim();

      setShowCreateGroup(false);
      setNewGroupName('');
      setGroupSearch('');
      setGroupSearchResults([]);
      setSelectedGroupMembers([]);

      await loadCustomGroupsAndMessages(currentUser.id);
      setFolder('groups');

      setSelected({
        type: 'custom-group',
        groupId,
        name: createdName,
        group: {
          id: groupId,
          name: createdName,
          created_by: currentUser.id,
        },
      });
    } catch (error) {
      console.error('Create group error:', error);
      alert(`Could not create group: ${error.message}`);
    } finally {
      setCreatingGroup(false);
    }
  }

  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportNote, setReportNote] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportedMessageIds, setReportedMessageIds] = useState(
    () => new Set()
  );

  const startReport = (message, messageType) => {
    setReportTarget({ message, messageType });
    setReportReason(REPORT_REASONS[0]);
    setReportNote('');
  };

  async function submitReport() {
    if (!reportTarget || !currentUser?.id) return;

    setReportSubmitting(true);

    try {
      const { message, messageType } = reportTarget;

      const { error } = await supabase
        .from('message_reports')
        .insert([
          {
            message_id: message.id,
            message_type: messageType,
            content: message.content || message.message || '',
            sender_id:
              messageType === 'group'
                ? message.user_id
                : message.sender_id,
            receiver_id:
              messageType === 'dm' ? message.receiver_id : null,
            group_id:
              messageType === 'dm'
                ? null
                : selected?.groupId || null,
            reporter_id: currentUser.id,
            reason: reportReason,
            note: reportNote.trim() || null,
            status: 'pending',
          },
        ]);

      if (error) throw error;

      setReportedMessageIds((current) => {
        const next = new Set(current);
        next.add(message.id);
        return next;
      });

      setReportTarget(null);
      setReportNote('');
      toast('Report submitted. Campora admins will review it.');
    } catch (error) {
      console.error('Report error:', error);
      alert(`Could not submit report: ${error.message}`);
    } finally {
      setReportSubmitting(false);
    }
  }

  async function sendCurrentMessage() {
    const rawText = composer.trim();

    if (
      (!rawText && !pendingAttachment) ||
      !selected ||
      !currentUser?.id
    ) {
      return;
    }

    let attachmentPayload = null;

    if (pendingAttachment) {
      try {
        attachmentPayload = await uploadPendingAttachment();
      } catch (error) {
        console.error('Attachment upload error:', error);
        alert(
          `Could not upload attachment: ${error.message}. Make sure the message-attachments storage bucket is configured.`
        );
        return;
      }
    }

    const replyText = replyingTo
      ? `↪ ${replyingTo.sender}: ${replyingTo.text}\n${rawText}`
      : rawText;

    const attachmentMarker = attachmentPayload
      ? `[[CAMPORA_ATTACHMENT:${encodeURIComponent(
          JSON.stringify(attachmentPayload)
        )}]]`
      : '';

    const messageBody = `${attachmentMarker}${replyText}`;

    const activeDmSource =
      selected?.type === 'dm'
        ? (
            pendingDmSource?.partnerId === selected.partnerId
              ? pendingDmSource.source
              : getConversationSource(selected.partnerId)
          )
        : null;

    const text =
      selected?.type === 'dm' &&
      activeDmSource &&
      activeDmSource !== 'Direct Message'
        ? `[[CAMPORA_SOURCE:${encodeURIComponent(
            JSON.stringify({
              type: activeDmSource,
              label: activeDmSource
            })
          )}]]${messageBody}`
        : messageBody;

    setSending(true);

    try {
      if (selected.type === 'dm') {
        const { error } = await supabase
          .from('direct_messages')
          .insert([
            {
              sender_id: currentUser.id,
              receiver_id: selected.partnerId,
              content: text,
              message: text,
              read: false,
            },
          ]);

        if (error) throw error;

        await createMessagesNotification({
          userId: selected.partnerId,
          title: 'New direct message',
          message: `${
            currentProfile?.name ||
            currentProfile?.full_name ||
            currentUser.user_metadata?.name ||
            currentUser.email?.split('@')[0] ||
            'A student'
          }: ${text.slice(0, 140)}`,
          category: 'Direct'
        });

        clearCurrentDraft();
        setReplyingTo(null);
        clearPendingAttachment();

        if (
          pendingDmSource?.partnerId === selected.partnerId
        ) {
          setPendingDmSource(null);
        }

        await loadDirectMessages(currentUser.id);
      } else if (selected.type === 'custom-group') {
        const { error } = await supabase
          .from('message_group_messages')
          .insert([
            {
              group_id: selected.groupId,
              sender_id: currentUser.id,
              content: text,
            },
          ]);

        if (error) throw error;

        try {
          const { data: memberRows } = await supabase
            .from('message_group_members')
            .select('user_id')
            .eq('group_id', selected.groupId);

          const senderName =
            currentProfile?.name ||
            currentProfile?.full_name ||
            currentUser.user_metadata?.name ||
            currentUser.email?.split('@')[0] ||
            'Student';

          const recipients = new Set(
            (memberRows || [])
              .map((row) => row.user_id)
              .filter(Boolean)
          );

          recipients.delete(currentUser.id);

          await Promise.all(
            [...recipients].map((userId) =>
              createMessagesNotification({
                userId,
                title: `New message in ${selected.name || 'Group'}`,
                message: `${senderName}: ${text.slice(0, 140)}`,
                category: 'Study Groups'
              })
            )
          );
        } catch (notificationError) {
          console.error('Could not notify group members:', notificationError);
        }

        clearCurrentDraft();
        setReplyingTo(null);
        clearPendingAttachment();
        await loadCustomGroupsAndMessages(currentUser.id);
      } else {
        const senderName =
          currentProfile?.name ||
          currentProfile?.full_name ||
          currentUser.user_metadata?.name ||
          currentUser.email?.split('@')[0] ||
          'Student';

        const { error } = await supabase
          .from('group_messages')
          .insert([
            {
              group_id: selected.groupId,
              user_id: currentUser.id,
              sender_name: senderName,
              content: text,
              type: 'text',
              reactions: {},
            },
          ]);

        if (error) throw error;

        try {
          const { data: memberRows } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', selected.groupId);

          const recipients = new Set(
            (memberRows || [])
              .map((row) => row.user_id)
              .filter(Boolean)
          );

          if (selected.group?.creator_id) {
            recipients.add(selected.group.creator_id);
          }

          recipients.delete(currentUser.id);

          await Promise.all(
            [...recipients].map((userId) =>
              createMessagesNotification({
                userId,
                title: `New message in ${selected.name || 'Study Group'}`,
                message: `${senderName}: ${text.slice(0, 140)}`,
                category: 'Study Groups'
              })
            )
          );
        } catch (notificationError) {
          console.error('Could not notify Study Group members:', notificationError);
        }

        clearCurrentDraft();
        setReplyingTo(null);
        clearPendingAttachment();
        await loadGroupsAndMessages(currentUser.id);
      }

      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({
          behavior: 'smooth',
        });
      }, 100);
    } catch (error) {
      console.error('Could not send message:', error);
      alert(`Could not send message: ${error.message}`);
    } finally {
      setSending(false);
    }
  }

  function clearCurrentDraft() {
    const key = selectedDraftKey(selected);

    setComposer('');

    if (!key || !currentUser?.id) return;

    setDrafts((current) => {
      const next = { ...current };
      delete next[key];
      writeDrafts(currentUser.id, next);
      return next;
    });
  }

  function renderStudyGroupRow(item) {
    return (
      <ConversationButton
        key={`study-${item.groupId}`}
        active={
          selected?.type === 'group' &&
          selected.groupId === item.groupId
        }
        avatar={<Users size={18} />}
        avatarBg="#D4E8E2"
        name={item.name}
        meta="Study Group"
        preview={
          item.lastMessage
            ? `${item.lastMessage.sender_name || 'Student'}: ${
                item.lastMessage.content || ''
              }`
            : 'No messages yet'
        }
        date={formatDate(item.sortDate)}
        onClick={() => openStudyGroup(item.group)}
          pinned={pinnedMessageChats.includes(`study-group:${item.groupId}`)}
          onTogglePin={() => togglePinnedMessageChat(`study-group:${item.groupId}`)}
      />
    );
  }

  function renderCustomGroupRow(item) {
    const senderId = item.lastMessage?.sender_id;
    const sender = senderId
      ? profiles[senderId]?.name ||
        profiles[senderId]?.full_name ||
        'Member'
      : '';

    return (
      <ConversationButton
        key={`custom-${item.groupId}`}
        active={
          selected?.type === 'custom-group' &&
          selected.groupId === item.groupId
        }
        avatar={<Users size={18} />}
        avatarBg="#DDD4F3"
        name={item.name}
        meta="Message Group"
        preview={
          item.lastMessage
            ? `${sender ? `${sender}: ` : ''}${
                item.lastMessage.content || ''
              }`
            : 'No messages yet'
        }
        date={formatDate(item.sortDate)}
        onClick={() => openCustomGroup(item.group)}
          pinned={pinnedMessageChats.includes(`custom-group:${item.groupId}`)}
          onTogglePin={() => togglePinnedMessageChat(`custom-group:${item.groupId}`)}
      />
    );
  }

  const isChatArchived = (key) =>
    Boolean(archivedChats[key]);

  const isChatDeletedForMe = (key) =>
    Boolean(deletedChatsForMe[key]);

  const shouldShowChat = (key) =>
    !isChatArchived(key) &&
    !isChatDeletedForMe(key);

  function currentList() {
    if (folder === 'archive') {
      return allRows
        .filter((item) => {
          const key =
            item.type === 'custom-group'
              ? `custom-group:${item.groupId}`
              : item.type === 'group'
              ? `study-group:${item.groupId}`
              : `dm:${item.partnerId}`;

          return isChatArchived(key) && !isChatDeletedForMe(key);
        })
        .map((item) => {
          const key =
            item.type === 'custom-group'
              ? `custom-group:${item.groupId}`
              : item.type === 'group'
              ? `study-group:${item.groupId}`
              : `dm:${item.partnerId}`;

          if (item.type === 'custom-group') {
            const row = renderCustomGroupRow(item);

            return React.cloneElement(row, {
              preview: row.props.preview || 'Archived conversation',
              onClick: () => openCustomGroup(item.group),
              onTogglePin: () => togglePinnedMessageChat(key),
              pinned: pinnedMessageChats.includes(key)
            });
          }

          if (item.type === 'group') {
            const row = renderStudyGroupRow(item);

            return React.cloneElement(row, {
              preview: row.props.preview || 'Archived conversation',
              onClick: () => openStudyGroup(item.group),
              onTogglePin: () => togglePinnedMessageChat(key),
              pinned: pinnedMessageChats.includes(key)
            });
          }

          const parsed = parseDirectMessage(
            item.lastMessage?.content ||
              item.lastMessage?.message ||
              ''
          );

          return (
            <ConversationButton
              key={`archive-${item.partnerId}`}
              active={
                selected?.type === 'dm' &&
                selected.partnerId === item.partnerId
              }
              avatar={getInitials(item.name)}
              avatarBg={avatarColor(item.name)}
              name={item.name}
              meta="Archived"
              preview={parsed.text}
              date={formatDate(item.sortDate)}
              unread={item.unread > 0}
              unreadCount={item.unread}
              onClick={() => openDm(item.partnerId)}
              pinned={pinnedMessageChats.includes(key)}
              onTogglePin={() => togglePinnedMessageChat(key)}
            />
          );
        });
    }

    if (folder === 'study-groups') {
      return studyGroupConversations
        .filter(
          (item) =>
            !isChatDeletedForMe(
              `study-group:${item.groupId}`
            )
        )
        .map((item) => {
        const lastMessage = item.lastMessage;

        return (
          <ConversationButton
            key={`study-group:${item.groupId}`}
            avatar={<Users size={20} />}
            avatarBg="#D4E8E2"
            name={item.name}
            meta="Study Group"
            preview={lastMessage?.content || ''}
            date={formatDate(item.sortDate)}
            unread={false}
            onClick={() => openStudyGroup(item.group)}
            pinned={pinnedMessageChats.includes(`study-group:${item.groupId}`)}
            onTogglePin={() =>
              togglePinnedMessageChat(`study-group:${item.groupId}`)
            }
          />
        );
      });
    }

    if (folder === 'mentors') {
      if (mentorLoading) {
        return [
          <div key="mentor-loading" className="central-list-empty">
            Loading mentors...
          </div>,
        ];
      }

      if (!mentors.length) {
        return [
          <div key="mentor-empty" className="wa-empty-list">
            <div className="wa-empty-list-icon">
              <UserRound size={30} />
            </div>
            <strong>No active mentors available yet</strong>
            <span style={{ marginTop: '7px', fontSize: '12px' }}>
              Mentor profiles will appear here once they are added.
            </span>
          </div>,
        ];
      }

      return mentors.map((mentor) => {
        const profile = profiles[mentor.user_id] || {};

        const name =
          profile.name ||
          profile.full_name ||
          profile.email?.split('@')[0] ||
          'Mentor';

        const specialties = Array.isArray(mentor.specialties)
          ? mentor.specialties
          : [];

        const courses = Array.isArray(mentor.courses)
          ? mentor.courses
          : [];

        return (
          <div
            key={mentor.id}
            className="mentor-card"
          >
            <div
              className="wa-avatar mentor-avatar"
              style={{ background: avatarColor(name) }}
            >
              {getInitials(name)}
            </div>

            <div className="mentor-card-main">
              <div className="mentor-card-topline">
                <div>
                  <div className="mentor-name">{name}</div>
                  <div className="mentor-role">
                    {mentor.title || mentor.mentor_type || 'Mentor'}
                  </div>
                </div>

                <button
                  type="button"
                  className="mentor-message-btn"
                  onClick={() => openDm(mentor.user_id, profile)}
                >
                  <MessageSquare size={15} />
                  Message
                </button>
              </div>

              {mentor.department && (
                <div className="mentor-department">
                  {mentor.department}
                </div>
              )}

              {mentor.bio && (
                <p className="mentor-bio">{mentor.bio}</p>
              )}

              {(specialties.length > 0 || courses.length > 0) && (
                <div className="mentor-chip-row">
                  {specialties.slice(0, 4).map((item) => (
                    <span key={`specialty-${mentor.id}-${item}`} className="mentor-chip">
                      {item}
                    </span>
                  ))}
                  {courses.slice(0, 4).map((item) => (
                    <span key={`course-${mentor.id}-${item}`} className="mentor-chip course">
                      {item}
                    </span>
                  ))}
                </div>
              )}

              {(mentor.office || mentor.availability) && (
                <div className="mentor-meta-row">
                  {mentor.office && <span>Office: {mentor.office}</span>}
                  {mentor.availability && (
                    <span>Available: {mentor.availability}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      });
    }

    if (folder === 'groups') {
      return [
        ...customGroupConversations.map(renderCustomGroupRow),
        ...studyGroupConversations.map(renderStudyGroupRow),
      ];
    }

    if (folder === 'drafts') {
      return draftRows.map((draft) => (
        <ConversationButton
          key={draft.key}
          active={
            draft.type === selected?.type &&
            (draft.partnerId === selected?.partnerId ||
              draft.groupId === selected?.groupId)
          }
          avatar={
            draft.type === 'dm' ? (
              <FileText size={18} />
            ) : (
              <Users size={18} />
            )
          }
          avatarBg={
            draft.type === 'custom-group'
              ? '#DDD4F3'
              : draft.type === 'group'
              ? '#D4E8E2'
              : '#F0DFBE'
          }
          name={draft.name}
          meta={
            draft.type === 'custom-group'
              ? 'Group Draft'
              : draft.type === 'group'
              ? 'Study Group Draft'
              : 'Draft'
          }
          preview={draft.text}
          date="Draft"
          onClick={() => openDraft(draft)}
        />
      ));
    }

    if (folder === 'inbox') {
      const inboxConversations = conversations.filter((conversation) =>
        directMessages.some(
          (message) =>
            message.sender_id === conversation.partnerId &&
            message.receiver_id === currentUser.id
        )
      );

      return inboxConversations.map((conversation) => {
        const latestReceived = directMessages
          .filter(
            (message) =>
              message.sender_id === conversation.partnerId &&
              message.receiver_id === currentUser.id
          )
          .sort(
            (a, b) =>
              new Date(b.created_at || 0) -
              new Date(a.created_at || 0)
          )[0];

        const parsed = parseDirectMessage(
          latestReceived?.content ||
            latestReceived?.message ||
            ''
        );

        return (
          <ConversationButton
            key={`inbox-${conversation.partnerId}`}
            active={
              selected?.type === 'dm' &&
              selected.partnerId === conversation.partnerId
            }
            avatar={getInitials(conversation.name)}
            avatarBg={avatarColor(conversation.name)}
            name={conversation.name}
            meta={sourceLabel(latestReceived)}
            preview={parsed.text}
            date={formatDate(latestReceived?.created_at)}
            unread={conversation.unread > 0}
            unreadCount={conversation.unread}
            onClick={() => openDm(conversation.partnerId)}
            pinned={pinnedMessageChats.includes(`dm:${conversation.partnerId}`)}
            onTogglePin={() => togglePinnedMessageChat(`dm:${conversation.partnerId}`)}
          />
        );
      });
    }

    if (folder === 'sent') {
      const sentConversations = conversations.filter((conversation) =>
        directMessages.some(
          (message) =>
            message.sender_id === currentUser.id &&
            message.receiver_id === conversation.partnerId
        )
      );

      return sentConversations.map((conversation) => {
        const latestSent = directMessages
          .filter(
            (message) =>
              message.sender_id === currentUser.id &&
              message.receiver_id === conversation.partnerId
          )
          .sort(
            (a, b) =>
              new Date(b.created_at || 0) -
              new Date(a.created_at || 0)
          )[0];

        const parsed = parseDirectMessage(
          latestSent?.content ||
            latestSent?.message ||
            ''
        );

        return (
          <ConversationButton
            key={`sent-${conversation.partnerId}`}
            active={
              selected?.type === 'dm' &&
              selected.partnerId === conversation.partnerId
            }
            avatar={getInitials(conversation.name)}
            avatarBg={avatarColor(conversation.name)}
            name={conversation.name}
            meta="Direct Message"
            preview={parsed.text}
            date={formatDate(latestSent?.created_at)}
            onClick={() => openDm(conversation.partnerId)}
            pinned={pinnedMessageChats.includes(`dm:${conversation.partnerId}`)}
            onTogglePin={() => togglePinnedMessageChat(`dm:${conversation.partnerId}`)}
          />
        );
      });
    }

    if (folder !== 'all') {
      return [];
    }

    return allRows
      .filter((item) => {
        const key =
          item.type === 'custom-group'
            ? `custom-group:${item.groupId}`
            : item.type === 'group'
            ? `study-group:${item.groupId}`
            : `dm:${item.partnerId}`;

        return shouldShowChat(key);
      })
      .map((item) => {
      if (item.type === 'custom-group') {
        return renderCustomGroupRow(item);
      }

      if (item.type === 'group') {
        return renderStudyGroupRow(item);
      }

      const parsed = parseDirectMessage(
        item.lastMessage?.content ||
          item.lastMessage?.message ||
          ''
      );

      return (
        <ConversationButton
          key={`dm-${item.partnerId}`}
          active={
            selected?.type === 'dm' &&
            selected.partnerId === item.partnerId
          }
          avatar={getInitials(item.name)}
          avatarBg={avatarColor(item.name)}
          name={item.name}
          meta={item.source}
          preview={parsed.text}
          date={formatDate(item.sortDate)}
          unread={item.unread > 0}
          unreadCount={item.unread}
          onClick={() => openDm(item.partnerId)}
          pinned={pinnedMessageChats.includes(`dm:${item.partnerId}`)}
          onTogglePin={() => togglePinnedMessageChat(`dm:${item.partnerId}`)}
        />
      );
    });
  }

  const allCurrentRows = currentList();

  const sourceFilteredRows =
    sourceFilter === 'all'
      ? allCurrentRows
      : allCurrentRows.filter((row) => {
          const rowSource = String(
            row?.props?.meta || ''
          ).toLowerCase();

          const wanted = String(sourceFilter).toLowerCase();

          if (wanted === 'direct message') {
            return (
              rowSource === 'direct message' ||
              rowSource === 'direct'
            );
          }

          if (wanted === 'study groups') {
            return rowSource === 'study group';
          }

          return rowSource === wanted;
        });

  const rows = [...sourceFilteredRows].sort((a, b) => {
    const aPinned = Boolean(a?.props?.pinned);
    const bPinned = Boolean(b?.props?.pinned);

    if (aPinned === bPinned) return 0;
    return aPinned ? -1 : 1;
  });

  const renderAttachment = (rawValue) => {
    const parsed = parseMessageAttachment(rawValue);

    if (!parsed.attachment) {
      return null;
    }

    const attachment = parsed.attachment;
    const isImage = String(attachment.type || '').startsWith('image/');

    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'block',
          marginBottom: parsed.text ? '8px' : 0,
          textDecoration: 'none',
          color: 'inherit'
        }}
      >
        {isImage ? (
          <img
            src={attachment.url}
            alt={attachment.name || 'Attachment'}
            style={{
              display: 'block',
              width: 'min(280px, 100%)',
              maxHeight: '260px',
              objectFit: 'cover',
              borderRadius: '12px'
            }}
          />
        ) : (
          <div
            style={{
              minWidth: '190px',
              padding: '10px',
              borderRadius: '11px',
              background: 'rgba(255,255,255,.12)',
              border: '1px solid rgba(127,145,170,.20)',
              display: 'flex',
              alignItems: 'center',
              gap: '9px'
            }}
          >
            <FileText size={18} />
            <span
              style={{
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '10px',
                fontWeight: '800'
              }}
            >
              {attachment.name || 'Attachment'}
            </span>
          </div>
        )}
      </a>
    );
  };

  const renderMessageActions = ({
    message,
    mine,
    parsedText,
    conversationKey,
    senderName,
    messageType
  }) => {
    const isPinnedMessage = (
      pinnedMessages[conversationKey] || []
    ).includes(message.id);

    const reactionMap =
      localMessageReactions[message.id] || {};

    return (
      <>
        <button
          type="button"
          onClick={() =>
            setActiveMessageMenu(
              activeMessageMenu === message.id
                ? null
                : message.id
            )
          }
          style={{
            position: 'absolute',
            top: '4px',
            right: mine ? 'auto' : '-30px',
            left: mine ? '-30px' : 'auto',
            width: '26px',
            height: '26px',
            border: 'none',
            borderRadius: '8px',
            background: '#FFFFFF',
            color: '#98A2B3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 5
          }}
          aria-label="Message actions"
        >
          <MoreVertical size={15} />
        </button>

        {activeMessageMenu === message.id && (
          <div
            style={{
              position: 'absolute',
              top: '34px',
              right: mine ? '0' : 'auto',
              left: mine ? 'auto' : '0',
              zIndex: 1000,
              width: '260px',
              maxWidth: 'calc(100vw - 48px)',
              boxSizing: 'border-box',
              padding: '12px',
              borderRadius: '14px',
              border: '1px solid #E3E8EF',
              background: '#FFFFFF',
              boxShadow: '0 10px 28px rgba(11,26,63,0.12)'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
                gap: '6px',
                marginBottom: '10px'
              }}
            >
              {MESSAGE_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() =>
                    toggleLocalMessageReaction(
                      message.id,
                      emoji
                    )
                  }
                  style={{
                    minWidth: '34px',
                    minHeight: '34px',
                    border: 'none',
                    background: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '6px',
                    fontSize: '17px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setReplyingTo({
                  id: message.id,
                  sender: mine ? 'You' : senderName,
                  text: parsedText
                });
                setActiveMessageMenu(null);
              }}
              style={{
                width: '100%',
                border: 'none',
                background: '#FFFFFF',
                color: '#0B1A3F',
                borderRadius: '8px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontSize: '10px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              <Reply size={13} />
              Reply
            </button>

            <button
              type="button"
              onClick={() =>
                togglePinnedMessage(
                  conversationKey,
                  message.id
                )
              }
              style={{
                width: '100%',
                border: 'none',
                background: '#FFFFFF',
                color: isPinnedMessage
                  ? '#0B1A3F'
                  : '#0B1A3F',
                borderRadius: '8px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontSize: '10px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              <Pin
                size={13}
                fill={
                  isPinnedMessage
                    ? '#0B1A3F'
                    : 'none'
                }
              />
              {isPinnedMessage ? 'Unpin message' : 'Pin message'}
            </button>

            <button
              type="button"
              onClick={() => startReport(message, messageType)}
              disabled={reportedMessageIds.has(message.id)}
              style={{
                width: '100%',
                border: 'none',
                background: '#FFFFFF',
                color: '#0B1A3F',
                borderRadius: '8px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontSize: '10px',
                fontWeight: '800',
                cursor: reportedMessageIds.has(message.id)
                  ? 'default'
                  : 'pointer',
                opacity: reportedMessageIds.has(message.id) ? 0.5 : 1
              }}
            >
              <Flag
                size={13}
                fill={
                  reportedMessageIds.has(message.id)
                    ? '#0B1A3F'
                    : 'none'
                }
              />
              {reportedMessageIds.has(message.id)
                ? 'Message reported'
                : 'Report message'}
            </button>
          </div>
        )}

        {Object.entries(reactionMap)
          .filter(([, count]) => count)
          .length > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: '-12px',
              right: mine ? '8px' : 'auto',
              left: mine ? 'auto' : '8px',
              display: 'flex',
              gap: '3px',
              padding: '2px 5px',
              borderRadius: '999px',
              background: '#FFFFFF',
              border: '1px solid #E3E8EF',
              fontSize: '11px'
            }}
          >
            {Object.entries(reactionMap)
              .filter(([, count]) => count)
              .map(([emoji]) => (
                <span key={emoji}>{emoji}</span>
              ))}
          </div>
        )}
      </>
    );
  };

  if (loading) {
    return (
      <div className="central-messages-loading">
        Loading messages...
      </div>
    );
  }

  return (
    <div className={`wa-messages-page campora-mobile-page messages-mobile ${selected ? 'chat-open' : 'list-open'}`}>
      <style>{`
        .wa-messages-page {
          width: 100%;
          height: auto;
          min-height: 1180px;
          overflow: visible;
          background: #FFFFFF;
          color: var(--campora-text);
        }

        .wa-messages-page.chat-open {
          height: calc(100vh - 84px);
          min-height: 0;
          max-height: calc(100vh - 84px);
          overflow: hidden;
        }

        .wa-messages-page.chat-open .wa-chat-screen {
          height: 100%;
          min-height: 0;
          max-height: 100%;
        }

        .central-messages-loading {
          min-height: calc(100vh - 122px);
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #0B1A3F;
          font-size: 15px;
          font-weight: 700;
          background: transparent;
        }

        .wa-list-screen,
        .wa-chat-screen {
          width: 100%;
          min-width: 0;
          display: flex;
          flex-direction: column;
          background: #FFFFFF;
          border: none;
          border-radius: 0;
          box-shadow: none;
        }

        .wa-list-screen {
          height: auto;
          min-height: 1180px;
          overflow: visible;
        }

        .wa-chat-screen {
          width: 100%;
          height: 100%;
          min-height: 0;
          max-height: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .wa-list-screen {
          width: 100%;
          max-width: none;
          height: auto;
          min-height: 1180px;
          margin: 0;
          padding: 18px 24px 80px;
          overflow: visible;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        .wa-page-title-line p {
          margin: 0;
          color: #A0A7B3;
          font-size: 12px;
          font-weight: 800;
        }

        .wa-page-title-wrap h2 {
          margin: 0;
          color: #0B1A3F;
          font-size: 24px;
          font-weight: 800;
          line-height: 1.05;
        }

        .wa-page-title-wrap p {
          margin: 4px 0 0;
          color: #A0A7B3;
          font-size: 11px;
          font-weight: 700;
        }

        .wa-create-btn {
          min-height: 48px;
          padding: 0 18px;
          flex-shrink: 0;
          border: 1px solid #0B1A3F;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          background: #0B1A3F;
          color: #FFFFFF;
          font: inherit;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 7px 16px rgba(11,26,63,.12);
        }

        .wa-top-overview {
          width: 100%;
          min-height: 150px;
          flex-shrink: 0;
          padding: 28px 30px;
          box-sizing: border-box;
          border-radius: 20px;
          background:
            linear-gradient(
              135deg,
              #08152F 0%,
              #0B1A3F 58%,
              #142B5A 100%
            );
          color: #FFFFFF;
          display: flex;
          align-items: center;
          box-shadow: 0 12px 30px rgba(11,26,63,.13);
        }

        .wa-top-overview-main {
          display: flex;
          align-items: center;
          gap: 15px;
          min-width: 0;
        }

        .wa-top-overview-icon {
          width: 58px;
          height: 58px;
          flex-shrink: 0;
          border-radius: 14px;
          background: rgba(255,255,255,.10);
          border: 1px solid rgba(255,255,255,.13);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wa-top-overview-copy {
          min-width: 0;
        }

        .wa-top-title-line {
          display: flex;
          align-items: baseline;
          gap: 10px;
          min-width: 0;
          flex-wrap: wrap;
        }

        .wa-top-title-line h2,
        .wa-top-title-line h3 {
          margin: 0;
          color: #FFFFFF;
          font-weight: 600;
          letter-spacing: -.025em;
        }

        .wa-top-title-line h2 {
          font-size: 24px;
        }

        .wa-top-title-line h3 {
          font-size: 18px;
          color: #DCE7F7;
        }

        .wa-top-divider {
          color: #8FA8CC;
          font-size: 13px;
          font-weight: 700;
        }

        .wa-top-overview-copy p {
          margin: 6px 0 0;
          color: rgba(255,255,255,.66);
          font-size: 11px;
          font-weight: 700;
          line-height: 1.45;
        }

        .wa-top-stats {
          width: 100%;
          flex-shrink: 0;
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
          margin: 12px 0 14px;
        }

        .wa-top-stat-card {
          min-height: 62px;
          padding: 14px 14px;
          box-sizing: border-box;
          border-radius: 14px;
          background: #FFFFFF;
          border: 1px solid #E5EAF2;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 12px rgba(11,26,63,.025);
        }

        .wa-top-stat-icon {
          width: 35px;
          height: 35px;
          flex-shrink: 0;
          border-radius: 10px;
          background: #FFFFFF;
          color: #0B1A3F;
          border: 1px solid #F1F3F7;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wa-top-stat-card strong {
          display: block;
          color: #0B1A3F;
          font-size: 16px;
          line-height: 1;
          font-weight: 800;
        }

        .wa-top-stat-card span {
          display: block;
          margin-top: 4px;
          color: #A0A7B3;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .035em;
        }

        .wa-inbox-shell {
          display: grid;
          grid-template-columns: 300px minmax(0, 1fr);
          gap: 20px;
          width: 100%;
          flex: 0 0 auto;
          min-height: 820px;
          padding: 0;
          box-sizing: border-box;
          background: transparent;
          border: none;
          box-shadow: none;
          overflow: visible;
          align-items: stretch;
        }

        .wa-folder-panel {
          width: 100%;
          height: 100%;
          min-height: 0;
          box-sizing: border-box;
          padding: 18px 12px 16px;
          background: transparent;
          border: none;
          border-radius: 0;
          box-shadow: none;
          display: flex;
          flex-direction: column;
          overflow: visible;
        }

        .wa-sidebar-header h2 {
          margin: 0;
          font-size: 19px;
          font-weight: 800;
          line-height: 1.05;
          color: #FFFFFF;
        }

        .wa-folder-heading {
          padding: 0 8px 11px;
          color: #8A95A7;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .wa-folder-list {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }

        .wa-folder-btn {
          width: 100%;
          min-height: 60px;
          padding: 0 16px;
          border: 1px solid #E7EBF1;
          border-radius: 14px;
          background: #FFFFFF;
          color: #0B1A3F;
          display: flex;
          align-items: center;
          gap: 10px;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          text-align: left;
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(11,26,63,.025);
          transition:
            transform .15s ease,
            border-color .15s ease,
            background .15s ease,
            box-shadow .15s ease;
        }

        .wa-folder-btn:hover {
          background: #F8FAFD;
          color: #0B1A3F;
          border-color: #D9E1EB;
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(11,26,63,.04);
        }

        .wa-folder-btn.active {
          background: #0B1A3F;
          color: #FFFFFF;
          border-color: #0B1A3F;
          box-shadow: 0 8px 18px rgba(11,26,63,.13);
        }

        .wa-folder-icon {
          width: 27px;
          height: 27px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #FAFBFD;
          flex-shrink: 0;
        }

        .wa-folder-btn.active .wa-folder-icon {
          background: rgba(255,255,255,.12);
        }

        .wa-sidebar-new-group {
          width: 100%;
          min-height: 46px;
          margin-top: 14px;
          padding: 0 12px;
          border: 1px solid #0B1A3F;
          border-radius: 14px;
          background: #0B1A3F;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font: inherit;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 7px 16px rgba(11,26,63,.12);
        }

        .wa-folder-note {
          margin-top: auto;
          padding: 14px 8px 2px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          color: #98A3B4;
          font-size: 10px;
          font-weight: 700;
          line-height: 1.45;
          background: transparent;
        }

        .wa-inbox-main {
          width: 100%;
          height: auto;
          min-width: 0;
          min-height: 820px;
          box-sizing: border-box;
          padding: 18px 0 42px;
          background: transparent;
          border: none;
          border-radius: 0;
          box-shadow: none;
          display: flex;
          flex-direction: column;
          overflow: visible;
        }

        .wa-inbox-toolbar h3 {
          margin: 0;
          color: #0B1A3F;
          font-size: 22px;
          font-weight: 900;
        }

        .wa-inbox-toolbar p {
          margin: 4px 0 0;
          color: #A0A7B3;
          font-size: 11px;
          font-weight: 700;
        }

        .wa-section-label-row {
          min-height: 28px;
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }

        .wa-section-label {
          color: #0B1A3F;
          font-size: 12px;
          font-weight: 700;
        }

        .wa-search-wrap {
          position: relative;
          margin-bottom: 14px;
        }

        .wa-search {
          min-height: 52px;
          padding: 0 15px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #E1E7EF;
          border-radius: 14px;
          background: #FFFFFF;
          color: #7D899A;
          box-shadow: 0 4px 12px rgba(11,26,63,.025);
        }

        .wa-search input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          color: #A0A7B3;
          font: inherit;
          font-size: 13px;
          font-weight: 700;
        }

        .wa-search-clear {
          width: 28px;
          height: 28px;
          padding: 0;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: #A0A7B3;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .wa-search-results {
          position: absolute;
          left: 0;
          right: 0;
          top: calc(100% + 7px);
          z-index: 40;
          overflow: hidden;
          border: 1px solid #E1E7EF;
          border-radius: 14px;
          background: #FFFFFF;
          box-shadow: 0 16px 34px rgba(11,26,63,.11);
        }

        .wa-search-person {
          width: 100%;
          border: none;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 12px;
          text-align: left;
          color: #0B1A3F;
          cursor: pointer;
          font: inherit;
        }

        .wa-search-person:hover {
          background: #F7F9FC;
        }

        .wa-search-person-email {
          margin-top: 2px;
          font-size: 10px;
          color: #A0A7B3;
        }

        .wa-chat-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 0 0 auto;
          min-height: 560px;
          max-height: 68vh;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 0 8px 24px 0;
          scrollbar-width: thin;
          scrollbar-color: #D6DDE8 transparent;
        }

        .wa-chat-list::-webkit-scrollbar {
          width: 6px;
        }

        .wa-chat-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .wa-chat-list::-webkit-scrollbar-thumb {
          background: #D6DDE8;
          border-radius: 999px;
        }

        .wa-chat-row {
          position: relative;
          width: 100%;
          min-height: 82px;
          padding: 12px 15px;
          display: grid;
          grid-template-columns: 50px minmax(0,1fr) auto;
          align-items: center;
          gap: 14px;
          border: 1px solid #E7EBF1;
          border-radius: 15px;
          background: #FFFFFF;
          color: #0B1A3F;
          text-align: left;
          cursor: pointer;
          transition:
            background .15s ease,
            border-color .15s ease,
            box-shadow .15s ease,
            transform .15s ease;
        }

        .wa-chat-row::before {
          content: '';
          position: absolute;
          left: 0;
          top: 13px;
          bottom: 13px;
          width: 3px;
          border-radius: 0 999px 999px 0;
          background: #0B1A3F;
          opacity: 0;
        }

        .wa-chat-row:hover {
          background: #F8FAFD;
          border-color: #D9E1EB;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(11,26,63,.04);
        }

        .wa-chat-row:hover::before,
        .wa-chat-row.active::before {
          opacity: 1;
        }

        .wa-chat-row.active {
          background: #F2F5F9;
          border-color: #D3DCE8;
        }

        .wa-avatar {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #0B1A3F;
          font-size: 13px;
          font-weight: 700;
          box-shadow: inset 0 0 0 1px rgba(11,26,63,.05);
        }

        .wa-chat-main {
          min-width: 0;
        }

        .wa-chat-name-row {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
        }

        .wa-chat-name {
          min-width: 0;
          color: #0B1A3F;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .wa-chat-tag {
          min-height: 20px;
          padding: 0 7px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          background: #F7F8FA;
          color: #66758E;
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .wa-chat-preview {
          margin-top: 4px;
          color: #A0A7B3;
          font-size: 11px;
          font-weight: 650;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .wa-chat-side {
          min-width: 60px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
          color: #96A1B3;
          font-size: 9px;
          font-weight: 800;
        }

        .wa-unread {
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 999px;
          background: #0B1A3F;
          color: #FFFFFF;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 800;
        }

        .wa-empty-list {
          min-height: 285px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #A0A7B3;
          padding: 34px 20px;
        }

        .wa-empty-list-icon {
          width: 58px;
          height: 58px;
          margin-bottom: 13px;
          border-radius: 18px;
          background: #FFFFFF;
          border: 1px solid #E1E7EF;
          box-shadow: 0 5px 14px rgba(11,26,63,.05);
          color: #0B1A3F;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wa-empty-list strong {
          color: #737B88;
          font-size: 14px;
          font-weight: 600;
        }

        .wa-empty-list span {
          margin-top: 6px;
          max-width: 330px;
          font-size: 11px;
          line-height: 1.5;
        }

        /* MENTOR CARDS */
        .mentor-card {
          display: grid;
          grid-template-columns: 48px minmax(0,1fr);
          gap: 12px;
          align-items: start;
          padding: 14px;
          margin-bottom: 8px;
          border: 1px solid #E6EBF2;
          border-radius: 15px;
          background: #FFFFFF;
        }

        .mentor-avatar {
          width: 48px;
          height: 48px;
        }

        .mentor-card-main {
          min-width: 0;
        }

        .mentor-card-topline {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .mentor-name {
          color: #0B1A3F;
          font-size: 14px;
          font-weight: 700;
        }

        .mentor-role {
          margin-top: 2px;
          color: #66758E;
          font-size: 10px;
          font-weight: 800;
        }

        .mentor-department,
        .mentor-bio,
        .mentor-meta-row {
          color: #A0A7B3;
          font-size: 10px;
          font-weight: 700;
        }

        .mentor-department {
          margin-top: 5px;
        }

        .mentor-bio {
          margin: 7px 0 0;
          line-height: 1.45;
        }

        .mentor-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }

        .mentor-chip {
          min-height: 23px;
          padding: 0 8px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          background: #EEF3FA;
          color: #0B1A3F;
          font-size: 9px;
          font-weight: 800;
        }

        .mentor-chip.course {
          background: #F4F6F9;
          color: #66758E;
        }

        .mentor-meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 7px 14px;
          margin-top: 8px;
        }

        .mentor-message-btn {
          min-height: 34px;
          padding: 0 11px;
          border: none;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #0B1A3F;
          color: #FFFFFF;
          font: inherit;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        /* CHAT SCREEN */
        .wa-chat-screen {
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
          background: #FFFFFF;
          border: 1px solid #E5EAF2;
          border-radius: 18px;
        }

        .wa-chat-header {
          min-height: 76px;
          flex: 0 0 auto;
          width: 100%;
          box-sizing: border-box;
          padding: 12px 24px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 13px;
          border-bottom: 1px solid #E5EAF2;
          background: #FFFFFF;
        }

        .wa-back-btn {
          width: 38px;
          height: 38px;
          border: 1px solid #E1E7EF;
          border-radius: 11px;
          background: #F8FAFD;
          color: #0B1A3F;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }

        .wa-chat-header-copy {
          min-width: 0;
          flex: 1;
        }

        .wa-chat-header-copy h3 {
          margin: 0;
          color: #0B1A3F;
          font-size: 15px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .wa-chat-header-copy p {
          margin: 3px 0 0;
          color: #A0A7B3;
          font-size: 10px;
          font-weight: 700;
        }

        .wa-chat-history {
          width: 100%;
          flex: 1 1 0;
          min-height: 0;
          height: 0;
          box-sizing: border-box;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 28px 34px 34px;
          background: #FBFCFE;
          overscroll-behavior: contain;
          scrollbar-width: thin;
          scrollbar-color: #D6DDE8 transparent;
        }

        .wa-chat-history::-webkit-scrollbar {
          width: 6px;
        }

        .wa-chat-history::-webkit-scrollbar-track {
          background: transparent;
        }

        .wa-chat-history::-webkit-scrollbar-thumb {
          background: #D6DDE8;
          border-radius: 999px;
        }

        .wa-day-divider {
          width: fit-content;
          margin: 0 auto 18px;
          padding: 5px 9px;
          border-radius: 999px;
          background: #F7F8FA;
          color: #A0A7B3;
          font-size: 9px;
          font-weight: 800;
        }

        .wa-message-row {
          display: flex;
          justify-content: flex-start;
          align-items: flex-end;
          gap: 9px;
          margin-bottom: 16px;
          overflow: visible;
          position: relative;
        }

        .wa-message-meta {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 5px;
          margin-top: 5px;
          font-size: 9px;
          line-height: 1;
          font-weight: 700;
          color: #98A2B3;
          white-space: nowrap;
        }

        .wa-message-meta.seen {
          color: #526987;
        }

        .wa-message-meta .wa-seen-check {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .wa-message-avatar {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          border-radius: 50%;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0B1A3F;
          font-size: 10px;
          font-weight: 900;
          border: 1px solid rgba(11,26,63,.06);
          cursor: pointer;
          transition: transform .15s ease, box-shadow .15s ease;
        }

        .wa-message-avatar:hover {
          transform: translateY(-1px);
          box-shadow: 0 5px 12px rgba(11,26,63,.12);
        }

        .wa-message-avatar.mine {
          order: 3;
        }

        .wa-message-row.mine {
          justify-content: flex-end;
        }

        .wa-message-bubble {
          max-width: min(72%, 760px);
          padding: 11px 14px;
          border-radius: 16px;
          background: #F7F8FA;
          color: #0B1A3F;
          font-size: 13px;
          font-weight: 650;
          line-height: 1.5;
        }

        .wa-message-row.mine .wa-message-bubble {
          background: #0B1A3F;
          color: #FFFFFF;
          border-bottom-right-radius: 5px;
        }

        .wa-message-row:not(.mine) .wa-message-bubble {
          border-bottom-left-radius: 5px;
        }

        .wa-message-sender {
          margin-bottom: 5px;
          color: #66758E;
          font-size: 9px;
          font-weight: 800;
          line-height: 1.2;
        }

        .wa-message-row.mine .wa-message-sender {
          color: rgba(255,255,255,.72);
          text-align: right;
        }

        .wa-message-time {
          margin-top: 4px;
          font-size: 8px;
          opacity: .62;
          text-align: right;
        }

        .wa-chat-empty {
          min-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #737B88;
          text-align: center;
          font-size: 11px;
          font-weight: 500;
        }

        .wa-composer {
          flex: 0 0 auto;
          width: 100%;
          box-sizing: border-box;
          flex-shrink: 0;
          padding: 14px 24px 16px;
          border-top: 1px solid #E5EAF2;
          background: #FFFFFF;
          display: flex;
          align-items: flex-end;
          gap: 10px;
        }

        .wa-composer textarea {
          flex: 1;
          min-height: 50px;
          max-height: 150px;
          resize: none;
          box-sizing: border-box;
          padding: 14px 16px;
          border: 1px solid #E1E7EF;
          border-radius: 15px;
          outline: none;
          background: #F8FAFD;
          color: #0B1A3F;
          font: inherit;
          font-size: 13px;
          font-weight: 650;
        }

        .wa-send-btn {
          width: 46px;
          height: 46px;
          flex-shrink: 0;
          border: none;
          border-radius: 13px;
          background: #0B1A3F;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 7px 16px rgba(11,26,63,.14);
        }

        .wa-send-btn:disabled {
          opacity: .42;
          cursor: default;
        }

        /* MODAL */
        .central-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(11,26,63,.35);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .central-modal {
          position: relative;
          width: min(520px, 100%);
          max-height: 86vh;
          overflow-y: auto;
          padding: 24px;
          border-radius: 18px;
          background: #FFFFFF;
          border: 1px solid #E5EAF2;
          box-shadow: 0 24px 60px rgba(11,26,63,.18);
        }

        .central-modal-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 20px;
        }

        .central-modal-head h2 {
          margin: 0;
          color: #0B1A3F;
          font-size: 20px;
          font-weight: 800;
        }

        .central-modal-head p {
          margin: 5px 0 0;
          color: #A0A7B3;
          font-size: 11px;
          font-weight: 700;
        }

        .central-modal-close {
          width: 34px;
          height: 34px;
          border: 1px solid #E1E7EF;
          border-radius: 10px;
          background: #F8FAFD;
          color: #0B1A3F;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .central-modal-label {
          display: block;
          margin-bottom: 6px;
          color: #0B1A3F;
          font-size: 11px;
          font-weight: 700;
        }

        .central-modal-input {
          width: 100%;
          min-height: 45px;
          box-sizing: border-box;
          padding: 0 13px;
          border: 1px solid #E1E7EF;
          border-radius: 12px;
          outline: none;
          background: #F9FBFD;
          color: #0B1A3F;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
        }

        .central-search-results {
          margin-top: 8px;
          border: 1px solid #E1E7EF;
          border-radius: 12px;
          overflow: hidden;
        }

        .central-search-person {
          width: 100%;
          padding: 9px 10px;
          border: none;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          gap: 9px;
          text-align: left;
          color: #0B1A3F;
          cursor: pointer;
          font: inherit;
        }

        .central-search-person:hover {
          background: #F7F9FC;
        }

        .central-selected-members {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
        }

        .central-member-chip {
          min-height: 28px;
          padding: 0 9px;
          border: none;
          border-radius: 999px;
          background: #F7F8FA;
          color: #0B1A3F;
          font: inherit;
          font-size: 9px;
          font-weight: 800;
          cursor: pointer;
        }

        .central-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          margin-top: 20px;
        }

        .central-modal-secondary,
        .central-modal-primary {
          min-height: 38px;
          padding: 0 13px;
          border-radius: 11px;
          font: inherit;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .central-modal-secondary {
          border: 1px solid #E1E7EF;
          background: #FFFFFF;
          color: #0B1A3F;
        }

        .central-modal-primary {
          border: 1px solid #0B1A3F;
          background: #0B1A3F;
          color: #FFFFFF;
        }

        .central-list-empty {
          padding: 14px;
          text-align: center;
          color: #A0A7B3;
          font-size: 11px;
          font-weight: 700;
        }

        :root[data-theme='dark'] .wa-inbox-shell,
        :root[data-theme='dark'] .wa-inbox-main,
        :root[data-theme='dark'] .wa-chat-row,
        :root[data-theme='dark'] .wa-search,
        :root[data-theme='dark'] .wa-chat-screen,
        :root[data-theme='dark'] .wa-chat-header,
        :root[data-theme='dark'] .wa-composer,
        :root[data-theme='dark'] .central-modal {
          background: var(--surface-container-lowest);
        }

        @media (max-width: 1100px) {
          .wa-top-stats {
            grid-template-columns: repeat(3, minmax(0,1fr));
          }
        }

        @media (max-width: 720px) {
          .wa-top-stats {
            grid-template-columns: repeat(2, minmax(0,1fr));
          }

          .wa-chat-history {
            padding: 22px 14px 26px;
          }

          .wa-chat-header,
          .wa-composer {
            padding-left: 14px;
            padding-right: 14px;
          }
        }

        @media (max-width: 860px) {
          .wa-list-screen {
            padding: 16px 14px 28px;
          }

          .wa-inbox-shell {
            grid-template-columns: 1fr;
            gap: 14px;
            padding: 0 14px 14px;
          }

          .wa-folder-panel {
            border: 1px solid #E5EAF2;
          }

          .wa-folder-list {
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: 24px;
          }

          .wa-folder-btn {
            width: auto;
            white-space: nowrap;
            flex-shrink: 0;
          }

          .wa-folder-note {
            display: none;
          }
        }

        @media (max-width: 620px) {
          .wa-page-topline {
            padding-bottom: 10px;
          }

          .wa-page-title-wrap p {
            display: none;
          }

          .wa-page-title-wrap h2 {
            font-size: 20px;
          }

          .wa-list-hero {
            align-items: flex-start;
            padding: 20px;
          }

          .wa-list-hero-left {
            align-items: flex-start;
          }

          .wa-list-hero p {
            max-width: 360px;
          }

          .wa-create-btn span {
            display: none;
          }

          .wa-inbox-main {
            padding: 18px 14px 22px;
          }

          .wa-chat-row {
            grid-template-columns: 44px minmax(0,1fr) auto;
            gap: 10px;
          }

          .wa-avatar {
            width: 44px;
            height: 44px;
          }

          .wa-message-bubble {
            max-width: 84%;
          }
        }

        .wa-chat-tool-btn {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          border: 1px solid #E3E8EF;
          border-radius: 12px;
          background: #FFFFFF;
          color: #0B1A3F;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background .18s ease, border-color .18s ease, transform .18s ease;
        }

        .wa-chat-tool-btn:hover,
        .wa-chat-tool-btn.active {
          background: #F4F7FB;
          border-color: #CBD5E3;
        }

        .wa-chat-tool-btn.danger {
          background: #FEECEC;
          border-color: #F9C7C7;
        }

        .wa-shared-panel {
          flex: 0 0 auto;
          max-height: min(48vh, 430px);
          overflow-y: auto;
          padding: 16px 18px 18px;
          background: #FFFFFF;
          border-bottom: 1px solid #E5EAF2;
          box-shadow: 0 10px 25px rgba(11, 26, 63, .055);
          -webkit-overflow-scrolling: touch;
        }

        .wa-shared-panel-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 16px;
        }

        .wa-shared-panel-head > div {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .wa-shared-panel-head strong {
          color: #0B1A3F;
          font-size: 15px;
          font-weight: 900;
        }

        .wa-shared-panel-head span {
          color: #8792A2;
          font-size: 10px;
          font-weight: 700;
        }

        .wa-shared-panel-head > button {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          border: 1px solid #E3E8EF;
          border-radius: 10px;
          background: #FFFFFF;
          color: #0B1A3F;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .wa-shared-section + .wa-shared-section {
          margin-top: 18px;
        }

        .wa-shared-label {
          margin-bottom: 8px;
          color: #8A95A6;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .08em;
        }

        .wa-shared-image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 10px;
        }

        .wa-shared-image {
          min-width: 0;
          text-decoration: none;
          color: #0B1A3F;
          border: 1px solid #E2E8F0;
          border-radius: 13px;
          overflow: hidden;
          background: #F8FAFD;
        }

        .wa-shared-image img {
          width: 100%;
          height: 96px;
          object-fit: cover;
          display: block;
        }

        .wa-shared-image span {
          display: block;
          padding: 7px 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 9px;
          font-weight: 800;
        }

        .wa-shared-file-list {
          display: grid;
          gap: 8px;
        }

        .wa-shared-file {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          text-decoration: none;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          background: #FAFBFD;
        }

        .wa-shared-file-icon {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          border-radius: 10px;
          background: #FFFFFF;
          color: #0B1A3F;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #E6EAF0;
        }

        .wa-shared-file-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .wa-shared-file-copy strong {
          color: #0B1A3F;
          font-size: 10px;
          font-weight: 900;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .wa-shared-file-copy small {
          color: #8A95A6;
          font-size: 8px;
          font-weight: 700;
        }

        .wa-shared-empty {
          min-height: 120px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 5px;
          color: #8A95A6;
        }

        .wa-shared-empty strong {
          color: #0B1A3F;
          font-size: 12px;
          font-weight: 900;
        }

        .wa-shared-empty span {
          max-width: 320px;
          font-size: 9px;
          font-weight: 700;
          line-height: 1.45;
        }

        @media (max-width: 700px) {
          .wa-chat-header {
            display: grid !important;
            grid-template-columns: 44px minmax(0, 1fr) !important;
            gap: 10px !important;
            align-items: center !important;
            padding: 12px !important;
          }

          .wa-chat-header > .wa-avatar {
            display: none !important;
          }

          .wa-chat-header-copy {
            min-width: 0 !important;
          }

          .wa-chat-toolbar {
            grid-column: 1 / -1;
            width: 100%;
            margin-left: 0 !important;
            display: grid !important;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 8px !important;
          }

          .wa-chat-tool-btn,
          .wa-chat-toolbar > div {
            width: 100% !important;
            min-width: 0 !important;
          }

          .wa-chat-toolbar > div > .wa-chat-tool-btn {
            width: 100% !important;
          }

          .wa-chat-tool-btn {
            height: 46px !important;
            flex-basis: auto !important;
          }

          .wa-shared-panel {
            max-height: 42vh;
            padding: 14px;
          }

          .wa-shared-image-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
          }

          .wa-shared-image img {
            height: 82px;
          }
        }

        @media (max-width: 420px) {
          .wa-chat-toolbar {
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 6px !important;
          }

          .wa-chat-tool-btn {
            height: 44px !important;
            border-radius: 11px !important;
          }

          .wa-shared-image-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      
        /* =========================================================
           FINAL — EXACT SAME MESSAGE GEOMETRY AS STUDYGROUPS
        ========================================================= */

        .wa-message-row {
          width: 100% !important;
          display: flex !important;
          justify-content: flex-start !important;
          align-items: flex-end !important;
          gap: 9px !important;
          margin-bottom: 16px !important;
          overflow: visible !important;
          position: relative !important;
        }

        .wa-message-row.mine {
          justify-content: flex-end !important;
        }

        .wa-message-content {
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          max-width: min(72%, 760px) !important;
          min-width: 0 !important;
          position: relative !important;
        }

        .wa-message-row.mine .wa-message-content {
          align-items: flex-end !important;
        }

        .wa-message-avatar {
          width: 34px !important;
          height: 34px !important;
          flex: 0 0 34px !important;
          padding: 0 !important;
          border-radius: 50% !important;
          border: 1px solid rgba(11,26,63,.08) !important;
          background: #DCE4F5 !important;
          color: #0B1A3F !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: hidden !important;
          cursor: pointer !important;
          order: 0 !important;
        }

        .wa-message-avatar.mine {
          order: 3 !important;
        }

        .wa-message-avatar img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block !important;
          border-radius: inherit !important;
        }

        .wa-message-bubble {
          max-width: 100% !important;
          padding: 11px 14px !important;
          border-radius: 16px !important;
          background: #F7F8FA !important;
          color: #0B1A3F !important;
          font-size: 13px !important;
          font-weight: 650 !important;
          line-height: 1.5 !important;
          box-shadow: none !important;
          border: none !important;
        }

        .wa-message-row.mine .wa-message-bubble {
          background: #0B1A3F !important;
          color: #FFFFFF !important;
          border-bottom-right-radius: 5px !important;
        }

        .wa-message-row:not(.mine) .wa-message-bubble {
          border-bottom-left-radius: 5px !important;
        }

        .wa-message-sender {
          display: block !important;
          margin: 0 0 5px !important;
          color: #66758E !important;
          font-size: 9px !important;
          font-weight: 800 !important;
          line-height: 1.2 !important;
          text-align: left !important;
          white-space: nowrap !important;
        }

        .wa-message-row.mine .wa-message-sender {
          color: rgba(255,255,255,.72) !important;
          text-align: right !important;
        }

        .wa-message-text {
          font-size: 13px !important;
          line-height: 1.5 !important;
          font-weight: 650 !important;
          white-space: pre-wrap !important;
          overflow-wrap: anywhere !important;
        }

        .wa-message-meta,
        .wa-message-time {
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          gap: 5px !important;
          margin-top: 5px !important;
          padding-right: 2px !important;
          color: #98A2B3 !important;
          font-size: 9px !important;
          line-height: 1 !important;
          font-weight: 700 !important;
          white-space: nowrap !important;
        }

        .wa-message-meta.seen {
          color: #526987 !important;
        }

        @media (max-width: 700px) {
          .wa-messages-page.chat-open {
            height: 100dvh !important;
            max-height: 100dvh !important;
          }

          .wa-chat-screen {
            height: 100dvh !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
          }

          .wa-chat-header {
            flex: 0 0 auto !important;
            padding-top: max(12px, env(safe-area-inset-top)) !important;
          }

          .wa-chat-history {
            flex: 1 1 auto !important;
            min-height: 0 !important;
            padding: 14px 12px 18px !important;
          }

          .wa-message-avatar,
          .wa-message-avatar img {
            aspect-ratio: 1 / 1 !important;
          }

          .wa-message-avatar {
            min-width: 30px !important;
            min-height: 30px !important;
            max-width: 30px !important;
            max-height: 30px !important;
          }

          .wa-chat-toolbar {
            overflow-x: auto !important;
            display: flex !important;
            grid-template-columns: none !important;
            scrollbar-width: none !important;
          }

          .wa-chat-toolbar::-webkit-scrollbar { display: none !important; }

          .wa-chat-tool-btn,
          .wa-chat-toolbar > div {
            flex: 0 0 44px !important;
            width: 44px !important;
            min-width: 44px !important;
          }
        }





        /* =========================================================
           PHONE CHAT — SAME INTERACTION AS STUDY GROUPS
           Normal phone chat fills the phone content area while the
           floating Campora robot can remain above it. Pressing the
           enlarge icon portals the chat above the app/robot.
        ========================================================= */
        @media (max-width: 700px) {
          .wa-messages-page.chat-open {
            height: 100dvh !important;
            min-height: 100dvh !important;
            max-height: 100dvh !important;
            overflow: hidden !important;
          }

          .wa-chat-screen.is-phone-chat {
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            max-width: 100vw !important;
            height: 100dvh !important;
            min-height: 100dvh !important;
            max-height: 100dvh !important;
            margin: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            background: #FFFFFF !important;
            overflow: hidden !important;
            /* below the floating Campora bot in normal phone mode */
            z-index: 900 !important;
          }

          .wa-chat-screen.is-phone-chat.is-fullscreen {
            z-index: 9990 !important;
          }

          .wa-chat-header {
            display: grid !important;
            grid-template-columns: 48px minmax(0, 1fr) !important;
            align-items: center !important;
            column-gap: 12px !important;
            row-gap: 10px !important;
            padding: max(10px, env(safe-area-inset-top)) 12px 10px !important;
            flex: 0 0 auto !important;
            overflow: visible !important;
          }

          .wa-chat-header > .wa-avatar {
            display: none !important;
          }

          .wa-back-btn {
            grid-column: 1 !important;
            grid-row: 1 !important;
          }

          .wa-chat-header-copy {
            grid-column: 2 !important;
            grid-row: 1 !important;
            min-width: 0 !important;
          }

          .wa-chat-header-copy h3,
          .wa-chat-header-copy p {
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
          }

          .wa-chat-toolbar {
            grid-column: 1 / -1 !important;
            grid-row: 2 !important;
            width: 100% !important;
            display: flex !important;
            flex-wrap: nowrap !important;
            justify-content: flex-start !important;
            align-items: center !important;
            gap: 7px !important;
            margin: 0 !important;
            padding: 0 0 2px !important;
            overflow-x: auto !important;
            overflow-y: visible !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none !important;
          }

          .wa-chat-toolbar::-webkit-scrollbar {
            display: none !important;
          }

          .wa-chat-tool-btn,
          .wa-chat-toolbar > div {
            flex: 0 0 44px !important;
            width: 44px !important;
            min-width: 44px !important;
            max-width: 44px !important;
          }

          .wa-chat-toolbar > div > .wa-chat-tool-btn {
            width: 44px !important;
            min-width: 44px !important;
            max-width: 44px !important;
          }

          .wa-chat-tool-btn {
            height: 44px !important;
            border-radius: 12px !important;
          }

          .wa-chat-history {
            flex: 1 1 auto !important;
            min-height: 0 !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }

          .wa-composer {
            flex: 0 0 auto !important;
            padding-bottom: max(10px, env(safe-area-inset-bottom)) !important;
          }
        }

        /* iPad/tablet deliberately keeps the existing Messages layout. */
        @media (min-width: 701px) and (max-width: 1024px) {
          .wa-chat-screen {
            position: relative;
          }
        }

        /* Desktop/laptop true fullscreen, without using a portal. */
        @media (min-width: 1025px) {
          .wa-chat-screen.is-fullscreen {
            position: fixed !important;
            inset: 0 !important;
            top: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            min-width: 100vw !important;
            min-height: 100vh !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            margin: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            background: #FFFFFF !important;
            z-index: 2147483000 !important;
            box-shadow: none !important;
          }
        }

        @media (max-width: 700px) {
          .wa-message-row {
            gap: 7px !important;
            margin-bottom: 13px !important;
          }

          .wa-message-avatar {
            width: 30px !important;
            height: 30px !important;
            flex-basis: 30px !important;
          }

          .wa-message-content {
            max-width: min(78%, 520px) !important;
          }

          .wa-message-bubble {
            padding: 10px 12px !important;
            font-size: 12px !important;
          }

          .wa-message-text {
            font-size: 12px !important;
          }
        }

        /* FINAL PHONE OVERRIDE — matches StudyGroups interaction */
        body.campora-phone-messages .wa-chat-screen.is-phone-chat {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100dvh !important;
          min-width: 100vw !important;
          min-height: 100dvh !important;
          max-width: 100vw !important;
          max-height: 100dvh !important;
          margin: 0 !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: #fff !important;
          overflow: hidden !important;
          z-index: 900 !important;
        }

        body.campora-phone-messages .wa-chat-screen.is-phone-chat.is-fullscreen {
          z-index: 9990 !important;
        }

        body.campora-phone-messages .wa-chat-header {
          display: grid !important;
          grid-template-columns: 48px minmax(0, 1fr) !important;
          column-gap: 12px !important;
          row-gap: 10px !important;
          align-items: center !important;
          padding: max(10px, env(safe-area-inset-top)) 12px 10px !important;
          overflow: visible !important;
        }

        body.campora-phone-messages .wa-chat-header > .wa-avatar {
          display: none !important;
        }

        body.campora-phone-messages .wa-back-btn {
          grid-column: 1 !important;
          grid-row: 1 !important;
        }

        body.campora-phone-messages .wa-chat-header-copy {
          grid-column: 2 !important;
          grid-row: 1 !important;
          min-width: 0 !important;
        }

        body.campora-phone-messages .wa-chat-toolbar {
          grid-column: 1 / -1 !important;
          grid-row: 2 !important;
          width: 100% !important;
          display: flex !important;
          flex-wrap: wrap !important;
          align-items: center !important;
          justify-content: flex-start !important;
          gap: 7px !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
        }

        body.campora-phone-messages .wa-chat-tool-btn,
        body.campora-phone-messages .wa-chat-toolbar > div {
          flex: 0 0 44px !important;
          width: 44px !important;
          min-width: 44px !important;
          max-width: 44px !important;
          height: 44px !important;
        }

        body.campora-phone-messages .wa-fullscreen-tool {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          order: 2 !important;
        }

        body.campora-phone-messages .wa-chat-history {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          overflow-y: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }

        body.campora-phone-messages .wa-composer {
          flex: 0 0 auto !important;
          padding-bottom: max(10px, env(safe-area-inset-bottom)) !important;
        }


        /* =========================================================
           FINAL MINIMAL PHONE FIX
           - normal chat stays below the Campora navbar
           - fullscreen button remains second after Pin
           - enlarged chat still portals above navbar + bot
        ========================================================= */
        body.campora-phone-messages .wa-messages-page.chat-open {
          height: 100% !important;
          min-height: 0 !important;
          max-height: none !important;
          overflow: hidden !important;
        }

        body.campora-phone-messages .wa-chat-screen.is-phone-chat:not(.is-fullscreen) {
          position: relative !important;
          inset: auto !important;
          top: auto !important;
          right: auto !important;
          bottom: auto !important;
          left: auto !important;
          width: 100% !important;
          max-width: 100% !important;
          height: calc(100dvh - 166px) !important;
          min-height: 0 !important;
          max-height: calc(100dvh - 166px) !important;
          margin: 0 !important;
          z-index: auto !important;
          border-radius: 0 !important;
          overflow: hidden !important;
          background: #FFFFFF !important;
        }

        body.campora-phone-messages .wa-chat-screen.is-phone-chat.is-fullscreen {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100dvh !important;
          min-width: 100vw !important;
          min-height: 100dvh !important;
          max-width: 100vw !important;
          max-height: 100dvh !important;
          margin: 0 !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: #FFFFFF !important;
          overflow: hidden !important;
          z-index: 9990 !important;
        }

        body.campora-phone-messages .wa-chat-toolbar {
          display: flex !important;
          flex-wrap: nowrap !important;
          align-items: center !important;
          justify-content: flex-start !important;
          gap: 7px !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          -webkit-overflow-scrolling: touch !important;
          scrollbar-width: none !important;
        }

        body.campora-phone-messages .wa-chat-toolbar::-webkit-scrollbar {
          display: none !important;
        }

        body.campora-phone-messages .wa-chat-toolbar > * {
          order: initial !important;
        }

        body.campora-phone-messages .wa-chat-tool-btn,
        body.campora-phone-messages .wa-chat-toolbar > div {
          flex: 0 0 44px !important;
          width: 44px !important;
          min-width: 44px !important;
          max-width: 44px !important;
        }

        body.campora-phone-messages .wa-fullscreen-tool {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          flex: 0 0 44px !important;
          width: 44px !important;
          min-width: 44px !important;
          max-width: 44px !important;
          pointer-events: auto !important;
        }

        body.campora-phone-messages .wa-chat-history {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          height: 0 !important;
          overflow-y: auto !important;
        }

        body.campora-phone-messages .wa-composer {
          flex: 0 0 auto !important;
          padding-bottom: max(10px, env(safe-area-inset-bottom)) !important;
        }



        body.campora-phone-messages .wa-messages-page.chat-open {
          height: calc(100dvh - 156px) !important;
          min-height: calc(100dvh - 156px) !important;
          max-height: calc(100dvh - 156px) !important;
          overflow: hidden !important;
        }

        body.campora-phone-messages .wa-chat-screen.is-phone-chat:not(.is-fullscreen) {
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
          min-height: 100% !important;
          max-height: 100% !important;
          margin: 0 !important;
          inset: auto !important;
          z-index: auto !important;
          border-radius: 0 !important;
          overflow: hidden !important;
        }

        body.campora-phone-messages .wa-chat-toolbar {
          display: flex !important;
          flex-wrap: nowrap !important;
          align-items: center !important;
          justify-content: flex-start !important;
          gap: 7px !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          -webkit-overflow-scrolling: touch !important;
          scrollbar-width: none !important;
        }

        body.campora-phone-messages .wa-chat-toolbar::-webkit-scrollbar {
          display: none !important;
        }

        body.campora-phone-messages .wa-chat-tool-btn,
        body.campora-phone-messages .wa-chat-toolbar > div {
          flex: 0 0 44px !important;
          width: 44px !important;
          min-width: 44px !important;
          max-width: 44px !important;
          height: 44px !important;
        }

        body.campora-phone-messages .wa-fullscreen-tool {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          visibility: visible !important;
          opacity: 1 !important;
          flex: 0 0 44px !important;
          width: 44px !important;
          min-width: 44px !important;
          max-width: 44px !important;
          height: 44px !important;
          pointer-events: auto !important;
        }

        @media (max-width: 430px) {
          body.campora-phone-messages .wa-chat-header-copy h3 {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: clip !important;
            line-height: 1.15 !important;
            max-width: 100% !important;
            word-break: break-word !important;
          }

          body.campora-phone-messages .wa-chat-header-copy p {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: clip !important;
            line-height: 1.2 !important;
          }
        }

        body.campora-phone-messages .wa-chat-screen.is-phone-chat.is-fullscreen {
          position: fixed !important;
          inset: 0 !important;
          top: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100dvh !important;
          min-width: 100vw !important;
          min-height: 100dvh !important;
          max-width: 100vw !important;
          max-height: 100dvh !important;
          margin: 0 !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: #FFFFFF !important;
          overflow: hidden !important;
          z-index: 9990 !important;
        }

`}</style>

      {!selected ? (
        <section className="wa-list-screen">
          <div className="wa-top-overview">
            <div className="wa-top-overview-main">
              <div className="wa-top-overview-icon">
                <MessageSquare size={22} strokeWidth={2.1} />
              </div>

              <div className="wa-top-overview-copy">
                <div className="wa-top-title-line">
                  <h2>Messages</h2>
                  <span className="wa-top-divider">•</span>
                  <h3>
                    {FOLDERS.find((item) => item.key === folder)?.label ||
                      'All Conversations'}
                  </h3>
                </div>

                <p>
                  {folder === 'groups'
                    ? 'Your private message groups.'
                    : folder === 'study-groups'
                    ? 'Messages from the Study Groups you joined or created.'
                    : folder === 'mentors'
                    ? 'Connect with available mentors.'
                    : folder === 'archive'
                    ? 'Conversations you archived. Open one to restore or manage it.'
                    : folder === 'drafts'
                    ? 'Messages you started but have not sent yet.'
                    : folder === 'inbox'
                    ? 'Messages other Campora users sent to you.'
                    : folder === 'sent'
                    ? 'Messages you have sent.'
                    : 'Direct messages, groups, drafts, mentors, and more — all in one place.'}
                </p>
              </div>
            </div>
          </div>

          <div className="wa-top-stats">
            <div className="wa-top-stat-card">
              <div className="wa-top-stat-icon">
                <MessageSquare size={17} />
              </div>

              <div>
                <strong>{conversations.length}</strong>
                <span>Direct Messages</span>
              </div>
            </div>

            <div className="wa-top-stat-card">
              <div className="wa-top-stat-icon">
                <Inbox size={17} />
              </div>

              <div>
                <strong>{inboxRows.length}</strong>
                <span>Inbox</span>
              </div>
            </div>

            <div className="wa-top-stat-card">
              <div className="wa-top-stat-icon">
                <Users size={17} />
              </div>

              <div>
                <strong>
                  {customGroupConversations.length +
                    studyGroupConversations.length}
                </strong>
                <span>Groups</span>
              </div>
            </div>

            <div className="wa-top-stat-card">
              <div className="wa-top-stat-icon">
                <FileText size={17} />
              </div>

              <div>
                <strong>{draftRows.length}</strong>
                <span>Drafts</span>
              </div>
            </div>

            <div className="wa-top-stat-card">
              <div className="wa-top-stat-icon">
                <UserRound size={17} />
              </div>

              <div>
                <strong>{mentors.length}</strong>
                <span>Mentors</span>
              </div>
            </div>
          </div>

          <div className="wa-inbox-shell">
            <aside className="wa-folder-panel">
              <div className="wa-folder-heading">
                <span>Mailbox</span>
              </div>

              <div className="wa-folder-list">
                {FOLDERS.map((item) => {
                  const Icon = item.icon;
                  const active = folder === item.key;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`wa-folder-btn ${active ? 'active' : ''}`}
                      onClick={() => setFolder(item.key)}
                    >
                      <span className="wa-folder-icon">
                        <Icon size={17} strokeWidth={2} />
                      </span>

                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="wa-sidebar-new-group"
                onClick={() => setShowCreateGroup(true)}
              >
                <Plus size={16} />
                <span>New Group</span>
              </button>

              <div className="wa-folder-note">
                <Mail size={16} />
                <span>
                  All Campora conversations stay connected here.
                </span>
              </div>
            </aside>

            <div className="wa-inbox-main">
              <div className="wa-section-label-row">
                <span className="wa-section-label">
                  {folder === 'all'
                    ? 'Recent conversations'
                    : FOLDERS.find((item) => item.key === folder)?.label ||
                      'Conversations'}
                </span>
              </div>

              <div className="wa-search-wrap">
                <div className="wa-search">
                  <Search size={18} />
                  <input
                    value={peopleSearch}
                    onChange={(event) =>
                      setPeopleSearch(event.target.value)
                    }
                    placeholder="Search people or start a new conversation..."
                  />

                  {peopleSearch && (
                    <button
                      type="button"
                      className="wa-search-clear"
                      onClick={() => setPeopleSearch('')}
                      aria-label="Clear search"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {(peopleSearching || peopleResults.length > 0) && (
                  <div className="wa-search-results">
                    {peopleSearching ? (
                      <div className="central-list-empty">
                        Searching...
                      </div>
                    ) : (
                      peopleResults.slice(0, 8).map((profile) => (
                        <button
                          key={profile.id}
                          type="button"
                          className="wa-search-person"
                          onClick={() => openDm(profile.id, profile)}
                        >
                          <span
                            className="wa-avatar"
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '13px',
                              background: avatarColor(
                                profile.name || profile.email || ''
                              ),
                            }}
                          >
                            {profile.avatar_url || profile.avatarUrl ? (
                              <img
                                src={profile.avatar_url || profile.avatarUrl}
                                alt={
                                  profile.name ||
                                  profile.full_name ||
                                  'Student'
                                }
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  borderRadius: 'inherit',
                                  display: 'block'
                                }}
                              />
                            ) : (
                              getInitials(
                                profile.name ||
                                  profile.email ||
                                  'Student'
                              )
                            )}
                          </span>

                          <span style={{ minWidth: 0 }}>
                            <strong>
                              {profile.name ||
                                profile.full_name ||
                                profile.email ||
                                'Student'}
                            </strong>

                            {profile.email && (
                              <div className="wa-search-person-email">
                                {profile.email}
                              </div>
                            )}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div
                className="wa-source-filter-card"
                style={{
                  margin: '0 0 10px',
                  padding: '18px',
                  border: '1px solid #E6EBF2',
                  borderRadius: '18px',
                  background: '#FFFFFF'
                }}
              >
                <div
                  style={{
                    marginBottom: '12px',
                    color: '#0B1A3F',
                    fontSize: '13px',
                    fontWeight: '900',
                    letterSpacing: '0.04em'
                  }}
                >
                  MESSAGE SOURCES
                </div>

                <div
                  className="wa-source-filter-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                    gap: '10px'
                  }}
                >
                  {[
                    ['all', 'All'],
                    ['Direct Message', 'Direct'],
                    ['Registration', 'Registration'],
                    ['Study Groups', 'Study Groups'],
                    ['Campus Pulse', 'Campus Pulse']
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      className="wa-source-filter-btn"
                      onClick={() => setSourceFilter(key)}
                      style={{
                        border:
                          sourceFilter === key
                            ? '1px solid #0B1A3F'
                            : '1px solid #E3E8EF',
                        background:
                          sourceFilter === key
                            ? '#0B1A3F'
                            : '#FFFFFF',
                        color:
                          sourceFilter === key
                            ? '#FFFFFF'
                            : '#0B1A3F',
                        borderRadius: '14px',
                        minHeight: '48px',
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '11px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="wa-chat-list">
                {rows.length ? (
                  rows.map((row, index) =>
                    React.cloneElement(row, {
                      key: row.key || index,
                      __waStyle: true,
                    })
                  )
                ) : (
                  <div className="wa-empty-list">
                    <div className="wa-empty-list-icon">
                      {folder === 'groups' || folder === 'study-groups' ? (
                        <Users size={28} />
                      ) : folder === 'drafts' ? (
                        <FileText size={28} />
                      ) : folder === 'mentors' ? (
                        <UserRound size={28} />
                      ) : (
                        <MessageSquare size={28} />
                      )}
                    </div>

                    <strong>
                      {folder === 'groups'
                        ? 'No private groups yet'
                        : folder === 'study-groups'
                        ? 'No Study Group messages yet'
                        : folder === 'drafts'
                        ? 'No drafts yet'
                        : folder === 'mentors'
                        ? 'No mentors available yet'
                        : 'No conversations yet'}
                    </strong>

                    <span>
                      {folder === 'archive'
                        ? 'Archived conversations will appear here.'
                        : folder === 'groups'
                        ? 'Create a private message group with other Campora users.'
                        : folder === 'study-groups'
                        ? 'Join or create a Study Group to see its messages here.'
                        : folder === 'drafts'
                        ? 'Drafts will appear here automatically.'
                        : folder === 'mentors'
                        ? 'Approved mentors will appear here when available.'
                        : 'Search for someone above to start chatting.'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
        {(() => {
          const chatScreen = (
        <section
          ref={chatScreenRef}
          className={`wa-chat-screen ${messagesFullscreen ? 'is-fullscreen' : ''} ${isPhoneViewport ? 'is-phone-chat' : ''}`}

          style={
            messagesFullscreen
              ? {
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100vw',
                  height: '100dvh',
                  minWidth: '100vw',
                  minHeight: '100dvh',
                  maxWidth: '100vw',
                  maxHeight: '100dvh',
                  margin: 0,
                  borderRadius: 0,
                  zIndex: isPhoneViewport ? 9990 : 2147483000,
                  border: 'none',
                  background: '#FFFFFF',
                  boxShadow: isPhoneViewport
                    ? '0 0 60px rgba(0,45,98,0.35)'
                    : 'none'
                }
              : undefined
          }
        >
          <header className="wa-chat-header">
            <button
              type="button"
              className="wa-back-btn"
              onClick={() => {
                setMessagesFullscreen(false);
                setSelected(null);
              }}
              aria-label="Back to chats"
            >
              <ArrowLeft size={20} />
            </button>

            <span
              className="wa-avatar"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '15px',
                background:
                  selected.type === 'custom-group'
                    ? '#DDD4F3'
                    : selected.type === 'group'
                    ? '#D4E8E2'
                    : avatarColor(selected.name),
                overflow: 'hidden'
              }}
            >
              {selected.type === 'dm' ? (
                (
                  profiles[selected.partnerId]?.avatar_url ||
                  profiles[selected.partnerId]?.avatarUrl
                ) ? (
                  <img
                    src={
                      profiles[selected.partnerId]?.avatar_url ||
                      profiles[selected.partnerId]?.avatarUrl
                    }
                    alt={selected.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                ) : (
                  getInitials(selected.name)
                )
              ) : (
                <Users size={20} />
              )}
            </span>

            <div className="wa-chat-header-copy">
              <h3>{selected.name}</h3>
              <p>
                {selected.type === 'custom-group'
                  ? 'Private message group'
                  : selected.type === 'group'
                  ? 'Study Group chat'
                  : selected.email || 'Direct message'}
              </p>
            </div>

            <div
              className="wa-chat-toolbar"
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0
              }}
            >
              {/* PIN */}
              <button
                type="button"
                className="wa-chat-tool-btn"
                style={{ flexShrink: 0 }}
                title={
                  pinnedMessageChats.includes(
                    selected.type === 'dm'
                      ? `dm:${selected.partnerId}`
                      : selected.type === 'group'
                      ? `study-group:${selected.groupId}`
                      : `custom-group:${selected.groupId}`
                  )
                    ? 'Unpin chat'
                    : 'Pin chat'
                }
                onClick={() =>
                  togglePinnedMessageChat(
                    selected.type === 'dm'
                      ? `dm:${selected.partnerId}`
                      : selected.type === 'group'
                      ? `study-group:${selected.groupId}`
                      : `custom-group:${selected.groupId}`
                  )
                }
              >
                <Pin
                  size={18}
                  fill={
                    pinnedMessageChats.includes(
                      selected.type === 'dm'
                        ? `dm:${selected.partnerId}`
                        : selected.type === 'group'
                        ? `study-group:${selected.groupId}`
                        : `custom-group:${selected.groupId}`
                    )
                      ? '#0B1A3F'
                      : 'none'
                  }
                  color="#0B1A3F"
                />
              </button>

              {/* FULL SCREEN */}
              <button
                type="button"
                className="wa-chat-tool-btn wa-fullscreen-tool"
                title={messagesFullscreen ? 'Exit full screen' : 'Full screen'}
                aria-label={messagesFullscreen ? 'Exit full screen' : 'Full screen'}
                onClick={() => setMessagesFullscreen((value) => !value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  visibility: 'visible',
                  opacity: 1,
                  flexShrink: 0
                }}
              >
                {messagesFullscreen ? (
                  <Minimize2 size={18} color="#0B1A3F" />
                ) : (
                  <Maximize2 size={18} color="#0B1A3F" />
                )}
              </button>

              {(selected.type === 'group' || selected.type === 'custom-group') && (
                <>
                  {/* POLL */}
                  <button
                    type="button"
                    className="wa-chat-tool-btn"
                    title="Create poll"
                    onClick={() => setShowPollModal(true)}
                    style={{ flexShrink: 0 }}
                  >
                    <BarChart2 size={18} color="#0B1A3F" />
                  </button>

                  {/* MEMBERS */}
                  <button
                    type="button"
                    className="wa-chat-tool-btn"
                    title="View members"
                    onClick={openMembersPanel}
                    style={{ flexShrink: 0 }}
                  >
                    <Users size={18} color="#0B1A3F" />
                  </button>
                </>
              )}

              {/* SHARED MEDIA + FILES */}
              <button
                type="button"
                className={`wa-chat-tool-btn ${showSharedMedia ? 'active' : ''}`}
                title="Shared media & files"
                onClick={() => setShowSharedMedia((value) => !value)}
              >
                <ImageIcon size={18} color="#0B1A3F" />
              </button>

              {/* NOTIFICATIONS */}
              {(() => {
                const notificationKey =
                  selected.type === 'dm'
                    ? `dm:${selected.partnerId}`
                    : selected.type === 'group'
                    ? `study-group:${selected.groupId}`
                    : selected.type === 'custom-group'
                    ? `group:${selected.groupId}`
                    : `${selected.type}:${selected.partnerId || selected.groupId || selected.name}`;

                const notificationsOn =
                  isMessageNotificationOn(notificationKey);

                return (
                  <button
                    type="button"
                    className="wa-chat-tool-btn"
                    title={notificationsOn ? 'Notifications on' : 'Notifications off'}
                    onClick={() => toggleMessageNotification(notificationKey)}
                  >
                    {notificationsOn ? (
                      <Bell size={18} color="#0B1A3F" />
                    ) : (
                      <BellOff size={18} color="#EF4444" />
                    )}
                  </button>
                );
              })()}

              {/* MORE OPTIONS */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="wa-chat-tool-btn"
                  title="Chat options"
                  onClick={() => setChatActionsOpen((value) => !value)}
                >
                  <MoreHorizontal size={18} color="#0B1A3F" />
                </button>

                {chatActionsOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50px',
                      right: 0,
                      zIndex: 1500,
                      width: '220px',
                      padding: '7px',
                      border: '1px solid #E3E8EF',
                      borderRadius: '13px',
                      background: '#FFFFFF',
                      boxShadow: '0 12px 30px rgba(11,26,63,.14)'
                    }}
                  >
                    <button
                      type="button"
                      onClick={clearSelectedChatForMe}
                      style={{
                        width: '100%',
                        minHeight: '38px',
                        padding: '0 10px',
                        border: 'none',
                        borderRadius: '9px',
                        background: '#FFFFFF',
                        color: '#0B1A3F',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '10px',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      <Eraser size={14} />
                      Clear chat for me
                    </button>

                    {isChatArchived(getSelectedChatKey()) ? (
                      <button
                        type="button"
                        onClick={() => {
                          restoreArchivedChat(getSelectedChatKey());
                          setChatActionsOpen(false);
                          setFolder('all');
                        }}
                        style={{
                          width: '100%',
                          minHeight: '38px',
                          padding: '0 10px',
                          border: 'none',
                          borderRadius: '9px',
                          background: '#FFFFFF',
                          color: '#0B1A3F',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '10px',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        <Archive size={14} />
                        Restore from archive
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={archiveSelectedChat}
                        style={{
                          width: '100%',
                          minHeight: '38px',
                          padding: '0 10px',
                          border: 'none',
                          borderRadius: '9px',
                          background: '#FFFFFF',
                          color: '#0B1A3F',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '10px',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        <Archive size={14} />
                        Archive conversation
                      </button>
                    )}

                    {selected.type === 'custom-group' && (
                      <button
                        type="button"
                        onClick={leaveSelectedGroupForMe}
                        style={{
                          width: '100%',
                          minHeight: '38px',
                          padding: '0 10px',
                          border: 'none',
                          borderRadius: '9px',
                          background: '#FFFFFF',
                          color: '#0B1A3F',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '10px',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        <LogOut size={14} />
                        Leave / Exit group
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* CLEAR / DELETE STYLE BUTTON — matches Study Groups */}
              <button
                type="button"
                className="wa-chat-tool-btn danger"
                title="Clear this chat for me"
                onClick={clearSelectedChatForMe}
              >
                <Trash2 size={18} color="#B91C1C" />
              </button>
            </div>
          </header>

          {showMembersPanel && (
            <div className="wa-shared-panel">
              <div className="wa-shared-panel-head">
                <div>
                  <strong>Members</strong>
                  <span>
                    {chatMembersLoading
                      ? 'Loading members...'
                      : `${chatMemberRows.length} member${chatMemberRows.length === 1 ? '' : 's'}`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMembersPanel(false)}
                  aria-label="Close members"
                >
                  <X size={17} />
                </button>
              </div>

              {chatMembersLoading ? (
                <div className="wa-shared-empty">
                  <Users size={24} />
                  <strong>Loading members...</strong>
                </div>
              ) : chatMemberRows.length ? (
                <div className="wa-shared-file-list">
                  {chatMemberRows.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      className="wa-shared-file"
                      onClick={() =>
                        openMessageProfile({
                          id: member.id,
                          name: member.name
                        })
                      }
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <span
                        className="wa-shared-file-icon"
                        style={{
                          borderRadius: '50%',
                          background: avatarColor(member.name)
                        }}
                      >
                        {getInitials(member.name)}
                      </span>

                      <span className="wa-shared-file-copy">
                        <strong>{member.name}</strong>
                        <small>
                          {member.major ||
                            member.email ||
                            'Campora member'}
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="wa-shared-empty">
                  <Users size={24} />
                  <strong>No members found</strong>
                </div>
              )}
            </div>
          )}

          {showSharedMedia && (
            <div className="wa-shared-panel">
              <div className="wa-shared-panel-head">
                <div>
                  <strong>Shared Media & Files</strong>
                  <span>
                    {sharedAttachments.length
                      ? `${sharedAttachments.length} shared item${sharedAttachments.length === 1 ? '' : 's'}`
                      : 'Images and files from this conversation'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSharedMedia(false)}
                  aria-label="Close shared media"
                >
                  <X size={17} />
                </button>
              </div>

              {sharedAttachments.length ? (
                <>
                  {sharedAttachments.some((item) => item.isImage) && (
                    <div className="wa-shared-section">
                      <div className="wa-shared-label">IMAGES</div>
                      <div className="wa-shared-image-grid">
                        {sharedAttachments
                          .filter((item) => item.isImage)
                          .map((item, index) => (
                            <a
                              key={`${item.messageId || item.url}-image-${index}`}
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="wa-shared-image"
                              title={item.name || 'Shared image'}
                            >
                              <img src={item.url} alt={item.name || 'Shared image'} />
                              <span>{item.name || 'Image'}</span>
                            </a>
                          ))}
                      </div>
                    </div>
                  )}

                  {sharedAttachments.some((item) => !item.isImage) && (
                    <div className="wa-shared-section">
                      <div className="wa-shared-label">FILES</div>
                      <div className="wa-shared-file-list">
                        {sharedAttachments
                          .filter((item) => !item.isImage)
                          .map((item, index) => (
                            <a
                              key={`${item.messageId || item.url}-file-${index}`}
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="wa-shared-file"
                            >
                              <span className="wa-shared-file-icon">
                                <FileText size={18} />
                              </span>
                              <span className="wa-shared-file-copy">
                                <strong>{item.name || 'Shared file'}</strong>
                                <small>
                                  {item.senderName}
                                  {item.createdAt ? ` · ${formatDate(item.createdAt)}` : ''}
                                </small>
                              </span>
                            </a>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="wa-shared-empty">
                  <ImageIcon size={25} />
                  <strong>No shared media yet</strong>
                  <span>Images and files sent in this chat will appear here automatically.</span>
                </div>
              )}
            </div>
          )}

          <div className="wa-chat-history">
            <div className="wa-day-divider">Today</div>

            {selected.type === 'dm' ? (
              selectedDmMessages.length ? (
                selectedDmMessages.map((message) => {
                  const mine = message.sender_id === currentUser.id;
                  const rawMessage =
                    message.content || message.message || '';
                  const parsedAttachment =
                    parseMessageAttachment(rawMessage);
                  const parsed = parseDirectMessage(
                    parsedAttachment.text
                  );
                  const sender = getMessageSenderDisplay(message, mine);
                  const conversationKey = `dm:${selected.partnerId}`;

                  return (
                    <div
                      key={message.id}
                      className={`wa-message-row ${mine ? 'mine' : ''}`}
                    >
                      {!mine && (
                        <button
                          type="button"
                          className="wa-message-avatar"
                          title={`View ${sender.name}'s profile`}
                          onClick={() => openMessageProfile(sender)}
                          style={{
                            background: avatarColor(sender.name),
                            border: '1px solid rgba(11,26,63,.06)'
                          }}
                        >
                          {sender.avatarUrl ? (
                            <img
                              src={sender.avatarUrl}
                              alt={sender.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: 'inherit',
                                display: 'block'
                              }}
                            />
                          ) : (
                            getInitials(sender.name)
                          )}
                        </button>
                      )}

                      <div className="wa-message-content">
                        <div
                          className="wa-message-bubble"
                          style={{
                            position: 'relative',
                            overflow: 'visible'
                          }}
                        >
                          {renderMessageActions({
                            message,
                            mine,
                            parsedText: parsed.text,
                            conversationKey,
                            senderName: sender.name,
                            messageType: 'dm'
                          })}

                          <div className="wa-message-sender">
                            {mine ? `${sender.name} · You` : sender.name}
                          </div>

                          {renderAttachment(
                            message.content || message.message || ''
                          )}

                          <div className="wa-message-text">
                            {parsed.text}
                          </div>
                        </div>

                        <div
                          className={`wa-message-meta ${
                            mine && message.read === true ? 'seen' : ''
                          }`}
                        >
                          <span>{formatMessageTime(message.created_at)}</span>

                          {mine && (
                            <>
                              <span>·</span>
                              <span>
                                {message.read === true ? 'Seen' : 'Sent'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {mine && (
                        <button
                          type="button"
                          className="wa-message-avatar mine"
                          title="View your profile"
                          onClick={() => openMessageProfile(sender)}
                          style={{
                            background: avatarColor(sender.name),
                            border: '1px solid rgba(11,26,63,.06)'
                          }}
                        >
                          {sender.avatarUrl ? (
                            <img
                              src={sender.avatarUrl}
                              alt={sender.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: 'inherit',
                                display: 'block'
                              }}
                            />
                          ) : (
                            getInitials(sender.name)
                          )}
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="wa-chat-empty">
                  <MessageSquare size={28} />
                  <p>No messages yet. Say hello 👋</p>
                </div>
              )
            ) : selected.type === 'custom-group' ? (
              selectedCustomGroupMessages.length ? (
                selectedCustomGroupMessages.map((message) => {
                  const mine = message.sender_id === currentUser.id;
                  const sender = getMessageSenderDisplay(message, mine);
                  const rawMessage = message.content || '';
                  const parsedAttachment =
                    parseMessageAttachment(rawMessage);
                  const parsedText = parsedAttachment.text;
                  const conversationKey = `custom-group:${selected.groupId}`;

                  return (
                    <div
                      key={message.id}
                      className={`wa-message-row ${mine ? 'mine' : ''}`}
                    >
                      {!mine && (
                        <button
                          type="button"
                          className="wa-message-avatar"
                          title={`View ${sender.name}'s profile`}
                          onClick={() => openMessageProfile(sender)}
                          style={{
                            background: avatarColor(sender.name),
                            border: '1px solid rgba(11,26,63,.06)'
                          }}
                        >
                          {sender.avatarUrl ? (
                            <img
                              src={sender.avatarUrl}
                              alt={sender.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: 'inherit',
                                display: 'block'
                              }}
                            />
                          ) : (
                            getInitials(sender.name)
                          )}
                        </button>
                      )}

                      <div className="wa-message-content">
                        <div
                          className="wa-message-bubble"
                          style={{
                            position: 'relative',
                            overflow: 'visible'
                          }}
                        >
                          {renderMessageActions({
                            message,
                            mine,
                            parsedText,
                            conversationKey,
                            senderName: sender.name,
                            messageType: 'custom-group'
                          })}

                          <div className="wa-message-sender">
                            {mine ? `${sender.name} · You` : sender.name}
                          </div>

                          {renderAttachment(message.content || '')}

                          <div className="wa-message-text">
                            {parsedText}
                          </div>
                        </div>

                        <div className="wa-message-meta">
                          <span>{formatMessageTime(message.created_at)}</span>
                          {mine && (
                            <>
                              <span>·</span>
                              <span>Sent</span>
                            </>
                          )}
                        </div>
                      </div>

                      {mine && (
                        <button
                          type="button"
                          className="wa-message-avatar mine"
                          title="View your profile"
                          onClick={() => openMessageProfile(sender)}
                          style={{
                            background: avatarColor(sender.name),
                            border: '1px solid rgba(11,26,63,.06)'
                          }}
                        >
                          {sender.avatarUrl ? (
                            <img
                              src={sender.avatarUrl}
                              alt={sender.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: 'inherit',
                                display: 'block'
                              }}
                            />
                          ) : (
                            getInitials(sender.name)
                          )}
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="wa-chat-empty">
                  <Users size={28} />
                  <p>No messages here yet. Start the group chat.</p>
                </div>
              )
            ) : selectedStudyGroupMessages.length ? (
              selectedStudyGroupMessages.map((message) => {
                const mine = message.user_id === currentUser.id;
                const sender = getMessageSenderDisplay(message, mine);
                const rawMessage = message.content || '';
                const parsedAttachment =
                  parseMessageAttachment(rawMessage);
                const parsedText = parsedAttachment.text;
                const conversationKey = `study-group:${selected.groupId}`;

                return (
                  <div
                    key={message.id}
                    className={`wa-message-row ${mine ? 'mine' : ''}`}
                  >
                    {!mine && (
                      <button
                        type="button"
                        className="wa-message-avatar"
                        title={`View ${sender.name}'s profile`}
                        onClick={() => openMessageProfile(sender)}
                        style={{
                          background: avatarColor(sender.name),
                          border: '1px solid rgba(11,26,63,.06)'
                        }}
                      >
                        {sender.avatarUrl ? (
                          <img
                            src={sender.avatarUrl}
                            alt={sender.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: 'inherit',
                              display: 'block'
                            }}
                          />
                        ) : (
                          getInitials(sender.name)
                        )}
                      </button>
                    )}

                    <div className="wa-message-content">
                      <div
                        className="wa-message-bubble"
                        style={{
                          position: 'relative',
                          overflow: 'visible'
                        }}
                      >
                      {renderMessageActions({
                        message,
                        mine,
                        parsedText,
                        conversationKey,
                        senderName: sender.name,
                        messageType: 'group'
                      })}

                      <div className="wa-message-sender">
                        {mine ? `${sender.name} · You` : sender.name}
                      </div>

                      {message.type === 'poll' && message.poll_data ? (
                        <div
                          style={{
                            width: 'min(330px, 100%)',
                            marginTop: '4px'
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 900,
                              marginBottom: '10px',
                              color: mine ? '#FFFFFF' : '#0B1A3F'
                            }}
                          >
                            {message.poll_data.question || parsedText}
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gap: '7px'
                            }}
                          >
                            {(message.poll_data.options || []).map(
                              (option, optionIndex) => {
                                const votes = Array.isArray(option.votes)
                                  ? option.votes
                                  : [];
                                const selectedByMe =
                                  votes.includes(currentUser.id);

                                return (
                                  <button
                                    key={`${message.id}-poll-${optionIndex}`}
                                    type="button"
                                    onClick={() =>
                                      updateStudyGroupPollVote(
                                        message,
                                        optionIndex
                                      )
                                    }
                                    style={{
                                      width: '100%',
                                      minHeight: '38px',
                                      padding: '8px 10px',
                                      borderRadius: '10px',
                                      border: selectedByMe
                                        ? '1px solid #7C9EDB'
                                        : '1px solid rgba(11,26,63,.15)',
                                      background: selectedByMe
                                        ? '#EEF4FF'
                                        : '#FFFFFF',
                                      color: '#0B1A3F',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      gap: '10px',
                                      fontSize: '11px',
                                      fontWeight: 800,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <span>{option.text}</span>
                                    <span>{votes.length}</span>
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          {renderAttachment(message.content || '')}

                          <div className="wa-message-text">
                            {parsedText}
                          </div>
                        </>
                      )}


                                          </div>

                      <div
                        className={`wa-message-meta ${
                          mine &&
                          (groupReadReceipts[message.id] || []).some(
                            (receipt) =>
                              receipt.user_id !== currentUser.id
                          )
                            ? 'seen'
                            : ''
                        }`}
                      >
                        <span>{formatMessageTime(message.created_at)}</span>
                        {mine && (
                          <>
                            <span>·</span>
                            <span>
                              {(groupReadReceipts[message.id] || []).some(
                                (receipt) =>
                                  receipt.user_id !== currentUser.id
                              )
                                ? 'Seen'
                                : 'Sent'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {mine && (
                      <button
                        type="button"
                        className="wa-message-avatar mine"
                        title="View your profile"
                        onClick={() => openMessageProfile(sender)}
                        style={{
                          background: avatarColor(sender.name),
                          border: '1px solid rgba(11,26,63,.06)'
                        }}
                      >
                        {sender.avatarUrl ? (
                          <img
                            src={sender.avatarUrl}
                            alt={sender.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: 'inherit',
                              display: 'block'
                            }}
                          />
                        ) : (
                          getInitials(sender.name)
                        )}
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="wa-chat-empty">
                <Users size={28} />
                <p>No Study Group messages yet.</p>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {pendingAttachment && (
            <div
              style={{
                padding: '10px 24px 0',
                background: '#FFFFFF',
                borderTop: '1px solid #E5EAF2'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 11px',
                  border: '1px solid #E1E7EF',
                  borderRadius: '12px',
                  background: '#F8FAFD'
                }}
              >
                {pendingAttachment.previewUrl ? (
                  <img
                    src={pendingAttachment.previewUrl}
                    alt={pendingAttachment.name}
                    style={{
                      width: '44px',
                      height: '44px',
                      objectFit: 'cover',
                      borderRadius: '9px'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '9px',
                      background: '#FFFFFF',
                      color: '#0B1A3F',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FileText size={19} />
                  </div>
                )}

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      color: '#0B1A3F',
                      fontSize: '11px',
                      fontWeight: '900',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {pendingAttachment.name}
                  </div>
                  <div
                    style={{
                      marginTop: '2px',
                      color: '#8B95A5',
                      fontSize: '9px',
                      fontWeight: '700'
                    }}
                  >
                    {(pendingAttachment.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearPendingAttachment}
                  aria-label="Remove attachment"
                  style={{
                    width: '30px',
                    height: '30px',
                    border: 'none',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    color: '#7D899A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="wa-composer">
            <input
              ref={attachmentInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
              onChange={handleAttachmentSelected}
              style={{ display: 'none' }}
            />

            <button
              type="button"
              onClick={pickAttachment}
              title="Attach file or image"
              aria-label="Attach file or image"
              style={{
                width: '44px',
                height: '44px',
                flexShrink: 0,
                border: '1px solid #E1E7EF',
                borderRadius: '13px',
                background: '#FFFFFF',
                color: '#0B1A3F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Paperclip size={18} />
            </button>

            <textarea
              value={composer}
              onChange={(event) => setComposer(event.target.value)}
              placeholder={`Message ${selected.name}...`}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendCurrentMessage();
                }
              }}
            />

            <button
              type="button"
              className="wa-send-btn"
              onClick={sendCurrentMessage}
              disabled={sending || uploadingAttachment || (!composer.trim() && !pendingAttachment)}
              aria-label="Send message"
            >
              <Send size={19} />
            </button>
          </div>
        </section>
          );

          return messagesFullscreen && isPhoneViewport
            ? createPortal(chatScreen, document.body)
            : chatScreen;
        })()}
        </>
      )}

      {showPollModal && selected?.type === 'group' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2200,
            background: 'rgba(15,20,34,.38)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowPollModal(false);
            }
          }}
        >
          <form
            onSubmit={createStudyGroupPoll}
            style={{
              width: 'min(460px, 100%)',
              background: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #E3E8EF',
              boxShadow: '0 24px 70px rgba(11,26,63,.22)',
              padding: '20px'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '16px'
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '18px',
                    color: '#0B1A3F'
                  }}
                >
                  Create Poll
                </h3>
                <p
                  style={{
                    margin: '3px 0 0',
                    fontSize: '11px',
                    color: '#8792A2'
                  }}
                >
                  Ask the Study Group a quick question.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPollModal(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  border: '1px solid #E3E8EF',
                  borderRadius: '10px',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={17} />
              </button>
            </div>

            <input
              type="text"
              value={pollQuestion}
              onChange={(event) =>
                setPollQuestion(event.target.value)
              }
              placeholder="Poll question"
              style={{
                width: '100%',
                minHeight: '46px',
                padding: '0 12px',
                border: '1px solid #DDE4EE',
                borderRadius: '12px',
                marginBottom: '12px'
              }}
            />

            <div
              style={{
                display: 'grid',
                gap: '9px'
              }}
            >
              {pollOptions.map((option, index) => (
                <div
                  key={`poll-option-${index}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 36px',
                    gap: '8px'
                  }}
                >
                  <input
                    type="text"
                    value={option}
                    onChange={(event) => {
                      const next = [...pollOptions];
                      next[index] = event.target.value;
                      setPollOptions(next);
                    }}
                    placeholder={`Option ${index + 1}`}
                    style={{
                      width: '100%',
                      minHeight: '44px',
                      padding: '0 12px',
                      border: '1px solid #DDE4EE',
                      borderRadius: '12px'
                    }}
                  />

                  <button
                    type="button"
                    disabled={pollOptions.length <= 2}
                    onClick={() =>
                      setPollOptions((previous) =>
                        previous.filter(
                          (_, optionIndex) =>
                            optionIndex !== index
                        )
                      )
                    }
                    style={{
                      width: '36px',
                      height: '44px',
                      border: '1px solid #F1C6C6',
                      borderRadius: '10px',
                      background: '#FFF4F4',
                      color: '#B91C1C',
                      cursor:
                        pollOptions.length <= 2
                          ? 'default'
                          : 'pointer',
                      opacity:
                        pollOptions.length <= 2
                          ? 0.45
                          : 1
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setPollOptions((previous) => [
                  ...previous,
                  ''
                ])
              }
              style={{
                width: '100%',
                minHeight: '42px',
                marginTop: '10px',
                border: '1px dashed #BFCBDD',
                borderRadius: '11px',
                background: '#FAFBFD',
                color: '#0B1A3F',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              + Add option
            </button>

            <button
              type="submit"
              disabled={
                pollSubmitting ||
                !pollQuestion.trim() ||
                pollOptions.filter(
                  (option) => option.trim()
                ).length < 2
              }
              style={{
                width: '100%',
                minHeight: '46px',
                marginTop: '14px',
                border: 'none',
                borderRadius: '12px',
                background: '#0B1A3F',
                color: '#FFFFFF',
                fontWeight: 900,
                cursor: pollSubmitting
                  ? 'default'
                  : 'pointer',
                opacity: pollSubmitting ? 0.6 : 1
              }}
            >
              {pollSubmitting ? 'Posting...' : 'Post poll'}
            </button>
          </form>
        </div>
      )}

      {profilePreview && (
        <div
          className="central-modal-backdrop"
          onMouseDown={() => setProfilePreview(null)}
        >
          <div
            className="central-modal"
            onMouseDown={(event) => event.stopPropagation()}
            style={{
              width: 'min(420px, calc(100vw - 36px))',
              padding: '22px'
            }}
          >
            <button
              type="button"
              onClick={() => setProfilePreview(null)}
              aria-label="Close profile"
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                width: '32px',
                height: '32px',
                border: 'none',
                borderRadius: '50%',
                background: '#F5F7FA',
                color: '#0B1A3F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  background: avatarColor(profilePreview.name),
                  color: '#0B1A3F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: '900',
                  marginBottom: '14px',
                  overflow: 'hidden'
                }}
              >
                {profilePreview.avatarUrl ? (
                  <img
                    src={profilePreview.avatarUrl}
                    alt={profilePreview.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  getInitials(profilePreview.name)
                )}
              </div>

              <h3
                style={{
                  margin: 0,
                  color: '#0B1A3F',
                  fontSize: '18px',
                  fontWeight: '900'
                }}
              >
                {profilePreview.name}
              </h3>

              {profilePreview.email && (
                <p
                  style={{
                    margin: '5px 0 0',
                    color: '#7D899A',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}
                >
                  {profilePreview.email}
                </p>
              )}

              {(profilePreview.major || profilePreview.year) && (
                <div
                  style={{
                    marginTop: '12px',
                    display: 'flex',
                    gap: '7px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                  }}
                >
                  {profilePreview.major && (
                    <span
                      style={{
                        padding: '5px 9px',
                        borderRadius: '999px',
                        background: '#F2F5F9',
                        color: '#0B1A3F',
                        fontSize: '9px',
                        fontWeight: '800'
                      }}
                    >
                      {profilePreview.major}
                    </span>
                  )}

                  {profilePreview.year && (
                    <span
                      style={{
                        padding: '5px 9px',
                        borderRadius: '999px',
                        background: '#F2F5F9',
                        color: '#0B1A3F',
                        fontSize: '9px',
                        fontWeight: '800'
                      }}
                    >
                      {profilePreview.year}
                    </span>
                  )}
                </div>
              )}

              {profilePreview.id !== currentUser?.id && (
                <button
                  type="button"
                  onClick={startDirectMessageFromProfile}
                  style={{
                    marginTop: '20px',
                    minHeight: '42px',
                    padding: '0 16px',
                    border: '1px solid #0B1A3F',
                    borderRadius: '12px',
                    background: '#0B1A3F',
                    color: '#FFFFFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: 'pointer'
                  }}
                >
                  <MessageSquare size={15} />
                  Direct Message
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreateGroup && (
        <div
          className="central-modal-backdrop"
          onClick={() => setShowCreateGroup(false)}
        >
          <div
            className="central-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="central-modal-head">
              <div>
                <h2>Create Group</h2>
                <p>Create a private group conversation with Campora users.</p>
              </div>

              <button
                type="button"
                className="central-modal-close"
                onClick={() => setShowCreateGroup(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <label className="central-modal-label">Group Name</label>

            <input
              className="central-modal-input"
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
              placeholder="Enter group name..."
            />

            <label
              className="central-modal-label"
              style={{ marginTop: '18px' }}
            >
              Add Members
            </label>

            <div className="wa-search">
              <Search size={17} />
              <input
                value={groupSearch}
                onChange={(event) => setGroupSearch(event.target.value)}
                placeholder="Search students..."
              />
            </div>

            {groupSearch.trim() && (
              <div className="central-search-results">
                {groupSearchResults.length ? (
                  groupSearchResults.slice(0, 8).map((profile) => {
                    const alreadySelected = selectedGroupMembers.some(
                      (member) => member.id === profile.id
                    );

                    return (
                      <button
                        key={profile.id}
                        type="button"
                        className="central-search-person"
                        onClick={() => {
                          if (alreadySelected) {
                            setSelectedGroupMembers((current) =>
                              current.filter((member) => member.id !== profile.id)
                            );
                          } else {
                            setSelectedGroupMembers((current) => [
                              ...current,
                              profile,
                            ]);
                          }
                        }}
                      >
                        <span
                          className="wa-avatar"
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '11px',
                            background: avatarColor(
                              profile.name || profile.email || ''
                            ),
                          }}
                        >
                          {getInitials(
                            profile.name || profile.email || 'Student'
                          )}
                        </span>

                        <span style={{ flex: 1 }}>
                          <strong>
                            {profile.name ||
                              profile.full_name ||
                              profile.email ||
                              'Student'}
                          </strong>
                          {profile.email && (
                            <div
                              style={{
                                color: 'var(--campora-muted)',
                                fontSize: '10px',
                                marginTop: '2px',
                              }}
                            >
                              {profile.email}
                            </div>
                          )}
                        </span>

                        <strong>{alreadySelected ? '✓' : '+'}</strong>
                      </button>
                    );
                  })
                ) : (
                  <div className="central-list-empty">No students found.</div>
                )}
              </div>
            )}

            {selectedGroupMembers.length > 0 && (
              <div className="central-selected-members">
                {selectedGroupMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    className="central-member-chip"
                    onClick={() =>
                      setSelectedGroupMembers((current) =>
                        current.filter((item) => item.id !== member.id)
                      )
                    }
                  >
                    {member.name ||
                      member.full_name ||
                      member.email ||
                      'Student'}{' '}
                    ×
                  </button>
                ))}
              </div>
            )}

            <div className="central-modal-actions">
              <button
                type="button"
                className="central-modal-secondary"
                onClick={() => setShowCreateGroup(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="central-modal-primary"
                onClick={createCustomMessageGroup}
                disabled={
                  creatingGroup ||
                  !newGroupName.trim() ||
                  !selectedGroupMembers.length
                }
              >
                {creatingGroup ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {reportTarget && (
        <div
          className="central-modal-backdrop"
          onClick={() => setReportTarget(null)}
        >
          <div
            className="central-modal"
            onClick={(event) => event.stopPropagation()}
            style={{ width: 'min(480px, 100%)' }}
          >
            <div className="central-modal-head">
              <div>
                <h2>Report message</h2>
                <p>Only this message is sent to Campora admins for review.</p>
              </div>

              <button
                type="button"
                className="central-modal-close"
                onClick={() => setReportTarget(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                background: '#F6F8FB',
                border: '1px solid #E4E9F0',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  marginBottom: 6,
                  color: '#8A91A0',
                  fontSize: 10,
                  fontWeight: 800,
                }}
              >
                <span>
                  {reportTarget.message.sender_id === currentUser?.id
                    ? 'You'
                    : reportTarget.message.sender_name || 'Student'}
                </span>
                <span>{formatDate(reportTarget.message.created_at)}</span>
              </div>

              <div
                style={{
                  color: '#344054',
                  fontSize: 13,
                  lineHeight: 1.5,
                  fontWeight: 650,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {cleanMessageText(
                  reportTarget.message.content ||
                    reportTarget.message.message ||
                    ''
                ) || '(Empty message)'}
              </div>
            </div>

            <label className="central-modal-label">Reason</label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setReportReason(reason)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border:
                      reportReason === reason
                        ? '1.5px solid #0B1A3F'
                        : '1px solid #E1E7EF',
                    background:
                      reportReason === reason ? '#F4F6FC' : '#FFFFFF',
                    color: '#0B1A3F',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    font: 'inherit',
                  }}
                >
                  {reason}
                  {reportReason === reason && <Check size={15} />}
                </button>
              ))}
            </div>

            <label
              className="central-modal-label"
              style={{ marginTop: 18 }}
            >
              Details (optional)
            </label>

            <textarea
              className="central-modal-input"
              value={reportNote}
              onChange={(event) => setReportNote(event.target.value)}
              placeholder="Add anything that helps our team understand..."
              style={{
                resize: 'vertical',
                minHeight: 72,
                paddingTop: 10,
                paddingBottom: 10,
                fontFamily: 'inherit',
              }}
            />

            <div className="central-modal-actions">
              <button
                type="button"
                className="central-modal-secondary"
                onClick={() => setReportTarget(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="central-modal-primary"
                onClick={submitReport}
                disabled={reportSubmitting}
              >
                {reportSubmitting ? 'Submitting...' : 'Submit report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function ConversationButton({
  active,
  avatar,
  avatarBg,
  name,
  meta,
  preview,
  date,
  unread,
  unreadCount,
  onClick,
  pinned = false,
  onTogglePin = null
}) {
  return (
    <button
      type="button"
      className={`wa-chat-row ${active ? 'active' : ''}`}
      onClick={onClick}
      style={
        pinned
          ? {
              border: '1px solid #C9D6EC',
              background: active ? '#EEF3FA' : '#F7FAFF',
              boxShadow: '0 5px 14px rgba(11,26,63,.06)'
            }
          : undefined
      }
    >
      <span
        className="wa-avatar"
        style={{ background: avatarBg }}
      >
        {avatar}
      </span>

      <span className="wa-chat-main">
        <span className="wa-chat-name-row">
          <span className="wa-chat-name">{name}</span>

          {pinned && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                flexShrink: 0,
                padding: '2px 6px',
                borderRadius: '999px',
                background: '#0B1A3F',
                color: '#FFFFFF',
                fontSize: '9px',
                fontWeight: '900',
                letterSpacing: '0.04em'
              }}
            >
              <Pin size={10} fill="#FFFFFF" color="#FFFFFF" />
              PINNED
            </span>
          )}

          <span className="wa-chat-tag">{meta}</span>
        </span>

        <span className="wa-chat-preview">
          {preview || 'No messages yet'}
        </span>
      </span>

      <span className="wa-chat-side">
        <span>{date}</span>

        {unread && (
          <span className="wa-unread">
            {unreadCount && unreadCount > 1 ? unreadCount : '•'}
          </span>
        )}

        {onTogglePin && (
          <span
            role="button"
            tabIndex={0}
            title={pinned ? 'Unpin chat' : 'Pin chat'}
            onClick={(event) => {
              event.stopPropagation();
              onTogglePin();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                onTogglePin();
              }
            }}
            style={{
              width: '30px',
              height: '30px',
              marginTop: '4px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: pinned ? '#0B1A3F' : '#98A2B3',
              background: pinned ? '#EEF3FA' : 'transparent',
              border: pinned ? '1px solid #DCE4F5' : '1px solid transparent',
              cursor: 'pointer'
            }}
          >
            <Pin
              size={14}
              color={pinned ? '#0B1A3F' : '#98A2B3'}
              fill={pinned ? '#0B1A3F' : 'none'}
            />
          </span>
        )}
      </span>
    </button>
  );
}