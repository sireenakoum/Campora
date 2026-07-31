import React from 'react';

export default function Planner() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dates = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div style={{ width: '100%' }}>
      <h1 style={{ fontSize: '42px', fontWeight: '900', marginBottom: '30px', color: '#0B1A3F' }}>October 2024</h1>
      <div className="card" style={{ padding: '30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '15px' }}>
          {days.map(day => (
            <div key={day} style={{ fontWeight: '900', color: '#0B1A3F', fontSize: '12px', paddingBottom: '15px', textAlign: 'center' }}>
              {day.toUpperCase()}
            </div>
          ))}
          <div /><div />
          {dates.map(date => (
            <div key={date} style={{ 
              height: '110px', border: '1px solid #f0f3f9', borderRadius: '15px', padding: '12px', textAlign: 'right', fontWeight: '900', color: '#0B1A3F'
            }}>
              {date}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}