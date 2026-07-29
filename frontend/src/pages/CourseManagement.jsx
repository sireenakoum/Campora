import React from 'react';
import { BookOpen } from 'lucide-react';

export default function CourseManagement() {
  return (
    <div style={{ width: '100%' }}>
      <div className="grid">
        <div className="card" style={{gridColumn: 'span 8', display: 'flex', justifyContent: 'space-between'}}>
          <div>
            <p style={{color: 'var(--campora-blue)', fontWeight: '900', fontSize: '11px'}}>ACADEMIC STANDING</p>
            <h1 style={{fontSize: '48px', margin: '15px 0', fontWeight: '900', color: '#0B1A3F'}}>Dean's List Status</h1>
            <div style={{display: 'flex', gap: '50px', marginTop: '30px'}}>
              <div><h2 style={{fontSize: '36px', margin: 0, color: '#0B1A3F'}}>3.92</h2><small style={{fontWeight: '800'}}>GPA</small></div>
              <div><h2 style={{fontSize: '36px', margin: 0, color: '#0B1A3F'}}>22</h2><small style={{fontWeight: '800'}}>CREDITS</small></div>
            </div>
          </div>
          <div style={{width: '120px', height: '120px', borderRadius: '50%', border: '12px solid var(--campora-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '24px', color: '#0B1A3F'}}>85%</div>
        </div>
        <div className="card hero-card" style={{gridColumn: 'span 4', display: 'flex', flexDirection: 'column', background: 'var(--campora-navy)'}}>
          <BookOpen size={30} style={{marginBottom: '20px', color: 'white'}}/>
          <p style={{fontSize: '10px', opacity: 0.6, color: 'white', fontWeight: '800'}}>NEXT CLASS</p>
          <h2 style={{color: 'white', fontSize: '24px', fontWeight: '800'}}>Advanced Algorithms</h2>
          <button style={{marginTop: 'auto', background: 'white', color: '#0B1A3F', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '900'}}>Join Lobby</button>
        </div>
      </div>
    </div>
  );
}