import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Compass,
  FolderOpen,
  GraduationCap,
  Landmark,
  Megaphone,
  MessageSquare,
  Sparkles,
  Users,
  HelpCircle,
  Repeat2,
  Star,
  Plus,
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import {
  getAnnouncements,
  getCampusNews,
  getEvents,
  getResources,
} from '../lib/campusHub';

import {
  PageShell,
  SectionHeader,
  StatTile,
  ProgressRing,
} from '../components/luminous';

// =========================================================
// CAMPORA THEME
// =========================================================

const PURPLE = '#8B78B8';
const PURPLE_SOFT = '#F7F4FC';
const PURPLE_BORDER = '#E7E0F2';

const BLUE = '#648CCB';
const BLUE_SOFT = '#F3F7FD';
const BLUE_BORDER = '#DDE7F5';

const TERRACOTTA = '#D9896A';
const TERRACOTTA_SOFT = '#FFF6F2';
const TERRACOTTA_BORDER = '#F3DDD4';

const TEAL = '#5E9A8B';
const TEAL_SOFT = '#F2F9F7';
const TEAL_BORDER = '#D9EBE6';

const GOLD = '#C99758';
const GOLD_SOFT = '#FFF9F1';
const GOLD_BORDER = '#F0E2CB';

const ROSE = '#C76E7D';
const ROSE_SOFT = '#FFF5F6';
const ROSE_BORDER = '#F0DDE1';

const CAMPUS_PULSE_CATEGORIES = [
  'All',
  'Clubs & Events',
  'Questions',
  'Campus Life',
  'Complaints',
  'Lost & Found',
  'Opportunities',
];

const campusPulseTone = (category) => {
  switch (category) {
    case 'Clubs & Events':
      return { accent: TEAL, soft: TEAL_SOFT, border: TEAL_BORDER };
    case 'Questions':
      return { accent: PURPLE, soft: PURPLE_SOFT, border: PURPLE_BORDER };
    case 'Campus Life':
      return { accent: BLUE, soft: BLUE_SOFT, border: BLUE_BORDER };
    case 'Complaints':
      return { accent: ROSE, soft: ROSE_SOFT, border: ROSE_BORDER };
    case 'Lost & Found':
      return { accent: GOLD, soft: GOLD_SOFT, border: GOLD_BORDER };
    case 'Opportunities':
      return { accent: TERRACOTTA, soft: TERRACOTTA_SOFT, border: TERRACOTTA_BORDER };
    default:
      return { accent: BLUE, soft: BLUE_SOFT, border: BLUE_BORDER };
  }
};

const TODO_PRIORITIES = [
  {
    key: 'high',
    label: 'High Priority',
    accent: ROSE,
    soft: ROSE_SOFT,
    border: ROSE_BORDER,
  },
  {
    key: 'medium',
    label: 'Medium Priority',
    accent: GOLD,
    soft: GOLD_SOFT,
    border: GOLD_BORDER,
  },
  {
    key: 'low',
    label: 'Low Priority',
    accent: BLUE,
    soft: BLUE_SOFT,
    border: BLUE_BORDER,
  },
];

const REGISTRATION_TABS = [
  'Reminders',
  'Swaps',
  'Reviews',
  'Questions',
];

const HUB_TABS = [
  'Announcements',
  'News',
  'Events',
  'Resources',
];

// =========================================================
// HELPERS
// =========================================================

const localKey = (userId, name) =>
  `campora-course-management:${userId || 'guest'}:${name}`;

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';

  return 'Good Evening';
}

function capitalizeName(name) {
  if (!name) return 'Student';

  return String(name)
    .split(' ')
    .filter(Boolean)
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    )
    .join(' ');
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatPlannerTime(value) {
  if (!value) return '';

  const normalized =
    String(value).length === 5
      ? `${value}:00`
      : value;

  const date = new Date(
    `2000-01-01T${normalized}`
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTimeRange(start, end) {
  if (!start && !end) return 'All day';

  if (start && end) {
    return `${formatPlannerTime(
      start
    )} – ${formatPlannerTime(end)}`;
  }

  return formatPlannerTime(start || end);
}

function formatUpcomingDate(value) {
  if (!value) return 'Upcoming';

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  if (
    date.toDateString() ===
    tomorrow.toDateString()
  ) {
    return 'Tomorrow';
  }

  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function withAlpha(hex, alpha = '18') {
  const value = String(hex || '').trim();

  if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
    return `${value}${alpha}`;
  }

  return BLUE_SOFT;
}

function compactDate(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

function messagePreview(message) {
  return String(
    message?.content ||
      message?.message ||
      message?.text ||
      ''
  )
    .replace(/\[\[CAMPORA_[^\]]+\]\]/g, '')
    .trim();
}

function plannerTypeIcon(type) {
  const normalized = String(
    type || ''
  ).toLowerCase();

  if (
    normalized.includes('class') ||
    normalized.includes('course')
  ) {
    return GraduationCap;
  }

  if (
    normalized.includes('exam') ||
    normalized.includes('quiz')
  ) {
    return ClipboardCheck;
  }

  return CalendarDays;
}

function timeParts(value) {
  const normalized =
    String(value || '').length === 5
      ? `${value}:00`
      : value;

  const date = new Date(
    `2000-01-01T${normalized}`
  );

  if (Number.isNaN(date.getTime())) {
    return {
      time: String(value || '--'),
      meridian: '',
    };
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const meridian = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;

  return {
    time: `${hour12}:${String(minutes).padStart(2, '0')}`,
    meridian,
  };
}

function isPastTime(value) {
  if (!value) return false;

  const now = new Date();

  const current = `${String(
    now.getHours()
  ).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  return (
    String(value).substring(0, 5) <=
    current
  );
}

// =========================================================
// DASHBOARD
// =========================================================

export default function Dashboard() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);

  const [plannerItems, setPlannerItems] =
    useState([]);

  const [courses, setCourses] =
    useState([]);

  const [courseResources, setCourseResources] =
    useState([]);

  const [courseCredits, setCourseCredits] =
    useState({});

  const [courseAssignments, setCourseAssignments] =
    useState([]);

  const [courseEvents, setCourseEvents] =
    useState([]);

  const [todos, setTodos] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [announcement, setAnnouncement] =
    useState(null);

  const [allNotifications, setAllNotifications] =
    useState([]);

  const [registrationReminders, setRegistrationReminders] =
    useState([]);

  const [registrationSwaps, setRegistrationSwaps] =
    useState([]);

  const [registrationReviews, setRegistrationReviews] =
    useState([]);

  const [registrationQuestions, setRegistrationQuestions] =
    useState([]);

  const [campusPulsePosts, setCampusPulsePosts] =
    useState([]);

  const [studyGroups, setStudyGroups] =
    useState([]);

  const [studyGroupMessages, setStudyGroupMessages] =
    useState([]);

  const [campusHubAnnouncements, setCampusHubAnnouncements] =
    useState([]);

  const [campusHubNews, setCampusHubNews] =
    useState([]);

  const [campusHubEvents, setCampusHubEvents] =
    useState([]);

  const [campusHubResources, setCampusHubResources] =
    useState([]);

  const [campusPulseCategory, setCampusPulseCategory] =
    useState('All');

  const [todoPriorityIndex, setTodoPriorityIndex] =
    useState(0);

  const [notificationModeIndex, setNotificationModeIndex] =
    useState(0);

  const [registrationTab, setRegistrationTab] =
    useState('Reminders');

  const [hubTab, setHubTab] =
    useState('Announcements');

  const [selectedMiniGroupId, setSelectedMiniGroupId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const loadDashboard = async ({
    silent = false,
  } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    setError('');

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        navigate('/login', {
          replace: true,
        });

        return;
      }

      setUserId(user.id);

      const credits = safeParse(
        localStorage.getItem(
          localKey(user.id, 'creditsByCourse')
        ),
        {}
      );

      const assignments = safeParse(
        localStorage.getItem(
          localKey(user.id, 'assignments')
        ),
        []
      );

      const events = safeParse(
        localStorage.getItem(
          localKey(user.id, 'events')
        ),
        []
      );

      setCourseCredits(credits);
      setCourseAssignments(assignments);
      setCourseEvents(events);

      const [
        profileResult,
        plannerResult,
        coursesResult,
        resourcesResult,
        todosResult,
        notificationsResult,
        announcementsResult,
        campusNewsResult,
        campusEventsResult,
        campusResourcesResult,
        campusPulseResult,
        groupMembershipResult,
        studyGroupsResult,
        registrationRemindersResult,
        registrationSwapsResult,
        registrationReviewsResult,
        registrationQuestionsResult,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle(),

        supabase
          .from('planner_courses')
          .select('*')
          .eq('user_id', user.id)
          .order('date', {
            ascending: true,
          })
          .order('start_time', {
            ascending: true,
          }),

        supabase
          .from('courses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', {
            ascending: false,
          }),

        supabase
          .from('course_resources')
          .select('id,course_id')
          .eq('user_id', user.id),

        supabase
          .from('todos')
          .select('*')
          .eq('profile_id', user.id)
          .order('created_at', {
            ascending: false,
          }),

        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', {
            ascending: false,
          }),

        getAnnouncements().catch(() => []),

        getCampusNews().catch(() => []),

        getEvents({
          upcoming: true,
        }).catch(() => []),

        getResources().catch(() => []),

        supabase
          .from('campus_pulse_posts')
          .select('*')
          .order('created_at', {
            ascending: false,
          }),

        supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id),

        supabase
          .from('study_groups')
          .select('*')
          .order('created_at', {
            ascending: false,
          }),

        supabase
          .from('course_reminders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', {
            ascending: false,
          }),

        supabase
          .from('registration_swaps')
          .select('*')
          .order('created_at', {
            ascending: false,
          }),

        supabase
          .from('course_reviews')
          .select('*')
          .order('created_at', {
            ascending: false,
          }),

        supabase
          .from('major_questions')
          .select('*')
          .order('created_at', {
            ascending: false,
          }),
      ]);

      setProfile(
        profileResult.data || {
          name:
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'Student',
        }
      );

      setPlannerItems(
        plannerResult.data || []
      );

      setCourses(
        coursesResult.data || []
      );

      setCourseResources(
        resourcesResult.data || []
      );

      setTodos(
        todosResult.data || []
      );

      const notifications =
        notificationsResult.data || [];

      setAllNotifications(
        notifications
      );

      setUnreadCount(
        notifications
          .filter(item => !item.read)
          .length
      );

      const announcements = Array.isArray(
        announcementsResult
      )
        ? announcementsResult
        : [];

      setCampusHubAnnouncements(
        announcements
      );

      setCampusHubNews(
        Array.isArray(campusNewsResult)
          ? campusNewsResult
          : []
      );

      setCampusHubEvents(
        Array.isArray(campusEventsResult)
          ? campusEventsResult
          : []
      );

      setCampusHubResources(
        Array.isArray(campusResourcesResult)
          ? campusResourcesResult
          : []
      );

      setAnnouncement(
        announcements.find(
          item => item.is_pinned
        ) ||
          announcements[0] ||
          null
      );

      setCampusPulsePosts(
        campusPulseResult.data || []
      );

      setRegistrationReminders(
        registrationRemindersResult.data || []
      );

      setRegistrationSwaps(
        registrationSwapsResult.data || []
      );

      setRegistrationReviews(
        registrationReviewsResult.data || []
      );

      setRegistrationQuestions(
        registrationQuestionsResult.data || []
      );

      const joinedIds =
        (groupMembershipResult.data || [])
          .map(item => item.group_id)
          .filter(Boolean);

      const joinedIdSet =
        new Set(joinedIds);

      const joinedGroups =
        (studyGroupsResult.data || [])
          .filter(
            group =>
              joinedIdSet.has(group.id) ||
              group.creator_id === user.id
          );

      setStudyGroups(
        joinedGroups
      );

      if (
        joinedGroups.length > 0 &&
        !selectedMiniGroupId
      ) {
        setSelectedMiniGroupId(
          joinedGroups[0].id
        );
      }

      const visibleGroupIds =
        joinedGroups
          .map(group => group.id)
          .filter(Boolean);

      if (visibleGroupIds.length > 0) {
        const {
          data: groupMessagesData,
          error: groupMessagesError,
        } = await supabase
          .from('group_messages')
          .select('*')
          .in(
            'group_id',
            visibleGroupIds
          )
          .order('created_at', {
            ascending: false,
          })
          .limit(60);

        if (groupMessagesError) {
          console.error(
            'Dashboard group messages error:',
            groupMessagesError
          );
        }

        setStudyGroupMessages(
          groupMessagesData || []
        );
      } else {
        setStudyGroupMessages([]);
      }
    } catch (err) {
      console.error(
        'Dashboard load error:',
        err
      );

      setError(
        err?.message ||
          'Could not load your dashboard.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    const handleFocus = () => {
      loadDashboard({
        silent: true,
      });
    };

    window.addEventListener(
      'focus',
      handleFocus
    );

    return () => {
      window.removeEventListener(
        'focus',
        handleFocus
      );
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const plannerChannel = supabase
      .channel(
        `dashboard_planner_${userId}`
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'planner_courses',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadDashboard({
            silent: true,
          });
        }
      )
      .subscribe();

    const notificationChannel = supabase
      .channel(
        `dashboard_notifications_${userId}`
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadDashboard({
            silent: true,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(
        plannerChannel
      );

      supabase.removeChannel(
        notificationChannel
      );
    };
  }, [userId]);

  const todayKey =
    localDateKey();

  const todaysSchedule =
    useMemo(() => {
      return plannerItems
        .filter(
          item =>
            item.date === todayKey
        )
        .sort((a, b) =>
          String(
            a.start_time || '99:99'
          ).localeCompare(
            String(
              b.start_time ||
                '99:99'
            )
          )
        );
    }, [
      plannerItems,
      todayKey,
    ]);

  const upcomingPlanner =
    useMemo(() => {
      return plannerItems
        .filter(item => {
          if (!item.date) {
            return false;
          }

          if (item.is_completed) {
            return false;
          }

          if (item.date < todayKey) {
            return false;
          }

          const type =
            String(
              item.type || ''
            ).toLowerCase();

          return !type.includes(
            'class'
          );
        })
        .sort((a, b) => {
          const dateSort =
            String(
              a.date || ''
            ).localeCompare(
              String(
                b.date || ''
              )
            );

          if (dateSort !== 0) {
            return dateSort;
          }

          return String(
            a.start_time || ''
          ).localeCompare(
            String(
              b.start_time || ''
            )
          );
        })
        .slice(0, 4);
    }, [
      plannerItems,
      todayKey,
    ]);

  const activeAssignments =
    useMemo(
      () =>
        courseAssignments.filter(
          assignment =>
            !assignment.completed
        ),
      [courseAssignments]
    );

  const upcomingCourseEvents =
    useMemo(() => {
      const today = new Date();
      today.setHours(
        0,
        0,
        0,
        0
      );

      return courseEvents.filter(
        event => {
          if (
            !event.date ||
            event.completed
          ) {
            return false;
          }

          const date = new Date(
            `${event.date}T00:00:00`
          );

          return (
            !Number.isNaN(
              date.getTime()
            ) &&
            date >= today
          );
        }
      );
    }, [courseEvents]);

  const totalCredits =
    useMemo(() => {
      return courses.reduce(
        (sum, course) =>
          sum +
          Math.max(
            0,
            Number(
              courseCredits[
                course.id
              ]
            ) || 0
          ),
        0
      );
    }, [
      courses,
      courseCredits,
    ]);

  const remainingTodos =
    useMemo(
      () =>
        todos.filter(
          task =>
            !task.completed
        ),
      [todos]
    );

  const completedTodos =
    useMemo(
      () =>
        todos.filter(
          task =>
            task.completed
        ),
      [todos]
    );

  const todoProgress =
    todos.length === 0
      ? 0
      : Math.round(
          (completedTodos.length /
            todos.length) *
            100
        );

  const filteredCampusPulse =
    useMemo(() => {
      return campusPulsePosts
        .filter(post => {
          if (
            campusPulseCategory === 'All'
          ) {
            return true;
          }

          return (
            post.category ===
            campusPulseCategory
          );
        })
        .slice(0, 4);
    }, [
      campusPulsePosts,
      campusPulseCategory,
    ]);

  const activeTodoPriority =
    TODO_PRIORITIES[
      todoPriorityIndex
    ];

  const priorityTodos =
    useMemo(() => {
      return remainingTodos
        .filter(
          task =>
            String(
              task.priority || ''
            )
              .trim()
              .toLowerCase() ===
            activeTodoPriority.key
        )
        .slice(0, 4);
    }, [
      remainingTodos,
      activeTodoPriority.key,
    ]);

  const notificationModes = [
    'Notifications',
    'Reminders',
  ];

  const activeNotificationMode =
    notificationModes[
      notificationModeIndex
    ];

  const plannerReminders =
    useMemo(() => {
      return plannerItems
        .filter(
          item =>
            item.reminder === true ||
            item.has_reminder === true
        )
        .map(item => ({
          id: `planner-${item.id}`,
          title:
            item.name ||
            item.title ||
            'Planner Reminder',
          message: [
            item.type,
            item.date
              ? formatUpcomingDate(
                  item.date
                )
              : '',
          ]
            .filter(Boolean)
            .join(' • '),
          created_at:
            item.created_at ||
            item.date,
        }));
    }, [plannerItems]);

  const dashboardReminders =
    useMemo(() => {
      const registration =
        registrationReminders.map(
          reminder => ({
            id: `registration-${reminder.id}`,
            title:
              reminder.course_name ||
              reminder.course_code ||
              'Registration Reminder',
            message: [
              reminder.crn
                ? `CRN ${reminder.crn}`
                : '',
              reminder.target_section
                ? `Section ${reminder.target_section}`
                : '',
              reminder.notes || '',
            ]
              .filter(Boolean)
              .join(' • '),
            created_at:
              reminder.created_at,
          })
        );

      return [
        ...registration,
        ...plannerReminders,
      ]
        .sort(
          (a, b) =>
            new Date(
              b.created_at || 0
            ) -
            new Date(
              a.created_at || 0
            )
        )
        .slice(0, 5);
    }, [
      registrationReminders,
      plannerReminders,
    ]);

  const visibleNotificationItems =
    activeNotificationMode ===
    'Notifications'
      ? allNotifications.slice(0, 5)
      : dashboardReminders;

  const selectedMiniGroup =
    studyGroups.find(
      group =>
        group.id ===
        selectedMiniGroupId
    ) ||
    studyGroups[0] ||
    null;

  const selectedGroupMessages =
    useMemo(() => {
      if (!selectedMiniGroup) {
        return [];
      }

      return studyGroupMessages
        .filter(
          message =>
            message.group_id ===
            selectedMiniGroup.id
        )
        .slice(0, 5)
        .reverse();
    }, [
      studyGroupMessages,
      selectedMiniGroup,
    ]);

  const registrationDataByTab = {
    Reminders:
      registrationReminders,
    Swaps:
      registrationSwaps,
    Reviews:
      registrationReviews,
    Questions:
      registrationQuestions,
  };

  const currentRegistrationItems =
    (
      registrationDataByTab[
        registrationTab
      ] || []
    ).slice(0, 4);

  const hubDataByTab = {
    Announcements:
      campusHubAnnouncements,
    News:
      campusHubNews,
    Events:
      campusHubEvents,
    Resources:
      campusHubResources,
  };

  const currentHubItems =
    (
      hubDataByTab[
        hubTab
      ] || []
    ).slice(0, 4);

  const dateLabel =
    new Date().toLocaleDateString(
      'en-US',
      {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }
    );

  if (loading) {
    return (
      <PageShell>
        <div className="panel" style={s.loadingCard}>
          <span className="icon-chip tone-primary">
            <Landmark size={25} strokeWidth={1.6} />
          </span>

          <div>
            <div className="stat-tile-title" style={s.loadingTitle}>
              Loading your dashboard
            </div>

            <div className="stat-tile-desc" style={s.loadingText}>
              Bringing together your
              Campora summary...
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* ===================================================
          GREETING HEADER
      =================================================== */}

      <div style={s.greetingWrap}>
        <div>
          <div className="label-caps" style={s.greetingEyebrow}>
            <Sparkles size={13} />
            {dateLabel.toUpperCase()}
          </div>

          <h1 style={s.greeting}>
            {greeting()},
          </h1>

          <div style={s.greetingName}>
            {capitalizeName(
              profile?.name
            )}
          </div>

          <p style={s.greetingSub}>
            Your day, courses and
            campus updates — summarized
            in one place.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/planner')}
        >
          <Plus size={18} />
          New Event
        </button>
      </div>

      {error && (
        <div style={s.errorBanner}>
          {error}
        </div>
      )}

      {/* ===================================================
          STAT TILES
      =================================================== */}

      <div className="grid-4">
        <StatTile
          icon={BookOpen}
          title={String(courses.length)}
          desc="Courses"
          tone="primary"
        />

        <StatTile
          icon={ClipboardCheck}
          title={String(activeAssignments.length)}
          desc="Assignments"
          tone="secondary"
        />

        <StatTile
          icon={CalendarDays}
          title={String(todaysSchedule.length)}
          desc="Schedule"
          tone="tertiary"
        />

        <StatTile
          icon={Megaphone}
          title={String(campusHubAnnouncements.length)}
          desc="Announcements"
          tone="error"
        />
      </div>

      {/* ===================================================
          TODAY'S SCHEDULE + TO-DO PROGRESS
      =================================================== */}

      <div className="split">
        <div className="split-main">
          <SectionHeader
            title="Today's Schedule"
            subtitle="A live summary of what you have in Planner today."
            action={
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/planner')}
              >
                View All
                <ArrowRight size={14} />
              </button>
            }
          />

          {todaysSchedule.length ===
          0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nothing scheduled today"
              text="Anything you add to today in Planner will automatically appear here."
              action="Open Planner"
              onAction={() =>
                navigate('/planner')
              }
            />
          ) : (
            <div className="stack">
              {todaysSchedule
                .slice(0, 6)
                .map(item => (
                  <ScheduleRow
                    key={item.id}
                    item={item}
                    onClick={() =>
                      navigate(
                        '/planner',
                        {
                          state: {
                            focusId:
                              item.id,
                            focusDate:
                              item.date,
                          },
                        }
                      )
                    }
                  />
                ))}
            </div>
          )}
        </div>

        <div className="split-side">
          <SectionHeader
            title="To-Do Progress"
            subtitle="A simple progress check on your task list."
            action={
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/todo')}
              >
                Open To-Do
                <ArrowRight size={14} />
              </button>
            }
          />

          <div className="panel-low" style={s.todoCard}>
            <ProgressRing
              value={todoProgress}
              size={190}
              stroke={11}
            >
              <div style={s.todoPct}>
                {todoProgress}%
              </div>
            </ProgressRing>

            <div style={s.todoHeadline}>
              {todos.length === 0
                ? 'Add your first task to get started.'
                : todoProgress === 100
                ? 'All clear — great work!'
                : `${remainingTodos.length} ${
                    remainingTodos.length === 1
                      ? 'task'
                      : 'tasks'
                  } to go.`}
            </div>

            <div style={s.todoMeta}>
              {completedTodos.length} of{' '}
              {todos.length} tasks
              completed
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          QUICK ACCESS
      =================================================== */}

      <section>
        <SectionHeader
          title="Quick Access"
          subtitle="Jump straight to any part of Campora."
        />

        <div style={s.quickGrid}>
          <QuickAccessCard
            icon={CalendarDays}
            label="Planner"
            text="Schedule, reminders and calendar"
            accent={BLUE}
            soft={BLUE_SOFT}
            border={BLUE_BORDER}
            onClick={() => navigate('/planner')}
          />

          <QuickAccessCard
            icon={BookOpen}
            label="Courses"
            text="Courses, assignments and credits"
            accent={PURPLE}
            soft={PURPLE_SOFT}
            border={PURPLE_BORDER}
            onClick={() => navigate('/courses')}
          />

          <QuickAccessCard
            icon={Compass}
            label="Registration"
            text="Course registration and matching"
            accent={TERRACOTTA}
            soft={TERRACOTTA_SOFT}
            border={TERRACOTTA_BORDER}
            onClick={() => navigate('/registration')}
          />

          <QuickAccessCard
            icon={Users}
            label="Study Groups"
            text="Groups, circles and direct messages"
            accent={TEAL}
            soft={TEAL_SOFT}
            border={TEAL_BORDER}
            onClick={() => navigate('/study-groups')}
          />

          <QuickAccessCard
            icon={MessageSquare}
            label="Campus Pulse"
            text="Student posts and conversations"
            accent={ROSE}
            soft={ROSE_SOFT}
            border={ROSE_BORDER}
            onClick={() => navigate('/campus-pulse')}
          />

          <QuickAccessCard
            icon={CheckCircle2}
            label="To-Do"
            text="Tasks and priorities"
            accent={GOLD}
            soft={GOLD_SOFT}
            border={GOLD_BORDER}
            onClick={() => navigate('/todo')}
          />

          <QuickAccessCard
            icon={Bell}
            label="Notifications"
            text="Updates and reminders"
            accent={PURPLE}
            soft={PURPLE_SOFT}
            border={PURPLE_BORDER}
            onClick={() => navigate('/notifications')}
          />

          <QuickAccessCard
            icon={Megaphone}
            label="Campus Hub"
            text="Announcements, news and resources"
            accent={TERRACOTTA}
            soft={TERRACOTTA_SOFT}
            border={TERRACOTTA_BORDER}
            onClick={() => navigate('/announcements')}
          />
        </div>
      </section>

      {/* ===================================================
          CAMPUS UPDATE + ACADEMIC SUMMARY
      =================================================== */}

      <Panel
        title="Campus Update"
        subtitle="Your latest important Campus Hub update."
        icon={Megaphone}
        accent={TERRACOTTA}
        soft={TERRACOTTA_SOFT}
        border={TERRACOTTA_BORDER}
        action="View Campus Hub"
        onAction={() =>
          navigate('/announcements')
        }
      >
        <div className="grid-12">
          <div className="col-span-8">
            {announcement ? (
              <button
                type="button"
                onClick={() =>
                  navigate('/announcements')
                }
                className="accent-row tone-tertiary"
                style={s.announcementCard}
              >
                <span
                  className="icon-chip"
                  style={{
                    ...s.previewIcon,
                    background: TERRACOTTA_SOFT,
                    color: TERRACOTTA,
                  }}
                >
                  <Megaphone size={18} />
                </span>

                <span style={s.previewMain}>
                  <span className="label-caps" style={{ color: TERRACOTTA }}>
                    {announcement.is_pinned
                      ? 'PINNED ANNOUNCEMENT'
                      : String(
                          announcement.category ||
                            'ANNOUNCEMENT'
                        ).toUpperCase()}
                  </span>

                  <span className="stat-tile-title" style={s.announcementTitle}>
                    {announcement.title ||
                      'Campus announcement'}
                  </span>

                  {announcement.content && (
                    <span className="stat-tile-desc" style={s.announcementText}>
                      {announcement.content}
                    </span>
                  )}
                </span>

                <ChevronRight
                  size={18}
                  className="dimmed"
                />
              </button>
            ) : (
              <div className="empty-state" style={{ padding: '20px' }}>
                <p>No campus announcements right now.</p>
              </div>
            )}
          </div>

          <div className="col-span-4">
            <button
              type="button"
              onClick={() =>
                navigate('/notifications')
              }
              className="accent-row tone-secondary"
              style={s.announcementCard}
            >
              <span
                className="icon-chip"
                style={{
                  ...s.previewIcon,
                  background: PURPLE_SOFT,
                  color: PURPLE,
                }}
              >
                <Bell size={18} />
              </span>

              <span style={s.previewMain}>
                <span className="stat-tile-title" style={s.notificationTitle}>
                  Notifications
                </span>

                <span className="stat-tile-desc" style={s.notificationText}>
                  {unreadCount === 0
                    ? 'You’re all caught up.'
                    : `${unreadCount} unread ${
                        unreadCount === 1
                          ? 'update'
                          : 'updates'
                      }`}
                </span>
              </span>

              <ChevronRight
                size={18}
                className="dimmed"
              />
            </button>
          </div>
        </div>
      </Panel>

      {/* ===================================================
          UPCOMING + TO-DO
      =================================================== */}

      <Panel
        title="Upcoming"
        subtitle="The next things coming up in Planner."
        icon={Clock3}
        accent={TERRACOTTA}
        soft={TERRACOTTA_SOFT}
        border={TERRACOTTA_BORDER}
        action="Open Planner"
        onAction={() =>
          navigate('/planner')
        }
      >
        {upcomingPlanner.length ===
        0 ? (
          <EmptyState
            icon={Clock3}
            title="Nothing coming up"
            text="Upcoming Planner items will appear here automatically."
          />
        ) : (
          <div className="stack">
            {upcomingPlanner.map(
              item => (
                <UpcomingRow
                  key={item.id}
                  item={item}
                  onClick={() =>
                    navigate(
                      '/planner',
                      {
                        state: {
                          focusId:
                            item.id,
                          focusDate:
                            item.date,
                        },
                      }
                    )
                  }
                />
              )
            )}
          </div>
        )}
      </Panel>

      {/* ===================================================
          YOUR CAMPORA SPACES
      =================================================== */}

      <section>
        <SectionHeader
          title="Your Campora Spaces"
          subtitle="Preview and move through the important parts of each space without leaving your dashboard."
        />

        <div className="stack" style={{ gap: '20px', marginTop: '4px' }}>
          {/* CAMPUS PULSE */}

          <Panel
            title="Campus Pulse"
            subtitle="Browse a smaller version of your student feed."
            icon={MessageSquare}
            accent={ROSE}
            soft={ROSE_SOFT}
            border={ROSE_BORDER}
            action="Open Campus Pulse"
            onAction={() =>
              navigate('/campus-pulse')
            }
          >
            <div className="filter-row">
              {CAMPUS_PULSE_CATEGORIES.map(
                category => {
                  const active =
                    campusPulseCategory ===
                    category;

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() =>
                        setCampusPulseCategory(
                          category
                        )
                      }
                      className={`filter-chip ${
                        active
                          ? 'active'
                          : ''
                      }`}
                    >
                      {category}
                    </button>
                  );
                }
              )}
            </div>

            {filteredCampusPulse.length ===
            0 ? (
              <MiniEmpty
                text={`No ${campusPulseCategory === 'All' ? '' : campusPulseCategory.toLowerCase() + ' '}posts to preview.`}
              />
            ) : (
              <div className="stack">
                {filteredCampusPulse.map(post => {
                  const tone = campusPulseTone(post.category);

                  return (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => navigate('/campus-pulse')}
                      style={{
                        ...s.previewRow,
                        background: `linear-gradient(180deg, ${tone.soft} 0%, var(--surface-container-lowest) 48%)`,
                        border: `1px solid ${tone.border}`,
                        boxShadow: `inset 0 4px 0 ${tone.accent}55, 0 8px 22px rgba(0,45,98,0.05)`,
                      }}
                    >
                      <span
                        className="icon-chip"
                        style={{
                          ...s.previewIcon,
                          background: tone.soft,
                          color: tone.accent,
                          border: `1px solid ${tone.border}`,
                        }}
                      >
                        <MessageSquare size={16} />
                      </span>

                      <span style={s.previewMain}>
                        <span style={s.previewTopLine}>
                          <strong
                            className="stat-tile-title"
                            style={s.previewTitle}
                          >
                            {post.title || post.category || 'Campus Pulse post'}
                          </strong>

                          <span
                            className="pill"
                            style={{
                              background: tone.soft,
                              color: tone.accent,
                              border: `1px solid ${tone.border}`,
                            }}
                          >
                            {post.category || 'Post'}
                          </span>
                        </span>

                        <span className="stat-tile-desc" style={s.previewText}>
                          {post.content || 'Open Campus Pulse to view this post.'}
                        </span>
                      </span>

                      <ChevronRight size={16} className="dimmed" />
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>

          {/* STUDY GROUPS */}

          <Panel
            title="Study Groups"
            subtitle="Peek into recent activity from your joined study circles."
            icon={Users}
            accent={TEAL}
            soft={TEAL_SOFT}
            border={TEAL_BORDER}
            action="Open Study Groups"
            onAction={() =>
              navigate('/study-groups')
            }
          >
            {studyGroups.length === 0 ? (
              <MiniEmpty
                text="Join or create a study group and its recent chat activity will appear here."
              />
            ) : (
              <>
                <div className="filter-row">
                  {studyGroups
                    .slice(0, 6)
                    .map(group => {
                      const active =
                        selectedMiniGroup
                          ?.id ===
                        group.id;

                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() =>
                            setSelectedMiniGroupId(
                              group.id
                            )
                          }
                          className={`filter-chip ${
                            active
                              ? 'active'
                              : ''
                          }`}
                        >
                          {group.name ||
                            group.title ||
                            'Study Group'}
                        </button>
                      );
                    })}
                </div>

                <div className="panel" style={s.chatShell}>
                  <div style={s.chatPreviewHeader}>
                    <div>
                      <strong className="stat-tile-title" style={s.chatPreviewTitle}>
                        {selectedMiniGroup?.name ||
                          selectedMiniGroup?.title ||
                          'Group Chat'}
                      </strong>

                      <div className="stat-tile-desc" style={s.chatPreviewSubtitle}>
                        Recent group chat
                      </div>
                    </div>

                    <MessageSquare
                      size={17}
                      style={{ color: TEAL }}
                    />
                  </div>

                  {selectedGroupMessages.length ===
                  0 ? (
                    <div style={{ padding: '8px' }}>
                      <MiniEmpty
                        text="No recent messages in this group yet."
                        compact
                      />
                    </div>
                  ) : (
                    <div className="stack" style={{ padding: '10px', gap: '8px' }}>
                      {selectedGroupMessages.map(
                        message => (
                          <div
                            key={message.id}
                            className="accent-row tone-success"
                            style={s.chatMessageRow}
                          >
                            <span
                              className="icon-chip"
                              style={{
                                ...s.chatAvatar,
                                background:
                                  TEAL_SOFT,
                                color: TEAL,
                              }}
                            >
                              {String(
                                message.sender_name ||
                                  'S'
                              )
                                .slice(0, 1)
                                .toUpperCase()}
                            </span>

                            <span style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                              <div className="stat-tile-title" style={s.chatSender}>
                                {message.sender_name ||
                                  'Student'}
                              </div>

                              <div className="stat-tile-desc" style={s.chatText}>
                                {messagePreview(
                                  message
                                ) ||
                                  'Message'}
                              </div>
                            </span>

                            <span className="label-caps" style={s.chatTime}>
                              {compactDate(
                                message.created_at
                              )}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </Panel>

          {/* REGISTRATION */}

          <Panel
            title="Registration"
            subtitle="Move between your registration reminders, swaps, reviews and questions."
            icon={Compass}
            accent={TERRACOTTA}
            soft={TERRACOTTA_SOFT}
            border={TERRACOTTA_BORDER}
            action="Open Registration"
            onAction={() =>
              navigate('/registration')
            }
          >
            <div className="filter-row">
              {REGISTRATION_TABS.map(
                tab => {
                  const active =
                    registrationTab === tab;

                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() =>
                        setRegistrationTab(
                          tab
                        )
                      }
                      className={`filter-chip ${
                        active
                          ? 'active'
                          : ''
                      }`}
                    >
                      {tab}
                      <span style={s.pillCount}>
                        {
                          (
                            registrationDataByTab[
                              tab
                            ] || []
                          ).length
                        }
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            {currentRegistrationItems.length ===
            0 ? (
              <MiniEmpty
                text={`No ${registrationTab.toLowerCase()} to preview right now.`}
              />
            ) : (
              <div className="stack">
                {currentRegistrationItems.map(
                  item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        navigate(
                          '/registration'
                        )
                      }
                      className="accent-row tone-tertiary"
                      style={s.previewRow}
                    >
                      <span
                        className="icon-chip"
                        style={{
                          ...s.previewIcon,
                          background:
                            TERRACOTTA_SOFT,
                          color:
                            TERRACOTTA,
                        }}
                      >
                        {registrationTab ===
                        'Reminders' ? (
                          <Bell size={16} />
                        ) : registrationTab ===
                          'Swaps' ? (
                          <Repeat2 size={16} />
                        ) : registrationTab ===
                          'Reviews' ? (
                          <Star size={16} />
                        ) : (
                          <HelpCircle
                            size={16}
                          />
                        )}
                      </span>

                      <span style={s.previewMain}>
                        <strong className="stat-tile-title" style={s.previewTitle}>
                          {registrationTab ===
                          'Reminders'
                            ? item.course_name ||
                              item.course_code ||
                              'Registration Reminder'
                            : registrationTab ===
                              'Swaps'
                            ? item.have_course ||
                              item.course_have ||
                              item.title ||
                              'Course Swap'
                            : registrationTab ===
                              'Reviews'
                            ? item.course_name ||
                              item.course_code ||
                              item.title ||
                              'Course Review'
                            : item.title ||
                              item.question ||
                              item.content ||
                              'Major Question'}
                        </strong>

                        <span className="stat-tile-desc" style={s.previewText}>
                          {registrationTab ===
                          'Reminders'
                            ? [
                                item.crn
                                  ? `CRN ${item.crn}`
                                  : '',
                                item.target_section
                                  ? `Section ${item.target_section}`
                                  : '',
                                item.notes || '',
                              ]
                                .filter(Boolean)
                                .join(' • ')
                            : item.content ||
                              item.body ||
                              item.want_course ||
                              item.course_want ||
                              item.comment ||
                              'Open Registration to view details.'}
                        </span>
                      </span>

                      <ChevronRight
                        size={16}
                        className="dimmed"
                      />
                    </button>
                  )
                )}
              </div>
            )}
          </Panel>

          {/* TO-DO PRIORITIES */}

          <Panel
            title="To-Do Priorities"
            subtitle="Flip through your high, medium and low priority tasks."
            icon={CheckCircle2}
            accent={activeTodoPriority.accent}
            soft={activeTodoPriority.soft}
            border={activeTodoPriority.border}
            action="Open To-Do"
            onAction={() =>
              navigate('/todo')
            }
          >
            <div style={s.carouselHeader}>
              <button
                type="button"
                onClick={() =>
                  setTodoPriorityIndex(
                    current =>
                      (current -
                        1 +
                        TODO_PRIORITIES.length) %
                      TODO_PRIORITIES.length
                  )
                }
                className="btn btn-outline"
                style={s.carouselArrow}
              >
                <ArrowLeft size={16} />
              </button>

              <div
                className="pill"
                style={{
                  ...s.carouselLabel,
                  color:
                    activeTodoPriority.accent,
                  background:
                    activeTodoPriority.soft,
                }}
              >
                {activeTodoPriority.label}
                <span style={s.carouselCount}>
                  {
                    remainingTodos.filter(
                      task =>
                        String(
                          task.priority || ''
                        )
                          .trim()
                          .toLowerCase() ===
                        activeTodoPriority.key
                    ).length
                  }
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setTodoPriorityIndex(
                    current =>
                      (current + 1) %
                      TODO_PRIORITIES.length
                  )
                }
                className="btn btn-outline"
                style={s.carouselArrow}
              >
                <ArrowRight size={16} />
              </button>
            </div>

            {priorityTodos.length === 0 ? (
              <MiniEmpty
                text={`No ${activeTodoPriority.key} priority tasks right now.`}
              />
            ) : (
              <div className="stack">
                {priorityTodos.map(
                  task => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() =>
                        navigate('/todo')
                      }
                      className="accent-row"
                      style={{
                        ...s.previewRow,
                      }}
                    >
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background:
                            activeTodoPriority.accent,
                          flexShrink: 0,
                        }}
                      />

                      <span style={s.previewMain}>
                        <strong className="stat-tile-title" style={s.previewTitle}>
                          {task.title ||
                            'Task'}
                        </strong>

                        {task.details && (
                          <span className="stat-tile-desc" style={s.previewText}>
                            {task.details}
                          </span>
                        )}
                      </span>

                      <ChevronRight
                        size={16}
                        className="dimmed"
                      />
                    </button>
                  )
                )}
              </div>
            )}
          </Panel>

          {/* NOTIFICATIONS / REMINDERS */}

          <Panel
            title="Notifications & Reminders"
            subtitle="Flip between your newest notifications and reminders."
            icon={Bell}
            accent={PURPLE}
            soft={PURPLE_SOFT}
            border={PURPLE_BORDER}
            action="Open Notifications"
            onAction={() =>
              navigate('/notifications')
            }
          >
            <div style={s.carouselHeader}>
              <button
                type="button"
                onClick={() =>
                  setNotificationModeIndex(
                    current =>
                      (current -
                        1 +
                        notificationModes.length) %
                      notificationModes.length
                  )
                }
                className="btn btn-outline"
                style={s.carouselArrow}
              >
                <ArrowLeft size={16} />
              </button>

              <div
                className="pill"
                style={{
                  ...s.carouselLabel,
                  color: PURPLE,
                  background: PURPLE_SOFT,
                }}
              >
                {activeNotificationMode}
                <span style={s.carouselCount}>
                  {activeNotificationMode ===
                  'Notifications'
                    ? allNotifications.length
                    : dashboardReminders.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setNotificationModeIndex(
                    current =>
                      (current + 1) %
                      notificationModes.length
                  )
                }
                className="btn btn-outline"
                style={s.carouselArrow}
              >
                <ArrowRight size={16} />
              </button>
            </div>

            {visibleNotificationItems.length ===
            0 ? (
              <MiniEmpty
                text={`No ${activeNotificationMode.toLowerCase()} right now.`}
              />
            ) : (
              <div className="stack">
                {visibleNotificationItems
                  .slice(0, 4)
                  .map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        navigate(
                          '/notifications'
                        )
                      }
                      className="accent-row tone-secondary"
                      style={s.previewRow}
                    >
                      <span
                        className="icon-chip"
                        style={{
                          ...s.previewIcon,
                          background:
                            PURPLE_SOFT,
                          color: PURPLE,
                        }}
                      >
                        <Bell size={16} />
                      </span>

                      <span style={s.previewMain}>
                        <span style={s.previewTopLine}>
                          <strong className="stat-tile-title" style={s.previewTitle}>
                            {item.title ||
                              'Campora update'}
                          </strong>

                          {activeNotificationMode ===
                            'Notifications' &&
                            item.read === false && (
                              <span
                                className="pill"
                                style={{
                                  background:
                                    ROSE_SOFT,
                                  color: ROSE,
                                }}
                              >
                                NEW
                              </span>
                            )}
                        </span>

                        <span className="stat-tile-desc" style={s.previewText}>
                          {item.message ||
                            item.content ||
                            'Open Notifications to view this update.'}
                        </span>
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </Panel>

          {/* CAMPUS HUB */}

          <Panel
            title="Campus Hub"
            subtitle="Browse announcements, news, events and resources from the dashboard."
            icon={Megaphone}
            accent={GOLD}
            soft={GOLD_SOFT}
            border={GOLD_BORDER}
            action="Open Campus Hub"
            onAction={() =>
              navigate('/announcements')
            }
          >
            <div className="filter-row">
              {HUB_TABS.map(tab => {
                const active =
                  hubTab === tab;

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() =>
                      setHubTab(tab)
                    }
                    className={`filter-chip ${
                      active
                        ? 'active'
                        : ''
                    }`}
                  >
                    {tab}
                    <span style={s.pillCount}>
                      {
                        (
                          hubDataByTab[
                            tab
                          ] || []
                        ).length
                      }
                    </span>
                  </button>
                );
              })}
            </div>

            {currentHubItems.length === 0 ? (
              <MiniEmpty
                text={`No ${hubTab.toLowerCase()} to preview right now.`}
              />
            ) : (
              <div className="stack">
                {currentHubItems.map(
                  item => (
                    <button
                      key={item.id || item.url || item.title}
                      type="button"
                      onClick={() =>
                        navigate(
                          '/announcements'
                        )
                      }
                      className="accent-row tone-primary"
                      style={s.previewRow}
                    >
                      <span
                        className="icon-chip"
                        style={{
                          ...s.previewIcon,
                          background:
                            GOLD_SOFT,
                          color: GOLD,
                        }}
                      >
                        {hubTab ===
                        'Announcements' ? (
                          <Megaphone
                            size={16}
                          />
                        ) : hubTab ===
                          'News' ? (
                          <BookOpen
                            size={16}
                          />
                        ) : hubTab ===
                          'Events' ? (
                          <CalendarDays
                            size={16}
                          />
                        ) : (
                          <FolderOpen
                            size={16}
                          />
                        )}
                      </span>

                      <span style={s.previewMain}>
                        <strong className="stat-tile-title" style={s.previewTitle}>
                          {item.title ||
                            item.name ||
                            item.file_name ||
                            `${hubTab.slice(0, -1)} item`}
                        </strong>

                        <span className="stat-tile-desc" style={s.previewText}>
                          {item.content ||
                            item.description ||
                            item.summary ||
                            item.category ||
                            'Open Campus Hub to view details.'}
                        </span>
                      </span>

                      <ChevronRight
                        size={16}
                        className="dimmed"
                      />
                    </button>
                  )
                )}
              </div>
            )}
          </Panel>
        </div>
      </section>

      {/* ===================================================
          CAMPUS MAP — LAST SECTION
      =================================================== */}

      <section>
        <SectionHeader
          title="Campus Map"
          subtitle="Find your way around campus and jump to your next class."
        />

        <div style={s.mapFrame}>
          <iframe
            title="American University of Beirut campus map"
            src="https://www.google.com/maps?q=American%20University%20of%20Beirut%2C%20Beirut%2C%20Lebanon&z=17&output=embed"
            style={s.mapImg}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />

          <a
            href="https://www.google.com/maps/dir/?api=1&destination=American+University+of+Beirut"
            target="_blank"
            rel="noopener noreferrer"
            className="pill"
            style={s.mapPill}
          >
            <Compass size={14} />
            Navigate to AUB
          </a>
          <a
            href="https://maps.aub.edu.lb/"
            target="_blank"
            rel="noopener noreferrer"
            className="pill"
            style={s.mapAubPill}
          >
            <Landmark size={14} />
            View AUB interactive map
          </a>
        </div>
      </section>

    </PageShell>
  );
}
// =========================================================
// SMALL COMPONENTS
// =========================================================

function MiniEmpty({
  text,
  compact = false,
}) {
  return (
    <div
      className="empty-state"
      style={{
        padding: compact
          ? '22px 16px'
          : '34px 16px',
      }}
    >
      <p>{text}</p>
    </div>
  );
}

function QuickAccessCard({
  icon: Icon,
  label,
  text,
  accent,
  soft,
  border,
  onClick,
}) {
  return (
    <button
      type="button"
      style={{
        ...s.quickAccessCard,
        border: `1px solid ${border}`,
        boxShadow: `inset 0 3px 0 ${accent}33, 0 8px 22px rgba(0,45,98,0.06)`
      }}
      onClick={onClick}
    >
      <span
        className="icon-chip"
        style={{
          ...s.quickAccessIcon,
          color: accent,
          background: soft,
          border: `1px solid ${border}`,
        }}
      >
        <Icon size={20} strokeWidth={1.6} />
      </span>

      <span style={s.quickAccessText}>
        <span className="stat-tile-title" style={s.quickAccessLabel}>
          {label}
        </span>

        <span className="stat-tile-desc" style={s.quickAccessDescription}>
          {text}
        </span>
      </span>

      <ChevronRight
        size={17}
        className="dimmed"
      />
    </button>
  );
}

function Panel({
  title,
  subtitle,
  icon: Icon,
  accent,
  soft,
  border,
  action,
  onAction,
  children,
}) {
  return (
    <section
      className="panel-low"
      style={{
        ...s.panel,
        background: `linear-gradient(135deg, ${soft} 0%, var(--surface-container-lowest) 44%)`,
        border: `1px solid ${border}`,
      }}
    >
      <div style={s.panelHeader}>
        <span
          className="icon-chip"
          style={{
            ...s.panelIcon,
            color: accent,
            background: soft,
            border: `1px solid ${border}`,
          }}
        >
          <Icon size={18} strokeWidth={1.6} />
        </span>

        <div style={s.panelHeading}>
          <h2 className="stat-tile-title" style={s.panelTitle}>
            {title}
          </h2>

          <p className="stat-tile-desc" style={s.panelSubtitle}>
            {subtitle}
          </p>
        </div>

        {action && onAction && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onAction}
          >
            {action}
            <ArrowRight
              size={14}
            />
          </button>
        )}
      </div>

      <div
        style={s.panelBody}
      >
        {children}
      </div>
    </section>
  );
}

function AcademicMetric({
  label,
  value,
  accent,
  soft,
  border,
  icon: Icon,
}) {
  return (
    <div
      className="panel-low"
      style={{
        ...s.academicMetric,
        background: soft,
        border: `1px solid ${border}`,
      }}
    >
      <span
        className="icon-chip"
        style={{
          width: '40px',
          height: '40px',
          color: accent,
          background: 'var(--surface-container-lowest)',
          border: `1px solid ${border}`,
        }}
      >
        <Icon size={17} strokeWidth={1.6} />
      </span>

      <div
        className="stat-tile-title"
        style={s.academicValue}
      >
        {value}
      </div>

      <div
        className="label-caps"
        style={{ color: accent }}
      >
        {label}
      </div>
    </div>
  );
}

function ScheduleRow({
  item,
  onClick,
}) {
  const Icon =
    plannerTypeIcon(
      item.type
    );

  const color =
    item.color &&
    /^#[0-9A-Fa-f]{6}$/.test(
      item.color
    )
      ? item.color
      : BLUE;

  const parts =
    timeParts(
      item.start_time
    );

  const past =
    isPastTime(
      item.end_time ||
        item.start_time
    );

  return (
    <button
      type="button"
      onClick={onClick}
      className={`accent-row ${past ? 'dimmed' : ''}`}
      style={s.scheduleRow}
    >
      <span
        style={{
          ...s.scheduleBar,
          background: color,
        }}
      />

      <div
        style={{
          ...s.scheduleTimeBlock,
        }}
      >
        <div
          style={s.scheduleTimeHour}
        >
          {parts.time}
        </div>

        <div
          className="label-caps"
          style={s.scheduleMeridian}
        >
          {parts.meridian}
        </div>
      </div>

      <span style={s.scheduleMain}>
        <span
          className="stat-tile-title"
          style={s.scheduleTitle}
        >
          {item.name ||
            'Planner item'}
        </span>

        <span
          className="stat-tile-desc"
          style={s.scheduleMeta}
        >
          <Icon size={13} />
          <span>{item.type ||
            'Schedule'}</span>
          <span style={s.scheduleDot}>
            •
          </span>
          <Clock3 size={13} />
          <span>
            {formatTimeRange(
              item.start_time,
              item.end_time
            )}
          </span>
        </span>
      </span>

      <ChevronRight
        size={17}
        className="dimmed"
      />
    </button>
  );
}

function UpcomingRow({
  item,
  onClick,
}) {
  const color =
    item.color &&
    /^#[0-9A-Fa-f]{6}$/.test(
      item.color
    )
      ? item.color
      : TERRACOTTA;

  return (
    <button
      type="button"
      onClick={onClick}
      className="accent-row tone-tertiary"
      style={s.upcomingRow}
    >
      <span
        className="pill"
        style={{
          ...s.upcomingDate,
          color,
          background:
            withAlpha(
              color,
              '12'
            ),
          border: `1px solid ${withAlpha(
            color,
            '24'
          )}`,
        }}
      >
        <CalendarDays
          size={13}
        />

        {
          formatUpcomingDate(
            item.date
          )
        }
      </span>

      <span style={s.upcomingMain}>
        <span
          className="stat-tile-title"
          style={s.upcomingTitle}
        >
          {item.name ||
            'Upcoming item'}
        </span>

        <span
          className="stat-tile-desc"
          style={s.upcomingMeta}
        >
          {item.type ||
            'Planner'}
          {item.start_time
            ? ` • ${formatPlannerTime(
                item.start_time
              )}`
            : ''}
        </span>
      </span>

      <ChevronRight
        size={17}
        className="dimmed"
      />
    </button>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
  action,
  onAction,
}) {
  return (
    <div
      className="empty-state"
    >
      <div
        className="empty-state-icon"
      >
        <Icon size={42} strokeWidth={1.4} />
      </div>

      <h3
        className="stat-tile-title"
      >
        {title}
      </h3>

      <p>{text}</p>

      {action && onAction && (
        <button
          type="button"
          className="btn btn-tinted btn-sm"
          onClick={onAction}
        >
          {action}
          <ArrowRight
            size={13}
          />
        </button>
      )}
    </div>
  );
}

// =========================================================
// STYLES
// =========================================================

const s = {
  loadingCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '24px',
  },

  loadingTitle: {
    fontSize: '15px',
  },

  loadingText: {
    fontSize: '13px',
    marginTop: '3px',
  },

  greetingWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    flexWrap: 'wrap',
  },

  greetingEyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    marginBottom: '10px',
  },

  greeting: {
    margin: 0,
    color: 'var(--campora-text)',
    fontSize: 'clamp(30px, 4vw, 42px)',
    fontWeight: '900',
    letterSpacing: '-0.03em',
    lineHeight: 1.08,
  },

  greetingName: {
    margin: '4px 0 0',
    color: 'var(--campora-navy)',
    fontSize: 'clamp(26px, 3vw, 34px)',
    fontWeight: '800',
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
  },

  greetingSub: {
    margin: '12px 0 0',
    maxWidth: '580px',
    color: 'var(--campora-body)',
    fontSize: '14px',
    fontWeight: '500',
    lineHeight: 1.55,
  },

  errorBanner: {
    padding: '12px 16px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--tone-error-soft)',
    color: 'var(--tone-error)',
    fontSize: '13px',
    fontWeight: '700',
  },

  quickGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginTop: '6px',
  },

  quickAccessCard: {
    width: '100%',
    minHeight: '104px',
    padding: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
    background: 'var(--surface-container-lowest)',
    borderRadius: '20px',
    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
  },

  quickAccessIcon: {
    width: '50px',
    height: '50px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  quickAccessText: {
    flex: 1,
    minWidth: 0,
  },

  quickAccessLabel: {
    display: 'block',
    fontSize: '16px',
    fontWeight: '800',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  quickAccessDescription: {
    display: 'block',
    fontSize: '12.5px',
    marginTop: '5px',
    lineHeight: 1.35,
    whiteSpace: 'normal',
    color: 'var(--campora-muted)',
  },

  todoCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '14px',
    textAlign: 'center',
    padding: '36px 24px',
    borderRadius: 'var(--radius)',
    flex: 1,
  },

  todoPct: {
    fontSize: '46px',
    fontWeight: '900',
    letterSpacing: '-0.03em',
    color: 'var(--campora-text)',
  },

  todoHeadline: {
    fontSize: '18px',
    fontWeight: '800',
    letterSpacing: '-0.02em',
    color: 'var(--campora-text)',
  },

  todoMeta: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--campora-muted)',
  },

  mapFrame: {
    position: 'relative',
    marginTop: '10px',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    height: '400px',
    boxShadow: 'var(--shadow-soft)',
  },

  mapImg: {
    width: '100%',
    height: '100%',
    border: '0',
    display: 'block',
  },

  mapPill: {
    position: 'absolute',
    textDecoration: 'none',
    right: '16px',
    bottom: '16px',
    background:
      'color-mix(in srgb, var(--surface-container-lowest) 90%, transparent)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: 'var(--campora-navy)',
    boxShadow: 'var(--shadow-soft)',
    fontSize: '12px',
    fontWeight: '800',
    letterSpacing: '0.01em',
  },

  mapAubPill: {
    position: 'absolute',
    textDecoration: 'none',
    right: '16px',
    bottom: '56px',
    background:
      'color-mix(in srgb, var(--surface-container-lowest) 90%, transparent)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: 'var(--campora-navy)',
    boxShadow: 'var(--shadow-soft)',
    fontSize: '12px',
    fontWeight: '800',
    letterSpacing: '0.01em',
  },

  panel: {
    padding: '24px',
    borderRadius: '22px',
    boxShadow: '0 8px 24px rgba(0,45,98,0.055)',
  },

  panelHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '16px',
  },

  panelIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '13px',
    flexShrink: 0,
  },

  panelHeading: {
    flex: 1,
    minWidth: 0,
  },

  panelTitle: {
    fontSize: '19px',
    fontWeight: '800',
    letterSpacing: '-0.02em',
    margin: 0,
  },

  panelSubtitle: {
    fontSize: '13px',
    marginTop: '4px',
    lineHeight: 1.45,
  },

  panelBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },

  academicGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
  },

  academicMetric: {
    minHeight: '118px',
    padding: '16px',
    borderRadius: '18px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: '10px',
  },

  academicValue: {
    fontSize: '26px',
    fontWeight: '900',
    letterSpacing: '-0.02em',
    lineHeight: 1,
  },

  coursesFooter: {
    width: '100%',
    justifyContent: 'space-between',
    marginTop: '4px',
    fontSize: '13px',
  },

  scheduleRow: {
    width: '100%',
    minHeight: '80px',
    padding: '16px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  scheduleBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '4px',
  },

  scheduleTimeBlock: {
    minWidth: '66px',
    textAlign: 'center',
    flexShrink: 0,
  },

  scheduleTimeHour: {
    fontSize: '22px',
    fontWeight: '800',
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
    color: 'var(--campora-text)',
  },

  scheduleMeridian: {
    marginTop: '3px',
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '0.08em',
  },

  scheduleMain: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },

  scheduleTitle: {
    fontSize: '17px',
    fontWeight: '800',
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  scheduleMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    marginTop: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  scheduleDot: {
    opacity: 0.6,
    marginLeft: '2px',
    marginRight: '2px',
  },

  upcomingRow: {
    width: '100%',
    minHeight: '72px',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  upcomingDate: {
    minWidth: '92px',
    height: '34px',
    padding: '0 12px',
    borderRadius: 'var(--radius-pill)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    flexShrink: 0,
    fontSize: '12px',
    fontWeight: '800',
  },

  upcomingMain: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },

  upcomingTitle: {
    fontSize: '16px',
    fontWeight: '800',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  upcomingMeta: {
    fontSize: '13px',
    marginTop: '4px',
  },

  announcementCard: {
    width: '100%',
    minHeight: '96px',
    padding: '16px 18px',
    borderRadius: '18px',
    border: '1px solid var(--hairline)',
    background: 'var(--surface-container-lowest)',
    boxShadow: '0 5px 16px rgba(0,45,98,0.04)',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  announcementTitle: {
    display: 'block',
    fontSize: '16px',
    fontWeight: '800',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  announcementText: {
    display: 'block',
    fontSize: '13px',
    marginTop: '4px',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  notificationTitle: {
    display: 'block',
    fontSize: '16px',
    fontWeight: '800',
  },

  notificationText: {
    display: 'block',
    fontSize: '13px',
    marginTop: '4px',
  },

  previewRow: {
    width: '100%',
    minHeight: '78px',
    padding: '15px 17px',
    borderRadius: '18px',
    border: '1px solid var(--hairline)',
    background: 'var(--surface-container-lowest)',
    boxShadow: '0 5px 16px rgba(0,45,98,0.035)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  previewIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    flexShrink: 0,
  },

  previewMain: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },

  previewTopLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'space-between',
  },

  previewTitle: {
    display: 'block',
    fontSize: '15px',
    fontWeight: '800',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  previewText: {
    display: 'block',
    fontSize: '13px',
    marginTop: '3px',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  pillCount: {
    minWidth: '20px',
    height: '20px',
    padding: '0 7px',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(255, 255, 255, 0.4)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '800',
  },

  chatShell: {
    padding: '0',
    overflow: 'hidden',
  },

  chatPreviewHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '14px 16px',
    borderBottom: '1px solid var(--divider)',
    background: 'var(--surface-container-low)',
  },

  chatPreviewTitle: {
    display: 'block',
    fontSize: '15px',
    fontWeight: '800',
  },

  chatPreviewSubtitle: {
    fontSize: '13px',
    marginTop: '2px',
  },

  chatMessageRow: {
    width: '100%',
    minHeight: '52px',
    padding: '10px 12px',
    overflow: 'hidden',
  },

  chatAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    flexShrink: 0,
    fontSize: '12px',
    fontWeight: '800',
  },

  chatSender: {
    fontSize: '13px',
    fontWeight: '800',
  },

  chatText: {
    fontSize: '12px',
    marginTop: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  chatTime: {
    flexShrink: 0,
    alignSelf: 'flex-start',
    marginTop: '4px',
  },

  carouselHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },

  carouselArrow: {
    width: '40px',
    height: '40px',
    padding: '0',
    flexShrink: 0,
  },

  carouselLabel: {
    minWidth: '180px',
    minHeight: '36px',
    padding: '0 12px',
    gap: '8px',
    fontSize: '13px',
    fontWeight: '800',
  },

  carouselCount: {
    minWidth: '20px',
    height: '20px',
    padding: '0 7px',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(255, 255, 255, 0.6)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
  },
};
