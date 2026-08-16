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
          max-width: 650px;
          height: 455px;
          border: 1px solid ${BORDER};
          border-radius: 22px;
          background: #FFFFFF;
          box-shadow: 0 28px 70px rgba(11,26,63,.10);
          overflow: hidden;
          position: relative;
          z-index: 2;
        }

        .preview-topbar {
          height: 52px;
          display: grid;
          grid-template-columns: 138px minmax(0,1fr);
          border-bottom: 1px solid #EEF1F5;
          background: #FFFFFF;
        }

        .preview-brand-space {
          display: flex;
          align-items: center;
          padding: 0 12px;
          border-right: 1px solid #EEF1F5;
          background: #FAFBFD;
        }

        .preview-top-content {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-search {
          width: 250px;
          height: 28px;
          border-radius: 999px;
          border: 1px solid #E2E7EF;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 0 10px;
          box-sizing: border-box;
          color: #8390A2;
          box-shadow: 0 2px 6px rgba(11,26,63,.025);
        }

        .preview-search-text {
          width: 82px;
          height: 5px;
          border-radius: 999px;
          background: #D6DDE6;
          filter: blur(2px);
          opacity: .65;
        }

        .preview-top-actions {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          gap: 10px;
          color: ${NAVY};
        }

        .preview-profile {
          width: 25px;
          height: 25px;
          border-radius: 50%;
          background: ${NAVY};
          border: 2px solid #FFFFFF;
          box-shadow: 0 2px 7px rgba(11,26,63,.14);
        }

        .preview-body {
          display: grid;
          grid-template-columns: 138px minmax(0,1fr);
          height: calc(100% - 52px);
        }

        .preview-sidebar {
          background: #FAFBFD;
          border-right: 1px solid #EEF1F5;
          padding: 12px 9px;
          box-sizing: border-box;
        }

        .preview-logo-row {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 5px 6px 12px;
          color: ${NAVY};
          font-size: 9px;
          font-weight: 950;
        }

        .preview-logo-row img {
          width: 23px;
          height: 23px;
          object-fit: contain;
          display: block;
        }

        .preview-logo-sub {
          display: block;
          width: 44px;
          height: 4px;
          margin-top: 3px;
          border-radius: 999px;
          background: #D8DFE8;
          filter: blur(1.7px);
          opacity: .65;
        }

        .preview-nav-item {
          height: 29px;
          border-radius: 8px;
          margin-bottom: 4px;
          padding: 0 8px;
          display: flex;
          align-items: center;
          gap: 7px;
          color: #778396;
        }

        .preview-nav-item.active {
          background: ${NAVY};
          color: #FFFFFF;
          box-shadow: 0 4px 10px rgba(11,26,63,.10);
        }

        .preview-nav-blur {
          width: 55px;
          height: 5px;
          border-radius: 999px;
          background: #CBD3DE;
          filter: blur(2.4px);
          opacity: .55;
        }

        .preview-nav-item.active .preview-nav-blur {
          background: rgba(255,255,255,.82);
          opacity: .7;
        }

        .preview-tools {
          width: 34px;
          height: 5px;
          margin: 9px 8px 8px;
          border-radius: 999px;
          background: #D2D9E3;
          filter: blur(2.5px);
          opacity: .55;
        }

        .preview-main {
          padding: 13px;
          background: #FCFDFE;
          overflow: hidden;
          box-sizing: border-box;
        }

        .preview-hero-card {
          height: 86px;
          border-radius: 15px;
          background: linear-gradient(135deg, #0B1A3F 0%, #102A5A 100%);
          padding: 15px 16px;
          box-sizing: border-box;
          margin-bottom: 12px;
          color: #FFFFFF;
          box-shadow: 0 8px 20px rgba(11,26,63,.10);
        }

        .preview-hero-date {
          width: 78px;
          height: 5px;
          border-radius: 999px;
          background: rgba(255,255,255,.60);
          filter: blur(1.8px);
          margin-bottom: 10px;
        }

        .preview-hero-title {
          width: 215px;
          height: 12px;
          border-radius: 999px;
          background: rgba(255,255,255,.94);
          filter: blur(2px);
        }

        .preview-hero-subtitle {
          width: 112px;
          height: 5px;
          border-radius: 999px;
          background: rgba(255,255,255,.58);
          filter: blur(2px);
          margin-top: 8px;
        }

        .preview-section-head {
          margin-bottom: 8px;
        }

        .preview-section-title {
          width: 78px;
          height: 7px;
          border-radius: 999px;
          background: ${NAVY};
          filter: blur(1.7px);
        }

        .preview-section-sub {
          width: 94px;
          height: 4px;
          margin-top: 5px;
          border-radius: 999px;
          background: #CFD7E2;
          filter: blur(1.8px);
        }

        .preview-quick-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0,1fr));
          gap: 6px;
          margin-bottom: 10px;
        }

        .preview-quick-card {
          min-height: 45px;
          border-radius: 10px;
          border: 1px solid #E7EBF1;
          background: #FFFFFF;
          padding: 7px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 6px;
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

        .preview-quick-icon.blue { background: #F3F7FD; color: #648CCB; }
        .preview-quick-icon.purple { background: #F5F2FB; color: #8B78B8; }
        .preview-quick-icon.green { background: #EEF7F3; color: #5E9A8B; }
        .preview-quick-icon.pink { background: #FFF2F6; color: #C76E8A; }

        .preview-card-blur {
          width: 42px;
          height: 5px;
          border-radius: 999px;
          background: #CAD3DF;
          filter: blur(2px);
          opacity: .58;
        }

        .preview-main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 8px;
        }

        .preview-panel {
          min-height: 93px;
          border-radius: 12px;
          border: 1px solid #E7EBF1;
          background: #FFFFFF;
          overflow: hidden;
        }

        .preview-panel-head {
          min-height: 32px;
          padding: 7px 9px;
          border-bottom: 1px solid #EEF1F5;
          display: flex;
          align-items: center;
          justify-content: space-between;
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
          background: #F3F7FD;
          color: #648CCB;
        }

        .preview-panel-title {
          width: 55px;
          height: 6px;
          border-radius: 999px;
          background: ${NAVY};
          filter: blur(1.8px);
        }

        .preview-panel-sub {
          width: 68px;
          height: 4px;
          margin-top: 4px;
          border-radius: 999px;
          background: #D2D9E2;
          filter: blur(1.8px);
        }

        .preview-panel-btn {
          width: 36px;
          height: 17px;
          border-radius: 6px;
          background: #F6F8FB;
          border: 1px solid #E7EBF1;
        }

        .preview-panel-body {
          padding: 7px 9px;
        }

        .preview-class-row {
          min-height: 26px;
          border: 1px solid #EDF0F5;
          border-radius: 8px;
          margin-bottom: 5px;
          padding: 5px 7px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .preview-row-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .preview-row-icon {
          width: 17px;
          height: 17px;
          border-radius: 6px;
          background: #F3F7FD;
        }

        .preview-row-lines {
          width: 58px;
        }

        .preview-row-line {
          height: 4px;
          border-radius: 999px;
          background: #CAD3DE;
          filter: blur(1.8px);
        }

        .preview-row-line.short {
          width: 62%;
          margin-top: 4px;
          background: #D7DDE6;
        }

        .preview-time {
          width: 46px;
          height: 5px;
          border-radius: 999px;
          background: #CAD3DE;
          filter: blur(1.8px);
        }

        .preview-empty {
          height: 47px;
          border: 1px dashed #DEE5EE;
          border-radius: 9px;
          background: #FBFCFE;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-empty-line {
          width: 82px;
          height: 5px;
          border-radius: 999px;
          background: #D4DBE5;
          filter: blur(2px);
        }

        .preview-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .preview-snapshot {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          padding: 7px 9px;
        }

        .preview-stat {
          min-height: 42px;
          border-radius: 8px;
          padding: 7px;
          box-sizing: border-box;
        }

        .preview-stat.one { background: #F6F3FB; }
        .preview-stat.two { background: #FBF7EF; }
        .preview-stat.three { background: #F1F6FC; }

        .preview-stat-number {
          width: 16px;
          height: 9px;
          border-radius: 999px;
          background: ${NAVY};
          filter: blur(1.6px);
        }

        .preview-stat-label {
          width: 35px;
          height: 4px;
          border-radius: 999px;
          background: #BFC9D6;
          filter: blur(1.8px);
          margin-top: 8px;
        }

        .preview-progress-body {
          padding: 8px 9px 9px;
        }

        .preview-progress-number {
          width: 16px;
          height: 12px;
          border-radius: 999px;
          background: ${NAVY};
          filter: blur(1.7px);
        }

        .preview-progress-sub {
          width: 40px;
          height: 4px;
          border-radius: 999px;
          background: #C9D2DD;
          filter: blur(1.8px);
          margin-top: 6px;
        }

        .preview-progress-track {
          height: 5px;
          border-radius: 999px;
          background: #E9EDF2;
          margin-top: 12px;
        }

        .preview-fade {
          position: absolute;
          inset: auto 0 0 0;
          height: 78px;
          background: linear-gradient(
            to bottom,
            rgba(255,255,255,0),
            rgba(255,255,255,.52) 55%,
            #FFFFFF 100%
          );
          pointer-events: none;
          z-index: 5;
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
            <div className="preview-topbar">
              <div className="preview-brand-space" />

              <div className="preview-top-content">
                <div className="preview-search">
                  <Search size={9} />
                  <span className="preview-search-text" />
                </div>

                <div className="preview-top-actions">
                  <Bell size={10} />
                  <Moon size={10} />
                  <div className="preview-profile" />
                </div>
              </div>
            </div>

            <div className="preview-body">
              <aside className="preview-sidebar">
                <div className="preview-logo-row">
                  <img src={camporaLogo} alt="Campora logo" />
                  <div>
                    Campora
                    <span className="preview-logo-sub" />
                  </div>
                </div>

                <div className="preview-nav-item active">
                  <LayoutDashboard size={10} />
                  <span className="preview-nav-blur" />
                </div>

                <div className="preview-nav-item">
                  <BookOpen size={10} />
                  <span className="preview-nav-blur" />
                </div>

                <div className="preview-nav-item">
                  <UserCheck size={10} />
                  <span className="preview-nav-blur" />
                </div>

                <div className="preview-nav-item">
                  <Users size={10} />
                  <span className="preview-nav-blur" />
                </div>

                <div className="preview-nav-item">
                  <MessageSquare size={10} />
                  <span className="preview-nav-blur" />
                </div>

                <div className="preview-nav-item">
                  <Activity size={10} />
                  <span className="preview-nav-blur" />
                </div>

                <div className="preview-tools" />

                <div className="preview-nav-item">
                  <CalendarDays size={10} />
                  <span className="preview-nav-blur" />
                </div>

                <div className="preview-nav-item">
                  <CheckSquare size={10} />
                  <span className="preview-nav-blur" />
                </div>

                <div className="preview-nav-item">
                  <Network size={10} />
                  <span className="preview-nav-blur" />
                </div>

                <div className="preview-nav-item">
                  <ShieldCheck size={10} />
                  <span className="preview-nav-blur" />
                </div>
              </aside>

              <div className="preview-main">
                <div className="preview-hero-card">
                  <div className="preview-hero-date" />
                  <div className="preview-hero-title" />
                  <div className="preview-hero-subtitle" />
                </div>

                <div className="preview-section-head">
                  <div className="preview-section-title" />
                  <div className="preview-section-sub" />
                </div>

                <div className="preview-quick-grid">
                  <div className="preview-quick-card">
                    <div className="preview-quick-icon blue">
                      <CalendarDays size={11} />
                    </div>
                    <div className="preview-card-blur" />
                  </div>

                  <div className="preview-quick-card">
                    <div className="preview-quick-icon purple">
                      <BookOpen size={11} />
                    </div>
                    <div className="preview-card-blur" />
                  </div>

                  <div className="preview-quick-card">
                    <div className="preview-quick-icon green">
                      <CheckSquare size={11} />
                    </div>
                    <div className="preview-card-blur" />
                  </div>

                  <div className="preview-quick-card">
                    <div className="preview-quick-icon blue">
                      <MessageSquare size={11} />
                    </div>
                    <div className="preview-card-blur" />
                  </div>

                  <div className="preview-quick-card">
                    <div className="preview-quick-icon pink">
                      <Users size={11} />
                    </div>
                    <div className="preview-card-blur" />
                  </div>
                </div>

                <div className="preview-main-grid">
                  <div className="preview-panel">
                    <div className="preview-panel-head">
                      <div className="preview-panel-title-wrap">
                        <div className="preview-panel-icon">
                          <CalendarDays size={10} />
                        </div>

                        <div>
                          <div className="preview-panel-title" />
                          <div className="preview-panel-sub" />
                        </div>
                      </div>

                      <div className="preview-panel-btn" />
                    </div>

                    <div className="preview-panel-body">
                      <div className="preview-class-row">
                        <div className="preview-row-left">
                          <div className="preview-row-icon" />
                          <div className="preview-row-lines">
                            <div className="preview-row-line" />
                            <div className="preview-row-line short" />
                          </div>
                        </div>

                        <div className="preview-time" />
                      </div>

                      <div className="preview-class-row">
                        <div className="preview-row-left">
                          <div className="preview-row-icon" />
                          <div className="preview-row-lines">
                            <div className="preview-row-line" />
                            <div className="preview-row-line short" />
                          </div>
                        </div>

                        <div className="preview-time" />
                      </div>
                    </div>
                  </div>

                  <div className="preview-panel">
                    <div className="preview-panel-head">
                      <div className="preview-panel-title-wrap">
                        <div
                          className="preview-panel-icon"
                          style={{
                            background: '#FFF4EE',
                            color: '#D9896A',
                          }}
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

                    <div className="preview-panel-body">
                      <div className="preview-empty">
                        <div className="preview-empty-line" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="preview-bottom-grid">
                  <div className="preview-panel">
                    <div className="preview-panel-head">
                      <div className="preview-panel-title-wrap">
                        <div
                          className="preview-panel-icon"
                          style={{
                            background: '#F5F2FB',
                            color: '#8B78B8',
                          }}
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
                        <div className="preview-stat-number" />
                        <div className="preview-stat-label" />
                      </div>

                      <div className="preview-stat two">
                        <div className="preview-stat-number" />
                        <div className="preview-stat-label" />
                      </div>

                      <div className="preview-stat three">
                        <div className="preview-stat-number" />
                        <div className="preview-stat-label" />
                      </div>
                    </div>
                  </div>

                  <div className="preview-panel">
                    <div className="preview-panel-head">
                      <div className="preview-panel-title-wrap">
                        <div
                          className="preview-panel-icon"
                          style={{
                            background: '#EEF7F3',
                            color: '#5E9A8B',
                          }}
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

                    <div className="preview-progress-body">
                      <div className="preview-progress-number" />
                      <div className="preview-progress-sub" />
                      <div className="preview-progress-track" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="preview-fade" />
          </div>
        </section>
      </main>
    </div>
  );
}
