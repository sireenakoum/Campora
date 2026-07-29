import React from 'react';

export default function Dashboard() {
  return (
    <div style={{ width: '100%', textAlign: 'left' }}>
      <p style={{ color: 'var(--campora-muted)', fontWeight: '800', letterSpacing: '2px', fontSize: '12px', marginBottom: '10px' }}>MONDAY, OCTOBER 24</p>
      <h1 style={{ fontSize: '42px', fontWeight: '900', marginBottom: '40px', color: '#0B1A3F' }}>Good Morning, Lara</h1>
      
      <div className="grid">
        <div className="card" style={{ gridColumn: 'span 8', background: 'var(--campora-navy)', color: 'white' }}>
          <h2 style={{ color: 'white', fontSize: '32px', marginBottom: '20px', fontWeight: '800' }}>Your day is looking highly productive.</h2>
          <p style={{ opacity: 0.8, fontSize: '18px' }}>You have 4 emails from Prof. Aris regarding your thesis structure.</p>
          <button style={{ marginTop: '40px', padding: '14px 28px', borderRadius: '15px', border: 'none', fontWeight: 'bold', cursor: 'pointer', background: 'white', color: 'var(--campora-navy)' }}>Ask Assistant</button>
        </div>

        <div className="card" style={{ gridColumn: 'span 4' }}>
          <p style={{ fontSize: '12px', fontWeight: '900', color: '#0B1A3F', marginBottom: '40px' }}>SEMESTER PROGRESS</p>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
             <div style={{ textAlign: 'center' }}><h3 style={{ fontSize: '36px', color: '#0B1A3F' }}>75%</h3><small style={{fontWeight: '800'}}>CREDITS</small></div>
             <div style={{ textAlign: 'center' }}><h3 style={{ fontSize: '36px', color: '#0B1A3F' }}>92%</h3><small style={{fontWeight: '800'}}>ATTENDANCE</small></div>
          </div>
        </div>
      </div>
    </div>
  );
}