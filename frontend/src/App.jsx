import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Bell, GraduationCap, Calendar, Search, User } from 'lucide-react';
import './App.css';

import Dashboard from './pages/Dashboard';
import Announcements from './pages/Announcements';
import CourseManagement from './pages/CourseManagement';
import Planner from './pages/Planner';

export default function App() {
  return (
    <Router>
      <div className="layout">
        <aside className="sidebar">
          
          {/* --- LOGO SECTION --- */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'white',
            padding: '12px',
            margin: '0 20px 40px 20px',
            borderRadius: '16px',
            border: '1px solid rgba(224, 229, 242, 0.8)',
            boxShadow: '0 10px 25px -5px rgba(11, 26, 63, 0.12), 0 4px 6px -2px rgba(11, 26, 63, 0.05)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}>
            <div style={{
              display: 'flex',
              height: '48px',
              width: '56px',
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              background: '#F4F7FE',
              padding: '4px',
              boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
            }}>
              <svg viewBox="0 0 240 160" style={{ width: '100%', height: '100%' }} fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M120 4 L123 18 L137 21 L123 24 L120 38 L117 24 L103 21 L117 18 Z" fill="#0B1A3F"/>
                <path d="M62 34 L102 18" stroke="#0B1A3F" strokeWidth="3.5" strokeLinecap="round"/>
                <path d="M138 18 L178 34 L178 55" stroke="#0B1A3F" strokeWidth="3.5" strokeLinecap="round"/>
                <path d="M62 34 L62 55" stroke="#0B1A3F" strokeWidth="3.5" strokeLinecap="round"/>
                <path d="M69 38 L104 23" stroke="#0B1A3F" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M136 23 L171 38 L171 55" stroke="#0B1A3F" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M69 38 L69 55" stroke="#0B1A3F" strokeWidth="1.8" strokeLinecap="round"/>
                <text x="120" y="82" fontFamily="'Times New Roman', serif" fontWeight="bold" fontSize="29" fill="#0B1A3F" textAnchor="middle" letterSpacing="2">CAMPORA</text>
                <path d="M62 95 L62 108 C62 135 120 152 120 152 C120 152 178 135 178 108 L178 95" stroke="#0B1A3F" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M69 95 L69 106 C69 128 120 143 120 143 C120 143 171 128 171 106 L171 95" stroke="#0B1A3F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="85" y1="96" x2="155" y2="96" stroke="#0B1A3F" strokeWidth="1"/>
                <polygon points="120,93 124,96 120,99 116,96" fill="#0B1A3F"/>
                <circle cx="112" cy="96" r="1.5" fill="#0B1A3F"/>
                <circle cx="128" cy="96" r="1.5" fill="#0B1A3F"/>
                <path d="M120 126 C92 121 58 104 44 88" stroke="#0B1A3F" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M44 88 C38 80 46 76 52 82 C54 88 48 91 44 88 Z" fill="#0B1A3F"/>
                <path d="M52 86 C48 94 56 97 60 90 C62 84 54 82 52 86 Z" fill="#0B1A3F"/>
                <path d="M55 96 C47 91 53 102 61 99 C64 94 59 90 55 96 Z" fill="#0B1A3F"/>
                <path d="M63 98 C60 106 69 108 72 101 C73 95 65 93 63 98 Z" fill="#0B1A3F"/>
                <path d="M120 126 C148 121 182 104 196 88" stroke="#0B1A3F" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M196 88 C202 80 194 76 188 82 C186 88 192 91 196 88 Z" fill="#0B1A3F"/>
                <path d="M188 86 C192 94 184 97 180 90 C178 84 186 82 188 86 Z" fill="#0B1A3F"/>
                <path d="M185 96 C193 91 187 102 179 99 C176 94 181 90 185 96 Z" fill="#0B1A3F"/>
                <path d="M177 98 C180 106 171 108 168 101 C167 95 175 93 177 98 Z" fill="#0B1A3F"/>
                <circle cx="120" cy="131" r="2.5" fill="#0B1A3F"/>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h1 style={{ fontSize: '18px', fontWeight: '900', color: '#0B1A3F', margin: 0, letterSpacing: '-0.5px' }}>Campora</h1>
              <p style={{ fontSize: '8px', fontWeight: '900', color: '#0B1A3F', textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0, opacity: 0.8 }}>Academic Portal</p>
            </div>
          </div>

          {/* --- NAVIGATION --- */}
          <nav style={{ flex: 1 }}>
            <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <LayoutDashboard size={20}/> Dashboard
            </NavLink>
            <NavLink to="/announcements" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Bell size={20}/> Announcements
            </NavLink>
            <NavLink to="/courses" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <GraduationCap size={20}/> Courses
            </NavLink>
            <NavLink to="/planner" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Calendar size={20}/> Planner
            </NavLink>
          </nav>

          {/* --- FIXED PROFILE SECTION --- */}
          <div style={{ padding: '25px', borderTop: '1px solid #eee' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '50%', 
                backgroundColor: '#F4F7FE', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#0B1A3F',
                border: '1px solid #E9EDF7'
              }}>
                <User size={22} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* FORCED BOLD NAME: Using weight 900 and explicitly setting font family */}
                <p style={{ 
                  fontWeight: '900', 
                  fontSize: '15px', 
                  color: '#0B1A3F', 
                  margin: 0, 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  lineHeight: '1.2'
                }}>
                  Lara
                </p>
                {/* FORCED BOLD YEAR: Using weight 800 and explicitly setting font family */}
                <p style={{ 
                  fontWeight: '800', 
                  fontSize: '11px', 
                  color: '#0B1A3F', 
                  margin: 0, 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  opacity: 0.9 
                }}>
                  Senior Year
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main className="main-content">
          <header style={{ marginBottom: '40px', width: '100%' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
              <Search style={{ position: 'absolute', left: '20px', top: '15px', color: '#A3AED0' }} size={20} />
              <input type="text" placeholder="Search..." style={{ width: '100%', padding: '15px 15px 15px 55px', borderRadius: '50px', border: 'none', background: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }} />
            </div>
          </header>
          
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/courses" element={<CourseManagement />} />
            <Route path="/planner" element={<Planner />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}