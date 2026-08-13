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

import {
  PageShell,
  SectionHeader,
  SegmentedControl,
  EmptyState as LuminousEmptyState,
} from '../components/luminous';

import { supabase } from '../lib/supabase';
import { getAnnouncements } from '../lib/campusHub';

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
    <PageShell>
      {/* HEADER CONTROL ZONE */}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
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
            background: 'var(--campora-navy-tint-alpha)',
            color: 'var(--campora-navy)',
            fontSize: '11px',
            fontWeight: '800',
            letterSpacing: '.35px',
          }}
        >
          <Sparkles size={13} color="var(--campora-navy)" />

          YOUR CAMPUS HUB
        </div>

        <SectionHeader
          title="Notifications & Reminders"
          subtitle="Your updates and reminders, organised by where they actually come from."
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
                  background:
                    unreadCount > 0
                      ? 'var(--campora-navy-tint)'
                      : 'var(--surface-container-highest)',
                  color:
                    unreadCount > 0
                      ? 'var(--campora-navy)'
                      : 'var(--campora-muted)',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: unreadCount > 0 ? '#D9896A' : '#5E9A8B',
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
          <SegmentedControl
            options={[
              {
                value: 'Notifications',
                label: 'Notifications',
                icon: Bell,
              },
              {
                value: 'Reminders',
                label: 'Reminders',
                icon: AlarmClock,
              },
            ]}
            value={activeSection}
            onChange={changeSection}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <span
              className="muted"
              style={{
                fontSize: '13px',
                fontWeight: '700',
whiteSpace: 'nowrap',
              }}
            >
              {currentItems.length}{' '}
              {currentItems.length === 1
                ? 'item'
                : 'items'}{' '}
              ·{' '}
              {activeSection ===
              'Notifications'
                ? notificationUnread
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
                      activeSection ===
                      'Notifications'
                        ? Bell
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
                  background:
                    filter === 'All'
                      ? active
                        ? 'var(--campora-navy)'
                        : 'var(--campora-navy-tint-alpha)'
                      : active
                      ? filterStyle.main
                      : filterStyle.soft,
                  color:
                    active
                      ? 'var(--on-primary)'
                      : filter === 'All'
                      ? 'var(--campora-navy)'
                      : filterStyle.main,
                  borderColor:
                    filter === 'All'
                      ? active
                        ? 'var(--campora-navy)'
                        : 'var(--campora-navy-tint)'
                      : active
                      ? filterStyle.main
                      : filterStyle.border,
                  boxShadow: active
                    ? `0 5px 15px ${
                        filter === 'All'
                          ? 'rgba(0,45,98,.18)'
                          : `${filterStyle.main}2E`
                      }`
                    : 'none',
                }}
              >
                <FilterIcon
                  size={14}
                  strokeWidth={2}
                  color={
                    active
                      ? 'var(--on-primary)'
                      : filter === 'All'
                      ? 'var(--campora-navy)'
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
                      : 'rgba(255,255,255,.72)',
                    color: active
                      ? 'var(--on-primary)'
                      : filter === 'All'
                      ? 'var(--campora-navy)'
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

      <div style={{ minHeight: 350 }}>
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
          <div className="stack">
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
    </PageShell>
  );
}

// =========================================================
// ITEM CARD
// =========================================================

function ItemCard({ item, onToggleRead, onClear }) {
  const style =
    getCategoryStyle(
      item.category
    );

  const Icon = style.icon;

  return (
    <div
      className={`accent-row ${
        item.read ? '' : 'tone-primary'
      }`}
      style={{
        opacity: item.read ? 0.45 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      <span
        className="icon-chip"
        style={{
          width: 44,
          height: 44,
          flexShrink: 0,
          background: item.read
            ? 'var(--surface-variant)'
            : style.soft,
          color: item.read
            ? 'var(--on-surface-variant)'
            : style.main,
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
              background: item.read
                ? 'var(--surface-container)'
                : style.soft,
              color: item.read
                ? 'var(--campora-muted)'
                : style.main,
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
                color: style.main,
                fontSize: '10px',
                fontWeight: '800',
                letterSpacing: '.45px',
              }}
            >
              NEW
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
          className={`btn btn-sm ${
            item.read ? 'btn-outline' : 'btn-tinted'
          }`}
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
          className="btn btn-sm btn-danger"
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
    <LuminousEmptyState
      icon={Icon}
      title={
        isReminder
          ? 'No reminders right now'
          : 'You’re all caught up!'
      }
      text={
        isReminder
          ? 'Assignment, planner, registration and To-Do reminders will appear here when you set them.'
          : 'Campus announcements, course updates and study group activity will appear here.'
      }
    />
  );
}
