import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Network,
  Users,
  MessageSquare,
} from 'lucide-react';

const NAVY = '#0B1A3F';
const TEXT = '#172033';
const MUTED = '#6F7B90';
const BORDER = '#E5EAF2';

export default function Features() {
  const pillars = [
    {
      icon: BookOpen,
      title: 'Courses & Registration',
      text: 'Organize every course, assignment, and resource by semester, and handle course swaps, reviews, and GPA tracking in the same place.',
      detail: 'Your academic day stays visible and manageable from one place.',
      accent: '#4F7FC7',
      soft: '#EAF2FD',
    },
    {
      icon: Network,
      title: 'Campus Hub & Pulse',
      text: 'Announcements, campus news, events, and resources sit alongside Campus Pulse, the student feed for posts, questions, and lost & found.',
      detail: 'You get a clearer view of what is happening and what needs your attention.',
      accent: '#3F8B73',
      soft: '#EAF6F1',
    },
    {
      icon: Users,
      title: 'Study Groups & Messages',
      text: 'Join or create study circles by major, and keep direct messages, group chats, and mentors together in one inbox.',
      detail: 'It is easier to find the right people and continue conversations in one place.',
      accent: '#B76A8A',
      soft: '#FBEFF4',
    },
    {
      icon: MessageSquare,
      title: 'Planner & To-Do',
      text: 'A month-view planner for your schedule and agenda, paired with a to-do list that tracks priority and progress.',
      detail: 'The goal is less switching, less searching, and a smoother student experience.',
      accent: '#C69746',
      soft: '#FFF7E8',
    },
  ];

  return (
    <div className="features-page">
      <style>{`
        .features-page {
          min-height: 100vh;
          background: #FBFCFE;
          color: ${TEXT};
          padding: 22px 28px 70px;
          box-sizing: border-box;
        }

        .features-wrap {
          width: min(1080px, 100%);
          margin: 0 auto;
        }

        .features-back {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: ${NAVY};
          text-decoration: none;
          font-size: 12px;
          font-weight: 850;
          margin-bottom: 54px;
        }

        .features-hero {
          max-width: 820px;
          margin-bottom: 64px;
        }

        .features-kicker {
          color: #648CCB;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .10em;
          margin-bottom: 14px;
        }

        .features-hero h1 {
          margin: 0;
          max-width: 760px;
          color: ${NAVY};
          font-size: clamp(44px, 6vw, 66px);
          line-height: 1;
          letter-spacing: -.05em;
          font-weight: 950;
        }

        .features-hero p {
          max-width: 680px;
          margin: 22px 0 0;
          color: ${MUTED};
          font-size: 16px;
          line-height: 1.7;
          font-weight: 600;
        }

        .features-pillar-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap: 14px;
          margin-bottom: 66px;
        }

        .features-pillar {
          min-height: 270px;
          padding: 22px 20px;
          border-radius: 18px;
          border: 1px solid ${BORDER};
          background: #FFFFFF;
          box-shadow: 0 7px 20px rgba(11,26,63,.03);
        }

        .features-pillar-head {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 17px;
        }

        .features-pillar-icon {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .features-pillar h2 {
          margin: 0;
          color: ${NAVY};
          font-size: 16px;
          line-height: 1.2;
          font-weight: 950;
        }

        .features-pillar p {
          margin: 10px 0 0;
          color: ${MUTED};
          font-size: 12px;
          line-height: 1.65;
          font-weight: 600;
        }

        .features-pillar-detail {
          margin-top: 14px;
          padding-top: 13px;
          border-top: 1px solid #EDF0F5;
          color: #0B1A3F;
          font-size: 11px;
          line-height: 1.55;
          font-weight: 800;
        }

        .features-statement {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 30px;
          align-items: center;
          padding: 34px 38px;
          border-radius: 20px;
          background: ${NAVY};
          color: #FFFFFF;
        }

        .features-statement h2 {
          margin: 0;
          color: #FFFFFF;
          font-size: 25px;
          line-height: 1.15;
          font-weight: 950;
        }

        .features-statement p {
          max-width: 650px;
          margin: 8px 0 0;
          color: rgba(255,255,255,.68);
          font-size: 12px;
          line-height: 1.6;
          font-weight: 650;
        }

        .features-cta {
          min-height: 42px;
          padding: 0 15px;
          border-radius: 11px;
          background: #FFFFFF;
          color: ${NAVY};
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          font-weight: 900;
          white-space: nowrap;
        }

        @media (max-width: 980px) {
          .features-pillar-grid {
            grid-template-columns: repeat(2, minmax(0,1fr));
          }
        }

        @media (max-width: 760px) {
          .features-page {
            padding-left: 18px;
            padding-right: 18px;
          }

          .features-pillar-grid {
            grid-template-columns: 1fr;
          }

          .features-statement {
            grid-template-columns: 1fr;
          }

          .features-hero {
            margin-bottom: 42px;
          }
        }
      `}</style>

      <div className="features-wrap">
        <Link to="/" className="features-back">
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <section className="features-hero">
          <div className="features-kicker">
            What Campora is built for
          </div>

          <h1>
            Less switching.
            <br />
            More student life in one place.
          </h1>

          <p>
            Campora brings together the parts of university life students
            deal with every day: classes, planning, campus information,
            communication, and student communities. It is designed to make
            those pieces feel connected instead of scattered.
          </p>
        </section>

        <section className="features-pillar-grid">
          {pillars.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className="features-pillar">
                <div className="features-pillar-head">
                  <div
                    className="features-pillar-icon"
                    style={{
                      background: item.soft,
                      color: item.accent,
                      border: `1.5px solid ${item.accent}55`,
                      boxShadow: `0 5px 12px ${item.accent}18`,
                    }}
                  >
                    <Icon size={20} strokeWidth={2.15} />
                  </div>

                  <h2>{item.title}</h2>
                </div>
                <p>{item.text}</p>
                <div className="features-pillar-detail">
                  {item.detail}
                </div>
              </article>
            );
          })}
        </section>

        <section className="features-statement">
          <div>
            <h2>
              One place that feels like part of campus, not another system to manage.
            </h2>
            <p>
              Campora keeps the experience focused, familiar, and student-centered.
            </p>
          </div>

          <Link to="/signup" className="features-cta">
            Get Started
            <ArrowRight size={15} />
          </Link>
        </section>
      </div>
    </div>
  );
}