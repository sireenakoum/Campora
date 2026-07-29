import React from 'react';
import { Bell, ChevronRight } from 'lucide-react';

export default function Announcements() {
  return (
    <div style={{ width: '100%' }}>
      <h1 style={{ marginBottom: '30px', fontSize: '42px', fontWeight: '900', color: '#0B1A3F' }}>Campora</h1>
      <div className="grid">
        <div className="card" style={{ gridColumn: 'span 8', padding: '0', overflow: 'hidden' }}>
          <div style={{ height: '240px', background: '#222' }}>
            <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="event" />
          </div>
          <div style={{ padding: '30px' }}>
            <h3 style={{fontWeight: '800', color: '#0B1A3F'}}>Annual Robotics & AI Innovation Summit 2024</h3>
            <button style={{ color: 'var(--campora-blue)', background: 'none', border: 'none', fontWeight: 'bold', marginTop: '15px', cursor: 'pointer' }}>Read More <ChevronRight size={16} style={{ verticalAlign: 'middle' }}/></button>
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 4', backgroundColor: '#FEE2E2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--campora-urgent)', marginBottom: '15px' }}>
            <Bell size={20} /> <span style={{ fontSize: '10px', fontWeight: '900' }}>URGENT NOTICE</span>
          </div>
          <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#0B1A3F' }}>Course Registration Deadline</h3>
          <p style={{ color: '#991B1B', opacity: 0.8, fontWeight: '700' }}>System closes tonight at 11:59 PM.</p>
        </div>
      </div>
    </div>
  );
}