import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Bell, GraduationCap, Calendar, Search, User, Users, ChevronsLeft, ChevronsRight } from 'lucide-react';
import './App.css';

import Dashboard from './pages/Dashboard';
import Announcements from './pages/Announcements';
import Notifications from './pages/Notifications'; // Restored friend's import
import CourseManagement from './pages/CourseManagement';
import Planner from './pages/Planner';
import StudyGroups from './pages/StudyGroups';
import Onboarding from './pages/Onboarding';
import Login from './Login';
import SignUp from './pages/SignUp';
import Profile from './Profile';
import ForgotPassword from './ForgotPassword';
import { supabase } from './lib/supabase';

function EmailVerified() {
  const navigate = useNavigate();
  useEffect(() => {
    const timer = setTimeout(() => navigate('/login'), 4000);
    return () => clearTimeout(timer);
  }, [navigate]);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F7FE' }}>
      <div className="card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0B1A3F' }}>✅ Email Verified!</h1>
        <p style={{ color: '#64748B', margin: '20px 0', fontWeight: '700' }}>Redirecting you to login…</p>
      </div>
    </div>
  );
}

function DashboardLayout() {
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('Student');
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login', { replace: true }); return; }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (!profile || profile.onboarding_completed !== true) { navigate('/onboarding', { replace: true }); return; }
      setUserName(profile.name || user.email.split('@')[0]);
      setUserRole(profile.role || 'Student');
    }
    init();
  }, [navigate]);

  return (
      <div className="layout">
        <aside className={collapsed ? "sidebar collapsed" : "sidebar"}>
          {/* Collapse / Expand Toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              position: 'absolute',
              top: '22px',
              right: '-14px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#0B1A3F',
              color: '#fff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(11, 26, 63, 0.3)',
              zIndex: 10,
            }}
          >
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>

          {/* Logo Section */}
          <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : '12px', justifyContent: collapsed ? 'center' : 'flex-start', background: 'white', padding: '12px', margin: collapsed ? '0 8px 40px 8px' : '0 20px 40px 20px', borderRadius: '16px', border: '1px solid rgba(224, 229, 242, 0.8)', boxShadow: '0 10px 25px -5px rgba(11, 26, 63, 0.12)', transition: 'all 0.3s ease' }}>
            <div style={{ display: 'flex', height: '48px', width: '56px', flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: '12px', background: '#F4F7FE', padding: '4px', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)' }}>
              <svg viewBox="0 0 240 160" style={{ width: '100%', height: '100%' }} fill="none">
                <path d="M120 4 L123 18 L137 21 L123 24 L120 38 L117 24 L103 21 L117 18 Z" fill="#0B1A3F"/><path d="M62 34 L102 18" stroke="#0B1A3F" strokeWidth="3.5" strokeLinecap="round"/><path d="M138 18 L178 34 L178 55" stroke="#0B1A3F" strokeWidth="3.5" strokeLinecap="round"/><path d="M62 34 L62 55" stroke="#0B1A3F" strokeWidth="3.5" strokeLinecap="round"/><path d="M69 38 L104 23" stroke="#0B1A3F" strokeWidth="1.8" strokeLinecap="round"/><path d="M136 23 L171 38 L171 55" stroke="#0B1A3F" strokeWidth="1.8" strokeLinecap="round"/><path d="M69 38 L69 55" stroke="#0B1A3F" strokeWidth="1.8" strokeLinecap="round"/><text x="120" y="82" fontFamily="'Times New Roman', serif" fontWeight="bold" fontSize="29" fill="#0B1A3F" textAnchor="middle" letterSpacing="2">CAMPORA</text><path d="M62 95 L62 108 C62 135 120 152 120 152 C120 152 178 135 178 108 L178 95" stroke="#0B1A3F" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M120 126 C92 121 58 104 44 88" stroke="#0B1A3F" strokeWidth="2.5" strokeLinecap="round"/><circle cx="120" cy="131" r="2.5" fill="#0B1A3F"/>
              </svg>
            </div>
            <div className="logo-caption">
              <h1 style={{ fontSize: '18px', fontWeight: '900', color: '#0B1A3F', margin: 0 }}>Campora</h1>
              <p style={{ fontSize: '8px', fontWeight: '900', color: '#0B1A3F', margin: 0, opacity: 0.6 }}>ACADEMIC PORTAL</p>
            </div>
          </div>

          <nav style={{ flex: 1 }}>
            <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}><LayoutDashboard size={20}/> <span>Dashboard</span></NavLink>
            <NavLink to="/announcements" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}><Bell size={20}/> <span>Announcements</span></NavLink>
            <NavLink to="/notifications" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}><Bell size={20}/> <span>Notifications</span></NavLink>
            <NavLink to="/courses" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}><GraduationCap size={20}/> <span>Courses</span></NavLink>
            <NavLink to="/planner" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}><Calendar size={20}/> <span>Planner</span></NavLink>
            <NavLink to="/study-groups" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}><Users size={20}/> <span>Study Groups</span></NavLink>
          </nav>

          <Link to="/profile" className="sidebar-profile" style={{ padding: '25px', borderTop: '1px solid #eee', textDecoration: 'none', display: 'block' }}>
            <div className="profile-inner" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#F4F7FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B1A3F', border: '1px solid #E9EDF7', flexShrink: 0 }}><User size={22} /></div>
              <div className="profile-text">
                <p style={{ fontWeight: '900', fontSize: '14px', color: '#0B1A3F', margin: 0 }}>{userName || 'Student'}</p>
                <p style={{ fontWeight: '900', fontSize: '11px', color: '#0B1A3F', margin: 0, opacity: 0.7 }}>{userRole}</p>
              </div>
            </div>
          </Link>
        </aside>

        <main className="main-content">
          <header style={{ marginBottom: '40px', width: '100%' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
              <Search style={{ position: 'absolute', left: '20px', top: '15px', color: '#A3AED0' }} size={20} />
              <input type="text" placeholder="Search..." style={{ width: '100%', padding: '15px 15px 15px 55px', borderRadius: '50px', border: 'none', background: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', fontWeight: '700' }} />
            </div>
          </header>
          <Outlet />
        </main>
      </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/signup" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verified" element={<EmailVerified />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/announcements" element={<Announcements />} />
          
          {/* RESTORED NOTIFICATIONS ROUTE */}
          <Route path="/notifications" element={<Notifications />} />
          
          <Route path="/courses" element={<CourseManagement />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/study-groups" element={<StudyGroups />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}