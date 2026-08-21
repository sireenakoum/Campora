import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
} from 'react-router-dom';

import {
  LayoutDashboard,
  Bell,
  BookOpen,
  Calendar,
  User,
  Users,
  MessageSquare,
  ChevronsLeft,
  ChevronsRight,
  CheckSquare,
  ShieldCheck,
  UserCheck,
  Activity,
  Network,
  LogOut,
  Search,
  Menu,
  Sun,
  Moon,
} from 'lucide-react';

import './App.css';
import camporaLogo from './assets/camporanavylogo.png';

import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import ChatBotWidget from './components/ChatBotWidget';

const About = lazy(() => import('./pages/About'));
const Features = lazy(() => import('./pages/Features'));
const Announcements = lazy(() => import('./pages/Announcements'));
const Notifications = lazy(() => import('./pages/Notifications'));
const CourseManagement = lazy(() => import('./pages/CourseManagement'));
const Planner = lazy(() => import('./pages/Planner'));
const DevPlannerHarness = lazy(() => import('./pages/DevPlannerHarness'));
const Todo = lazy(() => import('./pages/Todo'));
const StudyGroups = lazy(() => import('./pages/StudyGroups'));
const CampusPulse = lazy(() => import('./pages/CampusPulse'));
const AdminStudyGroups = lazy(() => import('./pages/AdminStudyGroups'));
const Registration = lazy(() => import('./pages/Registration'));
const Messages = lazy(() => import('./pages/Messages'));

const Onboarding = lazy(() => import('./pages/Onboarding'));
const Login = lazy(() => import('./Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Profile = lazy(() => import('./Profile'));
const ForgotPassword = lazy(() => import('./ForgotPassword'));
const ResetPassword = lazy(() => import('./ResetPassword'));

import { supabase } from './lib/supabase';
import { signOut } from './lib/auth';

import {
  getUnreadNotificationsForCurrentUser,
  getTodosForCurrentUser,
} from './lib/queries';

import {
  toast,
  getToasts,
  dismiss,
  subscribeToasts,
} from './lib/toast';

import {
  catchUpUnreadDmNotifications,
  dmViewStatus,
  ensureDmNotification,
} from './lib/dmNotifications';

const NAVY = '#0B1A3F';

const NAV_PRIMARY = [
  { to: '/dashboard', path: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/courses', path: 'courses', icon: BookOpen, label: 'Courses' },
  { to: '/registration', path: 'registration', icon: UserCheck, label: 'Registration' },
  { to: '/study-groups', path: 'study-groups', icon: Users, label: 'Study Groups' },
  { to: '/messages', path: 'messages', icon: MessageSquare, label: 'Messages' },
  { to: '/campus-pulse', path: 'campus-pulse', icon: Activity, label: 'Campus Pulse' },
];

const NAV_TOOLS = [
  { to: '/planner', path: 'planner', icon: Calendar, label: 'Planner' },
  { to: '/todo', path: 'todo', icon: CheckSquare, label: 'To-Do' },
  { to: '/announcements', path: 'announcements', icon: Network, label: 'Campus Hub' },
];

function NavRow({ to, label, icon: Icon, badge, rail, onNavigate }) {
  return (
    <NavLink
      to={to}
      data-path={to.slice(1)}
      title={rail ? label : undefined}
      className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
      onClick={onNavigate}
    >
      <Icon size={20} />
      <span>{label}</span>
      {badge > 0 && <span className="nav-badge">{badge > 99 ? '99+' : badge}</span>}
    </NavLink>
  );
}

function CommandPalette({ items, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setQuery('');
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, []);

  const q = query.trim().toLowerCase();

  const filtered = q
    ? items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.to.toLowerCase().includes(q)
      )
    : items;

  const choose = (item) => {
    onClose();
    onSelect(item.to);
  };

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div
        className="palette-card"
        role="dialog"
        aria-modal="true"
        aria-label="Quick navigation"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
          if (event.key === 'Enter' && filtered[0]) choose(filtered[0]);
        }}
      >
        <div className="palette-input-row">
          <Search size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Jump to a page…"
            className="palette-input"
          />
          <kbd className="palette-kbd">esc</kbd>
        </div>

        <div className="palette-list">
          {filtered.length === 0 ? (
            <div className="palette-empty">No matches found.</div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.to}
                  type="button"
                  className="palette-row"
                  onClick={() => choose(item)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function ToastViewport() {
  const [items, setItems] = useState(getToasts);

  useEffect(() => subscribeToasts(setItems), []);

  if (items.length === 0) return null;

  const themes = {
    announcements: {
      label: 'Announcements',
      color: '#648CCB',
      soft: '#F3F7FD',
      icon: Bell,
    },
    'campus-news': {
      label: 'Campus News',
      color: '#6F948B',
      soft: '#F1F7F5',
      icon: BookOpen,
    },
    events: {
      label: 'Events',
      color: '#C76E8A',
      soft: '#FFF3F7',
      icon: Calendar,
    },
    courses: {
      label: 'Courses',
      color: '#7D86B5',
      soft: '#F4F5FB',
      icon: BookOpen,
    },
    planner: {
      label: 'Planner',
      color: '#C76E8A',
      soft: '#FFF3F7',
      icon: Calendar,
    },
    registration: {
      label: 'Registration',
      color: '#D47B6A',
      soft: '#FFF5F2',
      icon: UserCheck,
    },
    todo: {
      label: 'To-Do',
      color: '#A87695',
      soft: '#FBF5F9',
      icon: CheckSquare,
    },
    'study-groups': {
      label: 'Study Groups',
      color: '#C99758',
      soft: '#FFF9F1',
      icon: Users,
    },
    'campus-pulse': {
      label: 'Campus Pulse',
      color: '#648CCB',
      soft: '#F3F7FD',
      icon: Activity,
    },
    messages: {
      label: 'New Message',
      color: '#648CCB',
      soft: '#F3F7FD',
      icon: MessageSquare,
    },
    default: {
      label: 'Campora',
      color: '#648CCB',
      soft: '#F3F7FD',
      icon: Bell,
    },
  };

  return (
    <div className="toast-viewport">
      {items.map((item) => {
        const theme = themes[item.source] || themes.default;
        const Icon = theme.icon;

        const lowerMessage = String(item.message || '').toLowerCase();
        const isReminder = item.kind === 'reminder' || lowerMessage.includes('reminder');
        const isNotification = item.kind === 'notification';
        const isMessage =
          item.source === 'messages' ||
          lowerMessage.includes('new message') ||
          lowerMessage.includes('direct message') ||
          lowerMessage.includes('received a message');

        return (
          <div
            key={item.id}
            className="toast"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              boxSizing: 'border-box',
              padding: '13px 14px',
              background: '#FFFFFF',
              border: `1px solid ${theme.color}35`,
              borderLeft: `4px solid ${theme.color}`,
              borderRadius: '16px',
              boxShadow: '0 14px 34px rgba(11,26,63,0.14)',
              color: '#0B1A3F',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                flexShrink: 0,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: theme.soft,
                color: theme.color,
              }}
            >
              {isMessage ? (
                <MessageSquare size={19} />
              ) : isReminder ? (
                <Bell size={19} />
              ) : (
                <Icon size={19} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  marginBottom: '3px',
                  color: theme.color,
                  fontSize: '10px',
                  fontWeight: '900',
                  letterSpacing: '.075em',
                  textTransform: 'uppercase',
                }}
              >
                {isMessage
                  ? 'New Message'
                  : isReminder
                  ? `${theme.label} Reminder`
                  : isNotification
                  ? `${theme.label} Notification`
                  : theme.label}
              </div>

              <div
                style={{
                  color: '#0B1A3F',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  lineHeight: 1.4,
                  overflowWrap: 'anywhere',
                }}
              >
                {item.message}
              </div>
            </div>

            <button
              type="button"
              className="toast-dismiss"
              onClick={() => dismiss(item.id)}
              style={{ color: '#8A95A7' }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}

function DmNotificationsListener() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (active) setUserId(data.user?.id || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    catchUpUnreadDmNotifications(userId);

    const channel = supabase
      .channel(`study_group_dm_notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload) => {
          const message = payload.new;

          if (!message || message.sender_id === userId) return;

          if (dmViewStatus.viewingPartnerId === message.sender_id) return;

          await ensureDmNotification({
            userId,
            message,
          });

          toast('You received a new message.', {
            source: 'messages',
            kind: 'message',
            duration: 3500,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return null;
}

function RealtimeNotificationsListener() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setUserId(data.user?.id || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const sourceFor = (row) => {
      const text = `${row?.category || ''} ${row?.title || ''}`.toLowerCase();
      if (text.includes('message')) return 'messages';
      if (text.includes('study group')) return 'study-groups';
      if (text.includes('registration') || text.includes('seat')) return 'registration';
      if (text.includes('course')) return 'courses';
      if (text.includes('planner')) return 'planner';
      if (text.includes('campus pulse') || text.includes('reply') || text.includes('comment')) return 'campus-pulse';
      if (text.includes('announcement') || text.includes('campus hub')) return 'announcements';
      if (text.includes('todo') || text.includes('to-do')) return 'todo';
      return 'default';
    };

    const channel = supabase
      .channel(`global_notifications_${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new || {};
          const title = String(row.title || '').trim();
          const message = String(row.message || row.content || '').trim();
          const combined = title && message ? `${title} — ${message}` : (message || title || 'You have a new notification.');
          toast(combined, { source: sourceFor(row), kind: 'notification', duration: 4500 });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  return null;
}

function EmailVerified() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/login'), 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAF9FE',
      }}
    >
      <div
        className="card"
        style={{
          padding: '3rem',
          textAlign: 'center',
          maxWidth: '400px',
        }}
      >
        <h1
          style={{
            fontSize: '24px',
            fontWeight: '900',
            color: '#1A1B1F',
          }}
        >
          ✅ Email Verified!
        </h1>

        <p
          style={{
            color: '#717786',
            margin: '20px 0',
            fontWeight: '700',
          }}
        >
          Redirecting you to login…
        </p>
      </div>
    </div>
  );
}

function DashboardLayout() {
  const [userName, setUserName] = useState('');
  const [userAvatarUrl, setUserAvatarUrl] = useState(
    () => localStorage.getItem('campora_avatar_url') || ''
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('campora_sidebar_collapsed') === 'true'
  );

  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);
  const [todoCount, setTodoCount] = useState(0);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem('campora_theme') || 'light'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('campora_theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleAvatarUpdated = (event) => {
      const nextUrl =
        event?.detail?.avatarUrl ||
        localStorage.getItem('campora_avatar_url') ||
        '';

      setUserAvatarUrl(nextUrl);

      if (event?.detail?.name) {
        setUserName(event.detail.name);
      }
    };

    window.addEventListener('campora-avatar-updated', handleAvatarUpdated);

    return () => {
      window.removeEventListener('campora-avatar-updated', handleAvatarUpdated);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_deactivated')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.is_deactivated) {
        await supabase.auth.signOut();

        navigate('/login', {
          replace: true,
          state: {
            message:
              'This account has been deactivated. Please contact a Campora administrator.',
          },
        });
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = async () => {
    localStorage.removeItem('campora_avatar_url');
    await signOut();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const onKey = (event) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === 'k'
      ) {
        event.preventDefault();
        setPaletteOpen((current) => !current);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    localStorage.setItem('campora_sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.is_deactivated) {
        await supabase.auth.signOut();

        navigate('/login', {
          replace: true,
          state: {
            message:
              'This account has been deactivated. Please contact a Campora administrator.',
          },
        });

        return;
      }

      if (!profile || profile.onboarding_completed !== true) {
        navigate('/onboarding', { replace: true });
        return;
      }

      const {
        data: adminRow,
        error: adminError,
      } = await supabase
        .from('campora_admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (adminError) {
        console.error('Admin check error:', adminError);
      }

      setIsAdmin(!!adminRow);

      setUserName(
        profile.name ||
          user.email?.split('@')[0] ||
          'Student'
      );

      const nextAvatarUrl = profile.avatar_url || '';
      setUserAvatarUrl(nextAvatarUrl);

      if (nextAvatarUrl) {
        localStorage.setItem('campora_avatar_url', nextAvatarUrl);
      } else {
        localStorage.removeItem('campora_avatar_url');
      }
    }

    init();
  }, [navigate]);

  useEffect(() => {
    let active = true;

    const refreshUnread = async () => {
      try {
        const unread = await getUnreadNotificationsForCurrentUser();

        if (active) setUnreadCount(unread.length);
      } catch (error) {
        console.error('Unread count error:', error);
      }
    };

    refreshUnread();

    const channel = supabase
      .channel('topbar_unread')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        refreshUnread
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const paletteItems = [
    ...NAV_PRIMARY,
    ...NAV_TOOLS,
    ...(isAdmin
      ? [
          {
            to: '/admin/study-groups',
            path: 'admin-study-groups',
            icon: ShieldCheck,
            label: 'Admin Reviews',
          },
        ]
      : []),
    {
      to: '/profile',
      path: 'profile',
      icon: User,
      label: 'Profile',
    },
  ];

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const todos = await getTodosForCurrentUser();

        if (active) {
          setTodoCount(todos.filter((todo) => !todo.completed).length);
        }
      } catch (error) {
        console.error('To-Do count error:', error);
      }
    })();

    return () => {
      active = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="layout">
      <DmNotificationsListener />
      <RealtimeNotificationsListener />

      <div
        className={mobileOpen ? 'scrim show' : 'scrim'}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={[
          collapsed ? 'sidebar collapsed' : 'sidebar',
          mobileOpen ? 'mobile-open' : '',
        ].join(' ')}
      >
        <div className="sidebar-brand">
          <img
            src={camporaLogo}
            alt="Campora logo"
            className="sidebar-brand-logo"
          />

          <span className="sidebar-wordmark">
            <span className="sidebar-wordmark-main">Campora</span>
            <span className="sidebar-wordmark-sub">Academic Portal</span>
          </span>
        </div>

        <nav>
          {NAV_PRIMARY.map((item) => (
            <NavRow
              key={item.to}
              {...item}
              rail={collapsed}
              onNavigate={() => {
                setMobileOpen(false);
                setAccountOpen(false);
              }}
            />
          ))}

          <span className="nav-section-label">Tools</span>

          {NAV_TOOLS.map((item) => (
            <NavRow
              key={item.to}
              {...item}
              badge={item.path === 'todo' ? todoCount : 0}
              rail={collapsed}
              onNavigate={() => {
                setMobileOpen(false);
                setAccountOpen(false);
              }}
            />
          ))}

          {isAdmin && (
            <NavRow
              to="/admin/study-groups"
              label="Admin Reviews"
              icon={ShieldCheck}
              rail={collapsed}
              onNavigate={() => {
                setMobileOpen(false);
                setAccountOpen(false);
              }}
            />
          )}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed((current) => !current)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronsRight size={18} />
            ) : (
              <ChevronsLeft size={18} />
            )}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header
          className="app-topbar"
          style={{
            position: 'relative',
            height: '82px',
            minHeight: '82px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '0 28px',
            boxSizing: 'border-box',
            border: 'none',
            borderBottom: 'none',
            boxShadow: 'none',
            outline: 'none',
            background: 'transparent',
          }}
        >
          <button
            type="button"
            className="topbar-menu-btn"
            onClick={() => {
              setCollapsed(false);
              setMobileOpen(true);
            }}
            aria-label="Open navigation menu"
          >
            <Menu size={22} strokeWidth={1.9} />
          </button>

          <button
            type="button"
            className="topbar-search-pill"
            onClick={() => setPaletteOpen(true)}
            aria-label="Search Campora"
          >
            <Search size={18} strokeWidth={1.9} color="#7E899A" />
            <span className="topbar-search-label">Search Campora…</span>
          </button>

          <div className="topbar-controls">
            <button
              type="button"
              title="Notifications"
              aria-label="Notifications"
              onClick={() => navigate('/notifications')}
              style={{
                position: 'relative',
                width: '28px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: NAVY,
                cursor: 'pointer',
              }}
            >
              <Bell size={20} strokeWidth={1.85} />

              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '-2px',
                    width: '11px',
                    height: '11px',
                    minWidth: '11px',
                    borderRadius: '50%',
                    background: '#0B1A3F',
                    border: '2px solid #FFFFFF',
                    boxShadow: '0 2px 8px rgba(11, 26, 63, 0.34)',
                  }}
                />
              )}
            </button>

            <button
              type="button"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              aria-label={
                theme === 'dark'
                  ? 'Switch to light mode'
                  : 'Switch to dark mode'
              }
              onClick={() =>
                setTheme((current) =>
                  current === 'dark' ? 'light' : 'dark'
                )
              }
              style={{
                width: '28px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: NAVY,
                cursor: 'pointer',
              }}
            >
              {theme === 'dark' ? (
                <Sun size={20} strokeWidth={1.85} />
              ) : (
                <Moon size={20} strokeWidth={1.85} />
              )}
            </button>

            <div className="topbar-avatar-wrap" style={{ position: 'relative' }}>
              <button
                type="button"
                className="topbar-avatar"
                title="Account menu"
                aria-expanded={accountOpen}
                aria-label="Account menu"
                onClick={() => setAccountOpen((current) => !current)}
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  border: '2px solid #FFFFFF',
                  borderRadius: '50%',
                  background: NAVY,
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 800,
                  letterSpacing: '0.01em',
                  cursor: 'pointer',
                  boxShadow: '0 3px 9px rgba(11, 26, 63, 0.16)',
                  overflow: 'hidden',
                }}
              >
                {userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt={userName || 'Profile'}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  userName.charAt(0).toUpperCase() || 'U'
                )}
              </button>

              {accountOpen && (
                <div className="topbar-avatar-menu">
                  <button
                    type="button"
                    className="account-pop-btn"
                    onClick={() => {
                      setAccountOpen(false);
                      navigate('/profile');
                    }}
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </button>

                  <div className="account-pop-divider" />

                  <button
                    type="button"
                    className="account-pop-btn account-pop-logout"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <Outlet />
      </main>

      {paletteOpen && (
        <CommandPalette
          items={paletteItems}
          onClose={() => setPaletteOpen(false)}
          onSelect={navigate}
        />
      )}

      <ChatBotWidget />
      <ToastViewport />
    </div>
  );
}

function RouteFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FBFCFE',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#0B1A3F',
          fontSize: '13px',
          fontWeight: '900',
        }}
      >
        <span
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            border: '3px solid rgba(11,26,63,.15)',
            borderTopColor: '#0B1A3F',
            animation: 'camporaSpin .7s linear infinite',
          }}
        />
        Loading Campora…
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/dev-planner" element={<DevPlannerHarness />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verified" element={<EmailVerified />} />
          <Route path="/onboarding" element={<Onboarding />} />

          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/campus-pulse" element={<CampusPulse />} />
            <Route path="/courses" element={<CourseManagement />} />
            <Route path="/registration" element={<Registration />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/todo" element={<Todo />} />
            <Route path="/study-groups" element={<StudyGroups />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/admin/study-groups" element={<AdminStudyGroups />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}
