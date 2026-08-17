import React, { useEffect, useMemo, useState } from 'react';

import {
  Bell,
  CheckCircle2,
  CalendarDays,
  Sparkles,
  Megaphone,
  GraduationCap,
  Users,
  CheckSquare,
  Clock,
  Trash2,
  Check,
  ClipboardCheck,
  AlarmClock,
  RotateCcw,
  Eraser,
  MessageSquare,
} from 'lucide-react';

import {
  SectionHeader,
} from '../components/luminous';

import { supabase } from '../lib/supabase';
import {
  getAnnouncements,
  getCampusNews,
  getEvents,
} from '../lib/campusHub';

const CATEGORY_STYLES = {
  Announcements: {
    main: '#648CCB',
    soft: '#F3F7FD',
    border: '#DDE7F5',
    icon: Megaphone,
  },

  'Campus News': {
    main: '#6F948B',
    soft: '#F1F7F5',
    border: '#D8E7E2',
    icon: Megaphone,
  },

  News: {
    main: '#6F948B',
    soft: '#F1F7F5',
    border: '#D8E7E2',
    icon: Megaphone,
  },

  Events: {
    main: '#C76E8A',
    soft: '#FFF3F7',
    border: '#F1D8E1',
    icon: CalendarDays,
  },

  Courses: {
    main: '#7D86B5',
    soft: '#F4F5FB',
    border: '#E1E3F0',
    icon: GraduationCap,
  },

  Registration: {
    main: '#D47B6A',
    soft: '#FFF5F2',
    border: '#F1D9D3',
    icon: ClipboardCheck,
  },

  Planner: {
    main: '#8B78B8',
    soft: '#F7F4FC',
    border: '#E7E0F2',
    icon: CalendarDays,
  },

  'Study Groups': {
    main: '#C99758',
    soft: '#FFF9F1',
    border: '#F0E2CB',
    icon: Users,
  },

  Direct: {
    main: '#648CCB',
    soft: '#F3F7FD',
    border: '#DDE7F5',
    icon: MessageSquare,
  },

  Mentors: {
    main: '#8B78B8',
    soft: '#F7F4FC',
    border: '#E7E0F2',
    icon: GraduationCap,
  },

  'To-Do': {
    main: '#A87695',
    soft: '#FBF5F9',
    border: '#EADDE5',
    icon: CheckSquare,
  },
};

const DEFAULT_STYLE = {
  main: '#75839A',
  soft: '#F7F9FC',
  border: '#E4E8EF',
  icon: Bell,
};

// =========================================================
// HELPERS
// =========================================================

function getCategoryStyle(category) {
  return CATEGORY_STYLES[category] || DEFAULT_STYLE;
}

function getStudyGroupStatus(item) {
  if (item.category !== 'Study Groups') {
    return null;
  }

  const fullText = `${item.title || ''} ${item.message || ''}`.toLowerCase();

  if (
    fullText.includes('accepted') ||
    fullText.includes('approved')
  ) {
    return {
      label: 'Accepted',
      color: '#5E9A8B',
      background: '#F2F9F7',
      border: '#D9EBE6',
    };
  }

  if (
    fullText.includes('declined') ||
    fullText.includes('rejected')
  ) {
    return {
      label: 'Declined',
      color: '#C76E7D',
      background: '#FFF5F6',
      border: '#F0DDE1',
    };
  }

  if (
    fullText.includes('request') ||
    fullText.includes('pending')
  ) {
    return {
      label: 'Pending',
      color: '#C99758',
      background: '#FFF9F1',
      border: '#F0E2CB',
    };
  }

  if (
    fullText.includes('public') &&
    fullText.includes('joined')
  ) {
    return {
      label: 'Joined',
      color: '#648CCB',
      background: '#F3F7FD',
      border: '#DDE7F5',
    };
  }

  return null;
}

function getSafeDate(value) {
  if (!value) return new Date().toISOString();

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return value;
}

function formatDate(value) {
  if (!value) return 'Recently';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  const today = new Date();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year:
      date.getFullYear() !== today.getFullYear()
        ? 'numeric'
        : undefined,
  });
}

function getSystemCategory(item) {
  const category = String(item.category || '').toLowerCase();
  const title = String(item.title || '').toLowerCase();

  const message = String(
    item.message || item.content || ''
  ).toLowerCase();

  const fullText = `${category} ${title} ${message}`;

  if (
    fullText.includes('campus news') ||
    category === 'news'
  ) {
    return 'Campus News';
  }

  if (
    fullText.includes('campus event') ||
    category === 'events' ||
    category === 'event'
  ) {
    return 'Events';
  }

  if (
    fullText.includes('study group') ||
    fullText.includes('studygroup')
  ) {
    return 'Study Groups';
  }

  if (
    fullText.includes('registration') ||
    fullText.includes('crn') ||
    fullText.includes('seat available') ||
    fullText.includes('section available')
  ) {
    return 'Registration';
  }

  if (
    fullText.includes('assignment') ||
    fullText.includes('quiz') ||
    fullText.includes('exam') ||
    fullText.includes('course') ||
    fullText.includes('class')
  ) {
    return 'Courses';
  }

  if (
    fullText.includes('to-do') ||
    fullText.includes('todo')
  ) {
    return 'To-Do';
  }

  if (
    fullText.includes('planner') ||
    fullText.includes('calendar')
  ) {
    return 'Planner';
  }

  return 'Announcements';
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function getNotificationPlacement(item) {
  const category = String(item.category || '').toLowerCase();
  const title = String(item.title || '').toLowerCase();
  const message = String(
    item.message || item.content || ''
  ).toLowerCase();

  const fullText = `${category} ${title} ${message}`;

  const hasMessageSignal =
    fullText.includes('message') ||
    fullText.includes('messaged') ||
    fullText.includes('chat') ||
    fullText.includes('replied') ||
    fullText.includes('reply');

  const isDirect =
    fullText.includes('direct message') ||
    fullText.includes('direct chat') ||
    fullText.includes(' dm ') ||
    category === 'direct' ||
    category === 'dm';

  const isMentor =
    fullText.includes('mentor');

  const isStudyGroup =
    fullText.includes('study group') ||
    fullText.includes('studygroup');

  // Keep membership / request decisions in normal Notifications.
  // Only actual group conversations belong in Messages.
  const isMembershipUpdate =
    fullText.includes('accepted') ||
    fullText.includes('approved') ||
    fullText.includes('declined') ||
    fullText.includes('rejected') ||
    fullText.includes('join request') ||
    fullText.includes('membership');

  if (isDirect) {
    return {
      section: 'Messages',
      category: 'Direct',
    };
  }

  if (isMentor && hasMessageSignal) {
    return {
      section: 'Messages',
      category: 'Mentors',
    };
  }

  if (
    isStudyGroup &&
    hasMessageSignal &&
    !isMembershipUpdate
  ) {
    return {
      section: 'Messages',
      category: 'Study Groups',
    };
  }

  return {
    section: 'Notifications',
    category: getSystemCategory(item),
  };
}

// =========================================================
// MAIN COMPONENT
// =========================================================

export default function Notifications() {
  const [activeSection, setActiveSection] =
    useState('Notifications');

  const [activeFilter, setActiveFilter] =
    useState('All');

  const [user, setUser] = useState(null);

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  // =======================================================
  // LOAD EVERYTHING
  // =======================================================

  useEffect(() => {
    loadEverything();
  }, []);

  // Live-refresh so newly created notifications (e.g. an unread direct
  // message in Study Groups) show up immediately without reloading the page.
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications_live_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadEverything();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  async function loadEverything() {
    setLoading(true);

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser);

      if (!currentUser) {
        setItems([]);
        setLoading(false);
        return;
      }

      const readKey =
        `campora-read-items-${currentUser.id}`;

      const hiddenAnnouncementKey =
        `campora-hidden-announcements-${currentUser.id}`;

      const savedReadIds = JSON.parse(
        localStorage.getItem(readKey) || '[]'
      );

      const hiddenAnnouncementIds = JSON.parse(
        localStorage.getItem(hiddenAnnouncementKey) || '[]'
      );

      let combined = [];

      // ===================================================
      // NORMAL NOTIFICATIONS TABLE
      // ===================================================

      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', {
            ascending: false,
          });

        if (!error && data) {
          combined.push(
            ...data.map((notification) => {
              const id = `notification-${notification.id}`;
              const placement =
                getNotificationPlacement(notification);

              return {
                id,
                rawId: notification.id,

                title:
                  notification.title ||
                  'Campus notification',

                message:
                  notification.message ||
                  notification.content ||
                  '',

                category:
                  placement.category,

                section:
                  placement.section,

                source: 'notifications',

                created_at: getSafeDate(
                  notification.created_at
                ),

                read:
                  Boolean(notification.read) ||
                  savedReadIds.includes(id),
              };
            })
          );
        }
      } catch (error) {
        console.log(
          'Notifications could not be loaded:',
          error
        );
      }

      // ===================================================
      // LOCAL TO-DO ALERTS
      // ===================================================

      try {
        const todoAlertLinks = JSON.parse(
          localStorage.getItem(
            `campora-todo-alert-links-${currentUser.id}`
          ) || '{}'
        );

        Object.entries(todoAlertLinks || {}).forEach(
          ([todoId, alert]) => {
            if (!alert?.type) return;

            const id = `todo-local-${todoId}`;

            combined.push({
              id,
              rawId: todoId,

              title:
                alert.title ||
                'To-Do',

              message: [
                alert.details || null,
                alert.date
                  ? `Due ${alert.date}${
                      alert.time ? ` at ${alert.time}` : ''
                    }`
                  : null,
                alert.priority
                  ? `${alert.priority} priority`
                  : null,
              ]
                .filter(Boolean)
                .join(' • '),

              category: 'To-Do',

              section:
                alert.type === 'reminder'
                  ? 'Reminders'
                  : 'Notifications',

              source: 'todo_local_alert',

              created_at: getSafeDate(
                alert.created_at
              ),

              read: savedReadIds.includes(id),
            });
          }
        );
      } catch (error) {
        console.log(
          'Local To-Do alerts could not be loaded:',
          error
        );
      }

      // ===================================================
      // LOCAL PLANNER NOTIFICATIONS
      // ===================================================

      try {
        const plannerAlertLinks = JSON.parse(
          localStorage.getItem(
            `campora-planner-alert-links-${currentUser.id}`
          ) || '{}'
        );

        Object.entries(plannerAlertLinks || {}).forEach(
          ([entryId, alert]) => {
            if (alert?.type !== 'notification') return;

            const id = `planner-local-${entryId}`;

            combined.push({
              id,
              rawId: entryId,

              title:
                alert.title ||
                'Planner Notification',

              message: [
                alert.entryType || null,
                alert.date
                  ? `on ${alert.date}`
                  : null,
                alert.time
                  ? `at ${String(alert.time).substring(0, 5)}`
                  : null,
                alert.description || null,
              ]
                .filter(Boolean)
                .join(' • '),

              category: 'Planner',

              section: 'Notifications',

              source: 'planner_local_alert',

              created_at: getSafeDate(
                alert.created_at
              ),

              read: savedReadIds.includes(id),
            });
          }
        );
      } catch (error) {
        console.log(
          'Local Planner notifications could not be loaded:',
          error
        );
      }

      // ===================================================
      // CAMPUS HUB ANNOUNCEMENTS
      // ===================================================

      try {
        const announcementsData =
          await getAnnouncements();

        if (Array.isArray(announcementsData)) {
          announcementsData.forEach((announcement) => {
            const id =
              `announcement-${announcement.id}`;

            // If the user cleared it from Notifications,
            // don't show it again.
            if (
              hiddenAnnouncementIds.includes(id)
            ) {
              return;
            }

            const title =
              announcement.title ||
              'Campus Announcement';

            const message =
              announcement.content ||
              announcement.message ||
              announcement.description ||
              '';

            /*
              Avoid showing the same announcement twice if
              your backend has ALSO already copied it into
              the notifications table.
            */
            const alreadyExists =
              combined.some((item) => {
                if (
                  item.section !== 'Notifications'
                ) {
                  return false;
                }

                return (
                  normalizeText(item.title) ===
                    normalizeText(title) &&
                  normalizeText(item.message) ===
                    normalizeText(message)
                );
              });

            if (alreadyExists) {
              return;
            }

            combined.push({
              id,
              rawId: announcement.id,

              title,

              message,

              category: 'Announcements',

              section: 'Notifications',

              source: 'campus_announcements',

              created_at: getSafeDate(
                announcement.created_at ||
                  announcement.published_at ||
                  announcement.date
              ),

              read:
                savedReadIds.includes(id),
            });
          });
        }
      } catch (error) {
        console.log(
          'Campus Hub announcements could not be loaded:',
          error
        );
      }

      // ===================================================
      // CAMPUS HUB NEWS
      // ===================================================

      try {
        const campusNewsData =
          await getCampusNews();

        if (Array.isArray(campusNewsData)) {
          campusNewsData.forEach((newsItem) => {
            const id = `campus-news-${newsItem.id}`;

            if (
              hiddenAnnouncementIds.includes(id)
            ) {
              return;
            }

            const title =
              newsItem.title ||
              newsItem.name ||
              'Campus News';

            const message =
              newsItem.summary ||
              newsItem.description ||
              newsItem.content ||
              '';

            const alreadyExists =
              combined.some((item) => {
                if (
                  item.section !== 'Notifications'
                ) {
                  return false;
                }

                return (
                  normalizeText(item.title) ===
                    normalizeText(title) &&
                  normalizeText(item.message) ===
                    normalizeText(message)
                );
              });

            if (alreadyExists) {
              return;
            }

            combined.push({
              id,
              rawId: newsItem.id,
              title,
              message,
              category: 'Campus News',
              section: 'Notifications',
              source: 'campus_news',
              created_at: getSafeDate(
                newsItem.created_at ||
                  newsItem.published_at ||
                  newsItem.date
              ),
              read: savedReadIds.includes(id),
            });
          });
        }
      } catch (error) {
        console.log(
          'Campus Hub news could not be loaded:',
          error
        );
      }

      // ===================================================
      // CAMPUS HUB EVENTS
      // ===================================================

      try {
        const campusEventsData =
          await getEvents({
            upcoming: true,
          });

        if (Array.isArray(campusEventsData)) {
          campusEventsData.forEach((eventItem) => {
            const id = `campus-event-${eventItem.id}`;

            if (
              hiddenAnnouncementIds.includes(id)
            ) {
              return;
            }

            const title =
              eventItem.title ||
              eventItem.name ||
              'Campus Event';

            const eventDate =
              eventItem.event_date ||
              eventItem.date ||
              eventItem.start_date ||
              '';

            const message = [
              eventDate
                ? `Event date: ${eventDate}`
                : '',
              eventItem.description ||
                eventItem.summary ||
                eventItem.content ||
                '',
            ]
              .filter(Boolean)
              .join(' • ');

            const alreadyExists =
              combined.some((item) => {
                if (
                  item.section !== 'Notifications'
                ) {
                  return false;
                }

                return (
                  normalizeText(item.title) ===
                    normalizeText(title) &&
                  normalizeText(item.message) ===
                    normalizeText(message)
                );
              });

            if (alreadyExists) {
              return;
            }

            combined.push({
              id,
              rawId: eventItem.id,
              title,
              message,
              category: 'Events',
              section: 'Notifications',
              source: 'campus_events',
              created_at: getSafeDate(
                eventItem.created_at ||
                  eventItem.published_at ||
                  eventItem.date ||
                  eventItem.event_date
              ),
              read: savedReadIds.includes(id),
            });
          });
        }
      } catch (error) {
        console.log(
          'Campus Hub events could not be loaded:',
          error
        );
      }

      // ===================================================
      // REGISTRATION REMINDERS
      // ===================================================

      try {
        const { data, error } = await supabase
          .from('course_reminders')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', {
            ascending: false,
          });

        if (!error && data) {
          combined.push(
            ...data.map((reminder) => {
              const id =
                `registration-${reminder.id}`;

              return {
                id,
                rawId: reminder.id,

                title:
                  reminder.course_name ||
                  reminder.course_code
                    ? `Registration Reminder: ${
                        reminder.course_name ||
                        reminder.course_code
                      }`
                    : 'Registration Reminder',

                message: [
                  reminder.crn
                    ? `CRN ${reminder.crn}`
                    : null,

                  reminder.target_section
                    ? `Section ${reminder.target_section}`
                    : null,

                  reminder.notes || null,
                ]
                  .filter(Boolean)
                  .join(' • '),

                category: 'Registration',

                section: 'Reminders',

                source: 'course_reminders',

                created_at: getSafeDate(
                  reminder.created_at
                ),

                read:
                  savedReadIds.includes(id),
              };
            })
          );
        }
      } catch (error) {
        console.log(
          'Registration reminders could not be loaded:',
          error
        );
      }

      // ===================================================
      // PLANNER REMINDERS
      // ===================================================

      try {
        const { data, error } = await supabase
          .from('planner_courses')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', {
            ascending: false,
          });

        if (!error && data) {
          data.forEach((plannerItem) => {
            const reminderEnabled =
              plannerItem.reminder === true ||
              plannerItem.has_reminder === true;

            if (!reminderEnabled) {
              return;
            }

            const type = String(
              plannerItem.type || ''
            ).toLowerCase();

            let category = 'Planner';

            if (
              type.includes('assignment') ||
              type.includes('exam') ||
              type.includes('quiz') ||
              type.includes('course')
            ) {
              category = 'Courses';
            }

            const id =
              `planner-${plannerItem.id}`;

            combined.push({
              id,
              rawId: plannerItem.id,

              title:
                plannerItem.name ||
                plannerItem.title ||
                `${
                  category === 'Courses'
                    ? 'Course'
                    : 'Planner'
                } Reminder`,

              message: [
                plannerItem.type || null,

                plannerItem.date
                  ? `on ${plannerItem.date}`
                  : null,

                plannerItem.start_time
                  ? `at ${plannerItem.start_time}`
                  : null,
              ]
                .filter(Boolean)
                .join(' '),

              category,

              section: 'Reminders',

              source: 'planner_courses',

              created_at: getSafeDate(
                plannerItem.created_at
              ),

              read:
                savedReadIds.includes(id),
            });
          });
        }
      } catch (error) {
        console.log(
          'Planner reminders could not be loaded:',
          error
        );
      }

      // ===================================================
      // TO-DO REMINDERS
      // ===================================================

      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', {
            ascending: false,
          });

        if (!error && data) {
          data.forEach((task) => {
            const reminderEnabled =
              task.reminder === true ||
              task.has_reminder === true;

            if (!reminderEnabled) {
              return;
            }

            const id =
              `todo-${task.id}`;

            combined.push({
              id,
              rawId: task.id,

              title:
                task.title ||
                task.name ||
                'To-Do Reminder',

              message: [
                task.due_date
                  ? `Due ${task.due_date}`
                  : null,

                task.due_time
                  ? `at ${task.due_time}`
                  : null,

                task.priority
                  ? `${task.priority} priority`
                  : null,
              ]
                .filter(Boolean)
                .join(' • '),

              category: 'To-Do',

              section: 'Reminders',

              source: 'tasks',

              created_at: getSafeDate(
                task.created_at
              ),

              read:
                savedReadIds.includes(id),
            });
          });
        }
      } catch (error) {
        console.log(
          'Tasks reminders table was not available.'
        );
      }

      // ===================================================
      // SORT EVERYTHING
      // ===================================================

      combined.sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
      );

      setItems(combined);
    } catch (error) {
      console.error(
        'Could not load notifications:',
        error
      );
    }

    setLoading(false);
  }

  // =======================================================
  // SECTIONS
  // =======================================================

  const notifications = useMemo(
    () =>
      items.filter(
        (item) =>
          item.section === 'Notifications'
      ),
    [items]
  );

  const reminders = useMemo(
    () =>
      items.filter(
        (item) =>
          item.section === 'Reminders'
      ),
    [items]
  );

  const messages = useMemo(
    () =>
      items.filter(
        (item) =>
          item.section === 'Messages'
      ),
    [items]
  );

  const currentItems =
    activeSection === 'Notifications'
      ? notifications
      : activeSection === 'Messages'
      ? messages
      : reminders;

  // =======================================================
  // FILTERS
  // =======================================================

  const notificationFilters = [
    'All',
    'Announcements',
    'Campus News',
    'Events',
    'Courses',
    'Planner',
    'Registration',
    'To-Do',
    'Study Groups',
  ];

  const messageFilters = [
    'All',
    'Direct',
    'Study Groups',
    'Mentors',
  ];

  const reminderFilters = [
    'All',
    'Courses',
    'Planner',
    'Registration',
    'To-Do',
  ];

  const availableFilters =
    activeSection === 'Notifications'
      ? notificationFilters
      : activeSection === 'Messages'
      ? messageFilters
      : reminderFilters;

  const filteredItems =
    useMemo(() => {
      if (activeFilter === 'All') {
        return currentItems;
      }

      return currentItems.filter(
        (item) =>
          item.category ===
          activeFilter
      );
    }, [
      items,
      activeSection,
      activeFilter,
    ]);

  // =======================================================
  // COUNTS
  // =======================================================

  const unreadCount =
    items.filter(
      (item) => !item.read
    ).length;

  const allRead =
    items.length > 0 &&
    items.every(
      (item) => item.read
    );

  const currentAllRead =
    currentItems.length > 0 &&
    currentItems.every(
      (item) => item.read
    );

  const notificationUnread =
    notifications.filter(
      (item) => !item.read
    ).length;

  const messageUnread =
    messages.filter(
      (item) => !item.read
    ).length;

  const reminderUnread =
    reminders.filter(
      (item) => !item.read
    ).length;

  // =======================================================
  // SAVE READ STATE
  // =======================================================

  function saveReadState(updatedItems) {
    if (!user) return;

    const readIds =
      updatedItems
        .filter(
          (item) => item.read
        )
        .map(
          (item) => item.id
        );

    localStorage.setItem(
      `campora-read-items-${user.id}`,
      JSON.stringify(readIds)
    );
  }

  // =======================================================
  // HIDE CAMPUS ANNOUNCEMENT FROM NOTIFICATIONS ONLY
  // =======================================================

  function hideCampusAnnouncement(item) {
    if (!user) return;

    const key =
      `campora-hidden-announcements-${user.id}`;

    const hidden =
      JSON.parse(
        localStorage.getItem(key) ||
          '[]'
      );

    if (!hidden.includes(item.id)) {
      hidden.push(item.id);
    }

    localStorage.setItem(
      key,
      JSON.stringify(hidden)
    );
  }

  // =======================================================
  // SINGLE READ TOGGLE
  // =======================================================

  async function toggleRead(item) {
    const nextValue =
      !item.read;

    let updatedItems = [];

    setItems((previous) => {
      updatedItems =
        previous.map(
          (current) =>
            current.id === item.id
              ? {
                  ...current,
                  read: nextValue,
                }
              : current
        );

      saveReadState(
        updatedItems
      );

      return updatedItems;
    });

    // Only normal notification rows have a read column
    // in the notifications table.
    if (
      item.source ===
      'notifications'
    ) {
      try {
        await supabase
          .from('notifications')
          .update({
            read: nextValue,
          })
          .eq(
            'id',
            item.rawId
          );
      } catch (error) {
        console.log(error);
      }
    }
  }

  // =======================================================
  // GLOBAL READ TOGGLE
  // =======================================================

  async function toggleAllRead() {
    if (
      items.length === 0
    ) {
      return;
    }

    const nextValue =
      !allRead;

    const updated =
      items.map(
        (item) => ({
          ...item,
          read: nextValue,
        })
      );

    setItems(updated);

    saveReadState(updated);

    if (user) {
      try {
        await supabase
          .from('notifications')
          .update({
            read: nextValue,
          })
          .eq(
            'user_id',
            user.id
          );
      } catch (error) {
        console.log(error);
      }
    }
  }

  // =======================================================
  // CURRENT SECTION READ TOGGLE
  // =======================================================

  async function toggleCurrentSectionRead() {
    if (
      currentItems.length === 0
    ) {
      return;
    }

    const nextValue =
      !currentAllRead;

    const updated =
      items.map(
        (item) =>
          item.section ===
          activeSection
            ? {
                ...item,
                read: nextValue,
              }
            : item
      );

    setItems(updated);

    saveReadState(updated);

    if (
      (activeSection === 'Notifications' ||
        activeSection === 'Messages') &&
      user
    ) {
      const notificationIds =
        currentItems
          .filter(
            (item) =>
              item.source === 'notifications'
          )
          .map((item) => item.rawId);

      if (notificationIds.length > 0) {
        try {
          await supabase
            .from('notifications')
            .update({
              read: nextValue,
            })
            .in('id', notificationIds);
        } catch (error) {
          console.log(error);
        }
      }
    }
  }

  // =======================================================
  // CLEAR ONE
  // =======================================================

  async function clearOne(item) {
    try {
      // Normal notification = actually remove its personal row
      if (
        item.source ===
        'notifications'
      ) {
        await supabase
          .from('notifications')
          .delete()
          .eq(
            'id',
            item.rawId
          );
      }

      // Campus announcement = ONLY hide it here.
      // Never delete the real Campus Hub announcement.
      if (
        item.source ===
        'campus_announcements'
      ) {
        hideCampusAnnouncement(
          item
        );
      }

      if (
        item.source ===
        'course_reminders'
      ) {
        await supabase
          .from(
            'course_reminders'
          )
          .delete()
          .eq(
            'id',
            item.rawId
          );
      }

      if (
        item.source ===
        'planner_courses'
      ) {
        try {
          await supabase
            .from(
              'planner_courses'
            )
            .update({
              reminder: false,
            })
            .eq(
              'id',
              item.rawId
            );
        } catch (error) {
          console.log(error);
        }
      }

      if (
        item.source ===
        'tasks'
      ) {
        try {
          await supabase
            .from('tasks')
            .update({
              reminder: false,
            })
            .eq(
              'id',
              item.rawId
            );
        } catch (error) {
          console.log(error);
        }
      }

      if (
        item.source ===
        'todo_local_alert'
      ) {
        try {
          const key =
            `campora-todo-alert-links-${user?.id}`;

          const links = JSON.parse(
            localStorage.getItem(key) || '{}'
          );

          delete links[item.rawId];

          localStorage.setItem(
            key,
            JSON.stringify(links)
          );
        } catch (error) {
          console.log(error);
        }
      }

      if (
        item.source ===
        'planner_local_alert'
      ) {
        try {
          const key =
            `campora-planner-alert-links-${user?.id}`;

          const links = JSON.parse(
            localStorage.getItem(key) || '{}'
          );

          delete links[item.rawId];

          localStorage.setItem(
            key,
            JSON.stringify(links)
          );
        } catch (error) {
          console.log(error);
        }
      }

      setItems(
        (previous) => {
          const updated =
            previous.filter(
              (current) =>
                current.id !==
                item.id
            );

          saveReadState(
            updated
          );

          return updated;
        }
      );
    } catch (error) {
      console.error(
        'Could not clear item:',
        error
      );
    }
  }

  // =======================================================
  // CLEAR CURRENT SECTION
  // =======================================================

  async function clearCurrentSection() {
    if (
      currentItems.length === 0 ||
      actionLoading
    ) {
      return;
    }

    setActionLoading(true);

    try {
      if (
        activeSection === 'Notifications' ||
        activeSection === 'Messages'
      ) {
        /*
          Campus Hub content is only hidden locally.
          We never delete the real Campus Hub content.
        */
        if (activeSection === 'Notifications') {
          currentItems
            .filter(
              (item) =>
                item.source === 'campus_announcements' ||
                item.source === 'campus_news' ||
                item.source === 'campus_events'
            )
            .forEach((item) => {
              hideCampusAnnouncement(item);
            });
        }

        /*
          Delete only the notification rows shown in the
          current section. This keeps Messages and
          Notifications independent from each other.
        */
        const notificationIds =
          currentItems
            .filter(
              (item) =>
                item.source === 'notifications'
            )
            .map((item) => item.rawId);

        if (
          user &&
          notificationIds.length > 0
        ) {
          await supabase
            .from('notifications')
            .delete()
            .in('id', notificationIds);
        }

        const remaining =
          items.filter(
            (item) =>
              item.section !== activeSection
          );

        setItems(remaining);
        saveReadState(remaining);
      }

      if (
        activeSection ===
        'Reminders'
      ) {
        if (user) {
          try {
            await supabase
              .from(
                'course_reminders'
              )
              .delete()
              .eq(
                'user_id',
                user.id
              );
          } catch (error) {
            console.log(error);
          }

          try {
            await supabase
              .from(
                'planner_courses'
              )
              .update({
                reminder: false,
              })
              .eq(
                'user_id',
                user.id
              );
          } catch (error) {
            console.log(error);
          }

          try {
            await supabase
              .from('tasks')
              .update({
                reminder: false,
              })
              .eq(
                'user_id',
                user.id
              );
          } catch (error) {
            console.log(error);
          }
        }

        const remaining =
          items.filter(
            (item) =>
              item.section !==
              'Reminders'
          );

        setItems(remaining);

        saveReadState(
          remaining
        );
      }
    } finally {
      setActionLoading(false);
    }
  }

  // =======================================================
  // CHANGE SECTION
  // =======================================================

  function changeSection(section) {
    setActiveSection(section);
    setActiveFilter('All');
  }

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div style={notificationsPageStyle}>
      {/* HEADER CONTROL ZONE */}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          marginBottom: 26,
        }}
      >
        <div
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '8px 14px',
            borderRadius: '999px',
            background: '#FFFFFF',
            color: '#0B1A3F',
            border: '1px solid #E3E8F0',
            boxShadow: '0 2px 8px rgba(11,26,63,0.03)',
            fontSize: '11px',
            fontWeight: '800',
            letterSpacing: '.35px',
          }}
        >
          <Sparkles size={13} color="var(--campora-navy)" />

          YOUR CAMPUS HUB
        </div>

        <SectionHeader
          title="Notifications, Messages & Reminders"
          subtitle="Keep campus updates, conversations and reminders organised in one place."
          action={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <span
                className="pill"
                style={{
                  background: '#FFFFFF',
                  color: '#0B1A3F',
                  border: '1px solid #FFFFFF',
                  boxShadow: '0 5px 16px rgba(11,26,63,0.08)',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#0B1A3F',
                  }}
                />

                {unreadCount} unread
              </span>

              <button
                type="button"
                onClick={toggleAllRead}
                disabled={items.length === 0}
                className="btn btn-primary"
                style={{
                  opacity: items.length === 0 ? 0.5 : 1,
                  cursor: items.length === 0 ? 'default' : 'pointer',
                }}
              >
                {allRead ? (
                  <RotateCcw size={15} />
                ) : (
                  <CheckCircle2 size={15} />
                )}

                {allRead
                  ? 'Mark all as unread'
                  : 'Mark all as read'}
              </button>
            </div>
          }
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '9px',
              background: 'transparent',
            }}
          >
            {[
              {
                value: 'Notifications',
                label: 'Notifications',
                icon: Bell,
              },
              {
                value: 'Messages',
                label: 'Messages',
                icon: MessageSquare,
              },
              {
                value: 'Reminders',
                label: 'Reminders',
                icon: AlarmClock,
              },
            ].map(({ value, label, icon: Icon }) => {
              const selected = activeSection === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => changeSection(value)}
                  style={{
                    minHeight: '38px',
                    padding: '0 15px',
                    borderRadius: '999px',
                    border: selected
                      ? '1px solid #0B1A3F'
                      : '1px solid #D8E0EB',
                    background: selected
                      ? '#0B1A3F'
                      : '#FFFFFF',
                    color: selected
                      ? '#FFFFFF'
                      : '#0B1A3F',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    fontFamily: 'inherit',
                    fontSize: '12px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    boxShadow: selected
                      ? '0 4px 12px rgba(11,26,63,.16)'
                      : '0 2px 6px rgba(11,26,63,.025)',
                  }}
                >
                  <Icon size={15} strokeWidth={2} />
                  {label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                minHeight: '32px',
                padding: '0 12px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#FFFFFF',
                color: '#0B1A3F',
                border: '1px solid #FFFFFF',
                boxShadow: '0 6px 18px rgba(11,26,63,0.08)',
                fontSize: '12px',
                fontWeight: '900',
                whiteSpace: 'nowrap',
              }}
            >
              {currentItems.length}{' '}
              {currentItems.length === 1
                ? 'item'
                : 'items'}{' '}
              ·{' '}
              {activeSection === 'Notifications'
                ? notificationUnread
                : activeSection === 'Messages'
                ? messageUnread
                : reminderUnread}{' '}
              unread
            </span>

            <button
              type="button"
              onClick={toggleCurrentSectionRead}
              disabled={currentItems.length === 0}
              className={`btn btn-sm ${
                currentItems.length === 0
                  ? ''
                  : 'btn-outline'
              }`}
              style={{
                opacity:
                  currentItems.length === 0 ? 0.5 : 1,
                cursor:
                  currentItems.length === 0
                    ? 'default'
                    : 'pointer',
                background: '#FFFFFF',
                color: '#0B1A3F',
                border: '1px solid #FFFFFF',
                boxShadow: '0 5px 16px rgba(11,26,63,0.08)',
              }}
            >
              {currentAllRead ? (
                <RotateCcw size={13} />
              ) : (
                <Check size={13} />
              )}

              {currentAllRead
                ? 'Mark section unread'
                : 'Mark section read'}
            </button>

            <button
              type="button"
              onClick={clearCurrentSection}
              disabled={
                currentItems.length === 0 ||
                actionLoading
              }
              className="btn btn-sm btn-danger"
              style={{
                opacity:
                  currentItems.length === 0 ||
                  actionLoading
                    ? 0.5
                    : 1,
                cursor:
                  currentItems.length === 0 ||
                  actionLoading
                    ? 'default'
                    : 'pointer',
              }}
            >
              <Eraser size={13} />

              Clear{' '}
              {activeSection.toLowerCase()}
            </button>
          </div>
        </div>

        {/* FILTER CHIPS */}

        <div className="filter-row">
          {availableFilters.map((filter) => {
            const active =
              activeFilter === filter;

            const filterStyle =
              filter === 'All'
                ? {
                    main:
                      'var(--campora-navy)',
                    icon:
                      activeSection === 'Notifications'
                        ? Bell
                        : activeSection === 'Messages'
                        ? MessageSquare
                        : AlarmClock,
                  }
                : getCategoryStyle(filter);

            const FilterIcon =
              filterStyle.icon;

            const count =
              filter === 'All'
                ? currentItems.length
                : currentItems.filter(
                    (item) =>
                      item.category ===
                      filter
                  ).length;

            return (
              <button
                key={filter}
                type="button"
                onClick={() =>
                  setActiveFilter(filter)
                }
                className="filter-chip"
                style={{
                  background: active
                    ? filter === 'All'
                      ? '#0B1A3F'
                      : filterStyle.main
                    : '#FFFFFF',
                  color: active
                    ? '#FFFFFF'
                    : filter === 'All'
                    ? '#0B1A3F'
                    : filterStyle.main,
                  borderColor: active
                    ? filter === 'All'
                      ? '#0B1A3F'
                      : filterStyle.main
                    : '#E2E7EF',
                  boxShadow: active
                    ? filter === 'All'
                      ? '0 4px 12px rgba(11,26,63,.16)'
                      : `0 4px 12px ${filterStyle.main}2A`
                    : 'none',
                }}
              >
                <FilterIcon
                  size={14}
                  strokeWidth={2}
                  color={
                    active
                      ? '#FFFFFF'
                      : filter === 'All'
                      ? '#0B1A3F'
                      : filterStyle.main
                  }
                />

                {filter}

                <span
                  style={{
                    minWidth: 18,
                    height: 18,
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 5px',
                    fontSize: '10px',
                    fontWeight: '800',
                    background: active
                      ? 'rgba(255,255,255,.18)'
                      : '#F7F9FC',
                    color: active
                      ? '#FFFFFF'
                      : filter === 'All'
                      ? '#0B1A3F'
                      : filterStyle.main,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LIST */}

      <div
        style={{
          minHeight: 350,
          background: 'transparent',
        }}
      >
        {loading ? (
          <div
            style={{
              minHeight: 280,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--campora-muted)',
              fontSize: '13px',
              fontWeight: '800',
            }}
          >
            Loading your updates...
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState section={activeSection} />
        ) : (
          <div className="stack" style={{ gap: '14px' }}>
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onToggleRead={() =>
                  toggleRead(item)
                }
                onClear={() =>
                  clearOne(item)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const notificationsPageStyle = {
  width: '100%',
  minHeight: '100%',
  boxSizing: 'border-box',
  background: 'transparent',
  padding: '8px 4px 28px',
};

// =========================================================
// ITEM CARD
// =========================================================

function ItemCard({ item, onToggleRead, onClear }) {
  const style =
    getCategoryStyle(
      item.category
    );

  const Icon = style.icon;
  const studyGroupStatus = getStudyGroupStatus(item);

  return (
    <div
      style={{
        opacity: item.read ? 0.62 : 1,
        transition: 'opacity 0.2s ease, transform 0.18s ease, box-shadow 0.18s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        width: '100%',
        padding: '16px 18px',
        borderRadius: '18px',
        background: '#FFFFFF',
        border: '1px solid #E5EAF2',
        boxShadow: item.read
          ? '0 3px 10px rgba(11,26,63,0.02)'
          : '0 6px 18px rgba(11,26,63,0.035)',
      }}
    >
      <span
        className="icon-chip"
        style={{
          width: 44,
          height: 44,
          flexShrink: 0,
          background: item.read
            ? '#F7F9FC'
            : '#F7F9FC',
          color: item.read
            ? '#8792A2'
            : style.main,
          border: '1px solid #E7EBF0',
          borderRadius: '14px',
        }}
      >
        <Icon size={18} strokeWidth={1.8} />
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 6,
          }}
        >
          <span
            style={{
              padding: '4px 9px',
              borderRadius: '999px',
              background: '#FFFFFF',
              color: item.read
                ? '#8792A2'
                : style.main,
              border: '1px solid #E5EAF2',
              fontSize: '10px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '.45px',
            }}
          >
            {item.category}
          </span>

          {!item.read && (
            <span
              style={{
                color: '#648CCB',
                background: '#F3F7FD',
                border: '1px solid #DDE7F5',
                borderRadius: '999px',
                padding: '4px 8px',
                fontSize: '9px',
                fontWeight: '900',
                letterSpacing: '.45px',
              }}
            >
              NEW
            </span>
          )}

          {studyGroupStatus && (
            <span
              style={{
                color: studyGroupStatus.color,
                background: studyGroupStatus.background,
                border: `1px solid ${studyGroupStatus.border}`,
                borderRadius: '999px',
                padding: '4px 8px',
                fontSize: '9px',
                fontWeight: '900',
                letterSpacing: '.45px',
                textTransform: 'uppercase',
              }}
            >
              {studyGroupStatus.label}
            </span>
          )}

          <span
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              color: item.read
                ? 'var(--campora-muted)'
                : 'var(--campora-navy)',
              fontSize: '11px',
              fontWeight: '700',
              whiteSpace: 'nowrap',
            }}
          >
            <Clock size={12} />

            {formatDate(item.created_at)}
          </span>
        </div>

        <h4
          style={{
            margin: '0 0 3px',
            fontSize: '15px',
            fontWeight: item.read ? '600' : '800',
            color: 'var(--campora-text)',
            lineHeight: 1.4,
          }}
        >
          {item.title}
        </h4>

        {item.message && (
          <p
            style={{
              margin: 0,
              color: 'var(--campora-body)',
              fontSize: '12px',
              fontWeight: '500',
              lineHeight: 1.45,
              overflowWrap: 'anywhere',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.message}
          </p>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 6,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onToggleRead}
          title={
            item.read
              ? 'Mark unread'
              : 'Mark read'
          }
          className="btn btn-sm"
          style={{
            background: item.read ? '#F8FAFC' : style.soft,
            color: item.read ? '#7D8796' : style.main,
            border: `1px solid ${item.read ? '#E7EBF0' : style.border}`,
          }}
        >
          {item.read ? (
            <RotateCcw size={12} />
          ) : (
            <Check size={12} />
          )}

          {item.read ? 'Unread' : 'Read'}
        </button>

        <button
          type="button"
          onClick={onClear}
          title="Clear"
          className="btn btn-sm"
          style={{
            background: '#FAFBFC',
            color: '#8A94A3',
            border: '1px solid #E8ECF1',
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// =========================================================
// EMPTY STATE
// =========================================================

function EmptyState({
  section,
}) {
  const isReminder =
    section === 'Reminders';

  const isMessages =
    section === 'Messages';

  const Icon = isReminder
    ? AlarmClock
    : isMessages
    ? MessageSquare
    : Bell;

  return (
    <div
      style={{
        minHeight: '260px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '32px 20px',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#FFFFFF',
          border: '1px solid #FFFFFF',
          boxShadow: '0 8px 22px rgba(11,26,63,0.10)',
          color: isReminder
            ? '#8B78B8'
            : isMessages
            ? '#648CCB'
            : '#0B1A3F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <Icon size={28} strokeWidth={1.9} />
      </div>

      <h3
        style={{
          margin: 0,
          color: '#0B1A3F',
          fontSize: '17px',
          fontWeight: '950',
        }}
      >
        {isReminder
          ? 'No reminders right now'
          : isMessages
          ? 'No new messages'
          : 'You’re all caught up!'}
      </h3>

      <p
        style={{
          margin: '7px 0 0',
          maxWidth: '470px',
          color: '#7E8A9E',
          fontSize: '12px',
          fontWeight: '700',
          lineHeight: 1.5,
        }}
      >
        {isReminder
          ? 'Assignment, planner, registration and To-Do reminders will appear here when you set them.'
          : isMessages
          ? 'Direct messages, study group conversations and mentor messages will appear here.'
          : 'Campus announcements, course updates and study group activity will appear here.'}
      </p>
    </div>
  );
}
