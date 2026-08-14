import React, { useState, useEffect, useRef } from 'react';
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
  ChevronsLeft,
  ChevronsRight,
  CheckSquare,
  ShieldCheck,
  UserCheck,
  Activity,
  Network,
  LogOut,
  Settings,
  Menu,
  Command,
  Search,
  School,
} from 'lucide-react';

import './App.css';
import camporaLogo from './assets/camporanavylogo.png';

import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import About from './pages/About';
import Features from './pages/Features';
import Announcements from './pages/Announcements';
import Notifications from './pages/Notifications';
import CourseManagement from './pages/CourseManagement';
import Planner from './pages/Planner';
import Todo from './pages/Todo';
import StudyGroups from './pages/StudyGroups';
import CampusPulse from './pages/CampusPulse';
import AdminStudyGroups from './pages/AdminStudyGroups';
import Registration from './pages/Registration';

import Onboarding from './pages/Onboarding';
import Login from './Login';
import SignUp from './pages/SignUp';
import Profile from './Profile';
import ForgotPassword from './ForgotPassword';

import { supabase } from './lib/supabase';
import { signOut } from './lib/auth';
import {
  getUnreadNotificationsForCurrentUser,
  getTodosForCurrentUser,
} from './lib/queries';
import { getToasts, dismiss, subscribeToasts } from './lib/toast';
import {
  catchUpUnreadDmNotifications,
  dmViewStatus,
  ensureDmNotification,
} from './lib/dmNotifications';

const TOPBAR_META = {
  '/dashboard': ['Dashboard', 'Your campus overview'],
  '/announcements': ['Announcements', 'Campus updates and notices'],
  '/notifications': [
    'Notifications & Reminders',
    'Manage your alerts and to-dos',
  ],
  '/campus-pulse': ['Campus Pulse', "What's happening around campus"],
  '/courses': ['Courses', 'Manage your classes and calendar'],
  '/registration': ['Registration', 'Course selection and swaps'],
  '/planner': ['Planner', 'Your schedule and deadlines'],
  '/todo': ['To-Do', 'Your task list'],
  '/study-groups': ['Study Groups', 'Circles and direct messages'],
  '/admin/study-groups': ['Admin Reviews', 'Moderate study groups and posts'],
  '/profile': ['Profile', 'Your account details'],
};

const NAV_PRIMARY = [
  { to: '/dashboard', path: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/courses', path: 'courses', icon: BookOpen, label: 'Courses' },
  { to: '/registration', path: 'registration', icon: UserCheck, label: 'Registration' },
  { to: '/study-groups', path: 'study-groups', icon: Users, label: 'Study Groups' },
  { to: '/campus-pulse', path: 'campus-pulse', icon: Activity, label: 'Campus Pulse' },
];

const NAV_TOOLS = [
  { to: '/planner', path: 'planner', icon: Calendar, label: 'Planner' },
  { to: '/todo', path: 'todo', icon: CheckSquare, label: 'To-Do' },
  { to: '/notifications', path: 'notifications', icon: Bell, label: 'Notifications' },
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
          item.label.toLowerCase().includes(q) || item.to.toLowerCase().includes(q)
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

  return (
    <div className="toast-viewport">
      {items.map((item) => (
        <div key={item.id} className={`toast toast-${item.kind}`}>
          <span>{item.message}</span>
          <button type="button" className="toast-dismiss" onClick={() => dismiss(item.id)}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// Watches for incoming study-group direct messages and creates an unread
// notification (with timestamp) for the recipient whenever they are not
// currently reading that conversation.
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

          // The user is reading this conversation right now, so the message
          // is already seen and no notification is needed.
          if (dmViewStatus.viewingPartnerId === message.sender_id) return;

          await ensureDmNotification({ userId, message });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
  const [userRole, setUserRole] = useState('Student');
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

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((current) => !current);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'campora_sidebar_collapsed',
      String(collapsed)
    );
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

      if (!profile || profile.onboarding_completed !== true) {
        navigate('/onboarding', { replace: true });
        return;
      }

      const { data: adminRow, error: adminError } = await supabase
        .from('campora_admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (adminError) {
        console.error('Admin check error:', adminError);
      }

      setIsAdmin(!!adminRow);
      setUserName(profile.name || user.email?.split('@')[0] || 'Student');
      setUserRole(profile.role || 'Student');
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

  const [topbarTitle, topbarSubtitle] =
    TOPBAR_META[location.pathname] || ['Campora', 'Academic portal'];

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
    { to: '/profile', path: 'profile', icon: User, label: 'Profile' },
  ];

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const todos = await getTodosForCurrentUser();
        if (active) {
          setTodoCount(
            todos.filter((todo) => !todo.completed).length
          );
        }
      } catch (error) {
        console.error('To-Do count error:', error);
      }
    })();
    return () => {
      active = false;
    };
  }, [location.pathname]);

  return (
    <div className="layout">
      <DmNotificationsListener />
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
        {/* BRAND */}
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

        {/* NAVIGATION */}
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
              badge={
                item.path === 'notifications'
                  ? unreadCount
                  : item.path === 'todo'
                    ? todoCount
                    : 0
              }
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

        {/* ACCOUNT FOOTER */}
        <div className="sidebar-footer">
          <div className="account-card">
            <button
              type="button"
              className="account-avatar"
              onClick={() => navigate('/profile')}
              title={collapsed ? 'Profile' : undefined}
            >
              {userName.charAt(0).toUpperCase() || 'U'}
            </button>
            <div className="account-meta">
              <span className="account-name">{userName || 'Student'}</span>
              <span className="account-role">{userRole}</span>
            </div>
            {!collapsed && (
              <button
                type="button"
                className="account-chevron"
                aria-expanded={accountOpen}
                aria-label="Account menu"
                onClick={() => setAccountOpen((current) => !current)}
              >
                <ChevronsRight
                  size={16}
                  style={{
                    transform: accountOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.25s ease',
                  }}
                />
              </button>
            )}

            {!collapsed && accountOpen && (
              <div className="account-popover">
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
                <button
                  type="button"
                  className="account-pop-btn"
                  onClick={() => {
                    setAccountOpen(false);
                    navigate('/profile');
                  }}
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
                <button
                  type="button"
                  className="account-pop-btn"
                  onClick={() =>
                    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
                  }
                >
                  {theme === 'dark' ? '☀️' : '🌙'}
                  <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
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
        <header className="app-topbar">
          <div className="topbar-title">
            <h2 className="topbar-title-text">{topbarTitle}</h2>
            <p className="topbar-subtitle">{topbarSubtitle}</p>
          </div>
          <div className="topbar-actions">
            <button
              type="button"
              className="topbar-icon-btn topbar-menu-btn"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <button
              type="button"
              className="topbar-search"
              onClick={() => setPaletteOpen(true)}
            >
              <Search size={18} />
              <span className="topbar-search-text">Search Campora…</span>
              <kbd className="topbar-kbd">
                <Command size={12} />
                K
              </kbd>
            </button>
            <button
              type="button"
              className="topbar-icon-btn"
              title="Notifications"
              onClick={() => navigate('/notifications')}
            >
              <Bell size={20} />
              {unreadCount > 0 && <span className="topbar-dot" />}
            </button>
            <button
              type="button"
              className="topbar-avatar"
              title="Profile"
              onClick={() => navigate('/profile')}
            >
              {userName.charAt(0).toUpperCase() || 'U'}
            </button>
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
      <ToastViewport />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route path="/verified" element={<EmailVerified />} />
        <Route path="/onboarding" element={<Onboarding />} />

        <Route element={<DashboardLayout />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/announcements"
            element={<Announcements />}
          />

          <Route
            path="/notifications"
            element={<Notifications />}
          />

          <Route
            path="/campus-pulse"
            element={<CampusPulse />}
          />

          <Route
            path="/courses"
            element={<CourseManagement />}
          />

          <Route
            path="/registration"
            element={<Registration />}
          />

          <Route
            path="/planner"
            element={<Planner />}
          />

          <Route
            path="/todo"
            element={<Todo />}
          />

          <Route
            path="/study-groups"
            element={<StudyGroups />}
          />

          <Route
            path="/admin/study-groups"
            element={<AdminStudyGroups />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />
        </Route>
      </Routes>
    </Router>
  );
}