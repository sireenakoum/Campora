import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
ArrowLeftRight,
ArrowRight,
Bell,
BookOpen,
CheckCircle2,
Compass,
CornerDownRight,
Edit3,
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
Sparkles,
Star,
Trash2,
UserRound,
X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
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
haveDays: '', haveTime: '',
wantCourse: '', wantCrn: '', wantCourseName: '', wantSection: '', wantProf: '',
wantDays: '', wantTime: '',
isAnonymous: false
};

const EMPTY_REVIEW = {
crn: '', course_code: '', course_name: '', section: '', professor_name: '',

meeting_days: '', meeting_time: '',
semester: '', rating: 5, difficulty: 3, comment: '', is_anonymous: false
};
const EMPTY_QUESTION = { title: '', content: '', is_anonymous: false };
const EMPTY_REMINDER = { crn: '', course_code: '', course_name: '', section: '',
professor: '' };

const AVATAR_PALETTE = [
'#E0F2FE', '#FCE7F3', '#F3E8FF', '#F2F9F7',
'#FFF6F2', '#CFFAFE', '#E0E7FF', '#D1FAE5'
];
const DM_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

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
if (editingPostId) {
const payload = {
have_course: searchPref.haveCourse.trim().toUpperCase(),
have_crn: searchPref.haveCrn.trim(),
have_course_name: searchPref.haveCourseName.trim(),
have_section: searchPref.haveSection.trim(),
have_prof: searchPref.haveProf.trim(),
have_days: searchPref.haveDays.trim(),
have_time: searchPref.haveTime.trim(),
want_course: searchPref.wantCourse.trim().toUpperCase(),
want_crn: searchPref.wantCrn.trim(),
want_course_name: searchPref.wantCourseName.trim(),
want_section: searchPref.wantSection.trim(),
want_prof: searchPref.wantProf.trim(),
want_days: searchPref.wantDays.trim(),
want_time: searchPref.wantTime.trim(),
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
have_time: searchPref.haveTime.trim(),
want_course: searchPref.wantCourse.trim().toUpperCase(),
want_crn: searchPref.wantCrn.trim(),
want_course_name: searchPref.wantCourseName.trim(),
want_section: searchPref.wantSection.trim(),
want_prof: searchPref.wantProf.trim(),
want_days: searchPref.wantDays.trim(),
want_time: searchPref.wantTime.trim(),
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

const payload = {
user_id: currentUserId,
crn: newReminder.crn.trim(),
course_code: newReminder.course_code.trim().toUpperCase(),

course_name: newReminder.course_name.trim(),
section: newReminder.section.trim(),
professor: newReminder.professor.trim(),
is_active: true
};
if (editingReminderId) {
const { data, error } = await
supabase.from('course_reminders').update(payload).eq('id',
editingReminderId).eq('user_id', currentUserId).select().single();
if (error) return showError('Could not update your reminder.', error);
setReminders(previous => previous.map(reminder => (reminder.id ===
editingReminderId ? data : reminder)));
} else {
const { data, error } = await
supabase.from('course_reminders').insert([payload]).select().single();
if (error) return showError('Could not create your reminder.', error);
setReminders(previous => [data, ...previous]);
}
setEditingReminderId(null);
setNewReminder(EMPTY_REMINDER);
};
const handleEditReminder = reminder => {
setEditingReminderId(reminder.id);
setNewReminder({
crn: reminder.crn || '', course_code: reminder.course_code || '',
course_name: reminder.course_name || '',
section: reminder.section || '', professor: reminder.professor || ''
});
window.scrollTo({ top: 0, behavior: 'smooth' });
};
const handleDeleteReminder = async id => {
if (!window.confirm('Delete this seat reminder?')) return;
const { error } = await supabase.from('course_reminders').delete().eq('id',
id).eq('user_id', currentUserId);
if (error) return showError('Could not delete your reminder.', error);
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

<div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto',
paddingBottom: '60px' }}>
<div style={{ marginBottom: '30px' }}>
<div style={{
display: 'inline-flex', alignItems: 'center', gap: '8px', background:
'#FFFFFF', border: '1.5px solid #E2E8F0',
padding: '6px 14px', borderRadius: '30px', fontSize: '11px', fontWeight:
'800', color: '#0B1A3F', marginBottom: '10px'
}}>
<Compass size={14} color="#0B1A3F" />
ACADEMIC REGISTRATION HUB
</div>
<h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0B1A3F', margin:
0, letterSpacing: '-0.5px' }}>
Registration & Swap Hub
</h1>
<p style={{ color: '#A3AED0', fontWeight: '700', marginTop: '6px', fontSize:
'14px' }}>
Match course sections, read course & professor reviews, manage seat
alerts, explore curricula, and ask other students for advice.
</p>
</div>
<div style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX:
'auto', paddingBottom: '5px' }}>
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
<div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
<div style={{ background: '#0B1A3F', color: 'white', padding: '30px',
borderRadius: '24px', boxShadow: '0 10px 30px rgba(11,26,57,0.15)' }}>
<div style={{ display: 'flex', alignItems: 'center', gap: '10px',
marginBottom: '15px' }}>
<Sparkles color="#FFFFFF" size={24} />
<h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>Find Your
Ideal Course Match</h2>
</div>
<p style={{ color: '#CBD5E1', fontSize: '14px', fontWeight: '600',
marginBottom: '25px', maxWidth: '760px', lineHeight: 1.6 }}>
Enter the course you currently have and the course you want. Campora
will show exact matches, similar reciprocal swaps, and possible alternatives
even when section, CRN, professor or schedule is different.
</p>
<button onClick={() => {
setEditingPostId(null); setSearchPref(EMPTY_SWAP);
setMatchResult(null); setMatchFilter('all'); setIsMatchModalOpen(true);
}} style={matchSearchBtn}>
<Plus size={18} /> Check Match / Post Swap Request
</button>
</div>
<div>
<h3 style={sectionHeading}>Recent Swap Requests</h3>
{loading ? (
<div style={loadingBox}><RefreshCw size={20} /> Loading...</div>
) : swapPosts.length === 0 ? (
<div style={emptyCard}>No swap requests posted yet.</div>
):(
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
{swapPosts.map(post => {
const isTaken = post.status === 'taken';
return (

<div key={post.id} style={{ ...swapCard, ...(isTaken ?
takenSwapCard : {}) }}>
<div style={{ display: 'flex', justifyContent: 'space-between',
alignItems: 'flex-start', gap: '10px', marginBottom: '16px' }}>
<StudentIdentity

name={post.author_name}
isAnonymous={post.is_anonymous}
clickable={canMessageUser(post.user_id, post.is_anonymous,
post.status)}
onClick={() => openDm(post.user_id, post.author_name,
post.is_anonymous, post.status, {
type: 'swap', postId: post.id, label:
buildSwapSourceLabel(post)
})}
/>
<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
<span style={isTaken ? takenStatusBadge :
availableStatusBadge}>{isTaken ? 'TAKEN' : 'AVAILABLE'}</span>
{post.user_id === currentUserId && <OwnerActions onEdit={() =>
handleEditSwap(post)} onDelete={() => handleDeleteSwap(post.id)} />}
</div>
</div>
<SwapCourseBlock mode="HAVE" post={post} prefix="have"
faded={isTaken} />
<div style={swapArrowDivider}><div style={swapArrowCircle}
><ArrowRight size={16} /></div></div>
<SwapCourseBlock mode="WANTS" post={post} prefix="want"
faded={isTaken} />
{isTaken && <div style={takenNotice}><CheckCircle2 size={15} />
This swap has already been taken and is no longer available.</div>}
{!isTaken && canMessageUser(post.user_id, post.is_anonymous,
post.status) && (
<button onClick={() => openDm(post.user_id, post.author_name,
post.is_anonymous, post.status, {
type: 'swap', postId: post.id, label: buildSwapSourceLabel(post)
})} style={{ ...dmBtnStyle, marginTop: '15px' }}>
<MessageCircle size={15} /> Message Student
</button>
)}
{post.user_id === currentUserId && (
<button onClick={() => handleToggleSwapStatus(post)}
style={isTaken ? reopenSwapButton : markTakenButton}>
{isTaken ? <><RotateCcw size={14} /> Make Available Again</> :
<><CheckCircle2 size={14} /> Mark as Taken</>}
</button>
)}

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
<div style={sectionTopRow}>
<div>
<h3 style={{ ...sectionHeading, marginBottom: '4px' }}>Course &
Professor Feedback</h3>
<p style={sectionDescription}>Share the exact course section and your
experience with other students.</p>
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
<div style={{ marginTop: '16px' }}>
<h4 style={{ margin: 0, fontSize: '19px', fontWeight: '900', color:
'#0B1A3F' }}>
{review.course_code}{review.course_name && ` — ${review.course_name}`}

</h4>
<p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '11px',
fontWeight: '700' }}>Posted {formatDate(review.created_at)}</p>
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
<div style={reviewCard}>
<h3 style={sectionHeading}>Curriculum</h3>
<p style={sectionDescription}>Select a major to view its official
curriculum once it is uploaded.</p>
<label style={fieldLabel}>SELECT MAJOR</label>
<select value={selectedMajor} onChange={event =>
setSelectedMajor(event.target.value)} style={selectInputStyle}>
{MAJORS.map(major => <option key={major} value={major}>{major}</option>)}
</select>
<div style={{ marginTop: '22px', padding: '45px 25px', border: '1.5px dashed #CBD5E1', borderRadius: '20px', textAlign: 'center' }}> <BookOpen size={32} color="#A3AED0" />
<h4 style={{ margin: '12px 0 5px', fontSize: '18px', fontWeight: '900',
color: '#0B1A3F' }}>{selectedMajor} Curriculum</h4>
<p style={{ margin: 0, color: '#94A3B8', fontWeight: '800', fontSize:
'14px' }}>To be uploaded.</p>
</div>
</div>
</div>
)}

{activeTab === 'majorqa' && (
<div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
<div style={reviewCard}>
<h3 style={sectionHeading}>Major Q&A & Student Advice</h3>
<p style={sectionDescription}>Choose your major, ask questions, and

get advice from other students.</p>
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
<form onSubmit={handlePostQuestion} style={reviewCard}>
<h4 style={{ margin: '0 0 14px', color: '#0B1A3F', fontWeight: '900' }}>
{editingQuestionId ? 'Edit Question' : `Ask about ${selectedMajor}`}
</h4>
<input type="text" placeholder="Question title" required
style={{ ...modalInput, marginBottom: '10px' }} value={newQuestion.title}
onChange={event => setNewQuestion({ ...newQuestion, title:
event.target.value })} />
<textarea placeholder="Write your question or explain what advice you need..."
required style={{ ...modalInput, height: '95px', resize: 'vertical',
marginBottom: '12px' }} value={newQuestion.content} onChange={event =>
setNewQuestion({ ...newQuestion, content: event.target.value })} />
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
<h4 style={{ margin: '16px 0 5px', color: '#0B1A3F', fontWeight: '900',
fontSize: '17px' }}>{question.title}</h4>
<p style={{ margin: '0 0 12px', fontSize: '11px', color: '#A3AED0',
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
<div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
<div style={reviewCard}>
<h3 style={sectionHeading}>Set Course Seat Alert</h3>
<p style={sectionDescription}>Save the exact course or CRN you want
Campora to monitor.</p>
<form onSubmit={handleSaveReminder} style={reminderFormGrid}>
<input type="text" placeholder="CRN" style={modalInput}
value={newReminder.crn} onChange={event =>
setNewReminder({ ...newReminder, crn: event.target.value })} />
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
<div style={{ display: 'flex', gap: '8px' }}>
{editingReminderId && <button type="button"
style={{ ...secondaryActionBtn, flex: 1 }} onClick={() =>
{ setEditingReminderId(null); setNewReminder(EMPTY_REMINDER); }}
>Cancel</button>}
<button type="submit" style={{ ...primaryActionBtn, flex: 1,

justifyContent: 'center' }}><Bell size={16} /> {editingReminderId ? 'Update Alert' : 'Add Alert'}</button>
</div>
</form>
</div>
<div>
<h3 style={sectionHeading}>Your Seat Reminders</h3>
{reminders.length === 0 ? <div style={emptyCard}>You have no seat

reminders.</div> : (
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
{reminders.map(reminder => (
<div key={reminder.id} style={swapCard}>
<div style={{ display: 'flex', justifyContent: 'space-between',
alignItems: 'flex-start', gap: '12px' }}>
<div style={{ display: 'flex', gap: '10px' }}>
<div style={bellCircle}><Bell size={18} /></div>
<div>
<h4 style={{ margin: 0, color: '#0B1A3F', fontWeight: '900',
fontSize: '17px' }}>{reminder.course_code}</h4>
{reminder.course_name && <p style={{ margin: '2px 0 0', color:
'#475569', fontWeight: '700', fontSize: '12px' }}>{reminder.course_name}</p>}
</div>
</div>
<OwnerActions onEdit={() => handleEditReminder(reminder)}
onDelete={() => handleDeleteReminder(reminder.id)} />
</div>
<div style={{ ...courseInfoGrid, marginTop: '16px' }}>
<InfoItem label="CRN" value={reminder.crn} />
<InfoItem label="SECTION" value={reminder.section} />
<InfoItem label="PROFESSOR" value={reminder.professor} />
</div>
<div style={{ display: 'flex', justifyContent: 'space-between',
alignItems: 'center', gap: '10px' }}>
<span style={reminder.is_active ? badgeGreen : badgeGray}
>{reminder.is_active ? 'MONITORING' : 'PAUSED'}</span>
<button onClick={() => handleToggleReminder(reminder)}
style={smallOutlineBtn}>{reminder.is_active ? 'Pause Alert' : 'Resume Alert'}</button>
</div>
</div>
))}
</div>
)}
</div>

<div style={infoNotice}>
<Bell size={18} color="#0B1A3F" />
<div>
<strong>Seat notification system</strong>
<p style={{ margin: '3px 0 0', fontSize: '12px', lineHeight: 1.5, color:
'#64748B' }}>
Your alert is saved in Campora. Automatic seat-opening detection
requires connection to live university course availability data.
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
<h4 style={{ margin: 0, color: '#0B1A3F', fontSize: '15px',
fontWeight: '900' }}>{item.title}</h4>
{item.subtitle && <p style={myPostSubtitle}>{item.subtitle}</p>}

</div>
<div style={{ textAlign: 'right', flexShrink: 0 }}>
<span style={{ fontSize: '10px', color: '#A3AED0', fontWeight:
'700' }}>{formatDate(item.created_at)}</span>
<div style={{ marginTop: '8px', color: '#94A3B8', display: 'flex',
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
    background: '#FFFFFF',
    border: '1.5px solid #E2E8F0',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(11,26,57,0.07)'
  }}
 >
  {/* LEFT: INBOX */}
  <aside
    style={{
     minWidth: 0,
     display: 'flex',
     flexDirection: 'column',
     borderRight: '1px solid #E2E8F0',
     background: '#FFFFFF'
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
     color: '#0B1A3F',
     fontSize: '20px',
     fontWeight: '900'
   }}
  >
   Messages
  </h4>
  <p
   style={{
     margin: '3px 0 0',
     color: '#94A3B8',
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
    background: '#F8FAFC',
    border: '1.5px solid #E2E8F0',
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
     color: '#0B1A3F',
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
     borderRadius: '14px',
     border: '1px solid #E2E8F0',
     background: '#FFFFFF',
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
  background: '#FFFFFF',
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
    color: '#0B1A3F',
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
    color: '#0B1A3F',
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
             color: '#94A3B8',
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
       color: '#A3AED0',
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
        ? '#F1F5F9'
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
     color: '#0B1A3F',
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
   color: '#0B1A3F',
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
    color: '#A3AED0',
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
    color: '#94A3B8',
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
  color: '#64748B',
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
               : '#A3AED0',
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
    background: '#FFFFFF'
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
         background: '#FFFFFF',
         border: '2px solid #0B1A3F',
         color: '#0B1A3F',
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
    color: '#0B1A3F',
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
     color: '#94A3B8',
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
     borderBottom: '1px solid #E2E8F0',
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
    color: '#0B1A3F',
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
    color: '#0B1A3F',
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
    color: '#94A3B8',
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
           border: '1px solid #E2E8F0',
           background: (Array.isArray(pinnedDmUsers) ? pinnedDmUsers :
[]).includes(activeDmUser.id)
             ? '#FFF9F1'
             : '#FFFFFF',
           color: (Array.isArray(pinnedDmUsers) ? pinnedDmUsers :
[]).includes(activeDmUser.id)
             ? '#C99758'
             : '#64748B',
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
       background: '#FFFFFF',
       border: '1px solid #C99758'
      }}
    >
      <div
       style={{
         minWidth: 0,
         color: '#0B1A3F',
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
    color: '#A3AED0',
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
    ? '#0B1A3F'
    : '#FFFFFF',
  color: mine
    ? '#FFFFFF'
    : '#0B1A3F',
  border: mine
    ? '1px solid #0B1A3F'
    : '1px solid #E2E8F0',
  boxShadow:
    '0 2px 8px rgba(11,26,57,0.05)'
 }}
>
 {parsed?.source?.type === 'swap' && (
  <div
    style={{
      marginBottom: '6px',
      paddingBottom: '6px',
      borderBottom: mine
        ? '1px solid rgba(255,255,255,0.18)'
        : '1px solid #E2E8F0',
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
      : '#F8FAFC',
    borderLeft: mine
      ? '3px solid rgba(255,255,255,0.65)'
      : '3px solid #0B1A3F',
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
            : '1px solid #E2E8F0',
          background:
           (users || []).includes(currentUserId)
            ? '#F1F5F9'
            : '#FFFFFF',
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
   color: '#94A3B8',

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
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '13px',
    boxShadow: '0 10px 25px rgba(11,26,57,0.12)'
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
  background: '#F8FAFC',
  color: '#0B1A3F',
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
  background: isPinnedMessage ? '#FFF9F1' : '#F8FAFC',
  color: isPinnedMessage ? '#C99758' : '#0B1A3F',
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
    background: '#F8FAFC',
    borderTop: '1px solid #E2E8F0',
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
       color: '#0B1A3F',
       fontSize: '10px',
       fontWeight: '900'
      }}
    >
      Replying to {dmReplyingTo.sender}
    </div>

   <div
    style={{
     marginTop: '2px',
     color: '#64748B',
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
     color: '#94A3B8',
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
   borderTop: '1px solid #E2E8F0',
   display: 'flex',
   alignItems: 'flex-end',
   gap: '10px',
   background: '#FFFFFF',
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
     border: '1.5px solid #E2E8F0',
     background: '#F8FAFC',
     borderRadius: '15px',
     padding: '12px 13px',
     color: '#0B1A3F',
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
     background: '#0B1A3F',
     color: '#FFFFFF',
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
<div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid #E2E8F0' }}> <p style={{ ...bodyText, marginBottom: '10px', textAlign: 'center' }}
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
<Field label="CRN"><input type="text" placeholder="e.g. 12345"
style={modalInput} value={newReview.crn} onChange={event =>
setNewReview({ ...newReview, crn: event.target.value })} /></Field>
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
<Field label="TIME"><input type="text" placeholder="e.g. 10:00 10:50"
style={modalInput} value={newReview.meeting_time} onChange={event =>
setNewReview({ ...newReview, meeting_time: event.target.value })} /></Field>
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
);
}
function TabButton({ active, onClick, icon, label }) {
const normalizedLabel = String(label || '').replace(/\s+/g, ' ').trim();
const tabPalette = {
'Course Match & Swap': { bg: '#F3F7FD', text: '#648CCB', border: '#DDE7F5' },
'Course & Prof Reviews': { bg: '#FFF6F2', text: '#D9896A', border: '#F3DDD4' },
'Curriculum': { bg: '#F7F4FC', text: '#8B78B8', border: '#E7E0F2' },
'Major Q&A': { bg: '#F2F9F7', text: '#5E9A8B', border: '#D9EBE6' },
'Seat Opening Reminders': { bg: '#FFF9F1', text: '#C99758', border: '#F0E2CB' },
'My Posts': { bg: '#FBF5F9', text: '#A87695', border: '#EADDE5' },
'Direct Messages': { bg: '#F4F7FE', text: '#0B1A3F', border: '#DDE3EE' }
};
const tone = tabPalette[normalizedLabel] || {
bg: '#F4F7FE',
text: '#0B1A3F',
border: '#DCE3F0'
};
return (
<button
onClick={onClick}
style={{
...colorTabBtnBase,
background: active ? tone.text : tone.bg,
color: active ? '#FFFFFF' : tone.text,
border: active
? `2px solid ${tone.text}`
: `1.5px solid ${tone.border}`,
boxShadow: active
? `0 6px 16px ${tone.text}28`
: 'none'
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
<input type="text" placeholder="e.g. 11312" style={modalInput}
value={pref[`${prefix}Crn`]} onChange={event => set('Crn',
event.target.value)} />
</Field>
</div>
<Field label="COURSE NAME">
<input type="text" placeholder="e.g. Introduction to Programming"
style={modalInput} value={pref[`${prefix}CourseName`]} onChange={event =>
set('CourseName', event.target.value)} />
</Field>
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
<Field label="DAYS">
<input type="text" placeholder="e.g. MWF" style={modalInput}
value={pref[`${prefix}Days`]} onChange={event => set('Days',
event.target.value)} />
</Field>
<Field label="TIME">
<input type="text" placeholder="e.g. 10:00 AM - 10:50 AM"
style={modalInput} value={pref[`${prefix}Time`]} onChange={event =>
set('Time', event.target.value)} />
</Field>
</div>
</div>
);
}
function SwapCourseBlock({ mode, post, prefix, faded }) {
return (

<div style={{ ...swapCourseBlock, ...(faded ? { opacity: 0.65 } : {}) }}>
<div style={swapCourseHeader}>
<span style={mode === 'HAVE' ? badgeRed : badgeGreen}>{mode}</span>
{post[`${prefix}_crn`] && <span style={smallCrnBadge}>CRN {post[`${prefix}
_crn`]}</span>}
</div>
<h4 style={{ margin: '10px 0 3px', color: '#0B1A3F', fontSize: '16px',
fontWeight: '900' }}>{post[`${prefix}_course`]}</h4>
{post[`${prefix}_course_name`] && <p style={swapCourseName}>{post[`${prefix}_course_name`]}</p>}
<div style={compactCourseInfoGrid}>
<InfoItem label="SECTION" value={post[`${prefix}_section`]} />
<InfoItem label="PROFESSOR" value={post[`${prefix}_prof`]} />
<InfoItem label="DAYS" value={post[`${prefix}_days`]} />
<InfoItem label="TIME" value={post[`${prefix}_time`]} />
</div>
</div>
);
}
function MatchCourseSummary({ label, type, post }) {
return (
<div style={swapCourseBlock}>
<span style={type === 'have' ? badgeRed : badgeGreen}>{label}</span>
<h4 style={{ margin: '10px 0', color: '#0B1A3F', fontWeight: '900' }}
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
<p style={{ margin: 0, fontWeight: '900', color: '#0B1A3F', fontSize:

'14px' }}>{displayName}</p>
<span style={{ fontSize: '10px', color: '#A3AED0', fontWeight: '700' }}

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
<h2 style={{ margin: 0, color: '#0B1A3F', fontWeight: '900', fontSize:
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
'#0B1A3F' }}>{reply.author_name}</p>
<span style={{ fontSize: '9px', color: '#A3AED0', fontWeight: '700' }}>{!
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
<p style={{ margin: '8px 0 0', fontSize: '12px', color: '#475569',
fontWeight: '600', lineHeight: 1.5 }}>{reply.content}</p>
)}
</div>
);
}
const colorTabBtnBase = {
display: 'flex',
alignItems: 'center',
gap: '8px',
padding: '12px 18px',
borderRadius: '14px',

fontWeight: '900',
fontSize: '13px',
cursor: 'pointer',
whiteSpace: 'nowrap',
transition: 'all 0.18s ease'
};
const matchSearchBtn = { background: '#FFFFFF', color: '#0B1A3F', border:
'none', padding: '12px 24px', borderRadius: '14px', fontWeight: '900', fontSize:
'14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };
const primaryActionBtn = { background: '#0B1A3F', color: '#FFFFFF', border:
'none', padding: '10px 16px', borderRadius: '12px', fontWeight: '800', fontSize:
'13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent:
'center', gap: '6px' };
const secondaryActionBtn = { background: '#FFFFFF', color: '#0B1A3F', border:
'1.5px solid #E2E8F0', padding: '10px 16px', borderRadius: '12px', fontWeight:
'800', fontSize: '13px', cursor: 'pointer' };
const primarySaveBtn = { width: '100%', background: '#0B1A3F', color:
'#FFFFFF', border: 'none', padding: '14px', borderRadius: '14px', fontWeight:
'900', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center',
justifyContent: 'center', gap: '8px' };
const sectionHeading = { margin: '0 0 15px', fontSize: '20px', fontWeight: '900',
color: '#0B1A3F' };
const sectionDescription = { margin: '0 0 18px', fontSize: '13px', color:
'#64748B', fontWeight: '600', lineHeight: 1.5 };
const sectionTopRow = { display: 'flex', alignItems: 'center', justifyContent:
'space-between', gap: '15px', flexWrap: 'wrap' };
const swapCard = { background: '#FFFFFF', padding: '20px', borderRadius:
'20px', border: '1.5px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
transition: 'all 0.2s ease' };
const takenSwapCard = { background: '#FBFCFE', border: '1.5px solid #CBD5E1' }; const reviewCard = { background: '#FFFFFF', padding: '22px', borderRadius:
'20px', border: '1.5px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }; const emptyCard = { background: '#FFFFFF', border: '1.5px dashed #CBD5E1',
padding: '30px', borderRadius: '20px', textAlign: 'center', color: '#94A3B8',
fontWeight: '700', fontSize: '14px' };
const loadingBox = { display: 'flex', alignItems: 'center', justifyContent: 'center',
gap: '8px', padding: '35px', color: '#A3AED0', fontWeight: '700' };
const avatarCircle = { width: '38px', height: '38px', borderRadius: '50%',
background: '#F8FAFC', border: '1.5px solid #E2E8F0', color: '#0B1A3F',
fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center',
fontSize: '14px', flexShrink: 0 };
const swapCourseBlock = { background: '#F8FAFC', border: '1px solid #E9EDF5', borderRadius: '15px', padding: '15px' }; const swapCourseHeader = { display: 'flex', justifyContent: 'space-between',
alignItems: 'center', gap: '8px' };

const swapCourseName = { margin: '0 0 12px', color: '#64748B', fontSize:
'11px', fontWeight: '700', lineHeight: 1.4 };

const compactCourseInfoGrid = { display: 'grid', gridTemplateColumns:
'repeat(2, minmax(0, 1fr))', gap: '10px', paddingTop: '11px', borderTop: '1px solid #E2E8F0' }; const swapArrowDivider = { position: 'relative', height: '34px', display: 'flex',
alignItems: 'center', justifyContent: 'center' };
const swapArrowCircle = { width: '30px', height: '30px', borderRadius: '50%',
background: '#FFFFFF', border: '1.5px solid #E2E8F0', color: '#94A3B8',
display: 'flex', alignItems: 'center', justifyContent: 'center' };
const smallCrnBadge = { background: '#FFFFFF', color: '#64748B', border: '1px solid #E2E8F0', padding: '4px 8px', borderRadius: '8px', fontSize: '9px', fontWeight: '900' };
const availableStatusBadge = { background: '#F2F9F7', color: '#5E9A8B',
border: '1px solid #D9EBE6', padding: '5px 9px', borderRadius: '9px', fontSize:
'9px', fontWeight: '900', letterSpacing: '0.4px' };
const takenStatusBadge = { background: '#F1F5F9', color: '#64748B', border:
'1px solid #CBD5E1', padding: '5px 9px', borderRadius: '9px', fontSize: '9px',
fontWeight: '900', letterSpacing: '0.4px' };
const takenNotice = { marginTop: '15px', background: '#F1F5F9', color:
'#64748B', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius:
'11px', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center',
justifyContent: 'center', gap: '6px' };
const markTakenButton = { width: '100%', background: '#FFFFFF', color:
'#0B1A3F', border: '1.5px solid #CBD5E1', padding: '9px 12px', borderRadius:
'11px', fontWeight: '800', fontSize: '11px', cursor: 'pointer', display: 'flex',
alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px' };
const reopenSwapButton = { ...markTakenButton, color: '#475569' };
const swapFormSection = { background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '17px', display: 'flex', flexDirection: 'column', gap: '12px' };
const swapFormSectionHeader = { display: 'flex', alignItems: 'center', gap:
'10px', marginBottom: '2px' };
const swapFormTitle = { margin: 0, color: '#0B1A3F', fontSize: '14px',
fontWeight: '900' };
const swapFormSubtitle = { margin: '2px 0 0', color: '#94A3B8', fontSize:
'10px', fontWeight: '700' };
const badgeRed = { background: '#FFF6F2', color: '#D9896A', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '900' }; const badgeGreen = { background: '#F2F9F7', color: '#5E9A8B', padding: '4px 9px', borderRadius: '7px', fontSize: '10px', fontWeight: '900' }; const badgeGray = { background: '#F1F5F9', color: '#64748B', padding: '4px 9px', borderRadius: '7px', fontSize: '10px', fontWeight: '900' }; const reviewTag = { background: '#FFF9F1', color: '#D97706', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800' }; const dmBtnStyle = { width: '100%', background: '#FFFFFF', border: '1.5px solid #E2E8F0', color: '#0B1A3F', padding: '10px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' };

const modalInput = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontSize: '13px', fontWeight: '700', color: '#0B1A3F', outline: 'none', background: '#FFFFFF' };
const selectInputStyle = { width: '100%', boxSizing: 'border-box', padding:
'12px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontSize:
'14px', fontWeight: '800', color: '#0B1A3F', outline: 'none', background:
'#FFFFFF' };
const fieldLabel = { fontSize: '10px', fontWeight: '900', color: '#0B1A3F',
marginBottom: '6px', display: 'block', letterSpacing: '0.6px' };
const checkboxLabel = { display: 'flex', alignItems: 'center', gap: '8px', cursor:
'pointer', fontSize: '12px', fontWeight: '700', color: '#0B1A3F' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(11,26,63,0.42)',
backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent:
'center', padding: '20px', zIndex: 1000 };
const modalCardLarge = { width: '100%', maxWidth: '650px', maxHeight:
'90vh', overflowY: 'auto', padding: '28px', boxSizing: 'border-box', background:
'#FFFFFF', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.18)' };
const dmSearchCard = { background: '#FFFFFF', border: '1.5px solid #E2E8F0',
borderRadius: '16px', padding: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }; const dmSearchInput = { ...modalInput, paddingLeft: '42px', height: '46px' };
const dmSearchIcon = { color: '#94A3B8', pointerEvents: 'none', flexShrink: 0 };
const dmSearchResultsBox = { marginTop: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '260px', overflowY: 'auto' };
const dmSearchResultRow = { width: '100%', border: 'none', background:
'#FFFFFF', borderRadius: '12px', padding: '10px', display: 'flex', alignItems:
'center', gap: '10px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' };
const dmSearchStatus = { padding: '14px', textAlign: 'center', color: '#94A3B8',
fontSize: '12px', fontWeight: '700' };

const instagramPinButton = { flexShrink: 0, width: '34px', height: '34px',
borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
cursor: 'pointer' };
const instagramHeaderPin = { width: '38px', height: '38px', borderRadius:
'11px', border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex',
alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const instagramHeaderPinActive = { background: '#FFF9F1', borderColor:
'#C99758' };
const instagramPinnedMessageLabel = { display: 'flex', alignItems: 'center',
gap: '4px', color: '#C99758', fontSize: '9px', fontWeight: '900', marginBottom:
'4px' };
const instagramReactionRow = { display: 'flex', gap: '4px', flexWrap: 'wrap',

marginTop: '4px' };
const instagramReactionPill = { border: '1px solid #E2E8F0', background:

'#FFFFFF', borderRadius: '999px', padding: '3px 8px', fontSize: '11px', cursor:
'pointer', color: '#0B1A3F', fontWeight: '800' };
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
const instagramReplyQuote = { display: 'flex', flexDirection: 'column', gap: '2px',
padding: '7px 9px', marginBottom: '7px', borderRadius: '9px', background:
'#FFFFFF', borderLeft: '3px solid #0B1A3F', color: '#64748B', fontSize: '10px' };
const instagramReplyQuoteMine = { background: 'rgba(255,255,255,0.13)',
borderLeftColor: 'rgba(255,255,255,0.7)', color: 'rgba(255,255,255,0.9)' };
const instagramReplyComposerPreview = { padding: '10px 20px', borderTop:
'1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center',
justifyContent: 'space-between', gap: '12px', color: '#0B1A3F', fontSize: '10px',
flexShrink: 0, position: 'relative', zIndex: 3 };
const instagramReplyClose = { border: 'none', background: 'transparent', color:
'#94A3B8', cursor: 'pointer', display: 'flex' };
const instagramDmShell = { display: 'grid', gridTemplateColumns: '390px minmax(0, 1fr)', minHeight: '700px', height: '76vh', maxHeight: '880px', background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '24px',
overflow: 'hidden', boxShadow: '0 10px 30px rgba(11,26,57,0.08)' };
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
const instagramSearchInput = { width: '100%', minWidth: 0, height: '100%',
border: 'none', outline: 'none', padding: 0, margin: 0, background: 'transparent',

color: '#0B1A3F', fontSize: '13px', fontWeight: '700', fontFamily: 'inherit',
boxSizing: 'border-box', lineHeight: 1 };
const instagramSearchResults = { margin: '0 16px 12px', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '6px', maxHeight: '250px', overflowY: 'auto', background: '#FFFFFF', boxShadow: '0 8px 22px rgba(11,26,57,0.08)',
zIndex: 2 };
const instagramSearchResultRow = { width: '100%', border: 'none', background:
'#FFFFFF', borderRadius: '11px', padding: '11px', display: 'flex', alignItems:
'center', gap: '12px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' };
const instagramThreadList = { flex: 1, overflowY: 'auto', padding: '6px 10px 16px' }; const instagramThreadRow = { width: '100%', border: 'none', background:
'transparent', borderRadius: '16px', padding: '13px 12px', display: 'flex', gap:
'13px', alignItems: 'center', textAlign: 'left', cursor: 'pointer', fontFamily:
'inherit' };
const instagramThreadRowActive = { background: '#F1F5F9' };
const instagramAvatar = { width: '48px', height: '48px', borderRadius: '50%',
flexShrink: 0, border: '1.5px solid #E2E8F0', background: '#F8FAFC', color:
'#0B1A3F', fontSize: '14px', fontWeight: '900', display: 'flex', alignItems:
'center', justifyContent: 'center' };
const instagramAvatarLarge = { ...instagramAvatar, width: '52px', height: '52px',
fontSize: '15px' };
const instagramPersonName = { margin: 0, color: '#0B1A3F', fontSize: '14px',
fontWeight: '900', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow:
'ellipsis' };
const instagramPersonMeta = { margin: '3px 0 0', color: '#A3AED0', fontSize:
'10px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden',
textOverflow: 'ellipsis' };
const instagramThreadTopLine = { display: 'flex', alignItems: 'center',
justifyContent: 'space-between', gap: '8px' };
const instagramThreadDate = { color: '#A3AED0', fontSize: '8px', fontWeight:
'700', flexShrink: 0 };
const instagramMessagePreview = { margin: '5px 0 0', color: '#64748B',
fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden',
textOverflow: 'ellipsis' };
const instagramEmptyThreads = { padding: '28px 14px', textAlign: 'center',
color: '#A3AED0', fontSize: '11px', fontWeight: '700' };
const instagramChatPanel = { minWidth: 0, minHeight: 0, height: '100%',
display: 'flex', flexDirection: 'column', background: '#FFFFFF', overflow:
'hidden' };
const instagramChatHeader = { minHeight: '86px', padding: '16px 24px',
borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center',
justifyContent: 'space-between' };
const instagramChatName = { margin: 0, color: '#0B1A3F', fontSize: '17px',
fontWeight: '900' };
const instagramChatEmail = { margin: '4px 0 0', color: '#94A3B8', fontSize:
'11px', fontWeight: '700' };

const instagramSwapContext = { margin: '10px 18px 0', background: '#F8FAFC',
border: '1px solid #E2E8F0', borderRadius: '11px', padding: '9px 11px', display:
'flex', alignItems: 'center', gap: '7px', color: '#64748B', fontSize: '10px',

fontWeight: '800' };
const instagramChatHistory = { position: 'relative', flex: '1 1 auto', minHeight: 0,
overflowY: 'auto', overflowX: 'hidden', overscrollBehavior: 'contain',
WebkitOverflowScrolling: 'touch', padding: '26px 24px', background:
'#FFFFFF' };
const instagramEmptyChat = { height: '100%', display: 'flex', alignItems:
'center', justifyContent: 'center', color: '#A3AED0', fontSize: '12px', fontWeight:
'700' };
const instagramNoChat = { height: '100%', display: 'flex', flexDirection:
'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
padding: '35px' };
const instagramNoChatIcon = { width: '72px', height: '72px', borderRadius:
'50%', border: '2px solid #0B1A3F', color: '#0B1A3F', display: 'flex', alignItems:
'center', justifyContent: 'center', marginBottom: '14px' };
const instagramNoChatTitle = { margin: 0, color: '#0B1A3F', fontSize: '18px',
fontWeight: '900' };
const instagramNoChatText = { margin: '7px 0 0', color: '#94A3B8', maxWidth:
'320px', fontSize: '11px', fontWeight: '700', lineHeight: 1.5 };
const instagramBubble = { maxWidth: '72%', padding: '12px 14px',
borderRadius: '19px', fontSize: '13px' };
const instagramBubbleMine = { background: '#0B1A3F', color: '#FFFFFF',
borderBottomRightRadius: '6px' };
const instagramBubbleTheirs = { background: '#F1F5F9', color: '#0B1A3F',
borderBottomLeftRadius: '6px' };
const instagramBubbleText = { margin: 0, fontSize: '13px', lineHeight: 1.5,
fontWeight: '600', whiteSpace: 'pre-wrap', wordBreak: 'break-word' };
const instagramBubbleFooter = { display: 'flex', alignItems: 'center',
justifyContent: 'space-between', gap: '10px', marginTop: '5px', fontSize: '8px',
opacity: 0.7 };
const instagramComposer = { borderTop: '1px solid #E2E8F0', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', flexShrink: 0, position: 'relative', zIndex: 3 };
const instagramComposerInput = { ...modalInput, flex: 1, height: '50px',
minHeight: '50px', maxHeight: '120px', resize: 'none', borderRadius: '20px',
background: '#F8FAFC', padding: '14px 16px', fontSize: '13px' };
const instagramSendButton = { width: '48px', height: '48px', borderRadius:
'50%', border: 'none', background: '#0B1A3F', color: '#FFFFFF', display: 'flex',
alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 };
const chatModal = { width: 'min(860px, 94vw)', height: 'min(760px, 90vh)',
padding: '24px', boxSizing: 'border-box', background: '#FFFFFF', borderRadius:
'22px', boxShadow: '0 20px 50px rgba(0,0,0,0.20)', display: 'flex', flexDirection:
'column' };
const modalForm = { display: 'flex', flexDirection: 'column', gap: '14px' };

const twoColumnGrid = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }; const formBottomRow = { display: 'flex', justifyContent: 'space-between',
alignItems: 'center', gap: '15px', flexWrap: 'wrap' };

const iconActionBtn = { background: '#FFFFFF', border: '1.5px solid #E2E8F0',
padding: '7px', borderRadius: '8px', cursor: 'pointer', color: '#64748B', display:
'flex', alignItems: 'center', justifyContent: 'center' };
const closeModalBtn = { background: 'transparent', border: 'none', color:
'#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent:
'center', padding: '4px' };
const courseInfoGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', padding: '15px', margin: '15px 0', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' };
const infoLabel = { display: 'block', color: '#94A3B8', fontSize: '9px',
fontWeight: '900', letterSpacing: '0.6px', marginBottom: '3px' };
const infoValue = { margin: 0, color: '#0B1A3F', fontSize: '12px', fontWeight:
'800' };
const bodyText = { margin: 0, fontSize: '13px', color: '#334155', fontWeight:
'600', lineHeight: 1.6 };
const replySection = { display: 'flex', flexDirection: 'column', gap: '9px',
marginTop: '15px', paddingLeft: '14px', borderLeft: '2px solid #E2E8F0' };
const replyCard = { background: '#F8FAFC', padding: '11px 13px', borderRadius:
'12px', border: '1px solid #E2E8F0' };
const replyButton = { background: 'none', border: 'none', padding: 0, color:
'#0B1A3F', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex',
alignItems: 'center', gap: '5px' };
const reminderFormGrid = { display: 'grid', gridTemplateColumns:
'repeat(autofit, minmax(180px, 1fr))', gap: '10px' };
const bellCircle = { width: '38px', height: '38px', borderRadius: '12px',
background: '#F8FAFC', color: '#0B1A3F', display: 'flex', alignItems: 'center',
justifyContent: 'center', border: '1px solid #E2E8F0' };
const smallOutlineBtn = { background: '#FFFFFF', border: '1px solid #E2E8F0',
borderRadius: '9px', color: '#0B1A3F', padding: '7px 10px', cursor: 'pointer',
fontSize: '11px', fontWeight: '800' };
const infoNotice = { display: 'flex', alignItems: 'flex-start', gap: '10px', padding:
'15px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius:
'14px', color: '#0B1A3F', fontSize: '12px', fontWeight: '600' };
const successNotice = { background: '#F2F9F7', color: '#5E9A8B', padding:
'15px', borderRadius: '15px', marginBottom: '18px', fontWeight: '900' };
const warningNotice = { background: '#FFF9F1', color: '#C99758', padding:
'15px', borderRadius: '15px', marginBottom: '18px', fontWeight: '900' };
const chatHistory = { flex: 1, minHeight: '420px', overflowY: 'auto', padding:
'16px', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '12px' }; const emptyChat = { height: '100%', display: 'flex', alignItems: 'center',
justifyContent: 'center', textAlign: 'center', color: '#94A3B8', fontSize: '13px',

fontWeight: '700' };
const messageBubble = { maxWidth: '75%', padding: '10px 12px', borderRadius:
'14px' };
const messageDeleteBtn = { background: 'transparent', border: 'none', color:
'inherit', opacity: 0.75, cursor: 'pointer', display: 'flex', padding: 0 };

const chatComposer = { display: 'flex', alignItems: 'flex-end', gap: '8px' };
const matchFilterActiveBtn = { background: '#0B1A3F', color: '#FFFFFF', border:
'1.5px solid #0B1A3F', padding: '8px 12px', borderRadius: '10px', fontWeight:
'800', fontSize: '11px', cursor: 'pointer' };
const matchFilterInactiveBtn = { background: '#FFFFFF', color: '#64748B',
border: '1.5px solid #E2E8F0', padding: '8px 12px', borderRadius: '10px',
fontWeight: '800', fontSize: '11px', cursor: 'pointer' };
const exactMatchBadge = { background: '#F2F9F7', color: '#5E9A8B', border:
'1px solid #D9EBE6', padding: '5px 9px', borderRadius: '9px', fontSize: '9px',
fontWeight: '900', whiteSpace: 'nowrap' };
const similarMatchBadge = { background: '#FFF9F1', color: '#C99758', border:
'1px solid #F0E2CB', padding: '5px 9px', borderRadius: '9px', fontSize: '9px',
fontWeight: '900', whiteSpace: 'nowrap' };
const possibleMatchBadge = { background: '#F1F5F9', color: '#64748B',
border: '1px solid #CBD5E1', padding: '5px 9px', borderRadius: '9px', fontSize:
'9px', fontWeight: '900', whiteSpace: 'nowrap' };
const matchDetailNotice = { marginTop: '12px', padding: '10px 12px',
borderRadius: '11px', background: '#F8FAFC', border: '1px solid #E2E8F0',
fontSize: '11px', color: '#64748B', fontWeight: '700' };
const differentDetailsText = { marginTop: '8px', fontSize: '10px', color:
'#94A3B8', fontWeight: '700' };
const myPostCard = { ...reviewCard, width: '100%', textAlign: 'left', cursor:
'pointer', fontFamily: 'inherit' };
const myPostSourceBadge = { background: '#EEF2FF', color: '#0B1A3F',
border: '1px solid #DDE5F4', padding: '5px 9px', borderRadius: '8px', fontSize:
'9px', fontWeight: '900' };
const myPostTypeBadge = { background: '#F8FAFC', color: '#64748B', border:
'1px solid #E2E8F0', padding: '5px 9px', borderRadius: '8px', fontSize: '9px',
fontWeight: '900' };
const myPostSubtitle = { margin: '6px 0 0', color: '#64748B', fontSize: '12px',
fontWeight: '600', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis' };

