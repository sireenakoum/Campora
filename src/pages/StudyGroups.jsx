import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Users,
  Volume2,
  MessageSquare,
  ArrowRight,
  Search,
  X,
  ArrowLeft,
  BookmarkCheck,
  LayoutGrid,
  Sliders,
  UserPlus,
  Trash2,
  Edit3,
  Send,
  Crown,
  Check,
  Bell,
  BellOff,
  Target,
  MoreVertical,
  BarChart2,
  User,
  MessageCircle,
  Circle,
  Mail,
  Pin,
  Reply,
  LogOut
} from 'lucide-react';

import { supabase } from '../lib/supabase';

const MAJORS_CREATION = [
  'All Majors Welcome',
  'Architecture',
  'Biology',
  'Business / Finance',
  'Civil Engineering',
  'Chemical Engineering',
  'Computer Science',
  'Economics',
  'Electrical Engineering',
  'Graphic Design',
  'History',
  'Mathematics',
  'Mechanical Engineering',
  'Media & Communication',
  'Nursing',
  'Nutrition',
  'Philosophy',
  'Physics',
  'Political Science',
  'Psychology',
  'Sociology'
];

const MAJORS_PREFERENCES = MAJORS_CREATION.filter(
  (m) => m !== 'All Majors Welcome'
);

const STUDY_GOALS = [
  'Exam Prep',
  'Homework / Assignments',
  'Final Project',
  'General Review',
  'Reading / Discussion'
];

const NOISE_LEVELS = [
  'Dead Silent',
  'Library Soft',
  'Background Music',
  'Social & Talkative'
];

const STUDY_MODES = ['In-person', 'Online'];

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const PIN_COLORS = {
  bg: '#FEF3C7',
  border: '#FCD34D',
  icon: '#B45309'
};

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

const getInitials = (name) =>
  (name || 'S')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const getAvatarColor = (name) => {
  const str = name || 'S';

  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
};

export default function StudyGroups() {
  // =====================================================
  // GENERAL STATE
  // =====================================================

  const [currentUser, setCurrentUser] = useState(null);

  const [groups, setGroups] = useState([]);

  const [joinedGroupIds, setJoinedGroupIds] = useState([]);

  const [view, setView] = useState(() => {
    return (
      localStorage.getItem('campora_study_groups_view') ||
      'browse'
    );
  });

  const [selectedGroup, setSelectedGroup] = useState(null);

  const [groupMembers, setGroupMembers] = useState([]);

  const [editingGroup, setEditingGroup] = useState(null);

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  // =====================================================
  // CHAT STATE
  // =====================================================

  const [messages, setMessages] = useState([]);

  const [newMessage, setNewMessage] = useState('');

  const [notificationsMuted, setNotificationsMuted] =
    useState({});

  const chatBottomRef = useRef(null);

  const [replyingTo, setReplyingTo] = useState(null);

  const [activeMessageMenu, setActiveMessageMenu] =
    useState(null);

  // =====================================================
  // PINNED GROUP MESSAGES
  // =====================================================

  const [pinnedGroupMessages, setPinnedGroupMessages] =
    useState(() => {
      const saved = localStorage.getItem(
        'campora_pinned_group_messages'
      );

      return saved ? JSON.parse(saved) : {};
    });

  useEffect(() => {
    localStorage.setItem(
      'campora_pinned_group_messages',
      JSON.stringify(pinnedGroupMessages)
    );
  }, [pinnedGroupMessages]);

  const togglePinGroupMessage = (msgId) => {
    if (!selectedGroup) return;

    setPinnedGroupMessages((prev) => {
      const currentPinned =
        prev[selectedGroup.id] || [];

      const isPinned =
        currentPinned.includes(msgId);

      return {
        ...prev,

        [selectedGroup.id]: isPinned
          ? currentPinned.filter((id) => id !== msgId)
          : [...currentPinned, msgId]
      };
    });

    setActiveMessageMenu(null);
  };

  // =====================================================
  // SOCIAL / MEMBER / POLL STATE
  // =====================================================

  const [selectedMember, setSelectedMember] =
    useState(null);

  const [showMembersDrawer, setShowMembersDrawer] =
    useState(false);

  const [showPollModal, setShowPollModal] =
    useState(false);

  const [pollQuestion, setPollQuestion] =
    useState('');

  const [pollOptions, setPollOptions] =
    useState(['', '']);

  // =====================================================
  // DIRECT MESSAGES
  // =====================================================

  const [directChatMessage, setDirectChatMessage] =
    useState('');

  const [showDMChat, setShowDMChat] =
    useState(false);

  const [dmConversations, setDmConversations] =
    useState([]);

  const [selectedDmUser, setSelectedDmUser] =
    useState(null);

  const [dmMessages, setDmMessages] =
    useState([]);

  const [newDmMessageText, setNewDmMessageText] =
    useState('');

  // =====================================================
  // DM SEARCH
  // =====================================================

  const [dmSearchQuery, setDmSearchQuery] =
    useState('');

  const [dmSearchResults, setDmSearchResults] =
    useState([]);

  const [searchingUsers, setSearchingUsers] =
    useState(false);

  // =====================================================
  // PINNED GROUPS + DMS
  // =====================================================

  const [pinnedChats, setPinnedChats] =
    useState(() => {
      const saved =
        localStorage.getItem('campora_pinned_chats');

      return saved
        ? JSON.parse(saved)
        : {
            dms: [],
            groups: []
          };
    });

  useEffect(() => {
    localStorage.setItem(
      'campora_pinned_chats',
      JSON.stringify(pinnedChats)
    );
  }, [pinnedChats]);

  const togglePinDm = (partnerId) => {
    setPinnedChats((prev) => {
      const isPinned =
        prev.dms.includes(partnerId);

      return {
        ...prev,

        dms: isPinned
          ? prev.dms.filter(
              (id) => id !== partnerId
            )
          : [...prev.dms, partnerId]
      };
    });
  };

  const togglePinGroup = (groupId, e) => {
    if (e) e.stopPropagation();

    setPinnedChats((prev) => {
      const isPinned =
        prev.groups.includes(groupId);

      return {
        ...prev,

        groups: isPinned
          ? prev.groups.filter(
              (id) => id !== groupId
            )
          : [...prev.groups, groupId]
      };
    });
  };

  // =====================================================
  // USER STUDY PREFERENCES
  // =====================================================

  const [myPrefs, setMyPrefs] =
    useState(() => {
      const saved =
        localStorage.getItem(
          'campora_user_prefs'
        );

      return saved
        ? JSON.parse(saved)
        : {
            major: 'Computer Science',
            env: 'Library Soft',
            style: 'Silent',
            mode: 'In-person',
            goal: 'Exam Prep'
          };
    });

  // =====================================================
  // NEW GROUP
  // =====================================================

  const [newGroup, setNewGroup] =
    useState({
      name: '',
      subject: '',
      environment: 'Library Soft',
      study_style: 'Silent',
      location: '',
      mode: 'In-person',
      color: '#E0F2FE',
      max_size: 4,
      description: '',
      major: 'All Majors Welcome',
      goal: 'Exam Prep'
    });

  const pastelColors = [
    { bg: '#E0F2FE', name: 'Blue' },
    { bg: '#FCE7F3', name: 'Pink' },
    { bg: '#F3E8FF', name: 'Purple' },
    { bg: '#DCFCE7', name: 'Green' },
    { bg: '#FEE2E2', name: 'Red' },
    { bg: '#FFEDD5', name: 'Yellow' },
    { bg: '#E2E8F0', name: 'Slate' },
    { bg: '#D1FAE5', name: 'Mint' },
    { bg: '#FEF3C7', name: 'Sand' },
    { bg: '#E0E7FF', name: 'Periwinkle' },
    { bg: '#CFFAFE', name: 'Cyan' },
    { bg: '#0B1A3F', name: 'Navy' },
    { bg: '#1E293B', name: 'Charcoal' },
    { bg: '#374151', name: 'Graphite' },
    { bg: '#4C1D95', name: 'Deep Purple' },
    { bg: '#065F46', name: 'Forest Green' },
    { bg: '#0F766E', name: 'Teal' },
    { bg: '#78350F', name: 'Brown' },
    { bg: '#7C2D12', name: 'Rust' },
    { bg: '#1F2937', name: 'Steel' }
  ];

  // =====================================================
  // FETCH STUDY GROUP DATA
  // =====================================================

  const fetchData = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
        error: sessionError
      } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.error(
          'Session error:',
          sessionError
        );
      }

      const user =
        session?.user || null;

      setCurrentUser(user);

      const {
        data: groupsData,
        error: groupsError
      } = await supabase
        .from('study_groups')
        .select(
          '*, group_members (user_id)'
        )
        .order('created_at', {
          ascending: false
        });

      if (groupsError) {
        console.error(
          'Study groups error:',
          groupsError
        );

        setGroups([]);

        return;
      }

      setGroups(groupsData || []);

      if (user) {
        const {
          data: memberData,
          error: memberError
        } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);

        if (memberError) {
          console.error(
            'Group membership error:',
            memberError
          );
        }

        setJoinedGroupIds(
          memberData?.map(
            (member) => member.group_id
          ) || []
        );
      } else {
        setJoinedGroupIds([]);
      }
    } catch (error) {
      console.error(
        'Error loading Study Groups:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    localStorage.setItem(
      'campora_user_prefs',
      JSON.stringify(myPrefs)
    );
  }, [myPrefs]);

  useEffect(() => {
    const {
      data: { subscription }
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          setCurrentUser(
            session?.user || null
          );

          if (session?.user) {
            fetchData();
          }
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'campora_study_groups_view',
      view
    );
  }, [view]);

  // =====================================================
  // FETCH GROUP MEMBERS + GROUP CHAT
  // =====================================================

  useEffect(() => {
    if (!selectedGroup?.id) return;

    const fetchMembers = async () => {
      const {
        data: dbMembers,
        error: memberError
      } = await supabase
        .from('group_members')
        .select('user_id')
        .eq(
          'group_id',
          selectedGroup.id
        );

      if (memberError) {
        console.error(
          'Could not load members:',
          memberError
        );
      }

      const memberUserIds =
        new Set(
          (dbMembers || []).map(
            (m) => m.user_id
          )
        );

      if (selectedGroup.creator_id) {
        memberUserIds.add(
          selectedGroup.creator_id
        );
      }

      const userIdsArray =
        Array.from(
          memberUserIds
        ).filter(Boolean);

      if (
        userIdsArray.length === 0
      ) {
        setGroupMembers([]);
        return;
      }

      const {
        data: fetchedProfiles
      } = await supabase
        .from('profiles')
        .select(
          'id, full_name, major, academic_year, email'
        )
        .in('id', userIdsArray);

      const profileMap =
        new Map();

      (fetchedProfiles || []).forEach(
        (profile) =>
          profileMap.set(
            profile.id,
            profile
          )
      );

      const {
        data: recentMessages
      } = await supabase
        .from('group_messages')
        .select(
          'user_id, sender_name'
        )
        .eq(
          'group_id',
          selectedGroup.id
        );

      const messageNameMap =
        new Map();

      (recentMessages || []).forEach(
        (msg) => {
          if (
            msg.user_id &&
            msg.sender_name
          ) {
            messageNameMap.set(
              msg.user_id,
              msg.sender_name
            );
          }
        }
      );

      const resolvedMembers =
        userIdsArray.map((uid) => {
          const isSelf =
            currentUser &&
            uid === currentUser.id;

          const profile =
            profileMap.get(uid);

          const nameFromChat =
            messageNameMap.get(uid);

          let resolvedName =
            profile?.full_name;

          if (!resolvedName) {
            if (isSelf) {
              resolvedName =
                currentUser
                  ?.user_metadata
                  ?.full_name ||
                currentUser
                  ?.email
                  ?.split('@')[0] ||
                'You';
            } else if (
              nameFromChat
            ) {
              resolvedName =
                nameFromChat;
            } else if (
              profile?.email
            ) {
              resolvedName =
                profile.email.split(
                  '@'
                )[0];
            } else {
              resolvedName =
                uid ===
                selectedGroup.creator_id
                  ? 'Circle Creator'
                  : 'Circle Member';
            }
          }

          return {
            user_id: uid,

            profiles: {
              full_name:
                resolvedName,

              email:
                profile?.email ||
                (isSelf
                  ? currentUser?.email
                  : ''),

              major:
                profile?.major ||
                (isSelf
                  ? myPrefs.major
                  : 'Not specified'),

              academic_year:
                profile?.academic_year ||
                (isSelf
                  ? 'Senior'
                  : 'Not specified')
            },

            isOnline:
              isSelf ||
              Math.random() > 0.3
          };
        });

      setGroupMembers(
        resolvedMembers
      );
    };

    fetchMembers();

    const isMember =
      joinedGroupIds.includes(
        selectedGroup.id
      ) ||
      selectedGroup.creator_id ===
        currentUser?.id;

    if (
      isMember &&
      (view === 'details' ||
        view === 'chat')
    ) {
      const fetchMessages =
        async () => {
          const {
            data,
            error
          } = await supabase
            .from(
              'group_messages'
            )
            .select('*')
            .eq(
              'group_id',
              selectedGroup.id
            )
            .order('created_at', {
              ascending: true
            });

          if (error) {
            console.error(
              'Could not load messages:',
              error
            );

            return;
          }

          setMessages(
            data || []
          );
        };

      fetchMessages();

      const channel =
        supabase
          .channel(
            `group_messages_${selectedGroup.id}`
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table:
                'group_messages',
              filter: `group_id=eq.${selectedGroup.id}`
            },
            () => {
              fetchMessages();
            }
          )
          .subscribe();

      return () => {
        supabase.removeChannel(
          channel
        );
      };
    } else {
      setMessages([]);
    }
  }, [
    selectedGroup?.id,
    view,
    currentUser,
    joinedGroupIds
  ]);

  useEffect(() => {
    if (view === 'chat') {
      chatBottomRef.current?.scrollIntoView(
        {
          behavior: 'smooth'
        }
      );
    }
  }, [messages, view]);

  // =====================================================
  // DIRECT MESSAGE CONVERSATIONS
  // =====================================================

  const fetchDirectMessageConversations =
    async () => {
      if (!currentUser) return;

      const {
        data: dms,
        error
      } = await supabase
        .from('direct_messages')
        .select('*')
        .or(
          `sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`
        )
        .order('created_at', {
          ascending: false
        });

      if (error) {
        console.error(
          'Could not load direct messages:',
          error
        );

        return;
      }

      if (!dms) return;

      const partnerIds =
        new Set();

      dms.forEach((m) => {
        if (
          m.sender_id !==
          currentUser.id
        ) {
          partnerIds.add(
            m.sender_id
          );
        }

        if (
          m.receiver_id !==
          currentUser.id
        ) {
          partnerIds.add(
            m.receiver_id
          );
        }
      });

      const partnerIdsArray =
        Array.from(partnerIds);

      if (
        partnerIdsArray.length === 0
      ) {
        setDmConversations([]);

        return;
      }

      const {
        data: partnerProfiles
      } = await supabase
        .from('profiles')
        .select(
          'id, full_name, email, major, academic_year'
        )
        .in(
          'id',
          partnerIdsArray
        );

      const profileMap =
        new Map();

      (
        partnerProfiles || []
      ).forEach((profile) =>
        profileMap.set(
          profile.id,
          profile
        )
      );

      const conversationList =
        partnerIdsArray.map(
          (pid) => {
            const prof =
              profileMap.get(pid);

            const lastMsg =
              dms.find(
                (m) =>
                  m.sender_id ===
                    pid ||
                  m.receiver_id ===
                    pid
              );

            return {
              partnerId: pid,

              name:
                prof?.full_name ||
                prof?.email?.split(
                  '@'
                )[0] ||
                'Student',

              email:
                prof?.email || '',

              major:
                prof?.major ||
                'Not specified',

              academic_year:
                prof?.academic_year ||
                'Not specified',

              lastMessage:
                lastMsg?.content ||
                '',

              lastMessageTime:
                lastMsg?.created_at
            };
          }
        );

      setDmConversations(
        conversationList
      );
    };

  useEffect(() => {
    if (view === 'dms') {
      fetchDirectMessageConversations();
    }
  }, [view, currentUser]);

  // =====================================================
  // INDIVIDUAL DM CHAT
  // =====================================================

  useEffect(() => {
    if (
      !selectedDmUser ||
      !currentUser
    ) {
      return;
    }

    const fetchDmMessages =
      async () => {
        const {
          data,
          error
        } = await supabase
          .from(
            'direct_messages'
          )
          .select('*')
          .or(
            `and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedDmUser.partnerId}),and(sender_id.eq.${selectedDmUser.partnerId},receiver_id.eq.${currentUser.id})`
          )
          .order('created_at', {
            ascending: true
          });

        if (error) {
          console.error(
            'Could not load DM conversation:',
            error
          );

          return;
        }

        setDmMessages(
          data || []
        );
      };

    fetchDmMessages();

    const channel =
      supabase
        .channel(
          `direct_messages_${currentUser.id}_${selectedDmUser.partnerId}`
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table:
              'direct_messages'
          },
          () => {
            fetchDmMessages();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [
    selectedDmUser,
    currentUser
  ]);

  // =====================================================
  // SEARCH STUDENTS FOR DM
  // =====================================================

  useEffect(() => {
    if (view !== 'dms') return;

    const query =
      dmSearchQuery.trim();

    if (!query) {
      setDmSearchResults([]);
      setSearchingUsers(false);

      return;
    }

    setSearchingUsers(true);

    const timeout =
      setTimeout(async () => {
        let request =
          supabase
            .from('profiles')
            .select(
              'id, full_name, email, major, academic_year'
            )
            .or(
              `full_name.ilike.%${query}%,email.ilike.%${query}%`
            )
            .limit(15);

        if (currentUser?.id) {
          request =
            request.neq(
              'id',
              currentUser.id
            );
        }

        const {
          data,
          error
        } = await request;

        if (error) {
          console.error(
            'Student search error:',
            error
          );
        } else {
          setDmSearchResults(
            data || []
          );
        }

        setSearchingUsers(false);
      }, 300);

    return () =>
      clearTimeout(timeout);
  }, [
    dmSearchQuery,
    view,
    currentUser
  ]);

  const startNewDmWithUser = (
    profile
  ) => {
    const existingConv =
      dmConversations.find(
        (conversation) =>
          conversation.partnerId ===
          profile.id
      );

    if (existingConv) {
      setSelectedDmUser(
        existingConv
      );
    } else {
      setSelectedDmUser({
        partnerId: profile.id,

        name:
          profile.full_name ||
          profile.email?.split(
            '@'
          )[0] ||
          'Student',

        email:
          profile.email || '',

        major:
          profile.major ||
          'Not specified',

        academic_year:
          profile.academic_year ||
          'Not specified',

        lastMessage: '',

        lastMessageTime: null
      });
    }

    setDmSearchQuery('');
    setDmSearchResults([]);
  };

  const openMemberChat = (
    member
  ) => {
    if (
      !member ||
      member.user_id ===
        currentUser?.id
    ) {
      return;
    }

    startNewDmWithUser({
      id: member.user_id,

      full_name:
        member.profiles
          ?.full_name,

      email:
        member.profiles?.email,

      major:
        member.profiles?.major,

      academic_year:
        member.profiles
          ?.academic_year
    });

    setView('dms');
  };

  const toggleNotifications = (
    groupId
  ) => {
    setNotificationsMuted(
      (prev) => ({
        ...prev,

        [groupId]:
          !prev[groupId]
      })
    );
  };

  // =====================================================
  // CREATE GROUP
  // =====================================================

  const handleCreate = async (
    e
  ) => {
    e.preventDefault();

    setActionLoading(true);

    try {
      const {
        data: { user },
        error: userError
      } =
        await supabase.auth.getUser();

      if (userError) {
        console.error(
          'User error:',
          userError
        );
      }

      if (!user) {
        alert(
          'You must be logged in to create a study circle.'
        );

        return;
      }

      const {
        data,
        error
      } = await supabase
        .from('study_groups')
        .insert([
          {
            ...newGroup,

            creator_id:
              user.id,

            approval_status:
              'pending'
          }
        ])
        .select();

      if (error) {
        console.error(
          'CREATE CIRCLE ERROR:',
          error
        );

        alert(
          `Could not submit your study circle: ${error.message}`
        );

        return;
      }

      if (
        data &&
        data.length > 0
      ) {
        setNewGroup({
          name: '',
          subject: '',
          environment:
            'Library Soft',
          study_style: 'Silent',
          location: '',
          mode: 'In-person',
          color: '#E0F2FE',
          max_size: 4,
          description: '',
          major:
            'All Majors Welcome',
          goal: 'Exam Prep'
        });

        await fetchData();

        setView('created');

        alert(
          'Your study circle has been submitted for review! ✨\n\nThe Campora team will review it before it appears publicly.'
        );
      }
    } catch (error) {
      console.error(
        'CREATE GROUP ERROR:',
        error
      );

      alert(
        `Something went wrong: ${
          error?.message ||
          'Please try again.'
        }`
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // EDIT GROUP
  // =====================================================

  const handleUpdateGroup =
    async (e) => {
      e.preventDefault();

      if (!editingGroup) return;

      setActionLoading(true);

      const {
        error
      } = await supabase
        .from('study_groups')
        .update({
          name:
            editingGroup.name,

          major:
            editingGroup.major,

          goal:
            editingGroup.goal,

          environment:
            editingGroup.environment,

          mode:
            editingGroup.mode,

          max_size:
            editingGroup.max_size,

          description:
            editingGroup.description,

          color:
            editingGroup.color,

          approval_status:
            'pending'
        })
        .eq(
          'id',
          editingGroup.id
        );

      if (error) {
        console.error(
          'UPDATE GROUP ERROR:',
          error
        );

        alert(
          `Could not update circle: ${error.message}`
        );
      } else {
        setSelectedGroup({
          ...editingGroup,
          approval_status:
            'pending'
        });

        setEditingGroup(null);

        await fetchData();
      }

      setActionLoading(false);
    };

  // =====================================================
  // DELETE GROUP
  // =====================================================

  const handleDeleteGroup =
    async (groupId, e) => {
      if (e) {
        e.stopPropagation();
      }

      if (
        !window.confirm(
          'Are you sure you want to delete this study group? This action cannot be undone.'
        )
      ) {
        return;
      }

      setActionLoading(true);

      const {
        error
      } = await supabase
        .from('study_groups')
        .delete()
        .eq('id', groupId);

      if (error) {
        console.error(
          'DELETE GROUP ERROR:',
          error
        );

        alert(
          `Could not delete circle: ${error.message}`
        );
      } else {
        setPinnedChats(
          (prev) => ({
            ...prev,

            groups:
              prev.groups.filter(
                (id) =>
                  id !== groupId
              )
          })
        );

        setPinnedGroupMessages(
          (prev) => {
            const updated = {
              ...prev
            };

            delete updated[
              groupId
            ];

            return updated;
          }
        );

        if (
          selectedGroup?.id ===
          groupId
        ) {
          setSelectedGroup(null);

          setView('browse');
        }

        await fetchData();
      }

      setActionLoading(false);
    };

  // =====================================================
  // JOIN GROUP
  // =====================================================

  const handleJoin = async (
    groupId
  ) => {
    const group =
      groups.find(
        (g) =>
          g.id === groupId
      );

    if (
      !group ||
      group.approval_status !==
        'approved'
    ) {
      alert(
        'This study circle is not available to join yet.'
      );

      return;
    }

    if (
      getGroupMemberCount(
        group
      ) >= group.max_size
    ) {
      alert(
        'This study circle is already full.'
      );

      return;
    }

    setActionLoading(true);

    const {
      data: { user }
    } =
      await supabase.auth.getUser();

    if (user) {
      const {
        error
      } = await supabase
        .from('group_members')
        .insert([
          {
            group_id:
              groupId,

            user_id:
              user.id
          }
        ]);

      if (error) {
        if (
          error.code !==
          '23505'
        ) {
          console.error(
            'JOIN GROUP ERROR:',
            error
          );

          alert(
            `Could not join circle: ${error.message}`
          );
        }
      }

      await fetchData();

      setView('joined');
    }

    setActionLoading(false);
  };

  // =====================================================
  // LEAVE GROUP
  // =====================================================

  const handleLeaveGroup =
    async (groupId) => {
      if (!currentUser) return;

      if (
        !window.confirm(
          "Are you sure you want to leave this study circle? You'll need to rejoin to see its chat again."
        )
      ) {
        return;
      }

      setActionLoading(true);

      const {
        error
      } = await supabase
        .from('group_members')
        .delete()
        .eq(
          'group_id',
          groupId
        )
        .eq(
          'user_id',
          currentUser.id
        );

      if (error) {
        console.error(
          'LEAVE GROUP ERROR:',
          error
        );

        alert(
          `Could not leave the circle: ${error.message}`
        );
      } else {
        setPinnedChats(
          (prev) => ({
            ...prev,

            groups:
              prev.groups.filter(
                (id) =>
                  id !== groupId
              )
          })
        );

        setView('joined');

        setSelectedGroup(null);

        await fetchData();
      }

      setActionLoading(false);
    };

  // =====================================================
  // SEND GROUP MESSAGE
  // FIXED REPLY SUPPORT
  // =====================================================

  const handleSendMessage =
    async (e) => {
      e.preventDefault();

      const trimmed =
        newMessage.trim();

      if (
        !trimmed ||
        !selectedGroup ||
        !currentUser
      ) {
        return;
      }

      const senderName =
        currentUser
          .user_metadata
          ?.full_name ||
        currentUser.email?.split(
          '@'
        )[0] ||
        'Student';

      const tempId =
        `temp-${Date.now()}`;

      const replySnapshot =
        replyingTo;

      const replyPayload =
        replySnapshot
          ? {
              reply_to_id:
                String(
                  replySnapshot.id
                ),

              reply_to_sender:
                replySnapshot.sender_name ||
                'Student',

              reply_to_content:
                replySnapshot.type ===
                'poll'
                  ? replySnapshot
                      .poll_data
                      ?.question ||
                    ''
                  : replySnapshot.content ||
                    ''
            }
          : {
              reply_to_id: null,

              reply_to_sender:
                null,

              reply_to_content:
                null
            };

      const optimisticMessage =
        {
          id: tempId,

          group_id:
            selectedGroup.id,

          user_id:
            currentUser.id,

          sender_name:
            senderName,

          content: trimmed,

          type: 'text',

          reactions: {},

          created_at:
            new Date().toISOString(),

          ...replyPayload
        };

      setMessages((prev) => [
        ...prev,
        optimisticMessage
      ]);

      setNewMessage('');

      setReplyingTo(null);

      const {
        data,
        error
      } = await supabase
        .from('group_messages')
        .insert([
          {
            group_id:
              selectedGroup.id,

            user_id:
              currentUser.id,

            sender_name:
              senderName,

            content:
              trimmed,

            type: 'text',

            reactions: {},

            ...replyPayload
          }
        ])
        .select()
        .single();

      if (error) {
        console.error(
          'MESSAGE SEND ERROR:',
          error
        );

        setMessages((prev) =>
          prev.filter(
            (message) =>
              message.id !==
              tempId
          )
        );

        setNewMessage(
          trimmed
        );

        setReplyingTo(
          replySnapshot
        );

        alert(
          `Message failed to send: ${error.message}`
        );

        return;
      }

      if (data) {
        setMessages(
          (prev) => {
            const withoutTemp =
              prev.filter(
                (message) =>
                  message.id !==
                  tempId &&
                  message.id !==
                    data.id
              );

            return [
              ...withoutTemp,
              data
            ].sort(
              (a, b) =>
                new Date(
                  a.created_at
                ) -
                new Date(
                  b.created_at
                )
            );
          }
        );
      }
    };

  // =====================================================
  // SEND DM FROM MEMBER PROFILE
  // =====================================================

  const handleSendDirectMessage =
    async () => {
      if (
        !directChatMessage.trim() ||
        !selectedMember ||
        !currentUser
      ) {
        return;
      }

      const {
        error
      } = await supabase
        .from('direct_messages')
        .insert([
          {
            sender_id:
              currentUser.id,

            receiver_id:
              selectedMember.user_id,

            content:
              directChatMessage.trim()
          }
        ]);

      if (error) {
        console.error(
          'DM ERROR:',
          error
        );

        alert(
          `Direct message failed: ${error.message}`
        );

        return;
      }

      setDirectChatMessage('');

      setShowDMChat(false);

      setSelectedMember(null);

      fetchDirectMessageConversations();

      alert(
        'Direct message sent!'
      );
    };

  // =====================================================
  // SEND DM IN INBOX
  // =====================================================

  const handleSendDmInInbox =
    async (e) => {
      e.preventDefault();

      const trimmed =
        newDmMessageText.trim();

      if (
        !trimmed ||
        !selectedDmUser ||
        !currentUser
      ) {
        return;
      }

      const {
        data,
        error
      } = await supabase
        .from('direct_messages')
        .insert([
          {
            sender_id:
              currentUser.id,

            receiver_id:
              selectedDmUser.partnerId,

            content:
              trimmed
          }
        ])
        .select()
        .single();

      if (error) {
        console.error(
          'DM SEND ERROR:',
          error
        );

        alert(
          `Message failed to send: ${error.message}`
        );

        return;
      }

      setNewDmMessageText('');

      if (data) {
        setDmMessages(
          (prev) => {
            if (
              prev.some(
                (message) =>
                  message.id ===
                  data.id
              )
            ) {
              return prev;
            }

            return [
              ...prev,
              data
            ];
          }
        );
      }

      fetchDirectMessageConversations();
    };

  // =====================================================
  // DELETE MESSAGE
  // =====================================================

  const handleDeleteMessage =
    async (msgId) => {
      if (
        String(msgId).startsWith(
          'temp-'
        )
      ) {
        return;
      }

      const {
        error
      } = await supabase
        .from('group_messages')
        .delete()
        .eq('id', msgId);

      if (error) {
        console.error(
          'DELETE MESSAGE ERROR:',
          error
        );

        alert(
          `Could not delete message: ${error.message}`
        );

        return;
      }

      setMessages((prev) =>
        prev.filter(
          (m) => m.id !== msgId
        )
      );

      setPinnedGroupMessages(
        (prev) => {
          if (!selectedGroup) {
            return prev;
          }

          return {
            ...prev,

            [selectedGroup.id]:
              (
                prev[
                  selectedGroup.id
                ] || []
              ).filter(
                (id) =>
                  id !== msgId
              )
          };
        }
      );

      setActiveMessageMenu(
        null
      );

      if (
        replyingTo?.id ===
        msgId
      ) {
        setReplyingTo(null);
      }
    };

  // =====================================================
  // CLEAR CHAT
  // =====================================================

  const handleClearChat =
    async () => {
      if (!selectedGroup) return;

      if (
        !window.confirm(
          'Are you sure you want to clear all messages in this group?'
        )
      ) {
        return;
      }

      const {
        error
      } = await supabase
        .from('group_messages')
        .delete()
        .eq(
          'group_id',
          selectedGroup.id
        );

      if (error) {
        console.error(
          'CLEAR CHAT ERROR:',
          error
        );

        alert(
          `Could not clear chat: ${error.message}`
        );

        return;
      }

      setMessages([]);

      setReplyingTo(null);

      setPinnedGroupMessages(
        (prev) => ({
          ...prev,

          [selectedGroup.id]:
            []
        })
      );
    };

  // =====================================================
  // MESSAGE REACTIONS
  // =====================================================

  const handleReactToMessage =
    async (
      msgId,
      emoji
    ) => {
      const target =
        messages.find(
          (m) =>
            m.id === msgId
        );

      if (
        !target ||
        !currentUser ||
        String(
          msgId
        ).startsWith(
          'temp-'
        )
      ) {
        return;
      }

      const existingReactions =
        target.reactions || {};

      const usersWhoReacted =
        existingReactions[
          emoji
        ] || [];

      const updatedUsers =
        usersWhoReacted.includes(
          currentUser.id
        )
          ? usersWhoReacted.filter(
              (id) =>
                id !==
                currentUser.id
            )
          : [
              ...usersWhoReacted,
              currentUser.id
            ];

      const updatedReactions =
        {
          ...existingReactions,

          [emoji]:
            updatedUsers
        };

      setMessages((prev) =>
        prev.map((message) =>
          message.id === msgId
            ? {
                ...message,
                reactions:
                  updatedReactions
              }
            : message
        )
      );

      const {
        error
      } = await supabase
        .from('group_messages')
        .update({
          reactions:
            updatedReactions
        })
        .eq('id', msgId);

      if (error) {
        console.error(
          'REACTION ERROR:',
          error
        );

        setMessages((prev) =>
          prev.map(
            (message) =>
              message.id ===
              msgId
                ? target
                : message
          )
        );

        alert(
          `Could not save reaction: ${error.message}`
        );
      }

      setActiveMessageMenu(
        null
      );
    };

  // =====================================================
  // CREATE POLL
  // =====================================================

  const handleCreatePoll =
    async (e) => {
      e.preventDefault();

      const validOptions =
        pollOptions
          .map((option) =>
            option.trim()
          )
          .filter(Boolean);

      if (
        !pollQuestion.trim() ||
        validOptions.length <
          2 ||
        !selectedGroup ||
        !currentUser
      ) {
        return;
      }

      const senderName =
        currentUser
          .user_metadata
          ?.full_name ||
        currentUser.email?.split(
          '@'
        )[0] ||
        'Student';

      const tempId =
        `temp-poll-${Date.now()}`;

      const pollData = {
        group_id:
          selectedGroup.id,

        user_id:
          currentUser.id,

        sender_name:
          senderName,

        content:
          pollQuestion.trim(),

        type: 'poll',

        reactions: {},

        poll_data: {
          question:
            pollQuestion.trim(),

          options:
            validOptions.map(
              (option) => ({
                text: option,
                votes: []
              })
            )
        }
      };

      setMessages((prev) => [
        ...prev,

        {
          ...pollData,

          id: tempId,

          created_at:
            new Date().toISOString()
        }
      ]);

      const originalQuestion =
        pollQuestion;

      const originalOptions =
        [...pollOptions];

      setPollQuestion('');

      setPollOptions(['', '']);

      setShowPollModal(false);

      const {
        data,
        error
      } = await supabase
        .from('group_messages')
        .insert([pollData])
        .select()
        .single();

      if (error) {
        console.error(
          'POLL ERROR:',
          error
        );

        setMessages((prev) =>
          prev.filter(
            (m) =>
              m.id !== tempId
          )
        );

        setPollQuestion(
          originalQuestion
        );

        setPollOptions(
          originalOptions
        );

        alert(
          `Poll failed to post: ${error.message}`
        );

        return;
      }

      if (data) {
        setMessages(
          (prev) => {
            const withoutTemp =
              prev.filter(
                (message) =>
                  message.id !==
                  tempId &&
                  message.id !==
                    data.id
              );

            return [
              ...withoutTemp,
              data
            ].sort(
              (a, b) =>
                new Date(
                  a.created_at
                ) -
                new Date(
                  b.created_at
                )
            );
          }
        );
      }
    };

  // =====================================================
  // VOTE POLL
  // =====================================================

  const handleVotePoll =
    async (
      msgId,
      optionIndex
    ) => {
      const target =
        messages.find(
          (m) =>
            m.id === msgId
        );

      if (
        !target ||
        !target.poll_data ||
        !currentUser ||
        String(
          msgId
        ).startsWith(
          'temp-'
        )
      ) {
        return;
      }

      const clickedOption =
        target.poll_data
          .options[
          optionIndex
        ];

      const alreadyVotedForThisOption =
        (
          clickedOption?.votes ||
          []
        ).includes(
          currentUser.id
        );

      const updatedOptions =
        target.poll_data.options.map(
          (opt, idx) => {
            const filteredVotes =
              (
                opt.votes || []
              ).filter(
                (id) =>
                  id !==
                  currentUser.id
              );

            if (
              idx ===
                optionIndex &&
              !alreadyVotedForThisOption
            ) {
              filteredVotes.push(
                currentUser.id
              );
            }

            return {
              ...opt,

              votes:
                filteredVotes
            };
          }
        );

      const updatedPollData =
        {
          ...target.poll_data,

          options:
            updatedOptions
        };

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,

                poll_data:
                  updatedPollData
              }
            : m
        )
      );

      const {
        error
      } = await supabase
        .from('group_messages')
        .update({
          poll_data:
            updatedPollData
        })
        .eq('id', msgId);

      if (error) {
        console.error(
          'VOTE ERROR:',
          error
        );

        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? target
              : m
          )
        );

        alert(
          `Could not save vote: ${error.message}`
        );
      }
    };

  // =====================================================
  // MATCHING
  // =====================================================

  const calculateMatch = (
    group
  ) => {
    let score = 0;

    if (
      group.major ===
        'All Majors Welcome' ||
      group.major ===
        myPrefs.major
    ) {
      score += 30;
    }

    if (
      group.goal ===
      myPrefs.goal
    ) {
      score += 20;
    }

    if (
      group.environment ===
      myPrefs.env
    ) {
      score += 20;
    }

    if (
      group.study_style ===
      myPrefs.style
    ) {
      score += 15;
    }

    if (
      group.mode ===
      myPrefs.mode
    ) {
      score += 15;
    }

    return Math.min(
      score,
      100
    );
  };

  const discoverGroups =
    groups.filter((g) => {
      const isApproved =
        g.approval_status ===
        'approved';

      const query =
        searchQuery.toLowerCase();

      const matchesSearch =
        (g.name || '')
          .toLowerCase()
          .includes(query) ||
        (g.subject || '')
          .toLowerCase()
          .includes(query) ||
        (g.major || '')
          .toLowerCase()
          .includes(query);

      return (
        isApproved &&
        matchesSearch
      );
    });

  const createdGroups =
    groups.filter(
      (g) =>
        g.creator_id ===
        currentUser?.id
    );

  const joinedOnlyGroups =
    groups.filter(
      (g) =>
        g.approval_status ===
          'approved' &&
        joinedGroupIds.includes(
          g.id
        ) &&
        g.creator_id !==
          currentUser?.id
    );

  const sortGroupsWithPins = (
    list
  ) => {
    return [...list].sort(
      (a, b) => {
        const aPinned =
          pinnedChats.groups.includes(
            a.id
          );

        const bPinned =
          pinnedChats.groups.includes(
            b.id
          );

        if (
          aPinned ===
          bPinned
        ) {
          return 0;
        }

        return aPinned
          ? -1
          : 1;
      }
    );
  };

  const sortedDmConversations =
    [...dmConversations].sort(
      (a, b) => {
        const aPinned =
          pinnedChats.dms.includes(
            a.partnerId
          );

        const bPinned =
          pinnedChats.dms.includes(
            b.partnerId
          );

        if (
          aPinned ===
          bPinned
        ) {
          return 0;
        }

        return aPinned
          ? -1
          : 1;
      }
    );

  const getGroupMemberCount = (
    group
  ) => {
    if (
      selectedGroup?.id ===
        group.id &&
      groupMembers.length > 0
    ) {
      return groupMembers.length;
    }

    const memberSet =
      new Set(
        group.group_members?.map(
          (m) => m.user_id
        ) || []
      );

    if (group.creator_id) {
      memberSet.add(
        group.creator_id
      );
    }

    return Math.max(
      memberSet.size,
      1
    );
  };

  const getActiveOnlineCount =
    () => {
      return groupMembers.filter(
        (m) => m.isOnline
      ).length;
    };

  // =====================================================
  // STYLES
  // =====================================================

  const tagStyle = {
    padding: '4px 10px',

    borderRadius: '8px',

    background:
      'rgba(255,255,255,0.8)',

    fontSize: '11px',

    fontWeight: '800',

    color: '#0B1A3F',

    textTransform:
      'uppercase'
  };

  const iconBtnStyle = {
    background:
      'rgba(255,255,255,0.7)',

    border: 'none',

    padding: '8px',

    borderRadius: '10px',

    cursor: 'pointer',

    display: 'flex',

    alignItems: 'center',

    justifyContent:
      'center'
  };

  const activeTab = {
    padding:
      '10px 18px',

    borderRadius: '12px',

    border: 'none',

    background:
      '#0B1A3F',

    color: 'white',

    fontWeight: '800',

    fontSize: '13px',

    cursor: 'pointer',

    display: 'flex',

    alignItems: 'center',

    gap: '8px'
  };

  const inactiveTab = {
    padding:
      '10px 18px',

    borderRadius: '12px',

    border: 'none',

    background:
      '#F4F7FE',

    color: '#A3AED0',

    fontWeight: '800',

    fontSize: '13px',

    cursor: 'pointer',

    display: 'flex',

    alignItems: 'center',

    gap: '8px'
  };

  const addBtnStyle = {
    padding:
      '12px 22px',

    borderRadius: '16px',

    border: 'none',

    background:
      '#0B1A3F',

    color: 'white',

    fontWeight: '900',

    fontSize: '14px',

    cursor: 'pointer',

    display: 'flex',

    alignItems: 'center',

    gap: '8px',

    boxShadow:
      '0 8px 16px rgba(11,26,63,0.2)'
  };

  const searchBarContainer = {
    display: 'flex',

    alignItems: 'center',

    gap: '12px',

    background: 'white',

    padding:
      '12px 20px',

    borderRadius: '18px',

    border:
      '1.5px solid #E9EDF7',

    marginBottom: '30px'
  };

  const searchField = {
    border: 'none',

    outline: 'none',

    width: '100%',

    fontWeight: '700',

    fontSize: '14px',

    color: '#0B1A3F'
  };

  const formSectionStyle = {
    display: 'flex',

    flexDirection:
      'column',

    gap: '8px'
  };

  const labelStyle = {
    fontSize: '11px',

    fontWeight: '900',

    color: '#A3AED0',

    letterSpacing:
      '0.5px'
  };

  const inputStyle = {
    padding:
      '12px 16px',

    borderRadius: '12px',

    border:
      '1.5px solid #E2E8F0',

    fontSize: '14px',

    fontWeight: '700',

    color: '#0B1A3F',

    outline: 'none',

    background:
      '#F8FAFC',

    boxSizing:
      'border-box'
  };

  const chipGridStyle = {
    display: 'flex',

    flexWrap: 'wrap',

    gap: '8px'
  };

  const chipStyle = {
    padding:
      '8px 16px',

    borderRadius: '10px',

    border:
      '1.5px solid #E2E8F0',

    background:
      '#F8FAFC',

    color: '#64748B',

    fontSize: '12px',

    fontWeight: '800',

    cursor: 'pointer'
  };

  const activeChipStyle = {
    ...chipStyle,

    background:
      '#0B1A3F',

    color: 'white',

    borderColor:
      '#0B1A3F'
  };

  const saveBtn = {
    padding:
      '14px 24px',

    borderRadius: '14px',

    border: 'none',

    background:
      '#0B1A3F',

    color: 'white',

    fontWeight: '900',

    fontSize: '14px',

    cursor: 'pointer'
  };

  const backBtn = {
    display: 'flex',

    alignItems: 'center',

    gap: '6px',

    border: 'none',

    background: 'none',

    color: '#A3AED0',

    fontWeight: '800',

    cursor: 'pointer',

    fontSize: '13px'
  };

  const overlay = {
    position: 'fixed',

    top: 0,

    left: 0,

    right: 0,

    bottom: 0,

    background:
      'rgba(11,26,63,0.5)',

    display: 'flex',

    alignItems: 'center',

    justifyContent:
      'center',

    zIndex: 1000,

    padding: '20px'
  };

  // =====================================================
  // GROUP CARD COMPONENT
  // =====================================================

  const GroupCard = ({
    group,
    buttonLabel
  }) => {
    const match =
      calculateMatch(group);

    const count =
      getGroupMemberCount(
        group
      );

    const isCreator =
      group.creator_id ===
      currentUser?.id;

    const isMember =
      isCreator ||
      joinedGroupIds.includes(
        group.id
      );

    const isPinned =
      pinnedChats.groups.includes(
        group.id
      );

    const approvalStatus =
      group.approval_status ||
      'pending';

    const statusStyles = {
      pending: {
        background:
          '#FFF7E6',

        border:
          '#F6D48B',

        color:
          '#B7791F',

        label:
          'Pending Review'
      },

      approved: {
        background:
          '#ECFBF6',

        border:
          '#BDEDDD',

        color:
          '#008D68',

        label: 'Approved'
      },

      rejected: {
        background:
          '#FFF0F0',

        border:
          '#F6CACA',

        color:
          '#D84C4C',

        label:
          'Declined'
      }
    };

    const status =
      statusStyles[
        approvalStatus
      ] ||
      statusStyles.pending;

    return (
      <div
        onClick={() => {
          setSelectedGroup(
            group
          );

          setView(
            'details'
          );
        }}
        style={{
          background:
            '#FFFFFF',

          border:
            '1.5px solid #E5EAF4',

          borderRadius:
            '26px',

          padding: '26px',

          cursor:
            'pointer',

          boxShadow:
            '0 14px 36px rgba(11,26,63,0.06)',

          transition:
            'all 0.2s ease',

          minHeight:
            '330px',

          display: 'flex',

          flexDirection:
            'column'
        }}
      >
        <div
          style={{
            display:
              'flex',

            justifyContent:
              'space-between',

            alignItems:
              'flex-start',

            gap: '16px',

            flexWrap:
              'wrap'
          }}
        >
          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap: '8px',

              flexWrap:
                'wrap'
            }}
          >
            <span
              style={{
                display:
                  'inline-flex',

                alignItems:
                  'center',

                gap: '6px',

                padding:
                  '7px 11px',

                borderRadius:
                  '10px',

                background:
                  '#FFFFFF',

                border:
                  '1.5px solid #DCE3F0',

                color:
                  '#0B1A3F',

                fontSize:
                  '11px',

                fontWeight:
                  '900',

                textTransform:
                  'uppercase'
              }}
            >
              <Users
                size={13}
              />

              {group.major ||
                'All Majors Welcome'}
            </span>

            {isCreator && (
              <span
                style={{
                  display:
                    'inline-flex',

                  alignItems:
                    'center',

                  gap: '6px',

                  padding:
                    '7px 11px',

                  borderRadius:
                    '10px',

                  background:
                    '#0B1A3F',

                  color:
                    '#FFFFFF',

                  fontSize:
                    '11px',

                  fontWeight:
                    '900',

                  textTransform:
                    'uppercase'
                }}
              >
                <Crown
                  size={13}
                />

                Creator
              </span>
            )}

            {isCreator && (
              <span
                style={{
                  display:
                    'inline-flex',

                  alignItems:
                    'center',

                  gap: '6px',

                  padding:
                    '7px 11px',

                  borderRadius:
                    '10px',

                  background:
                    status.background,

                  border: `1px solid ${status.border}`,

                  color:
                    status.color,

                  fontSize:
                    '11px',

                  fontWeight:
                    '900',

                  textTransform:
                    'uppercase'
                }}
              >
                <Circle
                  size={10}
                />

                {status.label}
              </span>
            )}
          </div>

          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap: '8px'
            }}
          >
            <div
              style={{
                textAlign:
                  'right',

                marginRight:
                  '4px'
              }}
            >
              <p
                style={{
                  margin: 0,

                  color:
                    '#8F9BB3',

                  fontSize:
                    '9px',

                  fontWeight:
                    '900',

                  letterSpacing:
                    '0.4px'
                }}
              >
                COMPATIBILITY
              </p>

              <p
                style={{
                  margin:
                    '2px 0 0',

                  color:
                    '#0B1A3F',

                  fontSize:
                    '20px',

                  fontWeight:
                    '900'
                }}
              >
                {match}%
              </p>
            </div>

            {isMember && (
              <button
                type="button"
                onClick={(
                  e
                ) => {
                  e.stopPropagation();

                  togglePinGroup(
                    group.id
                  );
                }}
                style={{
                  width:
                    '38px',

                  height:
                    '38px',

                  borderRadius:
                    '11px',

                  border:
                    isPinned
                      ? `1.5px solid ${PIN_COLORS.border}`
                      : '1.5px solid #E3E8F2',

                  background:
                    isPinned
                      ? PIN_COLORS.bg
                      : '#FFFFFF',

                  cursor:
                    'pointer',

                  display:
                    'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center'
                }}
              >
                <Pin
                  size={16}
                  color={
                    isPinned
                      ? PIN_COLORS.icon
                      : '#0B1A3F'
                  }
                  fill={
                    isPinned
                      ? PIN_COLORS.icon
                      : 'none'
                  }
                />
              </button>
            )}

            {isCreator && (
              <>
                <button
                  type="button"
                  onClick={(
                    e
                  ) => {
                    e.stopPropagation();

                    setEditingGroup(
                      group
                    );
                  }}
                  style={{
                    width:
                      '38px',

                    height:
                      '38px',

                    borderRadius:
                      '11px',

                    border:
                      '1.5px solid #E3E8F2',

                    background:
                      '#FFFFFF',

                    cursor:
                      'pointer',

                    display:
                      'flex',

                    alignItems:
                      'center',

                    justifyContent:
                      'center'
                  }}
                >
                  <Edit3
                    size={16}
                    color="#0B1A3F"
                  />
                </button>

                <button
                  type="button"
                  onClick={(
                    e
                  ) =>
                    handleDeleteGroup(
                      group.id,
                      e
                    )
                  }
                  style={{
                    width:
                      '38px',

                    height:
                      '38px',

                    borderRadius:
                      '11px',

                    border:
                      '1px solid #FFD1D1',

                    background:
                      '#FFF0F0',

                    cursor:
                      'pointer',

                    display:
                      'flex',

                    alignItems:
                      'center',

                    justifyContent:
                      'center'
                  }}
                >
                  <Trash2
                    size={16}
                    color="#E5484D"
                  />
                </button>
              </>
            )}
          </div>
        </div>

        <h2
          style={{
            fontSize:
              '27px',

            margin:
              '28px 0 16px',

            color:
              '#0B1A3F',

            fontWeight:
              '900'
          }}
        >
          {group.name}
        </h2>

        <div
          style={{
            width:
              '100%',

            height:
              '1px',

            background:
              '#EDF1F7',

            marginBottom:
              '18px'
          }}
        />

        <div
          style={{
            display:
              'flex',

            flexDirection:
              'column',

            gap: '12px'
          }}
        >
          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap: '10px',

              color:
                '#42506D',

              fontSize:
                '14px'
            }}
          >
            <Target
              size={17}
              color="#0B1A3F"
            />

            <span
              style={{
                fontWeight:
                  '900',

                color:
                  '#0B1A3F'
              }}
            >
              Goal:
            </span>

            <span
              style={{
                fontWeight:
                  '700'
              }}
            >
              {group.goal ||
                'General Study'}
            </span>
          </div>

          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap: '10px',

              color:
                '#42506D',

              fontSize:
                '14px'
            }}
          >
            <Volume2
              size={17}
              color="#0B1A3F"
            />

            <span
              style={{
                fontWeight:
                  '900',

                color:
                  '#0B1A3F'
              }}
            >
              Environment:
            </span>

            <span
              style={{
                fontWeight:
                  '700'
              }}
            >
              {group.environment ||
                'Not specified'}
            </span>
          </div>

          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap: '10px',

              color:
                '#42506D',

              fontSize:
                '14px'
            }}
          >
            <Users
              size={17}
              color="#0B1A3F"
            />

            <span
              style={{
                fontWeight:
                  '900',

                color:
                  '#0B1A3F'
              }}
            >
              Members:
            </span>

            <span
              style={{
                fontWeight:
                  '700'
              }}
            >
              {count} /{' '}
              {group.max_size}
            </span>
          </div>
        </div>

        <div
          style={{
            marginTop:
              'auto',

            paddingTop:
              '26px'
          }}
        >
          {isCreator &&
          approvalStatus ===
            'pending' ? (
            <div
              style={{
                width:
                  '100%',

                padding:
                  '14px 16px',

                borderRadius:
                  '16px',

                background:
                  '#FFF9EE',

                border:
                  '1.5px solid #F4D89A',

                boxSizing:
                  'border-box',

                display:
                  'flex',

                alignItems:
                  'center',

                justifyContent:
                  'space-between',

                gap: '14px'
              }}
            >
              <div
                style={{
                  display:
                    'flex',

                  alignItems:
                    'center',

                  gap: '12px'
                }}
              >
                <div
                  style={{
                    width:
                      '38px',

                    height:
                      '38px',

                    borderRadius:
                      '12px',

                    background:
                      '#FFF0C7',

                    color:
                      '#B7791F',

                    display:
                      'flex',

                    alignItems:
                      'center',

                    justifyContent:
                      'center'
                  }}
                >
                  <Circle
                    size={16}
                  />
                </div>

                <div>
                  <p
                    style={{
                      margin:
                        0,

                      color:
                        '#9A6200',

                      fontSize:
                        '13px',

                      fontWeight:
                        '900'
                    }}
                  >
                    Awaiting
                    Campora
                    Review
                  </p>

                  <p
                    style={{
                      margin:
                        '2px 0 0',

                      color:
                        '#B28A45',

                      fontSize:
                        '11px',

                      fontWeight:
                        '700'
                    }}
                  >
                    Only
                    visible to
                    you until
                    approved.
                  </p>
                </div>
              </div>

              <ArrowRight
                size={17}
                color="#B7791F"
              />
            </div>
          ) : approvalStatus ===
              'rejected' &&
            isCreator ? (
            <div
              style={{
                width:
                  '100%',

                padding:
                  '14px 18px',

                borderRadius:
                  '14px',

                background:
                  '#FFF0F0',

                border:
                  '1.5px solid #F6CACA',

                color:
                  '#D84C4C',

                fontWeight:
                  '900',

                fontSize:
                  '14px',

                display:
                  'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',

                gap: '10px',

                boxSizing:
                  'border-box'
              }}
            >
              <X
                size={16}
              />

              Circle Was Not
              Approved
            </div>
          ) : (
            <button
              type="button"
              style={{
                width:
                  '100%',

                padding:
                  '14px 18px',

                borderRadius:
                  '14px',

                border:
                  'none',

                background:
                  '#0B1A3F',

                color:
                  '#FFFFFF',

                fontWeight:
                  '900',

                fontSize:
                  '14px',

                cursor:
                  'pointer',

                display:
                  'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',

                gap: '9px'
              }}
            >
              {buttonLabel}

              <ArrowRight
                size={17}
              />
            </button>
          )}
        </div>
      </div>
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto'
      }}
    >
      {/* =================================================
          HEADER + ALIGNED NAVIGATION
      ================================================= */}

      {view !== 'chat' && (
        <div
          style={{
            marginBottom:
              '40px'
          }}
        >
          <h1
            style={{
              fontSize:
                '42px',
              fontWeight:
                '900',
              color:
                '#0B1A3F',
              margin: 0
            }}
          >
            Study Groups
          </h1>

          <div
            style={{
              display:
                'flex',
              gap: '12px',
              marginTop:
                '15px',
              flexWrap:
                'wrap',
              alignItems:
                'center'
            }}
          >
            <button
              onClick={() =>
                setView(
                  'browse'
                )
              }
              style={
                view ===
                'browse'
                  ? activeTab
                  : inactiveTab
              }
            >
              <LayoutGrid
                size={16}
              />
              Discover
            </button>

            <button
              onClick={() =>
                setView(
                  'created'
                )
              }
              style={
                view ===
                'created'
                  ? activeTab
                  : inactiveTab
              }
            >
              <Crown
                size={16}
              />
              Circles Created (
              {
                createdGroups.length
              }
              )
            </button>

            <button
              onClick={() =>
                setView(
                  'joined'
                )
              }
              style={
                view ===
                'joined'
                  ? activeTab
                  : inactiveTab
              }
            >
              <BookmarkCheck
                size={16}
              />
              Joined Circles (
              {
                joinedOnlyGroups.length
              }
              )
            </button>

            <button
              onClick={() =>
                setView(
                  'dms'
                )
              }
              style={
                view ===
                'dms'
                  ? activeTab
                  : inactiveTab
              }
            >
              <Mail
                size={16}
              />
              Direct Messages
            </button>

            <button
              onClick={() =>
                setView(
                  'preferences'
                )
              }
              style={
                view ===
                'preferences'
                  ? activeTab
                  : inactiveTab
              }
            >
              <Sliders
                size={16}
              />
              My Vibe Settings
            </button>

            <button
              onClick={() =>
                setView(
                  'create'
                )
              }
              style={
                view ===
                'create'
                  ? activeTab
                  : inactiveTab
              }
            >
              <Plus
                size={16}
              />
              Create Circle
            </button>
          </div>
        </div>
      )}

      {/* =================================================
          REVIEW BANNER
      ================================================= */}

      {view !== 'chat' &&
        view !== 'dms' && (
          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap: '14px',

              padding:
                '16px 18px',

              marginBottom:
                '28px',

              borderRadius:
                '18px',

              background:
                'linear-gradient(135deg,#F3F1FF 0%,#F7FBFF 100%)',

              border:
                '1.5px solid #E2E5FF'
            }}
          >
            <div
              style={{
                width:
                  '42px',

                height:
                  '42px',

                flexShrink:
                  0,

                borderRadius:
                  '14px',

                background:
                  '#E7E3FF',

                color:
                  '#6366F1',

                display:
                  'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',

                fontWeight:
                  '900',

                fontSize:
                  '18px'
              }}
            >
              ✓
            </div>

            <div>
              <p
                style={{
                  margin:
                    '0 0 3px',

                  fontWeight:
                    '900',

                  color:
                    '#0B1A3F',

                  fontSize:
                    '14px'
                }}
              >
                Safe
                communities,
                reviewed by
                Campora
              </p>

              <p
                style={{
                  margin: 0,

                  color:
                    '#7C879F',

                  fontSize:
                    '13px',

                  lineHeight:
                    '1.5',

                  fontWeight:
                    '700'
                }}
              >
                Every new or
                edited study
                circle is
                reviewed before
                it appears in
                Discover.
              </p>
            </div>
          </div>
        )}

      {/* =================================================
          DISCOVER
      ================================================= */}

      {view === 'browse' && (
        <div>
          <div
            style={
              searchBarContainer
            }
          >
            <Search
              size={20}
              color="#A3AED0"
            />

            <input
              type="text"
              placeholder="Search by topic, class name, or major..."
              style={
                searchField
              }
              value={
                searchQuery
              }
              onChange={(e) =>
                setSearchQuery(
                  e.target
                    .value
                )
              }
            />

            {searchQuery && (
              <button
                onClick={() =>
                  setSearchQuery(
                    ''
                  )
                }
                style={{
                  background:
                    'none',

                  border:
                    'none',

                  cursor:
                    'pointer'
                }}
              >
                <X
                  size={18}
                  color="#A3AED0"
                />
              </button>
            )}
          </div>

          {loading ? (
            <p
              style={{
                color:
                  '#A3AED0',

                fontWeight:
                  '700'
              }}
            >
              Loading
              available
              circles...
            </p>
          ) : discoverGroups.length >
            0 ? (
            <div
              style={{
                display:
                  'grid',

                gridTemplateColumns:
                  'repeat(auto-fill,minmax(380px,1fr))',

                gap: '30px'
              }}
            >
              {discoverGroups.map(
                (g) => (
                  <GroupCard
                    key={g.id}
                    group={g}
                    buttonLabel={
                      joinedGroupIds.includes(
                        g.id
                      ) ||
                      g.creator_id ===
                        currentUser?.id
                        ? 'Open Group Details'
                        : 'View & Join Circle'
                    }
                  />
                )
              )}
            </div>
          ) : (
            <div
              style={{
                padding:
                  '58px 30px',

                textAlign:
                  'center',

                background:
                  'linear-gradient(135deg,#FFFFFF 0%,#F9F7FF 100%)',

                borderRadius:
                  '30px',

                border:
                  '1.5px solid #E7EAF6',

                boxShadow:
                  '0 16px 40px rgba(81,95,160,0.05)'
              }}
            >
              <div
                style={{
                  width:
                    '74px',

                  height:
                    '74px',

                  margin:
                    '0 auto 18px',

                  borderRadius:
                    '24px',

                  background:
                    'linear-gradient(135deg,#EDE9FF,#F1F7FF)',

                  color:
                    '#6366F1',

                  display:
                    'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center'
                }}
              >
                <Users
                  size={34}
                />
              </div>

              <h2
                style={{
                  margin:
                    '0 0 8px',

                  color:
                    '#0B1A3F',

                  fontSize:
                    '24px',

                  fontWeight:
                    '900'
                }}
              >
                Find your
                study circle.
              </h2>

              <p
                style={{
                  maxWidth:
                    '560px',

                  margin:
                    '0 auto 22px',

                  color:
                    '#A3AED0',

                  lineHeight:
                    '1.65',

                  fontWeight:
                    '700',

                  fontSize:
                    '14px'
                }}
              >
                {searchQuery
                  ? 'No approved study circles match your search yet.'
                  : 'There are no approved circles available yet. Create one and submit it for Campora review.'}
              </p>

              {!searchQuery && (
                <button
                  onClick={() =>
                    setView(
                      'create'
                    )
                  }
                  style={{
                    ...addBtnStyle,
                    margin:
                      '0 auto'
                  }}
                >
                  <Plus
                    size={18}
                  />
                  Create a Circle
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* =================================================
          CREATED GROUPS
      ================================================= */}

      {view === 'created' && (
        <div>
          <h2
            style={{
              fontSize:
                '22px',

              fontWeight:
                '900',

              color:
                '#0B1A3F',

              marginBottom:
                '20px'
            }}
          >
            Circles Created
            By Me
          </h2>

          {loading ? (
            <div
              style={{
                padding:
                  '60px',

                textAlign:
                  'center',

                background:
                  'white',

                borderRadius:
                  '30px',

                border:
                  '1.5px solid #E9EDF7'
              }}
            >
              <p
                style={{
                  color:
                    '#A3AED0',

                  fontWeight:
                    '800',

                  margin: 0
                }}
              >
                Loading your
                circles...
              </p>
            </div>
          ) : createdGroups.length >
            0 ? (
            <div
              style={{
                display:
                  'grid',

                gridTemplateColumns:
                  'repeat(auto-fill,minmax(380px,1fr))',

                gap: '30px'
              }}
            >
              {sortGroupsWithPins(
                createdGroups
              ).map((g) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  buttonLabel="Open Circle Details"
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                padding:
                  '60px',

                textAlign:
                  'center',

                background:
                  'white',

                borderRadius:
                  '30px',

                border:
                  '2px dashed #E9EDF7'
              }}
            >
              <p
                style={{
                  color:
                    '#A3AED0',

                  fontWeight:
                    '800',

                  fontSize:
                    '16px',

                  margin:
                    '0 0 20px'
                }}
              >
                You haven't
                created any
                study circles
                yet.
              </p>

              <button
                onClick={() =>
                  setView(
                    'create'
                  )
                }
                style={{
                  ...addBtnStyle,
                  margin:
                    'auto'
                }}
              >
                <Plus
                  size={18}
                />
                Create Your
                First Circle
              </button>
            </div>
          )}
        </div>
      )}

      {/* =================================================
          JOINED GROUPS
      ================================================= */}

      {view === 'joined' && (
        <div>
          <h2
            style={{
              fontSize:
                '22px',

              fontWeight:
                '900',

              color:
                '#0B1A3F',

              marginBottom:
                '20px'
            }}
          >
            Circles I've
            Joined
          </h2>

          {joinedOnlyGroups.length >
          0 ? (
            <div
              style={{
                display:
                  'grid',

                gridTemplateColumns:
                  'repeat(auto-fill,minmax(380px,1fr))',

                gap: '30px'
              }}
            >
              {sortGroupsWithPins(
                joinedOnlyGroups
              ).map((g) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  buttonLabel="Open Circle Details"
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                padding:
                  '60px',

                textAlign:
                  'center',

                background:
                  'white',

                borderRadius:
                  '30px',

                border:
                  '2px dashed #E9EDF7'
              }}
            >
              <p
                style={{
                  color:
                    '#A3AED0',

                  fontWeight:
                    '800',

                  fontSize:
                    '16px',

                  margin:
                    '0 0 20px'
                }}
              >
                You haven't
                joined any
                study groups
                yet.
              </p>

              <button
                onClick={() =>
                  setView(
                    'browse'
                  )
                }
                style={{
                  ...addBtnStyle,
                  margin:
                    'auto'
                }}
              >
                Explore
                Available
                Circles
              </button>
            </div>
          )}
        </div>
      )}

      {/* =================================================
          DIRECT MESSAGES
      ================================================= */}

      {view === 'dms' && (
        <div
          style={{
            display: 'grid',

            gridTemplateColumns:
              selectedDmUser
                ? '340px 1fr'
                : '1fr',

            gap: '24px',

            background:
              'linear-gradient(135deg,#FFFFFF 0%,#F7F9FF 100%)',

            borderRadius:
              '28px',

            border:
              '1px solid #E2E8F0',

            padding:
              '24px',

            minHeight:
              '600px'
          }}
        >
          {/* LEFT SIDE */}

          <div
            style={{
              borderRight:
                selectedDmUser
                  ? '1px solid #E2E8F0'
                  : 'none',

              paddingRight:
                selectedDmUser
                  ? '20px'
                  : 0
            }}
          >
            <h2
              style={{
                fontSize:
                  '22px',

                fontWeight:
                  '900',

                color:
                  '#0B1A3F',

                marginBottom:
                  '16px'
              }}
            >
              Direct Messages
            </h2>

            <div
              style={{
                position:
                  'relative',

                marginBottom:
                  '20px'
              }}
            >
              <div
                style={{
                  ...searchBarContainer,

                  marginBottom:
                    0,

                  padding:
                    '10px 16px'
                }}
              >
                <Search
                  size={18}
                  color="#A3AED0"
                />

                <input
                  type="text"
                  placeholder="Search students by name or email..."
                  style={
                    searchField
                  }
                  value={
                    dmSearchQuery
                  }
                  onChange={(e) =>
                    setDmSearchQuery(
                      e.target
                        .value
                    )
                  }
                />

                {dmSearchQuery && (
                  <button
                    onClick={() =>
                      setDmSearchQuery(
                        ''
                      )
                    }
                    style={{
                      background:
                        'none',

                      border:
                        'none',

                      cursor:
                        'pointer'
                    }}
                  >
                    <X
                      size={16}
                      color="#A3AED0"
                    />
                  </button>
                )}
              </div>

              {dmSearchQuery && (
                <div
                  style={{
                    position:
                      'absolute',

                    top:
                      'calc(100% + 6px)',

                    left: 0,

                    right: 0,

                    background:
                      'white',

                    border:
                      '1px solid #E2E8F0',

                    borderRadius:
                      '16px',

                    boxShadow:
                      '0 10px 25px rgba(0,0,0,0.08)',

                    zIndex:
                      20,

                    maxHeight:
                      '300px',

                    overflowY:
                      'auto'
                  }}
                >
                  {searchingUsers ? (
                    <p
                      style={{
                        padding:
                          '16px',

                        margin:
                          0,

                        color:
                          '#A3AED0',

                        fontWeight:
                          '700',

                        fontSize:
                          '13px'
                      }}
                    >
                      Searching...
                    </p>
                  ) : dmSearchResults.length >
                    0 ? (
                    dmSearchResults.map(
                      (
                        profile
                      ) => (
                        <div
                          key={
                            profile.id
                          }
                          onClick={() =>
                            startNewDmWithUser(
                              profile
                            )
                          }
                          style={{
                            padding:
                              '12px 16px',

                            cursor:
                              'pointer',

                            display:
                              'flex',

                            alignItems:
                              'center',

                            gap:
                              '10px',

                            borderBottom:
                              '1px solid #F1F5F9'
                          }}
                        >
                          <div
                            style={{
                              width:
                                '36px',

                              height:
                                '36px',

                              borderRadius:
                                '50%',

                              background:
                                getAvatarColor(
                                  profile.full_name ||
                                    profile.email
                                ),

                              display:
                                'flex',

                              alignItems:
                                'center',

                              justifyContent:
                                'center',

                              fontWeight:
                                '900',

                              color:
                                '#0B1A3F',

                              fontSize:
                                '14px'
                            }}
                          >
                            {getInitials(
                              profile.full_name ||
                                profile.email ||
                                'S'
                            )}
                          </div>

                          <div>
                            <p
                              style={{
                                margin:
                                  0,

                                fontWeight:
                                  '800',

                                fontSize:
                                  '13px',

                                color:
                                  '#0B1A3F'
                              }}
                            >
                              {profile.full_name ||
                                profile.email?.split(
                                  '@'
                                )[0] ||
                                'Student'}
                            </p>

                            <p
                              style={{
                                margin:
                                  0,

                                fontSize:
                                  '11px',

                                color:
                                  '#A3AED0',

                                fontWeight:
                                  '700'
                              }}
                            >
                              {profile.major ||
                                'Major not specified'}
                            </p>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <p
                      style={{
                        padding:
                          '16px',

                        margin:
                          0,

                        color:
                          '#A3AED0',

                        fontWeight:
                          '700',

                        fontSize:
                          '13px'
                      }}
                    >
                      No students
                      found.
                    </p>
                  )}
                </div>
              )}
            </div>

            {dmConversations.length ===
            0 ? (
              <div
                style={{
                  padding:
                    '40px 20px',

                  textAlign:
                    'center',

                  color:
                    '#A3AED0'
                }}
              >
                <Mail
                  size={40}
                  strokeWidth={
                    1.5
                  }
                />

                <p
                  style={{
                    fontWeight:
                      '800',

                    margin:
                      '10px 0 0',

                    fontSize:
                      '14px'
                  }}
                >
                  No direct
                  messages yet.
                </p>

                <p
                  style={{
                    fontSize:
                      '12px',

                    margin:
                      '4px 0 0'
                  }}
                >
                  Search above
                  or click a
                  member in any
                  group to start
                  chatting.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display:
                    'flex',

                  flexDirection:
                    'column',

                  gap:
                    '10px'
                }}
              >
                {sortedDmConversations.map(
                  (conv) => {
                    const isPinned =
                      pinnedChats.dms.includes(
                        conv.partnerId
                      );

                    const isSelected =
                      selectedDmUser?.partnerId ===
                      conv.partnerId;

                    return (
                      <div
                        key={
                          conv.partnerId
                        }
                        onClick={() =>
                          setSelectedDmUser(
                            conv
                          )
                        }
                        style={{
                          padding:
                            '14px',

                          borderRadius:
                            '16px',

                          background:
                            isSelected
                              ? '#0B1A3F'
                              : '#F8FAFC',

                          color:
                            isSelected
                              ? 'white'
                              : '#0B1A3F',

                          cursor:
                            'pointer',

                          border:
                            '1px solid #E2E8F0',

                          boxShadow:
                            isSelected
                              ? '0 8px 20px rgba(11,26,63,0.18)'
                              : 'none',

                          display:
                            'flex',

                          alignItems:
                            'center',

                          justifyContent:
                            'space-between',

                          gap:
                            '10px'
                        }}
                      >
                        <div
                          style={{
                            display:
                              'flex',

                            alignItems:
                              'center',

                            gap:
                              '12px',

                            minWidth:
                              0
                          }}
                        >
                          <div
                            style={{
                              width:
                                '40px',

                              height:
                                '40px',

                              borderRadius:
                                '50%',

                              background:
                                isSelected
                                  ? 'rgba(255,255,255,0.15)'
                                  : getAvatarColor(
                                      conv.name
                                    ),

                              color:
                                isSelected
                                  ? 'white'
                                  : '#0B1A3F',

                              display:
                                'flex',

                              alignItems:
                                'center',

                              justifyContent:
                                'center',

                              fontWeight:
                                '900',

                              fontSize:
                                '14px'
                            }}
                          >
                            {getInitials(
                              conv.name
                            )}
                          </div>

                          <div
                            style={{
                              minWidth:
                                0
                            }}
                          >
                            <div
                              style={{
                                display:
                                  'flex',

                                alignItems:
                                  'center',

                                gap:
                                  '6px'
                              }}
                            >
                              {isPinned && (
                                <Pin
                                  size={
                                    11
                                  }
                                  fill={
                                    isSelected
                                      ? 'white'
                                      : PIN_COLORS.icon
                                  }
                                  color={
                                    isSelected
                                      ? 'white'
                                      : PIN_COLORS.icon
                                  }
                                />
                              )}

                              <p
                                style={{
                                  margin:
                                    0,

                                  fontWeight:
                                    '800',

                                  fontSize:
                                    '15px'
                                }}
                              >
                                {
                                  conv.name
                                }
                              </p>
                            </div>

                            <p
                              style={{
                                margin:
                                  '4px 0 0',

                                fontSize:
                                  '12px',

                                opacity:
                                  0.8,

                                whiteSpace:
                                  'nowrap',

                                overflow:
                                  'hidden',

                                textOverflow:
                                  'ellipsis'
                              }}
                            >
                              {conv.lastMessage ||
                                'Click to view conversation'}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={(
                            e
                          ) => {
                            e.stopPropagation();

                            togglePinDm(
                              conv.partnerId
                            );
                          }}
                          style={{
                            background:
                              'none',

                            border:
                              'none',

                            cursor:
                              'pointer',

                            padding:
                              '4px',

                            display:
                              'flex'
                          }}
                        >
                          <Pin
                            size={16}
                            fill={
                              isPinned
                                ? isSelected
                                  ? 'white'
                                  : PIN_COLORS.icon
                                : 'none'
                            }
                            color={
                              isSelected
                                ? 'white'
                                : isPinned
                                  ? PIN_COLORS.icon
                                  : '#A3AED0'
                            }
                          />
                        </button>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {/* ACTIVE DM */}

          {selectedDmUser ? (
            <div
              style={{
                display:
                  'flex',

                flexDirection:
                  'column',

                height:
                  '100%'
              }}
            >
              <div
                style={{
                  marginBottom:
                    '16px',

                  padding:
                    '16px',

                  borderRadius:
                    '18px',

                  background: `linear-gradient(135deg,${getAvatarColor(
                    selectedDmUser.name
                  )} 0%,#FFFFFF 130%)`,

                  border:
                    '1px solid #E2E8F0',

                  display:
                    'flex',

                  justifyContent:
                    'space-between',

                  alignItems:
                    'center'
                }}
              >
                <div
                  style={{
                    display:
                      'flex',

                    alignItems:
                      'center',

                    gap:
                      '12px'
                  }}
                >
                  <div
                    style={{
                      width:
                        '44px',

                      height:
                        '44px',

                      borderRadius:
                        '50%',

                      background:
                        'rgba(255,255,255,0.75)',

                      color:
                        '#0B1A3F',

                      display:
                        'flex',

                      alignItems:
                        'center',

                      justifyContent:
                        'center',

                      fontWeight:
                        '900',

                      fontSize:
                        '16px'
                    }}
                  >
                    {getInitials(
                      selectedDmUser.name
                    )}
                  </div>

                  <div>
                    <h3
                      style={{
                        margin:
                          0,

                        fontSize:
                          '18px',

                        fontWeight:
                          '900',

                        color:
                          '#0B1A3F'
                      }}
                    >
                      {
                        selectedDmUser.name
                      }
                    </h3>

                    <p
                      style={{
                        margin:
                          0,

                        fontSize:
                          '12px',

                        color:
                          '#42506D',

                        fontWeight:
                          '700'
                      }}
                    >
                      {
                        selectedDmUser.major
                      }
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display:
                      'flex',

                    gap: '8px'
                  }}
                >
                  <button
                    onClick={() =>
                      togglePinDm(
                        selectedDmUser.partnerId
                      )
                    }
                    style={{
                      ...iconBtnStyle,

                      background:
                        pinnedChats.dms.includes(
                          selectedDmUser.partnerId
                        )
                          ? PIN_COLORS.bg
                          : 'rgba(255,255,255,0.7)',

                      border:
                        pinnedChats.dms.includes(
                          selectedDmUser.partnerId
                        )
                          ? `1px solid ${PIN_COLORS.border}`
                          : 'none'
                    }}
                  >
                    <Pin
                      size={16}
                      color={
                        pinnedChats.dms.includes(
                          selectedDmUser.partnerId
                        )
                          ? PIN_COLORS.icon
                          : '#0B1A3F'
                      }
                      fill={
                        pinnedChats.dms.includes(
                          selectedDmUser.partnerId
                        )
                          ? PIN_COLORS.icon
                          : 'none'
                      }
                    />
                  </button>

                  <button
                    onClick={() =>
                      setSelectedDmUser(
                        null
                      )
                    }
                    style={
                      iconBtnStyle
                    }
                  >
                    <X
                      size={18}
                      color="#0B1A3F"
                    />
                  </button>
                </div>
              </div>

              <div
                style={{
                  flex: 1,

                  overflowY:
                    'auto',

                  display:
                    'flex',

                  flexDirection:
                    'column',

                  gap:
                    '12px',

                  paddingRight:
                    '8px'
                }}
              >
                {dmMessages.length ===
                0 ? (
                  <p
                    style={{
                      margin:
                        'auto',

                      color:
                        '#A3AED0',

                      fontWeight:
                        '800',

                      fontSize:
                        '13px'
                    }}
                  >
                    Start your
                    private
                    conversation...
                  </p>
                ) : (
                  dmMessages.map(
                    (msg) => {
                      const isMe =
                        msg.sender_id ===
                        currentUser?.id;

                      return (
                        <div
                          key={
                            msg.id
                          }
                          style={{
                            alignSelf:
                              isMe
                                ? 'flex-end'
                                : 'flex-start',

                            maxWidth:
                              '70%'
                          }}
                        >
                          <div
                            style={{
                              padding:
                                '12px 16px',

                              borderRadius:
                                isMe
                                  ? '18px 18px 4px 18px'
                                  : '18px 18px 18px 4px',

                              background:
                                isMe
                                  ? '#0B1A3F'
                                  : '#FFFFFF',

                              color:
                                isMe
                                  ? 'white'
                                  : '#0B1A3F',

                              fontWeight:
                                '700',

                              fontSize:
                                '14px',

                              border:
                                isMe
                                  ? 'none'
                                  : '1px solid #E2E8F0'
                            }}
                          >
                            {
                              msg.content
                            }
                          </div>
                        </div>
                      );
                    }
                  )
                )}
              </div>

              <form
                onSubmit={
                  handleSendDmInInbox
                }
                style={{
                  marginTop:
                    '16px',

                  display:
                    'flex',

                  gap: '10px'
                }}
              >
                <input
                  type="text"
                  placeholder="Type a private message..."
                  value={
                    newDmMessageText
                  }
                  onChange={(e) =>
                    setNewDmMessageText(
                      e.target
                        .value
                    )
                  }
                  style={{
                    ...inputStyle,

                    flex: 1
                  }}
                />

                <button
                  type="submit"
                  style={
                    saveBtn
                  }
                >
                  <Send
                    size={16}
                  />
                </button>
              </form>
            </div>
          ) : (
            dmConversations.length >
              0 && (
              <div
                style={{
                  display:
                    'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',

                  color:
                    '#A3AED0',

                  fontWeight:
                    '800'
                }}
              >
                Select a
                conversation to
                start messaging
              </div>
            )
          )}
        </div>
      )}

      {/* =================================================
          VIBE SETTINGS
      ================================================= */}

      {view ===
        'preferences' && (
        <div
          style={{
            maxWidth:
              '750px',

            margin:
              '0 auto',

            background:
              '#FFFFFF',

            borderRadius:
              '28px',

            border:
              '1px solid #E2E8F0',

            padding:
              '40px',

            boxShadow:
              '0 10px 25px 5px rgba(0,0,0,0.05)'
          }}
        >
          <div
            style={{
              marginBottom:
                '32px'
            }}
          >
            <h2
              style={{
                margin: 0,

                fontSize:
                  '28px',

                fontWeight:
                  '900',

                color:
                  '#0B1A3F'
              }}
            >
              Your Ideal Study
              Vibe
            </h2>

            <p
              style={{
                color:
                  '#64748B',

                fontWeight:
                  '600',

                marginTop:
                  '6px',

                fontSize:
                  '15px'
              }}
            >
              Customize your
              preferences so
              Campora can match
              you with compatible
              study circles.
            </p>
          </div>

          <div
            style={{
              display:
                'flex',

              flexDirection:
                'column',

              gap: '28px'
            }}
          >
            <div
              style={
                formSectionStyle
              }
            >
              <label
                style={
                  labelStyle
                }
              >
                YOUR MAJOR
              </label>

              <select
                style={
                  inputStyle
                }
                value={
                  myPrefs.major
                }
                onChange={(e) =>
                  setMyPrefs(
                    {
                      ...myPrefs,

                      major:
                        e
                          .target
                          .value
                    }
                  )
                }
              >
                {MAJORS_PREFERENCES.map(
                  (m) => (
                    <option
                      key={m}
                      value={m}
                    >
                      {m}
                    </option>
                  )
                )}
              </select>
            </div>

            <div
              style={
                formSectionStyle
              }
            >
              <label
                style={
                  labelStyle
                }
              >
                PRIMARY STUDY
                GOAL
              </label>

              <div
                style={
                  chipGridStyle
                }
              >
                {STUDY_GOALS.map(
                  (goal) => (
                    <button
                      key={
                        goal
                      }
                      type="button"
                      onClick={() =>
                        setMyPrefs(
                          {
                            ...myPrefs,
                            goal
                          }
                        )
                      }
                      style={
                        myPrefs.goal ===
                        goal
                          ? activeChipStyle
                          : chipStyle
                      }
                    >
                      {goal}
                    </button>
                  )
                )}
              </div>
            </div>

            <div
              style={
                formSectionStyle
              }
            >
              <label
                style={
                  labelStyle
                }
              >
                PREFERRED NOISE
                LEVEL
              </label>

              <div
                style={
                  chipGridStyle
                }
              >
                {NOISE_LEVELS.map(
                  (env) => (
                    <button
                      key={
                        env
                      }
                      type="button"
                      onClick={() =>
                        setMyPrefs(
                          {
                            ...myPrefs,
                            env
                          }
                        )
                      }
                      style={
                        myPrefs.env ===
                        env
                          ? activeChipStyle
                          : chipStyle
                      }
                    >
                      {env}
                    </button>
                  )
                )}
              </div>
            </div>

            <div
              style={
                formSectionStyle
              }
            >
              <label
                style={
                  labelStyle
                }
              >
                STUDY LOCATION
                PREFERENCE
              </label>

              <div
                style={
                  chipGridStyle
                }
              >
                {STUDY_MODES.map(
                  (mode) => (
                    <button
                      key={
                        mode
                      }
                      type="button"
                      onClick={() =>
                        setMyPrefs(
                          {
                            ...myPrefs,
                            mode
                          }
                        )
                      }
                      style={
                        myPrefs.mode ===
                        mode
                          ? activeChipStyle
                          : chipStyle
                      }
                    >
                      {mode ===
                      'In-person'
                        ? 'On Campus'
                        : 'Online / Zoom'}
                    </button>
                  )
                )}
              </div>
            </div>

            <button
              onClick={() =>
                setView(
                  'browse'
                )
              }
              style={{
                ...saveBtn,

                marginTop:
                  '10px'
              }}
            >
              Save Vibe & View
              Matches
            </button>
          </div>
        </div>
      )}

      {/* =================================================
          CREATE CIRCLE
      ================================================= */}

      {view === 'create' && (
        <div
          style={{
            maxWidth:
              '800px',

            margin:
              '0 auto',

            background:
              '#FFFFFF',

            borderRadius:
              '28px',

            border:
              '1px solid #E2E8F0',

            padding:
              '40px',

            boxShadow:
              '0 10px 25px 5px rgba(0,0,0,0.05)'
          }}
        >
          <div
            style={{
              marginBottom:
                '30px'
            }}
          >
            <h2
              style={{
                margin: 0,

                fontWeight:
                  '900',

                fontSize:
                  '30px',

                color:
                  '#0B1A3F'
              }}
            >
              Launch a Study
              Circle
            </h2>

            <p
              style={{
                color:
                  '#64748B',

                fontWeight:
                  '600',

                marginTop:
                  '6px',

                fontSize:
                  '15px'
              }}
            >
              Build your circle
              and submit it for
              Campora review
              before it appears
              publicly.
            </p>
          </div>

          <form
            onSubmit={
              handleCreate
            }
            style={{
              display:
                'flex',

              flexDirection:
                'column',

              gap: '28px'
            }}
          >
            <div
              style={{
                display:
                  'grid',

                gridTemplateColumns:
                  'repeat(auto-fit,minmax(250px,1fr))',

                gap: '20px'
              }}
            >
              <div
                style={
                  formSectionStyle
                }
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  CIRCLE NAME
                </label>

                <input
                  type="text"
                  placeholder="e.g. Psychology Finals Prep"
                  required
                  style={
                    inputStyle
                  }
                  value={
                    newGroup.name
                  }
                  onChange={(e) =>
                    setNewGroup(
                      {
                        ...newGroup,

                        name:
                          e
                            .target
                            .value
                      }
                    )
                  }
                />
              </div>

              <div
                style={
                  formSectionStyle
                }
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  MAJOR / FIELD
                </label>

                <select
                  style={
                    inputStyle
                  }
                  value={
                    newGroup.major
                  }
                  onChange={(e) =>
                    setNewGroup(
                      {
                        ...newGroup,

                        major:
                          e
                            .target
                            .value
                      }
                    )
                  }
                >
                  {MAJORS_CREATION.map(
                    (m) => (
                      <option
                        key={m}
                        value={
                          m
                        }
                      >
                        {m}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div
              style={{
                display:
                  'grid',

                gridTemplateColumns:
                  'repeat(auto-fit,minmax(250px,1fr))',

                gap: '20px'
              }}
            >
              <div
                style={
                  formSectionStyle
                }
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  MAX CAPACITY
                </label>

                <select
                  style={
                    inputStyle
                  }
                  value={
                    newGroup.max_size
                  }
                  onChange={(e) =>
                    setNewGroup(
                      {
                        ...newGroup,

                        max_size:
                          parseInt(
                            e
                              .target
                              .value,
                            10
                          )
                      }
                    )
                  }
                >
                  {[
                    2,
                    3,
                    4,
                    5,
                    6,
                    8,
                    10,
                    12,
                    15,
                    20
                  ].map((n) => (
                    <option
                      key={n}
                      value={n}
                    >
                      {n} People
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={
                  formSectionStyle
                }
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  FORMAT
                </label>

                <div
                  style={{
                    display:
                      'flex',

                    gap:
                      '10px',

                    flexWrap:
                      'wrap'
                  }}
                >
                  {STUDY_MODES.map(
                    (mode) => (
                      <button
                        key={
                          mode
                        }
                        type="button"
                        onClick={() =>
                          setNewGroup(
                            {
                              ...newGroup,

                              mode
                            }
                          )
                        }
                        style={
                          newGroup.mode ===
                          mode
                            ? activeChipStyle
                            : chipStyle
                        }
                      >
                        {mode}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <div
              style={
                formSectionStyle
              }
            >
              <label
                style={
                  labelStyle
                }
              >
                STUDY GOAL
              </label>

              <div
                style={
                  chipGridStyle
                }
              >
                {STUDY_GOALS.map(
                  (goal) => (
                    <button
                      key={
                        goal
                      }
                      type="button"
                      onClick={() =>
                        setNewGroup(
                          {
                            ...newGroup,

                            goal
                          }
                        )
                      }
                      style={
                        newGroup.goal ===
                        goal
                          ? activeChipStyle
                          : chipStyle
                      }
                    >
                      {goal}
                    </button>
                  )
                )}
              </div>
            </div>

            <div
              style={
                formSectionStyle
              }
            >
              <label
                style={
                  labelStyle
                }
              >
                NOISE VIBE
              </label>

              <div
                style={
                  chipGridStyle
                }
              >
                {NOISE_LEVELS.map(
                  (env) => (
                    <button
                      key={
                        env
                      }
                      type="button"
                      onClick={() =>
                        setNewGroup(
                          {
                            ...newGroup,

                            environment:
                              env
                          }
                        )
                      }
                      style={
                        newGroup.environment ===
                        env
                          ? activeChipStyle
                          : chipStyle
                      }
                    >
                      {env}
                    </button>
                  )
                )}
              </div>
            </div>

            <div
              style={
                formSectionStyle
              }
            >
              <label
                style={
                  labelStyle
                }
              >
                DESCRIPTION &
                RULES
              </label>

              <textarea
                placeholder="Tell everyone how you'll study, where to meet, and what to bring..."
                style={{
                  ...inputStyle,

                  height:
                    '110px',

                  resize:
                    'vertical'
                }}
                value={
                  newGroup.description
                }
                onChange={(e) =>
                  setNewGroup(
                    {
                      ...newGroup,

                      description:
                        e
                          .target
                          .value
                    }
                  )
                }
              />
            </div>

            <div
              style={
                formSectionStyle
              }
            >
              <label
                style={
                  labelStyle
                }
              >
                CIRCLE THEME
                COLOR
              </label>

              <div
                style={{
                  display:
                    'flex',

                  gap: '16px',

                  marginTop:
                    '6px',

                  flexWrap:
                    'wrap'
                }}
              >
                {pastelColors.map(
                  (c) => (
                    <button
                      type="button"
                      key={
                        c.bg
                      }
                      onClick={() =>
                        setNewGroup(
                          {
                            ...newGroup,

                            color:
                              c.bg
                          }
                        )
                      }
                      title={
                        c.name
                      }
                      style={{
                        width:
                          '44px',

                        height:
                          '44px',

                        borderRadius:
                          '50%',

                        background:
                          c.bg,

                        cursor:
                          'pointer',

                        border:
                          newGroup.color ===
                          c.bg
                            ? '3px solid #0B1A3F'
                            : '1px solid #CBD5E1',

                        display:
                          'flex',

                        alignItems:
                          'center',

                        justifyContent:
                          'center',

                        boxShadow:
                          newGroup.color ===
                          c.bg
                            ? '0 4px 12px rgba(0,0,0,0.15)'
                            : 'none'
                      }}
                    >
                      {newGroup.color ===
                        c.bg && (
                        <Check
                          size={
                            18
                          }
                          color="#0B1A3F"
                          strokeWidth={
                            3
                          }
                        />
                      )}
                    </button>
                  )
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={
                actionLoading
              }
              style={{
                ...saveBtn,

                marginTop:
                  '10px',

                opacity:
                  actionLoading
                    ? 0.6
                    : 1
              }}
            >
              {actionLoading
                ? 'Submitting...'
                : 'Submit Circle for Review'}
            </button>
          </form>
        </div>
      )}

      {/* =================================================
          GROUP DETAILS
      ================================================= */}

      {view ===
        'details' &&
        selectedGroup && (
          <div
            style={{
              maxWidth:
                '850px',

              margin:
                '0 auto',

              background:
                'white',

              borderRadius:
                '32px',

              border:
                '1px solid #E2E8F0',

              padding:
                '40px',

              boxShadow:
                '0 20px 30px -10px rgba(0,0,0,0.05)'
            }}
          >
            <button
              onClick={() =>
                setView(
                  selectedGroup.creator_id ===
                    currentUser?.id
                    ? 'created'
                    : joinedGroupIds.includes(
                          selectedGroup.id
                        )
                      ? 'joined'
                      : 'browse'
                )
              }
              style={
                backBtn
              }
            >
              <ArrowLeft
                size={16}
              />
              Back
            </button>

            <div
              style={{
                margin:
                  '24px 0',

                padding:
                  '28px',

                borderRadius:
                  '24px',

                background:
                  selectedGroup.color ||
                  '#E0F2FE'
              }}
            >
              <div
                style={{
                  display:
                    'flex',

                  justifyContent:
                    'space-between',

                  alignItems:
                    'center',

                  gap:
                    '12px',

                  flexWrap:
                    'wrap'
                }}
              >
                <span
                  style={
                    tagStyle
                  }
                >
                  {
                    selectedGroup.major
                  }
                </span>

                <span
                  style={{
                    fontSize:
                      '13px',

                    fontWeight:
                      '900',

                    color:
                      '#0B1A3F'
                  }}
                >
                  Compatibility
                  Score:{' '}
                  {calculateMatch(
                    selectedGroup
                  )}
                  %
                </span>
              </div>

              <h1
                style={{
                  fontSize:
                    '36px',

                  fontWeight:
                    '900',

                  color:
                    '#0B1A3F',

                  margin:
                    '16px 0 8px'
                }}
              >
                {
                  selectedGroup.name
                }
              </h1>

              <p
                style={{
                  margin: 0,

                  fontWeight:
                    '700',

                  color:
                    '#0B1A3F',

                  opacity:
                    0.8
                }}
              >
                {selectedGroup.description ||
                  'No description provided.'}
              </p>
            </div>

            <div
              style={{
                display:
                  'grid',

                gridTemplateColumns:
                  'repeat(auto-fit,minmax(200px,1fr))',

                gap: '20px',

                marginBottom:
                  '32px'
              }}
            >
              {[
                [
                  'GOAL',
                  selectedGroup.goal
                ],
                [
                  'ENVIRONMENT',
                  selectedGroup.environment
                ],
                [
                  'MODE',
                  selectedGroup.mode
                ]
              ].map(
                ([
                  label,
                  value
                ]) => (
                  <div
                    key={
                      label
                    }
                    style={{
                      padding:
                        '20px',

                      background:
                        '#F8FAFC',

                      borderRadius:
                        '18px',

                      border:
                        '1px solid #E2E8F0'
                    }}
                  >
                    <p
                      style={{
                        margin:
                          0,

                        fontSize:
                          '11px',

                        fontWeight:
                          '900',

                        color:
                          '#A3AED0'
                      }}
                    >
                      {label}
                    </p>

                    <p
                      style={{
                        margin:
                          '6px 0 0',

                        fontWeight:
                          '800',

                        color:
                          '#0B1A3F'
                      }}
                    >
                      {value ||
                        'Not specified'}
                    </p>
                  </div>
                )
              )}
            </div>

            <div
              style={{
                marginBottom:
                  '32px'
              }}
            >
              <h3
                style={{
                  fontSize:
                    '18px',

                  fontWeight:
                    '900',

                  color:
                    '#0B1A3F',

                  marginBottom:
                    '16px'
                }}
              >
                Circle Members (
                {getGroupMemberCount(
                  selectedGroup
                )}{' '}
                /{' '}
                {
                  selectedGroup.max_size
                }
                )
              </h3>

              <div
                style={{
                  display:
                    'flex',

                  gap: '12px',

                  flexWrap:
                    'wrap'
                }}
              >
                {groupMembers.map(
                  (m) => (
                    <div
                      key={
                        m.user_id
                      }
                      onClick={() =>
                        openMemberChat(
                          m
                        )
                      }
                      style={{
                        padding:
                          '10px 16px',

                        borderRadius:
                          '12px',

                        background:
                          '#F1F5F9',

                        border:
                          '1px solid #E2E8F0',

                        display:
                          'flex',

                        alignItems:
                          'center',

                        gap:
                          '8px',

                        cursor:
                          m.user_id ===
                          currentUser?.id
                            ? 'default'
                            : 'pointer'
                      }}
                    >
                      <User
                        size={
                          16
                        }
                        color="#0B1A3F"
                      />

                      <span
                        style={{
                          fontWeight:
                            '800',

                          fontSize:
                            '13px',

                          color:
                            '#0B1A3F'
                        }}
                      >
                        {m
                          .profiles
                          ?.full_name ||
                          m
                            .profiles
                            ?.email ||
                          'Student'}
                      </span>

                      {m.user_id ===
                        selectedGroup.creator_id && (
                        <span
                          style={{
                            fontSize:
                              '10px',

                            background:
                              'rgba(255,255,255,0.75)',

                            border:
                              '1px solid rgba(11,26,63,0.15)',

                            color:
                              '#0B1A3F',

                            padding:
                              '2px 6px',

                            borderRadius:
                              '6px',

                            fontWeight:
                              '800'
                          }}
                        >
                          Creator
                        </span>
                      )}

                      {m.user_id !==
                        currentUser?.id && (
                        <button
                          type="button"
                          onClick={(
                            e
                          ) => {
                            e.stopPropagation();

                            setSelectedMember(
                              m
                            );
                          }}
                          style={{
                            border:
                              'none',

                            background:
                              'none',

                            cursor:
                              'pointer',

                            padding:
                              '2px',

                            display:
                              'flex'
                          }}
                        >
                          <MoreVertical
                            size={
                              14
                            }
                            color="#A3AED0"
                          />
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>

            <div
              style={{
                display:
                  'flex',

                gap: '16px',

                flexWrap:
                  'wrap'
              }}
            >
              {selectedGroup.approval_status !==
              'approved' ? (
                <div
                  style={{
                    flex: 1,

                    padding:
                      '14px 18px',

                    borderRadius:
                      '14px',

                    background:
                      selectedGroup.approval_status ===
                      'rejected'
                        ? '#FEE2E2'
                        : '#FFF4D8',

                    color:
                      selectedGroup.approval_status ===
                      'rejected'
                        ? '#B91C1C'
                        : '#B7791F',

                    fontWeight:
                      '900',

                    textAlign:
                      'center'
                  }}
                >
                  {selectedGroup.approval_status ===
                  'rejected'
                    ? 'This circle was declined and is not visible publicly.'
                    : 'This circle is waiting for Campora review.'}
                </div>
              ) : joinedGroupIds.includes(
                  selectedGroup.id
                ) ||
                selectedGroup.creator_id ===
                  currentUser?.id ? (
                <button
                  onClick={() =>
                    setView(
                      'chat'
                    )
                  }
                  style={{
                    ...saveBtn,

                    flex: 1,

                    display:
                      'flex',

                    alignItems:
                      'center',

                    justifyContent:
                      'center',

                    gap:
                      '8px'
                  }}
                >
                  <MessageSquare
                    size={
                      18
                    }
                  />
                  Open Group Chat
                </button>
              ) : (
                <button
                  onClick={() =>
                    handleJoin(
                      selectedGroup.id
                    )
                  }
                  disabled={
                    actionLoading ||
                    getGroupMemberCount(
                      selectedGroup
                    ) >=
                      selectedGroup.max_size
                  }
                  style={{
                    ...saveBtn,

                    flex: 1,

                    display:
                      'flex',

                    alignItems:
                      'center',

                    justifyContent:
                      'center',

                    gap:
                      '8px',

                    opacity:
                      getGroupMemberCount(
                        selectedGroup
                      ) >=
                      selectedGroup.max_size
                        ? 0.55
                        : 1
                  }}
                >
                  <UserPlus
                    size={
                      18
                    }
                  />

                  {getGroupMemberCount(
                    selectedGroup
                  ) >=
                  selectedGroup.max_size
                    ? 'Group Full'
                    : 'Join Study Circle'}
                </button>
              )}

              {selectedGroup.approval_status ===
                'approved' &&
                joinedGroupIds.includes(
                  selectedGroup.id
                ) &&
                selectedGroup.creator_id !==
                  currentUser?.id && (
                  <button
                    onClick={() =>
                      handleLeaveGroup(
                        selectedGroup.id
                      )
                    }
                    disabled={
                      actionLoading
                    }
                    style={{
                      padding:
                        '14px 20px',

                      borderRadius:
                        '14px',

                      border:
                        '1.5px solid #F6CACA',

                      background:
                        '#FFF0F0',

                      color:
                        '#D84C4C',

                      fontWeight:
                        '900',

                      fontSize:
                        '14px',

                      cursor:
                        'pointer',

                      display:
                        'flex',

                      alignItems:
                        'center',

                      gap:
                        '8px'
                    }}
                  >
                    <LogOut
                      size={
                        18
                      }
                    />
                    Leave
                  </button>
                )}
            </div>
          </div>
        )}

      {/* =================================================
          GROUP CHAT
      ================================================= */}

      {view === 'chat' &&
        selectedGroup && (
          <div
            style={{
              maxWidth:
                '900px',

              margin:
                '0 auto',

              background:
                '#FFFFFF',

              borderRadius:
                '28px',

              border:
                '1px solid #E2E8F0',

              height:
                '80vh',

              display:
                'flex',

              flexDirection:
                'column',

              overflow:
                'hidden',

              boxShadow:
                '0 20px 40px -15px rgba(0,0,0,0.08)'
            }}
          >
            {/* CHAT HEADER */}

            <div
              style={{
                padding:
                  '20px 28px',

                background:
                  selectedGroup.color ||
                  '#E0F2FE',

                borderBottom:
                  '1px solid #E2E8F0',

                display:
                  'flex',

                justifyContent:
                  'space-between',

                alignItems:
                  'center',

                gap:
                  '14px'
              }}
            >
              <div
                style={{
                  display:
                    'flex',

                  alignItems:
                    'center',

                  gap:
                    '16px'
                }}
              >
                <button
                  onClick={() =>
                    setView(
                      'details'
                    )
                  }
                  style={{
                    border:
                      'none',

                    background:
                      'rgba(255,255,255,0.6)',

                    padding:
                      '8px',

                    borderRadius:
                      '10px',

                    cursor:
                      'pointer'
                  }}
                >
                  <ArrowLeft
                    size={
                      18
                    }
                    color="#0B1A3F"
                  />
                </button>

                <div>
                  <h3
                    style={{
                      margin:
                        0,

                      fontSize:
                        '20px',

                      fontWeight:
                        '900',

                      color:
                        '#0B1A3F'
                    }}
                  >
                    {
                      selectedGroup.name
                    }
                  </h3>

                  <div
                    style={{
                      display:
                        'flex',

                      alignItems:
                        'center',

                      gap:
                        '6px',

                      marginTop:
                        '2px'
                    }}
                  >
                    <Circle
                      size={8}
                      fill="#22C55E"
                      color="#22C55E"
                    />

                    <p
                      style={{
                        margin:
                          0,

                        fontSize:
                          '12px',

                        fontWeight:
                          '800',

                        color:
                          '#0B1A3F',

                        opacity:
                          0.8
                      }}
                    >
                      {getActiveOnlineCount()}{' '}
                      Members Active
                      Now
                    </p>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display:
                    'flex',

                  gap: '10px',

                  flexWrap:
                    'wrap'
                }}
              >
                <button
                  onClick={() =>
                    togglePinGroup(
                      selectedGroup.id
                    )
                  }
                  style={{
                    ...iconBtnStyle,

                    background:
                      pinnedChats.groups.includes(
                        selectedGroup.id
                      )
                        ? PIN_COLORS.bg
                        : 'rgba(255,255,255,0.7)',

                    border:
                      pinnedChats.groups.includes(
                        selectedGroup.id
                      )
                        ? `1px solid ${PIN_COLORS.border}`
                        : 'none'
                  }}
                >
                  <Pin
                    size={18}
                    color={
                      pinnedChats.groups.includes(
                        selectedGroup.id
                      )
                        ? PIN_COLORS.icon
                        : '#0B1A3F'
                    }
                    fill={
                      pinnedChats.groups.includes(
                        selectedGroup.id
                      )
                        ? PIN_COLORS.icon
                        : 'none'
                    }
                  />
                </button>

                <button
                  onClick={() =>
                    setShowPollModal(
                      true
                    )
                  }
                  style={
                    iconBtnStyle
                  }
                >
                  <BarChart2
                    size={
                      18
                    }
                    color="#0B1A3F"
                  />
                </button>

                <button
                  onClick={() =>
                    setShowMembersDrawer(
                      true
                    )
                  }
                  style={
                    iconBtnStyle
                  }
                >
                  <Users
                    size={
                      18
                    }
                    color="#0B1A3F"
                  />
                </button>

                <button
                  onClick={() =>
                    toggleNotifications(
                      selectedGroup.id
                    )
                  }
                  style={
                    iconBtnStyle
                  }
                >
                  {notificationsMuted[
                    selectedGroup
                      .id
                  ] ? (
                    <BellOff
                      size={
                        18
                      }
                      color="#B91C1C"
                    />
                  ) : (
                    <Bell
                      size={
                        18
                      }
                      color="#0B1A3F"
                    />
                  )}
                </button>

                {selectedGroup.creator_id ===
                currentUser?.id ? (
                  <button
                    onClick={
                      handleClearChat
                    }
                    style={{
                      ...iconBtnStyle,

                      background:
                        '#FEE2E2'
                    }}
                  >
                    <Trash2
                      size={
                        18
                      }
                      color="#B91C1C"
                    />
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      handleLeaveGroup(
                        selectedGroup.id
                      )
                    }
                    style={{
                      ...iconBtnStyle,

                      background:
                        '#FEE2E2'
                    }}
                  >
                    <LogOut
                      size={
                        18
                      }
                      color="#B91C1C"
                    />
                  </button>
                )}
              </div>
            </div>

            {/* PINNED MESSAGE BANNER - SAME ORANGE AS OTHER PINS */}

            {pinnedGroupMessages[
              selectedGroup.id
            ]?.length > 0 && (
              <div
                style={{
                  background:
                    PIN_COLORS.bg,

                  padding:
                    '10px 20px',

                  borderBottom: `1.5px solid ${PIN_COLORS.border}`,

                  display:
                    'flex',

                  flexDirection:
                    'column',

                  gap: '6px'
                }}
              >
                <div
                  style={{
                    display:
                      'flex',

                    alignItems:
                      'center',

                    gap: '6px',

                    fontSize:
                      '12px',

                    fontWeight:
                      '900',

                    color:
                      PIN_COLORS.icon
                  }}
                >
                  <Pin
                    size={14}
                    fill={
                      PIN_COLORS.icon
                    }
                    color={
                      PIN_COLORS.icon
                    }
                  />

                  Pinned Messages (
                  {
                    pinnedGroupMessages[
                      selectedGroup
                        .id
                    ].length
                  }
                  )
                </div>

                <div
                  style={{
                    display:
                      'flex',

                    flexDirection:
                      'column',

                    gap:
                      '4px',

                    maxHeight:
                      '90px',

                    overflowY:
                      'auto'
                  }}
                >
                  {pinnedGroupMessages[
                    selectedGroup
                      .id
                  ].map(
                    (pId) => {
                      const pMsg =
                        messages.find(
                          (m) =>
                            m.id ===
                            pId
                        );

                      if (!pMsg) {
                        return null;
                      }

                      return (
                        <div
                          key={
                            pId
                          }
                          style={{
                            display:
                              'flex',

                            justifyContent:
                              'space-between',

                            alignItems:
                              'center',

                            gap:
                              '10px',

                            background:
                              'rgba(255,255,255,0.75)',

                            border: `1px solid ${PIN_COLORS.border}`,

                            padding:
                              '6px 10px',

                            borderRadius:
                              '8px',

                            fontSize:
                              '12px'
                          }}
                        >
                          <span
                            style={{
                              fontWeight:
                                '700',

                              color:
                                '#0B1A3F',

                              overflow:
                                'hidden',

                              textOverflow:
                                'ellipsis',

                              whiteSpace:
                                'nowrap'
                            }}
                          >
                            <strong>
                              {
                                pMsg.sender_name
                              }
                              :
                            </strong>{' '}
                            {pMsg.type ===
                            'poll'
                              ? pMsg
                                  .poll_data
                                  ?.question
                              : pMsg.content}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              togglePinGroupMessage(
                                pId
                              )
                            }
                            style={{
                              border:
                                'none',

                              background:
                                'none',

                              cursor:
                                'pointer',

                              color:
                                PIN_COLORS.icon,

                              fontWeight:
                                '900',

                              fontSize:
                                '11px'
                            }}
                          >
                            Unpin
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* MESSAGES */}

            <div
              style={{
                flex: 1,

                padding:
                  '24px',

                overflowY:
                  'auto',

                display:
                  'flex',

                flexDirection:
                  'column',

                gap: '16px',

                background:
                  '#F8FAFC'
              }}
            >
              {messages.length ===
              0 ? (
                <div
                  style={{
                    margin:
                      'auto',

                    textAlign:
                      'center',

                    color:
                      '#A3AED0'
                  }}
                >
                  <MessageCircle
                    size={
                      48
                    }
                    strokeWidth={
                      1.5
                    }
                  />

                  <p
                    style={{
                      fontWeight:
                        '800',

                      margin:
                        '12px 0 0'
                    }}
                  >
                    No messages
                    yet. Say hello
                    to start the
                    discussion!
                  </p>
                </div>
              ) : (
                messages.map(
                  (msg) => {
                    const isMe =
                      msg.user_id ===
                      currentUser?.id;

                    const isTemp =
                      String(
                        msg.id
                      ).startsWith(
                        'temp-'
                      );

                    return (
                      <div
                        key={
                          msg.id
                        }
                        style={{
                          alignSelf:
                            isMe
                              ? 'flex-end'
                              : 'flex-start',

                          maxWidth:
                            '75%',

                          position:
                            'relative'
                        }}
                      >
                        <div
                          style={{
                            fontSize:
                              '11px',

                            fontWeight:
                              '800',

                            color:
                              '#A3AED0',

                            marginBottom:
                              '4px',

                            textAlign:
                              isMe
                                ? 'right'
                                : 'left'
                          }}
                        >
                          {
                            msg.sender_name
                          }
                        </div>

                        {msg.type ===
                        'poll' ? (
                          <div
                            style={{
                              background:
                                '#FFFFFF',

                              padding:
                                '20px',

                              borderRadius:
                                '20px',

                              border:
                                '1.5px solid #E2E8F0',

                              boxShadow:
                                '0 4px 12px rgba(0,0,0,0.03)'
                            }}
                          >
                            <p
                              style={{
                                margin:
                                  '0 0 14px',

                                fontWeight:
                                  '900',

                                fontSize:
                                  '15px',

                                color:
                                  '#0B1A3F'
                              }}
                            >
                              {
                                msg
                                  .poll_data
                                  ?.question
                              }
                            </p>

                            <div
                              style={{
                                display:
                                  'flex',

                                flexDirection:
                                  'column',

                                gap:
                                  '8px'
                              }}
                            >
                              {msg.poll_data?.options?.map(
                                (
                                  opt,
                                  oIdx
                                ) => {
                                  const totalVotes =
                                    msg.poll_data.options.reduce(
                                      (
                                        acc,
                                        curr
                                      ) =>
                                        acc +
                                        (curr
                                          .votes
                                          ?.length ||
                                          0),
                                      0
                                    );

                                  const optVotes =
                                    opt
                                      .votes
                                      ?.length ||
                                    0;

                                  const percentage =
                                    totalVotes >
                                    0
                                      ? Math.round(
                                          (optVotes /
                                            totalVotes) *
                                            100
                                        )
                                      : 0;

                                  const hasVoted =
                                    opt.votes?.includes(
                                      currentUser?.id
                                    );

                                  return (
                                    <button
                                      key={
                                        oIdx
                                      }
                                      disabled={
                                        isTemp
                                      }
                                      onClick={() =>
                                        handleVotePoll(
                                          msg.id,
                                          oIdx
                                        )
                                      }
                                      style={{
                                        position:
                                          'relative',

                                        padding:
                                          '10px 14px',

                                        borderRadius:
                                          '12px',

                                        border:
                                          hasVoted
                                            ? '2px solid #0B1A3F'
                                            : '1px solid #CBD5E1',

                                        background:
                                          '#F8FAFC',

                                        textAlign:
                                          'left',

                                        cursor:
                                          isTemp
                                            ? 'default'
                                            : 'pointer',

                                        overflow:
                                          'hidden'
                                      }}
                                    >
                                      <div
                                        style={{
                                          position:
                                            'absolute',

                                          top: 0,

                                          left: 0,

                                          bottom: 0,

                                          width: `${percentage}%`,

                                          background:
                                            'rgba(11,26,63,0.12)'
                                        }}
                                      />

                                      <div
                                        style={{
                                          position:
                                            'relative',

                                          display:
                                            'flex',

                                          justifyContent:
                                            'space-between',

                                          fontWeight:
                                            '800',

                                          fontSize:
                                            '13px',

                                          color:
                                            '#0B1A3F'
                                        }}
                                      >
                                        <span>
                                          {hasVoted
                                            ? '✓ '
                                            : ''}
                                          {
                                            opt.text
                                          }
                                        </span>

                                        <span>
                                          {
                                            percentage
                                          }
                                          % (
                                          {
                                            optVotes
                                          }
                                          )
                                        </span>
                                      </div>
                                    </button>
                                  );
                                }
                              )}
                            </div>

                            <p
                              style={{
                                margin:
                                  '10px 0 0',

                                fontSize:
                                  '11px',

                                fontWeight:
                                  '700',

                                color:
                                  '#A3AED0'
                              }}
                            >
                              Tap your
                              choice
                              again to
                              remove
                              your vote.
                            </p>
                          </div>
                        ) : (
                          <div
                            style={{
                              padding:
                                '14px 18px',

                              borderRadius:
                                isMe
                                  ? '20px 20px 4px 20px'
                                  : '20px 20px 20px 4px',

                              background:
                                isMe
                                  ? '#0B1A3F'
                                  : '#FFFFFF',

                              color:
                                isMe
                                  ? '#FFFFFF'
                                  : '#0B1A3F',

                              fontWeight:
                                '700',

                              fontSize:
                                '14px',

                              border:
                                isMe
                                  ? 'none'
                                  : '1px solid #E2E8F0',

                              boxShadow:
                                '0 2px 8px rgba(0,0,0,0.03)'
                            }}
                          >
                            {msg.reply_to_id && (
                              <div
                                style={{
                                  fontSize:
                                    '11px',

                                  fontWeight:
                                    '700',

                                  color:
                                    isMe
                                      ? 'rgba(255,255,255,0.85)'
                                      : '#64748B',

                                  background:
                                    isMe
                                      ? 'rgba(255,255,255,0.15)'
                                      : '#F1F5F9',

                                  borderLeft: `3px solid ${
                                    isMe
                                      ? 'rgba(255,255,255,0.6)'
                                      : '#0B1A3F'
                                  }`,

                                  padding:
                                    '6px 10px',

                                  borderRadius:
                                    '8px',

                                  marginBottom:
                                    '8px'
                                }}
                              >
                                <strong>
                                  {
                                    msg.reply_to_sender
                                  }
                                </strong>
                                :{' '}
                                {
                                  msg.reply_to_content
                                }
                              </div>
                            )}

                            {
                              msg.content
                            }
                          </div>
                        )}

                        {msg.reactions &&
                          Object.keys(
                            msg.reactions
                          ).some(
                            (
                              key
                            ) =>
                              msg
                                .reactions[
                                key
                              ]
                                ?.length >
                              0
                          ) && (
                            <div
                              style={{
                                display:
                                  'flex',

                                gap:
                                  '4px',

                                marginTop:
                                  '4px',

                                flexWrap:
                                  'wrap',

                                justifyContent:
                                  isMe
                                    ? 'flex-end'
                                    : 'flex-start'
                              }}
                            >
                              {Object.entries(
                                msg.reactions
                              ).map(
                                ([
                                  emoji,
                                  uids
                                ]) =>
                                  uids.length >
                                    0 && (
                                    <button
                                      key={
                                        emoji
                                      }
                                      onClick={() =>
                                        handleReactToMessage(
                                          msg.id,
                                          emoji
                                        )
                                      }
                                      style={{
                                        background:
                                          '#FFFFFF',

                                        border:
                                          '1px solid #E2E8F0',

                                        borderRadius:
                                          '12px',

                                        padding:
                                          '2px 8px',

                                        fontSize:
                                          '12px',

                                        fontWeight:
                                          '800',

                                        color:
                                          '#0B1A3F',

                                        cursor:
                                          'pointer'
                                      }}
                                    >
                                      {
                                        emoji
                                      }{' '}
                                      {
                                        uids.length
                                      }
                                    </button>
                                  )
                              )}
                            </div>
                          )}

                        {!isTemp && (
                          <button
                            onClick={() =>
                              setActiveMessageMenu(
                                activeMessageMenu ===
                                  msg.id
                                  ? null
                                  : msg.id
                              )
                            }
                            style={{
                              position:
                                'absolute',

                              top: 0,

                              right:
                                isMe
                                  ? '100%'
                                  : 'auto',

                              left:
                                isMe
                                  ? 'auto'
                                  : '100%',

                              background:
                                'none',

                              border:
                                'none',

                              cursor:
                                'pointer',

                              padding:
                                '4px'
                            }}
                          >
                            <MoreVertical
                              size={
                                14
                              }
                              color="#A3AED0"
                            />
                          </button>
                        )}

                        {activeMessageMenu ===
                          msg.id && (
                          <div
                            style={{
                              position:
                                'absolute',

                              top:
                                '24px',

                              [
                                isMe
                                  ? 'right'
                                  : 'left'
                              ]:
                                '100%',

                              background:
                                'white',

                              borderRadius:
                                '12px',

                              padding:
                                '8px',

                              border:
                                '1px solid #E2E8F0',

                              boxShadow:
                                '0 10px 20px rgba(0,0,0,0.1)',

                              zIndex:
                                10,

                              display:
                                'flex',

                              gap:
                                '6px',

                              alignItems:
                                'center'
                            }}
                          >
                            {EMOJI_REACTIONS.map(
                              (
                                emoji
                              ) => (
                                <button
                                  key={
                                    emoji
                                  }
                                  onClick={() =>
                                    handleReactToMessage(
                                      msg.id,
                                      emoji
                                    )
                                  }
                                  style={{
                                    border:
                                      'none',

                                    background:
                                      'none',

                                    cursor:
                                      'pointer',

                                    fontSize:
                                      '16px'
                                  }}
                                >
                                  {
                                    emoji
                                  }
                                </button>
                              )
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setReplyingTo(
                                  msg
                                );

                                setActiveMessageMenu(
                                  null
                                );
                              }}
                              style={{
                                border:
                                  'none',

                                background:
                                  '#EEF2FF',

                                padding:
                                  '4px 8px',

                                borderRadius:
                                  '6px',

                                cursor:
                                  'pointer',

                                display:
                                  'flex',

                                alignItems:
                                  'center',

                                gap:
                                  '4px',

                                fontSize:
                                  '12px',

                                fontWeight:
                                  '800',

                                color:
                                  '#0B1A3F'
                              }}
                            >
                              <Reply
                                size={
                                  12
                                }
                              />
                              Reply
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                togglePinGroupMessage(
                                  msg.id
                                )
                              }
                              style={{
                                border: `1px solid ${PIN_COLORS.border}`,

                                background:
                                  PIN_COLORS.bg,

                                padding:
                                  '4px 8px',

                                borderRadius:
                                  '6px',

                                cursor:
                                  'pointer',

                                display:
                                  'flex',

                                alignItems:
                                  'center',

                                gap:
                                  '4px',

                                fontSize:
                                  '12px',

                                fontWeight:
                                  '800',

                                color:
                                  PIN_COLORS.icon
                              }}
                            >
                              <Pin
                                size={
                                  12
                                }
                                fill={
                                  PIN_COLORS.icon
                                }
                                color={
                                  PIN_COLORS.icon
                                }
                              />

                              {(
                                pinnedGroupMessages[
                                  selectedGroup
                                    .id
                                ] ||
                                []
                              ).includes(
                                msg.id
                              )
                                ? 'Unpin'
                                : 'Pin'}
                            </button>

                            {(isMe ||
                              selectedGroup.creator_id ===
                                currentUser?.id) && (
                              <button
                                onClick={() =>
                                  handleDeleteMessage(
                                    msg.id
                                  )
                                }
                                style={{
                                  border:
                                    'none',

                                  background:
                                    '#FEE2E2',

                                  padding:
                                    '4px 8px',

                                  borderRadius:
                                    '6px',

                                  cursor:
                                    'pointer'
                                }}
                              >
                                <Trash2
                                  size={
                                    12
                                  }
                                  color="#B91C1C"
                                />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                )
              )}

              <div
                ref={
                  chatBottomRef
                }
              />
            </div>

            {/* REPLY PREVIEW */}

            {replyingTo && (
              <div
                style={{
                  padding:
                    '10px 24px',

                  background:
                    '#EEF2FF',

                  borderTop:
                    '1px solid #E2E8F0',

                  display:
                    'flex',

                  justifyContent:
                    'space-between',

                  alignItems:
                    'center',

                  gap:
                    '12px'
                }}
              >
                <div
                  style={{
                    borderLeft:
                      '3px solid #0B1A3F',

                    paddingLeft:
                      '10px',

                    minWidth:
                      0
                  }}
                >
                  <p
                    style={{
                      margin:
                        0,

                      fontSize:
                        '11px',

                      fontWeight:
                        '900',

                      color:
                        '#0B1A3F'
                    }}
                  >
                    Replying to{' '}
                    {
                      replyingTo.sender_name
                    }
                  </p>

                  <p
                    style={{
                      margin:
                        '2px 0 0',

                      fontSize:
                        '12px',

                      color:
                        '#64748B',

                      fontWeight:
                        '700',

                      whiteSpace:
                        'nowrap',

                      overflow:
                        'hidden',

                      textOverflow:
                        'ellipsis'
                    }}
                  >
                    {replyingTo.type ===
                    'poll'
                      ? replyingTo
                          .poll_data
                          ?.question
                      : replyingTo.content}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setReplyingTo(
                      null
                    )
                  }
                  style={{
                    border:
                      'none',

                    background:
                      'none',

                    cursor:
                      'pointer'
                  }}
                >
                  <X
                    size={16}
                    color="#A3AED0"
                  />
                </button>
              </div>
            )}

            {/* MESSAGE INPUT */}

            <form
              onSubmit={
                handleSendMessage
              }
              style={{
                padding:
                  '20px',

                background:
                  'white',

                borderTop:
                  '1px solid #E2E8F0',

                display:
                  'flex',

                gap: '12px'
              }}
            >
              <input
                type="text"
                placeholder={
                  replyingTo
                    ? `Reply to ${replyingTo.sender_name}...`
                    : 'Type your message...'
                }
                value={
                  newMessage
                }
                onChange={(e) =>
                  setNewMessage(
                    e.target
                      .value
                  )
                }
                style={{
                  ...inputStyle,

                  flex: 1,

                  background:
                    '#F8FAFC'
                }}
              />

              <button
                type="submit"
                disabled={
                  !newMessage.trim()
                }
                style={{
                  ...saveBtn,

                  padding:
                    '12px 20px',

                  display:
                    'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',

                  opacity:
                    newMessage.trim()
                      ? 1
                      : 0.5
                }}
              >
                <Send
                  size={18}
                />
              </button>
            </form>
          </div>
        )}

      {/* =================================================
          EDIT GROUP MODAL
      ================================================= */}

      {editingGroup && (
        <div
          style={
            overlay
          }
        >
          <div
            style={{
              width:
                '100%',

              maxWidth:
                '600px',

              background:
                'white',

              borderRadius:
                '28px',

              padding:
                '36px',

              border:
                '1px solid #E2E8F0',

              maxHeight:
                '90vh',

              overflowY:
                'auto'
            }}
          >
            <div
              style={{
                display:
                  'flex',

                justifyContent:
                  'space-between',

                alignItems:
                  'center',

                marginBottom:
                  '24px'
              }}
            >
              <h2
                style={{
                  margin:
                    0,

                  fontWeight:
                    '900',

                  fontSize:
                    '24px',

                  color:
                    '#0B1A3F'
                }}
              >
                Edit Circle
              </h2>

              <button
                onClick={() =>
                  setEditingGroup(
                    null
                  )
                }
                style={{
                  border:
                    'none',

                  background:
                    'none',

                  cursor:
                    'pointer'
                }}
              >
                <X
                  size={20}
                  color="#A3AED0"
                />
              </button>
            </div>

            <form
              onSubmit={
                handleUpdateGroup
              }
              style={{
                display:
                  'flex',

                flexDirection:
                  'column',

                gap:
                  '20px'
              }}
            >
              <div
                style={
                  formSectionStyle
                }
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  NAME
                </label>

                <input
                  type="text"
                  required
                  style={
                    inputStyle
                  }
                  value={
                    editingGroup.name
                  }
                  onChange={(e) =>
                    setEditingGroup(
                      {
                        ...editingGroup,

                        name:
                          e
                            .target
                            .value
                      }
                    )
                  }
                />
              </div>

              <div
                style={
                  formSectionStyle
                }
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  MAJOR
                </label>

                <select
                  style={
                    inputStyle
                  }
                  value={
                    editingGroup.major
                  }
                  onChange={(e) =>
                    setEditingGroup(
                      {
                        ...editingGroup,

                        major:
                          e
                            .target
                            .value
                      }
                    )
                  }
                >
                  {MAJORS_CREATION.map(
                    (m) => (
                      <option
                        key={m}
                        value={
                          m
                        }
                      >
                        {m}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div
                style={
                  formSectionStyle
                }
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  STUDY GOAL
                </label>

                <div
                  style={
                    chipGridStyle
                  }
                >
                  {STUDY_GOALS.map(
                    (goal) => (
                      <button
                        key={
                          goal
                        }
                        type="button"
                        onClick={() =>
                          setEditingGroup(
                            {
                              ...editingGroup,

                              goal
                            }
                          )
                        }
                        style={
                          editingGroup.goal ===
                          goal
                            ? activeChipStyle
                            : chipStyle
                        }
                      >
                        {goal}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div
                style={
                  formSectionStyle
                }
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  NOISE VIBE
                </label>

                <div
                  style={
                    chipGridStyle
                  }
                >
                  {NOISE_LEVELS.map(
                    (environment) => (
                      <button
                        key={
                          environment
                        }
                        type="button"
                        onClick={() =>
                          setEditingGroup(
                            {
                              ...editingGroup,

                              environment
                            }
                          )
                        }
                        style={
                          editingGroup.environment ===
                          environment
                            ? activeChipStyle
                            : chipStyle
                        }
                      >
                        {
                          environment
                        }
                      </button>
                    )
                  )}
                </div>
              </div>

              <div
                style={
                  formSectionStyle
                }
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  DESCRIPTION
                </label>

                <textarea
                  style={{
                    ...inputStyle,

                    height:
                      '90px',

                    resize:
                      'vertical'
                  }}
                  value={
                    editingGroup.description ||
                    ''
                  }
                  onChange={(e) =>
                    setEditingGroup(
                      {
                        ...editingGroup,

                        description:
                          e
                            .target
                            .value
                      }
                    )
                  }
                />
              </div>

              <button
                type="submit"
                disabled={
                  actionLoading
                }
                style={
                  saveBtn
                }
              >
                {actionLoading
                  ? 'Saving...'
                  : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          CREATE POLL MODAL
      ================================================= */}

      {showPollModal && (
        <div
          style={
            overlay
          }
        >
          <div
            style={{
              width:
                '100%',

              maxWidth:
                '500px',

              background:
                'white',

              borderRadius:
                '28px',

              padding:
                '32px',

              border:
                '1px solid #E2E8F0'
            }}
          >
            <div
              style={{
                display:
                  'flex',

                justifyContent:
                  'space-between',

                alignItems:
                  'center',

                marginBottom:
                  '20px'
              }}
            >
              <h3
                style={{
                  margin:
                    0,

                  fontWeight:
                    '900',

                  fontSize:
                    '22px',

                  color:
                    '#0B1A3F'
                }}
              >
                Create Group
                Poll
              </h3>

              <button
                onClick={() =>
                  setShowPollModal(
                    false
                  )
                }
                style={{
                  border:
                    'none',

                  background:
                    'none',

                  cursor:
                    'pointer'
                }}
              >
                <X
                  size={20}
                  color="#A3AED0"
                />
              </button>
            </div>

            <form
              onSubmit={
                handleCreatePoll
              }
              style={{
                display:
                  'flex',

                flexDirection:
                  'column',

                gap:
                  '16px'
              }}
            >
              <div
                style={
                  formSectionStyle
                }
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  QUESTION
                </label>

                <input
                  type="text"
                  placeholder="e.g. When should we meet for review?"
                  required
                  style={
                    inputStyle
                  }
                  value={
                    pollQuestion
                  }
                  onChange={(e) =>
                    setPollQuestion(
                      e.target
                        .value
                    )
                  }
                />
              </div>

              <div
                style={
                  formSectionStyle
                }
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  OPTIONS
                </label>

                {pollOptions.map(
                  (
                    opt,
                    idx
                  ) => (
                    <input
                      key={
                        idx
                      }
                      type="text"
                      placeholder={`Option ${idx + 1}`}
                      required
                      style={{
                        ...inputStyle,

                        marginBottom:
                          '8px'
                      }}
                      value={
                        opt
                      }
                      onChange={(e) => {
                        const newOpts =
                          [
                            ...pollOptions
                          ];

                        newOpts[
                          idx
                        ] =
                          e.target.value;

                        setPollOptions(
                          newOpts
                        );
                      }}
                    />
                  )
                )}

                <button
                  type="button"
                  onClick={() =>
                    setPollOptions(
                      [
                        ...pollOptions,
                        ''
                      ]
                    )
                  }
                  style={{
                    border:
                      'none',

                    background:
                      'none',

                    color:
                      '#0B1A3F',

                    fontWeight:
                      '800',

                    fontSize:
                      '12px',

                    cursor:
                      'pointer',

                    textAlign:
                      'left',

                    padding:
                      '4px 0'
                  }}
                >
                  + Add Option
                </button>
              </div>

              <button
                type="submit"
                style={{
                  ...saveBtn,

                  marginTop:
                    '10px'
                }}
              >
                Post Poll to
                Chat
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          MEMBERS MODAL
      ================================================= */}

      {showMembersDrawer && (
        <div
          style={
            overlay
          }
        >
          <div
            style={{
              width:
                '100%',

              maxWidth:
                '450px',

              background:
                'white',

              borderRadius:
                '28px',

              padding:
                '32px',

              border:
                '1px solid #E2E8F0'
            }}
          >
            <div
              style={{
                display:
                  'flex',

                justifyContent:
                  'space-between',

                alignItems:
                  'center',

                marginBottom:
                  '20px'
              }}
            >
              <div>
                <h3
                  style={{
                    margin:
                      0,

                    fontWeight:
                      '900',

                    fontSize:
                      '22px',

                    color:
                      '#0B1A3F'
                  }}
                >
                  All Members
                </h3>

                <p
                  style={{
                    margin:
                      '2px 0 0',

                    fontSize:
                      '12px',

                    color:
                      '#A3AED0',

                    fontWeight:
                      '700'
                  }}
                >
                  {
                    groupMembers.length
                  }{' '}
                  Total Members
                </p>
              </div>

              <button
                onClick={() =>
                  setShowMembersDrawer(
                    false
                  )
                }
                style={{
                  border:
                    'none',

                  background:
                    'none',

                  cursor:
                    'pointer'
                }}
              >
                <X
                  size={20}
                  color="#A3AED0"
                />
              </button>
            </div>

            <div
              style={{
                display:
                  'flex',

                flexDirection:
                  'column',

                gap:
                  '10px',

                maxHeight:
                  '60vh',

                overflowY:
                  'auto'
              }}
            >
              {groupMembers.map(
                (m) => (
                  <div
                    key={
                      m.user_id
                    }
                    onClick={() => {
                      if (
                        m.user_id !==
                        currentUser?.id
                      ) {
                        openMemberChat(
                          m
                        );

                        setShowMembersDrawer(
                          false
                        );
                      }
                    }}
                    style={{
                      padding:
                        '14px',

                      borderRadius:
                        '16px',

                      background:
                        '#F8FAFC',

                      border:
                        '1px solid #E2E8F0',

                      cursor:
                        m.user_id ===
                        currentUser?.id
                          ? 'default'
                          : 'pointer',

                      display:
                        'flex',

                      justifyContent:
                        'space-between',

                      alignItems:
                        'center'
                    }}
                  >
                    <div
                      style={{
                        display:
                          'flex',

                        alignItems:
                          'center',

                        gap:
                          '10px'
                      }}
                    >
                      <Circle
                        size={
                          10
                        }
                        fill={
                          m.isOnline
                            ? '#22C55E'
                            : '#94A3B8'
                        }
                        color={
                          m.isOnline
                            ? '#22C55E'
                            : '#94A3B8'
                        }
                      />

                      <div>
                        <div
                          style={{
                            display:
                              'flex',

                            alignItems:
                              'center',

                            gap:
                              '6px'
                          }}
                        >
                          <p
                            style={{
                              margin:
                                0,

                              fontWeight:
                                '800',

                              color:
                                '#0B1A3F',

                              fontSize:
                                '14px'
                            }}
                          >
                            {m
                              .profiles
                              ?.full_name ||
                              'Student'}
                          </p>

                          {m.user_id ===
                            selectedGroup?.creator_id && (
                            <span
                              style={{
                                fontSize:
                                  '10px',

                                background:
                                  PIN_COLORS.bg,

                                border: `1px solid ${PIN_COLORS.border}`,

                                color:
                                  PIN_COLORS.icon,

                                padding:
                                  '1px 5px',

                                borderRadius:
                                  '4px',

                                fontWeight:
                                  '800'
                              }}
                            >
                              Creator
                            </span>
                          )}
                        </div>

                        <p
                          style={{
                            margin:
                              0,

                            fontWeight:
                              '600',

                            color:
                              '#A3AED0',

                            fontSize:
                              '12px'
                          }}
                        >
                          {m
                            .profiles
                            ?.major ||
                            'No major set'}
                        </p>
                      </div>
                    </div>

                    {m.user_id !==
                      currentUser?.id && (
                      <div
                        style={{
                          display:
                            'flex',

                          alignItems:
                            'center',

                          gap:
                            '8px'
                        }}
                      >
                        <button
                          type="button"
                          onClick={(
                            e
                          ) => {
                            e.stopPropagation();

                            setSelectedMember(
                              m
                            );

                            setShowMembersDrawer(
                              false
                            );
                          }}
                          style={{
                            border:
                              'none',

                            background:
                              'none',

                            cursor:
                              'pointer',

                            display:
                              'flex'
                          }}
                        >
                          <User
                            size={
                              18
                            }
                            color="#A3AED0"
                          />
                        </button>

                        <MessageSquare
                          size={
                            18
                          }
                          color="#0B1A3F"
                        />
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          MEMBER PROFILE MODAL
      ================================================= */}

      {selectedMember && (
        <div
          style={
            overlay
          }
        >
          <div
            style={{
              width:
                '100%',

              maxWidth:
                '420px',

              background:
                'white',

              borderRadius:
                '28px',

              padding:
                '32px',

              border:
                '1px solid #E2E8F0'
            }}
          >
            <div
              style={{
                display:
                  'flex',

                justifyContent:
                  'space-between',

                alignItems:
                  'center',

                marginBottom:
                  '20px'
              }}
            >
              <span
                style={{
                  ...tagStyle,

                  background:
                    selectedGroup?.color ||
                    '#E0F2FE'
                }}
              >
                {selectedMember.user_id ===
                selectedGroup?.creator_id
                  ? 'Circle Leader'
                  : 'Member'}
              </span>

              <button
                onClick={() => {
                  setSelectedMember(
                    null
                  );

                  setShowDMChat(
                    false
                  );

                  setDirectChatMessage(
                    ''
                  );
                }}
                style={{
                  border:
                    'none',

                  background:
                    'none',

                  cursor:
                    'pointer'
                }}
              >
                <X
                  size={20}
                  color="#A3AED0"
                />
              </button>
            </div>

            <div
              style={{
                textAlign:
                  'center',

                padding:
                  '10px 0 20px'
              }}
            >
              <div
                style={{
                  width:
                    '72px',

                  height:
                    '72px',

                  borderRadius:
                    '50%',

                  background:
                    getAvatarColor(
                      selectedMember
                        .profiles
                        ?.full_name
                    ),

                  color:
                    '#0B1A3F',

                  display:
                    'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',

                  margin:
                    '0 auto 16px',

                  fontWeight:
                    '900',

                  fontSize:
                    '24px'
                }}
              >
                {getInitials(
                  selectedMember
                    .profiles
                    ?.full_name
                )}
              </div>

              <h4
                style={{
                  margin:
                    0,

                  fontSize:
                    '20px',

                  fontWeight:
                    '900',

                  color:
                    '#0B1A3F'
                }}
              >
                {selectedMember
                  .profiles
                  ?.full_name ||
                  'Student'}
              </h4>

              <p
                style={{
                  margin:
                    '4px 0 0',

                  fontWeight:
                    '700',

                  color:
                    '#A3AED0',

                  fontSize:
                    '13px'
                }}
              >
                {selectedMember
                  .profiles
                  ?.email ||
                  'No public email provided'}
              </p>

              <div
                style={{
                  marginTop:
                    '16px',

                  display:
                    'flex',

                  flexDirection:
                    'column',

                  gap:
                    '8px'
                }}
              >
                <div
                  style={{
                    background:
                      '#F8FAFC',

                    padding:
                      '10px 14px',

                    borderRadius:
                      '12px',

                    textAlign:
                      'left',

                    border:
                      '1px solid #E2E8F0'
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        '10px',

                      fontWeight:
                        '900',

                      color:
                        '#A3AED0',

                      display:
                        'block'
                    }}
                  >
                    MAJOR
                  </span>

                  <span
                    style={{
                      fontSize:
                        '13px',

                      fontWeight:
                        '800',

                      color:
                        '#0B1A3F'
                    }}
                  >
                    {selectedMember
                      .profiles
                      ?.major ||
                      'Not specified'}
                  </span>
                </div>

                <div
                  style={{
                    background:
                      '#F8FAFC',

                    padding:
                      '10px 14px',

                    borderRadius:
                      '12px',

                    textAlign:
                      'left',

                    border:
                      '1px solid #E2E8F0'
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        '10px',

                      fontWeight:
                        '900',

                      color:
                        '#A3AED0',

                      display:
                        'block'
                    }}
                  >
                    ACADEMIC
                    LEVEL
                  </span>

                  <span
                    style={{
                      fontSize:
                        '13px',

                      fontWeight:
                        '800',

                      color:
                        '#0B1A3F'
                    }}
                  >
                    {selectedMember
                      .profiles
                      ?.academic_year ||
                      'Not specified'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                setShowDMChat(
                  !showDMChat
                )
              }
              style={{
                ...saveBtn,

                width:
                  '100%',

                display:
                  'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',

                gap:
                  '8px'
              }}
            >
              <MessageSquare
                size={16}
              />
              Send Direct
              Message
            </button>

            {showDMChat && (
              <div
                style={{
                  marginTop:
                    '16px',

                  display:
                    'flex',

                  flexDirection:
                    'column',

                  gap:
                    '8px'
                }}
              >
                <textarea
                  placeholder="Type a private message..."
                  style={{
                    ...inputStyle,

                    height:
                      '80px',

                    resize:
                      'vertical'
                  }}
                  value={
                    directChatMessage
                  }
                  onChange={(e) =>
                    setDirectChatMessage(
                      e.target
                        .value
                    )
                  }
                />

                <button
                  onClick={
                    handleSendDirectMessage
                  }
                  style={
                    saveBtn
                  }
                >
                  Send DM
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}