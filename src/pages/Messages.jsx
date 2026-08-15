import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Inbox,
  Send,
  FileText,
  Users,
  MessageSquare,
  Search,
  Mail,
  X,
  Plus,
  ArrowLeft,
  Sparkles,
  UserRound,
} from 'lucide-react';

import { supabase } from '../lib/supabase';

const FOLDERS = [
  { key: 'all', label: 'All Conversations', icon: MessageSquare },
  { key: 'inbox', label: 'Inbox', icon: Inbox },
  { key: 'sent', label: 'Sent', icon: Send },
  { key: 'drafts', label: 'Drafts', icon: FileText },
  { key: 'groups', label: 'Groups', icon: Users },
  { key: 'mentors', label: 'Mentors', icon: UserRound },
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

function sourceLabel(message) {
  const parsed = parseDirectMessage(
    message?.content || message?.message || ''
  );

  const type = String(parsed.source?.type || '').toLowerCase();

  if (type === 'swap' || type.includes('registration')) {
    return 'Registration';
  }

  if (type.includes('study')) {
    return 'Study Groups';
  }

  if (type.includes('campus')) {
    return 'Campus Pulse';
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

export default function Messages() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);

  const [folder, setFolder] = useState('all');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [directMessages, setDirectMessages] = useState([]);
  const [profiles, setProfiles] = useState({});

  const [groups, setGroups] = useState([]);
  const [groupMessages, setGroupMessages] = useState({});

  const [customGroups, setCustomGroups] = useState([]);
  const [customGroupMessages, setCustomGroupMessages] = useState({});

  const [selected, setSelected] = useState(null);
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

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    setDrafts(readDrafts(currentUser.id));
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
    chatBottomRef.current?.scrollIntoView({ behavior: 'auto' });
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
        () => loadGroupsAndMessages(currentUser.id)
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

  async function loadGroupsAndMessages(userId) {
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

    const memberIds = (membershipRows || []).map(
      (row) => row.group_id
    );

    const { data: ownedGroups, error: ownedError } = await supabase
      .from('study_groups')
      .select('*')
      .eq('creator_id', userId);

    if (ownedError) {
      console.error('Could not load owned Study Groups:', ownedError);
    }

    let memberGroups = [];

    if (memberIds.length) {
      const { data, error } = await supabase
        .from('study_groups')
        .select('*')
        .in('id', memberIds);

      if (error) {
        console.error('Could not load joined Study Groups:', error);
      } else {
        memberGroups = data || [];
      }
    }

    const uniqueMap = new Map();

    [...(ownedGroups || []), ...memberGroups].forEach((group) => {
      if (group?.id) uniqueMap.set(group.id, group);
    });

    const visibleGroups = [...uniqueMap.values()];
    setGroups(visibleGroups);

    if (!visibleGroups.length) {
      setGroupMessages({});
      return;
    }

    const groupIds = visibleGroups.map((group) => group.id);

    const { data: messages, error: groupMessageError } = await supabase
      .from('group_messages')
      .select('*')
      .in('group_id', groupIds)
      .order('created_at', { ascending: true });

    if (groupMessageError) {
      console.error(
        'Could not load Study Group messages:',
        groupMessageError
      );
      return;
    }

    const map = {};

    (messages || []).forEach((message) => {
      if (!map[message.group_id]) {
        map[message.group_id] = [];
      }

      map[message.group_id].push(message);
    });

    setGroupMessages(map);
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
          source: sourceLabel(message),
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

    return [...directMessages]
      .filter(
        (message) =>
          (message.sender_id === currentUser.id &&
            message.receiver_id === selected.partnerId) ||
          (message.sender_id === selected.partnerId &&
            message.receiver_id === currentUser.id)
      )
      .sort(
        (a, b) =>
          new Date(a.created_at || 0) -
          new Date(b.created_at || 0)
      );
  }, [selected, directMessages, currentUser?.id]);

  const selectedStudyGroupMessages = useMemo(() => {
    if (!selected || selected.type !== 'group') return [];
    return groupMessages[selected.groupId] || [];
  }, [selected, groupMessages]);

  const selectedCustomGroupMessages = useMemo(() => {
    if (!selected || selected.type !== 'custom-group') return [];
    return customGroupMessages[selected.groupId] || [];
  }, [selected, customGroupMessages]);

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

  async function sendCurrentMessage() {
    const text = composer.trim();

    if (!text || !selected || !currentUser?.id) return;

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

        clearCurrentDraft();
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

        clearCurrentDraft();
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

        clearCurrentDraft();
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
      />
    );
  }

  function currentList() {
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
          />
        );
      });
    }

    return allRows.map((item) => {
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
        />
      );
    });
  }

  const rows = currentList();

  if (loading) {
    return (
      <div className="central-messages-loading">
        <MessageSquare size={28} />
        Loading messages...
      </div>
    );
  }

  return (
    <div className="wa-messages-page">
      <style>{`
        .wa-messages-page {
          width: 100%;
          height: calc(100vh - 122px);
          min-height: 0;
          overflow: hidden;
          background:
            radial-gradient(circle at 10% 0%, rgba(146, 190, 255, .26), transparent 26%),
            radial-gradient(circle at 88% 4%, rgba(210, 171, 255, .24), transparent 24%),
            radial-gradient(circle at 50% 100%, rgba(255, 196, 168, .16), transparent 30%),
            var(--surface-container-lowest);
          color: var(--campora-text);
        }

        .wa-list-screen,
        .wa-chat-screen {
          width: 100%;
          height: 100%;
          min-height: 0;
          box-sizing: border-box;
        }

        .wa-list-screen {
          max-width: 1040px;
          margin: 0 auto;
          padding: 34px 28px 52px;
          overflow-y: auto;
        }

        .wa-list-hero {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 24px;
          padding: 26px 28px;
          border-radius: 28px;
          background:
            linear-gradient(135deg, rgba(218, 233, 249, .92), rgba(235, 243, 252, .90) 58%, rgba(245, 248, 252, .94));
          border: 1px solid rgba(121, 149, 190, .18);
          box-shadow: 0 18px 45px rgba(33, 70, 115, .08);
        }

        .wa-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: var(--campora-navy);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .08em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .wa-list-hero h2 {
          margin: 0;
          font-size: clamp(34px, 4vw, 48px);
          letter-spacing: -.05em;
          line-height: .98;
          font-weight: 950;
          color: var(--campora-text);
        }

        .wa-list-hero p {
          margin: 10px 0 0;
          color: var(--campora-muted);
          font-size: 14px;
          font-weight: 650;
        }

        .wa-create-btn {
          border: 0;
          border-radius: 18px;
          padding: 13px 18px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #06366B, #0B4F8A);
          color: white;
          font: inherit;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(13, 58, 112, .18);
          white-space: nowrap;
        }

        .wa-create-btn:hover {
          transform: translateY(-1px);
        }

        .wa-filter-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 6px;
          margin-bottom: 16px;
          scrollbar-width: none;
        }

        .wa-filter-row::-webkit-scrollbar {
          display: none;
        }

        .wa-filter-chip {
          border: 1px solid var(--outline-variant);
          background: linear-gradient(180deg, rgba(255,255,255,.86), rgba(245,247,251,.92));
          color: var(--campora-body);
          min-height: 40px;
          border-radius: 999px;
          padding: 0 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font: inherit;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          white-space: nowrap;
        }

        .wa-filter-chip.active {
          background: linear-gradient(135deg, #062F5F, #0B4F8A);
          border-color: transparent;
          color: white;
          box-shadow: 0 10px 22px rgba(48, 64, 145, .18);
        }

        .wa-filter-chip:nth-child(2):not(.active) { background: linear-gradient(180deg, #EEF8FF, #E5F2FF); }
        .wa-filter-chip:nth-child(3):not(.active) { background: linear-gradient(180deg, #F1EDFF, #E8E1FF); }
        .wa-filter-chip:nth-child(4):not(.active) { background: linear-gradient(180deg, #FFF2EA, #FFE8DA); }
        .wa-filter-chip:nth-child(5):not(.active) { background: linear-gradient(180deg, #ECFAF5, #E2F4ED); }

        .wa-search-wrap {
          position: relative;
          margin-bottom: 18px;
        }

        .wa-search {
          display: flex;
          align-items: center;
          gap: 11px;
          min-height: 56px;
          border: 1px solid rgba(104, 130, 166, .18);
          border-radius: 22px;
          padding: 0 16px;
          background: linear-gradient(180deg, rgba(255,255,255,.88), rgba(246,248,252,.94));
          color: var(--campora-muted);
          box-shadow: 0 7px 20px rgba(22, 63, 115, .045);
        }

        .wa-search input {
          flex: 1;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--campora-text);
          font: inherit;
          font-size: 14px;
          font-weight: 720;
        }

        .wa-search-results {
          position: absolute;
          left: 0;
          right: 0;
          top: calc(100% + 7px);
          z-index: 20;
          border: 1px solid var(--outline-variant);
          border-radius: 18px;
          background: var(--surface-container-lowest);
          box-shadow: 0 18px 42px rgba(20, 43, 75, .14);
          overflow: hidden;
        }

        .wa-search-person {
          width: 100%;
          border: 0;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 11px 13px;
          text-align: left;
          color: var(--campora-text);
          cursor: pointer;
        }

        .wa-search-person:hover {
          background: var(--surface-container-low);
        }

        .wa-chat-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .wa-chat-row {
          width: 100%;
          border: 1px solid rgba(116, 138, 171, .12);
          background: rgba(255,255,255,.58);
          backdrop-filter: blur(8px);
          display: grid;
          grid-template-columns: 58px minmax(0, 1fr) auto;
          gap: 14px;
          align-items: center;
          padding: 13px 14px;
          border-radius: 22px;
          color: var(--campora-text);
          text-align: left;
          cursor: pointer;
          transition: transform .15s ease, background .15s ease, border-color .15s ease;
        }

        .wa-chat-row:hover {
          transform: translateY(-2px);
          background: linear-gradient(135deg, rgba(234,244,255,.92), rgba(246,239,255,.90));
          border-color: rgba(99, 127, 166, .18);
          box-shadow: 0 12px 28px rgba(45, 70, 110, .08);
        }

        .wa-chat-row.active {
          background: linear-gradient(135deg, rgba(220,235,250,.98), rgba(237,244,252,.98));
          border-color: rgba(76, 93, 168, .20);
          box-shadow: 0 14px 32px rgba(63, 76, 137, .10);
        }

        .wa-chat-row {
          position: relative;
          overflow: hidden;
        }

        .wa-chat-row::before {
          content: '';
          position: absolute;
          left: 0;
          top: 16px;
          bottom: 16px;
          width: 4px;
          border-radius: 0 999px 999px 0;
          background: linear-gradient(180deg, #4F8FD9, #8B6CD7, #F0A779);
          opacity: .45;
        }

        .wa-chat-row.active::before,
        .wa-chat-row:hover::before {
          opacity: 1;
        }


        .wa-avatar {
          width: 56px;
          height: 56px;
          border-radius: 19px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 15px;
          font-weight: 950;
          color: #163F73;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.45);
        }

        .wa-chat-main {
          min-width: 0;
        }

        .wa-chat-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .wa-chat-name {
          font-size: 15px;
          font-weight: 950;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .wa-chat-tag {
          display: inline-flex;
          align-items: center;
          min-height: 21px;
          border-radius: 999px;
          padding: 0 8px;
          background: linear-gradient(135deg, #E2ECFF, #E8E0FF);
          color: #234C82;
          font-size: 9px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: .04em;
          white-space: nowrap;
        }

        .wa-chat-preview {
          margin-top: 5px;
          color: var(--campora-muted);
          font-size: 12px;
          font-weight: 650;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .wa-chat-side {
          min-width: 62px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 7px;
          color: var(--campora-muted);
          font-size: 10px;
          font-weight: 850;
        }

        .wa-unread {
          min-width: 22px;
          height: 22px;
          padding: 0 7px;
          border-radius: 999px;
          background: linear-gradient(135deg, #06366B, #0B4F8A);
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 950;
        }

        .wa-empty-list {
          min-height: 340px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: var(--campora-muted);
          padding: 40px 20px;
        }

        .wa-empty-list-icon {
          width: 76px;
          height: 76px;
          border-radius: 26px;
          background: linear-gradient(135deg, #DCEBFF, #E9DFFF 58%, #FFE9DD);
          color: var(--campora-navy);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }


        .mentor-card {
          display: grid;
          grid-template-columns: 58px minmax(0, 1fr);
          gap: 15px;
          align-items: start;
          padding: 18px;
          margin-bottom: 12px;
          border: 1px solid rgba(6, 54, 107, .12);
          border-radius: 22px;
          background: linear-gradient(135deg, rgba(231, 241, 251, .96), rgba(249, 252, 255, .98));
          box-shadow: 0 10px 26px rgba(6, 54, 107, .06);
        }

        .mentor-avatar {
          width: 56px;
          height: 56px;
        }

        .mentor-card-main {
          min-width: 0;
        }

        .mentor-card-topline {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }

        .mentor-name {
          color: var(--campora-text);
          font-size: 16px;
          font-weight: 950;
        }

        .mentor-role {
          margin-top: 3px;
          color: var(--campora-navy);
          font-size: 11px;
          font-weight: 900;
        }

        .mentor-department {
          margin-top: 7px;
          color: var(--campora-muted);
          font-size: 12px;
          font-weight: 750;
        }

        .mentor-bio {
          margin: 9px 0 0;
          color: var(--campora-body);
          font-size: 12px;
          line-height: 1.5;
        }

        .mentor-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 11px;
        }

        .mentor-chip {
          display: inline-flex;
          align-items: center;
          min-height: 25px;
          padding: 0 9px;
          border-radius: 999px;
          background: #DFECF8;
          color: #06366B;
          font-size: 10px;
          font-weight: 850;
        }

        .mentor-chip.course {
          background: #EDF2F8;
          color: #42566E;
        }

        .mentor-meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 18px;
          margin-top: 10px;
          color: var(--campora-muted);
          font-size: 10px;
          font-weight: 750;
        }

        .mentor-message-btn {
          border: 0;
          border-radius: 13px;
          padding: 10px 13px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: linear-gradient(135deg, #052F5F, #0B4F8A);
          color: #fff;
          font: inherit;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 8px 18px rgba(6, 54, 107, .15);
        }

        .mentor-message-btn:hover {
          transform: translateY(-1px);
        }

        :root[data-theme='dark'] .mentor-card {
          background: linear-gradient(135deg, rgba(28, 45, 65, .96), rgba(22, 34, 49, .98));
          border-color: rgba(139, 164, 194, .12);
        }

        :root[data-theme='dark'] .mentor-chip {
          background: rgba(71, 111, 153, .25);
          color: #C9E2FA;
        }

        :root[data-theme='dark'] .mentor-chip.course {
          background: rgba(100, 113, 130, .20);
          color: #D1DAE4;
        }

        /* Full-chat screen */
        .wa-chat-screen {
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
          background:
            radial-gradient(circle at 90% 8%, rgba(221, 212, 243, .18), transparent 23%),
            var(--surface-container-lowest);
        }

        .wa-chat-header {
          min-height: 78px;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 12px 24px;
          border-bottom: 1px solid var(--outline-variant);
          background: color-mix(in srgb, var(--surface-container-lowest) 94%, transparent);
          position: relative;
          z-index: 20;
          flex-shrink: 0;
          backdrop-filter: blur(12px);
        }

        .wa-back-btn {
          width: 42px;
          height: 42px;
          border: 1px solid var(--outline-variant);
          border-radius: 14px;
          background: var(--surface-container-low);
          color: var(--campora-text);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }

        .wa-back-btn:hover {
          background: var(--surface-container-high);
        }

        .wa-chat-header-copy {
          min-width: 0;
          flex: 1;
        }

        .wa-chat-header-copy h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 950;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .wa-chat-header-copy p {
          margin: 4px 0 0;
          color: var(--campora-muted);
          font-size: 11px;
          font-weight: 700;
        }

        .wa-chat-history {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 30px max(24px, calc((100vw - 900px) / 2));
          background:
            linear-gradient(rgba(255,255,255,.70), rgba(255,255,255,.70)),
            radial-gradient(circle at 20% 20%, rgba(202, 221, 255, .30), transparent 20%),
            radial-gradient(circle at 80% 35%, rgba(226, 211, 252, .28), transparent 22%);
        }

        :root[data-theme='dark'] .wa-chat-history {
          background:
            linear-gradient(rgba(18,26,35,.86), rgba(18,26,35,.86)),
            radial-gradient(circle at 20% 20%, rgba(39, 75, 118, .25), transparent 20%),
            radial-gradient(circle at 80% 35%, rgba(78, 58, 112, .23), transparent 22%);
        }

        .wa-day-divider {
          width: fit-content;
          margin: 0 auto 22px;
          padding: 6px 10px;
          border-radius: 999px;
          background: var(--surface-container-high);
          color: var(--campora-muted);
          font-size: 10px;
          font-weight: 900;
        }

        .wa-message-row {
          display: flex;
          margin-bottom: 10px;
        }

        .wa-message-row.mine {
          justify-content: flex-end;
        }

        .wa-message-bubble {
          max-width: min(72%, 620px);
          padding: 10px 13px 8px;
          border-radius: 18px 18px 18px 6px;
          background: var(--surface-container-lowest);
          color: var(--campora-text);
          border: 1px solid var(--outline-variant);
          box-shadow: 0 5px 16px rgba(15, 45, 82, .055);
          font-size: 13px;
          line-height: 1.45;
          word-break: break-word;
          white-space: pre-wrap;
        }

        .wa-message-row.mine .wa-message-bubble {
          background: linear-gradient(135deg, var(--campora-navy), #164D88);
          color: white;
          border-color: transparent;
          border-radius: 18px 18px 6px 18px;
        }

        .wa-message-sender {
          color: var(--campora-navy);
          font-size: 10px;
          font-weight: 950;
          margin-bottom: 4px;
        }

        .wa-message-time {
          margin-top: 5px;
          font-size: 9px;
          opacity: .65;
          text-align: right;
        }

        .wa-chat-empty {
          min-height: 54vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: var(--campora-muted);
        }

        .wa-composer {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          padding: 14px max(20px, calc((100vw - 900px) / 2));
          border-top: 1px solid var(--outline-variant);
          background: var(--surface-container-lowest);
          position: relative;
          z-index: 20;
          flex-shrink: 0;
        }

        .wa-composer textarea {
          flex: 1;
          min-height: 48px;
          max-height: 130px;
          resize: none;
          border: 1px solid var(--outline-variant);
          border-radius: 18px;
          outline: 0;
          background: var(--surface-container-low);
          color: var(--campora-text);
          padding: 13px 15px;
          font: inherit;
          font-size: 13px;
        }

        .wa-send-btn {
          width: 48px;
          height: 48px;
          border: 0;
          border-radius: 16px;
          background: linear-gradient(135deg, var(--campora-navy), #2865A9);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          box-shadow: 0 9px 20px rgba(13, 58, 112, .20);
        }

        .wa-send-btn:disabled {
          opacity: .45;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Create-group modal */
        .central-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(12, 22, 34, .48);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          backdrop-filter: blur(4px);
        }

        .central-modal {
          width: min(520px, 94vw);
          max-height: 84vh;
          overflow-y: auto;
          background: var(--surface-container-lowest);
          border: 1px solid var(--outline-variant);
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 26px 70px rgba(0,0,0,.22);
        }

        .central-modal-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }

        .central-modal-head h2 {
          margin: 0;
          font-size: 22px;
          color: var(--campora-text);
        }

        .central-modal-head p {
          margin: 5px 0 0;
          font-size: 12px;
          color: var(--campora-muted);
        }

        .central-modal-close {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          border: 1px solid var(--outline-variant);
          background: var(--surface-container-low);
          color: var(--campora-text);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .central-modal-label {
          display: block;
          margin-bottom: 7px;
          font-size: 11px;
          font-weight: 900;
          color: var(--campora-text);
        }

        .central-modal-input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid var(--outline-variant);
          border-radius: 14px;
          padding: 12px 14px;
          background: var(--surface-container-low);
          color: var(--campora-text);
          outline: 0;
          font: inherit;
        }

        .central-search-results {
          margin-top: 8px;
          border: 1px solid var(--outline-variant);
          border-radius: 14px;
          overflow: hidden;
          background: var(--surface-container-lowest);
        }

        .central-search-person {
          width: 100%;
          border: 0;
          background: transparent;
          color: var(--campora-text);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          text-align: left;
          cursor: pointer;
        }

        .central-search-person:hover {
          background: var(--surface-container-low);
        }

        .central-selected-members {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 14px;
        }

        .central-member-chip {
          border: 0;
          border-radius: 999px;
          padding: 7px 10px;
          background: var(--campora-navy-tint);
          color: var(--campora-navy);
          font: inherit;
          font-size: 11px;
          font-weight: 850;
          cursor: pointer;
        }

        .central-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          margin-top: 22px;
        }

        .central-modal-actions button {
          border-radius: 12px;
          padding: 10px 15px;
          font: inherit;
          font-weight: 850;
          cursor: pointer;
        }

        .central-modal-secondary {
          border: 1px solid var(--outline-variant);
          background: transparent;
          color: var(--campora-text);
        }

        .central-modal-primary {
          border: 0;
          background: var(--campora-navy);
          color: white;
        }

        .central-modal-primary:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .central-list-empty {
          padding: 20px;
          text-align: center;
          color: var(--campora-muted);
          font-size: 12px;
          font-weight: 700;
        }

        :root[data-theme='dark'] .wa-avatar {
          color: #EAF2FC;
          filter: saturate(.88) brightness(.78);
        }

        :root[data-theme='dark'] .wa-list-hero {
          background:
            linear-gradient(135deg, rgba(35, 63, 92, .88), rgba(64, 51, 92, .86) 55%, rgba(82, 58, 48, .76));
          border-color: rgba(173, 195, 224, .10);
        }

        :root[data-theme='dark'] .wa-chat-row {
          background: rgba(27, 36, 48, .72);
          border-color: rgba(155, 175, 205, .08);
        }

        :root[data-theme='dark'] .wa-chat-row:hover,
        :root[data-theme='dark'] .wa-chat-row.active {
          background: linear-gradient(135deg, rgba(38, 58, 79, .90), rgba(60, 47, 82, .88));
        }

        :root[data-theme='dark'] .wa-search {
          background: rgba(28, 37, 49, .88);
        }

        :root[data-theme='dark'] .wa-filter-chip:not(.active) {
          background: rgba(30, 40, 53, .86);
        }



        /* Navy-first Campora theme */
        .wa-eyebrow {
          color: #0B4F8A;
        }

        .wa-create-btn {
          background: linear-gradient(135deg, #052F5F, #0B4F8A);
          box-shadow: 0 12px 28px rgba(6, 54, 107, .18);
        }

        .wa-filter-chip.active {
          background: linear-gradient(135deg, #052F5F, #0B4F8A);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 10px 24px rgba(6, 54, 107, .18);
        }

        .wa-chat-tag {
          background: #E4EEF9;
          color: #06366B;
        }

        .wa-unread {
          background: #06366B;
        }

        .wa-chat-row::before {
          background: linear-gradient(180deg, #0D5B9E, #06366B);
        }

        .wa-chat-row:hover {
          background: linear-gradient(135deg, rgba(226,239,252,.96), rgba(244,248,252,.96));
          border-color: rgba(6,54,107,.16);
        }

        .wa-chat-row.active {
          background: linear-gradient(135deg, #DCEBFA, #EDF4FB);
          border-color: rgba(6,54,107,.20);
        }

        .wa-send-btn {
          background: linear-gradient(135deg, #052F5F, #0B4F8A);
          box-shadow: 0 9px 22px rgba(6,54,107,.20);
        }

        @media (max-width: 760px) {
          .wa-list-screen {
            padding: 22px 14px 34px;
          }

          .wa-list-hero {
            align-items: flex-start;
          }

          .wa-list-hero h2 {
            font-size: 32px;
          }

          .wa-create-btn span {
            display: none;
          }

          .wa-chat-header {
            padding: 10px 12px;
          }

          .wa-chat-history {
            padding: 22px 12px;
          }

          .wa-composer {
            padding: 10px 12px;
          }

          .wa-message-bubble {
            max-width: 84%;
          }
        }
      `}</style>

      {!selected ? (
        <section className="wa-list-screen">
          <div className="wa-list-hero">
            <div>
              <div className="wa-eyebrow">
                <Sparkles size={13} />
                Campora Connect
              </div>
              <h2>Chats</h2>
              <p>
                Your direct messages, study groups, and private groups — all in one place.
              </p>
            </div>

            <button
              type="button"
              className="wa-create-btn"
              onClick={() => setShowCreateGroup(true)}
            >
              <Plus size={18} />
              <span>New Group</span>
            </button>
          </div>

          <div className="wa-filter-row">
            {FOLDERS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`wa-filter-chip ${folder === item.key ? 'active' : ''}`}
                  onClick={() => setFolder(item.key)}
                >
                  <Icon size={14} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="wa-search-wrap">
            <div className="wa-search">
              <Search size={18} />
              <input
                value={peopleSearch}
                onChange={(event) => setPeopleSearch(event.target.value)}
                placeholder="Search people or start a new chat..."
              />
            </div>

            {(peopleSearching || peopleResults.length > 0) && (
              <div className="wa-search-results">
                {peopleSearching ? (
                  <div className="central-list-empty">Searching...</div>
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
                          width: '38px',
                          height: '38px',
                          borderRadius: '13px',
                          background: avatarColor(profile.name || profile.email || ''),
                        }}
                      >
                        {getInitials(profile.name || profile.email || 'Student')}
                      </span>

                      <span style={{ minWidth: 0 }}>
                        <strong>
                          {profile.name ||
                            profile.full_name ||
                            profile.email ||
                            'Student'}
                        </strong>
                        {profile.email && (
                          <div
                            style={{
                              marginTop: '2px',
                              fontSize: '10px',
                              color: 'var(--campora-muted)',
                            }}
                          >
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
                  <MessageSquare size={30} />
                </div>
                <strong>
                  {folder === 'groups'
                    ? 'No groups yet'
                    : folder === 'drafts'
                    ? 'No drafts yet'
                    : 'No conversations yet'}
                </strong>
                <span style={{ marginTop: '7px', fontSize: '12px' }}>
                  {folder === 'groups'
                    ? 'Create a private group or join a Study Group.'
                    : 'Search for someone above to start chatting.'}
                </span>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="wa-chat-screen">
          <header className="wa-chat-header">
            <button
              type="button"
              className="wa-back-btn"
              onClick={() => setSelected(null)}
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
              }}
            >
              {selected.type === 'dm' ? (
                getInitials(selected.name)
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
          </header>

          <div className="wa-chat-history">
            <div className="wa-day-divider">Today</div>

            {selected.type === 'dm' ? (
              selectedDmMessages.length ? (
                selectedDmMessages.map((message) => {
                  const mine = message.sender_id === currentUser.id;
                  const parsed = parseDirectMessage(
                    message.content || message.message || ''
                  );

                  return (
                    <div
                      key={message.id}
                      className={`wa-message-row ${mine ? 'mine' : ''}`}
                    >
                      <div className="wa-message-bubble">
                        {parsed.reply?.text && (
                          <div
                            style={{
                              opacity: .7,
                              fontSize: '10px',
                              marginBottom: '5px',
                              borderLeft: '2px solid currentColor',
                              paddingLeft: '7px',
                            }}
                          >
                            Reply to {parsed.reply.sender || 'message'}: {parsed.reply.text}
                          </div>
                        )}
                        {parsed.text}
                        <div className="wa-message-time">
                          {formatDate(message.created_at)}
                        </div>
                      </div>
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
                  const senderName =
                    profiles[message.sender_id]?.name ||
                    profiles[message.sender_id]?.full_name ||
                    (mine ? 'You' : 'Member');

                  return (
                    <div
                      key={message.id}
                      className={`wa-message-row ${mine ? 'mine' : ''}`}
                    >
                      <div className="wa-message-bubble">
                        {!mine && (
                          <div className="wa-message-sender">{senderName}</div>
                        )}
                        {message.content || ''}
                        <div className="wa-message-time">
                          {formatDate(message.created_at)}
                        </div>
                      </div>
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
                return (
                  <div
                    key={message.id}
                    className={`wa-message-row ${mine ? 'mine' : ''}`}
                  >
                    <div className="wa-message-bubble">
                      {!mine && (
                        <div className="wa-message-sender">
                          {message.sender_name || 'Student'}
                        </div>
                      )}
                      {message.content || ''}
                      <div className="wa-message-time">
                        {formatDate(message.created_at)}
                      </div>
                    </div>
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

          <div className="wa-composer">
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
              disabled={sending || !composer.trim()}
              aria-label="Send message"
            >
              <Send size={19} />
            </button>
          </div>
        </section>
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
}) {
  return (
    <button
      type="button"
      className={`wa-chat-row ${active ? 'active' : ''}`}
      onClick={onClick}
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
      </span>
    </button>
  );
}