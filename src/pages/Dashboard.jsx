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
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import {
  getAnnouncements,
  getCampusNews,
  getEvents,
  getResources,
} from '../lib/campusHub';

// =========================================================
// CAMPORA THEME
// =========================================================

const NAVY = '#0B1A3F';
const MUTED = '#8B97AD';
const BORDER = '#E8ECF3';

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
      <div style={styles.page}>
        <div
          style={styles.loadingCard}
        >
          <div
            style={
              styles.loadingIcon
            }
          >
            <Landmark size={25} />
          </div>

          <div>
            <div
              style={
                styles.loadingTitle
              }
            >
              Loading your dashboard
            </div>

            <div
              style={
                styles.loadingText
              }
            >
              Bringing together your
              Campora summary...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          .dashboard-scroll::-webkit-scrollbar {
            width: 7px;
          }

          .dashboard-scroll::-webkit-scrollbar-track {
            background: transparent;
          }

          .dashboard-scroll::-webkit-scrollbar-thumb {
            background: #D9DFEB;
            border-radius: 999px;
          }

          .dashboard-scroll::-webkit-scrollbar-thumb:hover {
            background: #C5CEDD;
          }
        `}
      </style>

      <div className="dashboard-scroll" style={styles.page}>
      {/* ===================================================
          NAVY HERO
      =================================================== */}

      <section style={styles.hero}>
        <div
          style={
            styles.heroGlowOne
          }
        />

        <div
          style={
            styles.heroGlowTwo
          }
        />

        <div
          style={
            styles.heroContent
          }
        >
          <div>
            <div
              style={
                styles.heroEyebrow
              }
            >
              <Sparkles size={13} />
              {dateLabel.toUpperCase()}
            </div>

            <h1
              style={
                styles.heroTitle
              }
            >
              {greeting()},{' '}
              {capitalizeName(
                profile?.name
              )}
            </h1>

            <p
              style={
                styles.heroSubtitle
              }
            >
              Your day, courses and
              campus updates — summarized
              in one place.
            </p>
          </div>


        </div>
      </section>

      {error && (
        <div
          style={
            styles.errorBanner
          }
        >
          {error}
        </div>
      )}

      {/* ===================================================
          QUICK ACCESS
      =================================================== */}

      <section style={styles.quickAccessSection}>
        <div style={styles.quickAccessHeader}>
          <div>
            <h2 style={styles.quickAccessTitle}>
              Quick Access
            </h2>

            <p style={styles.quickAccessSubtitle}>
              Jump straight to any part of Campora.
            </p>
          </div>
        </div>

        <div style={styles.quickAccessGrid}>
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
          TODAY + ACADEMIC SUMMARY
      =================================================== */}

      <div
        style={
          styles.primaryGrid
        }
      >
        <Panel
          title="Today's Schedule"
          subtitle="A live summary of what you have in Planner today."
          icon={CalendarDays}
          accent={BLUE}
          soft={BLUE_SOFT}
          border={BLUE_BORDER}
          action="Open in Planner"
          onAction={() =>
            navigate('/planner')
          }
        >
          {todaysSchedule.length ===
          0 ? (
            <EmptyState
              icon={
                CalendarDays
              }
              title="Nothing scheduled today"
              text="Anything you add to today in Planner will automatically appear here."
              action="Open Planner"
              onAction={() =>
                navigate('/planner')
              }
            />
          ) : (
            <div
              style={
                styles.itemList
              }
            >
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
        </Panel>

        <Panel
          title="Courses"
          subtitle="Your academic workspace at a glance."
          icon={BookOpen}
          accent={PURPLE}
          soft={PURPLE_SOFT}
          border={PURPLE_BORDER}
          action="Open Courses"
          onAction={() =>
            navigate('/courses')
          }
        >
          <div
            style={
              styles.academicGrid
            }
          >
            <AcademicMetric
              label="Courses"
              value={
                courses.length
              }
              accent={PURPLE}
              soft={PURPLE_SOFT}
              border={
                PURPLE_BORDER
              }
              icon={BookOpen}
            />

            <AcademicMetric
              label="Credits"
              value={
                totalCredits
              }
              accent={GOLD}
              soft={GOLD_SOFT}
              border={
                GOLD_BORDER
              }
              icon={
                GraduationCap
              }
            />

            <AcademicMetric
              label="Assignments"
              value={
                activeAssignments.length
              }
              accent={BLUE}
              soft={BLUE_SOFT}
              border={
                BLUE_BORDER
              }
              icon={
                ClipboardCheck
              }
            />

            <AcademicMetric
              label="Upcoming"
              value={
                upcomingCourseEvents.length
              }
              accent={
                TERRACOTTA
              }
              soft={
                TERRACOTTA_SOFT
              }
              border={
                TERRACOTTA_BORDER
              }
              icon={Clock3}
            />

            <AcademicMetric
              label="Resources"
              value={
                courseResources.length
              }
              accent={TEAL}
              soft={TEAL_SOFT}
              border={
                TEAL_BORDER
              }
              icon={FolderOpen}
            />
          </div>

          <button
            type="button"
            onClick={() =>
              navigate('/courses')
            }
            style={
              styles.coursesFooter
            }
          >
            <span>
              {totalCredits}{' '}
              {totalCredits === 1
                ? 'credit'
                : 'credits'}{' '}
              across{' '}
              {courses.length}{' '}
              {courses.length === 1
                ? 'course'
                : 'courses'}
            </span>

            <ChevronRight
              size={17}
            />
          </button>
        </Panel>
      </div>

      {/* ===================================================
          UPCOMING + TO-DO
      =================================================== */}

      <div
        style={
          styles.secondaryGrid
        }
      >
        <Panel
          title="Upcoming"
          subtitle="The next things coming up in Planner."
          icon={Clock3}
          accent={
            TERRACOTTA
          }
          soft={
            TERRACOTTA_SOFT
          }
          border={
            TERRACOTTA_BORDER
          }
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
            <div
              style={
                styles.itemList
              }
            >
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

        <Panel
          title="To-Do"
          subtitle="A simple progress check on your task list."
          icon={CheckCircle2}
          accent={TEAL}
          soft={TEAL_SOFT}
          border={TEAL_BORDER}
          action="Open To-Do"
          onAction={() =>
            navigate('/todo')
          }
        >
          <div
            style={
              styles.todoSummary
            }
          >
            <div
              style={
                styles.todoTop
              }
            >
              <div>
                <div
                  style={
                    styles.todoNumber
                  }
                >
                  {
                    remainingTodos.length
                  }
                </div>

                <div
                  style={
                    styles.todoLabel
                  }
                >
                  {remainingTodos.length ===
                  1
                    ? 'task left'
                    : 'tasks left'}
                </div>
              </div>

              <div
                style={{
                  ...styles.todoPercent,
                  background:
                    TEAL_SOFT,
                  color: TEAL,
                  border: `1px solid ${TEAL_BORDER}`,
                }}
              >
                {todoProgress}%
              </div>
            </div>

            <div
              style={
                styles.progressTrack
              }
            >
              <div
                style={{
                  width: `${todoProgress}%`,
                  height: '100%',
                  borderRadius:
                    '999px',
                  background: TEAL,
                  transition:
                    'width .2s ease',
                }}
              />
            </div>

            <div
              style={
                styles.todoFooter
              }
            >
              {
                completedTodos.length
              }{' '}
              completed out of{' '}
              {todos.length}
            </div>
          </div>
        </Panel>
      </div>

      {/* ===================================================
          CAMPUS / NOTIFICATIONS
      =================================================== */}

      <Panel
        title="Campus Update"
        subtitle="Your latest important Campus Hub update."
        icon={Megaphone}
        accent={
          TERRACOTTA
        }
        soft={
          TERRACOTTA_SOFT
        }
        border={
          TERRACOTTA_BORDER
        }
        action="View Campus Hub"
        onAction={() =>
          navigate(
            '/announcements'
          )
        }
      >
        <div
          style={
            styles.campusRow
          }
        >
          {announcement ? (
            <button
              type="button"
              onClick={() =>
                navigate(
                  '/announcements'
                )
              }
              style={
                styles.announcementCard
              }
            >
              <div
                style={{
                  ...styles.announcementIcon,
                  background:
                    TERRACOTTA_SOFT,
                  color:
                    TERRACOTTA,
                  border: `1px solid ${TERRACOTTA_BORDER}`,
                }}
              >
                <Megaphone
                  size={18}
                />
              </div>

              <div
                style={
                  styles.announcementBody
                }
              >
                <div
                  style={
                    styles.announcementMeta
                  }
                >
                  {announcement.is_pinned
                    ? 'PINNED ANNOUNCEMENT'
                    : String(
                        announcement.category ||
                          'ANNOUNCEMENT'
                      ).toUpperCase()}
                </div>

                <div
                  style={
                    styles.announcementTitle
                  }
                >
                  {announcement.title ||
                    'Campus announcement'}
                </div>

                {announcement.content && (
                  <div
                    style={
                      styles.announcementText
                    }
                  >
                    {
                      announcement.content
                    }
                  </div>
                )}
              </div>

              <ChevronRight
                size={18}
                color="#9DA8BA"
              />
            </button>
          ) : (
            <div
              style={
                styles.noAnnouncement
              }
            >
              No campus announcements
              right now.
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              navigate(
                '/notifications'
              )
            }
            style={
              styles.notificationSummary
            }
          >
            <div
              style={{
                ...styles.notificationIcon,
                background:
                  PURPLE_SOFT,
                color: PURPLE,
                border: `1px solid ${PURPLE_BORDER}`,
              }}
            >
              <Bell size={18} />
            </div>

            <div
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <div
                style={
                  styles.notificationTitle
                }
              >
                Notifications
              </div>

              <div
                style={
                  styles.notificationText
                }
              >
                {unreadCount === 0
                  ? 'You’re all caught up.'
                  : `${unreadCount} unread ${
                      unreadCount === 1
                        ? 'update'
                        : 'updates'
                    }`}
              </div>
            </div>

            <ChevronRight
              size={18}
              color="#9DA8BA"
            />
          </button>
        </div>
      </Panel>

      {/* ===================================================
          MINI CAMPORA WORKSPACES
      =================================================== */}

      <div style={styles.workspaceSection}>
        <div style={styles.workspaceSectionHeader}>
          <div>
            <h2 style={styles.workspaceSectionTitle}>
              Your Campora Spaces
            </h2>

            <p style={styles.workspaceSectionSubtitle}>
              Preview and move through the important parts of each space without leaving your dashboard.
            </p>
          </div>
        </div>

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
          <div style={styles.miniTabsScroll}>
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
                    style={{
                      ...styles.miniPill,
                      background: active
                        ? ROSE
                        : ROSE_SOFT,
                      color: active
                        ? '#FFFFFF'
                        : ROSE,
                      border: `1px solid ${ROSE_BORDER}`,
                    }}
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
            <div style={styles.previewList}>
              {filteredCampusPulse.map(
                post => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() =>
                      navigate(
                        '/campus-pulse'
                      )
                    }
                    style={
                      styles.previewRow
                    }
                  >
                    <div
                      style={{
                        ...styles.previewIcon,
                        background:
                          ROSE_SOFT,
                        color: ROSE,
                        border: `1px solid ${ROSE_BORDER}`,
                      }}
                    >
                      <MessageSquare
                        size={16}
                      />
                    </div>

                    <div
                      style={
                        styles.previewMain
                      }
                    >
                      <div
                        style={
                          styles.previewTopLine
                        }
                      >
                        <strong
                          style={
                            styles.previewTitle
                          }
                        >
                          {post.title ||
                            post.category ||
                            'Campus Pulse post'}
                        </strong>

                        <span
                          style={{
                            ...styles.previewTag,
                            color: ROSE,
                            background:
                              ROSE_SOFT,
                          }}
                        >
                          {post.category ||
                            'Post'}
                        </span>
                      </div>

                      <div
                        style={
                          styles.previewText
                        }
                      >
                        {post.content ||
                          'Open Campus Pulse to view this post.'}
                      </div>
                    </div>

                    <ChevronRight
                      size={16}
                      color="#A4AEC0"
                    />
                  </button>
                )
              )}
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
              <div style={styles.miniTabsScroll}>
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
                        style={{
                          ...styles.miniPill,
                          background: active
                            ? TEAL
                            : TEAL_SOFT,
                          color: active
                            ? '#FFFFFF'
                            : TEAL,
                          border: `1px solid ${TEAL_BORDER}`,
                        }}
                      >
                        {group.name ||
                          group.title ||
                          'Study Group'}
                      </button>
                    );
                  })}
              </div>

              <div style={styles.chatPreviewShell}>
                <div style={styles.chatPreviewHeader}>
                  <div>
                    <strong style={styles.chatPreviewTitle}>
                      {selectedMiniGroup?.name ||
                        selectedMiniGroup?.title ||
                        'Group Chat'}
                    </strong>

                    <div style={styles.chatPreviewSubtitle}>
                      Recent group chat
                    </div>
                  </div>

                  <MessageSquare
                    size={17}
                    color={TEAL}
                  />
                </div>

                {selectedGroupMessages.length ===
                0 ? (
                  <MiniEmpty
                    text="No recent messages in this group yet."
                    compact
                  />
                ) : (
                  <div style={styles.chatMessages}>
                    {selectedGroupMessages.map(
                      message => (
                        <div
                          key={message.id}
                          style={styles.chatMessageRow}
                        >
                          <div
                            style={{
                              ...styles.chatAvatar,
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
                          </div>

                          <div
                            style={{
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            <div style={styles.chatSender}>
                              {message.sender_name ||
                                'Student'}
                            </div>

                            <div style={styles.chatText}>
                              {messagePreview(
                                message
                              ) ||
                                'Message'}
                            </div>
                          </div>

                          <span style={styles.chatTime}>
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
          <div style={styles.miniTabsScroll}>
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
                    style={{
                      ...styles.miniPill,
                      background: active
                        ? TERRACOTTA
                        : TERRACOTTA_SOFT,
                      color: active
                        ? '#FFFFFF'
                        : TERRACOTTA,
                      border: `1px solid ${TERRACOTTA_BORDER}`,
                    }}
                  >
                    {tab}
                    <span style={styles.pillCount}>
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
            <div style={styles.previewList}>
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
                    style={styles.previewRow}
                  >
                    <div
                      style={{
                        ...styles.previewIcon,
                        background:
                          TERRACOTTA_SOFT,
                        color:
                          TERRACOTTA,
                        border: `1px solid ${TERRACOTTA_BORDER}`,
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
                    </div>

                    <div style={styles.previewMain}>
                      <strong style={styles.previewTitle}>
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

                      <div style={styles.previewText}>
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
                      </div>
                    </div>

                    <ChevronRight
                      size={16}
                      color="#A4AEC0"
                    />
                  </button>
                )
              )}
            </div>
          )}
        </Panel>

        {/* TO-DO CAROUSEL */}

        <Panel
          title="To-Do Priorities"
          subtitle="Flip through your high, medium and low priority tasks."
          icon={CheckCircle2}
          accent={
            activeTodoPriority.accent
          }
          soft={
            activeTodoPriority.soft
          }
          border={
            activeTodoPriority.border
          }
          action="Open To-Do"
          onAction={() =>
            navigate('/todo')
          }
        >
          <div style={styles.carouselHeader}>
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
              style={styles.carouselArrow}
            >
              <ArrowLeft size={16} />
            </button>

            <div
              style={{
                ...styles.carouselLabel,
                color:
                  activeTodoPriority.accent,
                background:
                  activeTodoPriority.soft,
                border: `1px solid ${activeTodoPriority.border}`,
              }}
            >
              {activeTodoPriority.label}
              <span style={styles.carouselCount}>
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
              style={styles.carouselArrow}
            >
              <ArrowRight size={16} />
            </button>
          </div>

          {priorityTodos.length === 0 ? (
            <MiniEmpty
              text={`No ${activeTodoPriority.key} priority tasks right now.`}
            />
          ) : (
            <div style={styles.previewList}>
              {priorityTodos.map(
                task => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() =>
                      navigate('/todo')
                    }
                    style={styles.previewRow}
                  >
                    <div
                      style={{
                        ...styles.priorityDot,
                        background:
                          activeTodoPriority.accent,
                      }}
                    />

                    <div style={styles.previewMain}>
                      <strong style={styles.previewTitle}>
                        {task.title ||
                          'Task'}
                      </strong>

                      {task.details && (
                        <div style={styles.previewText}>
                          {task.details}
                        </div>
                      )}
                    </div>

                    <ChevronRight
                      size={16}
                      color="#A4AEC0"
                    />
                  </button>
                )
              )}
            </div>
          )}
        </Panel>

        {/* NOTIFICATIONS / REMINDERS CAROUSEL */}

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
          <div style={styles.carouselHeader}>
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
              style={styles.carouselArrow}
            >
              <ArrowLeft size={16} />
            </button>

            <div
              style={{
                ...styles.carouselLabel,
                color: PURPLE,
                background:
                  PURPLE_SOFT,
                border: `1px solid ${PURPLE_BORDER}`,
              }}
            >
              {activeNotificationMode}
              <span style={styles.carouselCount}>
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
              style={styles.carouselArrow}
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
            <div style={styles.previewList}>
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
                    style={styles.previewRow}
                  >
                    <div
                      style={{
                        ...styles.previewIcon,
                        background:
                          PURPLE_SOFT,
                        color: PURPLE,
                        border: `1px solid ${PURPLE_BORDER}`,
                      }}
                    >
                      <Bell size={16} />
                    </div>

                    <div style={styles.previewMain}>
                      <div style={styles.previewTopLine}>
                        <strong style={styles.previewTitle}>
                          {item.title ||
                            'Campora update'}
                        </strong>

                        {activeNotificationMode ===
                          'Notifications' &&
                          item.read === false && (
                            <span
                              style={{
                                ...styles.previewTag,
                                color: ROSE,
                                background:
                                  ROSE_SOFT,
                              }}
                            >
                              NEW
                            </span>
                          )}
                      </div>

                      <div style={styles.previewText}>
                        {item.message ||
                          item.content ||
                          'Open Notifications to view this update.'}
                      </div>
                    </div>
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
          <div style={styles.miniTabsScroll}>
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
                  style={{
                    ...styles.miniPill,
                    background: active
                      ? GOLD
                      : GOLD_SOFT,
                    color: active
                      ? '#FFFFFF'
                      : GOLD,
                    border: `1px solid ${GOLD_BORDER}`,
                  }}
                >
                  {tab}
                  <span style={styles.pillCount}>
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
            <div style={styles.previewList}>
              {currentHubItems.map(
                item => (
                  <button
                    key={
                      item.id ||
                      item.url ||
                      item.title
                    }
                    type="button"
                    onClick={() =>
                      navigate(
                        '/announcements'
                      )
                    }
                    style={styles.previewRow}
                  >
                    <div
                      style={{
                        ...styles.previewIcon,
                        background:
                          GOLD_SOFT,
                        color: GOLD,
                        border: `1px solid ${GOLD_BORDER}`,
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
                    </div>

                    <div style={styles.previewMain}>
                      <strong style={styles.previewTitle}>
                        {item.title ||
                          item.name ||
                          item.file_name ||
                          `${hubTab.slice(0, -1)} item`}
                      </strong>

                      <div style={styles.previewText}>
                        {item.content ||
                          item.description ||
                          item.summary ||
                          item.category ||
                          'Open Campus Hub to view details.'}
                      </div>
                    </div>

                    <ChevronRight
                      size={16}
                      color="#A4AEC0"
                    />
                  </button>
                )
              )}
            </div>
          )}
        </Panel>
      </div>
      </div>
    </>
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
      style={{
        ...styles.miniEmpty,
        minHeight: compact
          ? '82px'
          : '130px',
      }}
    >
      {text}
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
      onClick={onClick}
      style={{
        ...styles.quickAccessCard,
        background: '#FFFFFF',
        border: '1px solid #E5EAF1',
        boxShadow: '0 7px 20px rgba(11,26,63,.045)',
      }}
    >
      <div
        style={{
          ...styles.quickAccessIcon,
          color: NAVY,
          background: '#F4F7FE',
          border: '1px solid #E4EAF3',
          boxShadow: `inset 0 -3px 0 ${accent}22`,
        }}
      >
        <Icon size={20} />
      </div>

      <div style={styles.quickAccessText}>
        <div style={styles.quickAccessLabel}>
          {label}
        </div>

        <div style={styles.quickAccessDescription}>
          {text}
        </div>
      </div>

      <ChevronRight
        size={17}
        color={NAVY}
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
      style={styles.panel}
    >
      <div
        style={
          styles.panelHeader
        }
      >
        <div
          style={
            styles.panelHeading
          }
        >
          <div
            style={{
              ...styles.panelIcon,
              color: accent,
              background: soft,
              border: `1px solid ${border}`,
            }}
          >
            <Icon size={18} />
          </div>

          <div>
            <h2
              style={
                styles.panelTitle
              }
            >
              {title}
            </h2>

            <p
              style={
                styles.panelSubtitle
              }
            >
              {subtitle}
            </p>
          </div>
        </div>

        {action && onAction && (
          <button
            type="button"
            onClick={onAction}
            style={{
              ...styles.panelAction,
              color: NAVY,
              background: '#F4F7FE',
              border: '1px solid #E1E7F0',
            }}
          >
            {action}
            <ArrowRight
              size={14}
            />
          </button>
        )}
      </div>

      <div
        style={styles.panelBody}
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
      style={{
        ...styles.academicMetric,
        background: soft,
        border: `1px solid ${border}`,
      }}
    >
      <div
        style={{
          ...styles.academicIcon,
          color: accent,
          background:
            '#FFFFFF',
          border: `1px solid ${border}`,
        }}
      >
        <Icon size={17} />
      </div>

      <div
        style={
          styles.academicValue
        }
      >
        {value}
      </div>

      <div
        style={{
          ...styles.academicLabel,
          color: accent,
        }}
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

  return (
    <button
      type="button"
      onClick={onClick}
      style={
        styles.scheduleRow
      }
    >
      <div
        style={{
          ...styles.scheduleAccent,
          background: color,
        }}
      />

      <div
        style={{
          ...styles.scheduleIcon,
          color,
          background:
            withAlpha(
              color,
              '14'
            ),
          border: `1px solid ${withAlpha(
            color,
            '24'
          )}`,
        }}
      >
        <Icon size={17} />
      </div>

      <div
        style={
          styles.scheduleMain
        }
      >
        <div
          style={
            styles.scheduleTitle
          }
        >
          {item.name ||
            'Planner item'}
        </div>

        <div
          style={
            styles.scheduleMeta
          }
        >
          {item.type ||
            'Schedule'}
        </div>
      </div>

      <div
        style={
          styles.scheduleTime
        }
      >
        {formatTimeRange(
          item.start_time,
          item.end_time
        )}
      </div>

      <ChevronRight
        size={17}
        color="#A4AEC0"
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
      style={
        styles.upcomingRow
      }
    >
      <div
        style={{
          ...styles.upcomingDate,
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
      </div>

      <div
        style={
          styles.upcomingMain
        }
      >
        <div
          style={
            styles.upcomingTitle
          }
        >
          {item.name ||
            'Upcoming item'}
        </div>

        <div
          style={
            styles.upcomingMeta
          }
        >
          {item.type ||
            'Planner'}
          {item.start_time
            ? ` • ${formatPlannerTime(
                item.start_time
              )}`
            : ''}
        </div>
      </div>

      <ChevronRight
        size={17}
        color="#A4AEC0"
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
      style={
        styles.emptyState
      }
    >
      <div
        style={
          styles.emptyIcon
        }
      >
        <Icon size={23} />
      </div>

      <div
        style={
          styles.emptyTitle
        }
      >
        {title}
      </div>

      <div
        style={
          styles.emptyText
        }
      >
        {text}
      </div>

      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={
            styles.emptyAction
          }
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

const styles = {
  page: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',

    minHeight: 'calc(100vh - 100px)',

    padding: '4px 10px 0 0',

    boxSizing: 'border-box',
    fontFamily: 'inherit',

    scrollBehavior: 'smooth',
    scrollbarWidth: 'thin',
  },

  hero: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: '185px',
    borderRadius: '24px',
    padding: '29px 31px',
    marginBottom: '20px',
    boxSizing: 'border-box',
    background:
      'linear-gradient(135deg, #08152F 0%, #0B1A3F 52%, #142B5A 100%)',
    boxShadow:
      '0 16px 38px rgba(11,26,63,0.16)',
  },

  heroGlowOne: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background:
      'radial-gradient(circle, rgba(100,140,203,.22) 0%, rgba(100,140,203,0) 70%)',
    top: '-190px',
    right: '170px',
    pointerEvents: 'none',
  },

  heroGlowTwo: {
    position: 'absolute',
    width: '230px',
    height: '230px',
    borderRadius: '50%',
    background:
      'radial-gradient(circle, rgba(255,255,255,.10) 0%, rgba(255,255,255,0) 70%)',
    right: '-70px',
    bottom: '-145px',
    pointerEvents: 'none',
  },

  heroContent: {
    position: 'relative',
    zIndex: 2,
    minHeight: '125px',
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'flex-start',
    gap: '28px',
  },

  heroEyebrow: {
    display:
      'inline-flex',
    alignItems: 'center',
    gap: '7px',
    color: '#B9CCED',
    fontSize: '10px',
    fontWeight: '900',
    letterSpacing: '1px',
    marginBottom: '9px',
  },

  heroTitle: {
    margin: 0,
    color: '#FFFFFF',
    fontSize: '36px',
    fontWeight: '950',
    letterSpacing: '-1px',
    lineHeight: 1.1,
  },

  heroSubtitle: {
    margin: '9px 0 0',
    maxWidth: '590px',
    color:
      'rgba(255,255,255,.73)',
    fontSize: '14px',
    lineHeight: 1.55,
    fontWeight: '600',
  },






  errorBanner: {
    marginBottom: '18px',
    padding: '11px 13px',
    borderRadius: '12px',
    background: ROSE_SOFT,
    color: ROSE,
    border: `1px solid ${ROSE_BORDER}`,
    fontSize: '12px',
    fontWeight: '800',
  },

  quickAccessSection: {
    marginBottom: '17px',
  },

  quickAccessHeader: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '14px',
    marginBottom: '12px',
    paddingLeft: '12px',
    borderLeft: '4px solid #0B1A3F',
  },

  quickAccessTitle: {
    margin: 0,
    color: NAVY,
    fontSize: '17px',
    fontWeight: '950',
    letterSpacing: '-.2px',
  },

  quickAccessSubtitle: {
    margin: '4px 0 0',
    color: '#96A1B3',
    fontSize: '10.5px',
    fontWeight: '700',
  },

  quickAccessGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '11px',
  },

  quickAccessCard: {
    width: '100%',
    minHeight: '86px',
    padding: '13px 14px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '11px',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow:
      '0 6px 18px rgba(45,60,95,.035)',
    transition:
      'transform .16s ease, box-shadow .16s ease',
  },

  quickAccessIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
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
    color: NAVY,
    fontSize: '12.5px',
    fontWeight: '900',
    lineHeight: 1.3,
  },

  quickAccessDescription: {
    marginTop: '3px',
    color: '#929DAF',
    fontSize: '9px',
    fontWeight: '700',
    lineHeight: 1.35,
  },

  primaryGrid: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(0,1.12fr) minmax(390px,.88fr)',
    gap: '17px',
    marginBottom: '17px',
  },

  secondaryGrid: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(0,1.12fr) minmax(330px,.88fr)',
    gap: '17px',
    marginBottom: '17px',
  },

  panel: {
    minWidth: 0,
    background: '#FFFFFF',
    border: `1px solid ${BORDER}`,
    borderRadius: '22px',
    overflow: 'hidden',
    boxShadow:
      '0 11px 30px rgba(48,65,105,.05)',
  },

  panelHeader: {
    minHeight: '82px',
    padding: '18px 20px 15px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent:
      'space-between',
    gap: '14px',
    borderBottom: `1px solid ${BORDER}`,
  },

  panelHeading: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '11px',
    minWidth: 0,
  },

  panelIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '11px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'center',
  },

  panelTitle: {
    margin: 0,
    color: NAVY,
    fontSize: '17px',
    fontWeight: '950',
    letterSpacing:
      '-.2px',
  },

  panelSubtitle: {
    margin: '4px 0 0',
    color: '#96A1B3',
    fontSize: '10.5px',
    lineHeight: 1.45,
    fontWeight: '700',
  },

  panelAction: {
    minHeight: '33px',
    padding: '0 10px',
    borderRadius: '9px',
    display:
      'inline-flex',
    alignItems: 'center',
    gap: '5px',
    flexShrink: 0,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '10px',
    fontWeight: '900',
  },

  panelBody: {
    padding:
      '14px 18px 18px',
  },

  itemList: {
    display: 'flex',
    flexDirection:
      'column',
    gap: '8px',
  },

  scheduleRow: {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    minHeight: '66px',
    border:
      '1px solid #E9EDF3',
    borderRadius: '14px',
    background: '#FFFFFF',
    padding:
      '10px 12px 10px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  scheduleAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '3px',
  },

  scheduleIcon: {
    width: '37px',
    height: '37px',
    borderRadius: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'center',
    flexShrink: 0,
  },

  scheduleMain: {
    flex: 1,
    minWidth: 0,
  },

  scheduleTitle: {
    color: NAVY,
    fontSize: '12.5px',
    fontWeight: '900',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow:
      'ellipsis',
  },

  scheduleMeta: {
    marginTop: '3px',
    color: '#96A1B3',
    fontSize: '9px',
    fontWeight: '700',
  },

  scheduleTime: {
    color: '#6F7D93',
    fontSize: '9.5px',
    fontWeight: '850',
    whiteSpace: 'nowrap',
  },

  academicGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit,minmax(105px,1fr))',
    gap: '10px',
  },

  academicMetric: {
    minHeight: '105px',
    padding: '13px',
    borderRadius: '15px',
    display: 'flex',
    flexDirection:
      'column',
    alignItems:
      'flex-start',
    justifyContent:
      'center',
  },

  academicIcon: {
    width: '33px',
    height: '33px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'center',
    marginBottom: '9px',
  },

  academicValue: {
    color: NAVY,
    fontSize: '21px',
    lineHeight: 1,
    fontWeight: '950',
  },

  academicLabel: {
    marginTop: '6px',
    fontSize: '9.5px',
    fontWeight: '900',
  },

  coursesFooter: {
    width: '100%',
    marginTop: '10px',
    minHeight: '39px',
    padding: '0 11px',
    borderRadius: '11px',
    border:
      '1px solid #E8ECF3',
    background: '#FAFBFD',
    color: '#66758E',
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '9.5px',
    fontWeight: '800',
  },

  upcomingRow: {
    width: '100%',
    minHeight: '60px',
    border:
      '1px solid #E9EDF3',
    borderRadius: '14px',
    background: '#FFFFFF',
    padding: '9px 11px',
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  upcomingDate: {
    minWidth: '84px',
    minHeight: '35px',
    padding: '0 8px',
    borderRadius: '10px',
    display:
      'inline-flex',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: '5px',
    flexShrink: 0,
    fontSize: '8.5px',
    fontWeight: '900',
  },

  upcomingMain: {
    flex: 1,
    minWidth: 0,
  },

  upcomingTitle: {
    color: NAVY,
    fontSize: '12px',
    fontWeight: '900',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow:
      'ellipsis',
  },

  upcomingMeta: {
    marginTop: '3px',
    color: '#98A2B3',
    fontSize: '9px',
    fontWeight: '700',
  },

  todoSummary: {
    padding: '6px 2px',
  },

  todoTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: '14px',
  },

  todoNumber: {
    color: NAVY,
    fontSize: '34px',
    lineHeight: 1,
    fontWeight: '950',
  },

  todoLabel: {
    marginTop: '5px',
    color: '#8E99AD',
    fontSize: '10px',
    fontWeight: '800',
  },

  todoPercent: {
    minWidth: '53px',
    minHeight: '37px',
    padding: '0 9px',
    borderRadius: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'center',
    fontSize: '11px',
    fontWeight: '950',
  },

  progressTrack: {
    height: '8px',
    marginTop: '19px',
    borderRadius: '999px',
    background: '#EDF1F5',
    overflow: 'hidden',
  },

  todoFooter: {
    marginTop: '9px',
    color: '#96A1B3',
    fontSize: '9px',
    fontWeight: '750',
  },

  campusRow: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(0,1.6fr) minmax(260px,.6fr)',
    gap: '12px',
  },

  announcementCard: {
    width: '100%',
    minHeight: '98px',
    border:
      '1px solid #E9EDF3',
    borderRadius: '15px',
    padding: '13px',
    background: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    gap: '11px',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  announcementIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'center',
    flexShrink: 0,
  },

  announcementBody: {
    flex: 1,
    minWidth: 0,
  },

  announcementMeta: {
    color: TERRACOTTA,
    fontSize: '8px',
    fontWeight: '950',
    letterSpacing: '.6px',
    marginBottom: '4px',
  },

  announcementTitle: {
    color: NAVY,
    fontSize: '12.5px',
    fontWeight: '900',
    lineHeight: 1.35,
  },

  announcementText: {
    marginTop: '4px',
    color: '#8995A8',
    fontSize: '9.5px',
    lineHeight: 1.4,
    fontWeight: '650',
    display:
      '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient:
      'vertical',
    overflow: 'hidden',
  },

  notificationSummary: {
    width: '100%',
    minHeight: '98px',
    border:
      '1px solid #E9EDF3',
    borderRadius: '15px',
    padding: '13px',
    background: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    gap: '11px',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  notificationIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'center',
    flexShrink: 0,
  },

  notificationTitle: {
    color: NAVY,
    fontSize: '12px',
    fontWeight: '900',
  },

  notificationText: {
    marginTop: '4px',
    color: '#929DAF',
    fontSize: '9.5px',
    fontWeight: '700',
  },

  noAnnouncement: {
    minHeight: '98px',
    border:
      '1px dashed #DDE3EB',
    borderRadius: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'center',
    color: '#97A2B4',
    fontSize: '10px',
    fontWeight: '750',
  },

  emptyState: {
    minHeight: '160px',
    display: 'flex',
    flexDirection:
      'column',
    alignItems: 'center',
    justifyContent:
      'center',
    textAlign: 'center',
    padding: '18px',
  },

  emptyIcon: {
    width: '47px',
    height: '47px',
    borderRadius: '14px',
    background: '#F2F5FA',
    border:
      '1px solid #E6EAF0',
    color: NAVY,
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'center',
    marginBottom: '10px',
  },

  emptyTitle: {
    color: NAVY,
    fontSize: '13px',
    fontWeight: '900',
  },

  emptyText: {
    maxWidth: '340px',
    marginTop: '5px',
    color: '#96A1B3',
    fontSize: '10px',
    fontWeight: '700',
    lineHeight: 1.45,
  },

  emptyAction: {
    marginTop: '11px',
    minHeight: '31px',
    padding: '0 10px',
    borderRadius: '9px',
    border:
      '1px solid #E2E7EF',
    background: '#FFFFFF',
    color: NAVY,
    display:
      'inline-flex',
    alignItems: 'center',
    gap: '5px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '9px',
    fontWeight: '900',
  },

  workspaceSection: {
    marginTop: '17px',
    display: 'flex',
    flexDirection: 'column',
    gap: '17px',
  },

  workspaceSectionHeader: {
    marginTop: '3px',
    marginBottom: '-3px',
    padding: '14px 16px',
    borderRadius: '16px',
    background: '#F4F7FE',
    border: '1px solid #E2E8F1',
    boxShadow: 'inset 4px 0 0 #0B1A3F',
  },

  workspaceSectionTitle: {
    margin: 0,
    color: NAVY,
    fontSize: '19px',
    fontWeight: '950',
    letterSpacing: '-.3px',
  },

  workspaceSectionSubtitle: {
    margin: '5px 0 0',
    color: '#96A1B3',
    fontSize: '10.5px',
    fontWeight: '700',
  },

  miniTabsScroll: {
    display: 'flex',
    gap: '7px',
    overflowX: 'auto',
    paddingBottom: '10px',
    scrollbarWidth: 'none',
  },

  miniPill: {
    minHeight: '31px',
    padding: '0 10px',
    borderRadius: '999px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: 'inherit',
    fontSize: '9px',
    fontWeight: '900',
  },

  pillCount: {
    minWidth: '17px',
    height: '17px',
    padding: '0 4px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,.45)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '8px',
    fontWeight: '950',
  },

  previewList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  previewRow: {
    width: '100%',
    minHeight: '63px',
    border: '1px solid #E4E9F1',
    borderRadius: '14px',
    background: '#FFFFFF',
    boxShadow: '0 4px 12px rgba(11,26,63,.025)',
    padding: '10px 11px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  previewIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '11px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewMain: {
    flex: 1,
    minWidth: 0,
  },

  previewTopLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    justifyContent: 'space-between',
  },

  previewTitle: {
    minWidth: 0,
    color: NAVY,
    fontSize: '11.5px',
    fontWeight: '900',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  previewText: {
    marginTop: '3px',
    color: '#8F9AAF',
    fontSize: '9px',
    fontWeight: '650',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  previewTag: {
    flexShrink: 0,
    padding: '3px 6px',
    borderRadius: '6px',
    fontSize: '7.5px',
    fontWeight: '950',
    textTransform: 'uppercase',
  },

  chatPreviewShell: {
    border: '1px solid #E7ECEF',
    borderRadius: '15px',
    overflow: 'hidden',
    background: '#FBFDFC',
  },

  chatPreviewHeader: {
    minHeight: '53px',
    padding: '10px 12px',
    borderBottom: '1px solid #E4ECE9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    background: TEAL_SOFT,
  },

  chatPreviewTitle: {
    color: NAVY,
    fontSize: '11.5px',
    fontWeight: '900',
  },

  chatPreviewSubtitle: {
    marginTop: '2px',
    color: '#8C9A99',
    fontSize: '8.5px',
    fontWeight: '700',
  },

  chatMessages: {
    padding: '9px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  },

  chatMessageRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minHeight: '45px',
    padding: '6px 7px',
    borderRadius: '10px',
    background: '#FFFFFF',
    border: '1px solid #EDF1F0',
  },

  chatAvatar: {
    width: '29px',
    height: '29px',
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '9px',
    fontWeight: '950',
  },

  chatSender: {
    color: NAVY,
    fontSize: '9px',
    fontWeight: '900',
  },

  chatText: {
    marginTop: '2px',
    color: '#77859A',
    fontSize: '8.5px',
    fontWeight: '650',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  chatTime: {
    color: '#A0A9B8',
    fontSize: '7.5px',
    fontWeight: '700',
    flexShrink: 0,
  },

  carouselHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '9px',
    marginBottom: '11px',
  },

  carouselArrow: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    border: '1px solid #DDE4EE',
    background: '#F4F7FE',
    color: NAVY,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  carouselLabel: {
    minWidth: '165px',
    minHeight: '34px',
    padding: '0 11px',
    borderRadius: '10px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '10px',
    fontWeight: '950',
  },

  carouselCount: {
    minWidth: '20px',
    height: '20px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,.6)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 5px',
    fontSize: '8px',
  },

  priorityDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },

  miniEmpty: {
    border: '1px dashed #DDE3EA',
    borderRadius: '13px',
    background: '#FBFCFE',
    color: '#98A2B3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '15px',
    fontSize: '9.5px',
    fontWeight: '700',
    lineHeight: 1.45,
  },

  loadingCard: {
    minHeight: '140px',
    padding: '24px',
    borderRadius: '20px',
    background: '#FFFFFF',
    border: `1px solid ${BORDER}`,
    display: 'flex',
    alignItems: 'center',
    gap: '13px',
    boxShadow:
      '0 8px 25px rgba(15,23,42,.05)',
  },

  loadingIcon: {
    width: '47px',
    height: '47px',
    borderRadius: '14px',
    background: BLUE_SOFT,
    color: BLUE,
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'center',
  },

  loadingTitle: {
    color: NAVY,
    fontSize: '14px',
    fontWeight: '900',
  },

  loadingText: {
    marginTop: '3px',
    color: MUTED,
    fontSize: '10.5px',
    fontWeight: '700',
  },
};
