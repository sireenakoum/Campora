import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

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
  LogOut,
  CheckCheck,
  Maximize2,
  Minimize2,
  Loader2,
  FileText,
  Calendar,
  Clock,
  Lock,
  Globe2,
  KeyRound,
  ShieldCheck
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import {
  SectionHeader,
  EmptyState,
  IconChip,
  StatTile,
  SegmentedControl
} from '../components/luminous';

const ShellPortal = ({ active, children }) =>
  active ? createPortal(children, document.body) : children;
import {
  dmViewStatus,
  markDmNotificationsRead
} from '../lib/dmNotifications';




// =====================================================
// CONSTANTS
// =====================================================

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
  (major) => major !== 'All Majors Welcome'
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

const DM_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
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




// =====================================================
// GROUP COLORS
// =====================================================

const GROUP_COLORS = [
  { bg: '#E0F2FE', name: 'Blue' },
  { bg: '#FCE7F3', name: 'Pink' },
  { bg: '#F3E8FF', name: 'Purple' },
  { bg: '#FEE2E2', name: 'Red' },
  { bg: '#FFEDD5', name: 'Peach' },
  { bg: '#CFFAFE', name: 'Light Blue' },
  { bg: '#D1FAE5', name: 'Mint' },
  { bg: '#E0E7FF', name: 'Periwinkle' },
  { bg: '#0B1A3F', name: 'Navy' }
];




// =====================================================
// COLOR / CONTRAST HELPERS
// =====================================================

const normalizeHex = (hex) => {
 if (!hex) return '#E0F2FE';

let clean = hex.replace('#', '').trim();
if (clean.length === 3) {
  clean = clean
    .split('')
    .map((character) => character + character)
    .join('');

}
if (clean.length !== 6) {
    return '#E0F2FE';
}

  return `#${clean}`;
};




const getContrastColor = (backgroundColor) => {
 const hex = normalizeHex(backgroundColor).replace('#', '');

const red = parseInt(hex.substring(0, 2), 16);
const green = parseInt(hex.substring(2, 4), 16);
const blue = parseInt(hex.substring(4, 6), 16);

const luminance =
 (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance < 0.58 ? '#FFFFFF' : '#002D62';
};




const isDarkColor = (backgroundColor) => {
  return getContrastColor(backgroundColor) === '#FFFFFF';
};




const getMutedContrastColor = (backgroundColor) => {
  return isDarkColor(backgroundColor)
   ? 'rgba(255,255,255,0.78)'
   : '#717786';
};




const getSoftContrastColor = (backgroundColor) => {
 return isDarkColor(backgroundColor)
  ? 'rgba(255,255,255,0.14)'
  : 'rgba(0,45,98,0.07)';

};
const getContrastBorder = (backgroundColor) => {
  return isDarkColor(backgroundColor)
   ? 'rgba(255,255,255,0.24)'
   : 'rgba(0,45,98,0.10)';
};

const getReadableAccentColor = (backgroundColor) => {
  const hex = normalizeHex(backgroundColor).replace('#', '');
  const red = parseInt(hex.substring(0, 2), 16);
  const green = parseInt(hex.substring(2, 4), 16);
  const blue = parseInt(hex.substring(4, 6), 16);

  const luminance =
    (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  if (luminance < 0.58) {
    return `#${hex}`;
  }

  const darken = (value) =>
    Math.max(0, Math.round(value * 0.58))
      .toString(16)
      .padStart(2, '0');

  return `#${darken(red)}${darken(green)}${darken(blue)}`;
};

const generateStudyGroupCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const values = new Uint32Array(6);
    crypto.getRandomValues(values);

    return Array.from(values)
      .map((value) => alphabet[value % alphabet.length])
      .join('');
  }

  return Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase();
};
// =====================================================
// USER HELPERS
// =====================================================

const getInitials = (name) =>
 (name || 'S')
  .trim()
  .split(' ')
  .filter(Boolean)
  .map((part) => part[0])
  .slice(0, 2)
  .join('')
  .toUpperCase();




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




// =====================================================
// MAIN COMPONENT
// =====================================================

export default function StudyGroups() {

// =====================================================
// GENERAL STATE
// =====================================================

const [currentUser, setCurrentUser] = useState(null);
const [groups, setGroups] = useState([]);

const [joinedGroupIds, setJoinedGroupIds] =
 useState([]);

const [joinRequests, setJoinRequests] = useState([]);
const [privateCode, setPrivateCode] = useState('');
const [privateJoinMessage, setPrivateJoinMessage] = useState('');
const [requestActionLoading, setRequestActionLoading] = useState(null);

/*
 * IMPORTANT:
 * Discover now opens automatically whenever the page
 * initially loads.
 */
const [view, setView] = useState('browse');

const [selectedGroup, setSelectedGroup] =
 useState(null);

const [groupMembers, setGroupMembers] =
 useState([]);

const [editingGroup, setEditingGroup] =
 useState(null);

const [loading, setLoading] =
 useState(true);

const [actionLoading, setActionLoading] =
 useState(false);




// =====================================================
// CHAT STATE
// =====================================================

const [messages, setMessages] =
 useState([]);

const [newMessage, setNewMessage] =
 useState('');

const [
  notificationsMuted,
  setNotificationsMuted
] = useState({});

const chatBottomRef =
useRef(null);

const [replyingTo, setReplyingTo] =
 useState(null);

const [
  activeMessageMenu,
  setActiveMessageMenu
] = useState(null);

const [
  chatFullscreen,
  setChatFullscreen
] = useState(false);

useEffect(() => {
  const handleKey = (event) => {
    if (event.key === 'Escape') {
      setChatFullscreen(false);
    }
  };

  if (chatFullscreen) {
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
  } else {
    document.body.style.overflow = '';
  }

  return () => {
    document.body.style.overflow = '';
    window.removeEventListener('keydown', handleKey);
  };
}, [chatFullscreen]);

useEffect(() => {
  if (view !== 'chat') {
    setChatFullscreen(false);
  }
}, [view]);




// =====================================================
// PINNED GROUP MESSAGES
// =====================================================

const [
  pinnedGroupMessages,
  setPinnedGroupMessages
] = useState(() => {

const saved =
 localStorage.getItem(
   'campora_pinned_group_messages'
 );

 return saved
    ? JSON.parse(saved)
    : {};
});


useEffect(() => {

localStorage.setItem(
  'campora_pinned_group_messages',
  JSON.stringify(
    pinnedGroupMessages
  )
);

}, [pinnedGroupMessages]);
const togglePinGroupMessage = (msgId) => {

if (!selectedGroup) return;
setPinnedGroupMessages((previous) => {

const currentPinned =
 previous[selectedGroup.id] || [];

const isPinned =
 currentPinned.includes(msgId);

return {
 ...previous,

      [selectedGroup.id]:
       isPinned
         ? currentPinned.filter(
            (id) => id !== msgId
          )
         :[
            ...currentPinned,
            msgId
          ]
 };
});

  setActiveMessageMenu(null);
};




// =====================================================
// SOCIAL / MEMBER / POLL STATE
// =====================================================

const [selectedMember, setSelectedMember] =
 useState(null);

const [
  showMembersDrawer,
  setShowMembersDrawer
] = useState(false);
const [
  showPollModal,
  setShowPollModal

] = useState(false);

const [
 pollQuestion,
 setPollQuestion
] = useState('');

const [
  pollOptions,
  setPollOptions
] = useState(['', '']);




// =====================================================
// DIRECT MESSAGES
// =====================================================

const [
  directChatMessage,
  setDirectChatMessage
] = useState('');

const [
  showDMChat,
  setShowDMChat
] = useState(false);

const [
  dmConversations,
  setDmConversations
] = useState([]);

const [
  selectedDmUser,
  setSelectedDmUser
] = useState(null);

const [
  dmMessages,
  setDmMessages
] = useState([]);

const [
 newDmMessageText,
 setNewDmMessageText

] = useState('');

const dmChatBottomRef = useRef(null);
const dmChatHistoryRef = useRef(null);
const dmTypingChannelRef = useRef(null);
const dmTypingTimeoutRef = useRef(null);
const partnerTypingTimeoutRef = useRef(null);

const [dmFullscreen, setDmFullscreen] = useState(false);
const [partnerTyping, setPartnerTyping] = useState(false);

const [dmReplyingTo, setDmReplyingTo] = useState(null);
const [activeDmMessageMenu, setActiveDmMessageMenu] = useState(null);
const [pinnedDmMessages, setPinnedDmMessages] = useState(() => {
  const saved =
localStorage.getItem('campora_studygroups_pinned_dm_messages');
  return saved ? JSON.parse(saved) : {};
});
const [dmLocalReactions, setDmLocalReactions] = useState(() => {
  const saved = localStorage.getItem('campora_studygroups_dm_reactions');
  return saved ? JSON.parse(saved) : {};
});




// =====================================================
// DM SEARCH
// =====================================================

const [
  dmSearchQuery,
  setDmSearchQuery
] = useState('');

const [
  dmSearchResults,
  setDmSearchResults
] = useState([]);

const [
  searchingUsers,
  setSearchingUsers
] = useState(false);




// =====================================================
// PINNED GROUPS + DMS
// =====================================================
const [

  pinnedChats,
  setPinnedChats
] = useState(() => {

const saved =
 localStorage.getItem(
   'campora_pinned_chats'
 );

 return saved
    ? JSON.parse(saved)
    :{
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

useEffect(() => {
  localStorage.setItem('campora_studygroups_pinned_dm_messages',
JSON.stringify(pinnedDmMessages));
}, [pinnedDmMessages]);

useEffect(() => {
  localStorage.setItem('campora_studygroups_dm_reactions',
JSON.stringify(dmLocalReactions));
}, [dmLocalReactions]);

const togglePinDm = (partnerId) => {

setPinnedChats((previous) => {

const isPinned =
 previous.dms.includes(partnerId);

return {
 ...previous,
      dms: isPinned
      ? previous.dms.filter(
        (id) =>

              id !== partnerId
         )
        :[
             ...previous.dms,
             partnerId
        ]
   };
  });
};




const togglePinGroup = (
  groupId,
  event
) => {

if (event) {
  event.stopPropagation();
}

setPinnedChats((previous) => {
 const isPinned =
  previous.groups.includes(
    groupId
  );

return {
 ...previous,

        groups: isPinned
        ? previous.groups.filter(
          (id) =>
             id !== groupId
         )
        :[
            ...previous.groups,
            groupId
        ]
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
     :{
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

environment:
'Library Soft',
study_style:
 'Silent',

location: '',

mode:
'In-person',

color:
 '#E0F2FE',
max_size:
4,

description:
'',

major:

'All Majors Welcome',

 goal:
    'Exam Prep',

 visibility:
   'public'
});

const [customStudyGoal, setCustomStudyGoal] = useState('');
const [customNoiseVibe, setCustomNoiseVibe] = useState('');





// =====================================================
// FETCH STUDY GROUP DATA
// =====================================================

const fetchData = async () => {

 try {
setLoading(true);

const {
 data: { session },
 error: sessionError
}=
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
}=

await supabase
 .from('study_groups')
 .select(
   '*, group_members (user_id)'
 )
 .order(
   'created_at',
   {
     ascending: false
   }
 );




if (groupsError) {

     console.error(
      'Study groups error:',
       groupsError
     );

     setGroups([]);

     return;
}


setGroups(
  groupsData || []
);
if (user) {

      const {
       data: memberData,
       error: memberError
      }=
    await supabase
     .from(
       'group_members'
     )
     .select(
       'group_id'
     )
     .eq(
       'user_id',
       user.id

    );




if (memberError) {

             console.error(
               'Group membership error:',
               memberError
             );
}


setJoinedGroupIds(
 memberData?.map(
   (member) =>
     member.group_id
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

}, []);

useEffect(() => {
  if (!currentUser?.id) {
    setJoinRequests([]);
    return;
  }

  const loadJoinRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('group_join_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('JOIN REQUESTS ERROR:', error);
        return;
      }

      const rows = data || [];
      const requesterIds = [
        ...new Set(
          rows
            .map((request) => request.requester_id)
            .filter(Boolean)
        ),
      ];

      let profilesById = {};

      if (requesterIds.length > 0) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id, full_name, name, email, major, academic_year')
          .in('id', requesterIds);

        profilesById = Object.fromEntries(
          (profileRows || []).map((profile) => [profile.id, profile])
        );
      }

      setJoinRequests(
        rows.map((request) => ({
          ...request,
          requester_profile:
            profilesById[request.requester_id] || null,
        }))
      );
    } catch (error) {
      console.error('Could not load private circle requests:', error);
    }
  };

  loadJoinRequests();

  const channel = supabase
    .channel(`study-group-join-requests-${currentUser.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'group_join_requests',
      },
      loadJoinRequests
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [currentUser?.id]);



useEffect(() => {

localStorage.setItem(

  'campora_user_prefs',
  JSON.stringify(myPrefs)
);

}, [myPrefs]);




useEffect(() => {

const {
 data: { subscription }
}=
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


// =====================================================
// FETCH GROUP MEMBERS
// =====================================================

useEffect(() => {
if (!selectedGroup?.id) return;

const isMember =
 joinedGroupIds.includes(selectedGroup.id) ||
 selectedGroup.creator_id === currentUser?.id;

// Member identities are private until the user actually joins the circle.
if (!isMember) {
  setGroupMembers([]);
  setShowMembersDrawer(false);
  return;
}

const fetchMembers = async () => {
 const { data: dbMembers, error: memberError } = await supabase
  .from('group_members')
  .select('user_id')

 .eq('group_id', selectedGroup.id);

 if (memberError) console.error('Could not load members:', memberError);

const memberUserIds = new Set((dbMembers || []).map((member) =>
member.user_id));
if (selectedGroup.creator_id)
memberUserIds.add(selectedGroup.creator_id);

 const userIdsArray = Array.from(memberUserIds).filter(Boolean);
 if (userIdsArray.length === 0) {
   setGroupMembers([]);
   return;
 }

 const { data: directoryProfiles, error: directoryError } = await supabase.rpc(
   'get_student_directory_by_ids',
   { user_ids: userIdsArray }
 );

  if (directoryError) console.error('Could not load student directory:',
directoryError);

 const directoryMap = new Map();
 (directoryProfiles || []).forEach((profile) => directoryMap.set(profile.id,
profile));

 const { data: recentMessages } = await supabase
  .from('group_messages')
  .select('user_id, sender_name')
  .eq('group_id', selectedGroup.id);

 const messageNameMap = new Map();
 (recentMessages || []).forEach((message) => {
  if (message.user_id && message.sender_name) {
    messageNameMap.set(message.user_id, message.sender_name);
  }
});

const resolvedMembers = userIdsArray.map((userId) => {
 const isSelf = currentUser && userId === currentUser.id;
 const directoryProfile = directoryMap.get(userId);
 const nameFromChat = messageNameMap.get(userId);

 const selfName =
  currentUser?.user_metadata?.name ||
  currentUser?.user_metadata?.full_name ||

 currentUser?.email?.split('@')[0] ||
 'You';

 const resolvedName =
  directoryProfile?.name ||
  (isSelf ? selfName : '') ||
  nameFromChat ||
  (userId === selectedGroup.creator_id ? 'Circle Creator' : 'Circle Member');

 const resolvedEmail =
  directoryProfile?.email ||
  (isSelf ? currentUser?.email || '' : '');

 return {
    user_id: userId,
    profiles: {
      ...(directoryProfile || {}),
      name: resolvedName,
      full_name:
        directoryProfile?.full_name ||
        directoryProfile?.name ||
        resolvedName,
      email: resolvedEmail,
      major:
        directoryProfile?.major ||
        (isSelf ? currentUser?.user_metadata?.major : '') ||
        'Not specified',
      academic_year:
        directoryProfile?.academic_year ||
        directoryProfile?.year ||
        (isSelf ? currentUser?.user_metadata?.academic_year : '') ||
        'Not specified',
      account_type:
        directoryProfile?.account_type ||
        (isSelf ? currentUser?.user_metadata?.account_type : '') ||
        '',
      guest_title:
        directoryProfile?.guest_title ||
        (isSelf ? currentUser?.user_metadata?.guest_title : '') ||
        '',
      avatar_url:
        directoryProfile?.avatar_url ||
        directoryProfile?.avatar ||
        (isSelf ? currentUser?.user_metadata?.avatar_url : '') ||
        '',
      courses_taken:
        directoryProfile?.courses_taken ||
        directoryProfile?.courses ||
        (isSelf ? currentUser?.user_metadata?.courses_taken : []) ||
        []
    },
    isOnline: Boolean(isSelf)
 };
});

  setGroupMembers(resolvedMembers);
};

fetchMembers();

if (view === 'details' || view === 'chat') {
  const fetchMessages = async () => {
     const { data, error } = await supabase
      .from('group_messages')
      .select('*')
      .eq('group_id', selectedGroup.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Could not load messages:', error);
      return;
    }

      setMessages(data || []);
    };

    fetchMessages();

    const channel = supabase
     .channel(`group_messages_${selectedGroup.id}`)
     .on(
       'postgres_changes',
       {
         event: '*',
         schema: 'public',
         table: 'group_messages',
         filter: `group_id=eq.${selectedGroup.id}`
       },
       fetchMessages
     )
     .subscribe();

    return () => supabase.removeChannel(channel);
}

  setMessages([]);
}, [selectedGroup?.id, view, currentUser, joinedGroupIds]);

useEffect(() => {
  if (view === 'chat') chatBottomRef.current?.scrollIntoView({ behavior:
'smooth' });
}, [messages, view]);

// =====================================================
// DIRECT MESSAGE CONVERSATIONS
// =====================================================

const fetchDirectMessageConversations = async () => {
 if (!currentUser) return;
 const { data: dms, error } = await supabase
  .from('direct_messages')
  .select('*')
  .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
  .order('created_at', { ascending: false });

if (error) {
  console.error('Could not load direct messages:', error);
  setDmConversations([]);
  return;
}

const messagesList = dms || [];
const partnerIds = new Set();
messagesList.forEach((message) => {
 if (message.sender_id !== currentUser.id)
partnerIds.add(message.sender_id);
 if (message.receiver_id !== currentUser.id)
partnerIds.add(message.receiver_id);
});

const partnerIdsArray = Array.from(partnerIds).filter(Boolean);
if (partnerIdsArray.length === 0) {
  setDmConversations([]);
  return;
}

const { data: directoryProfiles, error: directoryError } = await supabase.rpc(
  'get_student_directory_by_ids',
  { user_ids: partnerIdsArray }
);

if (directoryError) console.error('Could not resolve DM student names:',
directoryError);

const profileMap = new Map();
(directoryProfiles || []).forEach((profile) => profileMap.set(profile.id, profile));

const conversationList = partnerIdsArray.map((partnerId) => {
 const profile = profileMap.get(partnerId);
 const lastMessage = messagesList.find(
   (message) => message.sender_id === partnerId || message.receiver_id ===
partnerId
 );
 const fallbackMember = groupMembers.find((member) => member.user_id
=== partnerId);
 const fallbackName =
  fallbackMember?.profiles?.name ||
  fallbackMember?.profiles?.full_name ||
  '';

  return {
   partnerId,
   name: profile?.name || fallbackName || profile?.email?.split('@')[0] ||
'Student',
   email: profile?.email || fallbackMember?.profiles?.email || '',
   major: fallbackMember?.profiles?.major || 'Not specified',
   academic_year: fallbackMember?.profiles?.academic_year || 'Not specified',

    lastMessage: lastMessage?.content || '',
    lastMessageTime: lastMessage?.created_at || null,
    unreadCount: messagesList.filter(
     (message) =>
      message.sender_id === partnerId &&
      message.receiver_id === currentUser.id &&
      !message.read_at
    ).length
  };
});

  setDmConversations(conversationList);
};

useEffect(() => {
  if (view !== 'dms') return;
  fetchDirectMessageConversations();

  // Keep the conversation list (last message + unread badges) fresh in real
  // time whenever any direct message for this user changes.
  const channel = supabase
   .channel(`study_dm_inbox_${currentUser?.id || 'guest'}`)
   .on(
    'postgres_changes',
    {
     event: '*',
     schema: 'public',
     table: 'direct_messages'
    },
    () => {
     fetchDirectMessageConversations();
    }
   )
   .subscribe();

  return () => {
   supabase.removeChannel(channel);
  };
}, [view, currentUser]);

// =====================================================
// INDIVIDUAL DM CHAT
// =====================================================

useEffect(() => {
if (!selectedDmUser || !currentUser) {
  if (!selectedDmUser) setDmMessages([]);
  return;
}

 const fetchDmMessages = async () => {
  const { data, error } = await supabase
   .from('direct_messages')
   .select('*')
   .or(
     `and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedDmUser.partnerId}),and(sender_id.eq.${selectedDmUser.partnerId},receiver_id.eq.${currentUser.id})`
   )
   .order('created_at', { ascending: true });

 if (error) {
   console.error('Could not load DM conversation:', error);
  return;
  }
  setDmMessages(data || []);
};

fetchDmMessages();

 const channel = supabase
  .channel(`direct_messages_${currentUser.id}_${selectedDmUser.partnerId}`)
  .on('postgres_changes', { event: '*', schema: 'public', table:
'direct_messages' }, fetchDmMessages)

 .subscribe();

  return () => supabase.removeChannel(channel);
}, [selectedDmUser?.partnerId, currentUser?.id]);

// =====================================================
// DM TYPING INDICATOR (REALTIME BROADCAST)
// =====================================================

 useEffect(() => {
  if (!selectedDmUser?.partnerId || !currentUser?.id) return;
  const memberIds = [currentUser.id, selectedDmUser.partnerId].sort();
  const channelName = `dm_typing_${memberIds[0]}_${memberIds[1]}`;
  setPartnerTyping(false);
  const channel = supabase
   .channel(channelName, { config: { broadcast: { self: false } } })
   .on('broadcast', { event: 'typing' }, ({ payload }) => {
    if (payload?.userId && payload.userId !== currentUser.id) {
     setPartnerTyping(Boolean(payload.isTyping));
     clearTimeout(partnerTypingTimeoutRef.current);
     if (payload.isTyping) {
      partnerTypingTimeoutRef.current = setTimeout(
       () => setPartnerTyping(false),
       5000
      );
     }
    }
   })
   .subscribe();
  dmTypingChannelRef.current = channel;
  return () => {
   clearTimeout(dmTypingTimeoutRef.current);
   clearTimeout(partnerTypingTimeoutRef.current);
   supabase.removeChannel(channel);
   dmTypingChannelRef.current = null;
   setPartnerTyping(false);
  };
 }, [selectedDmUser?.partnerId, currentUser?.id]);

const stopTypingBroadcast = () => {
 clearTimeout(dmTypingTimeoutRef.current);
 const channel = dmTypingChannelRef.current;
 if (!channel) return;
 channel
  .send({
   type: 'broadcast',
   event: 'typing',
   payload: { userId: currentUser?.id, isTyping: false }
  })
  .catch(() => {});
};

const handleDmComposerChange = (value) => {
 setNewDmMessageText(value);
 const channel = dmTypingChannelRef.current;
 if (!channel || !currentUser?.id) return;
 if (!value.trim()) {
  stopTypingBroadcast();
  return;
 }
 channel
  .send({
   type: 'broadcast',
   event: 'typing',
   payload: { userId: currentUser.id, isTyping: true }
  })
  .catch(() => {});
 clearTimeout(dmTypingTimeoutRef.current);
 dmTypingTimeoutRef.current = setTimeout(stopTypingBroadcast, 2500);
};

// =====================================================
// MARK INCOMING DMS AS READ
// =====================================================

useEffect(() => {
 if (!currentUser?.id || !selectedDmUser?.partnerId) return;
 const hasUnread = dmMessages.some(
  (message) =>
   message.sender_id === selectedDmUser.partnerId &&
   message.receiver_id === currentUser.id &&
   !message.read_at
 );
  if (!hasUnread) return;
  const timeout = setTimeout(async () => {
   await supabase
    .from('direct_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', selectedDmUser.partnerId)
    .eq('receiver_id', currentUser.id)
    .is('read_at', null);

   await markDmNotificationsRead({
    userId: currentUser.id,
    senderId: selectedDmUser.partnerId,
    senderName: selectedDmUser.name
   });

   fetchDirectMessageConversations();
  }, 250);
  return () => clearTimeout(timeout);
}, [dmMessages, currentUser?.id, selectedDmUser?.partnerId, selectedDmUser?.name]);

// When a conversation is opened or new messages arrive, show the most
// recent messages at the bottom of the chat history.
useEffect(() => {
  const history = dmChatHistoryRef.current;
  if (!history || !selectedDmUser?.partnerId || dmMessages.length === 0) return;
  history.scrollTop = history.scrollHeight;
}, [dmMessages, selectedDmUser?.partnerId]);

// Keep the global DM listener aware of which conversation is open so it can
// skip creating notifications for messages the user is already reading.
useEffect(() => {
 if (view === 'dms' && selectedDmUser?.partnerId) {
  dmViewStatus.viewingPartnerId = selectedDmUser.partnerId;
 } else {
  dmViewStatus.viewingPartnerId = null;
 }
 return () => {
  dmViewStatus.viewingPartnerId = null;
 };
}, [view, selectedDmUser?.partnerId]);

// =====================================================
// SEARCH STUDENTS FOR DM
// =====================================================

useEffect(() => {
if (view !== 'dms') return;

const query = dmSearchQuery.trim();
if (!query) {
  setDmSearchResults([]);
  setSearchingUsers(false);
  return;
}

setSearchingUsers(true);
const timeout = setTimeout(async () => {
 const { data, error } = await supabase.rpc('search_student_directory', {
  search_text: query
 });

   if (error) {
     console.error('Student search error:', error);
     setDmSearchResults([]);
   } else {
     setDmSearchResults((data || []).filter((profile) => profile.id !==
currentUser?.id));
   }
   setSearchingUsers(false);
 }, 250);
  return () => clearTimeout(timeout);
}, [dmSearchQuery, view, currentUser?.id]);

const startNewDmWithUser = (profile) => {
 if (!profile?.id || profile.id === currentUser?.id) return;

const profileName =
 profile.name ||
 profile.full_name ||
 profile.email?.split('@')[0] ||
 'Student';

const existingConversation = dmConversations.find(

  (conversation) => conversation.partnerId === profile.id
);

 if (existingConversation) {
   setSelectedDmUser({
     ...existingConversation,
     name: existingConversation.name !== 'Student' ?
existingConversation.name : profileName,
     email: existingConversation.email || profile.email || ''
   });
 } else {
   setSelectedDmUser({
     partnerId: profile.id,
     name: profileName,
     email: profile.email || '',
     major: profile.major || 'Not specified',
     academic_year: profile.academic_year || 'Not specified',
     lastMessage: '',
     lastMessageTime: null
   });
 }

  setDmSearchQuery('');
  setDmSearchResults([]);
};


const openMemberProfile = async (member) => {
  if (!member || member.user_id === currentUser?.id) return;

  let fullProfile = member.profiles || {};

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', member.user_id)
      .maybeSingle();

    if (!error && data) {
      fullProfile = {
        ...fullProfile,
        ...data,
        major: data.major || fullProfile.major || 'Not specified',
        academic_year:
          data.academic_year ||
          data.year ||
          fullProfile.academic_year ||
          'Not specified'
      };
    }
  } catch (profileError) {
    console.error('Could not load full member profile:', profileError);
  }

  setSelectedMember({
    ...member,
    profiles: fullProfile
  });
};

const openMemberChat = (member) => {
 if (!member || member.user_id === currentUser?.id) return;

startNewDmWithUser({
 id: member.user_id,
 name: member.profiles?.name || member.profiles?.full_name || 'Student',
 email: member.profiles?.email || '',
 major: member.profiles?.major,
 academic_year: member.profiles?.academic_year
});

  setView('dms');
};

const toggleNotifications = (
  groupId
) => {

setNotificationsMuted(
 (previous) => ({

...previous,

     [groupId]:
       !previous[groupId]
    })
  );
};


// =====================================================
// CREATE GROUP
// =====================================================

const handleCreate = async (
  event
) => {

event.preventDefault();

 setActionLoading(true);
try {

const {
 data: { user },
 error: userError
}=
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

if (
  newGroup.goal === 'Other' &&
  !customStudyGoal.trim()
) {
  alert('Please write your study goal.');
  setActionLoading(false);
  return;
}

if (
  newGroup.environment === 'Other' &&
  !customNoiseVibe.trim()
) {
  alert('Please describe your noise vibe.');
  setActionLoading(false);
  return;
}

const {
 data,
 error
}=
 await supabase
  .from(
    'study_groups'
  )
  .insert([
    {
      ...newGroup,

      goal:
        newGroup.goal === 'Other'
          ? customStudyGoal.trim()
          : newGroup.goal,

      environment:
        newGroup.environment === 'Other'
          ? customNoiseVibe.trim()
          : newGroup.environment,

      creator_id:
        user.id,

      visibility:
        newGroup.visibility || 'public',

      join_code:
        newGroup.visibility === 'private'
          ? generateStudyGroupCode()
          : null,

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
){

    setNewGroup({

  name: '',

  subject: '',

  environment:
  'Library Soft',

  study_style:
   'Silent',

  location:
    '',

  mode:
  'In-person',

  color:
   newGroup.color || '#E0F2FE',
   max_size:
   4,

   description:
   '',

   major:
   'All Majors Welcome',
   goal:
      'Exam Prep',

   visibility:
      'public'
  });




   setCustomStudyGoal('');
   setCustomNoiseVibe('');

   await fetchData();
setView(
  'created'
);


   const createdCircle = data[0];

   if (createdCircle.visibility === 'private') {
     alert(
       `Your private study circle has been submitted for Campora review!\n\nYour invite code is: ${createdCircle.join_code}\n\nOnce Campora approves the circle, people with this code can request access and you can accept or decline them.`
     );
   } else {
     alert(
       'Your public study circle has been submitted for review!\n\nOnce approved, it will appear on Discover and anyone can join instantly.'
     );
   }
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
async (event) => {

event.preventDefault();


 if (!editingGroup) {
   return;
 }
setActionLoading(true);




const {
 error
}=
 await supabase
  .from(
    'study_groups'
  )
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
 async (
   groupId,
   event
 ) => {

if (event) {
    event.stopPropagation();
}



if (
  !window.confirm(
    'Are you sure you want to delete this study group? This action cannot be undone.' )
){

    return;
}


setActionLoading(true);

   const {
    error
   }=
    await supabase
     .from(
       'study_groups'
     )
     .delete()
     .eq(
       'id',
       groupId
     );
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
 (previous) => ({
      ...previous,

   groups:
     previous.groups.filter(
       (id) =>
         id !== groupId
     )
  })
);


setPinnedGroupMessages(
 (previous) => {

      const updated = {
        ...previous
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
          ){

              setSelectedGroup(null);

              setView(
                'browse'
              );
          }


          await fetchData();
      }


  setActionLoading(false);
};
// =====================================================
// JOIN GROUP
// =====================================================

const getMyJoinRequest = (groupId) =>
  joinRequests.find(
    (request) =>
      request.group_id === groupId &&
      request.requester_id === currentUser?.id
  );

const getPendingRequestsForGroup = (groupId) =>
  joinRequests.filter(
    (request) =>
      request.group_id === groupId &&
      request.status === 'pending'
  );

const createStudyGroupNotification = async ({
  userId,
  title,
  message,
}) => {
  if (!userId) return;

  try {
    await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          title,
          message,
          category: 'Study Groups',
          read: false,
        },
      ]);
  } catch (error) {
    console.error('STUDY GROUP NOTIFICATION ERROR:', error);
  }
};

const notifyStudyGroupMembersAboutMessage = async ({
  group,
  senderId,
  senderName,
  content,
}) => {
  if (!group?.id || !senderId) return;

  try {
    const { data: memberRows, error: memberError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', group.id);

    if (memberError) {
      console.error('GROUP MESSAGE MEMBER LOOKUP ERROR:', memberError);
      return;
    }

    const recipientIds = new Set(
      (memberRows || [])
        .map((member) => member.user_id)
        .filter(Boolean)
    );

    if (group.creator_id) {
      recipientIds.add(group.creator_id);
    }

    recipientIds.delete(senderId);

    if (recipientIds.size === 0) {
      return;
    }

    const preview =
      String(content || '').length > 90
        ? `${String(content).slice(0, 87)}...`
        : String(content || '');

    const notificationRows = Array.from(recipientIds).map((userId) => ({
      user_id: userId,
      title: `New message in ${group.name || 'Study Group'}`,
      message: `${senderName || 'A member'} sent a message: ${preview}`,
      category: 'Study Groups',
      read: false,
    }));

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notificationRows);

    if (notificationError) {
      console.error(
        'GROUP MESSAGE NOTIFICATION ERROR:',
        notificationError
      );
    }
  } catch (error) {
    console.error(
      'COULD NOT CREATE GROUP MESSAGE NOTIFICATIONS:',
      error
    );
  }
};

const handlePrivateCodeJoin = async () => {
  const code = privateCode.trim().toUpperCase();

  if (!code) {
    setPrivateJoinMessage('Enter the private circle code first.');
    return;
  }

  if (!currentUser?.id) {
    setPrivateJoinMessage('You must be logged in to request access.');
    return;
  }

  setRequestActionLoading('code');
  setPrivateJoinMessage('');

  try {
    const { data, error } = await supabase.rpc(
      'request_private_study_group_join',
      {
        p_code: code,
      }
    );

    if (error) {
      throw error;
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (!result) {
      setPrivateJoinMessage('That private circle code was not found.');
      return;
    }

    if (result.request_status === 'already_member') {
      setPrivateJoinMessage(`You're already a member of ${result.group_name}.`);
      await fetchData();
      return;
    }

    if (result.request_status === 'pending') {
      setPrivateJoinMessage(
        `Request sent to ${result.group_name}. The creator can now accept or decline it.`
      );
    } else if (result.request_status === 'approved') {
      setPrivateJoinMessage(`Your request for ${result.group_name} is already approved.`);
      await fetchData();
    } else if (result.request_status === 'declined') {
      setPrivateJoinMessage(
        `Your previous request for ${result.group_name} was declined.`
      );
    }

    setPrivateCode('');
  } catch (error) {
    console.error('PRIVATE JOIN CODE ERROR:', error);
    setPrivateJoinMessage(
      error?.message || 'Could not request access to that private circle.'
    );
  } finally {
    setRequestActionLoading(null);
  }
};

const handlePrivateRequestDecision = async (
  request,
  decision
) => {
  if (!request?.id) return;

  setRequestActionLoading(request.id);

  try {
    if (decision === 'approved') {
      const { error: memberError } = await supabase
        .from('group_members')
        .upsert(
          [
            {
              group_id: request.group_id,
              user_id: request.requester_id,
            },
          ],
          {
            onConflict: 'group_id,user_id',
          }
        );

      if (memberError) {
        throw memberError;
      }
    }

    const { error: requestError } = await supabase
      .from('group_join_requests')
      .update({
        status: decision,
        decided_at: new Date().toISOString(),
        decided_by: currentUser?.id,
      })
      .eq('id', request.id);

    if (requestError) {
      throw requestError;
    }

    const group = groups.find(
      (groupItem) => groupItem.id === request.group_id
    );

    await createStudyGroupNotification({
      userId: request.requester_id,
      title:
        decision === 'approved'
          ? 'Private study group request accepted'
          : 'Private study group request declined',
      message:
        decision === 'approved'
          ? `Your request has been accepted. You are now in ${group?.name || 'the private study circle'} and can open the group chat.`
          : `Your request to join ${group?.name || 'the private study circle'} was declined.`,
    });

    setJoinRequests((previous) =>
      previous.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status: decision,
              decided_at: new Date().toISOString(),
              decided_by: currentUser?.id,
            }
          : item
      )
    );

    await fetchData();
  } catch (error) {
    console.error('PRIVATE REQUEST DECISION ERROR:', error);
    alert(
      `Could not ${decision === 'approved' ? 'accept' : 'decline'} request: ${
        error?.message || 'Please try again.'
      }`
    );
  } finally {
    setRequestActionLoading(null);
  }
};

const handleJoin = async (
  groupId
) => {

const group =
 groups.find(
   (groupItem) =>
    groupItem.id ===
    groupId
 );

if (
  !group ||
  group.approval_status !==
    'approved'
){

     alert(
       'This study circle is not available to join yet.'
     );
       return;
}




if (
  group.visibility === 'private'
) {
  alert(
    'Private circles can only be joined with their invite code. Enter the code from Discover to send an access request.'
  );
  return;
}

if (
  getGroupMemberCount(
    group
  ) >= group.max_size
){

       alert(
         'This study circle is already full.'
       );
     return;
}
setActionLoading(true);



const {
 data: { user }
}=
 await supabase.auth.getUser();




if (user) {

    const {
     error
    }=
     await supabase
      .from(
        'group_members'
      )
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
     ){

      console.error(
        'JOIN GROUP ERROR:',
        error
      );


       alert(
        `Could not join circle: ${error.message}`
            );
          }
      }
         await createStudyGroupNotification({
           userId: group.creator_id,
           title: 'New member joined your public study group',
           message: `A student joined ${group.name}. Public circles allow approved users to join instantly.`,
         });

         await fetchData();

          setView(
            'joined'
          );
}


  setActionLoading(false);
};


// =====================================================
// LEAVE GROUP
// =====================================================

const handleLeaveGroup =
 async (groupId) => {

     if (!currentUser) {

      return;
    }
  if (
    !window.confirm(
      "Are you sure you want to leave this study circle? You'll need to rejoin to see its chat again." )
  ){

        return;
  }


  setActionLoading(true);


  const {
   error
  }=
   await supabase
    .from(
 'group_members'
)
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
  (previous) => ({

 ...previous,

   groups:
     previous.groups.filter(
       (id) =>
         id !== groupId
     )
  })
);


setView(
  'joined'
);


setSelectedGroup(
 null
    );
      await fetchData();
  }


  setActionLoading(false);
};


// =====================================================
// SEND GROUP MESSAGE
// =====================================================

const handleSendMessage =
 async (event) => {

  event.preventDefault();


  const trimmed =
   newMessage.trim();
if (
  !trimmed ||
  !selectedGroup ||
  !currentUser
){

      return;
}


const senderName =
 currentUser
  .user_metadata
  ?.full_name ||
 currentUser
  .email
  ?.split('@')[0] ||
 'Student';


const tempId =
 `temp-${Date.now()}`;
const replySnapshot =
 replyingTo;
const replyPayload =
 replySnapshot
  ?{

     reply_to_id:
      String(
        replySnapshot.id
      ),

     reply_to_sender:
      replySnapshot
       .sender_name ||
      'Student',

     reply_to_content:
      replySnapshot.type ===
      'poll'
       ? replySnapshot
           .poll_data
           ?.question ||
         ''
       : replySnapshot
           .content ||
         ''
 }
:{

     reply_to_id:

    null,

   reply_to_sender:
    null,

  reply_to_content:
   null
};




const optimisticMessage = {

id:
  tempId,
group_id:
selectedGroup.id,
user_id:
currentUser.id,

sender_name:
 senderName,

content:
 trimmed,

type:
 'text',

reactions:
 {},

 created_at:
  new Date()
   .toISOString(),
  ...replyPayload
};


setMessages(
  (previous) => [
    ...previous,
    optimisticMessage
  ]
);

setNewMessage('');


setReplyingTo(null);




const {
 data,
 error
}=
 await supabase
  .from(
  'group_messages'
 )
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

 type:
  'text',

 reactions:
  {},
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



setMessages(
  (previous) =>
   previous.filter(
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
     (previous) => {

          const withoutTemp =
           previous.filter(
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
               (first, second) =>
                 new Date(
                   first.created_at
                 )-
                 new Date(
                   second.created_at
                 )
             );
         }
       );

    await notifyStudyGroupMembersAboutMessage({
      group: selectedGroup,
      senderId: currentUser.id,
      senderName,
      content: trimmed,
    });
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
){

    return;
  }
const {
 error
}=
 await supabase
  .from(
    'direct_messages'
  )
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


const createStudyDmMarker = (reply = null) => {
 if (!reply) return '';
 try {
  return `[[CAMPORA_DM:${encodeURIComponent(JSON.stringify({ reply }))}]]`;
 } catch {
  return '';
 }
};

const parseStudyDm = (rawContent) => {
 const raw = String(rawContent || '');
 const match = raw.match(/^\[\[CAMPORA_DM:([^\]]+)\]\]/);
 if (!match) {
  return {
   text: raw.replace(/^\[\[CAMPORA_DM:[^\]]+\]\]/, ''),
   reply: null
  };
 }
 try {
  const meta = JSON.parse(decodeURIComponent(match[1]));
  return { text: raw.replace(/^\[\[CAMPORA_DM:([^\]]+)\]\]/, ''), reply: meta.reply
|| null };
 } catch {
  return {
   text: raw.replace(/^\[\[CAMPORA_DM:[^\]]+\]\]/, ''),
   reply: null
  };
 }
};
const togglePinDmMessage = (messageId) => {
 if (!selectedDmUser?.partnerId) return;
 setPinnedDmMessages((previous) => {
  const key = selectedDmUser.partnerId;
  const current = previous[key] || [];
  return { ...previous, [key]: current.includes(messageId) ? current.filter((id) =>
id !== messageId) : [...current, messageId] };
 });
 setActiveDmMessageMenu(null);
};
const toggleLocalDmReaction = (messageId, emoji) => {
 if (!currentUser?.id) return;
 setDmLocalReactions((previous) => {
  const currentMessage = previous[messageId] || {};
  const users = currentMessage[emoji] || [];
  const nextUsers = users.includes(currentUser.id) ? users.filter((id) => id !==
currentUser.id) : [...users, currentUser.id];
  return { ...previous, [messageId]: { ...currentMessage, [emoji]: nextUsers } };
 });
 setActiveDmMessageMenu(null);
};

// =====================================================
// SEND DM IN INBOX
// =====================================================

const handleSendDmInInbox =

async (event) => {

 event.preventDefault();


 const trimmed =
  newDmMessageText.trim();


 if (
   !trimmed ||
   !selectedDmUser ||
   !currentUser
 ){
      return;
   }


  const {
   data,
   error
  }=
   await supabase
    .from(
      'direct_messages'
    )
    .insert([
      {
        sender_id:
         currentUser.id,
          receiver_id:
           selectedDmUser.partnerId,

         content:
          `${createStudyDmMarker(dmReplyingTo)}${trimmed}`
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
setDmReplyingTo(null);
setActiveDmMessageMenu(null);
stopTypingBroadcast();

window.requestAnimationFrame(() => {
 window.requestAnimationFrame(() => {
  const history = dmChatHistoryRef.current;
  if (history) {
   history.scrollTo({
    top: history.scrollHeight,
    behavior: 'smooth'
   });
  }
 });
});


if (data) {
    setDmMessages(
     (previous) => {

    if (
      previous.some(
        (message) =>
         message.id ===
         data.id
      )
    ){

            return previous;
    }
            return [
              ...previous,
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
async (messageId) => {

if (
  String(
    messageId
  ).startsWith(
    'temp-'
  )
){

    return;
}


 const {
   error
  }=
   await supabase
    .from(
      'group_messages'
    )
    .delete()
    .eq(
      'id',
      messageId
    );
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


setMessages(
 (previous) =>
  previous.filter(
   (message) =>
       message.id !==
       messageId
    )
);




setPinnedGroupMessages(
 (previous) => {

       if (!selectedGroup) {

           return previous;
       }
           return {

           ...previous,

            [selectedGroup.id]:
             (
               previous[
                 selectedGroup.id
               ] || []
                ).filter(
                  (id) =>
                    id !== messageId
                )
           };
  }
);

setActiveMessageMenu(
  null
);




if (
  replyingTo?.id ===
  messageId
){

       setReplyingTo(null);
  }
};
// =====================================================
// CLEAR CHAT
// =====================================================

const handleClearChat =
 async () => {

 if (!selectedGroup) {
   return;
 }
if (
  !window.confirm(
    'Are you sure you want to clear all messages in this group?'
  )
){

    return;
}


 const {
 error
}=
 await supabase
  .from(
    'group_messages'
  )
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
 (previous) => ({

     ...previous,

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
   messageId,
   emoji
 ) => {

const targetMessage =
 messages.find(
  (message) =>
   message.id ===

     messageId
);


if (
  !targetMessage ||
  !currentUser ||
  String(
    messageId
  ).startsWith(
    'temp-'
  )
){
    return;
}


const existingReactions =
 targetMessage.reactions || {};
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
   :[
      ...usersWhoReacted,
      currentUser.id
    ];




const updatedReactions = {

...existingReactions,

 [emoji]:

     updatedUsers
};


setMessages(
 (previous) =>
  previous.map(
  (message) =>
   message.id ===
   messageId
   ?{
    ...message,
       reactions:
        updatedReactions
       }
     : message
     )
);
const {
 error
}=
 await supabase
  .from(
    'group_messages'
  )
  .update({

   reactions:
   updatedReactions
 })
 .eq(
   'id',
   messageId
 );


if (error) {

 console.error(
   'REACTION ERROR:',
   error
 );


 setMessages(
  (previous) =>
   previous.map(

             (message) =>
              message.id ===
              messageId
              ? targetMessage
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
 async (event) => {
event.preventDefault();


const validOptions =
 pollOptions
 .map(
   (option) =>
     option.trim()
 )
 .filter(Boolean);


if (
  !pollQuestion.trim() ||
  validOptions.length < 2 ||
  !selectedGroup ||
  !currentUser
){

     return;

}


const senderName =
 currentUser
  .user_metadata
  ?.full_name ||
 currentUser
  .email
  ?.split('@')[0] ||
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

type:
 'poll',

reactions:
 {},

poll_data: {

    question:
    pollQuestion.trim(),

    options:
    validOptions.map(
     (option) => ({

           text:
            option,

           votes:
            []

              })
          )
  }
};



setMessages(
 (previous) => [
  ...previous,
    {
    ...pollData,

      id:
        tempId,

    created_at:
     new Date()
     .toISOString()
   }
  ]
);
const originalQuestion =
 pollQuestion;


const originalOptions =
 [
   ...pollOptions
 ];


setPollQuestion('');


setPollOptions([
 '',
 ''
]);




setShowPollModal(
  false
);

const {
 data,
 error
}=
 await supabase
  .from(
    'group_messages'
  )
  .insert([
      pollData
    ])
    .select()
      .single();


if (error) {

console.error(
  'POLL ERROR:',
  error
);
   setMessages(
     (previous) =>
      previous.filter(
        (message) =>
         message.id !==
         tempId
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
       (previous) => {

      const withoutTemp =
       previous.filter(
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
             (first, second) =>
               new Date(
                 first.created_at
               )-
               new Date(
                 second.created_at
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
  messageId,
  optionIndex

) => {

const targetMessage =
 messages.find(
   (message) =>
    message.id ===
    messageId
 );


if (
  !targetMessage ||
    !targetMessage.poll_data ||
    !currentUser ||
    String(
        messageId
      ).startsWith(
        'temp-'
      )
     ){

    return;
}


const clickedOption =
 targetMessage
  .poll_data
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
 targetMessage
  .poll_data
  .options
  .map(

 (
   option,
   index
 ) => {

    const filteredVotes =
     (
       option.votes ||
       []
     ).filter(
       (id) =>
         id !==
       currentUser.id
    );
if (
  index ===
    optionIndex &&
  !alreadyVotedForThisOption
){
        filteredVotes.push(
          currentUser.id
        );
      }


      return {

      ...option,

        votes:
         filteredVotes
      };
  }
);


const updatedPollData = {

...targetMessage.poll_data,

  options:
   updatedOptions
};


setMessages(
 (previous) =>

 previous.map(
 (message) =>
  message.id ===
  messageId
  ?{
   ...message,

        poll_data:
         updatedPollData
        }
      : message
 )
);




const {
 error
}=
  await supabase
   .from(
     'group_messages'
   )
   .update({

       poll_data:
         updatedPollData
     })
     .eq(
       'id',
       messageId
     );


if (error) {

     console.error(
       'VOTE ERROR:',
       error
     );




     setMessages(
      (previous) =>

         previous.map(
           (message) =>
            message.id ===
            messageId
            ? targetMessage
            : message
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
){

    score += 30;
}




if (
  group.goal ===
  myPrefs.goal
){

    score += 20;
}

if (
  group.environment ===
  myPrefs.env
){

    score += 20;
}


if (
  group.study_style ===
  myPrefs.style
){
    score += 15;
}




if (
  group.mode ===
  myPrefs.mode
){

    score += 15;
}


  return Math.min(
    score,
    100
  );
};


// =====================================================
// GROUP FILTERS
// =====================================================

const discoverGroups =
 groups.filter(
 (group) => {

    const isApproved =
     group.approval_status ===

      'approved';



       const isPublic =
         (group.visibility || 'public') === 'public';

       return (
         isApproved &&
         isPublic
       );
  }
);


const createdGroups =
 groups.filter(
  (group) =>
   group.creator_id ===

     currentUser?.id
);


const joinedOnlyGroups =
 groups.filter(
   (group) =>
    group.approval_status ===
      'approved' &&
    joinedGroupIds.includes(
      group.id
    ) &&
    group.creator_id !==
      currentUser?.id
 );
// =====================================================
// PIN SORTING
// =====================================================

const sortGroupsWithPins = (
  list
) => {
 return [
   ...list
 ].sort(
   (
     first,
     second
   ) => {

      const firstPinned =
       pinnedChats
       .groups
       .includes(
         first.id
       );


      const secondPinned =
       pinnedChats
       .groups
       .includes(
         second.id
       );


      if (

    firstPinned ===
    secondPinned
   ){

       return 0;
   }



   return firstPinned
    ? -1
    : 1;
   }
 );
};
const sortedDmConversations =
 [
   ...dmConversations
 ].sort(
   (
    first,
    second
  ) => {

   const firstPinned =
    pinnedChats
    .dms
    .includes(
      first.partnerId
    );


   const secondPinned =
    pinnedChats
    .dms
    .includes(
      second.partnerId
    );


   if (
     firstPinned ===
     secondPinned
   ){

       return 0;
   }

       return firstPinned
        ? -1
        : 1;
  }
);


// =====================================================
// MEMBER COUNTS
// =====================================================
const getGroupMemberCount = (
  group
) => {

if (
  selectedGroup?.id ===
    group.id &&
 groupMembers.length > 0
){

      return groupMembers.length;
}



const memberSet =
 new Set(
   group
    .group_members
    ?.map(
      (member) =>
        member.user_id
    ) || []
 );


if (
  group.creator_id
){

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
    (member) =>
     member.isOnline
  ).length;
};




// =====================================================
// THEME COLOR HELPERS FOR SELECTED GROUP
// =====================================================

const selectedThemeColor =
 selectedGroup?.color ||
 '#E0F2FE';


const selectedThemeTextColor =
 getContrastColor(
   selectedThemeColor
 );


const selectedThemeMutedColor =
 getMutedContrastColor(
   selectedThemeColor
 );


// =====================================================
// STYLES
// =====================================================

const tagStyle = {

padding:
'4px 10px',

borderRadius:
'8px',

background:
'rgba(255,255,255,0.8)',

fontSize:
 '11px',

fontWeight:
 '800',
color:
'#1A1B1F',

  textTransform:
   'uppercase'
};
const iconBtnStyle = {

background:
'rgba(255,255,255,0.7)',

border:
'none',

padding:
'8px',

borderRadius:
'10px',

cursor:
 'pointer',

display:
'flex',

alignItems:
 'center',

  justifyContent:
    'center'
};

const STUDY_NAV_COLORS = {
  browse: {
    bg: '#F3F7FD',
    text: '#648CCB',
    border: '#DDE7F5'
  },
  created: {
    bg: '#F7F4FC',
    text: '#8B78B8',
    border: '#E7E0F2'
  },
  joined: {
    bg: '#F2F9F7',
    text: '#5E9A8B',
    border: '#D9EBE6'
  },
  dms: {
    bg: '#FAFBFE',
    text: '#0B1A3F',
    border: '#DDE3EE'
  },
  preferences: {
    bg: '#FFF9F1',
    text: '#C99758',
    border: '#F0E2CB'
  },
  create: {
    bg: '#FFF5F6',
    text: '#C76E7D',
    border: '#F0DDE1'
  }
};

const addBtnStyle = {

padding:
'12px 22px',

borderRadius:
'16px',

border:
'none',

background:
'#0B1A3F',

color:
 'white',

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
 '8px',
 boxShadow:
  '0 8px 16px rgba(0,45,98,0.2)'
};


const formSectionStyle = {

display:
'flex',

flexDirection:
  'column',

  gap:
   '8px'
};


const labelStyle = {

fontSize:
 '11px',

fontWeight:
 '900',

color:
 '#717786',

  letterSpacing:
    '0.5px'
};


const inputStyle = {

padding:
'12px 16px',

borderRadius:
'12px',

border:
'1.5px solid #E3E2E7',
fontSize:
 '14px',
fontWeight:
 '700',

color:
 '#1A1B1F',

outline:
'none',

background:
'#FAFBFC',

  boxSizing:
   'border-box'
};




const chipGridStyle = {

display:
'flex',

flexWrap:
  'wrap',

  gap:
   '8px'
};


const chipStyle = {

padding:
'8px 16px',

borderRadius:
'10px',

border:
'1.5px solid #E3E2E7',

background:
'#E9E7ED',
color:
 '#717786',

fontSize:
 '12px',

fontWeight:
 '800',

  cursor:
   'pointer'
};




const activeChipStyle = {

...chipStyle,

background:
'#0B1A3F',

color:
 'white',

  borderColor:
   '#002D62'
};

const saveBtn = {

padding:
'14px 24px',

borderRadius:
'14px',

border:
'none',

background:
'#0B1A3F',

color:
 'white',
fontWeight:
'900',

fontSize:
 '14px',

  cursor:
   'pointer'
};


const backBtn = {

display:
'flex',

alignItems:
 'center',

gap:
'6px',

border:
'none',

background:
'none',

color:

'#717786',

fontWeight:
 '800',

cursor:
 'pointer',

  fontSize:
   '13px'
};


const overlay = {

position:
 'fixed',
top:
 0,
left:
  0,

right:
  0,

bottom:
0,

background:
'rgba(0,45,98,0.5)',

backdropFilter:
 'blur(10px)',

WebkitBackdropFilter:
 'blur(10px)',

display:
'flex',

alignItems:
 'center',

justifyContent:
   'center',

zIndex:
 1000,

  padding:
   '20px'
};

// =====================================================
// INSTAGRAM-STYLE DIRECT MESSAGE STYLES
// =====================================================
const instagramPinnedMessageLabel = { display: 'flex', alignItems: 'center',
gap: '4px', color: PIN_COLORS.icon, fontSize: '9px', fontWeight: '900',
marginBottom: '4px' };
const instagramReactionRow = { display: 'flex', gap: '4px', flexWrap: 'wrap',
marginTop: '4px' };
const instagramReactionPill = { border: '1px solid #E3E2E7', background:
'#FFFFFF', borderRadius: '999px', padding: '3px 8px', fontSize: '11px', cursor:
'pointer', color: '#1A1B1F', fontWeight: '800' };
const instagramMessageMenuButton = { position: 'absolute', top: '8px', border:
'none', background: 'transparent', color: '#717786', cursor: 'pointer', padding:
'4px 7px', fontWeight: '900', letterSpacing: '1px' };
const instagramMessageMenu = { position: 'absolute', top: '34px', background:
'#FFFFFF', border: '1px solid #E3E2E7', borderRadius: '13px', padding: '7px',
boxShadow: '0 10px 25px rgba(0,45,98,0.12)', zIndex: 40, display: 'flex',
alignItems: 'center', gap: '3px', flexWrap: 'wrap', minWidth: '250px', maxWidth:
'min(310px, calc(100vw - 80px))' };
const instagramEmojiButton = { border: 'none', background: 'transparent',
fontSize: '16px', cursor: 'pointer', padding: '4px' };
const instagramMenuAction = { border: 'none', background: '#E9E7ED', color:
'#1A1B1F', borderRadius: '8px', padding: '6px 8px', display: 'flex', alignItems:
'center', gap: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' };
const instagramReplyQuote = { display: 'flex', flexDirection: 'column', gap: '2px',
padding: '7px 9px', marginBottom: '7px', borderRadius: '9px', background:
'#FFFFFF', borderLeft: '3px solid #002D62', color: '#717786', fontSize: '10px' };
const instagramReplyQuoteMine = { background: 'rgba(255,255,255,0.13)',
borderLeftColor: 'rgba(255,255,255,0.7)', color: 'rgba(255,255,255,0.9)' };
const instagramReplyComposerPreview = { padding: '10px 18px', borderTop:
'1px solid #E3E2E7', background: '#E9E7ED', display: 'flex', alignItems: 'center',
justifyContent: 'space-between', gap: '12px', color: '#1A1B1F', fontSize: '10px',
flexShrink: 0, position: 'relative', zIndex: 3 };
const studyGroupsPageShellStyle = {
  width: '100%',
  minHeight: '100%',
  boxSizing: 'border-box',
  background: 'transparent',
  padding: '8px 4px 28px'
};

const instagramReplyClose = { border: 'none', background: 'transparent', color:
'#717786', cursor: 'pointer', display: 'flex' };

function WhiteStudyEmptyState({
 icon: Icon,
 title,
 text,
 action
}) {
 return (
  <div
   style={{
    width: '100%',
    minHeight: '220px',
    boxSizing: 'border-box',
    background: '#FFFFFF',
    border: '1px solid #E5EAF2',
    borderRadius: '22px',
    boxShadow: '0 7px 22px rgba(11,26,63,0.045)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '30px 24px'
   }}
  >
   <div
    style={{
     width: '66px',
     height: '66px',
     borderRadius: '50%',
     background: '#FFFFFF',
     border: '1px solid #E2E8F0',
     boxShadow: '0 5px 16px rgba(11,26,63,0.08)',
     color: '#0B1A3F',
     display: 'flex',
     alignItems: 'center',
     justifyContent: 'center',
     marginBottom: '15px'
    }}
   >
    <Icon size={29} strokeWidth={1.9} />
   </div>

   <h3
    style={{
     margin: 0,
     color: '#0B1A3F',
     fontSize: '17px',
     fontWeight: '900'
    }}
   >
    {title}
   </h3>

   {text && (
    <p
     style={{
      maxWidth: '520px',
      margin: '7px 0 0',
      color: '#7A879A',
      fontSize: '12px',
      fontWeight: '700',
      lineHeight: 1.55
     }}
    >
     {text}
    </p>
   )}

   {action && (
    <div
     style={{
      marginTop: '18px',
      display: 'flex',
      justifyContent: 'center'
     }}
    >
     {action}
    </div>
   )}
  </div>
 );
}

const instagramDmShell = {
  display: 'grid',
  gridTemplateColumns: '390px minmax(0, 1fr)',
  minHeight: '700px',
  height: '76vh',
  maxHeight: '880px',
  background: '#FFFFFF',
  border: '1.5px solid #E3E2E7',
  borderRadius: '24px',
  overflow: 'hidden',

  boxShadow: '0 10px 30px rgba(0,45,98,0.08)'
};
const instagramDmSidebar = { borderRight: '1px solid #E3E2E7', display: 'flex',
flexDirection: 'column', minWidth: 0, background: '#FFFFFF' };
const instagramDmSidebarHeader = { padding: '24px 22px 16px', display: 'flex',
alignItems: 'center', justifyContent: 'space-between', gap: '12px' };
const instagramDmSidebarTitle = { margin: 0, color: '#1A1B1F', fontSize: '22px',
fontWeight: '900' };
const instagramDmSidebarSubtitle = { margin: '4px 0 0', color: '#717786',
fontSize: '11px', fontWeight: '700' };
const instagramSearchWrap = { padding: '0 18px 16px' };
const instagramSearchBar = { height: '50px', border: '1.5px solid #E3E2E7',
borderRadius: '15px', background: '#E9E7ED', display: 'flex', alignItems:
'center', gap: '10px', padding: '0 15px', boxSizing: 'border-box' };
const instagramSearchIcon = { color: '#717786', pointerEvents: 'none',
flexShrink: 0 };
const instagramSearchInput = { width: '100%', minWidth: 0, height: '100%',
border: 'none', outline: 'none', padding: 0, margin: 0, background: 'transparent',
color: '#1A1B1F', fontSize: '13px', fontWeight: '700', fontFamily: 'inherit',
boxSizing: 'border-box', lineHeight: 1 };
const instagramSearchClear = { border: 'none', background: 'transparent',
color: '#717786', cursor: 'pointer', padding: 0, display: 'flex', alignItems:
'center', justifyContent: 'center', flexShrink: 0 };
const instagramSearchResults = { margin: '0 16px 12px', border: '1px solid #E3E2E7', borderRadius: '14px', padding: '6px', maxHeight: '250px', overflowY: 'auto', background: '#FFFFFF', boxShadow: '0 8px 22px rgba(0,45,98,0.08)',
zIndex: 2 };
const instagramSearchStatus = { padding: '14px', textAlign: 'center', color:
'#717786', fontSize: '12px', fontWeight: '700' };
const instagramSearchResultRow = { width: '100%', border: 'none', background:
'#FFFFFF', borderRadius: '11px', padding: '11px', display: 'flex', alignItems:
'center', gap: '12px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' };
const instagramThreadList = { flex: 1, overflowY: 'auto', padding: '6px 10px 16px' }; const instagramThreadRow = { width: '100%', border: 'none', background:
'transparent', borderRadius: '16px', padding: '13px 12px', display: 'flex', gap:
'13px', alignItems: 'center', textAlign: 'left', cursor: 'pointer', fontFamily:
'inherit' };
const instagramThreadRowActive = { background: '#F1F5F9' };
const instagramAvatar = { width: '48px', height: '48px', borderRadius: '50%',
flexShrink: 0, border: '1.5px solid #E3E2E7', background: '#E9E7ED', color:
'#1A1B1F', fontSize: '14px', fontWeight: '900', display: 'flex', alignItems:
'center', justifyContent: 'center' };
const instagramAvatarLarge = { ...instagramAvatar, width: '52px', height:
'52px',
fontSize: '15px' };
const instagramPersonName = { margin: 0, color: '#1A1B1F', fontSize: '14px',

fontWeight: '900', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow:
'ellipsis' };
const instagramPersonMeta = { margin: '3px 0 0', color: '#717786', fontSize:
'10px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden',
textOverflow: 'ellipsis' };
const instagramThreadTopLine = { display: 'flex', alignItems: 'center',
justifyContent: 'space-between', gap: '8px' };
const instagramThreadDate = { color: '#717786', fontSize: '8px', fontWeight:
'700', flexShrink: 0 };
const instagramMessagePreview = { margin: '5px 0 0', color: '#717786',
fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden',
textOverflow: 'ellipsis' };
const instagramEmptyThreads = { padding: '32px 14px', textAlign: 'center',
color: '#717786', fontSize: '11px', fontWeight: '700' };
const instagramPinButton = { border: 'none', background: 'transparent', cursor:
'pointer', padding: '5px', display: 'flex', flexShrink: 0 };
const instagramChatPanel = { minWidth: 0, minHeight: 0, height: '100%',
display: 'flex', flexDirection: 'column', background: '#FFFFFF', overflow:
'hidden' };
const instagramChatHeader = { minHeight: '86px', padding: '16px 24px',
borderBottom: '1px solid #E3E2E7', display: 'flex', alignItems: 'center',
justifyContent: 'space-between', gap: '14px' };
const instagramChatName = { margin: 0, color: '#1A1B1F', fontSize: '17px',
fontWeight: '900' };
const instagramChatEmail = { margin: '4px 0 0', color: '#717786', fontSize:
'11px', fontWeight: '700' };
const instagramHeaderPin = { width: '40px', height: '40px', borderRadius:
'12px', border: '1px solid #E3E2E7', background: '#FFFFFF', display: 'flex',
alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const instagramHeaderPinActive = { background: PIN_COLORS.bg, border: `1px
solid ${PIN_COLORS.border}` };
const instagramChatHistory = { position: 'relative', flex: '1 1 auto', minHeight: 0,
overflowY: 'auto', overflowX: 'hidden', overscrollBehavior: 'contain',
WebkitOverflowScrolling: 'touch', padding: '26px 24px', background:
'#FFFFFF' };
const instagramEmptyChat = { height: '100%', display: 'flex', flexDirection:
'column', alignItems: 'center', justifyContent: 'center', color: '#717786',
fontSize: '12px', fontWeight: '700' };
const instagramNoChat = { height: '100%', display: 'flex', flexDirection:
'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
padding: '35px' };
const instagramNoChatIcon = { width: '72px', height: '72px', borderRadius:
'50%', border: '2px solid #002D62', color: '#1A1B1F', display: 'flex', alignItems:
'center', justifyContent: 'center', marginBottom: '14px' };
const instagramNoChatTitle = { margin: 0, color: '#1A1B1F', fontSize: '18px',
fontWeight: '900' };
const instagramNoChatText = { margin: '7px 0 0', color: '#717786', maxWidth:

'320px', fontSize: '11px', fontWeight: '700', lineHeight: 1.5 };
const instagramBubble = { maxWidth: '72%', padding: '12px 14px',
borderRadius: '19px', fontSize: '13px' };
const instagramBubbleMine = { background: '#002D62', color: '#FFFFFF',
borderBottomRightRadius: '6px' };
const instagramBubbleTheirs = { background: '#F1F5F9', color: '#1A1B1F',
borderBottomLeftRadius: '6px' };
const instagramBubbleText = { margin: 0, fontSize: '13px', lineHeight: 1.5,
fontWeight: '600', whiteSpace: 'pre-wrap', wordBreak: 'break-word' };
const instagramBubbleFooter = { display: 'flex', alignItems: 'center',
justifyContent: 'space-between', gap: '10px', marginTop: '5px', fontSize: '8px',
opacity: 0.7 };
const instagramComposer = { borderTop: '1px solid #E3E2E7', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', flexShrink: 0, position: 'relative', zIndex: 3 };
const instagramComposerInput = { flex: 1, height: '50px', minWidth: 0,
borderRadius: '20px', border: '1.5px solid #E3E2E7', background: '#E9E7ED',
padding: '0 16px', fontSize: '13px', fontWeight: '700', color: '#1A1B1F', outline:
'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const instagramSendButton = { width: '48px', height: '48px', borderRadius:
'50%', border: 'none', background: '#002D62', color: '#FFFFFF', display: 'flex',
alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 };

// =====================================================
// GROUP CARD COMPONENT
// =====================================================

const GroupCard = ({
 group,
 buttonLabel
}) => {

 const match =
  calculateMatch(
    group
  );
const count =
 getGroupMemberCount(
   group
);

const groupAccent =
 getReadableAccentColor(
   group.color || '#E0F2FE'
 );

const myJoinRequest =
 getMyJoinRequest(group.id);


const isCreator =
 group.creator_id ===
 currentUser?.id;

const isMember =
 isCreator ||
 joinedGroupIds.includes(
   group.id
 );


const isPinned =
 pinnedChats
 .groups
 .includes(
   group.id
 );


const approvalStatus =
 group.approval_status ||
 'pending';
const statusStyles = {

pending: {

background:
'#FFF9F1',

border:
'#F0E2CB',

color:
 '#C99758',

 label:
   'Pending Review'
},

approved: {
 background:
 '#F2F9F7',

   border:
   '#D9EBE6',

   color:
    '#5E9A8B',

 label:

     'Approved'
},

rejected: {

      background:
      '#FFF5F6',

      border:
      '#F0DDE1',

      color:
       '#C76E7D',

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
className="panel"
onClick={() => {
setSelectedGroup(
  group
);

 setView(
   'details'
 );
}}
style={{
cursor:
 'pointer',

transition:
  'all 0.2s ease',

minHeight:
'330px',
display:
'flex',

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

gap:
'16px',

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

gap:
'8px',

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

gap:
'6px',

 padding:
  '7px 11px',
borderRadius:
'10px',

background:
'#FFFFFF',
border:
'1.5px solid #DCE3F0',

color:
 '#1A1B1F',

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

<span
style={{
 display: 'inline-flex',
 alignItems: 'center',
 gap: '6px',
 padding: '7px 11px',
 borderRadius: '10px',
 background: group.color || '#0B1A3F',
 border: 'none',
 color: getContrastColor(group.color || '#0B1A3F'),
 fontSize: '11px',
 fontWeight: '900',
 textTransform: 'uppercase'
}}
>
{(group.visibility || 'public') === 'private' ? (
  <Lock size={13} color={getContrastColor(group.color || '#0B1A3F')} />
) : (
  <Globe2 size={13} color={getContrastColor(group.color || '#0B1A3F')} />
)}
{(group.visibility || 'public') === 'private'
  ? 'Private'
  : 'Public'}
</span>

{myJoinRequest &&
 !isMember &&
 (group.visibility || 'public') === 'private' && (
<span
style={{
 display: 'inline-flex',
 alignItems: 'center',
 gap: '6px',
 padding: '7px 11px',
 borderRadius: '10px',
 background:
   myJoinRequest.status === 'approved'
     ? '#F2F9F7'
     : myJoinRequest.status === 'declined'
     ? '#FFF5F6'
     : '#FFF9F1',
 border:
   myJoinRequest.status === 'approved'
     ? '1px solid #D9EBE6'
     : myJoinRequest.status === 'declined'
     ? '1px solid #F0DDE1'
     : '1px solid #F0E2CB',
 color:
   myJoinRequest.status === 'approved'
     ? '#5E9A8B'
     : myJoinRequest.status === 'declined'
     ? '#C76E7D'
     : '#C99758',
 fontSize: '11px',
 fontWeight: '900',
 textTransform: 'uppercase'
}}
>
<ShieldCheck size={13} />
{myJoinRequest.status === 'approved'
  ? 'Accepted'
  : myJoinRequest.status === 'declined'
  ? 'Declined'
  : 'Request Pending'}
</span>
)}


{isCreator && (
<span
style={{

display:
'inline-flex',

alignItems:
 'center',

gap:
'6px',
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

gap:
'6px',
padding:
 '7px 11px',

borderRadius:
'10px',
background:
status.background,

border:
`1px solid ${status.border}`,

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

 gap:
   '8px'
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
 margin:
 0,

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
  '#1A1B1F',

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
onClick={(event) => {

event.stopPropagation();

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
     : '#002D62'
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
onClick={(event) => {

 event.stopPropagation();

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
 color={selectedGroup.color || '#0B1A3F'}
/>

</button>


<button

type="button"
onClick={(event) =>
  handleDeleteGroup(
    group.id,
    event
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
 group.color || '#0B1A3F',
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

gap:
 '12px'

}}
>

<div
style={{
 display:
 'flex',

alignItems:
 'center',
gap:
'10px',
color:
 '#42506D',

 fontSize:
   '14px'
}}
>

<Target
size={17}
 color={group.color || '#0B1A3F'}
/>

<span
style={{
 fontWeight:
  '900',

 color:
   '#1A1B1F'
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

gap:
'10px',

color:
 '#42506D',

 fontSize:
   '14px'
}}
>

<Volume2
 size={17}
 color={group.color || '#0B1A3F'}
/>

<span
style={{
 fontWeight:
  '900',

 color:
   '#1A1B1F'
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
gap:
'10px',

color:
 '#42506D',

 fontSize:
   '14px'
}}
>
 <Users
  size={17}
  color={group.color || '#0B1A3F'}
 />

<span
style={{
 fontWeight:
  '900',

 color:
   '#1A1B1F'
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
   '12px'
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
Awaiting Campora Review
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
Only visible to you until approved.
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

gap:

 '10px',
 boxSizing:
   'border-box'
}}
>

<X
 size={16}
/>

Circle Was Not Approved
</div>

):(

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

 gap:
   '9px'
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

<div style={studyGroupsPageShellStyle}>
{/* =================================================
   HEADER + ALIGNED NAVIGATION
================================================= */}

{view !== 'chat' && (
  <>
    <SectionHeader title="Study Groups" />

    <div
      className="filter-row"
      style={{
        marginTop: '14px',
        marginBottom: '22px',
        background: 'transparent',
        border: 'none',
        boxShadow: 'none'
      }}
    >
      {[
        { key: 'browse', label: 'Discover', icon: LayoutGrid },
        { key: 'created', label: `Circles Created (${createdGroups.length})`, icon: Crown },
        { key: 'joined', label: `Joined Circles (${joinedOnlyGroups.length})`, icon: BookmarkCheck },
        { key: 'dms', label: 'Direct Messages', icon: Mail },
        { key: 'preferences', label: 'My Vibe Settings', icon: Sliders },
        { key: 'create', label: 'Create Circle', icon: Plus }
      ].map(({ key, label, icon: Icon }) => {
        const active = view === key;
        const tone = STUDY_NAV_COLORS[key] || STUDY_NAV_COLORS.browse;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={active ? 'filter-chip active' : 'filter-chip'}
            style={
              active
                ? {
                    background: tone.text,
                    border: `2px solid ${tone.border}`,
                    color: '#FFFFFF',
                    boxShadow: `0 6px 16px ${tone.border}66`,
                  }
                : {
                    background: tone.bg,
                    border: `1.5px solid ${tone.border}`,
                    color: tone.text,
                  }
            }
          >
            <Icon size={15} />
            {label}
          </button>
        );
      })}
    </div>
  </>
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

gap:
'14px',
  padding:
  '16px 18px',

     marginBottom:
     '28px',

     borderRadius:
     '18px',

     background:
     'linear-gradient(135deg,#F7F4FC 0%,#FBF9FD 100%)',

     border:

         '1.5px solid #E7E0F2'
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
    '#EEE8F7',

    color:
     '#8B78B8',

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
    '#1A1B1F',

  fontSize:
    '14px'
 }}
 >
 Safe communities, reviewed by Campora
 </p>


 <p
 style={{
  margin:
  0,

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
 Every new or edited study circle is reviewed before it appears in
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

{/* PRIVATE CIRCLE ENTRY */}
<div
style={{
 marginBottom: '24px',
 padding: '20px',
 borderRadius: '22px',
 background: '#FFFFFF',
 border: '1.5px solid #E5EAF2',
 boxShadow: '0 8px 24px rgba(11,26,63,0.05)'
}}
>
<div
style={{
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 gap: '16px',
 flexWrap: 'wrap'
}}
>
<div
style={{
 display: 'flex',
 alignItems: 'center',
 gap: '12px',
 minWidth: '240px',
 flex: '1 1 320px'
}}
>
<div
style={{
 width: '44px',
 height: '44px',
 borderRadius: '14px',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 background: '#F7F4FC',
 color: '#8B78B8',
 flexShrink: 0
}}
>
<KeyRound size={20} />
</div>
<div>
<h3
style={{
 margin: 0,
 color: '#1A1B1F',
 fontSize: '15px',
 fontWeight: '900'
}}
>
Join a Private Circle
</h3>
<p
style={{
 margin: '4px 0 0',
 color: '#717786',
 fontSize: '12px',
 lineHeight: 1.5,
 fontWeight: '700'
}}
>
Private circles do not appear on Discover. Enter the code shared by the creator, then wait for them to accept or decline your request.
</p>
</div>
</div>

<div
style={{
 display: 'flex',
 alignItems: 'center',
 gap: '9px',
 flex: '1 1 360px',
 justifyContent: 'flex-end',
 flexWrap: 'wrap'
}}
>
<style>{`
  input.private-circle-code-input::placeholder {
    font-size: 14px !important;
    font-weight: 600 !important;
    letter-spacing: 0 !important;
    text-transform: none !important;
    color: #9AA1AF !important;
    opacity: 1 !important;
  }
`}</style>

<div
 style={{
   position: 'relative',
   flex: '1 1 220px',
   maxWidth: '320px',
   minWidth: '210px'
 }}
>
<input
 className="private-circle-code-input"
 value={privateCode}
 onChange={(event) => {
   setPrivateCode(event.target.value.toUpperCase());
   setPrivateJoinMessage('');
 }}
 onKeyDown={(event) => {
   if (event.key === 'Enter') {
     event.preventDefault();
     handlePrivateCodeJoin();
   }
 }}
 placeholder="Enter private circle code"
 maxLength={12}
 style={{
   ...inputStyle,
   width: '100%',
   boxSizing: 'border-box',
   textTransform: 'none',
   letterSpacing: '0',
   fontSize: '14px',
   fontWeight: '600',
   background: '#FFFFFF'
 }}
/>
</div>

<button
 type="button"
 onClick={handlePrivateCodeJoin}
 disabled={requestActionLoading === 'code'}
 style={{
   ...saveBtn,
   minWidth: '150px',
   display: 'inline-flex',
   alignItems: 'center',
   justifyContent: 'center',
   gap: '8px'
 }}
>
{requestActionLoading === 'code' ? (
  <Loader2 size={17} className="animate-spin" />
) : (
  <Lock size={16} />
)}
Request Access
</button>
</div>
</div>

{privateJoinMessage && (
<div
style={{
 marginTop: '12px',
 padding: '11px 13px',
 borderRadius: '12px',
 background: '#F7F9FC',
 border: '1px solid #E5EAF2',
 color: '#42506D',
 fontSize: '11px',
 fontWeight: '800'
}}
>
{privateJoinMessage}
</div>
)}
</div>

{loading ? (

<div
className="panel"
style={{
 textAlign:
  'center'
}}
>
<Loader2
 size={22}
 className="animate-spin"
 style={{
  margin:
   '0 auto',
  display:
   'block'
 }}
/>
<p
style={{
 color:
  'var(--campora-muted)',

 fontWeight:
   '700'
}}
>
Loading available circles...
</p>
</div>
) : discoverGroups.length >
 0?(

<div
style={{
 display:
 'grid',

gridTemplateColumns:
'repeat(auto-fill,minmax(380px,1fr))',

 gap:
   '30px'
}}
>
{discoverGroups.map(
 (group) => (

   <GroupCard
   key={group.id}

       group={group}
       buttonLabel={
         joinedGroupIds.includes(
           group.id
         ) ||
         group.creator_id ===
           currentUser?.id
           ? 'Open Group Details'
           : 'View & Join Circle'
       }
      />
 )
)}

</div>

):(

<WhiteStudyEmptyState
 icon={Users}
 title="Find your study circle."
 text="There are no approved circles available yet. Create one and submit it for Campora review."
 action={(
  <button
   onClick={() =>
    setView(
      'create'
    )
   }
   style={{
    ...addBtnStyle,
    margin: '0 auto'
   }}
  >
   <Plus size={18} />
   Create a Circle
  </button>
 )}
/>
)}

 </div>
)}

{/* =================================================
  CREATED GROUPS
================================================= */}

{view === 'created' && (

<div>


<style>{`
  .private-circle-code-input::placeholder {
    font-size: 11px !important;
    font-weight: 600 !important;
    letter-spacing: 0 !important;
    text-transform: none !important;
    color: #9AA1AF !important;
    opacity: 1 !important;
  }
`}</style>

<h2
style={{
 fontSize:
 '22px',

fontWeight:
 '900',

color:
 '#1A1B1F',

 marginBottom:
   '20px'
}}
>
Circles Created By Me
</h2>


{loading ? (

<div
className="panel"
style={{
 textAlign:
  'center'
}}
>
<Loader2
 size={22}
 className="animate-spin"
 style={{
  margin:
   '0 auto',
  display:
   'block'
 }}
/>
<p
style={{
 color:
  'var(--campora-muted)',

fontWeight:
 '800',

 margin:
  0
}}
>
Loading your circles...
</p>

</div>

) : createdGroups.length >
  0?(

<div
style={{
 display:
  'grid',

   gridTemplateColumns:
   'repeat(auto-fill,minmax(380px,1fr))',

 gap:
   '30px'
}}
>

{sortGroupsWithPins(
  createdGroups
).map(
  (group) => (

      <GroupCard
       key={group.id}
       group={group}
       buttonLabel="Open Circle Details"
      />
 )
)}

</div>

):(

<WhiteStudyEmptyState
 icon={Crown}
 title="You haven't created any study circles yet."
 action={(
  <button
   type="button"
   onClick={() =>
    setView(
      'create'
    )
   }
   className="btn btn-primary"
  >
   <Plus size={18} />
   Create Your First Circle
  </button>
 )}
/>
)} </div> )} {/*
================================================= JOINED
GROUPS ================================================= */}
{view === 'joined' && ( <div> <h2 style={{ fontSize: '22px', fontWeight: '900',
color: '#1A1B1F', marginBottom: '20px' }} > Circles I've Joined
</h2>


{joinedOnlyGroups.length >
0?(

<div
style={{
 display:
 'grid',

gridTemplateColumns:
   'repeat(auto-fill,minmax(380px,1fr))',
 gap:
   '30px'
}}
>

      {sortGroupsWithPins(
        joinedOnlyGroups
      ).map(
        (group) => (

      <GroupCard
       key={group.id}
       group={group}
       buttonLabel="Open Circle Details"
      />
 )
)}

</div>

):(

<WhiteStudyEmptyState
 icon={BookmarkCheck}
 title="You haven't joined any study groups yet."
 action={(
  <button
   type="button"
   onClick={() =>
    setView(
      'browse'
    )
   }
   className="btn btn-outline"
   style={{
     background: '#0B1A3F',
     color: '#FFFFFF',
     border: '1px solid #0B1A3F',
     borderRadius: '14px',
     fontWeight: '900'
   }}
  >
   Explore Available Circles
  </button>
 )}
/>
)}

 </div>
)}


{/* =================================================
 DIRECT MESSAGES
================================================= */}
{view === 'dms' && (
  <div>
  <div style={{ marginBottom: '18px' }}>
   <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color:
'#1A1B1F' }}>
    Direct Messages
   </h2>
   <p style={{ margin: '5px 0 0', color: '#717786', fontSize: '13px', fontWeight:
'700' }}>
    Search by student name or email and keep your private conversations in
one place.
  </p>
  </div>

  <ShellPortal active={dmFullscreen}>
 <div style={{ ...instagramDmShell, ...(dmFullscreen ? {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100vw',
  height: '100vh',
  minHeight: '100vh',
  maxHeight: '100vh',
  maxWidth: '100vw',
  gridTemplateColumns: '1fr',
  borderRadius: 0,
  border: 'none',
  zIndex: 9990,
  boxShadow: '0 0 60px rgba(0,45,98,0.35)'
 } : {}) }}>
 {!dmFullscreen && (
 <aside style={instagramDmSidebar}>
  <div style={instagramDmSidebarHeader}>
  <div>
    <h4 style={instagramDmSidebarTitle}>Messages</h4>
    <p style={instagramDmSidebarSubtitle}>Your conversations</p>
  </div>
  <MessageCircle size={20} color={selectedGroup.color || '#0B1A3F'} />
  </div>

   <div style={instagramSearchWrap}>
   <div style={instagramSearchBar}>
    <Search size={18} style={instagramSearchIcon} />
    <input
     type="text"

      value={dmSearchQuery}
      onChange={(event) => setDmSearchQuery(event.target.value)}
      placeholder="Search name or email"
      style={instagramSearchInput}
     />
     {dmSearchQuery && (
      <button type="button" onClick={() => setDmSearchQuery('')}
style={instagramSearchClear}>
        <X size={15} />
      </button>
     )}
    </div>
   </div>

   {dmSearchQuery.trim() && (
    <div style={instagramSearchResults}>
    {searchingUsers ? (
       <div style={instagramSearchStatus}>Searching students...</div>
    ) : dmSearchResults.length === 0 ? (
       <div style={instagramSearchStatus}>No students found.</div>
    ):(
       dmSearchResults.map((profile) => {
         const resultName = profile.name || profile.email?.split('@')[0] ||
'Student';
         return (
          <button key={profile.id} type="button" onClick={() =>
startNewDmWithUser(profile)} style={instagramSearchResultRow}>
            <div style={{ ...instagramAvatar, background:
getAvatarColor(resultName) }}>
            {getInitials(resultName)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
            <p style={instagramPersonName}>{resultName}</p>
            <p style={instagramPersonMeta}>{profile.email || 'Student'}</p>
            </div>
           </button>
         );
       })
      )}
    </div>
   )}

   <div style={instagramThreadList}>
   {sortedDmConversations.length === 0 ? (
    <div style={instagramEmptyThreads}>
    <Mail size={34} strokeWidth={1.5} />
    <p style={{ margin: '10px 0 0' }}>No conversations yet.</p>

      <p style={{ margin: '4px 0 0', fontWeight: '600' }}>Search above or
message a member from a study circle.</p>
     </div>
    ):(
     sortedDmConversations.map((conversation) => {
      const isPinned = pinnedChats.dms.includes(conversation.partnerId);
      const selected = selectedDmUser?.partnerId ===
conversation.partnerId;
      return (
        <button
        key={conversation.partnerId}
        type="button"
        onClick={() => setSelectedDmUser(conversation)}
        style={{ ...instagramThreadRow, ...(selected ?
instagramThreadRowActive : {}) }}
        >
        <div style={{ ...instagramAvatar, background:
getAvatarColor(conversation.name) }}>
         {getInitials(conversation.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
         <div style={instagramThreadTopLine}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px',
minWidth: 0 }}>
            {isPinned && <Pin size={11} fill={PIN_COLORS.icon}
color={PIN_COLORS.icon} />}
             <p style={instagramPersonName}>{conversation.name}</p>
           </div>
           {conversation.lastMessageTime && (
             <span style={instagramThreadDate}>{new
Date(conversation.lastMessageTime).toLocaleDateString()}</span>
           )}
           {(conversation.unreadCount || 0) > 0 && (
            <span style={{
             background: '#EF4444',
             color: '#FFFFFF',
             borderRadius: '999px',
             minWidth: '18px',
             height: '18px',
             padding: '0 6px',
             display: 'inline-flex',
             alignItems: 'center',
             justifyContent: 'center',
             fontSize: '10px',
             fontWeight: '900',
             flexShrink: 0,
             lineHeight: 1
            }}>
             {conversation.unreadCount > 99 ? '99+' :
conversation.unreadCount}
            </span>
           )}
          </div>
          {conversation.email && <p style={instagramPersonMeta}
>{conversation.email}</p>}
          <p style={{ ...instagramMessagePreview,
...(conversation.unreadCount > 0 ? { color: '#1A1B1F', fontWeight: '800' } :
{}) }}
>{parseStudyDm(conversation.lastMessage).text || 'Click to view conversation'}
</p>
         </div>
         <span
          onClick={(event) => {
           event.stopPropagation();
           togglePinDm(conversation.partnerId);
          }}
          style={instagramPinButton}
         >
          <Pin size={15} fill={isPinned ? PIN_COLORS.icon : 'none'}

color={isPinned ? PIN_COLORS.icon : '#717786'} />
         </span>
        </button>
      );
    })
   )}
</div>
  </aside>
 )}

   <section style={instagramChatPanel}>
   {!selectedDmUser ? (
     <div style={instagramNoChat}>
     <div style={instagramNoChatIcon}><MessageCircle size={32} /></div>
     <h4 style={instagramNoChatTitle}>Your messages</h4>
     <p style={instagramNoChatText}>Select a conversation on the left or
search for a student to start chatting.</p>
     </div>
   ):(
     <>
     <div style={instagramChatHeader}>
       <div style={{ display: 'flex', alignItems: 'center', gap: '13px', minWidth:
0 }}>
        <div style={{ ...instagramAvatarLarge, background:
getAvatarColor(selectedDmUser.name) }}>
          {getInitials(selectedDmUser.name)}
        </div>
       <div style={{ minWidth: 0 }}>
        <h4 style={instagramChatName}>{selectedDmUser.name}</h4>
        {partnerTyping ? (
         <p style={{ ...instagramChatEmail, color: '#1A1B1F', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{
           width: '6px',
           height: '6px',
           borderRadius: '50%',
           background: '#22C55E',
           display: 'inline-block',
           animation: 'camporaTypingPulse 1s ease-in-out infinite'
          }} />
          {selectedDmUser.name} is typing...
         </p>
        ) : (
         <p style={instagramChatEmail}>{selectedDmUser.email || 'Campora Student'}</p>
        )}
       </div>
     </div>
     <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
     <button
       type="button"
       onClick={() => togglePinDm(selectedDmUser.partnerId)}
       style={{
        ...instagramHeaderPin,
        ...(pinnedChats.dms.includes(selectedDmUser.partnerId) ?
 instagramHeaderPinActive : {})
       }}
     >
       <Pin
        size={16}
        color={pinnedChats.dms.includes(selectedDmUser.partnerId) ?
 PIN_COLORS.icon : '#717786'}
        fill={pinnedChats.dms.includes(selectedDmUser.partnerId) ?
 PIN_COLORS.icon : 'none'}

     />
    </button>
    <button
     type="button"
     onClick={() => setDmFullscreen((previous) => !previous)}
     title={dmFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
     style={{ ...instagramHeaderPin, ...(dmFullscreen ? instagramHeaderPinActive : {}) }}
    >
     {dmFullscreen ? (
      <Minimize2 size={16} color="#717786" />
     ) : (
      <Maximize2 size={16} color="#717786" />
     )}
    </button>
    </div>
    </div>

     {(pinnedDmMessages[selectedDmUser.partnerId] || []).length > 0 && (
      <div style={{
        background: PIN_COLORS.bg,
        borderTop: `1px solid ${PIN_COLORS.border}`,
        borderBottom: `1px solid ${PIN_COLORS.border}`,
        padding: '10px 14px',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '8px',
          color: PIN_COLORS.icon,
          fontSize: '11px',
          fontWeight: '900'
        }}>
          <Pin size={13} fill={PIN_COLORS.icon} color={PIN_COLORS.icon} />
          PINNED MESSAGES
({(pinnedDmMessages[selectedDmUser.partnerId] || []).length})
        </div>
       <div style={{
         display: 'flex',
         gap: '8px',
         overflowX: 'auto',
         paddingBottom: '2px'
       }}>
         {(pinnedDmMessages[selectedDmUser.partnerId] ||
[]).map((pinnedId) => {
          const pinnedMessage = dmMessages.find((message) =>
message.id === pinnedId);
          if (!pinnedMessage) return null;

      const parsedPinned = parseStudyDm(pinnedMessage.content);
      const pinnedMine = pinnedMessage.sender_id ===
currentUser?.id;

     return (
      <div
       key={pinnedId}
       style={{
        minWidth: '220px',
        maxWidth: '320px',

  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
  padding: '8px 10px',
  borderRadius: '10px',
  background: 'rgba(255,255,255,0.82)',
  border: `1px solid ${PIN_COLORS.border}`
 }}
>
 <div style={{ minWidth: 0 }}>
  <div style={{
    color: PIN_COLORS.icon,
    fontSize: '10px',
    fontWeight: '900',
    marginBottom: '2px'
  }}>
    {pinnedMine ? 'You' : selectedDmUser.name}
  </div>
  <div style={{
    color: '#1A1B1F',
    fontSize: '11px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
   }}>
    {parsedPinned.text || 'Message'}
   </div>
  </div>

  <button
  type="button"
  onClick={() => togglePinDmMessage(pinnedId)}
  title="Unpin message"
  style={{
    border: 'none',
    background: 'transparent',
    color: PIN_COLORS.icon,
    cursor: 'pointer',
    display: 'flex',
    padding: '2px',
    flexShrink: 0
  }}
  >
  <X size={14} />
  </button>

          </div>
        );
       })}
       </div>
     </div>
    )}

     <div ref={dmChatHistoryRef} style={instagramChatHistory}>
      {dmMessages.length === 0 ? (
       <div style={instagramEmptyChat}>
        <div style={{ ...instagramAvatarLarge, width: '64px', height: '64px',
background: getAvatarColor(selectedDmUser.name), marginBottom: '10px' }}>
          {getInitials(selectedDmUser.name)}
        </div>
        <strong style={{ color: '#1A1B1F', fontSize: '15px' }}
>{selectedDmUser.name}</strong>
        <span style={{ marginTop: '5px' }}>Start your private conversation.</span>
       </div>
      ):(
       dmMessages.map((message) => {
        const isMe = message.sender_id === currentUser?.id;
        const parsed = parseStudyDm(message.content);
        const reactionMap = dmLocalReactions[message.id] || {};
          const isPinnedMessage =
(pinnedDmMessages[selectedDmUser.partnerId] || []).includes(message.id);
          return (
           <div key={message.id} style={{ display: 'flex', justifyContent: isMe ?
'flex-end' : 'flex-start', marginBottom: '14px', position: 'relative' }}>
             <div style={{ maxWidth: '76%', position: 'relative' }}>
             <div style={{ ...instagramBubble, maxWidth: '100%', ...(isMe ?
instagramBubbleMine : instagramBubbleTheirs) }}>
              {parsed.reply && (
               <div style={{ ...instagramReplyQuote, ...(isMe ?
instagramReplyQuoteMine : {}) }}>
                 <strong>{parsed.reply.sender}</strong>
                 <span>{parsed.reply.text}</span>
               </div>
              )}
              <p style={instagramBubbleText}>{parsed.text}</p>
              <div style={instagramBubbleFooter}>
               <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                 {message.created_at
                  ? new Date(message.created_at).toLocaleTimeString([],
{ hour: '2-digit', minute: '2-digit' })
                  : ''}
                 {isMe && (
                  message.read_at ? (
                   <CheckCheck size={13} color="#8AB4F8" strokeWidth={2.5} />
                  ) : (
                   <Check size={13} color="currentColor" strokeWidth={2.5} />
                  )
                 )}
               </span>

           </div>
           </div>

          {Object.entries(reactionMap).some(([, users]) => users?.length)
&& (
            <div style={{ ...instagramReactionRow, justifyContent: isMe ?
'flex-end' : 'flex-start' }}>
              {Object.entries(reactionMap).map(([emoji, users]) =>
users?.length ? (
                <button key={emoji} type="button" onClick={() =>
toggleLocalDmReaction(message.id, emoji)} style={instagramReactionPill}>
                  {emoji} {users.length}
                </button>
              ) : null)}
            </div>
           )}

          <button
            type="button"
            onClick={() =>
setActiveDmMessageMenu(activeDmMessageMenu === message.id ? null :
message.id)}
            style={{ ...instagramMessageMenuButton, ...(isMe ? { right:
'100%' } : { left: '100%' }) }}
              >•••</button>

                  {activeDmMessageMenu === message.id && (
                   <div style={{ ...instagramMessageMenu, ...(isMe ? { right: '0' } :
{ left: '0' }) }}>
                {DM_REACTIONS.map((emoji) => (
                 <button key={emoji} type="button" onClick={() =>
toggleLocalDmReaction(message.id, emoji)} style={instagramEmojiButton}
>{emoji}</button>
                ))}
                <button type="button" onClick={() => {
                 setDmReplyingTo({ id: message.id, sender: isMe ? 'You' :
selectedDmUser.name, text: parsed.text });
                 setActiveDmMessageMenu(null);
                }} style={instagramMenuAction}><Reply size={13} /> Reply</button>
                <button type="button" onClick={() =>
togglePinDmMessage(message.id)} style={instagramMenuAction}><Pin
size={13} /> {isPinnedMessage ? 'Unpin' : 'Pin'}</button>
              </div>
             )}
           </div>
          </div>

       );
      })
    )}
    <div ref={dmChatBottomRef} style={{ height: '1px', flexShrink: 0 }} />
    </div>

     {dmReplyingTo && (
      <div style={instagramReplyComposerPreview}>
        <div style={{ minWidth: 0 }}>
        <strong>Replying to {dmReplyingTo.sender}</strong>
        <p>{dmReplyingTo.text}</p>
        </div>
        <button type="button" onClick={() => setDmReplyingTo(null)}
style={instagramReplyClose}><X size={15} /></button>
      </div>
     )}

        <form onSubmit={handleSendDmInInbox} style={instagramComposer}>
        <input
         type="text"
         placeholder={`Message ${selectedDmUser.name}...`}
         value={newDmMessageText}
         onChange={(event) => handleDmComposerChange(event.target.value)}
         style={instagramComposerInput}
           />
           <button
            type="submit"
            disabled={!newDmMessageText.trim()}
            style={{ ...instagramSendButton, opacity: newDmMessageText.trim() ?
1 : 0.5 }}
        >
          <Send size={18} />
        </button>
        </form>
      </>
     )}
   </section>
   </div>
  </ShellPortal>
  </div>
)}
{/* =================================================
  VIBE SETTINGS
================================================= */}

{view === 'preferences' && (

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
 '1px solid #E3E2E7',
padding:
'30px 34px',

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
 margin:
 0,

fontSize:
 '28px',

fontWeight:
 '900',

 color:
   '#1A1B1F'
}}
>
Your Ideal Study Vibe
</h2>

<p
style={{
 color:
  '#717786',

fontWeight:
 '600',

marginTop:
'6px',

 fontSize:
   '15px'
  }}
  >
  Customize your preferences so Campora can match you with
compatible study circles.
  </p>

</div>
<div
style={{
display:
'flex',

 flexDirection:
   'column',

  gap:
    '28px'
 }}
 >

 {/* MAJOR */}

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
onChange={(event) =>
setMyPrefs({
 ...myPrefs,

  major:
    event.target.value
 })
}
>
 {MAJORS_PREFERENCES.map(
  (major) => (
    <option
    key={major}
    value={major}
    >
    {major}
    </option>
 )
)}

</select>

</div>


{/* STUDY GOAL */}

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
PRIMARY STUDY GOAL
</label>



<div
style={
 chipGridStyle
}
>

{STUDY_GOALS.map(
 (goal) => (

     <button
     key={goal}
     type="button"
     onClick={() =>
      setMyPrefs({
       ...myPrefs,
       goal
      })
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


{/* NOISE */}

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
PREFERRED NOISE LEVEL
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
     setMyPrefs({
      ...myPrefs,

       env:
         environment
      })
     }
     style={
       myPrefs.env ===
       environment
       ? activeChipStyle
       : chipStyle
     }
     >
     {environment}
     </button>
 )
)}

</div>

</div>

{/* LOCATION */}

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
STUDY LOCATION PREFERENCE
</label>
<div
style={
  chipGridStyle
}
>
 {STUDY_MODES.map(
  (mode) => (

   <button
   key={mode}
   type="button"
   onClick={() =>
     setMyPrefs({
      ...myPrefs,
      mode
     })
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
type="button"
onClick={() =>
 setView(
   'browse'
 )
 }
className="btn btn-primary"
 style={{
  marginTop:
   '10px'
}}
>
Save Vibe & View Matches
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
'1px solid #E3E2E7',

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
 margin:
 0,

fontWeight:
 '900',

fontSize:
 '30px',

 color:
   '#1A1B1F'
}}
>
Launch a Study Circle
</h2>


<p
style={{
 color:
  '#717786',

fontWeight:
 '600',

marginTop:
'6px',

  fontSize:
    '15px'
 }}
 >
 Choose whether your circle is public or private. Public circles appear on Discover after review; private circles stay hidden and use an invite code.
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

   gap:
     '28px'
  }}
  >

  {/* PUBLIC / PRIVATE */}

  <div style={formSectionStyle}>
    <label style={labelStyle}>CIRCLE ACCESS</label>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
        gap: '12px'
      }}
    >
      {[
        {
          value: 'public',
          title: 'Public Circle',
          text: 'Appears on Discover after Campora approval. Anyone can join instantly.',
          icon: Globe2
        },
        {
          value: 'private',
          title: 'Private Circle',
          text: 'Hidden from Discover. People need the code, then you accept or decline them.',
          icon: Lock
        }
      ].map((option) => {
        const Icon = option.icon;
        const active = newGroup.visibility === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() =>
              setNewGroup({
                ...newGroup,
                visibility: option.value
              })
            }
            style={{
              padding: '16px',
              borderRadius: '16px',
              border: 'none',
              background: active
                ? '#0B1A3F'
                : '#FFFFFF',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              boxShadow: active
                ? '0 6px 16px rgba(0,45,98,0.10)'
                : 'none'
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: active
                  ? 'rgba(255,255,255,0.12)'
                  : '#F7F9FC',
                color: active
                  ? '#FFFFFF'
                  : '#0B1A3F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Icon size={18} />
            </div>

            <div>
              <div
                style={{
                  color: active
                    ? '#FFFFFF'
                    : '#1A1B1F',
                  fontSize: '13px',
                  fontWeight: '900'
                }}
              >
                {option.title}
              </div>

              <div
                style={{
                  marginTop: '4px',
                  color: active
                    ? 'rgba(255,255,255,0.75)'
                    : '#717786',
                  fontSize: '11px',
                  fontWeight: '700',
                  lineHeight: 1.45
                }}
              >
                {option.text}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </div>

  {/* NAME + MAJOR */}

  <div
  style={{
   display:
   'grid',

  gridTemplateColumns:
  'repeat(auto-fit,minmax(250px,1fr))',

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
onChange={(event) =>
  setNewGroup({
    ...newGroup,

      name:
        event.target.value
     })
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
onChange={(event) =>
 setNewGroup({
  ...newGroup,

      major:
        event.target.value
     })
}
>

{MAJORS_CREATION.map(
 (major) => (

      <option
     key={major}
     value={major}
     >
     {major}
     </option>
 )
)}

</select>

</div>

</div>




{/* CAPACITY + FORMAT */}

<div
style={{
 display:
 'grid',

gridTemplateColumns:
'repeat(auto-fit,minmax(250px,1fr))',

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
MAX CAPACITY
</label>


<select
style={
  inputStyle
}
value={
  newGroup.max_size
}
onChange={(event) =>
  setNewGroup({
    ...newGroup,

     max_size:
       parseInt(
         event.target.value,
         10
       )
    })
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
].map(
  (number) => (

     <option
     key={number}
     value={number}
     >
     {number} People
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
     key={mode}
     type="button"
     onClick={() =>
       setNewGroup({
        ...newGroup,
        mode
       })
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


{/* STUDY GOAL */}

<div style={formSectionStyle}>
  <label style={labelStyle}>STUDY GOAL</label>

  <select
    value={newGroup.goal}
    onChange={(event) => {
      const value = event.target.value;

      setNewGroup({
        ...newGroup,
        goal: value
      });

      if (value !== 'Other') {
        setCustomStudyGoal('');
      }
    }}
    style={{
      ...inputStyle,
      width: '100%',
      height: '46px',
      borderRadius: '12px',
      background: '#FFFFFF',
      border: '1.5px solid #E3E8F2',
      color: '#0B1A3F',
      fontSize: '13px',
      fontWeight: '700',
      padding: '0 14px',
      cursor: 'pointer'
    }}
  >
    <option value="Exam Prep">Exam Prep</option>
    <option value="Weekly Review">Weekly Review</option>
    <option value="Assignments">Assignments</option>
    <option value="Problem Solving">Problem Solving</option>
    <option value="Project Work">Project Work</option>
    <option value="Accountability">Accountability</option>
    <option value="Other">Other</option>
  </select>

  {newGroup.goal === 'Other' && (
    <input
      value={customStudyGoal}
      onChange={(event) =>
        setCustomStudyGoal(event.target.value)
      }
      placeholder="Write your study goal"
      style={{
        ...inputStyle,
        width: '100%',
        height: '44px',
        marginTop: '10px',
        borderRadius: '12px',
        border: '1.5px solid #E3E8F2',
        color: '#0B1A3F',
        fontSize: '13px',
        fontWeight: '600',
        padding: '0 14px',
        boxSizing: 'border-box'
      }}
    />
  )}
</div>


{/* NOISE */}

<div style={formSectionStyle}>
  <label style={labelStyle}>NOISE VIBE</label>

  <select
    value={newGroup.environment}
    onChange={(event) => {
      const value = event.target.value;

      setNewGroup({
        ...newGroup,
        environment: value
      });

      if (value !== 'Other') {
        setCustomNoiseVibe('');
      }
    }}
    style={{
      ...inputStyle,
      width: '100%',
      height: '46px',
      borderRadius: '12px',
      background: '#FFFFFF',
      border: '1.5px solid #E3E8F2',
      color: '#0B1A3F',
      fontSize: '13px',
      fontWeight: '700',
      padding: '0 14px',
      cursor: 'pointer'
    }}
  >
    <option value="Library Soft">Library Soft</option>
    <option value="Silent Focus">Silent Focus</option>
    <option value="Low Conversation">Low Conversation</option>
    <option value="Collaborative">Collaborative</option>
    <option value="Energetic">Energetic</option>
    <option value="Online">Online</option>
    <option value="Other">Other</option>
  </select>

  {newGroup.environment === 'Other' && (
    <input
      value={customNoiseVibe}
      onChange={(event) =>
        setCustomNoiseVibe(event.target.value)
      }
      placeholder="Describe the noise vibe"
      style={{
        ...inputStyle,
        width: '100%',
        height: '44px',
        marginTop: '10px',
        borderRadius: '12px',
        border: '1.5px solid #E3E8F2',
        color: '#0B1A3F',
        fontSize: '13px',
        fontWeight: '600',
        padding: '0 14px',
        boxSizing: 'border-box'
      }}
    />
  )}
</div>

{/* DESCRIPTION */}

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
     DESCRIPTION & RULES
     </label>


   <textarea
   placeholder="Tell everyone how you'll study, where to meet, and what
to bring..."
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
onChange={(event) =>
  setNewGroup({
   ...newGroup,

      description:
        event.target.value
     })
 }
/>

</div>
{/* =================================================
  CIRCLE COLOR
================================================= */}

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
CIRCLE THEME COLOR
</label>




<p
style={{
 margin:
 '0 0 4px',

color:
 '#717786',
  fontSize:
   '12px',

  fontWeight:
    '700'
 }}
 >
 Pick one of the Campora colors or choose any custom shade you
want.
 </p>


    <div
    style={{
     display:
     'flex',

  gap:
  '16px',
marginTop:
'6px',

flexWrap:
  'wrap',

alignItems:
 'center'

}}
>

{/* DEFAULT COLORS */}

{GROUP_COLORS.map(
 (colorOption) => {
const isSelected =
 newGroup.color ===
 colorOption.bg;


const checkColor =
 getContrastColor(
   colorOption.bg
 );


return (
<button
type="button"
key={
  colorOption.bg
}
onClick={() =>
  setNewGroup({
   ...newGroup,

    color:
      colorOption.bg
   })
  }
  title={
    colorOption.name
  }
  style={{
width:
'44px',

height:
'44px',

borderRadius:
'50%',

background:
colorOption.bg,

cursor:
 'pointer',

border:
 isSelected
   ? '3px solid #002D62'
   : '1px solid #CBD5E1',

display:
'flex',

alignItems:
 'center',

justifyContent:
  'center',
boxShadow:
isSelected
  ? '0 4px 12px rgba(0,45,98,0.18)'
  : 'none',

transition:
  'all 0.15s ease',

 transform:
   isSelected
     ? 'scale(1.06)'
     : 'scale(1)'
}}
>

{isSelected && (

<Check
   size={18}
   color={
     checkColor
   }
   strokeWidth={3}
 />
)}

       </button>
     );
 }
)}

</div>
{/* CUSTOM COLOR PICKER */}

<label
title="Choose any custom color or shade"
style={{
 height: '44px',
 padding: '0 16px',
 borderRadius: '14px',
 cursor: 'pointer',
 position: 'relative',
 flexShrink: 0,
 border: !GROUP_COLORS.some(
   (colorOption) =>
     colorOption.bg.toLowerCase() === newGroup.color?.toLowerCase()
 )
   ? '2px solid #002D62'
   : '1.5px solid #CBD5E1',
 background: '#FFFFFF',
 display: 'inline-flex',
 alignItems: 'center',
 gap: '9px',
 fontSize: '12px',
 fontWeight: '900',
 color: '#1A1B1F',
 boxShadow: !GROUP_COLORS.some(
   (colorOption) =>
     colorOption.bg.toLowerCase() === newGroup.color?.toLowerCase()
 )
   ? '0 4px 12px rgba(0,45,98,0.12)'
   : 'none',
 overflow: 'hidden',
 marginTop: '12px',
 alignSelf: 'flex-start'
}}
>
<div
 style={{
  width: '20px',
  height: '20px',
  borderRadius: '6px',
  background: newGroup.color || '#E0F2FE',
  border: '1px solid #CBD5E1',

  flexShrink: 0
 }}
/>
Custom Color
<span style={{ fontSize: '16px', fontWeight: '900' }}>+</span>
<input
 type="color"
 aria-label="Choose a custom circle color"
 value={newGroup.color || '#E0F2FE'}
 onChange={(event) =>
  setNewGroup({
   ...newGroup,
   color: event.target.value
  })
 }
 style={{
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  opacity: 0,
  cursor: 'pointer'
 }}
/>
</label>


{/* CURRENT COLOR */}

<div
style={{
 display:
 'flex',

alignItems:
 'center',

gap:
'10px',

 marginTop:
   '10px'
}}
>

<div
style={{

width:
'24px',

height:
'24px',

borderRadius:
'7px',

background:
newGroup.color,

border:
'1px solid #CBD5E1',

 flexShrink:
    0
 }}
/>




<span
style={{
 fontSize:
  '12px',

fontWeight:
 '700',

 color:
   '#717786'
}}
>
Current circle color
</span>

</div>


{/* LIVE COLOR PREVIEW */}

<div
style={{
 marginTop: '14px',
 padding: '18px 20px',
 borderRadius: '16px',
 background: `linear-gradient(135deg, #FFFFFF 0%, ${newGroup.color || '#E0F2FE'}18 100%)`,
 border: 'none',
 boxShadow: '0 6px 18px rgba(11,26,63,0.05)'
}}
>
<div
style={{
 display: 'flex',
 alignItems: 'center',
 gap: '10px',
 marginBottom: '7px'
}}
>
<div
style={{
 width: '12px',
 height: '12px',
 borderRadius: '50%',
 background: newGroup.color || '#E0F2FE',
 boxShadow: `0 0 0 5px ${newGroup.color || '#E0F2FE'}22`,
 flexShrink: 0
}}
/>

<p
style={{
 margin: 0,
 fontSize: '10px',
 fontWeight: '900',
 letterSpacing: '0.5px',
 textTransform: 'uppercase',
 color: '#717786'
}}
>
PREVIEW
</p>
</div>

<h3
style={{
 margin: '5px 0 3px',
 fontSize: '18px',
 fontWeight: '900',
 color: '#0B1A3F'
}}
>
{newGroup.name || 'Your Study Circle'}
</h3>

<p
style={{
 margin: 0,
 fontSize: '12px',
 fontWeight: '700',
 color: '#717786'
}}
>
{newGroup.major || 'All Majors Welcome'}
</p>
</div>

</div>


{/* SUBMIT */}

<button
type="submit"
disabled={
 actionLoading
}
className="btn btn-primary"
style={{
marginTop:
'10px',

opacity:
actionLoading
 ? 0.6
    :1
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

{view === 'details' &&
 selectedGroup && (

<div
style={{
 maxWidth: '1180px',
 width: '100%',
 margin: '0 auto',
 display: 'flex',
 flexDirection: 'column',
 gap: '18px'
}}
>

{/* TOP NAV */}
<div
style={{
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 gap: '12px',
 flexWrap: 'wrap'
}}
>
<button
onClick={() =>
  setView(
    selectedGroup.creator_id === currentUser?.id
      ? 'created'
      : joinedGroupIds.includes(selectedGroup.id)
      ? 'joined'
      : 'browse'
  )
}
className="btn btn-ghost"
>
<ArrowLeft size={16} />
Back
</button>

<div
style={{
 display: 'flex',
 alignItems: 'center',
 gap: '8px',
 flexWrap: 'wrap'
}}
>
<span
style={{
 display: 'inline-flex',
 alignItems: 'center',
 gap: '6px',
 padding: '7px 10px',
 borderRadius: '999px',
 background: selectedGroup.color || '#0B1A3F',
 border: 'none',
 color: getContrastColor(selectedGroup.color || '#0B1A3F'),
 fontSize: '10px',
 fontWeight: '900',
 textTransform: 'uppercase',
 letterSpacing: '.35px'
}}
>
{(selectedGroup.visibility || 'public') === 'private' ? (
  <Lock size={12} color={getContrastColor(selectedGroup.color || '#0B1A3F')} />
) : (
  <Globe2 size={12} color={getContrastColor(selectedGroup.color || '#0B1A3F')} />
)}
{(selectedGroup.visibility || 'public') === 'private' ? 'Private Circle' : 'Public Circle'}
</span>

<span
style={{
 display: 'inline-flex',
 alignItems: 'center',
 gap: '6px',
 padding: '7px 10px',
 borderRadius: '999px',
 background:
   selectedGroup.approval_status === 'approved'
     ? '#F2F9F7'
     : selectedGroup.approval_status === 'rejected'
     ? '#FFF5F6'
     : '#FFF9F1',
 border:
   selectedGroup.approval_status === 'approved'
     ? 'none'
     : selectedGroup.approval_status === 'rejected'
     ? 'none'
     : 'none',
 color:
   selectedGroup.approval_status === 'approved'
     ? '#5E9A8B'
     : selectedGroup.approval_status === 'rejected'
     ? '#C76E7D'
     : '#C99758',
 fontSize: '10px',
 fontWeight: '900',
 textTransform: 'uppercase',
 letterSpacing: '.35px'
}}
>
<ShieldCheck size={12} />
{selectedGroup.approval_status === 'approved'
  ? 'Approved'
  : selectedGroup.approval_status === 'rejected'
  ? 'Declined'
  : 'In Review'}
</span>
</div>
</div>

{/* MAIN SUMMARY CARD */}
<div
style={{
 position: 'relative',
 overflow: 'hidden',
 background: `linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 68%, ${selectedGroup.color || '#E0F2FE'}24 100%)`,
 borderRadius: '26px',
 border: 'none',
 boxShadow: '0 14px 34px rgba(11,26,63,0.07)',
 padding: '28px 30px'
}}
>
<div
style={{
 position: 'absolute',
 top: 0,
 left: 0,
 right: 0,
 height: '6px',
 background: selectedGroup.color || '#E0F2FE'
}}
/>

<div
style={{
 position: 'absolute',
 top: '26px',
 right: '28px',
 width: '22px',
 height: '22px',
 borderRadius: '50%',
 background: selectedGroup.color || '#E0F2FE',
 boxShadow: `0 0 0 9px ${selectedGroup.color || '#E0F2FE'}22`,
 pointerEvents: 'none'
}}
/>

<div
style={{
 position: 'relative',
 zIndex: 1,
 display: 'grid',
 gridTemplateColumns: 'minmax(0,1fr) auto',
 gap: '24px',
 alignItems: 'start'
}}
>
<div>
<div
style={{
 display: 'flex',
 gap: '8px',
 flexWrap: 'wrap',
 marginBottom: '13px'
}}
>
<span
style={{
 ...tagStyle,
 background: selectedGroup.color || '#0B1A3F',
 border: 'none',
 color: getContrastColor(selectedGroup.color || '#0B1A3F')
}}
>
{selectedGroup.major || 'All Majors Welcome'}
</span>

<span
style={{
 ...tagStyle,
 background: '#F7F9FC',
 border: 'none',
 color: '#42506D'
}}
>
{selectedGroup.course_code || selectedGroup.course || 'Study Circle'}
</span>
</div>

<h1
style={{
 margin: 0,
 fontSize: '34px',
 lineHeight: 1.1,
 fontWeight: '950',
 color: selectedGroup.color || '#0B1A3F'
}}
>
{selectedGroup.name}
</h1>

<p
style={{
 margin: '12px 0 0',
 maxWidth: '760px',
 color: '#626A79',
 fontSize: '14px',
 lineHeight: 1.65,
 fontWeight: '650'
}}
>
{selectedGroup.description || 'No description provided.'}
</p>
</div>

<div
style={{
 minWidth: '150px',
 padding: '16px',
 borderRadius: '18px',
 background: selectedGroup.color || '#0B1A3F',
 border: 'none',
 textAlign: 'center'
}}
>
<div
style={{
 color: getContrastColor(selectedGroup.color || '#0B1A3F'),
 fontSize: '26px',
 fontWeight: '950'
}}
>
{calculateMatch(selectedGroup)}%
</div>
<div
style={{
 marginTop: '3px',
 color: getMutedContrastColor(selectedGroup.color || '#0B1A3F'),
 fontSize: '10px',
 fontWeight: '900',
 textTransform: 'uppercase',
 letterSpacing: '.45px'
}}
>
Compatibility
</div>
</div>
</div>
</div>

{/* INFORMATION + MEMBERSHIP */}
<div
style={{
 display: 'grid',
 gridTemplateColumns: 'minmax(0,1.7fr) minmax(280px,.8fr)',
 gap: '18px',
 alignItems: 'start'
}}
>
<div
style={{
 display: 'flex',
 flexDirection: 'column',
 gap: '18px'
}}
>

<section
style={{
 background: `linear-gradient(135deg, #FFFFFF 0%, ${selectedGroup.color || '#E0F2FE'}10 100%)`,
 borderRadius: '22px',
 border: 'none',
 padding: '22px',
 boxShadow: '0 10px 26px rgba(11,26,63,0.055)'
}}
>
<div
style={{
 display: 'flex',
 alignItems: 'center',
 gap: '9px',
 marginBottom: '16px'
}}
>
<div
style={{
 width: '34px',
 height: '34px',
 borderRadius: '11px',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 background: selectedGroup.color || '#0B1A3F',
 color: getContrastColor(selectedGroup.color || '#0B1A3F')
}}
>
<Target size={17} />
</div>
<h3
style={{
 margin: 0,
 color: '#1A1B1F',
 fontSize: '16px',
 fontWeight: '900'
}}
>
Circle Details
</h3>
</div>

<div
style={{
 display: 'grid',
 gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))',
 gap: '12px'
}}
>
{[
  ['GOAL', selectedGroup.goal, Target],
  ['ENVIRONMENT', selectedGroup.environment, Volume2],
  ['MODE', selectedGroup.mode, Users],
  ['MEMBERS', `${getGroupMemberCount(selectedGroup)} / ${selectedGroup.max_size}`, Users]
].map(([label, value, Icon]) => (
  <div
    key={label}
    style={{
      minHeight: '92px',
      padding: '15px',
      borderRadius: '15px',
      background: selectedGroup.color || '#0B1A3F',
      border: 'none',
      boxShadow: `0 6px 16px ${selectedGroup.color || '#0B1A3F'}24`
    }}
  >
    <Icon
      size={16}
      color={getContrastColor(selectedGroup.color || '#0B1A3F')}
    />
    <div
      style={{
        marginTop: '10px',
        color: getMutedContrastColor(selectedGroup.color || '#0B1A3F'),
        fontSize: '9px',
        fontWeight: '900',
        letterSpacing: '.5px'
      }}
    >
      {label}
    </div>
    <div
      style={{
        marginTop: '4px',
        color: getContrastColor(selectedGroup.color || '#0B1A3F'),
        fontSize: '12px',
        fontWeight: '850'
      }}
    >
      {value || 'Not specified'}
    </div>
  </div>
))}
</div>
</section>

{/* PRIVATE ACCESS */}
{(selectedGroup.visibility || 'public') === 'private' &&
 selectedGroup.creator_id === currentUser?.id && (
<section
style={{
 background: '#FFFFFF',
 borderRadius: '22px',
 border: 'none',
 padding: '22px',
 boxShadow: '0 10px 26px rgba(11,26,63,0.055)'
}}
>
<div
style={{
 display: 'flex',
 justifyContent: 'space-between',
 alignItems: 'flex-start',
 gap: '14px',
 flexWrap: 'wrap'
}}
>
<div>
<div
style={{
 display: 'flex',
 alignItems: 'center',
 gap: '9px'
}}
>
<div
style={{
 width: '34px',
 height: '34px',
 borderRadius: '11px',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 background: `${selectedGroup.color || '#E0F2FE'}22`,
 color: '#0B1A3F'
}}
>
<KeyRound size={17} />
</div>
<div>
<h3
style={{
 margin: 0,
 color: '#1A1B1F',
 fontSize: '16px',
 fontWeight: '900'
}}
>
Private Access
</h3>
<p
style={{
 margin: '3px 0 0',
 color: '#717786',
 fontSize: '11px',
 fontWeight: '700'
}}
>
Share the code. Students still need your approval.
</p>
</div>
</div>
</div>

<div
style={{
 display: 'inline-flex',
 alignItems: 'center',
 gap: '8px',
 padding: '11px 14px',
 borderRadius: '12px',
 background: `${selectedGroup.color || '#E0F2FE'}1F`,
 border: 'none',
 color: selectedGroup.color || '#0B1A3F',
 fontWeight: '950',
 letterSpacing: '2px'
}}
>
<KeyRound size={15} />
{selectedGroup.join_code || 'NO CODE'}
</div>
</div>

<div
style={{
 marginTop: '17px',
 display: 'flex',
 flexDirection: 'column',
 gap: '9px'
}}
>
{getPendingRequestsForGroup(selectedGroup.id).length > 0 ? (
  getPendingRequestsForGroup(selectedGroup.id).map((request) => {
    const profile = request.requester_profile || {};
    const displayName =
      profile.full_name ||
      profile.name ||
      profile.email?.split('@')[0] ||
      'Student';

    return (
      <div
        key={request.id}
        style={{
          padding: '13px 14px',
          borderRadius: '14px',
          border: 'none',
          background: '#FAFBFD',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <div
            style={{
              color: '#1A1B1F',
              fontSize: '12px',
              fontWeight: '900'
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              marginTop: '3px',
              color: '#717786',
              fontSize: '10px',
              fontWeight: '700'
            }}
          >
            {[profile.major, profile.academic_year].filter(Boolean).join(' · ') ||
              'Requested access'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '7px' }}>
          <button
            type="button"
            disabled={requestActionLoading === request.id}
            onClick={() => handlePrivateRequestDecision(request, 'approved')}
            style={{
              border: 'none',
              background: '#F2F9F7',
              color: '#5E9A8B',
              borderRadius: '9px',
              padding: '8px 11px',
              fontWeight: '900',
              cursor: 'pointer'
            }}
          >
            Accept
          </button>

          <button
            type="button"
            disabled={requestActionLoading === request.id}
            onClick={() => handlePrivateRequestDecision(request, 'declined')}
            style={{
              border: 'none',
              background: '#FFF5F6',
              color: '#C76E7D',
              borderRadius: '9px',
              padding: '8px 11px',
              fontWeight: '900',
              cursor: 'pointer'
            }}
          >
            Decline
          </button>
        </div>
      </div>
    );
  })
) : (
  <div
    style={{
      padding: '13px',
      borderRadius: '13px',
      background: '#FFFFFF',
      border: 'none',
      color: '#717786',
      fontSize: '11px',
      fontWeight: '700'
    }}
  >
    No pending access requests.
  </div>
)}
</div>
</section>
)}

{(selectedGroup.visibility || 'public') === 'private' &&
 selectedGroup.creator_id !== currentUser?.id &&
 !joinedGroupIds.includes(selectedGroup.id) &&
 getMyJoinRequest(selectedGroup.id) && (
<div
style={{
 padding: '14px 16px',
 borderRadius: '14px',
 background:
   getMyJoinRequest(selectedGroup.id)?.status === 'declined'
     ? '#FFF5F6'
     : '#FFF9F1',
 border:
   getMyJoinRequest(selectedGroup.id)?.status === 'declined'
     ? 'none'
     : 'none',
 color:
   getMyJoinRequest(selectedGroup.id)?.status === 'declined'
     ? '#C76E7D'
     : '#C99758',
 fontSize: '12px',
 fontWeight: '900'
}}
>
{getMyJoinRequest(selectedGroup.id)?.status === 'declined'
  ? 'Your request to join this private circle was declined.'
  : 'Your request is pending. The creator still needs to accept or decline it.'}
</div>
)}
</div>

{/* RIGHT SIDE */}
<aside
style={{
 display: 'flex',
 flexDirection: 'column',
 gap: '18px'
}}
>
<section
style={{
 background: '#FFFFFF',
 borderRadius: '22px',
 border: 'none',
 padding: '20px',
 boxShadow: '0 10px 26px rgba(11,26,63,0.055)'
}}
>
<h3
style={{
 margin: '0 0 14px',
 color: selectedGroup.color || '#0B1A3F',
 fontSize: '15px',
 fontWeight: '900'
}}
>
Circle Access
</h3>

{selectedGroup.approval_status !== 'approved' ? (
<div
style={{
 padding: '13px',
 borderRadius: '13px',
 background:
   selectedGroup.approval_status === 'rejected' ? '#FFF5F6' : '#FFF9F1',
 border:
   selectedGroup.approval_status === 'rejected'
     ? 'none'
     : 'none',
 color:
   selectedGroup.approval_status === 'rejected' ? '#C76E7D' : '#C99758',
 fontSize: '11px',
 fontWeight: '850',
 lineHeight: 1.45
}}
>
{selectedGroup.approval_status === 'rejected'
  ? 'This circle was declined by Campora and is not active.'
  : 'This circle is currently waiting for Campora admin review.'}
</div>
) : joinedGroupIds.includes(selectedGroup.id) ||
  selectedGroup.creator_id === currentUser?.id ? (
<button
onClick={() => setView('chat')}
style={{
 ...saveBtn,
 width: '100%',
 minHeight: '48px',
 margin: 0,
 padding: '0 18px',
 boxSizing: 'border-box',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 alignSelf: 'stretch',
 gap: '8px',
 background: selectedGroup.color || '#0B1A3F',
 color: getContrastColor(selectedGroup.color || '#0B1A3F'),
 boxShadow: 'none'
}}
>
<MessageSquare size={17} />
Open Group Chat
</button>
) : (selectedGroup.visibility || 'public') === 'private' ? (
<div
style={{
 padding: '13px',
 borderRadius: '13px',
 background: '#F7F9FC',
 border: 'none',
 color: '#42506D',
 fontSize: '11px',
 fontWeight: '800',
 lineHeight: 1.45,
 textAlign: 'center'
}}
>
Private circle — use its invite code from Discover to request access.
</div>
) : (
<button
onClick={() => handleJoin(selectedGroup.id)}
disabled={
  actionLoading ||
  getGroupMemberCount(selectedGroup) >= selectedGroup.max_size
}
style={{
 ...saveBtn,
 width: '100%',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: '8px',
 background: '#0B1A3F',
 color: '#FFFFFF',
 boxShadow: `inset 5px 0 0 ${selectedGroup.color || '#E0F2FE'}`
,
 opacity:
   getGroupMemberCount(selectedGroup) >= selectedGroup.max_size ? 0.55 : 1
}}
>
<UserPlus size={17} />
{getGroupMemberCount(selectedGroup) >= selectedGroup.max_size
  ? 'Group Full'
  : 'Join Study Circle'}
</button>
)}

{selectedGroup.approval_status === 'approved' &&
 joinedGroupIds.includes(selectedGroup.id) &&
 selectedGroup.creator_id !== currentUser?.id && (
<button
onClick={() => handleLeaveGroup(selectedGroup.id)}
disabled={actionLoading}
className="btn btn-danger"
style={{ width: '100%', marginTop: '9px' }}
>
<LogOut size={16} />
Leave Circle
</button>
)}
</section>

{(joinedGroupIds.includes(selectedGroup.id) ||
  selectedGroup.creator_id === currentUser?.id) && (
<section
style={{
 background: '#FFFFFF',
 borderRadius: '22px',
 border: 'none',
 padding: '20px',
 boxShadow: '0 7px 20px rgba(11,26,63,0.045)'
}}
>
<div
style={{
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 gap: '10px',
 marginBottom: '13px'
}}
>
<h3
style={{
 margin: 0,
 color: '#1A1B1F',
 fontSize: '15px',
 fontWeight: '900'
}}
>
Members
</h3>
<span
style={{
 color: selectedGroup.color || '#0B1A3F',
 fontSize: '11px',
 fontWeight: '900'
}}
>
{getGroupMemberCount(selectedGroup)} / {selectedGroup.max_size}
</span>
</div>

<div
style={{
 display: 'flex',
 flexDirection: 'column',
 gap: '8px',
 maxHeight: '350px',
 overflowY: 'auto'
}}
>
{groupMembers.length > 0 ? (
  groupMembers.map((member) => (
    <div
      key={member.user_id}
      onClick={() => {
        if (member.user_id !== currentUser?.id) {
          openMemberProfile(member);
        }
      }}
      style={{
        padding: '10px',
        borderRadius: '13px',
        background: '#FAFBFD',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        cursor: member.user_id === currentUser?.id ? 'default' : 'pointer'
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: getAvatarColor(
            member.profiles?.full_name || member.profiles?.email
          ),
          color: '#1A1B1F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '900',
          fontSize: '11px',
          flexShrink: 0,
          border: `2px solid ${selectedGroup.color || '#E0F2FE'}`
        }}
      >
        {getInitials(
          member.profiles?.full_name ||
            member.profiles?.email ||
            'Student'
        )}
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            minWidth: 0
          }}
        >
          <span
            style={{
              color: '#1A1B1F',
              fontSize: '11px',
              fontWeight: '850',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {member.profiles?.full_name ||
              member.profiles?.email?.split('@')[0] ||
              'Student'}
            {member.user_id === currentUser?.id ? ' (You)' : ''}
          </span>
          {member.user_id === selectedGroup.creator_id && (
            <span
              style={{
                padding: '2px 5px',
                borderRadius: '6px',
                background: `${selectedGroup.color || '#0B1A3F'}18`,
                color: selectedGroup.color || '#0B1A3F',
                fontSize: '8px',
                fontWeight: '900'
              }}
            >
              Creator
            </span>
          )}
        </div>
        <div
          style={{
            marginTop: '2px',
            color: '#8A909D',
            fontSize: '9px',
            fontWeight: '700',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {[member.profiles?.major, member.profiles?.academic_year]
            .filter((value) => value && value !== 'Not specified')
            .join(' · ') || 'Student'}
        </div>
      </div>
    </div>
  ))
) : (
  <div
    style={{
      padding: '13px',
      borderRadius: '13px',
      background: '#FAFBFD',
      color: '#717786',
      fontSize: '10px',
      fontWeight: '700'
    }}
  >
    Member information is loading...
  </div>
)}
</div>
</section>
)}
</aside>
</div>

</div>
)}


{/* =================================================
  GROUP CHAT
================================================= */}

{view === 'chat' &&

 selectedGroup && (
<ShellPortal active={chatFullscreen}>
<div
style={{
 maxWidth:
 '1220px',

width:
'100%',

margin:
'0 auto',

background:
'#FFFFFF',

borderRadius:
'28px',

border:
'1px solid #E3E2E7',

height:
'clamp(540px, 66vh, 680px)',

display:
'flex',

flexDirection:
  'column',

overflow:
'hidden',

 boxShadow:
   '0 20px 40px -15px rgba(0,0,0,0.08)',

 ...(chatFullscreen ? {
   position: 'fixed',
   top: 0,
   left: 0,
   right: 0,
   bottom: 0,
   width: '100vw',
   height: '100vh',
   minHeight: '100vh',
   maxHeight: '100vh',
   maxWidth: '100vw',
   borderRadius: 0,
   border: 'none',
   zIndex: 9990,
   boxShadow: '0 0 60px rgba(0,45,98,0.35)'
 } : {})
}}
>

  {/* =================================================
    CHAT HEADER
  ================================================= */}
<div
style={{
 padding:
 '16px 24px',

background:
`linear-gradient(90deg, #FFFFFF 0%, ${selectedGroup.color || '#E0F2FE'}12 100%)`,
borderBottom:
'1px solid #E3E2E7',
borderTop:
'none',

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
 {/* BACK */}

 <button
  onClick={() =>
 setView(
   'details'
 )
}
style={{
  border:
   '1px solid #E3E8F2',
background:
'#FFFFFF',

padding:
'8px',

borderRadius:
'10px',

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

<ArrowLeft
size={18}
color="#1A1B1F"
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
   selectedGroup.color || '#0B1A3F'
}}
>
{selectedGroup.name}
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
   '#717786'
}}
>
{getActiveOnlineCount()}{' '}
Members Active Now
</p>

</div>

</div>

</div>


{/* CHAT ACTIONS */}

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

{/* PIN GROUP */}

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
  : '#FFFFFF',

 border:
   pinnedChats.groups.includes(
     selectedGroup.id
   )
     ? `1px solid ${PIN_COLORS.border}`
     : `1px solid ${getContrastBorder(
        selectedGroup.color ||
         '#E0F2FE'
       )}`
}}
>

 <Pin
 size={18}
  color={
   pinnedChats.groups.includes(
     selectedGroup.id
   )
     ? PIN_COLORS.icon
     : '#1A1B1F'
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


{/* FULLSCREEN */}

<button
onClick={() =>
  setChatFullscreen(
    (previous) => !previous
  )
}
title={
  chatFullscreen
    ? 'Exit fullscreen'
    : 'View fullscreen'
}
style={{
  ...iconBtnStyle,

 background:
  chatFullscreen
   ? '#EEF2FF'
   : '#FFFFFF',

 border:
  chatFullscreen
   ? '1px solid #C7D2FE'
   : `1px solid ${getContrastBorder(
      selectedGroup.color ||
       '#E0F2FE'
     )}`
}}
>

{chatFullscreen ? (
 <Minimize2
  size={18}
  color={selectedGroup.color || '#0B1A3F'}
 />
) : (
 <Maximize2
  size={18}
  color="#1A1B1F"
 />
)}

</button>


{/* POLL */}

<button
onClick={() =>
  setShowPollModal(
    true
  )
}
style={{
  ...iconBtnStyle,

background:
'#FFFFFF',

 border:
   `1px solid ${getContrastBorder(
    selectedGroup.color ||
     '#E0F2FE'
   )}`
}}
>

<BarChart2
 size={18}
 color="#1A1B1F"
/>

</button>
{/* MEMBERS */}

<button
onClick={() =>

 setShowMembersDrawer(
   true
 )
}
style={{
  ...iconBtnStyle,

background:
'#FFFFFF',

 border:
   `1px solid ${getContrastBorder(
    selectedGroup.color ||
     '#E0F2FE'
   )}`
}}
>

<Users
size={18}
color="#1A1B1F"
/>

</button>
{/* NOTIFICATIONS */}

<button
onClick={() =>
 toggleNotifications(
   selectedGroup.id
 )
}
style={{
  ...iconBtnStyle,

background:
'#FFFFFF',

 border:
   `1px solid ${getContrastBorder(
    selectedGroup.color ||
     '#E0F2FE'
   )}`
}}
>

{notificationsMuted[
 selectedGroup.id
]?(

<BellOff
 size={18}
 color="#EF4444"
/>

):(

 <Bell
 size={18}
 color="#1A1B1F"
 />
)}

</button>
{/* DELETE / LEAVE */}

{selectedGroup.creator_id ===
currentUser?.id ? (

<button
onClick={
  handleClearChat
}
style={{

 ...iconBtnStyle,

      background:
      '#FEE2E2',

 border:
   '1px solid #FECACA'
}}
>

<Trash2
 size={18}
 color="#B91C1C"
/>

</button>

):(

<button
onClick={() =>
  handleLeaveGroup(
    selectedGroup.id
  )
}
 style={{
  ...iconBtnStyle,

 background:
   '#FEE2E2',
 border:
   '1px solid #FECACA'
}}
>

<LogOut
 size={18}
 color="#B91C1C"
/>

 </button>
)}

</div>

</div>

{/* =================================================
  PINNED MESSAGE BANNER
================================================= */}

{pinnedGroupMessages[
 selectedGroup.id
]?.length > 0 && (

<div
style={{
 background:
 PIN_COLORS.bg,

padding:
'10px 20px',

borderBottom:
`1.5px solid ${PIN_COLORS.border}`,

display:
'flex',

flexDirection:
  'column',

 gap:
   '6px'
}}
>

<div
style={{
 display:
'flex',

   alignItems:
    'center',

   gap:
   '6px',

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
      selectedGroup.id
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
  selectedGroup.id
].map(
  (pinnedId) => {

const pinnedMessage =
 messages.find(
   (message) =>
    message.id ===
    pinnedId
 );




if (!pinnedMessage) {

    return null;
}




return (

    <div
    key={
     pinnedId
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

border:

`1px solid ${PIN_COLORS.border}`,

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
 '#1A1B1F',

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
  pinnedMessage.sender_name
}
:
</strong>{' '}
{pinnedMessage.type ===
'poll'
 ? pinnedMessage
   .poll_data
   ?.question
 : pinnedMessage.content}

</span>

<button
type="button"
onClick={() =>
  togglePinGroupMessage(
    pinnedId
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




{/* =================================================
  MESSAGES
================================================= */}

<div
style={{
 flex:
   1,

padding:
'24px',

overflowY:
'auto',

display:
'flex',

flexDirection:
  'column',

gap:
'16px',

 background:
   '#FFFFFF'
}}
>

{messages.length ===
 0?(

<div
 style={{
  margin: 'auto',
  width: '100%',
  maxWidth: '520px'
 }}
>
 <div
  style={{
   width: '100%',
   minHeight: '190px',
   boxSizing: 'border-box',
   background: '#FFFFFF',
   border: '1px solid #E5EAF2',
   borderRadius: '22px',
   boxShadow: '0 7px 22px rgba(11,26,63,0.045)',
   display: 'flex',
   flexDirection: 'column',
   alignItems: 'center',
   justifyContent: 'center',
   textAlign: 'center',
   padding: '28px 22px'
  }}
 >
  <div
   style={{
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    boxShadow: '0 5px 16px rgba(11,26,63,0.08)',
    color: '#0B1A3F',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px'
   }}
  >
   <MessageCircle size={28} strokeWidth={1.9} />
  </div>

  <h3
   style={{
    margin: 0,
    color: '#0B1A3F',
    fontSize: '16px',
    fontWeight: '900'
   }}
  >
   No messages yet
  </h3>

  <p
   style={{
    margin: '7px 0 0',
    color: '#7A879A',
    fontSize: '12px',
    fontWeight: '700',
    lineHeight: 1.5
   }}
  >
   Say hello to start the discussion!
  </p>
 </div>
</div>

):(

messages.map(
(message) => {

      const isMe =
       message.user_id ===
       currentUser?.id;




   const isTemp =
    String(
      message.id
    ).startsWith(
      'temp-'
    );
return (

<div
key={
 message.id
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

{/* SENDER NAME */}

<div
style={{
 fontSize:
  '11px',

 fontWeight:
  '800',

 color:
  '#717786',

 marginBottom:
 '4px',

  textAlign:
    isMe
      ? 'right'
      : 'left'
 }}
 >
 {message.sender_name}
 </div>
        {/*
=================================================
          POLL MESSAGE
       =================================================
*/}

   {message.type ===
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
   '1.5px solid #E3E2E7',

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
       '#1A1B1F'
    }}
    >
    {
      message
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

{message.poll_data
 ?.options
 ?.map(

 (
   option,
   optionIndex
 ) => {

    const totalVotes =
     message
     .poll_data
     .options
     .reduce(
       (
         total,
         currentOption
       ) =>
         total +
         (
           currentOption
            .votes
            ?.length ||
           0
         ),
       0
     );
const optionVotes =
 option
 .votes
 ?.length ||
 0;
const percentage =
 totalVotes > 0
  ? Math.round(
     (
       optionVotes /
       totalVotes
     )*
       100
   )
 : 0;




const hasVoted =
 option.votes?.includes(
   currentUser?.id
 );

return (

<button
key={
  optionIndex
}
disabled={
  isTemp
}
onClick={() =>
  handleVotePoll(
    message.id,
    optionIndex
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
? '2px solid #002D62'
: '1px solid #CBD5E1',

background:
'#E9E7ED',

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

top:
 0,

left:
  0,

bottom:
0,

width:
`${percentage}%`,

  background:
    'rgba(0,45,98,0.12)'
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

gap:
'12px',

fontWeight:
 '800',

fontSize:
 '13px',
 color:
   '#1A1B1F'
}}
>

<span>

{hasVoted
 ? '✓ '
 : ''}

{
    option.text
}

</span>




<span>
{percentage}% ({optionVotes})
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
       '#717786'
    }}
    >
    Tap your choice again to remove your vote.
    </p>

 </div>

 ):(

 /*
=================================================
    REGULAR MESSAGE

================================================= */

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
      : '#F1F5F9',

color:
 isMe
   ? '#FFFFFF'
   : '#1A1B1F',

fontWeight:
 '700',

fontSize:
 '14px',

border:
isMe
  ? 'none'
  : '1px solid #E3E2E7',
 boxShadow:
   isMe
     ? `inset 4px 0 0 ${selectedGroup.color || '#E0F2FE'}, 0 2px 8px rgba(0,0,0,0.03)`
     : '0 2px 8px rgba(0,0,0,0.03)'
}}
>

{/* REPLIED MESSAGE */}

{message.reply_to_id && (

<div
style={{
 fontSize:
  '11px',

fontWeight:
 '700',

color:
 isMe
   ? getMutedContrastColor(selectedGroup.color || '#002D62')
   : '#717786',

background:
isMe
  ? getSoftContrastColor(selectedGroup.color || '#002D62')
  : '#FFFFFF',

borderLeft:
  `3px solid ${
   isMe
     ? getContrastColor(selectedGroup.color || '#002D62')
     : (selectedGroup.color || '#002D62')
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
       message.reply_to_sender
    }
  </strong>
  :{' '}

  {
       message.reply_to_content

  }

  </div>
 )}




 {message.content}

  </div>
 )}




  {/*
=================================================
    REACTIONS
  =================================================
*/}

     {message.reactions &&
      Object.keys(
      message.reactions
).some(
  (emoji) =>
   message
   .reactions[
     emoji
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
  message.reactions
).map(
  ([
   emoji,
   userIds
  ]) =>
   userIds.length >
     0 && (

 <button
 key={
   emoji
 }
 onClick={() =>
   handleReactToMessage(
        message.id,
        emoji
     )
    }
    style={{
       background:
       '#FFFFFF',
       border:
       '1px solid #E3E2E7',

        borderRadius:
        '12px',

        padding:
        '2px 8px',

        fontSize:
         '12px',

        fontWeight:
         '800',

        color:

          '#1A1B1F',

           cursor:
             'pointer'
          }}
          >
          {emoji}{' '}
          {userIds.length}
          </button>
      )
 )}

  </div>
 )}




  {/*
=================================================
    MESSAGE MENU BUTTON
  =================================================
*/}

    {!isTemp && (
<button
onClick={() =>
 setActiveMessageMenu(
  activeMessageMenu ===
   message.id
   ? null
    : message.id
 )
}
style={{
  position:
   'absolute',

top:
 0,
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
 size={14}
 color="#717786"
/>

</button>
  )}




  {/*
=================================================
    MESSAGE ACTION MENU
  =================================================
*/}

  {activeMessageMenu ===
   message.id && (

  <div
  style={{
   position:
   'absolute',

    top:
     '24px',

    [isMe
      ? 'right'

    : 'left']:
    '100%',

   background:
   'white',

   borderRadius:
   '12px',

   padding:
   '8px',

   border:
   '1px solid #E3E2E7',

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
{/* EMOJIS */}

{EMOJI_REACTIONS.map(
 (emoji) => (

 <button
 key={
   emoji
 }
   onClick={() =>
     handleReactToMessage(
       message.id,
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
     {emoji}
     </button>
 )
)}




{/* REPLY */}

<button
type="button"
onClick={() => {
setReplyingTo(
  message
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
   '#1A1B1F'
}}
>

<Reply
 size={12}
/>

Reply

</button>
{/* PIN MESSAGE */}

<button
type="button"
onClick={() =>
  togglePinGroupMessage(
    message.id
  )
}
style={{
 border:
  `1px solid ${PIN_COLORS.border}`,

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
 size={12}
 fill={
   PIN_COLORS.icon
 }
 color={
   PIN_COLORS.icon
 }
/>
{(
  pinnedGroupMessages[
    selectedGroup.id
  ] ||
  []
).includes(
  message.id
)
  ? 'Unpin'
  : 'Pin'}

</button>

{/* DELETE MESSAGE */}

{(isMe ||
 selectedGroup.creator_id ===
  currentUser?.id) && (

<button
onClick={() =>
  handleDeleteMessage(
    message.id
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
        size={12}
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



{/* =================================================
  REPLY PREVIEW
================================================= */}

{replyingTo && (
<div
 style={{
  padding:
  '10px 24px',
 background:
 '#FFFFFF',

borderTop:
'1px solid #E3E2E7',

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
 `3px solid ${selectedGroup.color || '#002D62'}`,

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
   '#1A1B1F'
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
     '#717786',

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
 color="#717786"
/>

</button>

</div>

)}


{/* =================================================
  MESSAGE INPUT
================================================= */}

<form
onSubmit={
  handleSendMessage
}
style={{
 padding: '16px 20px',
 background: '#FFFFFF',
 borderTop: '1px solid #E3E2E7',
 display: 'flex',
 alignItems: 'center',
 gap: '10px',
 width: '100%',
 boxSizing: 'border-box',
 flexShrink: 0
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
onChange={(event) =>
  setNewMessage(
    event.target.value
  )
}
style={{
 ...inputStyle,
 flex: '1 1 auto',
 minWidth: 0,
 height: '48px',
 margin: 0,
 padding: '0 16px',
 background: '#F7F8FA',
 border: '1.5px solid #E3E8F2',
 borderRadius: '14px',
 boxSizing: 'border-box'
}}
/>




<button
type="submit"
  disabled={
   !newMessage.trim()
  }
  className="btn"
  style={{
 width: '48px',
 height: '48px',
 minWidth: '48px',
 margin: 0,
 padding: 0,
 borderRadius: '14px',
 border: 'none',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 alignSelf: 'center',
 boxSizing: 'border-box',
 background: selectedGroup.color || '#0B1A3F',
 color: getContrastColor(selectedGroup.color || '#0B1A3F'),
 boxShadow: 'none',
 cursor: newMessage.trim() ? 'pointer' : 'default',
 flexShrink: 0,
 opacity: newMessage.trim() ? 1 : 0.5
}}
>

<Send
 size={18}
/>

</button>

</form>

 </div>
</ShellPortal>
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
'1px solid #E3E2E7',
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
   '#1A1B1F'
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

 color="#717786"
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

{/* NAME */}

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
onChange={(event) =>
  setEditingGroup({
    ...editingGroup,

   name:
     event.target.value
  })
 }
/>
</div>


{/* MAJOR */}
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
onChange={(event) =>
  setEditingGroup({
    ...editingGroup,

   major:
     event.target.value
  })

}
>

{MAJORS_CREATION.map(
 (major) => (

     <option
     key={major}
     value={major}
     >
     {major}
     </option>
 )
)}

</select>
</div>




{/* STUDY GOAL */}

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

  key={goal}
  type="button"
  onClick={() =>
    setEditingGroup({
     ...editingGroup,
     goal
    })
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



{/* NOISE */}
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
       setEditingGroup({
        ...editingGroup,
       environment
      })
     }
     style={
       editingGroup.environment ===
       environment
       ? activeChipStyle
       : chipStyle
     }
     >
     {environment}
     </button>
 )
)}

</div>

</div>




{/* DESCRIPTION */}

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
onChange={(event) =>
  setEditingGroup({
   ...editingGroup,

     description:
        event.target.value
     })
 }
/>

</div>




{/* =================================================
  EDIT COLOR
================================================= */}

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
CIRCLE THEME COLOR
</label>




<div
style={{
 display:
 'flex',

   gap:
   '12px',

   marginTop:
   '6px',
flexWrap:
  'wrap',

 alignItems:
   'center'
}}
>

{GROUP_COLORS.map(
 (
   colorOption
 ) => {

const isSelected =
 editingGroup.color ===
 colorOption.bg;




return (

<button
type="button"
key={
  colorOption.bg
}
title={

 colorOption.name
}
onClick={() =>
  setEditingGroup({
   ...editingGroup,

   color:
     colorOption.bg
  })
}
style={{
  width:
  '40px',

  height:
  '40px',

  borderRadius:
  '50%',
  background:
   colorOption.bg,
  cursor:
   'pointer',

   border:
   isSelected
     ? '3px solid #002D62'
  : '1px solid #CBD5E1',

 display:
 'flex',

 alignItems:
  'center',

 justifyContent:
   'center',

 boxShadow:
   isSelected
     ? '0 4px 12px rgba(0,45,98,0.15)'
     : 'none'
}}
>

 {isSelected && (

  <Check
    size={16}
    color={
      getContrastColor(
        colorOption.bg
      )
    }
    strokeWidth={3}
  />
 )}

    </button>
  );
 }
)}
</div>

{/* CUSTOM COLOR */}

<label
title="Choose any custom color or shade"
style={{
 height: '40px',
 padding: '0 14px',
 borderRadius: '12px',
 cursor: 'pointer',
 position: 'relative',
 border: !GROUP_COLORS.some(
   (colorOption) =>
     colorOption.bg.toLowerCase() === editingGroup.color?.toLowerCase()
 )
   ? '2px solid #002D62'
   : '1.5px solid #CBD5E1',
 background: '#FFFFFF',
 display: 'inline-flex',
 alignItems: 'center',
 gap: '8px',
 fontSize: '11px',
 fontWeight: '900',
 color: '#1A1B1F',
 overflow: 'hidden',
 marginTop: '10px',
 alignSelf: 'flex-start'
}}
>
<div

 style={{
  width: '18px',
  height: '18px',
  borderRadius: '5px',
  background: editingGroup.color || '#E0F2FE',
  border: '1px solid #CBD5E1'
 }}
/>
Custom Color
<span style={{ fontSize: '15px', fontWeight: '900' }}>+</span>
<input
 type="color"
 aria-label="Choose a custom circle color"
 value={editingGroup.color || '#E0F2FE'}
 onChange={(event) =>
  setEditingGroup({
   ...editingGroup,
   color: event.target.value
  })
 }
 style={{
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  opacity: 0,
  cursor: 'pointer'
 }}
/>
</label>




{/* COLOR PREVIEW */}

<div
style={{
 marginTop:
 '10px',

padding:
'15px',
borderRadius:
'14px',

background:

editingGroup.color ||
'#E0F2FE',

 border:
   `1px solid ${getContrastBorder(
    editingGroup.color ||
    '#E0F2FE'
   )}`
}}
>

<p
style={{
 margin:
 0,

fontWeight:
 '900',

fontSize:
 '15px',

 color:
  getContrastColor(
    editingGroup.color ||
    '#E0F2FE'
  )
}}
>
{editingGroup.name ||
 'Study Circle'}
</p>




<p
style={{
 margin:
 '3px 0 0',

fontWeight:
 '700',
  fontSize:
   '11px',

 color:

  getMutedContrastColor(
    editingGroup.color ||
    '#E0F2FE'
  )
}}
>
Preview of your updated theme
</p>

</div>

</div>


{/* SAVE */}

<button
type="submit"
disabled={
  actionLoading
}
className="btn btn-primary"
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
   '1px solid #E3E2E7'
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
   '#1A1B1F'
}}
>
Create Group Poll
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
 color="#717786"
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
  onChange={(event) =>
    setPollQuestion(
      event.target.value
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
   option,
   optionIndex
 ) => (

<input
key={
  optionIndex
 }
 type="text"
 placeholder={
   `Option ${
     optionIndex +
     1
    }`
   }
   required
   style={{
     ...inputStyle,

     marginBottom:
       '8px'
    }}
    value={
     option
   }
   onChange={(event) => {

   const updated =
    [

       ...pollOptions
     ];




     updated[
      optionIndex
     ]=
      event.target.value;




       setPollOptions(
         updated
       );
      }}
     />
 )
)}




<button
type="button"
onClick={() =>
 setPollOptions([
  ...pollOptions,
  ''
 ])
}
style={{
  border:
  'none',

background:
'none',

color:
 '#1A1B1F',

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
className="btn btn-primary"
 style={{
  marginTop:
    '10px'
}}
>
Post Poll to Chat
 </button>
</form>

</div>

 </div>
)}




{/* =================================================
  MEMBERS MODAL
================================================= */}

{showMembersDrawer && selectedGroup &&
 (joinedGroupIds.includes(selectedGroup.id) ||
  selectedGroup.creator_id === currentUser?.id) && (

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
   '1px solid #E3E2E7'
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
   '#1A1B1F'
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
 '#717786',

fontWeight:
 '700'
}}
>
{groupMembers.length}{' '}
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
 color="#717786"
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
 (member) => (

 <div
 key={
  member.user_id

   }
   onClick={() => {
if (
  member.user_id !==
  currentUser?.id
){
  openMemberProfile(member);
  setShowMembersDrawer(false);
 }
}}
style={{
 padding:
   '14px',

borderRadius:
'16px',

background:
'#E9E7ED',

border:
'1px solid #E3E2E7',

cursor:
 member.user_id ===
 currentUser?.id
  ? 'default'
  : 'pointer',

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
 display:
 'flex',

 alignItems:
  'center',

 gap:
 '10px',

 minWidth:
   0
}}
>

<Circle
size={10}
fill={
  member.isOnline
    ? '#22C55E'
    : '#717786'
}
color={
  member.isOnline
     ? '#22C55E'
     : '#717786'
}
/>




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
'6px',

 flexWrap:
   'wrap'
}}
>

<p
style={{
 margin:
 0,

fontWeight:
 '800',

color:
 '#1A1B1F',

 fontSize:
   '14px'
}}
>
{member
 .profiles
 ?.full_name ||
member
 .profiles
 ?.email
 ?.split('@')[0] ||
'Student'}

{member.user_id ===
 currentUser?.id
 ? ' (You)'
 : ''}
</p>

{member.user_id ===
 selectedGroup?.creator_id && (

<span
style={{
 fontSize:
  '10px',
  background:
   PIN_COLORS.bg,

border:
`1px solid ${PIN_COLORS.border}`,

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
 '2px 0 0',

fontWeight:
 '600',

color:
 '#717786',

 fontSize:
   '12px'
}}
>

{[
 member
   .profiles
   ?.major,
      member
       .profiles
       ?.academic_year
 ]
   .filter(
     (value) =>
       value &&
       value !==
        'Not specified'
   )
   .join(' · ') ||
   'Student'}
 </p>

</div>

</div>




{member.user_id !==
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
onClick={(event) => {

  event.stopPropagation();

 openMemberProfile(member);
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
      size={18}
      color="#717786"
     />

     </button>
      <button
       type="button"
       onClick={(event) => {
        event.stopPropagation();
        openMemberChat(member);
        setShowMembersDrawer(false);
       }}
       title="Message member"
       style={{
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        display: 'flex',
        padding: 0
       }}
      >
       <MessageSquare
        size={18}
        color={selectedGroup.color || '#0B1A3F'}
       />
      </button>

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
   '1px solid #E3E2E7'
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
'#E0F2FE',

 color:
   getContrastColor(
     selectedGroup?.color ||
      '#E0F2FE'
   )
}}
>

{selectedMember.profiles?.account_type || 'Student Profile'}

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
 color="#717786"
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

{/* AVATAR */}

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
  ?.full_name ||

  selectedMember
   .profiles
   ?.email
),

color:
 '#1A1B1F',

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
{selectedMember.profiles?.avatar_url ? (
 <img
  src={selectedMember.profiles.avatar_url}
  alt={selectedMember.profiles?.full_name || 'Student'}
  style={{
   width: '100%',
   height: '100%',
   borderRadius: '50%',
   objectFit: 'cover'
  }}
 />
) : (
 getInitials(
  selectedMember.profiles?.full_name ||
  selectedMember.profiles?.email ||
  'Student'
 )
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
   '#1A1B1F'
}}
>
{selectedMember
 .profiles
 ?.full_name ||
 selectedMember
   .profiles
   ?.email
   ?.split('@')[0] ||
 'Student'}
</h4>




<p
style={{
 margin:
 '4px 0 0',
fontWeight:
 '700',

color:
 '#717786',

 fontSize:
   '13px'
}}
>
{selectedMember
 .profiles
 ?.email ||
 'No public email provided'}
</p>




{/* ACTUAL CAMPORA PROFILE INFO */}

<div
style={{
 marginTop: '16px',
 display: 'flex',
 flexDirection: 'column',
 gap: '8px'
}}
>
{[
  ['MAJOR', selectedMember.profiles?.major],
  ['ACADEMIC LEVEL', selectedMember.profiles?.academic_year],
  ['TITLE', selectedMember.profiles?.guest_title]
]
 .filter(([, value]) => value && value !== 'Not specified')
 .map(([label, value]) => (
  <div
   key={label}
   style={{
    background: '#F7F8FA',
    padding: '10px 14px',
    borderRadius: '12px',
    textAlign: 'left',
    border: '1px solid #E3E2E7'
   }}
  >
   <span style={{
    fontSize: '10px',
    fontWeight: '900',
    color: '#717786',
    display: 'block'
   }}>
    {label}
   </span>
   <span style={{
    fontSize: '13px',
    fontWeight: '800',
    color: '#1A1B1F'
   }}>
    {value}
   </span>
  </div>
 ))}

{Array.isArray(selectedMember.profiles?.courses_taken) &&
 selectedMember.profiles.courses_taken.length > 0 && (
  <div style={{
   background: '#F7F8FA',
   padding: '10px 14px',
   borderRadius: '12px',
   textAlign: 'left',
   border: '1px solid #E3E2E7'
  }}>
   <span style={{
    fontSize: '10px',
    fontWeight: '900',
    color: '#717786',
    display: 'block',
    marginBottom: '6px'
   }}>
    COURSES
   </span>
   <span style={{
    fontSize: '13px',
    fontWeight: '800',
    color: '#1A1B1F',
    lineHeight: 1.5
   }}>
    {selectedMember.profiles.courses_taken.join(' · ')}
   </span>
  </div>
 )}

{!selectedMember.profiles?.major &&
 !selectedMember.profiles?.academic_year &&
 !selectedMember.profiles?.guest_title &&
 !(Array.isArray(selectedMember.profiles?.courses_taken) &&
   selectedMember.profiles.courses_taken.length > 0) && (
  <div style={{
   background: '#F7F8FA',
   padding: '12px 14px',
   borderRadius: '12px',
   color: '#717786',
   fontSize: '13px',
   fontWeight: '700',
   border: '1px solid #E3E2E7'
  }}>
   This student has not added more public profile details yet.
  </div>
 )}
</div>

</div>
{/* SEND DM BUTTON */}

<button
onClick={() => {
 openMemberChat(selectedMember);
 setSelectedMember(null);
}}
className="btn btn-primary"
style={{
width:
'100%'
}}
>
<MessageSquare
 size={16}
/>

Send Direct Message

</button>
  </div>

     </div>
    )}

    </div>
    );
}

