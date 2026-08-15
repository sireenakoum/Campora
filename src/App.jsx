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
  MessageSquare,
  ChevronsLeft,
  ChevronsRight,
  CheckSquare,
  ShieldCheck,
  UserCheck,
  Activity,
  Network,
  LogOut,
  Command,
  Search,
  Sun,
  Moon,
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
import DevPlannerHarness from './pages/DevPlannerHarness';
import Todo from './pages/Todo';
import StudyGroups from './pages/StudyGroups';
import CampusPulse from './pages/CampusPulse';
import AdminStudyGroups from './pages/AdminStudyGroups';
import Registration from './pages/Registration';
import Messages from './pages/Messages';

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

import {
  getToasts,
  dismiss,
  subscribeToasts,
} from './lib/toast';

import {
  catchUpUnreadDmNotifications,
  dmViewStatus,
  ensureDmNotification,
} from './lib/dmNotifications';


const NAV_PRIMARY = [
  {
    to: '/dashboard',
    path: 'dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    to: '/courses',
    path: 'courses',
    icon: BookOpen,
    label: 'Courses',
  },
  {
    to: '/registration',
    path: 'registration',
    icon: UserCheck,
    label: 'Registration',
  },
  {
    to: '/study-groups',
    path: 'study-groups',
    icon: Users,
    label: 'Study Groups',
  },
  {
    to: '/messages',
    path: 'messages',
    icon: MessageSquare,
    label: 'Messages',
  },
  {
    to: '/campus-pulse',
    path: 'campus-pulse',
    icon: Activity,
    label: 'Campus Pulse',
  },
];


const NAV_TOOLS = [
  {
    to: '/planner',
    path: 'planner',
    icon: Calendar,
    label: 'Planner',
  },
  {
    to: '/todo',
    path: 'todo',
    icon: CheckSquare,
    label: 'To-Do',
  },
  {
    to: '/announcements',
    path: 'announcements',
    icon: Network,
    label: 'Campus Hub',
  },
];


function NavRow({
  to,
  label,
  icon: Icon,
  badge,
  rail,
  onNavigate,
}) {
  return (
    <NavLink
      to={to}
      data-path={to.slice(1)}
      title={rail ? label : undefined}
      className={({ isActive }) =>
        isActive ? 'nav-item active' : 'nav-item'
      }
      onClick={onNavigate}
    >
      <Icon size={20} />

      <span>{label}</span>

      {badge > 0 && (
        <span className="nav-badge">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </NavLink>
  );
}


function CommandPalette({
  items,
  onClose,
  onSelect,
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setQuery('');

    const t = setTimeout(() => {
      inputRef.current?.focus();
    }, 30);

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
    <div
      className="palette-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="palette-card"
        role="dialog"
        aria-modal="true"
        aria-label="Quick navigation"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onClose();
          }

          if (
            event.key === 'Enter' &&
            filtered[0]
          ) {
            choose(filtered[0]);
          }
        }}
      >
        <div className="palette-input-row">
          <Search size={18} />

          <input
            ref={inputRef}
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Jump to a page…"
            className="palette-input"
          />

          <kbd className="palette-kbd">
            esc
          </kbd>
        </div>

        <div className="palette-list">
          {filtered.length === 0 ? (
            <div className="palette-empty">
              No matches found.
            </div>
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

  useEffect(
    () => subscribeToasts(setItems),
    []
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="toast-viewport">
      {items.map((item) => (
        <div
          key={item.id}
          className={`toast toast-${item.kind}`}
        >
          <span>{item.message}</span>

          <button
            type="button"
            className="toast-dismiss"
            onClick={() => dismiss(item.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}


function DmNotificationsListener() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (active) {
        setUserId(data.user?.id || null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id || null);
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    catchUpUnreadDmNotifications(userId);

    const channel = supabase
      .channel(
        `study_group_dm_notifications_${userId}`
      )
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

          if (
            !message ||
            message.sender_id === userId
          ) {
            return;
          }

          if (
            dmViewStatus.viewingPartnerId ===
            message.sender_id
          ) {
            return;
          }

          await ensureDmNotification({
            userId,
            message,
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


function EmailVerified() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(
      () => navigate('/login'),
      4000
    );

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
  const [isAdmin, setIsAdmin] = useState(false);

  const [collapsed, setCollapsed] = useState(
    () =>
      localStorage.getItem(
        'campora_sidebar_collapsed'
      ) === 'true'
  );

  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [todoCount, setTodoCount] =
    useState(0);

  const [accountOpen, setAccountOpen] =
    useState(false);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [paletteOpen, setPaletteOpen] =
    useState(false);

  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem('campora_theme') ||
      'light'
  );


  useEffect(() => {
    document.documentElement.dataset.theme =
      theme;

    localStorage.setItem(
      'campora_theme',
      theme
    );
  }, [theme]);


  const handleLogout = async () => {
    await signOut();

    navigate('/login', {
      replace: true,
    });
  };


  useEffect(() => {
    const onKey = (event) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === 'k'
      ) {
        event.preventDefault();

        setPaletteOpen(
          (current) => !current
        );
      }
    };

    window.addEventListener(
      'keydown',
      onKey
    );

    return () => {
      window.removeEventListener(
        'keydown',
        onKey
      );
    };
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
        navigate('/login', {
          replace: true,
        });

        return;
      }

      const { data: profile } =
        await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

      if (
        !profile ||
        profile.onboarding_completed !== true
      ) {
        navigate('/onboarding', {
          replace: true,
        });

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
        console.error(
          'Admin check error:',
          adminError
        );
      }

      setIsAdmin(!!adminRow);

      setUserName(
        profile.name ||
          user.email?.split('@')[0] ||
          'Student'
      );
    }

    init();
  }, [navigate]);


  useEffect(() => {
    let active = true;

    const refreshUnread = async () => {
      try {
        const unread =
          await getUnreadNotificationsForCurrentUser();

        if (active) {
          setUnreadCount(
            unread.length
          );
        }
      } catch (error) {
        console.error(
          'Unread count error:',
          error
        );
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
        const todos =
          await getTodosForCurrentUser();

        if (active) {
          setTodoCount(
            todos.filter(
              (todo) => !todo.completed
            ).length
          );
        }
      } catch (error) {
        console.error(
          'To-Do count error:',
          error
        );
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
        className={
          mobileOpen
            ? 'scrim show'
            : 'scrim'
        }
        onClick={() =>
          setMobileOpen(false)
        }
      />


      {/* SIDEBAR */}
      <aside
        className={[
          collapsed
            ? 'sidebar collapsed'
            : 'sidebar',
          mobileOpen
            ? 'mobile-open'
            : '',
        ].join(' ')}
      >

        <div className="sidebar-brand">
          <img
            src={camporaLogo}
            alt="Campora logo"
            className="sidebar-brand-logo"
          />

          <span className="sidebar-wordmark">
            <span className="sidebar-wordmark-main">
              Campora
            </span>

            <span className="sidebar-wordmark-sub">
              Academic Portal
            </span>
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


          <span className="nav-section-label">
            Tools
          </span>


          {NAV_TOOLS.map((item) => (
            <NavRow
              key={item.to}
              {...item}
              badge={
                item.path === 'todo'
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


        <div className="sidebar-footer">

          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() =>
              setCollapsed(
                (current) => !current
              )
            }
            title={
              collapsed
                ? 'Expand sidebar'
                : 'Collapse sidebar'
            }
            aria-label={
              collapsed
                ? 'Expand sidebar'
                : 'Collapse sidebar'
            }
          >
            {collapsed ? (
              <ChevronsRight size={18} />
            ) : (
              <ChevronsLeft size={18} />
            )}
          </button>

        </div>

      </aside>


      {/* MAIN */}
      <main className="main-content">


        {/* TOP BAR */}
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
          }}
        >

          {/* SEARCH */}
          <button
            type="button"
            onClick={() =>
              setPaletteOpen(true)
            }
            aria-label="Search Campora"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform:
                'translate(-50%, -50%)',

              width: '590px',
              height: '54px',

              display: 'flex',
              alignItems: 'center',
              gap: '13px',

              padding: '0 12px 0 10px',

              boxSizing: 'border-box',

              border:
                '1px solid rgba(36, 59, 107, 0.16)',

              borderRadius: '17px',

              background:
                'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',

              color: '#687184',

              cursor: 'pointer',

              boxShadow:
                '0 8px 24px rgba(36, 59, 107, 0.08), 0 2px 5px rgba(25, 40, 70, 0.04)',

              transition:
                'all 0.2s ease',

              zIndex: 5,
            }}
          >

            <span
              style={{
                width: '38px',
                height: '38px',
                minWidth: '38px',

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                borderRadius: '12px',

                background:
                  'linear-gradient(135deg, #eef3fb 0%, #e4ebf7 100%)',

                border:
                  '1px solid rgba(36, 59, 107, 0.08)',

                color:
                  '#243b6b',

                boxShadow:
                  'inset 0 1px 2px rgba(255,255,255,0.8)',
              }}
            >
              <Search size={19} strokeWidth={2.2} />
            </span>


            <span
              style={{
                flex: 1,

                textAlign: 'left',

                fontSize: '15px',

                fontWeight: 650,

                letterSpacing: '0.01em',

                color: '#687286',

                whiteSpace: 'nowrap',
              }}
            >
              Search Campora…
            </span>


            <kbd
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',

                height: '30px',
                minWidth: '45px',

                padding: '0 9px',

                boxSizing: 'border-box',

                border:
                  '1px solid #dce2ec',

                borderRadius: '9px',

                background:
                  '#f9fafc',

                color: '#69758a',

                fontSize: '11px',

                fontWeight: 750,

                boxShadow:
                  '0 1px 2px rgba(36, 59, 107, 0.05)',
              }}
            >
              <Command size={12} strokeWidth={2.2} />
              K
            </kbd>

          </button>


          {/* RIGHT CONTROLS */}
          <div
            style={{
              position: 'absolute',
              right: '28px',
              top: '50%',
              transform:
                'translateY(-50%)',

              display: 'flex',
              alignItems: 'center',
              gap: '10px',

              zIndex: 10,
            }}
          >

            {/* NOTIFICATIONS */}
            <button
              type="button"
              className="topbar-icon-btn"
              title="Notifications"
              aria-label="Notifications"
              onClick={() =>
                navigate('/notifications')
              }
              style={{
                position: 'relative',

                width: '44px',
                height: '44px',

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                border:
                  '1px solid #e0e4eb',

                borderRadius: '13px',

                background:
                  '#ffffff',

                color: '#243b6b',

                cursor: 'pointer',

                transition:
                  'all 0.2s ease',

                boxShadow:
                  '0 3px 10px rgba(36, 59, 107, 0.04)',
              }}
            >
              <Bell size={20} />

              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',

                    top: '6px',
                    right: '6px',

                    width: '8px',
                    height: '8px',

                    borderRadius: '50%',

                    background:
                      '#243b6b',

                    border:
                      '2px solid #ffffff',

                    boxShadow:
                      '0 0 0 2px rgba(36, 59, 107, 0.08)',
                  }}
                />
              )}
            </button>


            {/* DARK MODE */}
            <button
              type="button"
              className="topbar-icon-btn"
              title={
                theme === 'dark'
                  ? 'Light mode'
                  : 'Dark mode'
              }
              aria-label={
                theme === 'dark'
                  ? 'Switch to light mode'
                  : 'Switch to dark mode'
              }
              onClick={() =>
                setTheme(
                  (current) =>
                    current === 'dark'
                      ? 'light'
                      : 'dark'
                )
              }
              style={{
                width: '44px',
                height: '44px',

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                border:
                  '1px solid #e0e4eb',

                borderRadius: '13px',

                background:
                  '#ffffff',

                color: '#243b6b',

                cursor: 'pointer',

                transition:
                  'all 0.2s ease',

                boxShadow:
                  '0 3px 10px rgba(36, 59, 107, 0.04)',
              }}
            >
              {theme === 'dark' ? (
                <Sun size={20} />
              ) : (
                <Moon size={20} />
              )}
            </button>


            {/* PROFILE */}
            <div
              className="topbar-avatar-wrap"
              style={{
                position: 'relative',
              }}
            >

              <button
                type="button"
                className="topbar-avatar"
                title="Account menu"
                aria-expanded={
                  accountOpen
                }
                aria-label="Account menu"
                onClick={() =>
                  setAccountOpen(
                    (current) =>
                      !current
                  )
                }
                style={{
                  width: '44px',
                  height: '44px',

                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',

                  border:
                    '2px solid #ffffff',

                  borderRadius: '13px',

                  background:
                    'linear-gradient(145deg, #304d83 0%, #243b6b 52%, #1d315b 100%)',

                  color: '#ffffff',

                  fontSize: '15px',

                  fontWeight: 800,

                  letterSpacing: '0.02em',

                  cursor: 'pointer',

                  boxShadow:
                    '0 4px 12px rgba(36, 59, 107, 0.22), 0 0 0 1px rgba(36, 59, 107, 0.12)',

                  transition:
                    'all 0.2s ease',
                }}
              >
                {userName
                  .charAt(0)
                  .toUpperCase() || 'U'}
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
          onClose={() =>
            setPaletteOpen(false)
          }
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

        <Route
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/features"
          element={<Features />}
        />

        <Route
          path="/dev-planner"
          element={<DevPlannerHarness />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<SignUp />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/verified"
          element={<EmailVerified />}
        />

        <Route
          path="/onboarding"
          element={<Onboarding />}
        />


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
            path="/messages"
            element={<Messages />}
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