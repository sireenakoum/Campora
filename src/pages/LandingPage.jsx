import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  MessageSquare,
  Bell,
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Users,
  Activity,
  Search,
  UserCheck,
  Network,
  ShieldCheck,
  Moon,
  Clock3,
} from 'lucide-react';

import camporaLogo from '../assets/camporanavylogo.png';

const NAVY = '#0B1A3F';
const BLUE = '#648CCB';
const TEXT = '#172033';
const MUTED = '#6F7B90';
const BORDER = '#E5EAF2';

export default function LandingPage() {
  return (
    <div className="public-page">
      <style>{`
        .public-page {
          min-height: 100vh;
          background: #FBFCFE;
          color: ${TEXT};
          font-family: inherit;
        }

        .public-nav {
          width: min(1280px, calc(100% - 56px));
          margin: 0 auto;
          height: 82px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .public-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: ${NAVY};
          font-size: 22px;
          font-weight: 950;
          text-decoration: none;
          letter-spacing: -.02em;
        }

        .public-brand img {
          width: 46px;
          height: 46px;
          object-fit: contain;
        }

        .public-nav-links {
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .public-nav-link {
          color: #4D596C;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
        }

        .public-nav-link:hover {
          color: ${NAVY};
        }

        .public-login {
          margin-left: 6px;
        }

        .public-signup {
          min-height: 40px;
          padding: 0 16px;
          border-radius: 11px;
          background: ${NAVY};
          color: #FFFFFF;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 900;
          box-shadow: 0 8px 18px rgba(11,26,63,.10);
        }

        .public-hero {
          width: min(1280px, calc(100% - 56px));
          margin: 0 auto;
          min-height: calc(100vh - 82px);
          display: grid;
          grid-template-columns: minmax(0, .98fr) minmax(440px, .92fr);
          align-items: center;
          gap: 72px;
          padding: 54px 0 82px;
          box-sizing: border-box;
        }

        .public-eyebrow {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          padding: 0 11px;
          border-radius: 999px;
          background: #EEF3FA;
          color: ${BLUE};
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .06em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .public-hero h1 {
          margin: 0;
          max-width: 680px;
          color: ${NAVY};
          font-size: clamp(48px, 6vw, 76px);
          line-height: .98;
          letter-spacing: -.055em;
          font-weight: 950;
        }

        .public-hero h1 span {
          color: ${BLUE};
        }

        .public-hero-copy {
          max-width: 610px;
          margin: 24px 0 0;
          color: ${MUTED};
          font-size: 17px;
          line-height: 1.68;
          font-weight: 600;
        }

        .public-hero-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 30px;
        }

        .public-primary {
          min-height: 48px;
          padding: 0 19px;
          border-radius: 12px;
          background: ${NAVY};
          color: #FFFFFF;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-size: 13px;
          font-weight: 900;
          box-shadow: 0 10px 22px rgba(11,26,63,.12);
        }

        .public-secondary {
          min-height: 48px;
          padding: 0 18px;
          border-radius: 12px;
          border: 1px solid ${BORDER};
          background: #FFFFFF;
          color: ${NAVY};
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          font-size: 13px;
          font-weight: 900;
        }

        .public-product {
          position: relative;
          min-height: 560px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .public-product-glow {
          position: absolute;
          width: 470px;
          height: 470px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(100,140,203,.15),
            rgba(100,140,203,.025) 62%,
            transparent 74%
          );
        }

        .public-window {
          width: 100%;
          max-width: 680px;
          height: 470px;
          border: 1px solid #E5EAF2;
          border-radius: 24px;
          background: #FFFFFF;
          box-shadow: 0 28px 70px rgba(11,26,63,.10);
          overflow: hidden;
          position: relative;
          z-index: 2;
        }

        .preview-app {
          display: grid;
          grid-template-columns: 142px minmax(0,1fr);
          height: 100%;
          background: #FCFDFE;
          filter: blur(.55px);
          transform: scale(1.002);
        }

        .preview-sidebar {
          height: 100%;
          background: #F8FAFD;
          border-right: 1px solid #EDF1F5;
          padding: 10px 8px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        .preview-brand-card {
          min-height: 43px;
          border-radius: 12px;
          background: #FFFFFF;
          border: 1px solid #E8ECF2;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 0 8px;
          box-shadow: 0 4px 12px rgba(11,26,63,.04);
          margin-bottom: 12px;
        }

        .preview-brand-card img {
          width: 23px;
          height: 23px;
          object-fit: contain;
        }

        .preview-brand-lines {
          display: grid;
          gap: 3px;
        }

        .preview-brand-title {
          width: 48px;
          height: 6px;
          border-radius: 999px;
          background: #0B1A3F;
          filter: blur(1.6px);
        }

        .preview-brand-sub {
          width: 38px;
          height: 3px;
          border-radius: 999px;
          background: #B9C3D2;
          filter: blur(1.5px);
        }

        .preview-nav-item {
          height: 29px;
          border-radius: 8px;
          margin-bottom: 3px;
          padding: 0 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #0B1A3F;
        }

        .preview-nav-item.active {
          background: #0B1A3F;
          color: #FFFFFF;
          box-shadow: 0 5px 12px rgba(11,26,63,.10);
        }

        .preview-nav-line {
          width: 54px;
          height: 5px;
          border-radius: 999px;
          background: #C8D0DB;
          filter: blur(1.8px);
        }

        .preview-nav-item.active .preview-nav-line {
          background: rgba(255,255,255,.88);
        }

        .preview-tools-label {
          width: 26px;
          height: 4px;
          border-radius: 999px;
          background: #C7CFDB;
          filter: blur(1.6px);
          margin: 8px 8px 6px;
        }

        .preview-sidebar-bottom {
          margin-top: auto;
          height: 28px;
          border-radius: 8px;
          background: #FFFFFF;
          border: 1px solid #E7EBF1;
        }

        .preview-right {
          min-width: 0;
          display: flex;
          flex-direction: column;
          background: #FCFDFE;
        }

        .preview-topbar {
          height: 56px;
          flex-shrink: 0;
          background: #FFFFFF;
          border-bottom: none;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-search {
          width: 58%;
          max-width: 310px;
          height: 34px;
          border-radius: 999px;
          border: 1px solid #E1E6EE;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          box-sizing: border-box;
          color: #7F8A9C;
        }

        .preview-search-line {
          width: 105px;
          height: 5px;
          border-radius: 999px;
          background: #CDD5E0;
          filter: blur(1.8px);
        }

        .preview-top-actions {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          gap: 10px;
          color: #0B1A3F;
        }

        .preview-avatar {
          width: 23px;
          height: 23px;
          border-radius: 50%;
          background: #0B1A3F;
          border: 2px solid #FFFFFF;
          box-shadow: 0 2px 8px rgba(11,26,63,.12);
        }

        .preview-main {
          flex: 1;
          min-height: 0;
          overflow: hidden;
          padding: 14px;
          box-sizing: border-box;
        }

        .preview-hero-card {
          height: 87px;
          border-radius: 15px;
          background: linear-gradient(135deg,#0B1A3F 0%,#17366A 100%);
          padding: 16px;
          box-sizing: border-box;
          color: #FFFFFF;
          box-shadow: 0 8px 20px rgba(11,26,63,.10);
          margin-bottom: 10px;
        }

        .preview-hero-date {
          width: 80px;
          height: 5px;
          border-radius: 999px;
          background: rgba(255,255,255,.70);
          filter: blur(1.7px);
        }

        .preview-hero-title {
          width: 215px;
          height: 12px;
          border-radius: 999px;
          background: rgba(255,255,255,.95);
          filter: blur(1.7px);
          margin-top: 10px;
        }

        .preview-hero-subtitle {
          width: 110px;
          height: 5px;
          border-radius: 999px;
          background: rgba(255,255,255,.62);
          filter: blur(1.6px);
          margin-top: 8px;
        }

        .preview-section-heading {
          width: 74px;
          height: 7px;
          border-radius: 999px;
          background: #0B1A3F;
          filter: blur(1.5px);
        }

        .preview-section-sub {
          width: 88px;
          height: 4px;
          border-radius: 999px;
          background: #C9D2DE;
          filter: blur(1.6px);
          margin-top: 5px;
        }

        .preview-quick-grid {
          margin-top: 8px;
          display: grid;
          grid-template-columns: repeat(5, minmax(0,1fr));
          gap: 6px;
          margin-bottom: 10px;
        }

        .preview-quick-card {
          min-height: 42px;
          border-radius: 9px;
          border: 1px solid #E6EAF0;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px;
          box-sizing: border-box;
        }

        .preview-quick-icon {
          width: 22px;
          height: 22px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .preview-quick-icon.purple { background:#F5F2FB; color:#8B78B8; }
        .preview-quick-icon.pink { background:#FFF2F6; color:#C76E8A; }
        .preview-quick-icon.blue { background:#F2F6FC; color:#648CCB; }
        .preview-quick-icon.peach { background:#FFF4EE; color:#D9896A; }

        .preview-quick-line {
          width: 44px;
          height: 5px;
          border-radius: 999px;
          background: #C8D1DC;
          filter: blur(1.7px);
        }

        .preview-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 8px;
        }

        .preview-panel {
          min-height: 94px;
          border-radius: 12px;
          background: #FFFFFF;
          border: 1px solid #E7EBF1;
          overflow: hidden;
        }

        .preview-panel-head {
          min-height: 34px;
          border-bottom: 1px solid #EDF1F5;
          padding: 7px 9px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
        }

        .preview-panel-title-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .preview-panel-icon {
          width: 22px;
          height: 22px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-panel-title {
          width: 54px;
          height: 6px;
          border-radius: 999px;
          background: #0B1A3F;
          filter: blur(1.6px);
        }

        .preview-panel-sub {
          width: 66px;
          height: 4px;
          border-radius: 999px;
          background: #CDD5E0;
          filter: blur(1.6px);
          margin-top: 4px;
        }

        .preview-panel-btn {
          width: 34px;
          height: 16px;
          border-radius: 6px;
          border: 1px solid #E3E7ED;
          background: #FAFBFD;
        }

        .preview-empty-box {
          height: 46px;
          margin: 7px 9px;
          border: 1px dashed #DCE3EC;
          border-radius: 9px;
          background: #FBFCFE;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-empty-line {
          width: 76px;
          height: 4px;
          border-radius: 999px;
          background: #D0D8E2;
          filter: blur(1.6px);
        }

        .preview-snapshot {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 6px;
          padding: 8px 9px;
        }

        .preview-stat {
          min-height: 40px;
          border-radius: 8px;
          padding: 7px;
          box-sizing: border-box;
        }

        .preview-stat.one { background:#F4F1F8; }
        .preview-stat.two { background:#FBF6EC; }
        .preview-stat.three { background:#EFF4FB; }

        .preview-stat-num {
          width: 16px;
          height: 9px;
          border-radius: 999px;
          background: #0B1A3F;
          filter: blur(1.5px);
        }

        .preview-stat-label {
          width: 34px;
          height: 4px;
          margin-top: 8px;
          border-radius: 999px;
          background: #C1CBD8;
          filter: blur(1.6px);
        }

        .preview-progress {
          padding: 9px;
        }

        .preview-progress-number {
          width: 18px;
          height: 12px;
          border-radius: 999px;
          background: #0B1A3F;
          filter: blur(1.5px);
        }

        .preview-progress-line {
          width: 38px;
          height: 4px;
          border-radius: 999px;
          background: #CBD3DE;
          filter: blur(1.5px);
          margin-top: 6px;
        }

        .preview-progress-track {
          height: 5px;
          border-radius: 999px;
          background: #E8EDF3;
          margin-top: 12px;
        }

        .preview-frost {
          position: absolute;
          inset: 0;
          z-index: 4;
          pointer-events: none;
          backdrop-filter: blur(.7px);
          -webkit-backdrop-filter: blur(.7px);
          background: rgba(255,255,255,.025);
        }

        .preview-fade {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 72px;
          z-index: 5;
          pointer-events: none;
          background: linear-gradient(
            to bottom,
            rgba(255,255,255,0),
            rgba(255,255,255,.45) 55%,
            #FFFFFF 100%
          );
        }

        @media (max-width: 900px) {
          .public-nav,
          .public-hero {
            width: min(100% - 30px, 720px);
          }

          .public-nav-links a:not(.public-signup) {
            display: none;
          }

          .public-hero {
            grid-template-columns: 1fr;
            gap: 42px;
            padding-top: 42px;
          }

          .public-product {
            min-height: auto;
          }
        }

        @media (max-width: 560px) {
          .public-hero h1 {
            font-size: 48px;
          }

          .public-hero-actions {
            align-items: stretch;
            flex-direction: column;
          }

          .public-primary,
          .public-secondary {
            justify-content: center;
          }

          .public-window {
            height: 410px;
          }

          .preview-topbar {
            grid-template-columns: 105px minmax(0,1fr);
          }

          .preview-body {
            grid-template-columns: 105px minmax(0,1fr);
          }

          .preview-quick-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .preview-quick-card:nth-child(n+4) {
            display: none;
          }

          .preview-bottom-grid {
            display: none;
          }
        }
      `}</style>

      <nav className="public-nav">
        <Link to="/" className="public-brand">
          <img src={camporaLogo} alt="Campora logo" />
          Campora
        </Link>

        <div className="public-nav-links">
          <Link to="/about" className="public-nav-link">
            About
          </Link>

          <Link to="/features" className="public-nav-link">
            Features
          </Link>

          <Link to="/login" className="public-nav-link public-login">
            Log in
          </Link>

          <Link to="/signup" className="public-signup">
            Sign Up
          </Link>
        </div>
      </nav>

      <main className="public-hero">
        <section>
          <div className="public-eyebrow">
            Built around student life
          </div>

          <h1>
            University,
            <br />
            <span>less scattered.</span>
          </h1>

          <p className="public-hero-copy">
            Campora brings your academic life, campus updates, planning,
            and student connections into one simple place.
          </p>

          <div className="public-hero-actions">
            <Link to="/signup" className="public-primary">
              Get Started
              <ArrowRight size={17} />
            </Link>

            <Link to="/about" className="public-secondary">
              Learn about Campora
            </Link>
          </div>
        </section>

        <section className="public-product" aria-label="Campora preview">
          <div className="public-product-glow" />

          <div className="public-window">
            <div className="preview-app">
              <aside className="preview-sidebar">
                <div className="preview-brand-card">
                  <img src={camporaLogo} alt="Campora logo" />
                  <div className="preview-brand-lines">
                    <div className="preview-brand-title" />
                    <div className="preview-brand-sub" />
                  </div>
                </div>

                <div className="preview-nav-item active">
                  <LayoutDashboard size={10} />
                  <div className="preview-nav-line" />
                </div>

                <div className="preview-nav-item">
                  <BookOpen size={10} />
                  <div className="preview-nav-line" />
                </div>

                <div className="preview-nav-item">
                  <UserCheck size={10} />
                  <div className="preview-nav-line" />
                </div>

                <div className="preview-nav-item">
                  <Users size={10} />
                  <div className="preview-nav-line" />
                </div>

                <div className="preview-nav-item">
                  <MessageSquare size={10} />
                  <div className="preview-nav-line" />
                </div>

                <div className="preview-nav-item">
                  <Activity size={10} />
                  <div className="preview-nav-line" />
                </div>

                <div className="preview-tools-label" />

                <div className="preview-nav-item">
                  <CalendarDays size={10} />
                  <div className="preview-nav-line" />
                </div>

                <div className="preview-nav-item">
                  <CheckSquare size={10} />
                  <div className="preview-nav-line" />
                </div>

                <div className="preview-nav-item">
                  <Network size={10} />
                  <div className="preview-nav-line" />
                </div>

                <div className="preview-nav-item">
                  <ShieldCheck size={10} />
                  <div className="preview-nav-line" />
                </div>

                <div className="preview-sidebar-bottom" />
              </aside>

              <div className="preview-right">
                <div className="preview-topbar">
                  <div className="preview-search">
                    <Search size={10} />
                    <div className="preview-search-line" />
                  </div>

                  <div className="preview-top-actions">
                    <Bell size={10} />
                    <Moon size={10} />
                    <div className="preview-avatar" />
                  </div>
                </div>

                <div className="preview-main">
                  <div className="preview-hero-card">
                    <div className="preview-hero-date" />
                    <div className="preview-hero-title" />
                    <div className="preview-hero-subtitle" />
                  </div>

                  <div className="preview-section-heading" />
                  <div className="preview-section-sub" />

                  <div className="preview-quick-grid">
                    <div className="preview-quick-card">
                      <div className="preview-quick-icon purple">
                        <BookOpen size={10} />
                      </div>
                      <div className="preview-quick-line" />
                    </div>

                    <div className="preview-quick-card">
                      <div className="preview-quick-icon pink">
                        <UserCheck size={10} />
                      </div>
                      <div className="preview-quick-line" />
                    </div>

                    <div className="preview-quick-card">
                      <div className="preview-quick-icon pink">
                        <Users size={10} />
                      </div>
                      <div className="preview-quick-line" />
                    </div>

                    <div className="preview-quick-card">
                      <div className="preview-quick-icon blue">
                        <MessageSquare size={10} />
                      </div>
                      <div className="preview-quick-line" />
                    </div>

                    <div className="preview-quick-card">
                      <div className="preview-quick-icon peach">
                        <Activity size={10} />
                      </div>
                      <div className="preview-quick-line" />
                    </div>
                  </div>

                  <div className="preview-two-col">
                    <div className="preview-panel">
                      <div className="preview-panel-head">
                        <div className="preview-panel-title-wrap">
                          <div
                            className="preview-panel-icon"
                            style={{ background: '#F2F6FC', color: '#648CCB' }}
                          >
                            <CalendarDays size={10} />
                          </div>

                          <div>
                            <div className="preview-panel-title" />
                            <div className="preview-panel-sub" />
                          </div>
                        </div>

                        <div className="preview-panel-btn" />
                      </div>

                      <div className="preview-empty-box">
                        <div className="preview-empty-line" />
                      </div>
                    </div>

                    <div className="preview-panel">
                      <div className="preview-panel-head">
                        <div className="preview-panel-title-wrap">
                          <div
                            className="preview-panel-icon"
                            style={{ background: '#FFF4EE', color: '#D9896A' }}
                          >
                            <Clock3 size={10} />
                          </div>

                          <div>
                            <div className="preview-panel-title" />
                            <div className="preview-panel-sub" />
                          </div>
                        </div>

                        <div className="preview-panel-btn" />
                      </div>

                      <div className="preview-empty-box">
                        <div className="preview-empty-line" />
                      </div>
                    </div>
                  </div>

                  <div className="preview-two-col">
                    <div className="preview-panel">
                      <div className="preview-panel-head">
                        <div className="preview-panel-title-wrap">
                          <div
                            className="preview-panel-icon"
                            style={{ background: '#F5F2FB', color: '#8B78B8' }}
                          >
                            <BookOpen size={10} />
                          </div>

                          <div>
                            <div className="preview-panel-title" />
                            <div className="preview-panel-sub" />
                          </div>
                        </div>

                        <div className="preview-panel-btn" />
                      </div>

                      <div className="preview-snapshot">
                        <div className="preview-stat one">
                          <div className="preview-stat-num" />
                          <div className="preview-stat-label" />
                        </div>
                        <div className="preview-stat two">
                          <div className="preview-stat-num" />
                          <div className="preview-stat-label" />
                        </div>
                        <div className="preview-stat three">
                          <div className="preview-stat-num" />
                          <div className="preview-stat-label" />
                        </div>
                      </div>
                    </div>

                    <div className="preview-panel">
                      <div className="preview-panel-head">
                        <div className="preview-panel-title-wrap">
                          <div
                            className="preview-panel-icon"
                            style={{ background: '#EEF7F3', color: '#5E9A8B' }}
                          >
                            <CheckSquare size={10} />
                          </div>

                          <div>
                            <div className="preview-panel-title" />
                            <div className="preview-panel-sub" />
                          </div>
                        </div>

                        <div className="preview-panel-btn" />
                      </div>

                      <div className="preview-progress">
                        <div className="preview-progress-number" />
                        <div className="preview-progress-line" />
                        <div className="preview-progress-track" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="preview-frost" />
            <div className="preview-fade" />
          </div>
        </section>
      </main>
    </div>
  );
}
