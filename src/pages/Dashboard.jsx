import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Compass,
  GraduationCap,
  Landmark,
  Megaphone,
  MessageSquare,
  Sparkles,
  Users,
  UserCheck,
  Activity,
  MapPin,
  Navigation,
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import { getAnnouncements } from '../lib/campusHub';
import aubCampusImage from './aub-campus.jpeg';

// =========================================================
// CAMPORA THEME
// =========================================================

const NAVY = '#0B1A3F';
const MUTED = '#8B97AD';
const BORDER = '#E8ECF3';

const PURPLE = '#7F7897';
const PURPLE_SOFT = '#F4F2F8';
const PURPLE_BORDER = '#E4DFEC';

const BLUE = '#6684AE';
const BLUE_SOFT = '#F1F5FA';
const BLUE_BORDER = '#D9E2ED';

const TERRACOTTA = '#B9826C';
const TERRACOTTA_SOFT = '#FBF4F1';
const TERRACOTTA_BORDER = '#EAD8D1';

const TEAL = '#6F948B';
const TEAL_SOFT = '#F1F7F5';
const TEAL_BORDER = '#D8E7E2';

const PINK = '#C76E8A';
const PINK_SOFT = '#FFF3F7';
const PINK_BORDER = '#F1D8E1';

const GOLD = '#B09262';
const GOLD_SOFT = '#FAF7F0';
const GOLD_BORDER = '#E9DFCC';

const ROSE = '#A97884';
const ROSE_SOFT = '#FAF3F5';
const ROSE_BORDER = '#E8D9DE';

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

  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';

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

  const date = new Date(`2000-01-01T${normalized}`);

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
    return `${formatPlannerTime(start)} – ${formatPlannerTime(end)}`;
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

  if (date.toDateString() === tomorrow.toDateString()) {
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

function plannerTypeIcon(type) {
  const normalized = String(type || '').toLowerCase();

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

  const [plannerItems, setPlannerItems] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseCredits, setCourseCredits] = useState({});
  const [courseSemesters, setCourseSemesters] = useState({});
  const [customSemesters, setCustomSemesters] = useState([]);
  const [semesterCreditOverrides, setSemesterCreditOverrides] = useState({});
  const [sharedCompletedCredits, setSharedCompletedCredits] = useState('');
  const [courseAssignments, setCourseAssignments] = useState([]);
  const [todos, setTodos] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [announcement, setAnnouncement] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    setError('');

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        navigate('/login', { replace: true });
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

      const semestersByCourse = safeParse(
        localStorage.getItem(
          localKey(user.id, 'semestersByCourse')
        ),
        {}
      );

      const savedCustomSemesters = safeParse(
        localStorage.getItem(
          localKey(user.id, 'customSemesters')
        ),
        []
      );

      const savedSemesterCredits = safeParse(
        localStorage.getItem(
          localKey(user.id, 'semesterCreditOverrides')
        ),
        {}
      );

      setCourseCredits(credits);
      setCourseSemesters(semestersByCourse);
      setCustomSemesters(savedCustomSemesters);
      setSemesterCreditOverrides(savedSemesterCredits);
      setSharedCompletedCredits(
        localStorage.getItem('campora-shared-completed-credits') || ''
      );
      setCourseAssignments(assignments);

      const [
        profileResult,
        plannerResult,
        coursesResult,
        todosResult,
        notificationsResult,
        announcementsResult,
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
          .order('date', { ascending: true })
          .order('start_time', { ascending: true }),

        supabase
          .from('courses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('todos')
          .select('*')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('notifications')
          .select('id,read')
          .eq('user_id', user.id),

        getAnnouncements().catch(() => []),
      ]);

      setProfile(
        profileResult.data || {
          name:
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'Student',
        }
      );

      setPlannerItems(plannerResult.data || []);
      setCourses(coursesResult.data || []);
      setTodos(todosResult.data || []);

      const notifications =
        notificationsResult.data || [];

      setUnreadCount(
        notifications.filter(item => !item.read).length
      );

      const announcements = Array.isArray(
        announcementsResult
      )
        ? announcementsResult
        : [];

      setAnnouncement(
        announcements.find(item => item.is_pinned) ||
          announcements[0] ||
          null
      );
    } catch (err) {
      console.error('Dashboard load error:', err);

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
      loadDashboard({ silent: true });
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const plannerChannel = supabase
      .channel(`dashboard_planner_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'planner_courses',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadDashboard({ silent: true });
        }
      )
      .subscribe();

    const notificationChannel = supabase
      .channel(`dashboard_notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadDashboard({ silent: true });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(plannerChannel);
      supabase.removeChannel(notificationChannel);
    };
  }, [userId]);

  const todayKey = localDateKey();

  const todaysSchedule = useMemo(() => {
    return plannerItems
      .filter(item => item.date === todayKey)
      .sort((a, b) =>
        String(a.start_time || '99:99').localeCompare(
          String(b.start_time || '99:99')
        )
      )
      .slice(0, 4);
  }, [plannerItems, todayKey]);

  const upcomingPlanner = useMemo(() => {
    return plannerItems
      .filter(item => {
        if (!item.date) return false;
        if (item.is_completed) return false;
        if (item.date < todayKey) return false;

        const type = String(item.type || '').toLowerCase();

        return !type.includes('class');
      })
      .sort((a, b) => {
        const dateSort = String(a.date || '').localeCompare(
          String(b.date || '')
        );

        if (dateSort !== 0) return dateSort;

        return String(a.start_time || '').localeCompare(
          String(b.start_time || '')
        );
      })
      .slice(0, 3);
  }, [plannerItems, todayKey]);

  const activeAssignments = useMemo(
    () =>
      courseAssignments.filter(
        assignment => !assignment.completed
      ),
    [courseAssignments]
  );

  useEffect(() => {
    const syncSharedCredits = () => {
      setSharedCompletedCredits(
        localStorage.getItem('campora-shared-completed-credits') || ''
      );
    };

    window.addEventListener('camporaCreditsUpdated', syncSharedCredits);
    window.addEventListener('storage', syncSharedCredits);

    return () => {
      window.removeEventListener('camporaCreditsUpdated', syncSharedCredits);
      window.removeEventListener('storage', syncSharedCredits);
    };
  }, []);

  const totalCredits = useMemo(() => {
    const semesterNames = Array.from(
      new Set([
        ...customSemesters,
        ...courses
          .map(course => courseSemesters[course.id] || course.semester)
          .filter(Boolean)
      ])
    );

    const calculated = semesterNames.reduce((sum, semesterName) => {
      const calculated = courses
        .filter(
          course =>
            (courseSemesters[course.id] || course.semester) === semesterName
        )
        .reduce(
          (semesterSum, course) =>
            semesterSum +
            Math.max(0, Number(courseCredits[course.id]) || 0),
          0
        );

      const override = semesterCreditOverrides[semesterName];
      const semesterCredits =
        override === '' || override === undefined || override === null
          ? calculated
          : Math.max(0, Number(override) || 0);

      return sum + semesterCredits;
    }, 0);

    return sharedCompletedCredits === ''
      ? calculated
      : Math.max(0, Number(sharedCompletedCredits) || 0);
  }, [
    courses,
    courseCredits,
    courseSemesters,
    customSemesters,
    semesterCreditOverrides,
    sharedCompletedCredits
  ]);

  const remainingTodos = useMemo(
    () =>
      todos.filter(task => !task.completed),
    [todos]
  );

  const completedTodos = useMemo(
    () =>
      todos.filter(task => task.completed),
    [todos]
  );

  const todoProgress =
    todos.length === 0
      ? 0
      : Math.round(
          (completedTodos.length / todos.length) * 100
        );

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
        <div style={styles.loadingCard}>
          <div style={styles.loadingIcon}>
            <Landmark size={25} />
          </div>

          <div>
            <div style={styles.loadingTitle}>
              Loading your dashboard
            </div>

            <div style={styles.loadingText}>
              Bringing together your Campora summary...
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

          .summary-card:hover,
          .quick-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 24px rgba(11,26,63,.07) !important;
          }

          .dashboard-quick-grid::-webkit-scrollbar {
            display: none;
          }

          @media (max-width: 960px) {
            .dashboard-main-grid,
            .dashboard-summary-grid {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 680px) {
            .dashboard-stat-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .dashboard-status-strip {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>

      <div className="dashboard-scroll" style={styles.page}>
        {/* HERO */}
        <section style={styles.hero}>
          <img
            src={aubCampusImage}
            alt="AUB campus"
            style={styles.heroImage}
          />
          <div style={styles.heroImageOverlay} />
          <div style={styles.heroGlowOne} />
          <div style={styles.heroGlowTwo} />

          <div style={styles.heroContent}>
            <div>
              <div style={styles.heroEyebrow}>
                <Sparkles size={13} />
                {dateLabel.toUpperCase()}
              </div>

              <h1 style={styles.heroTitle}>
                {greeting()},{' '}
                {capitalizeName(profile?.name)}
              </h1>

              <p style={styles.heroSubtitle}>
                Here’s what matters today.
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div style={styles.errorBanner}>
            {error}
          </div>
        )}

        {/* QUICK ACCESS */}
        <section style={styles.sectionBlock}>
          <div style={styles.sectionHeading}>
            <div>
              <h2 style={styles.sectionTitle}>
                Quick Access
              </h2>

              <p style={styles.sectionSubtitle}>
                Jump to your most-used spaces.
              </p>
            </div>
          </div>

          <div
            className="dashboard-quick-grid"
            style={styles.quickGrid}
          >
            <QuickLink
              icon={BookOpen}
              label="Courses"
              accent={PURPLE}
              soft={PURPLE_SOFT}
              border={PURPLE_BORDER}
              onClick={() => navigate('/courses')}
            />

            <QuickLink
              icon={UserCheck}
              label="Registration"
              accent={ROSE}
              soft={ROSE_SOFT}
              border={ROSE_BORDER}
              onClick={() => navigate('/registration')}
            />

            <QuickLink
              icon={Users}
              label="Study Groups"
              accent={PINK}
              soft={PINK_SOFT}
              border={PINK_BORDER}
              onClick={() => navigate('/study-groups')}
            />

            <QuickLink
              icon={MessageSquare}
              label="Messages"
              accent={BLUE}
              soft={BLUE_SOFT}
              border={BLUE_BORDER}
              onClick={() => navigate('/messages')}
            />

            <QuickLink
              icon={Activity}
              label="Campus Pulse"
              accent={TERRACOTTA}
              soft={TERRACOTTA_SOFT}
              border={TERRACOTTA_BORDER}
              onClick={() => navigate('/campus-pulse')}
            />

            <QuickLink
              icon={CalendarDays}
              label="Planner"
              accent={BLUE}
              soft={BLUE_SOFT}
              border={BLUE_BORDER}
              onClick={() => navigate('/planner')}
            />

            <QuickLink
              icon={CheckCircle2}
              label="To-Do"
              accent={TEAL}
              soft={TEAL_SOFT}
              border={TEAL_BORDER}
              onClick={() => navigate('/todo')}
            />

            <QuickLink
              icon={Megaphone}
              label="Campus Hub"
              accent={GOLD}
              soft={GOLD_SOFT}
              border={GOLD_BORDER}
              onClick={() => navigate('/announcements')}
            />
          </div>
        </section>

        {/* TODAY + UPCOMING */}
        <div
          className="dashboard-main-grid"
          style={styles.mainGrid}
        >
          <SummaryPanel
            title="Today"
            subtitle="Your schedule for today"
            icon={CalendarDays}
            accent={BLUE}
            soft={BLUE_SOFT}
            border={BLUE_BORDER}
            action="Planner"
            onAction={() => navigate('/planner')}
          >
            {todaysSchedule.length === 0 ? (
              <CompactEmpty
                text="Nothing scheduled today."
              />
            ) : (
              <div style={styles.list}>
                {todaysSchedule.map(item => (
                  <ScheduleRow
                    key={item.id}
                    item={item}
                    onClick={() =>
                      navigate('/planner', {
                        state: {
                          focusId: item.id,
                          focusDate: item.date,
                        },
                      })
                    }
                  />
                ))}
              </div>
            )}
          </SummaryPanel>

          <SummaryPanel
            title="Coming Up"
            subtitle="Your next deadlines and events"
            icon={Clock3}
            accent={TERRACOTTA}
            soft={TERRACOTTA_SOFT}
            border={TERRACOTTA_BORDER}
            action="Planner"
            onAction={() => navigate('/planner')}
          >
            {upcomingPlanner.length === 0 ? (
              <CompactEmpty
                text="Nothing coming up yet."
              />
            ) : (
              <div style={styles.list}>
                {upcomingPlanner.map(item => (
                  <UpcomingRow
                    key={item.id}
                    item={item}
                    onClick={() =>
                      navigate('/planner', {
                        state: {
                          focusId: item.id,
                          focusDate: item.date,
                        },
                      })
                    }
                  />
                ))}
              </div>
            )}
          </SummaryPanel>
        </div>

        {/* ACADEMIC + TASK SUMMARY */}
        <div
          className="dashboard-summary-grid"
          style={styles.summaryGrid}
        >
          <SummaryPanel
            title="Academic Snapshot"
            subtitle="Just the essentials"
            icon={BookOpen}
            accent={PURPLE}
            soft={PURPLE_SOFT}
            border={PURPLE_BORDER}
            action="Courses"
            onAction={() => navigate('/courses')}
          >
            <div
              className="dashboard-stat-grid"
              style={styles.statGrid}
            >
              <StatCard
                label="Courses"
                value={courses.length}
                accent={PURPLE}
                soft={PURPLE_SOFT}
              />

              <StatCard
                label="Credits"
                value={totalCredits}
                accent={GOLD}
                soft={GOLD_SOFT}
              />

              <StatCard
                label="Assignments"
                value={activeAssignments.length}
                accent={BLUE}
                soft={BLUE_SOFT}
              />
            </div>
          </SummaryPanel>

          <SummaryPanel
            title="To-Do Progress"
            subtitle="How your task list is going"
            icon={CheckCircle2}
            accent={TEAL}
            soft={TEAL_SOFT}
            border={TEAL_BORDER}
            action="To-Do"
            onAction={() => navigate('/todo')}
          >
            <div style={styles.todoWrap}>
              <div style={styles.todoTop}>
                <div>
                  <div style={styles.todoNumber}>
                    {remainingTodos.length}
                  </div>

                  <div style={styles.todoLabel}>
                    {remainingTodos.length === 1
                      ? 'task left'
                      : 'tasks left'}
                  </div>
                </div>

                <div
                  style={{
                    ...styles.todoPercent,
                    color: TEAL,
                    background: TEAL_SOFT,
                    border: `1px solid ${TEAL_BORDER}`,
                  }}
                >
                  {todoProgress}%
                </div>
              </div>

              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${todoProgress}%`,
                    background: TEAL,
                  }}
                />
              </div>

              <div style={styles.todoFooter}>
                {completedTodos.length} completed
              </div>
            </div>
          </SummaryPanel>
        </div>

        {/* CAMPUS UPDATE */}
        <SummaryPanel
          title="Campus Update"
          subtitle="One important thing from Campus Hub"
          icon={Megaphone}
          accent={GOLD}
          soft={GOLD_SOFT}
          border={GOLD_BORDER}
          action="Campus Hub"
          onAction={() => navigate('/announcements')}
        >
          {announcement ? (
            <button
              type="button"
              onClick={() => navigate('/announcements')}
              style={styles.announcementCard}
            >
              <div
                style={{
                  ...styles.announcementIcon,
                  color: GOLD,
                  background: GOLD_SOFT,
                  border: `1px solid ${GOLD_BORDER}`,
                }}
              >
                <Megaphone size={18} />
              </div>

              <div style={styles.announcementBody}>
                <div style={styles.announcementMeta}>
                  {announcement.is_pinned
                    ? 'PINNED'
                    : String(
                        announcement.category ||
                          'ANNOUNCEMENT'
                      ).toUpperCase()}
                </div>

                <div style={styles.announcementTitle}>
                  {announcement.title ||
                    'Campus announcement'}
                </div>

                {announcement.content && (
                  <div style={styles.announcementText}>
                    {announcement.content}
                  </div>
                )}
              </div>

              <ChevronRight
                size={18}
                color="#A4AEC0"
              />
            </button>
          ) : (
            <CompactEmpty
              text="No campus announcements right now."
            />
          )}
        </SummaryPanel>

        {/* SMALL STATUS STRIP */}
        <div className="dashboard-status-strip" style={styles.statusStrip}>
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            style={styles.statusItem}
          >
            <Bell
              size={17}
              color={PURPLE}
            />

            <span style={styles.statusText}>
              {unreadCount === 0
                ? 'No unread notifications'
                : `${unreadCount} unread ${
                    unreadCount === 1
                      ? 'notification'
                      : 'notifications'
                  }`}
            </span>

            <ChevronRight
              size={15}
              color="#A4AEC0"
            />
          </button>

          <div style={styles.statusDivider} />

          <button
            type="button"
            onClick={() => navigate('/registration')}
            style={styles.statusItem}
          >
            <Compass
              size={17}
              color={TERRACOTTA}
            />

            <span style={styles.statusText}>
              Registration tools
            </span>

            <ChevronRight
              size={15}
              color="#A4AEC0"
            />
          </button>

          <div style={styles.statusDivider} />

          <button
            type="button"
            onClick={() => navigate('/campus-pulse')}
            style={styles.statusItem}
          >
            <MessageSquare
              size={17}
              color={ROSE}
            />

            <span style={styles.statusText}>
              Campus Pulse
            </span>

            <ChevronRight
              size={15}
              color="#A4AEC0"
            />
          </button>
        </div>

        {/* CAMPUS MAP */}
        <section style={styles.mapPanel}>
          <div style={styles.mapHeader}>
            <div style={styles.mapHeading}>
              <div style={styles.mapIcon}>
                <MapPin size={19} />
              </div>

              <div>
                <h2 style={styles.mapTitle}>
                  Campus Map
                </h2>

                <p style={styles.mapSubtitle}>
                  Find buildings, classrooms and important places around campus.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                window.open(
                  'https://www.google.com/maps/search/?api=1&query=American+University+of+Beirut',
                  '_blank',
                  'noopener,noreferrer'
                )
              }
              style={styles.mapOpenButton}
            >
              Open Map
              <Navigation size={14} />
            </button>
          </div>

          <div style={styles.mapBody}>
            <iframe
              title="Campus Map"
              src="https://www.google.com/maps?q=American%20University%20of%20Beirut&output=embed"
              style={styles.mapFrame}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            <div style={styles.mapFloatingCard}>
              <div style={styles.mapFloatingIcon}>
                <Landmark size={17} />
              </div>

              <div>
                <div style={styles.mapFloatingTitle}>
                  AUB Campus
                </div>

                <div style={styles.mapFloatingText}>
                  Beirut, Lebanon
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

// =========================================================
// COMPONENTS
// =========================================================

function QuickLink({
  icon: Icon,
  label,
  accent,
  soft,
  border,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="quick-link"
      style={styles.quickLink}
    >
      <div
        style={{
          ...styles.quickIcon,
          color: accent,
          background: soft,
          border: `1px solid ${border}`,
        }}
      >
        <Icon size={19} />
      </div>

      <span style={styles.quickLabel}>
        {label}
      </span>

      <ChevronRight
        size={15}
        color="#A4AEC0"
      />
    </button>
  );
}

function SummaryPanel({
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
      className="summary-card"
      style={styles.panel}
    >
      <div style={styles.panelHeader}>
        <div style={styles.panelHeading}>
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
            <h2 style={styles.panelTitle}>
              {title}
            </h2>

            <p style={styles.panelSubtitle}>
              {subtitle}
            </p>
          </div>
        </div>

        {action && (
          <button
            type="button"
            onClick={onAction}
            style={styles.panelAction}
          >
            {action}
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      <div style={styles.panelBody}>
        {children}
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  accent,
  soft,
}) {
  return (
    <div
      style={{
        ...styles.statCard,
        background: soft,
      }}
    >
      <div style={styles.statValue}>
        {value}
      </div>

      <div
        style={{
          ...styles.statLabel,
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
  const Icon = plannerTypeIcon(item.type);

  const color =
    item.color &&
    /^#[0-9A-Fa-f]{6}$/.test(item.color)
      ? item.color
      : BLUE;

  return (
    <button
      type="button"
      onClick={onClick}
      style={styles.scheduleRow}
    >
      <div
        style={{
          ...styles.scheduleIcon,
          color,
          background: withAlpha(color, '14'),
          border: `1px solid ${withAlpha(
            color,
            '24'
          )}`,
        }}
      >
        <Icon size={16} />
      </div>

      <div style={styles.scheduleMain}>
        <div style={styles.scheduleTitle}>
          {item.name || 'Planner item'}
        </div>

        <div style={styles.scheduleMeta}>
          {item.type || 'Schedule'}
        </div>
      </div>

      <div style={styles.scheduleTime}>
        {formatTimeRange(
          item.start_time,
          item.end_time
        )}
      </div>
    </button>
  );
}

function UpcomingRow({
  item,
  onClick,
}) {
  const color =
    item.color &&
    /^#[0-9A-Fa-f]{6}$/.test(item.color)
      ? item.color
      : TERRACOTTA;

  return (
    <button
      type="button"
      onClick={onClick}
      style={styles.upcomingRow}
    >
      <div
        style={{
          ...styles.upcomingDate,
          color,
          background: withAlpha(color, '12'),
          border: `1px solid ${withAlpha(
            color,
            '24'
          )}`,
        }}
      >
        {formatUpcomingDate(item.date)}
      </div>

      <div style={styles.scheduleMain}>
        <div style={styles.scheduleTitle}>
          {item.name || 'Upcoming item'}
        </div>

        <div style={styles.scheduleMeta}>
          {item.type || 'Planner'}
          {item.start_time
            ? ` • ${formatPlannerTime(
                item.start_time
              )}`
            : ''}
        </div>
      </div>
    </button>
  );
}

function CompactEmpty({ text }) {
  return (
    <div style={styles.compactEmpty}>
      {text}
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
    padding: '4px 10px 24px 0',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    scrollBehavior: 'smooth',
    scrollbarWidth: 'thin',
  },

  hero: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: '168px',
    borderRadius: '24px',
    padding: '27px 31px',
    marginBottom: '20px',
    boxSizing: 'border-box',
    background:
      'linear-gradient(135deg, #08152F 0%, #0B1A3F 52%, #142B5A 100%)',
    boxShadow:
      '0 16px 38px rgba(11,26,63,0.14)',
  },

  heroImage: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center 48%',
    pointerEvents: 'none',
  },

  heroImageOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(90deg, rgba(8,21,47,.94) 0%, rgba(11,26,63,.80) 45%, rgba(11,26,63,.28) 100%)',
    pointerEvents: 'none',
  },

  heroGlowOne: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background:
      'radial-gradient(circle, rgba(113,136,170,.12) 0%, rgba(100,140,203,0) 70%)',
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
    minHeight: '112px',
    display: 'flex',
    alignItems: 'center',
  },

  heroEyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: '600',
    letterSpacing: '0.7px',
    marginBottom: '10px',
  },

  heroTitle: {
    margin: 0,
    color: '#FFFFFF',
    fontSize: '34px',
    fontWeight: '600',
    letterSpacing: '-1px',
    lineHeight: 1.1,
  },

  heroSubtitle: {
    margin: '9px 0 0',
    color: '#FFFFFF',
    fontSize: '16px',
    fontWeight: '600',
  },

  errorBanner: {
    marginBottom: '18px',
    padding: '11px 13px',
    borderRadius: '12px',
    background: ROSE_SOFT,
    color: ROSE,
    border: `1px solid ${ROSE_BORDER}`,
    fontSize: '13px',
    fontWeight: '800',
  },

  sectionBlock: {
    marginBottom: '18px',
  },

  sectionHeading: {
    marginBottom: '11px',
  },

  sectionTitle: {
    margin: 0,
    color: NAVY,
    fontSize: '18px',
    fontWeight: '800',
  },

  sectionSubtitle: {
    margin: '4px 0 0',
    color: '#96A1B3',
    fontSize: '12px',
    fontWeight: '600',
  },

  quickGrid: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    padding: '2px 28px 4px 0',
    scrollBehavior: 'smooth',
    scrollbarWidth: 'none',
    WebkitOverflowScrolling: 'touch',
  },

  quickLink: {
    width: '205px',
    minWidth: '205px',
    minHeight: '70px',
    padding: '10px 11px',
    borderRadius: '15px',
    border: '1px solid #EEF1F5',
    background: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow:
      '0 4px 14px rgba(11,26,63,.025)',
    transition:
      'transform .16s ease, box-shadow .16s ease',
  },

  quickIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  quickLabel: {
    flex: 1,
    minWidth: 0,
    textAlign: 'left',
    color: NAVY,
    fontSize: '13px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  mainGrid: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(0,1fr) minmax(0,1fr)',
    gap: '17px',
    marginBottom: '17px',
  },

  summaryGrid: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(0,1fr) minmax(0,1fr)',
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
      '0 8px 24px rgba(20,32,55,.04)',
    transition:
      'transform .16s ease, box-shadow .16s ease',
  },

  panelHeader: {
    minHeight: '74px',
    padding: '16px 18px 13px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    borderBottom: `1px solid ${BORDER}`,
  },

  panelHeading: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    minWidth: 0,
  },

  panelIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '11px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  panelTitle: {
    margin: 0,
    color: NAVY,
    fontSize: '16px',
    fontWeight: '800',
  },

  panelSubtitle: {
    margin: '4px 0 0',
    color: '#96A1B3',
    fontSize: '12px',
    lineHeight: 1.45,
    fontWeight: '600',
  },

  panelAction: {
    minHeight: '30px',
    padding: '0 9px',
    borderRadius: '9px',
    border: '1px solid #E4E9F1',
    background: '#FAFBFC',
    color: NAVY,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '9px',
    fontWeight: '700',
    flexShrink: 0,
  },

  panelBody: {
    padding: '13px 16px 16px',
  },

  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  },

  scheduleRow: {
    width: '100%',
    minHeight: '58px',
    padding: '9px 10px',
    borderRadius: '13px',
    border: '1px solid #E9EDF3',
    background: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
  },

  scheduleIcon: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  scheduleMain: {
    flex: 1,
    minWidth: 0,
  },

  scheduleTitle: {
    color: NAVY,
    fontSize: '13.5px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  scheduleMeta: {
    marginTop: '4px',
    color: '#8793A6',
    fontSize: '11px',
    fontWeight: '600',
  },

  scheduleTime: {
    color: '#6F7D93',
    fontSize: '11px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },

  upcomingRow: {
    width: '100%',
    minHeight: '58px',
    padding: '9px 10px',
    borderRadius: '13px',
    border: '1px solid #E9EDF3',
    background: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
  },

  upcomingDate: {
    minWidth: '75px',
    minHeight: '32px',
    padding: '0 8px',
    borderRadius: '9px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '8px',
    fontWeight: '800',
  },

  statGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(3, minmax(0, 1fr))',
    gap: '9px',
  },

  statCard: {
    minHeight: '88px',
    padding: '13px',
    borderRadius: '14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },

  statValue: {
    color: NAVY,
    fontSize: '22px',
    lineHeight: 1,
    fontWeight: '600',
  },

  statLabel: {
    marginTop: '8px',
    fontSize: '11.5px',
    fontWeight: '700',
  },

  todoWrap: {
    padding: '4px 2px',
  },

  todoTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '14px',
  },

  todoNumber: {
    color: NAVY,
    fontSize: '30px',
    lineHeight: 1,
    fontWeight: '600',
  },

  todoLabel: {
    marginTop: '6px',
    color: '#7F8B9F',
    fontSize: '12px',
    fontWeight: '700',
  },

  todoPercent: {
    minWidth: '52px',
    minHeight: '35px',
    padding: '0 9px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '800',
  },

  progressTrack: {
    height: '7px',
    marginTop: '17px',
    borderRadius: '999px',
    background: '#EDF1F5',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width .2s ease',
  },

  todoFooter: {
    marginTop: '9px',
    color: '#8995A8',
    fontSize: '11px',
    fontWeight: '600',
  },

  announcementCard: {
    width: '100%',
    minHeight: '84px',
    border: '1px solid #E9EDF3',
    borderRadius: '14px',
    padding: '12px',
    background: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
  },

  announcementIcon: {
    width: '39px',
    height: '39px',
    borderRadius: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  announcementBody: {
    flex: 1,
    minWidth: 0,
  },

  announcementMeta: {
    color: GOLD,
    fontSize: '9.5px',
    fontWeight: '800',
    letterSpacing: '.5px',
    marginBottom: '4px',
  },

  announcementTitle: {
    color: NAVY,
    fontSize: '13.5px',
    fontWeight: '700',
  },

  announcementText: {
    marginTop: '5px',
    color: '#7F8B9F',
    fontSize: '11.5px',
    lineHeight: 1.4,
    fontWeight: '650',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },

  compactEmpty: {
    minHeight: '82px',
    border: '1px dashed #DDE3EA',
    borderRadius: '13px',
    background: '#FBFCFE',
    color: '#8C98AA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '14px',
    fontSize: '12px',
    fontWeight: '700',
  },

  statusStrip: {
    margin: '17px 0',
    padding: '10px',
    borderRadius: '18px',
    background: '#FFFFFF',
    border: `1px solid ${BORDER}`,
    boxShadow:
      '0 6px 20px rgba(20,32,55,.03)',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '9px',
  },

  statusItem: {
    minWidth: 0,
    minHeight: '56px',
    padding: '0 13px',
    border: '1px solid #EEF1F5',
    borderRadius: '13px',
    background: '#FBFCFE',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
  },

  statusText: {
    flex: 1,
    color: NAVY,
    fontSize: '14px',
    lineHeight: 1.35,
    fontWeight: '700',
  },

  statusDivider: {
    display: 'none',
  },

  mapPanel: {
    marginTop: '17px',
    marginBottom: '10px',
    background: '#FFFFFF',
    border: `1px solid ${BORDER}`,
    borderRadius: '22px',
    overflow: 'hidden',
    boxShadow:
      '0 8px 24px rgba(20,32,55,.04)',
  },

  mapHeader: {
    minHeight: '76px',
    padding: '16px 18px 13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '14px',
    borderBottom: `1px solid ${BORDER}`,
  },

  mapHeading: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    minWidth: 0,
  },

  mapIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    background: BLUE_SOFT,
    border: `1px solid ${BLUE_BORDER}`,
    color: BLUE,
  },

  mapTitle: {
    margin: 0,
    color: NAVY,
    fontSize: '16px',
    fontWeight: '800',
  },

  mapSubtitle: {
    margin: '4px 0 0',
    color: '#96A1B3',
    fontSize: '12px',
    lineHeight: 1.4,
    fontWeight: '600',
  },

  mapOpenButton: {
    minHeight: '32px',
    padding: '0 10px',
    borderRadius: '9px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    flexShrink: 0,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '9px',
    fontWeight: '700',
    color: BLUE,
    background: BLUE_SOFT,
    border: `1px solid ${BLUE_BORDER}`,
  },

  mapBody: {
    position: 'relative',
    margin: '13px 16px 16px',
    height: '280px',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid #E4E9F1',
    background: '#F5F7FA',
  },

  mapFrame: {
    width: '100%',
    height: '100%',
    border: 0,
    display: 'block',
  },

  mapFloatingCard: {
    position: 'absolute',
    left: '14px',
    bottom: '14px',
    minWidth: '180px',
    padding: '9px 11px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background:
      'rgba(255,255,255,.94)',
    border:
      '1px solid rgba(223,229,239,.95)',
    boxShadow:
      '0 7px 20px rgba(11,26,63,.10)',
    backdropFilter: 'blur(10px)',
  },

  mapFloatingIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '9px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    background: BLUE_SOFT,
    color: BLUE,
    border: `1px solid ${BLUE_BORDER}`,
  },

  mapFloatingTitle: {
    color: NAVY,
    fontSize: '12px',
    fontWeight: '700',
  },

  mapFloatingText: {
    marginTop: '3px',
    color: '#8995A8',
    fontSize: '10px',
    fontWeight: '600',
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
    justifyContent: 'center',
  },

  loadingTitle: {
    color: NAVY,
    fontSize: '15px',
    fontWeight: '800',
  },

  loadingText: {
    marginTop: '3px',
    color: MUTED,
    fontSize: '10.5px',
    fontWeight: '600',
  },
};
