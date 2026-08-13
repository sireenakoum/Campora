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
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import { getAnnouncements } from '../lib/campusHub';

// =========================================================
// THEME
// =========================================================

const NAVY = '#0B1A3F';
const MUTED = '#8B97AD';
const BORDER = '#E8ECF3';
const PANEL = '#FFFFFF';
const PAGE_SOFT = '#F8FAFD';

const CATEGORY_STYLES = {
  Announcements: {
    main: '#D9896A',
    soft: '#FFF6F2',
    border: '#F3DDD4',
    icon: Megaphone,
  },

  Courses: {
    main: '#648CCB',
    soft: '#F3F7FD',
    border: '#DDE7F5',
    icon: GraduationCap,
  },

  Registration: {
    main: '#8B78B8',
    soft: '#F7F4FC',
    border: '#E7E0F2',
    icon: ClipboardCheck,
  },

  Planner: {
    main: '#5E9A8B',
    soft: '#F2F9F7',
    border: '#D9EBE6',
    icon: CalendarDays,
  },

  'Study Groups': {
    main: '#C99758',
    soft: '#FFF9F1',
    border: '#F0E2CB',
    icon: Users,
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
                  getSystemCategory(notification),

                section: 'Notifications',

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

  const currentItems =
    activeSection === 'Notifications'
      ? notifications
      : reminders;

  // =======================================================
  // FILTERS
  // =======================================================

  const notificationFilters = [
    'All',
    'Announcements',
    'Courses',
    'Planner',
    'To-Do',
    'Study Groups',
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
      activeSection ===
        'Notifications' &&
      user
    ) {
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
        activeSection ===
        'Notifications'
      ) {
        /*
          First hide Campus Hub announcements locally.
          We NEVER delete them from Campus Hub.
        */
        currentItems
          .filter(
            (item) =>
              item.source ===
              'campus_announcements'
          )
          .forEach((item) => {
            hideCampusAnnouncement(
              item
            );
          });

        /*
          Normal notifications belong to this user,
          so they can be removed from the notifications table.
        */
        if (user) {
          await supabase
            .from('notifications')
            .delete()
            .eq(
              'user_id',
              user.id
            );
        }

        const remaining =
          items.filter(
            (item) =>
              item.section !==
              'Notifications'
          );

        setItems(remaining);

        saveReadState(
          remaining
        );
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
    <div
      style={{
        width: '100%',
        maxWidth: '1140px',
        margin: '0 auto',
        paddingBottom: '44px',
        fontFamily: 'inherit',
      }}
    >
      {/* HEADER */}

      <div
        style={{
          marginBottom: '26px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent:
              'space-between',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',

                background: '#F7F9FC',
                color: NAVY,

                border: '1px solid rgba(11,26,63,0.14)',

                borderRadius: '999px',

                padding: '8px 14px',

                marginBottom: '11px',

                fontSize: '11px',
                fontWeight: '900',
                letterSpacing: '.35px',

                boxShadow:
                  '0 4px 12px rgba(11,26,63,.035)',
              }}
            >
              <Sparkles
                size={13}
                color={NAVY}
              />

              YOUR CAMPUS HUB
            </div>

            <h1
              style={{
                margin: 0,

                color: NAVY,

                fontSize: '38px',

                fontWeight: '950',

                letterSpacing:
                  '-1px',

                lineHeight: 1.1,
              }}
            >
              Notifications & Reminders
            </h1>

            <p
              style={{
                margin:
                  '9px 0 0',

                color: MUTED,

                fontSize: '15px',

                fontWeight: '650',

                lineHeight: 1.55,
              }}
            >
              Your updates and reminders,
              organised by where they
              actually come from.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display:
                  'inline-flex',
                alignItems:
                  'center',
                gap: '8px',

                minHeight:
                  '42px',

                padding:
                  '0 14px',

                borderRadius:
                  '12px',

                background:
                  '#F6F8FC',

                border: `1px solid ${BORDER}`,

                color: NAVY,

                fontSize:
                  '12px',

                fontWeight:
                  '900',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',

                  borderRadius:
                    '50%',

                  background:
                    unreadCount > 0
                      ? '#D9896A'
                      : '#5E9A8B',
                }}
              />

              {unreadCount} unread
            </div>

            <button
              type="button"
              onClick={
                toggleAllRead
              }
              disabled={
                items.length === 0
              }
              style={{
                border: 'none',

                minHeight:
                  '42px',

                padding:
                  '0 15px',

                borderRadius:
                  '12px',

                background:
                  items.length ===
                  0
                    ? '#EDF0F5'
                    : NAVY,

                color:
                  items.length ===
                  0
                    ? '#A0AABC'
                    : '#FFFFFF',

                display:
                  'inline-flex',

                alignItems:
                  'center',

                gap: '7px',

                cursor:
                  items.length ===
                  0
                    ? 'default'
                    : 'pointer',

                fontSize:
                  '12px',

                fontWeight:
                  '900',

                fontFamily:
                  'inherit',

                boxShadow:
                  items.length ===
                  0
                    ? 'none'
                    : '0 7px 17px rgba(11,26,63,.13)',
              }}
            >
              {allRead ? (
                <RotateCcw
                  size={15}
                />
              ) : (
                <CheckCircle2
                  size={15}
                />
              )}

              {allRead
                ? 'Mark all as unread'
                : 'Mark all as read'}
            </button>
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS / REMINDERS */}

      <div
        style={{
          display: 'grid',

          gridTemplateColumns:
            'repeat(2, minmax(0, 1fr))',

          gap: '17px',

          marginBottom: '23px',
        }}
      >
        <SectionCard
          active={
            activeSection ===
            'Notifications'
          }
          onClick={() =>
            changeSection(
              'Notifications'
            )
          }
          icon={Bell}
          title="Notifications"
          description="Announcements, course updates and study group activity"
          count={
            notifications.length
          }
          unread={
            notificationUnread
          }
          accent="#648CCB"
          soft="#F3F7FD"
        />

        <SectionCard
          active={
            activeSection ===
            'Reminders'
          }
          onClick={() =>
            changeSection(
              'Reminders'
            )
          }
          icon={AlarmClock}
          title="Reminders"
          description="Assignments, planner events, registration and To-Do reminders"
          count={
            reminders.length
          }
          unread={
            reminderUnread
          }
          accent="#8B78B8"
          soft="#F7F4FC"
        />
      </div>

      {/* MAIN PANEL */}

      <div
        style={{
          background: PANEL,

          border: `1px solid ${BORDER}`,

          borderRadius:
            '23px',

          overflow: 'hidden',

          boxShadow:
            '0 14px 35px rgba(56,73,115,.055)',
        }}
      >
        {/* PANEL TOP */}

        <div
          style={{
            padding:
              '19px 21px',

            borderBottom: `1px solid ${BORDER}`,

            display: 'flex',

            alignItems:
              'center',

            justifyContent:
              'space-between',

            gap: '12px',

            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,

                color: NAVY,

                fontSize:
                  '18px',

                fontWeight:
                  '950',
              }}
            >
              {activeSection}
            </h3>

            <p
              style={{
                margin:
                  '4px 0 0',

                color:
                  '#98A2B4',

                fontSize:
                  '11px',

                fontWeight:
                  '700',
              }}
            >
              {currentItems.length}{' '}
              {currentItems.length ===
              1
                ? 'item'
                : 'items'}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '7px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={
                toggleCurrentSectionRead
              }
              disabled={
                currentItems.length ===
                0
              }
              style={{
                minHeight:
                  '37px',

                border:
                  '1px solid #DDE2EB',

                background:
                  '#FFFFFF',

                color:
                  currentItems.length ===
                  0
                    ? '#A5ADBB'
                    : NAVY,

                borderRadius:
                  '10px',

                padding:
                  '0 12px',

                display:
                  'inline-flex',

                alignItems:
                  'center',

                gap: '6px',

                cursor:
                  currentItems.length ===
                  0
                    ? 'default'
                    : 'pointer',

                fontSize:
                  '11px',

                fontWeight:
                  '900',

                fontFamily:
                  'inherit',
              }}
            >
              {currentAllRead ? (
                <RotateCcw
                  size={13}
                />
              ) : (
                <Check
                  size={13}
                />
              )}

              {currentAllRead
                ? 'Mark section unread'
                : 'Mark section read'}
            </button>

            <button
              type="button"
              onClick={
                clearCurrentSection
              }
              disabled={
                currentItems.length ===
                  0 ||
                actionLoading
              }
              style={{
                minHeight:
                  '37px',

                border:
                  '1px solid #F0DDE1',

                background:
                  '#FFF8F9',

                color:
                  currentItems.length ===
                  0
                    ? '#C0AEB2'
                    : '#C75E72',

                borderRadius:
                  '10px',

                padding:
                  '0 12px',

                display:
                  'inline-flex',

                alignItems:
                  'center',

                gap: '6px',

                cursor:
                  currentItems.length ===
                    0 ||
                  actionLoading
                    ? 'default'
                    : 'pointer',

                fontSize:
                  '11px',

                fontWeight:
                  '900',

                fontFamily:
                  'inherit',
              }}
            >
              <Eraser
                size={13}
              />

              Clear{' '}
              {activeSection.toLowerCase()}
            </button>
          </div>
        </div>

        {/* FILTER BAR */}

        <div
          style={{
            background:
              PAGE_SOFT,

            padding:
              '13px 20px',

            borderBottom: `1px solid ${BORDER}`,

            display: 'flex',
            alignItems:
              'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          {availableFilters.map(
            (filter) => {
              const active =
                activeFilter ===
                filter;

              const filterStyle =
                filter === 'All'
                  ? {
                      main: NAVY,
                      soft:
                        '#EEF1F6',
                      border:
                        '#DDE2EA',
                      icon:
                        activeSection ===
                        'Notifications'
                          ? Bell
                          : AlarmClock,
                    }
                  : getCategoryStyle(
                      filter
                    );

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
                    setActiveFilter(
                      filter
                    )
                  }
                  style={{
                    minHeight:
                      '36px',

                    border: active
                      ? `1px solid ${filterStyle.main}`
                      : `1px solid ${filterStyle.border}`,

                    background:
                      active
                        ? filterStyle.main
                        : '#FFFFFF',

                    color: active
                      ? '#FFFFFF'
                      : filterStyle.main,

                    borderRadius:
                      '999px',

                    padding:
                      '0 12px',

                    display:
                      'inline-flex',

                    alignItems:
                      'center',

                    gap: '7px',

                    cursor:
                      'pointer',

                    fontSize:
                      '11px',

                    fontWeight:
                      '900',

                    fontFamily:
                      'inherit',

                    transition:
                      'all .18s ease',
                  }}
                >
                  <FilterIcon
                    size={13}
                  />

                  {filter}

                  <span
                    style={{
                      minWidth:
                        '18px',

                      height:
                        '18px',

                      borderRadius:
                        '999px',

                      display:
                        'inline-flex',

                      alignItems:
                        'center',

                      justifyContent:
                        'center',

                      padding:
                        '0 4px',

                      background:
                        active
                          ? 'rgba(255,255,255,.17)'
                          : filterStyle.soft,

                      fontSize:
                        '9px',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            }
          )}
        </div>

        {/* LIST */}

        <div
          style={{
            padding: '19px',

            minHeight:
              '350px',
          }}
        >
          {loading ? (
            <div
              style={{
                minHeight:
                  '280px',

                display: 'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',

                color: MUTED,

                fontSize:
                  '13px',

                fontWeight:
                  '800',
              }}
            >
              Loading your updates...
            </div>
          ) : filteredItems.length ===
            0 ? (
            <EmptyState
              section={
                activeSection
              }
            />
          ) : (
            <div
              style={{
                display: 'flex',

                flexDirection:
                  'column',

                gap: '10px',
              }}
            >
              {filteredItems.map(
                (item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onToggleRead={() =>
                      toggleRead(
                        item
                      )
                    }
                    onClear={() =>
                      clearOne(
                        item
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================================================
// SECTION CARD
// =========================================================

function SectionCard({
  active,
  onClick,
  icon: Icon,
  title,
  description,
  count,
  unread,
  accent,
  soft,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        minHeight: '112px',

        border: active
          ? `1.5px solid ${accent}55`
          : `1px solid ${BORDER}`,

        background: active
          ? `linear-gradient(135deg, #FFFFFF 0%, ${soft} 100%)`
          : '#FFFFFF',

        borderRadius:
          '21px',

        padding:
          '20px 22px',

        cursor: 'pointer',

        display: 'flex',

        alignItems:
          'center',

        gap: '16px',

        textAlign: 'left',

        fontFamily:
          'inherit',

        boxShadow: active
          ? `0 10px 26px ${accent}14, inset 0 0 0 1px ${accent}0A`
          : '0 5px 18px rgba(46,66,105,.035)',

        transition:
          'all .18s ease',
      }}
    >
      <div
        style={{
          width: '58px',
          height: '58px',

          borderRadius:
            '17px',

          background: active
            ? accent
            : soft,

          color: active
            ? '#FFFFFF'
            : accent,

          display: 'flex',

          alignItems:
            'center',

          justifyContent:
            'center',

          flexShrink: 0,

          border: active
            ? `1px solid ${accent}`
            : `1px solid ${accent}18`,

          boxShadow: active
            ? `0 7px 16px ${accent}22`
            : 'none',
        }}
      >
        <Icon size={27} />
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: 'flex',

            alignItems:
              'center',

            gap: '9px',

            marginBottom:
              '6px',
          }}
        >
          <span
            style={{
              color: NAVY,

              fontSize:
                '18px',

              fontWeight:
                '950',

              letterSpacing:
                '-0.2px',
            }}
          >
            {title}
          </span>

          {unread > 0 && (
            <span
              style={{
                minWidth:
                  '25px',

                height:
                  '25px',

                borderRadius:
                  '999px',

                padding:
                  '0 7px',

                background:
                  accent,

                color:
                  '#FFFFFF',

                display:
                  'inline-flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',

                fontSize:
                  '10px',

                fontWeight:
                  '950',

                boxShadow:
                  `0 4px 10px ${accent}30`,
              }}
            >
              {unread}
            </span>
          )}
        </div>

        <div
          style={{
            color:
              '#8F9AAF',

            fontSize:
              '12px',

            fontWeight:
              '700',

            lineHeight:
              '1.5',

            maxWidth:
              '360px',
          }}
        >
          {description}
        </div>
      </div>

      <div
        style={{
          minWidth: '42px',

          height: '42px',

          borderRadius:
            '13px',

          background: active
            ? soft
            : '#F7F9FC',

          border: active
            ? `1px solid ${accent}28`
            : '1px solid #E8ECF2',

          color: active
            ? accent
            : NAVY,

          display: 'flex',

          alignItems:
            'center',

          justifyContent:
            'center',

          fontSize:
            '14px',

          fontWeight:
            '950',

          flexShrink: 0,
        }}
      >
        {count}
      </div>
    </button>
  );
}

// =========================================================
// ITEM CARD
// =========================================================

function ItemCard({
  item,
  onToggleRead,
  onClear,
}) {
  const style =
    getCategoryStyle(
      item.category
    );

  const Icon = style.icon;

  return (
    <div
      style={{
        position: 'relative',

        overflow: 'hidden',

        display: 'flex',

        alignItems: 'center',

        justifyContent:
          'space-between',

        gap: '14px',

        padding:
          '15px 16px',

        borderRadius:
          '16px',

        background: item.read
          ? '#FCFDFE'
          : style.soft,

        border: item.read
          ? `1px solid ${BORDER}`
          : `1px solid ${style.border}`,
      }}
    >
      {!item.read && (
        <div
          style={{
            position:
              'absolute',

            left: 0,
            top: 0,
            bottom: 0,

            width: '3px',

            background:
              style.main,
          }}
        />
      )}

      <div
        style={{
          display: 'flex',

          alignItems:
            'center',

          gap: '12px',

          flex: 1,

          minWidth: 0,
        }}
      >
        <div
          style={{
            width: '42px',

            height: '42px',

            borderRadius:
              '12px',

            background:
              '#FFFFFF',

            border: item.read
              ? '1px solid #E5E9EF'
              : `1px solid ${style.border}`,

            color: item.read
              ? '#8D98AA'
              : style.main,

            display: 'flex',

            alignItems:
              'center',

            justifyContent:
              'center',

            flexShrink: 0,
          }}
        >
          <Icon size={18} />
        </div>

        <div
          style={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',

              alignItems:
                'center',

              gap: '6px',

              flexWrap:
                'wrap',

              marginBottom:
                '5px',
            }}
          >
            <span
              style={{
                padding:
                  '4px 8px',

                borderRadius:
                  '6px',

                background:
                  item.read
                    ? '#EEF1F5'
                    : style.main,

                color:
                  item.read
                    ? '#758196'
                    : '#FFFFFF',

                fontSize:
                  '9px',

                fontWeight:
                  '950',

                textTransform:
                  'uppercase',

                letterSpacing:
                  '.45px',
              }}
            >
              {item.category}
            </span>

            <span
              style={{
                display:
                  'inline-flex',

                alignItems:
                  'center',

                gap: '4px',

                color:
                  '#98A2B3',

                fontSize:
                  '10px',

                fontWeight:
                  '750',
              }}
            >
              <Clock size={11} />

              {formatDate(
                item.created_at
              )}
            </span>

            {!item.read && (
              <span
                style={{
                  color:
                    style.main,

                  fontSize:
                    '9px',

                  fontWeight:
                    '950',

                  letterSpacing:
                    '.45px',
                }}
              >
                NEW
              </span>
            )}
          </div>

          <h4
            style={{
              margin:
                '0 0 3px',

              color: NAVY,

              fontSize:
                '14px',

              fontWeight:
                item.read
                  ? '800'
                  : '950',

              lineHeight:
                1.4,
            }}
          >
            {item.title}
          </h4>

          {item.message && (
            <p
              style={{
                margin: 0,

                color:
                  '#718096',

                fontSize:
                  '11px',

                fontWeight:
                  '600',

                lineHeight:
                  1.45,

                overflowWrap:
                  'anywhere',
              }}
            >
              {item.message}
            </p>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',

          alignItems:
            'center',

          gap: '6px',

          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={
            onToggleRead
          }
          title={
            item.read
              ? 'Mark unread'
              : 'Mark read'
          }
          style={{
            minHeight:
              '33px',

            border: item.read
              ? '1px solid #DEE3EA'
              : `1px solid ${style.main}`,

            background:
              item.read
                ? '#FFFFFF'
                : style.main,

            color: item.read
              ? '#69768C'
              : '#FFFFFF',

            borderRadius:
              '9px',

            padding:
              '0 9px',

            cursor:
              'pointer',

            display:
              'inline-flex',

            alignItems:
              'center',

            gap: '4px',

            fontSize:
              '10px',

            fontWeight:
              '900',

            fontFamily:
              'inherit',
          }}
        >
          {item.read ? (
            <RotateCcw
              size={11}
            />
          ) : (
            <Check size={11} />
          )}

          {item.read
            ? 'Unread'
            : 'Read'}
        </button>

        <button
          type="button"
          onClick={onClear}
          title="Clear"
          style={{
            width: '33px',

            height: '33px',

            borderRadius:
              '9px',

            border:
              '1px solid #E6E9EF',

            background:
              '#FFFFFF',

            color:
              '#9DA6B5',

            display: 'flex',

            alignItems:
              'center',

            justifyContent:
              'center',

            cursor:
              'pointer',
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

  const Icon = isReminder
    ? AlarmClock
    : Bell;

  return (
    <div
      style={{
        minHeight:
          '280px',

        display: 'flex',

        flexDirection:
          'column',

        alignItems:
          'center',

        justifyContent:
          'center',

        textAlign:
          'center',

        padding: '28px',
      }}
    >
      <div
        style={{
          width: '66px',

          height: '66px',

          borderRadius:
            '20px',

          background:
            '#F2F5FA',

          border:
            '1px solid #E5E9F0',

          color: NAVY,

          display: 'flex',

          alignItems:
            'center',

          justifyContent:
            'center',

          marginBottom:
            '14px',
        }}
      >
        <Icon size={29} />
      </div>

      <h3
        style={{
          margin: 0,

          color: NAVY,

          fontSize: '19px',

          fontWeight:
            '950',
        }}
      >
        {isReminder
          ? 'No reminders right now'
          : 'You’re all caught up!'}
      </h3>

      <p
        style={{
          margin:
            '7px 0 0',

          color:
            '#98A2B3',

          fontSize:
            '12px',

          fontWeight:
            '650',

          maxWidth:
            '420px',

          lineHeight:
            1.55,
        }}
      >
        {isReminder
          ? 'Assignment, planner, registration and To-Do reminders will appear here when you set them.'
          : 'Campus announcements, course updates and study group activity will appear here.'}
      </p>
    </div>
  );
}