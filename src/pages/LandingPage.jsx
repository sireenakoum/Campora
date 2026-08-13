import React from 'react';
import { Link } from 'react-router-dom';
import camporaLogo from '../assets/camporanavylogo.png';
import {
  GraduationCap,
  CalendarDays,
  Bell,
  Users,
  CheckSquare,
  ArrowRight,
  
  Sparkles,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div
  style={{
    minHeight: '100vh',
    height: '100vh',
    background:
      'linear-gradient(135deg, #ffffff 0%, #f7faff 45%, #edf4fb 100%)',
    color: '#0B1A3F',
    overflow: 'hidden',
    position: 'relative',
  }}
     >
      {/* Top Navigation */}
      <nav
        style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '16px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 5,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontWeight: '900',
            fontSize: '28px',
          }}
        >
          <img
  src={camporaLogo}
  alt="Campora logo"
  style={{
    width: '48px',
    height: '48px',
    objectFit: 'contain',
  }}
/>
          Campora
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '34px',
            fontWeight: '700',
            fontSize: '15px',
          }}
        >
          <Link to="/about" style={{ color: '#0B1A3F', textDecoration: 'none' }}>
  About
</Link>

          
         <Link to="/features" style={{ color: '#0B1A3F', textDecoration: 'none' }}>
  Features
</Link>

          <Link
            to="/login"
            style={{
              color: '#0B1A3F',
              textDecoration: 'none',
              marginLeft: '20px',
            }}
          >
            Log in
          </Link>

          <Link
            to="/signup"
            style={{
              background: '#0B1A3F',
              color: '#fff',
              padding: '14px 24px',
              borderRadius: '14px',
              textDecoration: 'none',
              boxShadow: '0 10px 24px rgba(11, 26, 63, 0.15)',
            }}
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main
        style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '35px 48px 20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          alignItems: 'center',
          gap: '40px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Left */}
        <section>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '999px',
              background: '#EEF3FB',
              color: '#648CCB',
              fontWeight: '800',
              fontSize: '14px',
              marginBottom: '28px',
            }}
          >
            <Sparkles size={16} />
          University, all together
          </div>

          <h1
            style={{
              fontSize: '62px',
              lineHeight: '0.98',
              fontWeight: '950',
              letterSpacing: '-4px',
              margin: '0 0 20px',
              maxWidth: '680px',
            }}
          >
            Campus life,
            <br />
            made for{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, #648CCB, #0B1A3F)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              you.
            </span>
          </h1>

          <p
            id="about"
            style={{
              maxWidth: '620px',
              fontSize: '17px',
              lineHeight: '1.55',
              color: '#56627A',
              fontWeight: '600',
              marginBottom: '24px',
            }}
          >
Created by Engineering and Computer Science students, Campora is designed to make university life simpler. From classes and deadlines to campus updates and student connections, everything lives in one place.
</p>
          <div style={{ display: 'flex', marginBottom: '24px' }}>
            <Link
              to="/signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 26px',
                background: '#0B1A3F',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '14px',
                fontWeight: '900',
                fontSize: '16px',
              }}
            >
              Get Started
              <ArrowRight size={19} />
            </Link>

          
          </div>

        </section>

        {/* Right */}
        <section
          id="features"
          style={{
            position: 'relative',
            minHeight: '500px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '520px',
              height: '520px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle at center, rgba(100, 140, 203, 0.20), rgba(207, 222, 242, 0.10) 65%, transparent 70%)',
              filter: 'blur(2px)',
            }}
          />

          <div
            style={{
              width: '220px',
              height: '220px',
              borderRadius: '42px',
              background: 'rgba(255,255,255,0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 24px 55px rgba(11, 26, 63, 0.13)',
              transform: 'rotate(0deg)',
              position: 'relative',
              zIndex: 3,
            }}
          >
            <img
          src={camporaLogo}
          alt="Campora logo"
          style={{
             width: '150px',
             height: '150px',
             objectFit: 'contain',
            }}
         />
     </div>

          <FeatureCard
            icon={<CalendarDays size={28} />}
            title="Plan your day"
            text="Organize classes, deadlines, and tasks effortlessly."
            style={{ top: '40px', left: '15px', transform: 'rotate(-4deg)' }}
          />

          <FeatureCard
            icon={<Bell size={28} />}
            title="Stay updated"
            text="Never miss what matters."
            style={{ top: '55px', right: '0px', transform: 'rotate(5deg)' }}
          />

          <FeatureCard
            icon={<Users size={28} />}
            title="Connect & collaborate"
            text="Join study groups and work together."
            style={{ bottom: '35px', left: '-10px', transform: 'rotate(3deg)' }}
          />

          <FeatureCard
            icon={<CheckSquare size={28} />}
            title="Get things done"
            text="Stay on top of tasks and goals."
            style={{ bottom: '25px', right: '-15px', transform: 'rotate(5deg)' }}
          />
        </section>
      </main>

      {/* Decorative shapes */}
      <div
        style={{
          position: 'absolute',
          width: '420px',
          height: '220px',
          borderRadius: '50%',
          background: 'rgba(100, 140, 203, 0.13)',
          right: '-140px',
          bottom: '-80px',
          transform: 'rotate(-18deg)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          width: '360px',
          height: '160px',
          borderRadius: '50%',
          background: 'rgba(208, 222, 241, 0.32)',
          left: '-140px',
          bottom: '-90px',
          transform: 'rotate(12deg)',
        }}
      />
    </div>
  );
}

function FeatureCard({ icon, title, text, style }) {
  return (
    <div
      style={{
        position: 'absolute',
        width: '230px',
        padding: '22px',
        borderRadius: '24px',
        background: 'rgba(255,255,255,0.96)',
        boxShadow: '0 14px 32px rgba(11, 26, 63, 0.09)',
        border: '1px solid rgba(221, 231, 245, 0.95)',
        zIndex: 4,
        ...style,
      }}
    >
      <div
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#EEF3FB',
          color: '#648CCB',
          marginBottom: '14px',
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          margin: '0 0 8px',
          fontSize: '16px',
          fontWeight: '900',
          color: '#0B1A3F',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: 0,
          fontSize: '13px',
          lineHeight: '1.5',
          color: '#667085',
          fontWeight: '600',
        }}
      >
        {text}
      </p>
    </div>
  );
}