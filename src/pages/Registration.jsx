import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
AlarmClock,
ArrowLeftRight,
ArrowRight,
Bell,
BookOpen,
CalendarDays,
CheckCircle2,
CornerDownRight,
Edit3,
GraduationCap,
History,
MessageCircle,
MessageSquare,
MoreVertical,
Pin,
Plus,
RefreshCw,
RotateCcw,
Reply,
Search,
Send,
Star,
Trash2,
UserRound,
X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
PageShell,
IconChip,
EmptyState
} from '../components/luminous';
const MAJORS = [
'Computer Science',
'Business / Finance',
'Mechanical Engineering',
'Electrical Engineering',
'Biology',
'Architecture',
'Economics',
'Psychology'
];
const EMPTY_SWAP = {
haveCourse: '', haveCrn: '', haveCourseName: '', haveSection: '', haveProf: '',
haveDays: '', haveTime: '09:00 AM - 10:00 AM',
wantCourse: '', wantCrn: '', wantCourseName: '', wantSection: '', wantProf: '',
wantDays: '', wantTime: '09:00 AM - 10:00 AM',
isAnonymous: false
};

const EMPTY_REVIEW = {
crn: '', course_code: '', course_name: '', section: '', professor_name: '',

meeting_days: '', meeting_time: '09:00 AM - 10:00 AM',
semester: '', rating: 5, difficulty: 3, comment: '', is_anonymous: false
};
const EMPTY_QUESTION = { title: '', content: '', is_anonymous: false };
const EMPTY_REMINDER = {
crn: '', course_code: '', course_name: '', section: '', professor: '',
meeting_days: '', meeting_time: '09:00 AM - 10:00 AM'
};

const MEETING_PATTERN_OPTIONS = [
'MWF', 'TTH', 'MW', 'TR', 'Recitation', 'Lab', 'Tutorial', 'Seminar'
];
const SINGLE_DAY_SCHEDULE_TYPES = new Set(['Recitation', 'Lab', 'Tutorial', 'Seminar']);
const WEEKDAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const MEETING_TIME_OPTIONS = [
'8:00 AM - 9:00 AM', '9:00 AM - 10:00 AM', '10:00 AM - 11:00 AM',
'11:00 AM - 12:00 PM', '12:00 PM - 1:00 PM', '1:00 PM - 2:00 PM',
'2:00 PM - 3:00 PM', '3:00 PM - 4:00 PM', '4:00 PM - 5:00 PM',
'5:00 PM - 6:00 PM', '8:00 AM - 9:15 AM', '9:30 AM - 10:45 AM',
'11:00 AM - 12:15 PM', '12:30 PM - 1:45 PM', '2:00 PM - 3:15 PM',
'3:30 PM - 4:45 PM'
];

const DEFAULT_MEETING_TIME = '09:00 AM - 10:00 AM';

const sanitizeCrn = value => String(value || '').replace(/\D/g, '').slice(0, 5);
const isValidCrn = value => /^[0-9]{5}$/.test(sanitizeCrn(value));

const normalizeMeetingTime = value => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const match = raw.match(
    /^(\d{1,2}):?(\d{2})?\s*(AM|PM)\s*-\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)$/i
  );

  if (!match) return raw;

  const [, sh, sm = '00', sap, eh, em = '00', eap] = match;

  const startHour = Math.min(12, Math.max(1, Number(sh)));
  const endHour = Math.min(12, Math.max(1, Number(eh)));

  return `${String(startHour).padStart(2, '0')}:${sm} ${sap.toUpperCase()} - ${String(endHour).padStart(2, '0')}:${em} ${eap.toUpperCase()}`;
};

const isValidMeetingTime = value =>
  /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM) - (0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(
    normalizeMeetingTime(value)
  );

const sanitizeMeetingTime = value =>
String(value || '')
.toUpperCase()
.replace(/[^0-9APM:\s.-]/g, '')
.replace(/\s+/g, ' ')
.slice(0, 25);

const to24HourTime = (hourText, minuteText, period) => {
  let hour = Number(hourText);
  const minute = String(minuteText || '00').padStart(2, '0');
  if (period === 'AM' && hour === 12) hour = 0;
  if (period === 'PM' && hour !== 12) hour += 12;
  return `${String(hour).padStart(2, '0')}:${minute}`;
};

const to12HourTime = value => {
  const [hourText = '09', minute = '00'] = String(value || '09:00').split(':');
  const hour24 = Number(hourText);
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${minute} ${period}`;
};

const splitMeetingTime = value => {
  const match = String(value || '').trim().match(
    /^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)\s*-\s*(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i
  );
  if (!match) return { start: '09:00', end: '10:00' };
  return {
    start: to24HourTime(match[1], match[2], match[3].toUpperCase()),
    end: to24HourTime(match[4], match[5], match[6].toUpperCase())
  };
};

const joinMeetingTime = (start, end) => `${to12HourTime(start)} - ${to12HourTime(end)}`;


const AVATAR_PALETTE = [
'#E0F2FE', '#FCE7F3', '#F3E8FF', '#F2F9F7',
'#FFF6F2', '#CFFAFE', '#E0E7FF', '#D1FAE5'
];
const DM_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const REGISTRATION_TOOLS = [
{ label: 'Planner', icon: CalendarDays, tab: 'match' },
{ label: 'History', icon: History, tab: 'myposts' },
{ label: 'Requirements', icon: BookOpen, tab: 'curriculum' }
];



const getInitials = name =>
(name || 'S')
.trim()
.split(' ')
.filter(Boolean)
.map(part => part[0])
.slice(0, 2)
.join('')
.toUpperCase();
const getAvatarColor = name => {
const text = name || 'S';
let hash = 0;
for (let index = 0; index < text.length; index += 1) {
hash = text.charCodeAt(index) + ((hash << 5) - hash);
}
return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
};
export default function Registration() {
const [activeTab, setActiveTab] = useState('match');
const [loading, setLoading] = useState(true);
const [currentUserId, setCurrentUserId] = useState(null);
const [userName, setUserName] = useState('Student');
const [swapPosts, setSwapPosts] = useState([]);
const [searchPref, setSearchPref] = useState(EMPTY_SWAP);
const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);

const [matchResult, setMatchResult] = useState(null);
const [matchFilter, setMatchFilter] = useState('all');
const [editingPostId, setEditingPostId] = useState(null);
const [reviews, setReviews] = useState([]);
const [reviewReplies, setReviewReplies] = useState([]);
const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
const [newReview, setNewReview] = useState(EMPTY_REVIEW);
const [editingReviewId, setEditingReviewId] = useState(null);

const [replyingToReviewId, setReplyingToReviewId] = useState(null);
const [reviewReplyText, setReviewReplyText] = useState('');
const [editingReviewReplyId, setEditingReviewReplyId] = useState(null);
const [editingReviewReplyText, setEditingReviewReplyText] = useState('');
const [selectedMajor, setSelectedMajor] = useState(MAJORS[0]);
const [majorQuestions, setMajorQuestions] = useState([]);
const [questionReplies, setQuestionReplies] = useState([]);
const [newQuestion, setNewQuestion] = useState(EMPTY_QUESTION);
const [editingQuestionId, setEditingQuestionId] = useState(null);
const [replyingToQId, setReplyingToQId] = useState(null);
const [replyText, setReplyText] = useState('');
const [editingQuestionReplyId, setEditingQuestionReplyId] = useState(null);
const [editingQuestionReplyText, setEditingQuestionReplyText] = useState('');
const [reminders, setReminders] = useState([]);
const [newReminder, setNewReminder] = useState(EMPTY_REMINDER);
const [editingReminderId, setEditingReminderId] = useState(null);
const [seatAlertMode, setSeatAlertMode] = useState('both');

const seatAlertStorageKey = currentUserId
  ? `campora-seat-alert-types-${currentUserId}`
  : 'campora-seat-alert-types';

const getSavedSeatAlertTypes = () => {
  try {
    return JSON.parse(localStorage.getItem(seatAlertStorageKey) || '{}');
  } catch {
    return {};
  }
};

const saveSeatAlertType = (reminderId, alertType) => {
  if (!reminderId) return;
  const saved = getSavedSeatAlertTypes();
  saved[reminderId] = alertType;
  localStorage.setItem(seatAlertStorageKey, JSON.stringify(saved));
};

const removeSavedSeatAlertType = (reminderId) => {
  if (!reminderId) return;
  const saved = getSavedSeatAlertTypes();
  delete saved[reminderId];
  localStorage.setItem(seatAlertStorageKey, JSON.stringify(saved));
};

const getSeatAlertType = reminder => {
  if (!reminder) return 'both';
  if (reminder.alert_type) return reminder.alert_type;
  return getSavedSeatAlertTypes()[reminder.id] || 'both';
};
const [activeDmUser, setActiveDmUser] = useState(null);
const [dmMessages, setDmMessages] = useState([]);
const [dmMessage, setDmMessage] = useState('');
const [dmLoading, setDmLoading] = useState(false);
const [dmInboxMessages, setDmInboxMessages] = useState([]);
const [dmInboxProfiles, setDmInboxProfiles] = useState({});
const [dmInboxLoading, setDmInboxLoading] = useState(false);
const dmChatBottomRef = useRef(null);
const dmChatHistoryRef = useRef(null);
const [dmInboxLoaded, setDmInboxLoaded] = useState(false);
const [dmSearchQuery, setDmSearchQuery] = useState('');
const [dmSearchResults, setDmSearchResults] = useState([]);
const [dmSearchLoading, setDmSearchLoading] = useState(false);
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
localStorage.getItem('campora_registration_pinned_dm_messages') || '{}'
);
} catch {
return {};
}
});

const [dmReplyingTo, setDmReplyingTo] = useState(null);
const [dmLocalReactions, setDmLocalReactions] = useState(() => {
try {
return JSON.parse(
localStorage.getItem('campora_registration_dm_reactions') || '{}'
);
} catch {
return {};
}
});
const [activeDmMessageMenu, setActiveDmMessageMenu] = useState(null);

useEffect(() => {
localStorage.setItem(
'campora_registration_pinned_dm_users',
JSON.stringify(Array.isArray(pinnedDmUsers) ? pinnedDmUsers : [])
);
}, [pinnedDmUsers]);
useEffect(() => {
localStorage.setItem('campora_registration_pinned_dm_messages',
JSON.stringify(pinnedDmMessages));
}, [pinnedDmMessages]);
useEffect(() => {
localStorage.setItem('campora_registration_dm_reactions',
JSON.stringify(dmLocalReactions));
}, [dmLocalReactions]);
useEffect(() => {
loadRegistrationData();
}, []);
useEffect(() => {
if (activeDmUser && currentUserId) fetchConversation();
else setDmMessages([]);
}, [activeDmUser?.id, currentUserId]);
useEffect(() => {
if (activeTab !== 'messages') return;
const query = dmSearchQuery.trim();
if (!query) {

setDmSearchResults([]);
setDmSearchLoading(false);
return;
}
const timeout = setTimeout(async () => {
setDmSearchLoading(true);
const { data, error } = await supabase.rpc('search_student_directory', {
search_text: query
});

if (error) {
console.error('Student directory search error:', error);
setDmSearchResults([]);
} else {
setDmSearchResults((data || []).filter(profile => profile.id !==
currentUserId));
}
setDmSearchLoading(false);
}, 250);
return () => clearTimeout(timeout);
}, [dmSearchQuery, activeTab, currentUserId]);
const showError = (message, error) => {
console.error(message, error);
alert(error?.message ? `${message}\n${error.message}` : message);
};
const formatDate = date => (date ? new Date(date).toLocaleDateString() : '');
const normalizeMatchValue = value => String(value ||
'').trim().toLowerCase().replace(/\s+/g, ' ');
const valuesMatch = (a, b) => Boolean(a && b) && normalizeMatchValue(a)
=== normalizeMatchValue(b);
const canMessageUser = (userId, isAnonymous = false, status = 'available') =>
Boolean(userId) && userId !== currentUserId && !isAnonymous && status !==
'taken';
const buildSwapSourceLabel = post => {
if (!post) return '';
const have = [post.have_course, post.have_section ? `Sec ${post.have_section}` : ''].filter(Boolean).join(' · ');
const want = [post.want_course, post.want_section ? `Sec ${post.want_section}` : ''].filter(Boolean).join(' · ');
return `${have} → ${want}`;
};
const createDmMetadataMarker = ({ context = null, reply = null } = {}) => {
const meta = {};
if (context?.type === 'swap' && context?.postId) {
meta.source = { type: 'swap', postId: context.postId, label: context.label ||
'' };
}
if (reply) {
meta.reply = {
id: reply.id,
sender: reply.sender || 'Student',
text: reply.text || ''
};
}
if (Object.keys(meta).length === 0) return '';
try {
return `[[CAMPORA_DM:${encodeURIComponent(JSON.stringify(meta))}]]`;

} catch {
return '';
}
};
const parseDirectMessage = rawMessage => {
const raw = String(rawMessage || '');
const metaMatch = raw.match(/^\[\[CAMPORA_DM:([^\]]+)\]\]/);
if (metaMatch) {
try {
const meta = JSON.parse(decodeURIComponent(metaMatch[1]));
return {
text: raw.replace(/^\[\[CAMPORA_DM:([^\]]+)\]\]/, ''),
source: meta.source || null,
reply: meta.reply || null
};
} catch {
return { text: raw.replace(/^\[\[CAMPORA_DM:[^\]]+\]\]/, ''), source: null,
reply: null };
}
}
const legacy = raw.match(/^\[\[CAMPORA_SOURCE:([^\]]+)\]\]/);
if (legacy) {
try {
return {

text: raw.replace(/^\[\[CAMPORA_SOURCE:([^\]]+)\]\]/, ''),
source: JSON.parse(decodeURIComponent(legacy[1])),
reply: null
};
} catch {
return { text: raw.replace(/^\[\[CAMPORA_SOURCE:[^\]]+\]\]/, ''), source:
null, reply: null };
}
}
return {
text: raw
.replace(/^\[\[CAMPORA_DM:[^\]]+\]\]/, '')
.replace(/^\[\[CAMPORA_SOURCE:[^\]]+\]\]/, ''),
source: null,
reply: null
};
};
const togglePinDmUser = userId => {
setPinnedDmUsers(previous => {
const safePrevious = Array.isArray(previous) ? previous : [];
return safePrevious.includes(userId)
? safePrevious.filter(id => id !== userId)

: [...safePrevious, userId];
});
};
const togglePinDmMessage = messageId => {
if (!activeDmUser?.id) return;
setPinnedDmMessages(previous => {
const safePrevious =
previous && typeof previous === 'object' ? previous : {};
const key = activeDmUser.id;
const current = Array.isArray(safePrevious[key])
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
previous && typeof previous === 'object' ? previous : {};
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
[messageId]: { ...messageReactions, [emoji]: nextUsers }
};
});
setActiveDmMessageMenu(null);
};
const openDm = (id, name, isAnonymous = false, status = 'available', context
= null) => {

if (!canMessageUser(id, isAnonymous, status)) return;
const resolved = resolveDmStudent(id);
const resolvedName =
(name && name !== 'Student' ? name : '') ||
(resolved?.name && resolved.name !== 'Student' ? resolved.name : '') ||
'Student';
setActiveDmUser({
id,
name: resolvedName,
email: resolved?.email || '',
context
});
setActiveTab('messages');
setDmSearchQuery('');
setDmSearchResults([]);
if (!dmInboxLoaded) {
setTimeout(() => fetchDmInbox(), 0);
}
};
const getMatchDetails = post => {
const theyHaveWantedCourse = valuesMatch(post.have_course,
searchPref.wantCourse);
const theyWantMyCourse = valuesMatch(post.want_course,
searchPref.haveCourse);
const reciprocal = theyHaveWantedCourse && theyWantMyCourse;
const comparisons = [
['Wanted CRN', searchPref.wantCrn, post.have_crn],
['Wanted Section', searchPref.wantSection, post.have_section],

['Wanted Professor', searchPref.wantProf, post.have_prof],
['Wanted Days', searchPref.wantDays, post.have_days],
['Wanted Time', searchPref.wantTime, post.have_time],
['Your CRN', searchPref.haveCrn, post.want_crn],
['Your Section', searchPref.haveSection, post.want_section],
['Your Professor', searchPref.haveProf, post.want_prof],
['Your Days', searchPref.haveDays, post.want_days],
['Your Time', searchPref.haveTime, post.want_time]
];
let earnedWeight = (theyHaveWantedCourse ? 30 : 0) +
(theyWantMyCourse ? 30 : 0);
let totalWeight = 60;
const checkedDetails = comparisons
.filter(([, search]) => String(search || '').trim())
.map(([label, search, postValue]) => {
totalWeight += 4;
const matched = valuesMatch(search, postValue);
if (matched) earnedWeight += 4;

return { label, search, post: postValue, matched };
});
const allSpecifiedDetailsMatch = checkedDetails.every(item =>
item.matched);
const percentage = Math.round((earnedWeight / totalWeight) * 100);
const category = reciprocal && allSpecifiedDetailsMatch ? 'exact' :
reciprocal ? 'similar' : 'possible';
return {
post,
category,
reciprocal,
percentage: category === 'exact' ? 100 : percentage,
checkedDetails,
matchedDetails: checkedDetails.filter(item => item.matched).length,
totalDetails: checkedDetails.length
};
};
const loadRegistrationData = async () => {
try {
setLoading(true);
const { data: authData, error: authError } = await supabase.auth.getUser();
if (authError) throw authError;
const user = authData?.user;
if (!user) return;

setCurrentUserId(user.id);
const profilePromise = supabase.from('profiles').select('name').eq('id',
user.id).maybeSingle();
const dataPromise = Promise.all([
supabase.from('registration_swaps').select('*').order('created_at',
{ ascending: false }),
supabase.from('course_reviews').select('*').order('created_at',
{ ascending: false }),
supabase.from('course_review_replies').select('*').order('created_at',
{ ascending: true }),
supabase.from('major_questions').select('*').order('created_at',
{ ascending: false }),
supabase.from('major_question_replies').select('*').order('created_at',
{ ascending: true }),
supabase.from('course_reminders').select('*').eq('user_id',
user.id).order('created_at', { ascending: false })
]);
const [{ data: profile }, results] = await Promise.all([profilePromise,
dataPromise]);
setUserName(profile?.name || user.user_metadata?.name || 'Student');
const [swapsResult, reviewsResult, reviewRepliesResult, questionsResult,
questionRepliesResult, remindersResult] = results;

[swapsResult, reviewsResult, reviewRepliesResult, questionsResult,
questionRepliesResult, remindersResult]
.forEach(result => result.error && console.error(result.error));
setSwapPosts(swapsResult.data || []);
setReviews(reviewsResult.data || []);
setReviewReplies(reviewRepliesResult.data || []);
setMajorQuestions(questionsResult.data || []);
setQuestionReplies(questionRepliesResult.data || []);
setReminders(remindersResult.data || []);
} catch (error) {
showError('Could not load the Registration Hub.', error);
} finally {
setLoading(false);
}
};
const handleFindOrPostMatch = async event => {
event.preventDefault();
if (!searchPref.haveCourse.trim() || !searchPref.wantCourse.trim()) {
alert('Please enter the course you currently have and the course you want.');
return;
}
if (!isValidCrn(searchPref.haveCrn)) {
alert('Your current course CRN must be exactly 5 digits.');
return;
}
if (!isValidCrn(searchPref.wantCrn)) {
alert('The CRN for the course you want must be exactly 5 digits.');
return;
}
if (!isValidMeetingTime(searchPref.haveTime) || !isValidMeetingTime(searchPref.wantTime)) {
alert('Please enter each time like 09:00 AM - 10:00 AM.');
return;
}
if (editingPostId) {
const payload = {
have_course: searchPref.haveCourse.trim().toUpperCase(),
have_crn: searchPref.haveCrn.trim(),
have_course_name: searchPref.haveCourseName.trim(),
have_section: searchPref.haveSection.trim(),
have_prof: searchPref.haveProf.trim(),
have_days: searchPref.haveDays.trim(),
have_time: normalizeMeetingTime(searchPref.haveTime).trim(),
want_course: searchPref.wantCourse.trim().toUpperCase(),
want_crn: searchPref.wantCrn.trim(),
want_course_name: searchPref.wantCourseName.trim(),
want_section: searchPref.wantSection.trim(),
want_prof: searchPref.wantProf.trim(),
want_days: searchPref.wantDays.trim(),
want_time: normalizeMeetingTime(searchPref.wantTime).trim(),
is_anonymous: searchPref.isAnonymous,
author_name: searchPref.isAnonymous ? 'Anonymous Student' : userName
};
const { data, error } = await supabase
.from('registration_swaps')
.update(payload)
.eq('id', editingPostId)
.eq('user_id', currentUserId)
.select()
.single();

if (error) return showError('Could not update your swap request.', error);
setSwapPosts(previous => previous.map(post => (post.id ===
editingPostId ? data : post)));
closeSwapModal();
return;
}
const candidates = swapPosts
.filter(post => {
if (post.user_id === currentUserId || post.status === 'taken') return false;
return valuesMatch(post.have_course, searchPref.wantCourse) ||
valuesMatch(post.want_course, searchPref.haveCourse);
})
.map(getMatchDetails)
.sort((a, b) => {

const priority = { exact: 3, similar: 2, possible: 1 };
return priority[b.category] - priority[a.category] || b.percentage - a.percentage;
});
setMatchFilter('all');
setMatchResult({ found: candidates.length > 0, candidates });
};
const handleConfirmPostMatch = async () => {
if (!currentUserId) return;
const payload = {
user_id: currentUserId,
author_name: searchPref.isAnonymous ? 'Anonymous Student' : userName,
have_course: searchPref.haveCourse.trim().toUpperCase(),
have_crn: searchPref.haveCrn.trim(),
have_course_name: searchPref.haveCourseName.trim(),
have_section: searchPref.haveSection.trim(),
have_prof: searchPref.haveProf.trim(),
have_days: searchPref.haveDays.trim(),
have_time: normalizeMeetingTime(searchPref.haveTime).trim(),
want_course: searchPref.wantCourse.trim().toUpperCase(),
want_crn: searchPref.wantCrn.trim(),
want_course_name: searchPref.wantCourseName.trim(),
want_section: searchPref.wantSection.trim(),
want_prof: searchPref.wantProf.trim(),
want_days: searchPref.wantDays.trim(),
want_time: normalizeMeetingTime(searchPref.wantTime).trim(),
is_anonymous: searchPref.isAnonymous,
status: 'available'
};
const { data, error } = await
supabase.from('registration_swaps').insert([payload]).select().single();
if (error) return showError('Could not post your swap request.', error);
setSwapPosts(previous => [data, ...previous]);

closeSwapModal();
};
const handleEditSwap = post => {
setEditingPostId(post.id);
setSearchPref({
haveCourse: post.have_course || '', haveCrn: post.have_crn || '',
haveCourseName: post.have_course_name || '',
haveSection: post.have_section || '', haveProf: post.have_prof || '',
haveDays: post.have_days || '', haveTime: post.have_time || '',
wantCourse: post.want_course || '', wantCrn: post.want_crn || '',
wantCourseName: post.want_course_name || '',

wantSection: post.want_section || '', wantProf: post.want_prof || '',
wantDays: post.want_days || '', wantTime: post.want_time || '',
isAnonymous: Boolean(post.is_anonymous)
});
setMatchResult(null);
setIsMatchModalOpen(true);
};
const handleDeleteSwap = async id => {
if (!window.confirm('Delete this swap request?')) return;
const { error } = await supabase.from('registration_swaps').delete().eq('id',
id).eq('user_id', currentUserId);
if (error) return showError('Could not delete your swap request.', error);
setSwapPosts(previous => previous.filter(post => post.id !== id));
};
const handleToggleSwapStatus = async post => {
const nextStatus = (post.status || 'available') === 'taken' ? 'available' :
'taken';
if (nextStatus === 'taken' && !window.confirm('Mark this swap as taken? Other students will see that it is no longer available.')) return; const { data, error } = await supabase
.from('registration_swaps')
.update({ status: nextStatus })
.eq('id', post.id)
.eq('user_id', currentUserId)
.select()
.single();
if (error) return showError('Could not update the swap status.', error);
setSwapPosts(previous => previous.map(item => (item.id === post.id ?
data : item)));
};
const closeSwapModal = () => {
setIsMatchModalOpen(false);
setEditingPostId(null);
setMatchResult(null);
setMatchFilter('all');

setSearchPref(EMPTY_SWAP);
};
const openCreateReview = () => {
setEditingReviewId(null);
setNewReview(EMPTY_REVIEW);
setIsReviewModalOpen(true);
};

const handleEditReview = review => {
setEditingReviewId(review.id);
setNewReview({
crn: review.crn || '', course_code: review.course_code || '', course_name:
review.course_name || '', section: review.section || '',
professor_name: review.professor_name || '', meeting_days:
review.meeting_days || '', meeting_time: review.meeting_time || '',
semester: review.semester || '', rating: review.rating || 5, difficulty:
review.difficulty || 3, comment: review.comment || '',
is_anonymous: Boolean(review.is_anonymous)
});
setIsReviewModalOpen(true);
};
const closeReviewModal = () => {
setIsReviewModalOpen(false);
setEditingReviewId(null);
setNewReview(EMPTY_REVIEW);
};
const handleSaveReview = async event => {
event.preventDefault();
if (!currentUserId) return;
if (!isValidCrn(newReview.crn)) {
alert('CRN must be exactly 5 digits.');
return;
}
if (!isValidMeetingTime(newReview.meeting_time)) {
alert('Please enter the time like 09:00 AM - 10:00 AM.');
return;
}
const payload = {
user_id: currentUserId,
author_name: newReview.is_anonymous ? 'Anonymous Student' :
userName,
crn: newReview.crn.trim(),
course_code: newReview.course_code.trim().toUpperCase(),
course_name: newReview.course_name.trim(),
section: newReview.section.trim(),
professor_name: newReview.professor_name.trim(),
meeting_days: newReview.meeting_days.trim(),
meeting_time: newReview.meeting_time.trim(),
semester: newReview.semester.trim(),
rating: Number(newReview.rating),
difficulty: Number(newReview.difficulty),
comment: newReview.comment.trim(),
is_anonymous: newReview.is_anonymous
};
if (editingReviewId) {

const { data, error } = await
supabase.from('course_reviews').update(payload).eq('id',
editingReviewId).eq('user_id', currentUserId).select().single();
if (error) return showError('Could not update your review.', error);

setReviews(previous => previous.map(review => (review.id ===
editingReviewId ? data : review)));
} else {
const { data, error } = await
supabase.from('course_reviews').insert([payload]).select().single();
if (error) return showError('Could not post your review.', error);
setReviews(previous => [data, ...previous]);
}
closeReviewModal();
};
const handleDeleteReview = async id => {
if (!window.confirm('Delete this course review?')) return;
const { error } = await supabase.from('course_reviews').delete().eq('id',
id).eq('user_id', currentUserId);
if (error) return showError('Could not delete your review.', error);
setReviews(previous => previous.filter(review => review.id !== id));
setReviewReplies(previous => previous.filter(reply => reply.review_id !==
id));
};
const handleAddReviewReply = async reviewId => {
if (!reviewReplyText.trim()) return;
const payload = { review_id: reviewId, user_id: currentUserId, author_name:
userName, content: reviewReplyText.trim() };
const { data, error } = await
supabase.from('course_review_replies').insert([payload]).select().single();
if (error) return showError('Could not post your reply.', error);
setReviewReplies(previous => [...previous, data]);
setReviewReplyText('');
setReplyingToReviewId(null);
};
const handleSaveReviewReplyEdit = async replyId => {
if (!editingReviewReplyText.trim()) return;
const { data, error } = await
supabase.from('course_review_replies').update({ content:
editingReviewReplyText.trim() }).eq('id', replyId).eq('user_id',
currentUserId).select().single();
if (error) return showError('Could not update your reply.', error);
setReviewReplies(previous => previous.map(reply => (reply.id === replyId ?
data : reply)));
setEditingReviewReplyId(null);
setEditingReviewReplyText('');
};

const handleDeleteReviewReply = async replyId => {

if (!window.confirm('Delete this reply?')) return;
const { error } = await
supabase.from('course_review_replies').delete().eq('id', replyId).eq('user_id',
currentUserId);
if (error) return showError('Could not delete your reply.', error);
setReviewReplies(previous => previous.filter(reply => reply.id !== replyId));
};
const handlePostQuestion = async event => {
event.preventDefault();
if (!newQuestion.title.trim() || !newQuestion.content.trim()) return;
const payload = {
user_id: currentUserId,
major: selectedMajor,
author_name: newQuestion.is_anonymous ? 'Anonymous Student' :
userName,
title: newQuestion.title.trim(),
content: newQuestion.content.trim(),
is_anonymous: newQuestion.is_anonymous
};
if (editingQuestionId) {
const { data, error } = await
supabase.from('major_questions').update(payload).eq('id',
editingQuestionId).eq('user_id', currentUserId).select().single();
if (error) return showError('Could not update your question.', error);
setMajorQuestions(previous => previous.map(question => (question.id ===
editingQuestionId ? data : question)));
setEditingQuestionId(null);
} else {
const { data, error } = await
supabase.from('major_questions').insert([payload]).select().single();
if (error) return showError('Could not post your question.', error);
setMajorQuestions(previous => [data, ...previous]);
}
setNewQuestion(EMPTY_QUESTION);
};
const handleEditQuestion = question => {
setEditingQuestionId(question.id);
setSelectedMajor(question.major);
setNewQuestion({ title: question.title || '', content: question.content || '',
is_anonymous: Boolean(question.is_anonymous) });
window.scrollTo({ top: 0, behavior: 'smooth' });
};
const handleDeleteQuestion = async id => {

if (!window.confirm('Delete this discussion question?')) return;

const { error } = await supabase.from('major_questions').delete().eq('id',
id).eq('user_id', currentUserId);
if (error) return showError('Could not delete your question.', error);
setMajorQuestions(previous => previous.filter(question => question.id !==
id));
setQuestionReplies(previous => previous.filter(reply => reply.question_id !==
id));
};
const handleAddReply = async questionId => {
if (!replyText.trim()) return;
const payload = { question_id: questionId, user_id: currentUserId,
author_name: userName, content: replyText.trim() };
const { data, error } = await
supabase.from('major_question_replies').insert([payload]).select().single();
if (error) return showError('Could not post your reply.', error);
setQuestionReplies(previous => [...previous, data]);
setReplyText('');
setReplyingToQId(null);
};
const handleSaveQuestionReplyEdit = async replyId => {
if (!editingQuestionReplyText.trim()) return;
const { data, error } = await
supabase.from('major_question_replies').update({ content:
editingQuestionReplyText.trim() }).eq('id', replyId).eq('user_id',
currentUserId).select().single();
if (error) return showError('Could not update your reply.', error);
setQuestionReplies(previous => previous.map(reply => (reply.id ===
replyId ? data : reply)));
setEditingQuestionReplyId(null);
setEditingQuestionReplyText('');
};
const handleDeleteQuestionReply = async replyId => {
if (!window.confirm('Delete this reply?')) return;
const { error } = await
supabase.from('major_question_replies').delete().eq('id', replyId).eq('user_id',
currentUserId);
if (error) return showError('Could not delete your reply.', error);
setQuestionReplies(previous => previous.filter(reply => reply.id !== replyId));
};
const handleSaveReminder = async event => {
event.preventDefault();
if (!newReminder.course_code.trim()) return;
if (!isValidCrn(newReminder.crn)) {
alert('CRN must be exactly 5 digits.');
return;
}
if (!isValidMeetingTime(newReminder.meeting_time)) {
alert('Please enter the time like 09:00 AM - 10:00 AM.');
return;
}

const payload = {
user_id: currentUserId,
crn: newReminder.crn.trim(),
course_code: newReminder.course_code.trim().toUpperCase(),

course_name: newReminder.course_name.trim(),
section: newReminder.section.trim(),
professor: newReminder.professor.trim(),
meeting_days: newReminder.meeting_days.trim(),
meeting_time: newReminder.meeting_time.trim(),
is_active: true
};
if (editingReminderId) {
const { data, error } = await
supabase.from('course_reminders').update(payload).eq('id',
editingReminderId).eq('user_id', currentUserId).select().single();
if (error) return showError('Could not update your reminder.', error);
saveSeatAlertType(data.id, seatAlertMode);
setReminders(previous => previous.map(reminder => (reminder.id ===
editingReminderId ? { ...data, alert_type: seatAlertMode } : reminder)));
} else {
const { data, error } = await
supabase.from('course_reminders').insert([payload]).select().single();
if (error) return showError('Could not create your reminder.', error);
saveSeatAlertType(data.id, seatAlertMode);
setReminders(previous => [{ ...data, alert_type: seatAlertMode }, ...previous]);
}
setEditingReminderId(null);
setNewReminder(EMPTY_REMINDER);
setSeatAlertMode('both');
};
const handleEditReminder = reminder => {
setEditingReminderId(reminder.id);
setSeatAlertMode(getSeatAlertType(reminder));
setNewReminder({
crn: reminder.crn || '', course_code: reminder.course_code || '',
course_name: reminder.course_name || '',
section: reminder.section || '', professor: reminder.professor || '',
meeting_days: reminder.meeting_days || '', meeting_time: reminder.meeting_time || ''
});
window.scrollTo({ top: 0, behavior: 'smooth' });
};
const handleDeleteReminder = async id => {
if (!window.confirm('Delete this seat reminder?')) return;
const { error } = await supabase.from('course_reminders').delete().eq('id',
id).eq('user_id', currentUserId);
if (error) return showError('Could not delete your reminder.', error);
removeSavedSeatAlertType(id);
setReminders(previous => previous.filter(reminder => reminder.id !== id));
};
const handleToggleReminder = async reminder => {
const { data, error } = await

supabase.from('course_reminders').update({ is_active: !
reminder.is_active }).eq('id', reminder.id).eq('user_id',
currentUserId).select().single();
if (error) return showError('Could not update reminder status.', error);
setReminders(previous => previous.map(item => (item.id === reminder.id ?
data : item)));
};

const fetchDmInbox = async () => {
if (!currentUserId || dmInboxLoading) return;
setDmInboxLoading(true);
try {
const { data, error } = await supabase
.from('direct_messages')
.select('*')
.or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
.order('created_at', { ascending: false });
if (error) throw error;
const messages = data || [];
setDmInboxMessages(messages);
const otherUserIds = [...new Set(
messages
.map(message =>
message.sender_id === currentUserId
? message.receiver_id
: message.sender_id
)
.filter(Boolean)
)];
if (!otherUserIds.length) {
setDmInboxProfiles({});
setDmInboxLoaded(true);
return;
}
const { data: directoryRows, error: directoryError } = await supabase.rpc(
'get_student_directory_by_ids',
{ user_ids: otherUserIds }
);
if (directoryError) {

console.error('Student directory lookup error:', directoryError);
}
const profileMap = {};
(directoryRows || []).forEach(profile => {
profileMap[profile.id] = {
name: profile.name || profile.email?.split('@')[0] || 'Student',
email: profile.email || ''
};
});
const knownItems = [
...swapPosts,
...reviews,
...majorQuestions,
...reviewReplies,
...questionReplies

];
otherUserIds.forEach(userId => {
if (profileMap[userId]?.name && profileMap[userId].name !== 'Student')
return;
const knownAuthor = knownItems.find(item =>
item?.user_id === userId &&
item?.author_name &&
item.author_name !== 'Student' &&
item.author_name !== 'Anonymous Student'
);
if (knownAuthor) {
profileMap[userId] = {
name: knownAuthor.author_name,
email: profileMap[userId]?.email || ''
};
}
});
setDmInboxProfiles(profileMap);
setDmInboxLoaded(true);
if (activeDmUser?.id && profileMap[activeDmUser.id]) {
setActiveDmUser(previous => previous
?{
...previous,
name: profileMap[previous.id]?.name || previous.name,

email: profileMap[previous.id]?.email || previous.email || ''
}
: previous
);
}
} catch (error) {
console.error(error);
setDmInboxMessages([]);
} finally {
setDmInboxLoading(false);
}
};

const fetchConversation = async () => {
if (!activeDmUser || !currentUserId) return;
setDmLoading(true);
const { data, error } = await supabase
.from('direct_messages')
.select('*')
.or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${activeDmUser.id}),and(sender_id.eq.${activeDmUser.id},receiver_id.eq.${currentUserId})`)

.order('created_at', { ascending: true });
if (error) {
console.error(error);
setDmMessages([]);
} else {
setDmMessages(data || []);
}
setDmLoading(false);
};
const handleSendDirectMessage = async () => {
if (!dmMessage.trim() || !activeDmUser || !currentUserId) return;
const payload = {
sender_id: currentUserId,
receiver_id: activeDmUser.id,
content: `${createDmMetadataMarker({ context: activeDmUser.context,
reply: dmReplyingTo })}${dmMessage.trim()}`
};
const { data, error } = await
supabase.from('direct_messages').insert([payload]).select().single();
if (error) return showError('Could not send your message.', error);
setDmMessages(previous => [...previous, data]);
setDmInboxMessages(previous => [data, ...previous.filter(item => item.id !==
data.id)]);

setDmMessage('');
setDmReplyingTo(null);
setActiveDmMessageMenu(null);
setDmInboxLoaded(true);
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
};
const handleDeleteMessage = async message => {
if (message.sender_id !== currentUserId) return;
const { error } = await supabase.from('direct_messages').delete().eq('id',
message.id).eq('sender_id', currentUserId);
if (error) return showError('Could not delete message.', error);
setDmMessages(previous => previous.filter(item => item.id !==
message.id));

setDmInboxMessages(previous => previous.filter(item => item.id !==
message.id));
};
const selectedMajorQuestions = useMemo(
() => majorQuestions.filter(question => question.major === selectedMajor),
[majorQuestions, selectedMajor]
);
const resolveDmStudent = userId => {
const profile = dmInboxProfiles[userId];
if (profile?.name && profile.name !== 'Student') {
return { name: profile.name, email: profile.email || '' };
}
const knownItems = [
...swapPosts,
...reviews,
...majorQuestions,
...reviewReplies,
...questionReplies

];
const knownAuthor = knownItems.find(item =>
item?.user_id === userId &&
item?.author_name &&
item.author_name !== 'Student' &&
item.author_name !== 'Anonymous Student'
);
if (knownAuthor) {
return {
name: knownAuthor.author_name,
email: profile?.email || ''
};
}
const searchMatch = dmSearchResults.find(item =>
item?.id === userId && item?.name
);
if (searchMatch) {
return {
name: searchMatch.name,
email: searchMatch.email || profile?.email || ''
};
}
return {
name: profile?.name || 'Student',
email: profile?.email || ''
};
};
const dmConversations = useMemo(() => {

const threads = {};
dmInboxMessages.forEach(message => {
const otherUserId = message.sender_id === currentUserId ?
message.receiver_id : message.sender_id;
if (!otherUserId) return;
if (!threads[otherUserId]) {
threads[otherUserId] = { userId: otherUserId, latestMessage: message,
source: null };
}
const parsed = parseDirectMessage(message.content);
if (parsed.source && !threads[otherUserId].source)
threads[otherUserId].source = parsed.source;
});

return Object.values(threads).sort((a, b) => {
const aPinned = pinnedDmUsers.includes(a.userId);
const bPinned = pinnedDmUsers.includes(b.userId);
if (aPinned !== bPinned) return aPinned ? -1 : 1;
return new Date(b.latestMessage.created_at) - new
Date(a.latestMessage.created_at);
});
}, [dmInboxMessages, currentUserId, pinnedDmUsers]);
const myPosts = useMemo(() => {
if (!currentUserId) return [];
const items = [];
swapPosts.filter(post => post.user_id === currentUserId).forEach(post => {
items.push({
id: `swap-${post.id}`,
type: 'Swap Request',
source: 'Course Match & Swap',
tab: 'match',
created_at: post.created_at,
title: `${post.have_course || 'Course'} → ${post.want_course || 'Course'}`,
subtitle: [
post.have_section ? `Have Sec ${post.have_section}` : '',
post.want_section ? `Want Sec ${post.want_section}` : '',
(post.status || 'available').toUpperCase()
].filter(Boolean).join(' · ')
});
});
reviews.filter(review => review.user_id === currentUserId).forEach(review =>
{
items.push({
id: `review-${review.id}`,
type: 'Review',
source: 'Course & Prof Reviews',
tab: 'reviews',

created_at: review.created_at,
title: `${review.course_code || 'Course'}${review.course_name ? ` — ${review.course_name}` : ''}`,
subtitle: [review.professor_name, review.section ? `Sec ${review.section}
` : '', `Rating ${review.rating || '—'}/5`].filter(Boolean).join(' · ')
});
});
majorQuestions.filter(question => question.user_id ===
currentUserId).forEach(question => {

items.push({
id: `question-${question.id}`,
type: 'Question',
source: 'Major Q&A',
tab: 'majorqa',
created_at: question.created_at,
title: question.title || 'Major question',
subtitle: question.major || ''
});
});
reviewReplies.filter(reply => reply.user_id === currentUserId).forEach(reply =>
{
const parent = reviews.find(review => review.id === reply.review_id);
items.push({
id: `review-reply-${reply.id}`,
type: 'Reply',
source: 'Course & Prof Reviews',
tab: 'reviews',
created_at: reply.created_at,
title: parent ? `Reply on ${parent.course_code || 'course review'}` : 'Reply on a course review', subtitle: reply.content || ''
});
});
questionReplies.filter(reply => reply.user_id === currentUserId).forEach(reply => {
const parent = majorQuestions.find(question => question.id ===
reply.question_id);
items.push({
id: `question-reply-${reply.id}`,
type: 'Reply',
source: 'Major Q&A',
tab: 'majorqa',
created_at: reply.created_at,
title: parent ? `Reply on “${parent.title}”` : 'Reply on a Major Q&A post',
subtitle: reply.content || ''
});

});
return items.sort((a, b) => new Date(b.created_at || 0) - new
Date(a.created_at || 0));
}, [currentUserId, swapPosts, reviews, majorQuestions, reviewReplies,
questionReplies]);
return (

<div style={registrationPageShellStyle}>
<div style={registrationContentStyle}>
<div className="stack" style={{ gap: 10 }}>

<h1 style={{
  fontSize: '26px',
  fontWeight: '600',
  color: 'var(--campora-text)',
  margin: 0,
  letterSpacing: '-0.3px',
  lineHeight: 1.2
}}>
Registration
</h1>
<p style={{
  color: 'var(--campora-muted)',
  fontWeight: '600',
  margin: 0,
  fontSize: '13px',
  lineHeight: 1.55,
  maxWidth: '640px'
}}>
Course registration, swaps, reviews, seat alerts, and student guidance.
</p>
</div>
<div
  style={{
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: '10px',
    marginTop: '6px',
    marginBottom: '4px',
    width: '100%',
    maxWidth: '100%',
    background: 'transparent',
    border: 'none',
    boxShadow: 'none',
    overflowX: 'auto',
    overflowY: 'hidden',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'thin',
    paddingBottom: '6px',
    touchAction: 'pan-x'
  }}
>
<TabButton active={activeTab === 'match'} onClick={() =>
setActiveTab('match')} icon={<ArrowLeftRight size={16} />} label="Course
Match & Swap" />
<TabButton active={activeTab === 'reviews'} onClick={() =>
setActiveTab('reviews')} icon={<Star size={16} />} label="Course & Prof
Reviews" />
<TabButton active={activeTab === 'curriculum'} onClick={() =>
setActiveTab('curriculum')} icon={<BookOpen size={16} />}
label="Curriculum" />
<TabButton active={activeTab === 'majorqa'} onClick={() =>
setActiveTab('majorqa')} icon={<MessageSquare size={16} />} label="Major
Q&A" />
<TabButton active={activeTab === 'reminders'} onClick={() =>
setActiveTab('reminders')} icon={<Bell size={16} />} label="Seat Opening
Reminders" />
<TabButton active={activeTab === 'myposts'} onClick={() =>

setActiveTab('myposts')} icon={<UserRound size={16} />} label="My Posts" />
<TabButton
active={activeTab === 'messages'}
onClick={() => {
setActiveTab('messages');
if (!dmInboxLoaded) fetchDmInbox();

}}
icon={<MessageCircle size={16} />}
label="Direct Messages"
/>
</div>
{activeTab === 'match' && (
<div className="stack" style={{ gap: 26 }}>
<div style={{ width: '100%' }}>
<div className="stack" style={{ width: '100%' }}>
<button
  type="button"
  onClick={() => {
    setEditingPostId(null);
    setSearchPref(EMPTY_SWAP);
    setMatchResult(null);
    setMatchFilter('all');
    setIsMatchModalOpen(true);
  }}
  style={{
    width: '100%',
    minHeight: '180px',
    background: 'var(--campora-navy-solid)',
    border: '1.5px solid var(--campora-navy-solid)',
    borderRadius: '24px',
    padding: '30px 32px',
    boxShadow: '0 10px 24px rgba(10, 48, 91, 0.14)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '22px',
    fontFamily: 'inherit',
    textAlign: 'left',
    color: '#FFFFFF'
  }}
>
  <div style={{
    ...heroIconWrap,
    width: 60,
    height: 60,
    borderRadius: 18,
    background: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.20)',
    color: '#FFFFFF'
  }}>
    <ArrowLeftRight size={28} />
  </div>
  <div style={{ flex: 1, minWidth: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
      <h2 style={{ ...heroCardTitle, fontSize: 26, color: '#FFFFFF' }}>Register &amp; Swap</h2>
      <span style={{ ...heroCardPill, background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.18)', color: '#FFFFFF' }}>COURSE MATCH &amp; SWAP</span>
    </div>
    <p style={{
      ...heroCardCopy,
      maxWidth: 900,
      margin: 0,
      color: 'rgba(255,255,255,0.82)',
      fontFamily: 'inherit'
    }}>
      Enter the course you currently have and the course you want. Campora helps you register, compare available options, find reciprocal swap matches, and browse useful alternatives all in one place.
    </p>
  </div>
  <ArrowRight size={24} color="#FFFFFF" style={{ flexShrink: 0 }} />
</button>

</div>
</div>
<div className="stack" style={{ gap: 16 }}>
<h3 style={sectionHeading}>Recent Swap Requests</h3>
{loading ? (
<div style={loadingBox}><RefreshCw size={20} /> Loading...</div>
) : swapPosts.length === 0 ? (
<div
  style={{
    minHeight: '220px',
    background: '#FFFFFF',
    border: '1px solid #E5EAF2',
    borderRadius: '20px',
    boxShadow: '0 6px 18px rgba(11,26,63,0.035)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '14px',
    textAlign: 'center',
    fontFamily: 'inherit'
  }}
>
  <div
    style={{
      width: 68,
      height: 68,
      borderRadius: '50%',
      background: '#FFFFFF',
      border: '1px solid #E3E8F0',
      boxShadow: '0 6px 18px rgba(11,26,63,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#0B1A3F'
    }}
  >
    <ArrowLeftRight size={30} />
  </div>
  <p
    style={{
      margin: 0,
      color: 'var(--campora-text)',
      fontSize: 16,
      fontWeight: 800,
      fontFamily: 'inherit'
    }}
  >
    No swap requests posted yet. Your recent requests will appear here.
  </p>
</div>
):(
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
{swapPosts.map(post => {
const isTaken = post.status === 'taken';
return (

<div key={post.id} style={{
  ...swapCard,
  padding: 0,
  borderRadius: '24px',
  border: '1.5px solid rgba(11,26,63,0.16)',
  boxShadow: '0 10px 26px rgba(11,26,63,0.08)',
  ...(isTaken ? takenSwapCard : {})
}}>
  <div style={{
    height: 1,
    background: '#E8EDF3'
  }} />

  <div style={{ padding: '20px 22px 22px' }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 13px 16px',
      margin: '-4px -4px 18px',
      borderRadius: '15px',
      background: '#FFFFFF',
      border: '1px solid #E8ECF1',
      borderBottom: '1px solid #E8ECF1'
    }}>
      <StudentIdentity
        name={post.author_name}
        isAnonymous={post.is_anonymous}
        clickable={canMessageUser(post.user_id, post.is_anonymous, post.status)}
        onClick={() => openDm(post.user_id, post.author_name,
        post.is_anonymous, post.status, {
          type: 'swap', postId: post.id, label: buildSwapSourceLabel(post)
        })}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          ...(isTaken ? takenStatusBadge : availableStatusBadge),
          padding: '7px 10px',
          borderRadius: 999
        }}>
          {isTaken ? 'TAKEN' : 'AVAILABLE'}
        </span>
        {post.user_id === currentUserId && (
          <OwnerActions
            onEdit={() => handleEditSwap(post)}
            onDelete={() => handleDeleteSwap(post.id)}
          />
        )}
      </div>
    </div>

    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 44px minmax(0, 1fr)',
      alignItems: 'stretch',
      gap: '12px'
    }}>
      <SwapCourseBlock mode="HAVE" post={post} prefix="have" faded={isTaken} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: 'var(--campora-navy)',
          border: '1px solid var(--campora-navy)',
          boxShadow: '0 7px 16px rgba(11,26,63,0.16)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF'
        }}>
          <ArrowRight size={17} />
        </div>
      </div>

      <SwapCourseBlock mode="WANTS" post={post} prefix="want" faded={isTaken} />
    </div>

    {isTaken && (
      <div style={{ ...takenNotice, marginTop: '16px', borderRadius: '14px' }}>
        <CheckCircle2 size={15} />
        This swap has already been taken and is no longer available.
      </div>
    )}

    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '9px',
      flexWrap: 'wrap',
      marginTop: '17px',
      paddingTop: '16px',
      borderTop: '1px solid #E4EAF2'
    }}>
      {!isTaken && canMessageUser(post.user_id, post.is_anonymous, post.status) && (
        <button
          onClick={() => openDm(post.user_id, post.author_name,
          post.is_anonymous, post.status, {
            type: 'swap', postId: post.id, label: buildSwapSourceLabel(post)
          })}
          style={{
            ...dmBtnStyle,
            marginTop: 0,
            borderRadius: 999,
            padding: '9px 14px'
          }}
        >
          <MessageCircle size={15} /> Message Student
        </button>
      )}

      {post.user_id === currentUserId && (
        <button
          onClick={() => handleToggleSwapStatus(post)}
          style={{
            ...(isTaken ? reopenSwapButton : markTakenButton),
            borderRadius: 999,
            padding: '9px 14px',
            fontWeight: 850,
            marginTop: 0
          }}
        >
          {isTaken
            ? <><RotateCcw size={14} /> Make Available Again</>
            : <><CheckCircle2 size={14} /> Mark as Taken</>}
        </button>
      )}
    </div>
  </div>
</div>
);

})}
</div>
)}
</div>
</div>
)}
{activeTab === 'reviews' && (
<div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
<div style={{
  ...sectionTopRow,
  padding: '22px 24px',
  background: '#FFFFFF',
  border: '1px solid #E4EAF2',
  borderRadius: '22px',
  boxShadow: '0 8px 24px rgba(11,26,63,0.045)'
}}>
<div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
  <div style={{
    width: 46, height: 46, borderRadius: 14, background: '#F3F6FA',
    border: '1px solid #E4EAF2', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: 'var(--campora-navy)'
  }}><Star size={21} /></div>
  <div>
    <h3 style={{ ...sectionHeading, marginBottom: '4px' }}>Course &amp; Professor Feedback</h3>
    <p style={{ ...sectionDescription, margin: 0 }}>See the course, professor, schedule, rating, and student experience at a glance.</p>
  </div>
</div>
<button onClick={openCreateReview} style={primaryActionBtn}><Plus
size={18} /> Write Review</button>
</div>
{reviews.length === 0 ? <div style={emptyCard}>No course reviews
yet.</div> : (
<div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
{reviews.map(review => {
const replies = reviewReplies.filter(reply => reply.review_id ===
review.id);
return (
<div key={review.id} style={reviewCard}>
<div style={{ display: 'flex', justifyContent: 'space-between', gap:
'15px', alignItems: 'flex-start' }}>
<StudentIdentity
name={review.author_name}
isAnonymous={review.is_anonymous}
clickable={canMessageUser(review.user_id,
review.is_anonymous)}
onClick={() => openDm(review.user_id, review.author_name,
review.is_anonymous)}
/>
{review.user_id === currentUserId && <OwnerActions onEdit={() =>
handleEditReview(review)} onDelete={() =>
handleDeleteReview(review.id)} />}
</div>
<div style={{
  marginTop: '16px',
  padding: '16px 18px',
  borderRadius: '16px',
  background: '#F8FAFD',
  border: '1px solid #E7ECF3'
}}>
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
  <div>
    <h4 style={{ margin: 0, fontSize: '19px', fontWeight: '900', color:
    'var(--campora-text)' }}>
    {review.course_code}{review.course_name && ` — ${review.course_name}`}
    </h4>
    <p style={{ margin: '4px 0 0', color: 'var(--campora-muted)', fontSize: '11px',
    fontWeight: '700' }}>Posted {formatDate(review.created_at)}</p>
  </div>
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 999, background: '#FFF9F1', border: '1px solid #F2E5CA', color: '#B7791F', fontWeight: 900, fontSize: 12 }}>
    <Star size={14} /> {review.rating}/5
  </div>
</div>
</div>
<div style={courseInfoGrid}>
<InfoItem label="CRN" value={review.crn} />
<InfoItem label="COURSE CODE" value={review.course_code} />
<InfoItem label="COURSE NAME" value={review.course_name} />
<InfoItem label="SECTION" value={review.section} />
<InfoItem label="PROFESSOR" value={review.professor_name} />
<InfoItem label="DAYS" value={review.meeting_days} />
<InfoItem label="TIME" value={review.meeting_time} />
<InfoItem label="SEMESTER" value={review.semester} />
</div>
<div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap',
marginBottom: '15px' }}>
<span style={reviewTag}>★ Rating: {review.rating}/5</span>
<span style={{ ...reviewTag, background: '#FFF6F2', color:
'#D9896A' }}>Difficulty: {review.difficulty}/5</span>
</div>
<p style={bodyText}>{review.comment}</p>
{replies.length > 0 && (
<div style={replySection}>
{replies.map(reply => (
<ReplyCard
key={reply.id}
reply={reply}
currentUserId={currentUserId}
editing={editingReviewReplyId === reply.id}
editingText={editingReviewReplyText}
onEditingTextChange={setEditingReviewReplyText}
onStartEdit={() => { setEditingReviewReplyId(reply.id);
setEditingReviewReplyText(reply.content); }}
onCancelEdit={() => { setEditingReviewReplyId(null);
setEditingReviewReplyText(''); }}
onSaveEdit={() => handleSaveReviewReplyEdit(reply.id)}
onDelete={() => handleDeleteReviewReply(reply.id)}
onMessage={() => openDm(reply.user_id, reply.author_name)}
/>
))}
</div>
)}

<div style={{ marginTop: '14px' }}>
{replyingToReviewId === review.id ? (
<ReplyComposer
value={reviewReplyText}

onChange={setReviewReplyText}
placeholder="Reply to this review..."
onSubmit={() => handleAddReviewReply(review.id)}
onCancel={() => { setReplyingToReviewId(null);
setReviewReplyText(''); }}
/>
):(
<button onClick={() => setReplyingToReviewId(review.id)}
style={replyButton}><CornerDownRight size={14} /> Reply</button>
)}
</div>
</div>
);
})}
</div>
)}
</div>
)}
{activeTab === 'curriculum' && (
<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
  <div style={{
    background: '#FFFFFF',
    border: '1px solid #E4EAF2',
    borderRadius: '24px',
    boxShadow: '0 10px 28px rgba(11,26,63,0.05)',
    overflow: 'hidden'
  }}>
    <div style={{
      padding: '24px 26px',
      background: 'linear-gradient(135deg, #0B1A3F 0%, #173B68 100%)',
      color: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{
        width: 50, height: 50, borderRadius: 15,
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}><BookOpen size={23} /></div>
      <div>
        <h3 style={{ margin: 0, fontSize: 21, fontWeight: 900, color: '#FFFFFF' }}>Curriculum</h3>
        <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.76)', fontSize: 12, fontWeight: 650 }}>
          Pick your major and keep the curriculum in one clean place.
        </p>
      </div>
    </div>

    <div style={{ padding: '24px 26px 26px' }}>
      <label style={fieldLabel}>SELECT MAJOR</label>
      <select value={selectedMajor} onChange={event =>
      setSelectedMajor(event.target.value)} style={{ ...selectInputStyle, minHeight: 46 }}>
        {MAJORS.map(major => <option key={major} value={major}>{major}</option>)}
      </select>

      <div style={{
        marginTop: '20px',
        padding: '34px 24px',
        border: '1px solid #E5EAF2',
        borderRadius: '20px',
        background: '#FFFFFF',
        textAlign: 'center',
        boxShadow: '0 8px 22px rgba(11,26,63,0.045)'
      }}>
        <div style={{
          width: 62, height: 62, borderRadius: 18, margin: '0 auto',
          background: '#FFFFFF', border: '1px solid #E2E8F0',
          boxShadow: '0 8px 18px rgba(11,26,63,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--campora-navy)'
        }}>
          <GraduationCap size={29} />
        </div>
        <h4 style={{ margin: '14px 0 5px', fontSize: '18px', fontWeight: '900',
        color: 'var(--campora-text)' }}>{selectedMajor} Curriculum</h4>
        <p style={{ margin: 0, color: 'var(--campora-muted)', fontWeight: '700', fontSize:
        '13px' }}>The official curriculum will appear here once uploaded.</p>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: '#FFFFFF', border: '1px solid #E2E8F0', fontSize: 10, fontWeight: 850, color: 'var(--campora-muted)' }}>REQUIREMENTS</span>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: '#FFFFFF', border: '1px solid #E2E8F0', fontSize: 10, fontWeight: 850, color: 'var(--campora-muted)' }}>COURSE PLAN</span>
        </div>
      </div>
    </div>
  </div>
</div>
)}

{activeTab === 'majorqa' && (
<div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
<div style={{
  ...reviewCard,
  padding: 0
}}>
<div style={{
  padding: '22px 24px',
  background: '#F8FAFD',
  borderBottom: '1px solid #E7ECF3',
  display: 'flex',
  alignItems: 'center',
  gap: '14px'
}}>
  <div style={{
    width: 46, height: 46, borderRadius: 14, background: '#FFFFFF',
    border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: 'var(--campora-navy)'
  }}><MessageSquare size={21} /></div>
  <div>
    <h3 style={{ ...sectionHeading, marginBottom: '3px' }}>Major Q&amp;A &amp; Student Advice</h3>
    <p style={{ ...sectionDescription, margin: 0 }}>Questions and advice are easier to scan by major.</p>
  </div>
</div>
<div style={{ padding: '20px 24px 24px' }}>
<label style={fieldLabel}>SELECT MAJOR</label>
<select
value={selectedMajor}
onChange={event => { setSelectedMajor(event.target.value);
setEditingQuestionId(null); setNewQuestion(EMPTY_QUESTION); }}
style={selectInputStyle}
>
{MAJORS.map(major => <option key={major} value={major}>{major}</option>)}
</select>
</div>
</div>
<form onSubmit={handlePostQuestion} style={{
  ...reviewCard,
  background: '#FFFFFF',
  border: '1px solid #E4EAF2'
}}>
<h4 style={{ margin: '0 0 14px', color: 'var(--campora-text)', fontWeight: '900' }}>
{editingQuestionId ? 'Edit Question' : `Ask about ${selectedMajor}`}
</h4>
<input type="text" placeholder="Question title" required
style={{ ...modalInput, marginBottom: '10px' }} value={newQuestion.title}
onChange={event => setNewQuestion({ ...newQuestion, title:
event.target.value })} />
<textarea
placeholder="Write your question or explain what advice you need..."
required
style={{
  ...modalInput,
  height: '110px',
  minHeight: '110px',
  resize: 'vertical',
  marginBottom: '12px',
  borderRadius: '14px',
  padding: '14px 15px',
  lineHeight: 1.5
}}
value={newQuestion.content}
onChange={event =>
  setNewQuestion({
    ...newQuestion,
    content: event.target.value
  })
}
/>
<div style={formBottomRow}>
<label style={checkboxLabel}><input type="checkbox"
checked={newQuestion.is_anonymous} onChange={event =>
setNewQuestion({ ...newQuestion, is_anonymous: event.target.checked })} />
Post anonymously</label>
<div style={{ display: 'flex', gap: '8px' }}>
{editingQuestionId && <button type="button"
style={secondaryActionBtn} onClick={() => { setEditingQuestionId(null);
setNewQuestion(EMPTY_QUESTION); }}>Cancel</button>}
<button type="submit" style={primaryActionBtn}>{editingQuestionId ?
'Save Changes' : 'Post Question'}</button>
</div>
</div>
</form>
{selectedMajorQuestions.length === 0 ? <div style={emptyCard}>No

questions yet for {selectedMajor}.</div> :
selectedMajorQuestions.map(question => {
const replies = questionReplies.filter(reply => reply.question_id ===
question.id);
return (
<div key={question.id} style={reviewCard}>
<div style={{ display: 'flex', justifyContent: 'space-between',

alignItems: 'flex-start', gap: '12px' }}>
<StudentIdentity
name={question.author_name}
isAnonymous={question.is_anonymous}
clickable={canMessageUser(question.user_id,
question.is_anonymous)}
onClick={() => openDm(question.user_id, question.author_name,
question.is_anonymous)}
/>
{question.user_id === currentUserId && <OwnerActions onEdit={() =>
handleEditQuestion(question)} onDelete={() =>
handleDeleteQuestion(question.id)} />}
</div>
<div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 9 }}>
  <span style={{ padding: '5px 9px', borderRadius: 999, background: '#F3F6FA', border: '1px solid #E3E9F2', color: 'var(--campora-navy)', fontSize: 9, fontWeight: 900, letterSpacing: '.04em' }}>QUESTION</span>
</div>
<h4 style={{ margin: '9px 0 5px', color: 'var(--campora-text)', fontWeight: '900',
fontSize: '17px', lineHeight: 1.35 }}>{question.title}</h4>
<p style={{ margin: '0 0 12px', fontSize: '11px', color: 'var(--campora-muted)',
fontWeight: '700' }}>{formatDate(question.created_at)}</p>
<p style={bodyText}>{question.content}</p>
{replies.length > 0 && (
<div style={replySection}>
{replies.map(reply => (
<ReplyCard
key={reply.id}
reply={reply}
currentUserId={currentUserId}
editing={editingQuestionReplyId === reply.id}
editingText={editingQuestionReplyText}
onEditingTextChange={setEditingQuestionReplyText}
onStartEdit={() => { setEditingQuestionReplyId(reply.id);
setEditingQuestionReplyText(reply.content); }}
onCancelEdit={() => { setEditingQuestionReplyId(null);
setEditingQuestionReplyText(''); }}
onSaveEdit={() => handleSaveQuestionReplyEdit(reply.id)}
onDelete={() => handleDeleteQuestionReply(reply.id)}
onMessage={() => openDm(reply.user_id, reply.author_name)}
/>
))}
</div>
)}

<div style={{ marginTop: '14px' }}>
{replyingToQId === question.id ? (
<ReplyComposer value={replyText} onChange={setReplyText}
placeholder="Write your reply..." onSubmit={() =>
handleAddReply(question.id)} onCancel={() => { setReplyingToQId(null);
setReplyText(''); }} />
):(

<button style={replyButton} onClick={() =>
setReplyingToQId(question.id)}><CornerDownRight size={14} /> Reply to
Student</button>
)}
</div>
</div>
);
})}
</div>
)}
{activeTab === 'reminders' && (
<div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
  <div style={{
    background: '#FFFFFF',
    border: '1px solid #E3E9F2',
    borderRadius: '24px',
    boxShadow: '0 10px 28px rgba(11,26,63,0.05)',
    overflow: 'hidden'
  }}>
    <div style={{
      padding: '23px 25px',
      background: '#F8FAFD',
      borderBottom: '1px solid #E6EBF3',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 15, background: '#0B1A3F',
          color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 7px 16px rgba(11,26,63,.14)'
        }}><Bell size={21} /></div>
        <div>
          <h3 style={{ ...sectionHeading, marginBottom: 3 }}>Seat Opening Alert</h3>
          <p style={{ ...sectionDescription, margin: 0 }}>Add the course once and Campora keeps it in your seat-alert list.</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px',
          borderRadius: 999, background: '#F7F4FC', border: '1px solid #E7E0F2',
          color: '#8B78B8', fontSize: 10, fontWeight: 900
        }}><AlarmClock size={13} /> REMINDER</span>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px',
          borderRadius: 999, background: '#F3F7FD', border: '1px solid #DDE7F5',
          color: '#648CCB', fontSize: 10, fontWeight: 900
        }}><Bell size={13} /> NOTIFICATION</span>
      </div>
    </div>

    <form onSubmit={handleSaveReminder} style={{ ...reminderFormGrid, padding: '24px 25px 25px' }}>
      <div style={{ gridColumn: '1 / -1' }}>
        <div
          style={{
            fontSize: '9px',
            fontWeight: '900',
            letterSpacing: '0.08em',
            color: '#94A3B8',
            marginBottom: '9px'
          }}
        >
          ALERT
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '8px'
          }}
        >
          {[
            {
              value: 'notification',
              label: 'Notification',
              icon: Bell,
              color: '#648CCB',
              soft: '#F3F7FD',
              border: '#DDE7F5'
            },
            {
              value: 'reminder',
              label: 'Reminder',
              icon: AlarmClock,
              color: '#8B78B8',
              soft: '#F7F4FC',
              border: '#E7E0F2'
            },
            {
              value: 'both',
              label: 'Both',
              icon: Bell,
              color: '#0B1A3F',
              soft: '#F4F6FA',
              border: '#DCE2EC'
            }
          ].map(option => {
            const AlertIcon = option.icon;
            const active = seatAlertMode === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSeatAlertMode(option.value)}
                style={{
                  minHeight: '43px',
                  borderRadius: '10px',
                  border: active
                    ? `1.5px solid ${option.color}`
                    : `1px solid ${option.border}`,
                  background: active
                    ? option.color
                    : option.soft,
                  color: active
                    ? '#FFFFFF'
                    : option.color,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '10px',
                  fontWeight: '900'
                }}
              >
                <AlertIcon size={14} />
                {option.label}
              </button>
            );
          })}
        </div>

        <div
          style={{
            marginTop: '9px',
            color:
              seatAlertMode === 'both'
                ? '#0B1A3F'
                : seatAlertMode === 'reminder'
                ? '#8B78B8'
                : '#648CCB',
            fontSize: '10px',
            fontWeight: '800',
            lineHeight: 1.45
          }}
        >
          {seatAlertMode === 'both'
            ? 'This seat opening will appear as both a Notification and a Reminder.'
            : seatAlertMode === 'reminder'
            ? 'This seat opening will appear under Reminders in Notifications & Reminders.'
            : 'This seat opening will be added to the Notifications section.'}
        </div>
      </div>
      <CrnInput
        placeholder="CRN"
        value={newReminder.crn}
        onChange={value => setNewReminder({ ...newReminder, crn: value })}
      />
      <input type="text" required placeholder="Course Code"
      style={modalInput} value={newReminder.course_code} onChange={event =>
      setNewReminder({ ...newReminder, course_code: event.target.value })} />
      <input type="text" placeholder="Course Name" style={modalInput}
      value={newReminder.course_name} onChange={event =>
      setNewReminder({ ...newReminder, course_name: event.target.value })} />
      <input type="text" placeholder="Section" style={modalInput}
      value={newReminder.section} onChange={event =>
      setNewReminder({ ...newReminder, section: event.target.value })} />
      <input type="text" placeholder="Professor" style={modalInput}
      value={newReminder.professor} onChange={event =>
      setNewReminder({ ...newReminder, professor: event.target.value })} />
      <ScheduleTypePicker
        value={newReminder.meeting_days}
        onChange={value => setNewReminder({ ...newReminder, meeting_days: value })}
      />
      <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
        <EditablePresetTimeInput
          value={newReminder.meeting_time}
          onChange={value => setNewReminder({ ...newReminder, meeting_time: value })}
        />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {editingReminderId && <button type="button"
        style={{ ...secondaryActionBtn, flex: 1 }} onClick={() =>
        { setEditingReminderId(null); setNewReminder(EMPTY_REMINDER); setSeatAlertMode('both'); }}
        >Cancel</button>}
        <button type="submit" style={{ ...primaryActionBtn, flex: 1,
        justifyContent: 'center', minHeight: 44 }}><Bell size={16} /> {editingReminderId ? 'Update Alert' : 'Add Seat Alert'}</button>
      </div>
    </form>
  </div>

  <div>
    <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
      <div>
        <h3 style={{ ...sectionHeading, marginBottom: 3 }}>Your Seat Alerts</h3>
        <p style={{ ...sectionDescription, margin: 0 }}>Every active seat alert is set up as both a reminder and a notification.</p>
      </div>
    </div>

    {reminders.length === 0 ? <div style={emptyCard}>You have no seat alerts yet.</div> : (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
      {reminders.map(reminder => (
      <div key={reminder.id} style={{
        ...swapCard,
        padding: 0
      }}>
        <div style={{ height: 5, background: reminder.is_active ? '#0B1A3F' : '#CBD5E1' }} />
        <div style={{ padding: '19px 20px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '11px', alignItems: 'center' }}>
              <div style={{
                ...bellCircle,
                width: 42, height: 42, background: '#F3F6FA',
                border: '1px solid #E2E8F0', color: 'var(--campora-navy)'
              }}><Bell size={18} /></div>
              <div>
                <h4 style={{ margin: 0, color: 'var(--campora-text)', fontWeight: '900',
                fontSize: '17px' }}>{reminder.course_code}</h4>
                {reminder.course_name && <p style={{ margin: '3px 0 0', color:
                'var(--campora-body)', fontWeight: '700', fontSize: '12px' }}>{reminder.course_name}</p>}
              </div>
            </div>
            <OwnerActions onEdit={() => handleEditReminder(reminder)}
            onDelete={() => handleDeleteReminder(reminder.id)} />
          </div>

          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 14 }}>
            {(getSeatAlertType(reminder) === 'reminder' || getSeatAlertType(reminder) === 'both') && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 9px', borderRadius: 999, background: '#F7F4FC', border: '1px solid #E7E0F2', fontSize: 9, fontWeight: 900, color: '#8B78B8' }}>
                <AlarmClock size={12} /> REMINDER
              </span>
            )}
            {(getSeatAlertType(reminder) === 'notification' || getSeatAlertType(reminder) === 'both') && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 9px', borderRadius: 999, background: '#F3F7FD', border: '1px solid #DDE7F5', fontSize: 9, fontWeight: 900, color: '#648CCB' }}>
                <Bell size={12} /> NOTIFICATION
              </span>
            )}
          </div>

          <div style={{ ...courseInfoGrid, marginTop: '15px' }}>
            <InfoItem label="CRN" value={reminder.crn} />
            <InfoItem label="SECTION" value={reminder.section} />
            <InfoItem label="PROFESSOR" value={reminder.professor} />
            <InfoItem label="SCHEDULE / TYPE" value={reminder.meeting_days} />
            <InfoItem label="TIME" value={reminder.meeting_time} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', gap: '10px' }}>
            <span style={reminder.is_active ? badgeGreen : badgeGray}
            >{reminder.is_active ? 'MONITORING' : 'PAUSED'}</span>
            <button onClick={() => handleToggleReminder(reminder)}
            style={{ ...smallOutlineBtn, borderRadius: 999, padding: '8px 12px' }}>
              {reminder.is_active ? 'Pause Alert' : 'Resume Alert'}
            </button>
          </div>
        </div>
      </div>
      ))}
    </div>
    )}
  </div>

  <div style={{
    ...infoNotice,
    padding: '16px 18px',
    borderRadius: 18,
    background: '#F8FAFD'
  }}>
    <div style={{ display: 'flex', gap: 8 }}>
      <AlarmClock size={18} color="var(--campora-navy)" />
      <Bell size={18} color="var(--campora-navy)" />
    </div>
    <div>
      <strong>Reminder + notification</strong>
      <p style={{ margin: '3px 0 0', fontSize: '12px', lineHeight: 1.5, color:
      'var(--campora-muted)' }}>
        Seat alerts are shown as both reminders and notifications. Live seat-opening detection still requires a connection to the university's course availability data.
      </p>
    </div>
  </div>
</div>
)}

{activeTab === 'myposts' && (
<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
<div>
<h3 style={sectionHeading}>My Posts</h3>
<p style={sectionDescription}>
Everything you have posted in the Registration Hub, with the section it
came from.
</p>
</div>
{loading ? (
<div style={loadingBox}><RefreshCw size={18} /> Loading your
posts...</div>
) : myPosts.length === 0 ? (
<div style={emptyCard}>You have not posted anything in the
Registration Hub yet.</div>
):(
<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
{myPosts.map(item => (
<button key={item.id} type="button" onClick={() =>
setActiveTab(item.tab)} style={myPostCard}>
<div style={{ display: 'flex', justifyContent: 'space-between',
alignItems: 'flex-start', gap: '14px' }}>
<div style={{ minWidth: 0 }}>
<div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap',
marginBottom: '9px' }}>
<span style={myPostSourceBadge}>{item.source}</span>
<span style={myPostTypeBadge}>{item.type}</span>
</div>
<h4 style={{ margin: 0, color: 'var(--campora-text)', fontSize: '15px',
fontWeight: '900' }}>{item.title}</h4>
{item.subtitle && <p style={myPostSubtitle}>{item.subtitle}</p>}

</div>
<div style={{ textAlign: 'right', flexShrink: 0 }}>
<span style={{ fontSize: '10px', color: 'var(--campora-muted)', fontWeight:
'700' }}>{formatDate(item.created_at)}</span>
<div style={{ marginTop: '8px', color: 'var(--campora-muted)', display: 'flex',
justifyContent: 'flex-end' }}><ArrowRight size={16} /></div>
</div>
</div>
</button>
))}
</div>

)}
</div>
)}
{activeTab === 'messages' && (
<div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
 <div>
   <h3 style={sectionHeading}>Direct Messages</h3>
   <p style={sectionDescription}>
    Search for a student by name or email, then keep all of your
    conversations in one place.
   </p>
 </div>

 <div
  style={{
    display: 'grid',
    gridTemplateColumns: '390px minmax(0, 1fr)',
    minHeight: '700px',
    height: '76vh',
    maxHeight: '880px',
    background: 'var(--surface-container-lowest)',
    border: '1.5px solid var(--divider)',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,45,98,0.07)'
  }}
 >
  {/* LEFT: INBOX */}
  <aside
    style={{
     minWidth: 0,
     display: 'flex',
     flexDirection: 'column',
     borderRight: '1px solid var(--divider)',
     background: 'var(--surface-container-lowest)'
    }}
  >
    <div
     style={{
       padding: '22px 20px 14px',
       display: 'flex',
       justifyContent: 'space-between',
       alignItems: 'center',
       gap: '10px'
     }}
    >
     <div>

  <h4
   style={{
     margin: 0,
     color: 'var(--campora-text)',
     fontSize: '20px',
     fontWeight: '900'
   }}
  >
   Messages
  </h4>
  <p
   style={{
     margin: '3px 0 0',
     color: 'var(--campora-muted)',
     fontSize: '11px',
     fontWeight: '700'
   }}
  >
   Your conversations
  </p>
 </div>

 <MessageCircle size={20} color="#0F7490" />
</div>

{/* SEARCH */}
<div style={{ padding: '0 16px 14px' }}>
  <div
   style={{
    minHeight: '48px',
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    padding: '0 13px',
    background: '#FAFBFC',
    border: '1.5px solid var(--divider)',
    borderRadius: '15px'
   }}
  >
   <Search size={17} color="#0F7490" />

  <input
   type="text"
   value={dmSearchQuery}
   onChange={event => setDmSearchQuery(event.target.value)}
   placeholder="Search name or email"
   style={{

     flex: 1,
     minWidth: 0,
     border: 'none',
     outline: 'none',
     background: 'transparent',
     color: 'var(--campora-text)',
     fontSize: '12px',
     fontWeight: '800',
     fontFamily: 'inherit'
    }}
  />
 </div>
</div>

{/* SEARCH RESULTS */}
{dmSearchQuery.trim() && (
  <div
   style={{
     margin: '0 14px 12px',
     padding: '6px',
     borderRadius: '999px',
     border: '1px solid var(--divider)',
     background: 'var(--surface-container-lowest)',
     maxHeight: '220px',
     overflowY: 'auto'
   }}
  >
   {dmSearchLoading ? (
     <div style={dmSearchStatus}>Searching students...</div>
   ) : dmSearchResults.length === 0 ? (
     <div style={dmSearchStatus}>No students found.</div>
   ):(
     dmSearchResults.map(profile => {
       const resultName =
        profile.name ||
        profile.email?.split('@')[0] ||
        'Student';

    return (
     <button
       key={profile.id}
       type="button"
       onClick={() => {
        setDmInboxProfiles(previous => ({
         ...previous,
         [profile.id]: {
           name: resultName,

     email: profile.email || ''
   }
  }));

  openDm(profile.id, resultName);
 }}
 style={{
  width: '100%',
  border: 'none',
  background: 'var(--surface-container-lowest)',
  borderRadius: '11px',
  padding: '10px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  textAlign: 'left',
  cursor: 'pointer',
  fontFamily: 'inherit'
 }}
>
 <div
  style={{
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: getAvatarColor(resultName),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--campora-text)',
    fontSize: '11px',
    fontWeight: '900',
    flexShrink: 0
  }}
 >
  {getInitials(resultName)}
 </div>

 <div style={{ minWidth: 0, flex: 1 }}>
  <div
   style={{
    color: 'var(--campora-text)',
    fontSize: '12px',
    fontWeight: '900',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'

          }}
         >
          {resultName}
         </div>

          <div
           style={{
             marginTop: '2px',
             color: 'var(--campora-muted)',
             fontSize: '10px',
             fontWeight: '700',
             overflow: 'hidden',
             textOverflow: 'ellipsis',
             whiteSpace: 'nowrap'
           }}
          >
           {profile.email || 'Student'}
          </div>
         </div>
        </button>
      );
    })
   )}
 </div>
)}

{/* CONVERSATIONS */}
<div
  style={{
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '4px 10px 14px'
  }}
>
  {dmInboxLoading ? (
    <div style={dmSearchStatus}>Loading conversations...</div>
  ) : dmConversations.length === 0 ? (
    <div
      style={{
       padding: '28px 16px',
       textAlign: 'center',
       color: 'var(--campora-muted)',
       fontSize: '11px',
       fontWeight: '800'
      }}
    >

  No conversations yet.
 </div>
):(
 dmConversations.map(conversation => {
  const parsedLatest = parseDirectMessage(
    conversation.latestMessage?.content
  );

  const otherProfile = resolveDmStudent(
    conversation.userId
  );

  const otherName =
   otherProfile?.name || 'Student';

  const selected =
   activeDmUser?.id === conversation.userId;

  return (
   <div
     key={conversation.userId}
     style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 6px',
      borderRadius: '16px',
      background: selected
        ? '#FBFCFE'
        : 'transparent',
      boxSizing: 'border-box'
     }}
   >
     <button
      type="button"
      onClick={() =>
        openDm(
          conversation.userId,
          otherName,
          false,
          'available',
          conversation.source
            ?{
              type: conversation.source.type,
              postId: conversation.source.postId,
              label: conversation.source.label

        }
      : null
  )
 }
 style={{
   flex: 1,
   minWidth: 0,
   border: 'none',
   background: 'transparent',
   borderRadius: '15px',
   padding: '11px 8px',
   display: 'flex',
   alignItems: 'center',
   gap: '10px',
   cursor: 'pointer',
   textAlign: 'left',
   fontFamily: 'inherit'
 }}
>
 <div
   style={{
     width: '42px',
     height: '42px',
     borderRadius: '50%',
     background: getAvatarColor(otherName),
     display: 'flex',
     alignItems: 'center',
     justifyContent: 'center',
     color: 'var(--campora-text)',
     fontSize: '11px',
     fontWeight: '900',
     flexShrink: 0
   }}
 >
   {getInitials(otherName)}
 </div>

 <div style={{ minWidth: 0, flex: 1 }}>
  <div
   style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px'
   }}
  >
   <span

  style={{
   color: 'var(--campora-text)',
   fontSize: '12px',
   fontWeight: '900',
   overflow: 'hidden',
   textOverflow: 'ellipsis',
   whiteSpace: 'nowrap'
  }}
 >
  {otherName}
 </span>

 <span
  style={{
    color: 'var(--campora-muted)',
    fontSize: '9px',
    fontWeight: '700',
    flexShrink: 0
  }}
 >
  {formatDate(
    conversation.latestMessage?.created_at
  )}
 </span>
</div>

{otherProfile?.email && (
 <div
   style={{
    marginTop: '2px',
    color: 'var(--campora-muted)',
    fontSize: '9px',
    fontWeight: '700',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
   }}
 >
   {otherProfile.email}
 </div>
)}

<div
 style={{
  marginTop: '3px',
  color: 'var(--campora-muted)',
  fontSize: '10px',

              fontWeight: '700',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
           >
            {parsedLatest?.text || 'Message'}
           </div>
          </div>
         </button>

          <button
           type="button"
           onClick={() =>
             togglePinDmUser(conversation.userId)
           }
           title={
             (Array.isArray(pinnedDmUsers) ? pinnedDmUsers :
[]).includes(conversation.userId)
               ? 'Unpin conversation'
               : 'Pin conversation'
           }
           style={{
             width: '34px',
             height: '34px',
             flexShrink: 0,
             border: 'none',
             borderRadius: '10px',
             background: 'transparent',
             color: (Array.isArray(pinnedDmUsers)
               ? pinnedDmUsers
               : []
             ).includes(conversation.userId)
               ? '#C99758'
               : 'var(--campora-muted)',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             cursor: 'pointer'
           }}
          >
           <Pin
             size={14}
             fill={
               (Array.isArray(pinnedDmUsers) ? pinnedDmUsers :
[]).includes(conversation.userId)
                 ? '#C99758'

            : 'none'
           }
         />
        </button>
       </div>
     );
   })
  )}
 </div>
</aside>

{/* RIGHT: CHAT */}
<section
  style={{
    minWidth: 0,
    minHeight: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--surface-container-lowest)'
  }}
>
  {!activeDmUser ? (
    <div
      style={{
       flex: 1,
       display: 'flex',
       flexDirection: 'column',
       alignItems: 'center',
       justifyContent: 'center',
       padding: '30px',
       textAlign: 'center'
      }}
    >
      <div
       style={{
         width: '62px',
         height: '62px',
         borderRadius: '50%',
         background: 'var(--surface-container-lowest)',
         border: '2px solid var(--campora-navy)',
         color: 'var(--campora-text)',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         marginBottom: '14px'
       }}

  >
   <MessageCircle size={28} />
  </div>

  <h4
   style={{
    margin: 0,
    color: 'var(--campora-text)',
    fontSize: '18px',
    fontWeight: '900'
   }}
  >
   Your messages
  </h4>

  <p
    style={{
     maxWidth: '330px',
     margin: '7px 0 0',
     color: 'var(--campora-muted)',
     fontSize: '12px',
     fontWeight: '700',
     lineHeight: 1.5
    }}
  >
    Select a conversation on the left or search for a
    student to start chatting.
  </p>
 </div>
):(
 <>
  {/* CHAT HEADER */}
  <div
    style={{
     padding: '16px 20px',
     minHeight: '70px',
     borderBottom: '1px solid var(--divider)',
     display: 'flex',
     alignItems: 'center',
     justifyContent: 'space-between',
     gap: '12px',
     flexShrink: 0
    }}
  >
    <div
     style={{
       display: 'flex',

  alignItems: 'center',
  gap: '11px',
  minWidth: 0
 }}
>
 <div
  style={{
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: getAvatarColor(activeDmUser.name),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--campora-text)',
    fontWeight: '900',
    fontSize: '12px',
    flexShrink: 0
  }}
 >
  {getInitials(activeDmUser.name)}
 </div>

 <div style={{ minWidth: 0 }}>
  <div
   style={{
    color: 'var(--campora-text)',
    fontSize: '14px',
    fontWeight: '900',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
   }}
  >
   {activeDmUser.name}
  </div>

  <div
   style={{
    marginTop: '2px',
    color: 'var(--campora-muted)',
    fontSize: '10px',
    fontWeight: '700',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
   }}

        >
          {activeDmUser.email || 'Student'}
        </div>
       </div>
      </div>

        <button
         type="button"
         onClick={() =>
           togglePinDmUser(activeDmUser.id)
         }
         title={
           (Array.isArray(pinnedDmUsers) ? pinnedDmUsers :
[]).includes(activeDmUser.id)
             ? 'Unpin conversation'
             : 'Pin conversation'
         }
         style={{
           width: '38px',
           height: '38px',
           borderRadius: '11px',
           border: '1px solid var(--divider)',
           background: (Array.isArray(pinnedDmUsers) ? pinnedDmUsers :
[]).includes(activeDmUser.id)
             ? '#FFF9F1'
             : 'var(--surface-container-lowest)',
           color: (Array.isArray(pinnedDmUsers) ? pinnedDmUsers :
[]).includes(activeDmUser.id)
             ? '#C99758'
             : 'var(--campora-muted)',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           cursor: 'pointer'
         }}
        >
         <Pin
           size={16}
           fill={
             (Array.isArray(pinnedDmUsers) ? pinnedDmUsers :
[]).includes(activeDmUser.id)
               ? '#C99758'
               : 'none'
           }
         />
        </button>
       </div>

{activeDmUser.context?.type === 'swap' && (
 <div
   style={{
    padding: '9px 20px',
    background: '#F0ECFF',
    color: '#6C63FF',
    borderBottom: '1px solid #DDD6FE',
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    fontSize: '10px',
    fontWeight: '900',
    flexShrink: 0
   }}
 >
   <ArrowLeftRight size={14} />
   <span>
    From swap request: {activeDmUser.context.label}
   </span>
 </div>
)}

{/* PINNED MESSAGES */}
{(pinnedDmMessages[activeDmUser.id] || []).length >
  0 && (
  <div
   style={{
    padding: '10px 16px',
    background: '#FFF9F1',
    borderBottom: '1px solid #C99758',
    flexShrink: 0
   }}
  >
   <div
    style={{
      color: '#C99758',
      fontSize: '10px',
      fontWeight: '900',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      marginBottom: '7px'
    }}
   >
    <Pin size={12} fill="#C99758" />
    PINNED MESSAGES

</div>

<div
 style={{
  display: 'flex',
  gap: '8px',
  overflowX: 'auto'
 }}
>
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
    <div
      key={pinnedId}
      style={{
       minWidth: '200px',
       maxWidth: '280px',
       display: 'flex',
       justifyContent: 'space-between',
       alignItems: 'center',
       gap: '8px',
       padding: '8px 9px',
       borderRadius: '10px',
       background: 'var(--surface-container-lowest)',
       border: '1px solid #C99758'
      }}
    >
      <div
       style={{
         minWidth: 0,
         color: 'var(--campora-text)',
         fontSize: '10px',
         fontWeight: '800',
         overflow: 'hidden',
         textOverflow: 'ellipsis',
         whiteSpace: 'nowrap'
       }}

        >
         {parsedPinned?.text || 'Message'}
        </div>

         <button
          type="button"
          onClick={() =>
            togglePinDmMessage(pinnedId)
          }
          style={{
            border: 'none',
            background: 'transparent',
            color: '#C99758',
            cursor: 'pointer',
            display: 'flex',
            flexShrink: 0
          }}
         >
          <X size={13} />
         </button>
        </div>
      );
     }
    )}
   </div>
 </div>
)}

{/* CHAT HISTORY */}
<div
  ref={dmChatHistoryRef}
  style={{
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '18px 20px',
    background: '#FBFCFE'
  }}
>
  {dmLoading ? (
    <div style={loadingBox}>
      Loading conversation...
    </div>
  ) : dmMessages.length === 0 ? (
    <div
      style={{
       padding: '28px',

    textAlign: 'center',
    color: 'var(--campora-muted)',
    fontSize: '11px',
    fontWeight: '800'
  }}
 >
  No messages yet. Say hi.
 </div>
):(
 dmMessages.map(message => {
  const mine =
    message.sender_id === currentUserId;

  const parsed = parseDirectMessage(
    message.content
  );

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
      justifyContent: mine
        ? 'flex-end'
        : 'flex-start',
      marginBottom: '14px'
     }}
   >
     <div
      style={{
        width: 'fit-content',
        maxWidth: '76%',
        position: 'relative'
      }}
     >
      <div
        style={{
          padding: '10px 12px',
          borderRadius: mine
            ? '16px 16px 4px 16px'

    : '16px 16px 16px 4px',
  background: mine
    ? 'var(--campora-navy)'
    : 'var(--surface-container-lowest)',
  color: mine
    ? 'var(--surface-container-lowest)'
    : 'var(--campora-navy)',
  border: mine
    ? '1px solid var(--campora-navy)'
    : '1px solid var(--divider)',
  boxShadow:
    '0 2px 8px rgba(0,45,98,0.05)'
 }}
>
 {parsed?.source?.type === 'swap' && (
  <div
    style={{
      marginBottom: '6px',
      paddingBottom: '6px',
      borderBottom: mine
        ? '1px solid rgba(255,255,255,0.18)'
        : '1px solid var(--divider)',
      fontSize: '9px',
      fontWeight: '800',
      opacity: 0.8
    }}
  >
    From swap request:{' '}
    {parsed.source.label ||
      'Course Swap'}
  </div>
 )}

 {parsed?.reply && (
  <div
   style={{
    marginBottom: '7px',
    padding: '7px 8px',
    borderRadius: '8px',
    background: mine
      ? 'rgba(255,255,255,0.12)'
      : '#FAFBFC',
    borderLeft: mine
      ? '3px solid rgba(255,255,255,0.65)'
      : '3px solid var(--campora-navy)',
    fontSize: '9px'
   }}

 >
   <strong>
    {parsed.reply.sender}
   </strong>
   <div
    style={{
     marginTop: '2px',
     opacity: 0.8
    }}
   >
    {parsed.reply.text}
   </div>
 </div>
)}

<div
 style={{
  fontSize: '12px',
  fontWeight: '700',
  lineHeight: 1.45,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word'
 }}
>
 {parsed?.text || ''}
</div>

<div
 style={{
  marginTop: '6px',
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: '7px',
  opacity: 0.65,
  fontSize: '8px',
  fontWeight: '700'
 }}
>
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

  {mine && (
    <button
     type="button"
     onClick={() =>
       handleDeleteMessage(message)
     }
     title="Delete message"
     style={{
       border: 'none',
       background: 'transparent',
       color: 'inherit',
       padding: 0,
       display: 'flex',
       cursor: 'pointer'
     }}
    >
     <Trash2 size={10} />
    </button>
  )}
 </div>
</div>

{/* REACTIONS */}
{Object.entries(reactionMap).some(
  ([, users]) => users?.length
) && (
  <div
   style={{
     marginTop: '4px',
     display: 'flex',
     justifyContent: mine
       ? 'flex-end'
       : 'flex-start',
     gap: '4px',
     flexWrap: 'wrap'
   }}
  >
   {Object.entries(reactionMap).map(
     ([emoji, users]) =>
       users?.length ? (
         <button
           key={emoji}
           type="button"
           onClick={() =>

          toggleLocalDmReaction(
            message.id,
            emoji
          )
        }
        style={{
          border:
           (users || []).includes(currentUserId)
            ? '1px solid #67E8F9'
            : '1px solid var(--divider)',
          background:
           (users || []).includes(currentUserId)
            ? '#FBFCFE'
            : 'var(--surface-container-lowest)',
          borderRadius: '999px',
          padding: '4px 8px',
          fontSize: '11px',
          cursor: 'pointer',
          fontWeight: '800'
        }}
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
   position: 'absolute',
   top: '6px',
   ...(mine
     ? { right: 'calc(100% + 4px)' }
     : { left: 'calc(100% + 4px)' }),
   border: 'none',
   background: 'transparent',
   color: 'var(--campora-muted)',

   cursor: 'pointer',
   padding: '4px',
   display: 'flex'
 }}
 title="Message options"
>
 <MoreVertical size={15} />
</button>

{activeDmMessageMenu === message.id && (
 <div
  style={{
    position: 'absolute',
    top: '34px',
    ...(mine ? { right: 0 } : { left: 0 }),
    zIndex: 50,
    minWidth: '270px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexWrap: 'wrap',
    padding: '7px',
    background: 'var(--surface-container-lowest)',
    border: '1px solid var(--divider)',
    borderRadius: '13px',
    boxShadow: '0 10px 25px rgba(0,45,98,0.12)'
  }}
 >
  {DM_REACTIONS.map(emoji => (
    <button
      key={emoji}
      type="button"
      onClick={() =>
        toggleLocalDmReaction(message.id, emoji)
      }
      style={{
        border: 'none',
        background: 'transparent',
        fontSize: '16px',
        cursor: 'pointer',
        padding: '4px'
      }}
    >
      {emoji}
    </button>
  ))}

<button
 type="button"
 onClick={() => {
  setDmReplyingTo({
    id: message.id,
    sender: mine ? 'You' : activeDmUser.name,
    text: parsed?.text || ''
  });
  setActiveDmMessageMenu(null);
 }}
 style={{
  border: 'none',
  background: '#FAFBFC',
  color: 'var(--campora-text)',
  borderRadius: '8px',
  padding: '6px 8px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '10px',
  fontWeight: '800',
  cursor: 'pointer'
 }}
>
 <Reply size={13} /> Reply
</button>

<button
 type="button"
 onClick={() => togglePinDmMessage(message.id)}
 style={{
  border: 'none',
  background: isPinnedMessage ? '#FFF9F1' : '#FAFBFC',
  color: isPinnedMessage ? '#C99758' : 'var(--campora-text)',
  borderRadius: '8px',
  padding: '6px 8px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '10px',
  fontWeight: '800',
  cursor: 'pointer'
 }}
>
 <Pin size={13} /> {isPinnedMessage ? 'Unpin' : 'Pin'}
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

{/* REPLY PREVIEW */}
{dmReplyingTo && (
  <div
   style={{
    padding: '9px 18px',
    background: '#FAFBFC',
    borderTop: '1px solid var(--divider)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0
   }}
  >
   <div style={{ minWidth: 0 }}>
    <div
      style={{
       color: 'var(--campora-text)',
       fontSize: '10px',
       fontWeight: '900'
      }}
    >
      Replying to {dmReplyingTo.sender}
    </div>

   <div
    style={{
     marginTop: '2px',
     color: 'var(--campora-muted)',
     fontSize: '9px',
     fontWeight: '700',
     overflow: 'hidden',

      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }}
   >
    {dmReplyingTo.text}
   </div>
  </div>

   <button
    type="button"
    onClick={() => setDmReplyingTo(null)}
    style={{
     border: 'none',
     background: 'transparent',
     color: 'var(--campora-muted)',
     cursor: 'pointer',
     display: 'flex'
    }}
   >
    <X size={14} />
   </button>
 </div>
)}

{/* COMPOSER */}
<div
  style={{
   padding: '14px 16px',
   borderTop: '1px solid var(--divider)',
   display: 'flex',
   alignItems: 'flex-end',
   gap: '10px',
   background: 'var(--surface-container-lowest)',
   flexShrink: 0
  }}
>
  <textarea
   placeholder={`Message ${activeDmUser.name}...`}
   value={dmMessage}
   onChange={event =>
     setDmMessage(event.target.value)
   }
   onKeyDown={event => {
     if (
       event.key === 'Enter' &&
       !event.shiftKey
     ){

      event.preventDefault();
      handleSendDirectMessage();
     }
   }}
   style={{
     flex: 1,
     minHeight: '48px',
     maxHeight: '120px',
     resize: 'none',
     border: '1.5px solid var(--divider)',
     background: '#FAFBFC',
     borderRadius: '15px',
     padding: '12px 13px',
     color: 'var(--campora-text)',
     outline: 'none',
     fontFamily: 'inherit',
     fontSize: '12px',
     fontWeight: '700',
     boxSizing: 'border-box'
   }}
  />

  <button
    type="button"
    onClick={handleSendDirectMessage}
    disabled={!dmMessage.trim()}
    style={{
     width: '48px',
     height: '48px',
     borderRadius: '50%',
     border: 'none',
     background: 'var(--campora-navy)',
     color: 'var(--surface-container-lowest)',
     display: 'flex',
     alignItems: 'center',
     justifyContent: 'center',
     cursor: dmMessage.trim()
       ? 'pointer'
       : 'default',
     opacity: dmMessage.trim() ? 1 : 0.5,
     flexShrink: 0
    }}
  >
    <Send size={17} />
  </button>
 </div>
</>

    )}
   </section>
 </div>
</div>
)}

{isMatchModalOpen && (
<div style={overlay}>
<div style={modalCardLarge}>
<ModalHeader title={editingPostId ? 'Edit Swap Request' : 'Set Swap Preferences'} onClose={closeSwapModal} /> {!matchResult ? (
<form onSubmit={handleFindOrPostMatch} style={modalForm}>
<SwapPreferenceSection mode="HAVE" pref={searchPref}
setPref={setSearchPref} />
<SwapPreferenceSection mode="WANTS" pref={searchPref}
setPref={setSearchPref} />
<label style={checkboxLabel}>
<input type="checkbox" checked={searchPref.isAnonymous}
onChange={event => setSearchPref({ ...searchPref, isAnonymous:
event.target.checked })} />
Post anonymously
</label>
<button type="submit" style={primarySaveBtn}>
{editingPostId ? 'Update Swap Request' : <><Search size={16} />
Run Match Engine</>}
</button>
</form>

) : matchResult.found ? (
<div>
<div style={successNotice}>We found students who may be able to
swap with you.</div>
<p style={{ ...bodyText, marginBottom: '14px' }}>
100% matches meet all the preferences you entered. Similar
matches have the reciprocal courses but may differ by section, CRN, professor,
days or time. Possible matches share one side of your request and may still be
worth contacting.
</p>
<div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap',
marginBottom: '18px' }}>
{[
['all', 'All Matches'], ['exact', '100% Matches'], ['similar', 'Similar'],
['possible', 'Possible']
].map(([key, label]) => (
<button key={key} type="button" onClick={() =>
setMatchFilter(key)} style={matchFilter === key ? matchFilterActiveBtn :

matchFilterInactiveBtn}>{label}</button>
))}
</div>
{matchResult.candidates.filter(candidate => matchFilter === 'all' ||
candidate.category === matchFilter).length === 0 ? (
<div style={emptyCard}>No matches in this category.</div>
):(
<div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
{matchResult.candidates
.filter(candidate => matchFilter === 'all' || candidate.category ===
matchFilter)
.map(candidate => {
const post = candidate.post;
return (
<div key={post.id} style={swapCard}>
<div style={{ display: 'flex', justifyContent: 'space-between',
gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
<StudentIdentity
name={post.author_name}
isAnonymous={post.is_anonymous}
clickable={canMessageUser(post.user_id,
post.is_anonymous, post.status)}
onClick={() => openDm(post.user_id, post.author_name,
post.is_anonymous, post.status, {
type: 'swap', postId: post.id, label:
buildSwapSourceLabel(post)
})}

/>
<span style={candidate.category === 'exact' ?
exactMatchBadge : candidate.category === 'similar' ? similarMatchBadge :
possibleMatchBadge}>
{candidate.category === 'exact' ? '100% MATCH' :
candidate.category === 'similar' ? `${candidate.percentage}% SIMILAR` : `${candidate.percentage}% POSSIBLE`}
</span>
</div>
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
gap: '10px' }}>
<MatchCourseSummary label="THEY HAVE" type="have"
post={post} />
<MatchCourseSummary label="THEY WANT" type="want"
post={post} />
</div>
{candidate.totalDetails > 0 && <div style={matchDetailNotice}
>{candidate.matchedDetails} of {candidate.totalDetails} additional preferences
match.</div>}

{candidate.checkedDetails.some(detail => !detail.matched) &&
(
<div style={differentDetailsText}>Different:
{candidate.checkedDetails.filter(detail => !detail.matched).map(detail =>
detail.label).join(', ')}</div>
)}
{canMessageUser(post.user_id, post.is_anonymous,
post.status) ? (
<button type="button" style={{ ...primarySaveBtn, marginTop:
'12px' }} onClick={() => {
openDm(post.user_id, post.author_name,
post.is_anonymous, post.status, {
type: 'swap', postId: post.id, label:
buildSwapSourceLabel(post)
});
setIsMatchModalOpen(false);
}}>
<MessageCircle size={16} /> Message About This Swap
</button>
):(
<div style={{ ...infoNotice, marginTop: '12px' }}>This student
cannot currently be contacted.</div>
)}
</div>
);

})}
</div>
)}
<div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid var(--divider)' }}> <p style={{ ...bodyText, marginBottom: '10px', textAlign: 'center' }}
>Want other students to find your request too?</p>
<button type="button" onClick={handleConfirmPostMatch}
style={{ ...secondaryActionBtn, width: '100%' }}>Post My Request Anyway</button>
</div>
</div>
):(
<div style={{ textAlign: 'center' }}>
<div style={warningNotice}>No matching or similar swap requests
found yet.</div>
<p style={{ ...bodyText, marginBottom: '18px' }}>Post your request so
other students can find it when they search.</p>
<button onClick={handleConfirmPostMatch} style={primarySaveBtn}
>Post Request to Board</button>
</div>

)}
</div>
</div>
)}
{isReviewModalOpen && (
<div style={overlay}>
<div style={modalCardLarge}>
<ModalHeader title={editingReviewId ? 'Edit Course Review' : 'Write Course Review'} onClose={closeReviewModal} /> <form onSubmit={handleSaveReview} style={modalForm}>
<div style={twoColumnGrid}>
<Field label="CRN"><CrnInput
placeholder="e.g. 12345"
value={newReview.crn}
onChange={value => setNewReview({ ...newReview, crn: value })}
/></Field>
<Field label="COURSE CODE"><input type="text" required
placeholder="e.g. CMPS 200" style={modalInput}
value={newReview.course_code} onChange={event =>
setNewReview({ ...newReview, course_code: event.target.value })} /></Field>
</div>
<Field label="COURSE NAME"><input type="text" required
placeholder="Course name" style={modalInput}
value={newReview.course_name} onChange={event =>
setNewReview({ ...newReview, course_name: event.target.value })} /></Field>
<div style={twoColumnGrid}>

<Field label="SECTION"><input type="text" required
placeholder="Section" style={modalInput} value={newReview.section}
onChange={event => setNewReview({ ...newReview, section:
event.target.value })} /></Field>
<Field label="PROFESSOR"><input type="text" required
placeholder="Professor name" style={modalInput}
value={newReview.professor_name} onChange={event =>
setNewReview({ ...newReview, professor_name: event.target.value })} /></Field>
</div>
<div style={twoColumnGrid}>
<Field label="DAYS"><input type="text" placeholder="e.g. MWF"
style={modalInput} value={newReview.meeting_days} onChange={event =>
setNewReview({ ...newReview, meeting_days: event.target.value })} /></Field>
<Field label="TIME"><EditablePresetTimeInput
value={newReview.meeting_time}
onChange={value => setNewReview({ ...newReview, meeting_time: value })}
/></Field>
</div>
<Field label="SEMESTER"><input type="text" placeholder="e.g. Fall 2026"
style={modalInput} value={newReview.semester} onChange={event =>
setNewReview({ ...newReview, semester: event.target.value })} /></Field>

<div style={twoColumnGrid}>
<Field label="RATING">
<select style={modalInput} value={newReview.rating}
onChange={event => setNewReview({ ...newReview, rating:
Number(event.target.value) })}>
{[5,4,3,2,1].map(number => <option key={number} value={number}
>{number}/5</option>)}
</select>
</Field>
<Field label="DIFFICULTY">
<select style={modalInput} value={newReview.difficulty}
onChange={event => setNewReview({ ...newReview, difficulty:
Number(event.target.value) })}>
{[1,2,3,4,5].map(number => <option key={number} value={number}
>{number}/5</option>)}
</select>
</Field>
</div>
<Field label="YOUR FEEDBACK">
<textarea required placeholder="Tell students about the course, professor,
workload, exams, assignments, attendance, or anything useful."
style={{ ...modalInput, height: '120px', resize: 'vertical' }}
value={newReview.comment} onChange={event =>
setNewReview({ ...newReview, comment: event.target.value })} />
</Field>

<label style={checkboxLabel}><input type="checkbox"
checked={newReview.is_anonymous} onChange={event =>
setNewReview({ ...newReview, is_anonymous: event.target.checked })} /> Post
anonymously</label>
<button type="submit" style={primarySaveBtn}>{editingReviewId ?
'Save Review Changes' : 'Post Review'}</button>
</form>
</div>
</div>
)}
</div>
</div>
);
}
function TabButton({ active, onClick, icon, label }) {
const normalizedLabel = String(label || '').replace(/\s+/g, ' ').trim();

const tabPalette = {
'Course Match & Swap': {
  bg: '#F3F7FD',
  text: '#648CCB',
  border: '#DDE7F5',
  accent: '#648CCB'
},
'Course & Prof Reviews': {
  bg: '#FFF6F2',
  text: '#D9896A',
  border: '#F3DDD4',
  accent: '#D9896A'
},
'Curriculum': {
  bg: '#F7F4FC',
  text: '#8B78B8',
  border: '#E7E0F2',
  accent: '#8B78B8'
},
'Major Q&A': {
  bg: '#F2F9F7',
  text: '#5E9A8B',
  border: '#D9EBE6',
  accent: '#5E9A8B'
},
'Seat Opening Reminders': {
  bg: '#FFF9F1',
  text: '#C99758',
  border: '#F0E2CB',
  accent: '#C99758'
},
'My Posts': {
  bg: '#FFF5F6',
  text: '#C76E7D',
  border: '#F0DDE1',
  accent: '#C76E7D'
},
'Direct Messages': {
  bg: '#F6F8FB',
  text: '#75839A',
  border: '#E4E8EF',
  accent: '#75839A'
}
};

const tone = tabPalette[normalizedLabel] || {
  bg: '#EEF3FB',
  text: '#002D62',
  border: '#D8E2FF',
  accent: '#002D62'
};

return (
<button
onClick={onClick}
className="" 
style={{
  flex: '0 0 auto',
  flexShrink: 0,

  height: '40px',
  minHeight: '40px',
  padding: '0 17px',

  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '7px',

  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
  fontSize: '13px',
  fontWeight: 800,
  lineHeight: '40px',

  cursor: 'pointer',

  backgroundColor: active ? tone.accent : tone.bg,
  color: active ? '#FFFFFF' : tone.text,

  /* Use an inset outline instead of a real border.
     This keeps the pill perfectly smooth in Safari/Chrome. */
  border: '0',
  borderRadius: '9999px',
  WebkitBorderRadius: '9999px',
  clipPath: 'inset(0 round 9999px)',
  WebkitClipPath: 'inset(0 round 9999px)',

  boxShadow: active
    ? `inset 0 0 0 1px ${tone.accent}`
    : `inset 0 0 0 1px ${tone.border}`,

  outline: 'none',
  WebkitAppearance: 'none',
  appearance: 'none',

  backgroundClip: 'padding-box',
  overflow: 'hidden',
  transform: 'none'
}}
>
{icon}
{normalizedLabel}
</button>
);
}
function Field({ label, children }) {
return <div><label style={fieldLabel}>{label}</label>{children}</div>;
}
function ScheduleTypePicker({ value, onChange }) {
const [savedType = '', savedDay = ''] = String(value || '').split(' · ');
const scheduleType = MEETING_PATTERN_OPTIONS.includes(savedType) ? savedType : '';
const needsDay = SINGLE_DAY_SCHEDULE_TYPES.has(scheduleType);

const handleTypeChange = event => {
const nextType = event.target.value;
if (SINGLE_DAY_SCHEDULE_TYPES.has(nextType)) {
onChange(`${nextType} · ${savedDay || 'Monday'}`);
} else {
onChange(nextType);
}
};

const handleDayChange = event => {
if (!scheduleType) return;
onChange(`${scheduleType} · ${event.target.value}`);
};

return (
<div style={{ display: 'grid', gridTemplateColumns: needsDay ? '1fr 1fr' : '1fr', gap: '8px', width: '100%' }}>
<select style={scheduleSelectStyle} value={scheduleType} onChange={handleTypeChange}>
<option value="">Choose schedule</option>
{MEETING_PATTERN_OPTIONS.map(option => (
<option key={option} value={option}>{option}</option>
))}
</select>
{needsDay && (
<select style={scheduleSelectStyle} value={savedDay || 'Monday'} onChange={handleDayChange}>
{WEEKDAY_OPTIONS.map(day => <option key={day} value={day}>{day}</option>)}
</select>
)}
</div>
);
}

function CrnInput({ value, onChange, placeholder = 'e.g. 12345' }) {
return (
<input
 type="text"
 inputMode="numeric"
 pattern="[0-9]{5}"
 maxLength={5}
 placeholder={placeholder}
 style={modalInput}
 value={value}
 onChange={event => onChange(sanitizeCrn(event.target.value))}
 title="CRN must be exactly 5 digits"
 required
/>
);
}

function EditablePresetTimeInput({ value, onChange }) {
useEffect(() => {
  if (!String(value || '').trim()) onChange(DEFAULT_MEETING_TIME);
}, []);

const { start, end } = splitMeetingTime(value || DEFAULT_MEETING_TIME);

const updateTime = (key, nextValue) => {
  const nextStart = key === 'start' ? nextValue : start;
  const nextEnd = key === 'end' ? nextValue : end;
  onChange(joinMeetingTime(nextStart, nextEnd));
};

return (
<div style={registrationTimeGridStyle}>
  {[
    { key: 'start', label: 'START TIME', timeValue: start },
    { key: 'end', label: 'END TIME', timeValue: end }
  ].map(({ key, label, timeValue }) => {
    const hour = Number(String(timeValue).split(':')[0] || 0);
    const period = hour >= 12 ? 'PM' : 'AM';

    return (
      <div key={key} style={registrationTimeCardStyle}>
        <div style={registrationTimeLabelStyle}>
          <AlarmClock size={13} strokeWidth={2.3} />
          {label}
        </div>
        <div style={registrationTimeRowStyle}>
          <input
            type="time"
            value={timeValue}
            onChange={event => updateTime(key, event.target.value)}
            style={registrationTimeInputStyle}
            aria-label={label === 'START TIME' ? 'Start time' : 'End time'}
          />
          <span style={registrationPeriodBadgeStyle}>{period}</span>
        </div>
      </div>
    );
  })}
</div>
);
}

function SwapPreferenceSection({ mode, pref, setPref }) {
const isHave = mode === 'HAVE';
const prefix = isHave ? 'have' : 'want';
const set = (key, value) => setPref({ ...pref, [`${prefix}${key}`]: value });
return (
<div style={swapFormSection}>
<div style={swapFormSectionHeader}>
<span style={isHave ? badgeRed : badgeGreen}>{mode}</span>
<div>
<h4 style={swapFormTitle}>{isHave ? 'Course You Have' : 'Course You Want'}</h4>
<p style={swapFormSubtitle}>{isHave ? 'Enter your current registered section.' : 'Enter your preferred section. Different sections can still appear as similar matches.'}</p>
</div>
</div>

<div style={twoColumnGrid}>
<Field label="COURSE CODE">
<input type="text" required placeholder="e.g. CMPS 200"
style={modalInput} value={pref[`${prefix}Course`]} onChange={event =>
set('Course', event.target.value)} />
</Field>

<Field label="CRN">
<CrnInput
placeholder="e.g. 11312"
value={pref[`${prefix}Crn`]}
onChange={value => set('Crn', value)}
/>
</Field>
</div>
<div style={twoColumnGrid}>
<Field label="SECTION">
<input type="text" placeholder="e.g. 1" style={modalInput}
value={pref[`${prefix}Section`]} onChange={event => set('Section',
event.target.value)} />
</Field>
<Field label="PROFESSOR">
<input type="text" placeholder="e.g. Dr. Smith" style={modalInput}
value={pref[`${prefix}Prof`]} onChange={event => set('Prof',
event.target.value)} />
</Field>
</div>
<div style={twoColumnGrid}>
<Field label="SCHEDULE / TYPE">
<ScheduleTypePicker
value={pref[`${prefix}Days`]}
onChange={value => set('Days', value)}
/>
</Field>
<Field label="TIME">
<EditablePresetTimeInput
value={pref[`${prefix}Time`]}
onChange={value => set('Time', value)}
/>
</Field>
</div>
</div>
);
}
function SwapCourseBlock({ mode, post, prefix, faded }) {
const isHave = mode === 'HAVE';

return (
<div style={{
  background: '#FFFFFF',
  border: '1px solid #E5EAF0',
  borderRadius: '18px',
  padding: '16px',
  minWidth: 0,
  ...(faded ? { opacity: 0.65 } : {})
}}>
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '12px'
  }}>
    <span style={{
      padding: '6px 9px',
      borderRadius: 999,
      background: 'var(--campora-navy)',
      color: '#FFFFFF',
      border: '1px solid var(--campora-navy)',
      fontSize: '9px',
      fontWeight: '900',
      letterSpacing: '.06em'
    }}>
      {isHave ? 'YOU HAVE' : 'YOU WANT'}
    </span>

    {post[`${prefix}_crn`] && (
      <span style={{
        padding: '5px 8px',
        borderRadius: 999,
        background: '#FFFFFF',
        border: '1px solid rgba(11,26,63,0.16)',
        color: 'var(--campora-navy)',
        fontSize: '9px',
        fontWeight: '850'
      }}>
        CRN {post[`${prefix}_crn`]}
      </span>
    )}
  </div>

  <h4 style={{
    margin: '0 0 4px',
    color: 'var(--campora-text)',
    fontSize: '18px',
    fontWeight: '900',
    lineHeight: 1.25
  }}>
    {post[`${prefix}_course`]}
  </h4>

  {post[`${prefix}_course_name`] && (
    <p style={{
      ...swapCourseName,
      margin: '0 0 14px',
      minHeight: 18
    }}>
      {post[`${prefix}_course_name`]}
    </p>
  )}

  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '8px'
  }}>
    {[
      ['SECTION', post[`${prefix}_section`]],
      ['PROFESSOR', post[`${prefix}_prof`]],
      ['DAYS', post[`${prefix}_days`]],
      ['TIME', post[`${prefix}_time`]]
    ].map(([label, value]) => (
      <div key={label} style={{
        background: '#FFFFFF',
        border: '1px solid rgba(11,26,63,0.10)',
        borderRadius: '12px',
        padding: '9px 10px',
        minWidth: 0
      }}>
        <div style={{
          fontSize: '8px',
          fontWeight: '900',
          color: 'var(--campora-navy)',
          opacity: 0.68,
          letterSpacing: '.07em',
          marginBottom: '4px'
        }}>
          {label}
        </div>
        <div style={{
          color: 'var(--campora-text)',
          fontSize: '11px',
          fontWeight: '800',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {value || '—'}
        </div>
      </div>
    ))}
  </div>
</div>
);
}
function MatchCourseSummary({ label, type, post }) {
return (
<div style={swapCourseBlock}>
<span style={type === 'have' ? badgeRed : badgeGreen}>{label}</span>
<h4 style={{ margin: '10px 0', color: 'var(--campora-text)', fontWeight: '900' }}
>{post[`${type}_course`]}</h4>
<div style={{ display: 'grid', gap: '8px' }}>
<InfoItem label="COURSE NAME" value={post[`${type}_course_name`]} /
>
<InfoItem label="CRN" value={post[`${type}_crn`]} />
<InfoItem label="SECTION" value={post[`${type}_section`]} />
<InfoItem label="PROFESSOR" value={post[`${type}_prof`]} />
<InfoItem label="DAYS" value={post[`${type}_days`]} />
<InfoItem label="TIME" value={post[`${type}_time`]} />
</div>
</div>
);
}
function StudentIdentity({ name, isAnonymous, clickable, onClick }) {
const displayName = name || 'Student';
return (
<div onClick={clickable ? onClick : undefined} style={{ display: 'flex',
alignItems: 'center', gap: '10px', cursor: clickable ? 'pointer' : 'default' }}>
<div style={avatarCircle}>{displayName.charAt(0).toUpperCase()}</div>
<div>
<p style={{ margin: 0, fontWeight: '900', color: 'var(--campora-text)', fontSize:

'14px' }}>{displayName}</p>
<span style={{ fontSize: '10px', color: 'var(--campora-muted)', fontWeight: '700' }}

>{isAnonymous ? 'Anonymous' : clickable ? 'Click to message' : 'Student'}</span>
</div>
</div>
);
}
function OwnerActions({ onEdit, onDelete }) {
return (
<div style={{ display: 'flex', gap: '6px' }}>
<button onClick={onEdit} style={iconActionBtn} title="Edit"><Edit3
size={14} /></button>
<button onClick={onDelete} style={{ ...iconActionBtn, color: '#D9896A' }}
title="Delete"><Trash2 size={14} /></button>
</div>
);
}
function InfoItem({ label, value }) {
return <div><span style={infoLabel}>{label}</span><p style={infoValue}
>{value || '—'}</p></div>;
}
function ModalHeader({ title, onClose }) {
return (
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems:
'center', gap: '10px', marginBottom: '20px' }}>
<h2 style={{ margin: 0, color: 'var(--campora-text)', fontWeight: '900', fontSize:
'20px' }}>{title}</h2>
<button type="button" onClick={onClose} style={closeModalBtn}><X
size={19} /></button>
</div>
);
}
function ReplyComposer({ value, onChange, placeholder, onSubmit,
onCancel }) {
return (
<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
<input type="text" placeholder={placeholder} style={{ ...modalInput, flex:
1 }} value={value} onChange={event => onChange(event.target.value)}
onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault();
onSubmit(); } }} />
<button type="button" onClick={onSubmit} style={primaryActionBtn}
>Reply</button>
<button type="button" onClick={onCancel} style={{ ...iconActionBtn, height:
'42px', width: '42px' }}><X size={16} /></button>

</div>
);
}
function ReplyCard({ reply, currentUserId, editing, editingText,
onEditingTextChange, onStartEdit, onCancelEdit, onSaveEdit, onDelete,
onMessage }) {
const mine = reply.user_id === currentUserId;
return (
<div style={replyCard}>
<div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px',
alignItems: 'flex-start' }}>
<div onClick={!mine ? onMessage : undefined} style={{ cursor: !mine ?
'pointer' : 'default' }}>
<p style={{ margin: 0, fontWeight: '900', fontSize: '12px', color:
'var(--campora-text)' }}>{reply.author_name}</p>
<span style={{ fontSize: '9px', color: 'var(--campora-muted)', fontWeight: '700' }}>{!
mine ? 'Click to message' : 'Your reply'}</span>
</div>
{mine && !editing && <OwnerActions onEdit={onStartEdit}
onDelete={onDelete} />}
</div>
{editing ? (
<div style={{ marginTop: '8px' }}>
<textarea style={{ ...modalInput, minHeight: '70px', resize: 'vertical' }}
value={editingText} onChange={event =>
onEditingTextChange(event.target.value)} />
<div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
<button type="button" style={primaryActionBtn} onClick={onSaveEdit}
>Save</button>
<button type="button" style={secondaryActionBtn}
onClick={onCancelEdit}>Cancel</button>
</div>
</div>
):(
<p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--campora-body)',
fontWeight: '600', lineHeight: 1.5 }}>{reply.content}</p>
)}
</div>
);
}
const registrationContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px'
};

const registrationPageShellStyle = {
  width: '100%',
  minHeight: '100%',
  boxSizing: 'border-box',
  background: 'transparent',
  padding: '8px 4px 28px'
};

const registrationHeroCard = {
  width: '100%',
  minWidth: 0,
  minHeight: '176px',
  background: '#FFFFFF',
  border: '1px solid #E5EAF2',
  borderRadius: '20px',
  padding: '24px 26px',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '20px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  boxShadow: '0 8px 22px rgba(11,26,63,0.04)',
  color: 'var(--campora-text)',
  transition: 'transform 0.18s ease, box-shadow 0.18s ease'
};
const swapHeroCard = {
  ...registrationHeroCard,
  background: '#FFFFFF'
};
const heroIconWrap = {
  width: '54px',
  height: '54px',
  borderRadius: '16px',
  background: '#F5F8FC',
  border: '1px solid #E4EAF2',
  color: 'var(--campora-navy)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};
const heroCardTitle = {
  margin: 0,
  fontSize: '24px',
  fontWeight: '900',
  color: 'var(--campora-text)',
  letterSpacing: '-0.3px'
};
const heroCardCopy = {
  margin: '14px 0 20px',
  fontSize: '14px',
  lineHeight: 1.65,
  color: 'var(--campora-muted)',
  fontWeight: '600',
  maxWidth: '560px',
  wordBreak: 'normal',
  overflowWrap: 'break-word'
};
const heroCardPill = {
  background: '#F5F8FC',
  color: 'var(--campora-navy)',
  border: '1px solid #E0E7F0',
  borderRadius: '999px',
  padding: '6px 10px',
  fontSize: '9px',
  fontWeight: '900',
  letterSpacing: '0.6px'
};
const heroCardCta = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  color: 'var(--campora-navy)',
  fontSize: '12px',
  fontWeight: '900',
  letterSpacing: '0.4px',
  paddingTop: '3px'
};
const primaryActionBtn = { background: 'var(--campora-navy)', color: 'var(--surface-container-lowest)', border:
'none', padding: '10px 16px', borderRadius: '999px', fontWeight: '800', fontSize:
'13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent:
'center', gap: '6px' };
const secondaryActionBtn = { background: 'var(--surface-container-lowest)', color: 'var(--campora-text)', border:
'1.5px solid var(--divider)', padding: '10px 16px', borderRadius: '999px', fontWeight:
'800', fontSize: '13px', cursor: 'pointer' };
const primarySaveBtn = { width: '100%', background: 'var(--campora-navy)', color:
'var(--surface-container-lowest)', border: 'none', padding: '14px', borderRadius: '999px', fontWeight:
'900', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center',
justifyContent: 'center', gap: '8px' };
const sectionHeading = { margin: '0 0 10px', fontSize: '20px', fontWeight: '900',
color: 'var(--campora-text)' };
const sectionDescription = { margin: '0 0 22px', fontSize: '13px', color:
'var(--campora-muted)', fontWeight: '600', lineHeight: 1.5 };
const sectionTopRow = { display: 'flex', alignItems: 'center', justifyContent:
'space-between', gap: '15px', flexWrap: 'wrap' };
const swapCard = { background: 'var(--surface-container-lowest)', padding: '22px', borderRadius:
'22px', border: '1px solid #E3E9F2', boxShadow: '0 10px 28px rgba(11,26,63,0.055)',
transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden' };
const takenSwapCard = { background: '#FBFCFE', border: '1px solid var(--outline)' }; const reviewCard = { background: 'var(--surface-container-lowest)', padding: '24px', borderRadius:
'22px', border: '1px solid #E3E9F2', boxShadow: '0 10px 28px rgba(11,26,63,0.05)', overflow: 'hidden' }; const emptyCard = {
  background: '#FFFFFF',
  padding: '24px',
  borderRadius: '20px',
  border: '1px solid #E4EAF2',
  boxShadow: '0 10px 26px rgba(11,26,63,0.05)',
  color: 'var(--campora-muted)',
  fontWeight: '750',
  textAlign: 'center'
};
const loadingBox = { display: 'flex', alignItems: 'center', justifyContent: 'center',
gap: '8px', padding: '35px', color: 'var(--campora-muted)', fontWeight: '700' };
const avatarCircle = { width: '38px', height: '38px', borderRadius: '50%',
background: '#FAFBFC', border: '1.5px solid var(--divider)', color: 'var(--campora-text)',
fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center',
fontSize: '14px', flexShrink: 0 };
const swapCourseBlock = {
  background: '#F8FAFD',
  border: '1px solid #E5EAF2',
  borderRadius: '18px',
  padding: '16px 17px',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.65)'
}; const swapCourseHeader = { display: 'flex', justifyContent: 'space-between',
alignItems: 'center', gap: '8px' };

const swapCourseName = { margin: '0 0 12px', color: 'var(--campora-muted)', fontSize:
'11px', fontWeight: '700', lineHeight: 1.4 };

const compactCourseInfoGrid = { display: 'grid', gridTemplateColumns:
'repeat(2, minmax(0, 1fr))', gap: '10px', paddingTop: '11px', borderTop: '1px solid var(--divider)' }; const swapArrowDivider = { position: 'relative', height: '34px', display: 'flex',
alignItems: 'center', justifyContent: 'center' };
const swapArrowCircle = { width: '30px', height: '30px', borderRadius: '50%',
background: 'var(--surface-container-lowest)', border: '1.5px solid var(--divider)', color: 'var(--campora-muted)',
display: 'flex', alignItems: 'center', justifyContent: 'center' };
const smallCrnBadge = { background: 'var(--surface-container-lowest)', color: 'var(--campora-muted)', border: '1px solid var(--divider)', padding: '4px 8px', borderRadius: '8px', fontSize: '9px', fontWeight: '900' };
const availableStatusBadge = { background: '#F2F9F7', color: '#5E9A8B',
border: '1px solid #D9EBE6', padding: '5px 9px', borderRadius: '9px', fontSize:
'9px', fontWeight: '900', letterSpacing: '0.4px' };
const takenStatusBadge = { background: '#FBFCFE', color: 'var(--campora-muted)', border:
'1px solid var(--outline)', padding: '5px 9px', borderRadius: '9px', fontSize: '9px',
fontWeight: '900', letterSpacing: '0.4px' };
const takenNotice = { marginTop: '15px', background: '#FBFCFE', color:
'var(--campora-muted)', border: '1px solid var(--divider)', padding: '10px 12px', borderRadius:
'11px', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center',
justifyContent: 'center', gap: '6px' };
const markTakenButton = { width: '100%', background: 'var(--surface-container-lowest)', color:
'var(--campora-text)', border: '1.5px solid var(--outline)', padding: '9px 12px', borderRadius:
'11px', fontWeight: '800', fontSize: '11px', cursor: 'pointer', display: 'flex',
alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px' };
const reopenSwapButton = { ...markTakenButton, color: 'var(--campora-body)' };
const swapFormSection = { background: '#FAFBFC', border: '1px solid var(--divider)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' };
const swapFormSectionHeader = { display: 'flex', alignItems: 'center', gap:
'10px', marginBottom: '2px' };
const swapFormTitle = { margin: 0, color: 'var(--campora-text)', fontSize: '14px',
fontWeight: '900' };
const swapFormSubtitle = { margin: '2px 0 0', color: 'var(--campora-muted)', fontSize:
'10px', fontWeight: '700' };
const badgeRed = { background: '#FFF6F2', color: '#D9896A', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '900' }; const badgeGreen = { background: '#F2F9F7', color: '#5E9A8B', padding: '4px 9px', borderRadius: '7px', fontSize: '10px', fontWeight: '900' }; const badgeGray = { background: '#FBFCFE', color: 'var(--campora-muted)', padding: '4px 9px', borderRadius: '7px', fontSize: '10px', fontWeight: '900' }; const reviewTag = { background: '#FFF9F1', color: '#D97706', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800' }; const dmBtnStyle = { width: '100%', background: 'var(--surface-container-lowest)', border: '1.5px solid var(--divider)', color: 'var(--campora-text)', padding: '10px', borderRadius: '999px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' };

const modalInput = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '999px', border: '1.5px solid var(--divider)', fontSize: '13px', fontWeight: '700', color: 'var(--campora-text)', outline: 'none', background: 'var(--surface-container-lowest)' };
const scheduleSelectStyle = {
  ...modalInput,
  height: '44px',
  minHeight: '44px',
  padding: '0 14px',
  borderRadius: '999px',
  WebkitBorderRadius: '999px',
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  cursor: 'pointer',
  lineHeight: 'normal',
  backgroundColor: 'var(--surface-container-lowest)',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%235B667A' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
  backgroundSize: '14px 14px',
  overflow: 'hidden'
};
const registrationTimeGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '8px',
  width: '100%'
};
const registrationTimeCardStyle = {
  padding: '9px 10px',
  background: '#FFFFFF',
  border: '1px solid #DCE4EF',
  borderRadius: '14px',
  boxSizing: 'border-box',
  minWidth: 0
};
const registrationTimeLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  marginBottom: '5px',
  color: '#94A3B8',
  fontSize: '8px',
  fontWeight: '900',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap'
};
const registrationTimeRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  minWidth: 0
};
const registrationTimeInputStyle = {
  flex: 1,
  minWidth: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: '#0B1A3F',
  fontSize: '13px',
  fontWeight: '800',
  fontFamily: 'inherit',
  padding: 0
};
const registrationPeriodBadgeStyle = {
  flexShrink: 0,
  padding: '4px 6px',
  borderRadius: '8px',
  background: '#F3F6FA',
  border: '1px solid #E4EAF2',
  color: '#0B1A3F',
  fontSize: '9px',
  fontWeight: '900',
  lineHeight: 1
};
const selectInputStyle = { width: '100%', boxSizing: 'border-box', padding:
'12px 14px', borderRadius: '999px', border: '1.5px solid var(--divider)', fontSize:
'14px', fontWeight: '800', color: 'var(--campora-text)', outline: 'none', background:
'var(--surface-container-lowest)' };
const fieldLabel = { fontSize: '10px', fontWeight: '900', color: 'var(--campora-text)',
marginBottom: '6px', display: 'block', letterSpacing: '0.6px' };
const checkboxLabel = { display: 'flex', alignItems: 'center', gap: '8px', cursor:
'pointer', fontSize: '12px', fontWeight: '700', color: 'var(--campora-text)' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,45,98,0.42)',
backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent:
'center', padding: '20px', zIndex: 1000 };
const modalCardLarge = { width: '100%', maxWidth: '650px', maxHeight:
'90vh', overflowY: 'auto', padding: '28px', boxSizing: 'border-box', background:
'var(--surface-container-lowest)', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.18)' };
const dmSearchStatus = { padding: '14px', textAlign: 'center', color: 'var(--campora-muted)',
fontSize: '12px', fontWeight: '700' };

const modalForm = { display: 'flex', flexDirection: 'column', gap: '18px' };

const twoColumnGrid = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }; const formBottomRow = { display: 'flex', justifyContent: 'space-between',
alignItems: 'center', gap: '15px', flexWrap: 'wrap' };

const iconActionBtn = { background: 'var(--surface-container-lowest)', border: '1.5px solid var(--divider)',
padding: '7px', borderRadius: '8px', cursor: 'pointer', color: 'var(--campora-muted)', display:
'flex', alignItems: 'center', justifyContent: 'center' };
const closeModalBtn = { background: 'transparent', border: 'none', color:
'var(--campora-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent:
'center', padding: '4px' };
const courseInfoGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', padding: '14px', margin: '16px 0', background: '#F8FAFD', borderRadius: '16px', border: '1px solid #E7ECF3' };
const infoLabel = { display: 'block', color: 'var(--campora-muted)', fontSize: '9px',
fontWeight: '900', letterSpacing: '0.6px', marginBottom: '3px' };
const infoValue = { margin: 0, color: 'var(--campora-text)', fontSize: '12px', fontWeight:
'800' };
const bodyText = { margin: 0, fontSize: '13px', color: 'var(--campora-body)', fontWeight:
'600', lineHeight: 1.6 };
const replySection = { display: 'flex', flexDirection: 'column', gap: '9px',
marginTop: '15px', paddingLeft: '14px', borderLeft: '2px solid var(--divider)' };
const replyCard = { background: '#FAFBFC', padding: '11px 13px', borderRadius:
'12px', border: '1px solid var(--divider)' };
const replyButton = { background: 'none', border: 'none', padding: 0, color:
'var(--campora-text)', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex',
alignItems: 'center', gap: '5px' };
const reminderFormGrid = { display: 'grid', gridTemplateColumns:
'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'start' };
const bellCircle = { width: '38px', height: '38px', borderRadius: '999px',
background: '#FAFBFC', color: 'var(--campora-text)', display: 'flex', alignItems: 'center',
justifyContent: 'center', border: '1px solid var(--divider)' };
const smallOutlineBtn = { background: 'var(--surface-container-lowest)', border: '1px solid var(--divider)',
borderRadius: '9px', color: 'var(--campora-text)', padding: '7px 10px', cursor: 'pointer',
fontSize: '11px', fontWeight: '800' };
const infoNotice = { display: 'flex', alignItems: 'flex-start', gap: '10px', padding:
'15px', background: '#FAFBFC', border: '1px solid var(--divider)', borderRadius:
'14px', color: 'var(--campora-text)', fontSize: '12px', fontWeight: '600' };
const successNotice = { background: '#F2F9F7', color: '#5E9A8B', padding:
'15px', borderRadius: '15px', marginBottom: '18px', fontWeight: '900' };
const warningNotice = { background: '#FFF9F1', color: '#C99758', padding:
'15px', borderRadius: '15px', marginBottom: '18px', fontWeight: '900' };
const matchFilterActiveBtn = { background: 'var(--campora-navy)', color: 'var(--surface-container-lowest)', border:
'1.5px solid var(--campora-navy)', padding: '8px 12px', borderRadius: '10px', fontWeight:
'800', fontSize: '11px', cursor: 'pointer' };
const matchFilterInactiveBtn = { background: 'var(--surface-container-lowest)', color: 'var(--campora-muted)',
border: '1.5px solid var(--divider)', padding: '8px 12px', borderRadius: '10px',
fontWeight: '800', fontSize: '11px', cursor: 'pointer' };
const exactMatchBadge = { background: '#F2F9F7', color: '#5E9A8B', border:
'1px solid #D9EBE6', padding: '5px 9px', borderRadius: '9px', fontSize: '9px',
fontWeight: '900', whiteSpace: 'nowrap' };
const similarMatchBadge = { background: '#FFF9F1', color: '#C99758', border:
'1px solid #F0E2CB', padding: '5px 9px', borderRadius: '9px', fontSize: '9px',
fontWeight: '900', whiteSpace: 'nowrap' };
const possibleMatchBadge = { background: '#FBFCFE', color: 'var(--campora-muted)',
border: '1px solid var(--outline)', padding: '5px 9px', borderRadius: '9px', fontSize:
'9px', fontWeight: '900', whiteSpace: 'nowrap' };
const matchDetailNotice = { marginTop: '12px', padding: '10px 12px',
borderRadius: '11px', background: '#FAFBFC', border: '1px solid var(--divider)',
fontSize: '11px', color: 'var(--campora-muted)', fontWeight: '700' };
const differentDetailsText = { marginTop: '8px', fontSize: '10px', color:
'var(--campora-muted)', fontWeight: '700' };
const myPostCard = { ...reviewCard, width: '100%', textAlign: 'left', cursor:
'pointer', fontFamily: 'inherit' };
const myPostSourceBadge = { background: '#EEF2FF', color: 'var(--campora-text)',
border: '1px solid #DDE5F4', padding: '5px 9px', borderRadius: '8px', fontSize:
'9px', fontWeight: '900' };
const myPostTypeBadge = { background: '#FAFBFC', color: 'var(--campora-muted)', border:
'1px solid var(--divider)', padding: '5px 9px', borderRadius: '8px', fontSize: '9px',
fontWeight: '900' };
const myPostSubtitle = { margin: '6px 0 0', color: 'var(--campora-muted)', fontSize: '12px',
fontWeight: '600', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis' };

