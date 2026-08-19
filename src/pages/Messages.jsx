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
  { key: 'groups', label: 'Private Groups', icon: Users },
  { key: 'study-groups', label: 'Study Groups', icon: Users },
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

      if (joinedGroupIds.length > 0) {
        const { data, error } = await supabase
          .from('study_groups')
          .select('*')
          .in('id', joinedGroupIds);

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
    if (folder === 'study-groups') {
      return studyGroupConversations.map((item) => {
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

    if (folder !== 'all') {
      return [];
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
        Loading messages...
      </div>
    );
  }

  return (
    <div className="wa-messages-page">
      <style>{`
        .wa-messages-page {
          width: 100%;
          height: calc(100vh - 84px);
          min-height: 0;
          overflow: hidden;
          background: transparent;
          color: var(--campora-text);
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
          height: 100%;
          min-width: 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #FFFFFF;
          border: none;
          border-radius: 0;
          box-shadow: none;
        }

        .wa-list-screen {
          width: 100%;
          max-width: none;
          height: 100%;
          min-height: 0;
          margin: 0;
          padding: 10px 22px 18px;
          overflow: hidden;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        .wa-page-title-line p {
          margin: 0;
          color: #8B97AD;
          font-size: 11px;
          font-weight: 700;
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
          color: #8B97AD;
          font-size: 11px;
          font-weight: 700;
        }

        .wa-create-btn {
          min-height: 40px;
          padding: 0 14px;
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
          min-height: 100px;
          flex-shrink: 0;
          padding: 20px 24px;
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
          width: 48px;
          height: 48px;
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
          padding: 10px 12px;
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
          color: #8B97AD;
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
          flex: 1;
          min-height: 0;
          padding: 0;
          box-sizing: border-box;
          background: transparent;
          border: none;
          box-shadow: none;
          overflow: hidden;
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
          overflow: hidden;
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
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .wa-folder-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .wa-folder-btn {
          width: 100%;
          min-height: 48px;
          padding: 0 12px;
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
          height: 100%;
          min-width: 0;
          min-height: 0;
          box-sizing: border-box;
          padding: 18px 0 22px;
          background: transparent;
          border: none;
          border-radius: 0;
          box-shadow: none;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .wa-inbox-toolbar h3 {
          margin: 0;
          color: #0B1A3F;
          font-size: 18px;
          font-weight: 800;
        }

        .wa-inbox-toolbar p {
          margin: 4px 0 0;
          color: #8B97AD;
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
          color: #0B1A3F;
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
          color: #8B97AD;
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
          color: #8B97AD;
        }

        .wa-chat-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 0 4px 8px 0;
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
          background: #EEF2F7;
          color: #66758E;
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .wa-chat-preview {
          margin-top: 4px;
          color: #8B97AD;
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
          color: #8B97AD;
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
          color: #8B97AD;
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
          color: #8B97AD;
          font-size: 10px;
          font-weight: 700;
        }

        .wa-chat-history {
          width: 100%;
          flex: 1 1 auto;
          min-height: 0;
          box-sizing: border-box;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 28px 34px 34px;
          background: #FBFCFE;
        }

        .wa-day-divider {
          width: fit-content;
          margin: 0 auto 18px;
          padding: 5px 9px;
          border-radius: 999px;
          background: #EEF2F7;
          color: #8B97AD;
          font-size: 9px;
          font-weight: 800;
        }

        .wa-message-row {
          display: flex;
          justify-content: flex-start;
          margin-bottom: 10px;
        }

        .wa-message-row.mine {
          justify-content: flex-end;
        }

        .wa-message-bubble {
          max-width: min(72%, 760px);
          padding: 11px 14px;
          border-radius: 16px;
          background: #EEF2F7;
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
          margin-bottom: 4px;
          color: #66758E;
          font-size: 9px;
          font-weight: 700;
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
          color: #8B97AD;
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
          background: #EEF2F7;
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
          color: #8B97AD;
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
            padding-bottom: 3px;
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
                            {getInitials(
                              profile.name ||
                                profile.email ||
                                'Student'
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
                      {folder === 'groups'
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