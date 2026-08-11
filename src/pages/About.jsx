import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  GraduationCap,
  Lightbulb,
  Heart,
  Users,
  Sparkles,
  Rocket,
} from 'lucide-react';

export default function About() {
  const team = [
    { name: 'Lara Murtada', major: 'Mechanical Engineering' },
    { name: 'Nourhan Adas', major: 'Chemical Engineering' },
    { name: 'Yasmin Bilal', major: 'Electrical Engineering' },
    { name: 'Sireen Akoum', major: 'Computer Science' },
    { name: 'Nadia Bakri', major: 'Computer Science' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #ffffff 0%, #f8f9ff 50%, #eef1ff 100%)',
        color: '#0B1A3F',
        padding: '20px 48px 70px',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: '#0B1A3F',
            fontWeight: '800',
            marginBottom: '34px',
          }}
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        {/* HERO */}
        <section
          style={{
            textAlign: 'center',
            marginBottom: '100px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '9px',
              padding: '10px 16px',
              borderRadius: '999px',
              background: '#F1F3FF',
              color: '#6366F1',
              fontWeight: '800',
              marginBottom: '20px',
            }}
          >
            <GraduationCap size={18} />
            About Campora
          </div>

          <h1
            style={{
              fontSize: '52px',
              lineHeight: '1.08',
              fontWeight: '950',
              letterSpacing: '-2px',
              marginBottom: '22px',
            }}
          >
            More than a platform.
            <br />
            <span style={{ color: '#6366F1' }}>
              Built from the student experience.
            </span>
          </h1>

          <p
            style={{
              maxWidth: '760px',
              margin: '0 auto',
              fontSize: '18px',
              lineHeight: '1.8',
              color: '#667085',
              fontWeight: '600',
            }}
          >
            Campora started with a simple idea: university life should not feel
            scattered. As students ourselves, we saw how many parts of campus life
            live in different places, and we imagined one space designed around the
            way students actually experience university.
          </p>
        </section>

        {/* OUR STORY */}
        <section
          style={{
            maxWidth: '860px',
            margin: '0 auto 110px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '17px',
              background: '#F1F2FF',
              color: '#6366F1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
            }}
          >
            <Lightbulb size={29} />
          </div>

          <p
            style={{
              color: '#6366F1',
              fontWeight: '900',
              fontSize: '13px',
              letterSpacing: '1.4px',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            Our Story
          </p>

          <h2
            style={{
              fontSize: '42px',
              fontWeight: '950',
              lineHeight: '1.15',
              marginBottom: '24px',
            }}
          >
            It started with an idea.
          </h2>

          <p
            style={{
              color: '#667085',
              fontSize: '17px',
              lineHeight: '1.85',
              fontWeight: '600',
              marginBottom: '20px',
            }}
          >
            Campora was not created just to build another university website. It
            grew from conversations, ideas, and our own experiences as students.
          </p>

          <p
            style={{
              color: '#667085',
              fontSize: '17px',
              lineHeight: '1.85',
              fontWeight: '600',
              marginBottom: '20px',
            }}
          >
            We wanted to create something that could bring together the different
            sides of university life, including academic responsibilities,
            organization, campus involvement, communication, and community.
          </p>

          <p
            style={{
              color: '#667085',
              fontSize: '17px',
              lineHeight: '1.85',
              fontWeight: '600',
              marginBottom: '24px',
            }}
          >
            Instead of students having to keep track of everything across different
            places, we imagined one platform where those experiences could come
            together naturally.
          </p>

          <div
            style={{
              background: '#F3F2FF',
              border: '1px solid #E2E6FF',
              borderRadius: '24px',
              padding: '26px 28px',
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#0B1A3F',
                fontSize: '21px',
                lineHeight: '1.6',
                fontWeight: '950',
              }}
            >
              A place built around students, because it was imagined by students.
            </p>
          </div>
        </section>

        {/* FROM IDEA TO REALITY */}
        <section
          style={{
            background:
              'linear-gradient(135deg, #F3F0FF 0%, #F8FAFF 100%)',
            borderRadius: '34px',
            padding: '52px',
            marginBottom: '110px',
            textAlign: 'center',
            border: '1px solid #E5E7FF',
          }}
        >
          <Rocket
            size={36}
            color="#6366F1"
            style={{ marginBottom: '16px' }}
          />

          <p
            style={{
              color: '#6366F1',
              fontWeight: '900',
              fontSize: '13px',
              letterSpacing: '1.4px',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            From Idea to Reality
          </p>

          <h2
            style={{
              fontSize: '38px',
              fontWeight: '950',
              marginBottom: '22px',
            }}
          >
            We decided to make it real.
          </h2>

          <p
            style={{
              maxWidth: '790px',
              margin: '0 auto 20px',
              color: '#667085',
              fontSize: '17px',
              lineHeight: '1.85',
              fontWeight: '600',
            }}
          >
            Campora did not become what it is overnight. What began as an idea
            slowly turned into discussions, designs, decisions, code, testing,
            changes, and improvements.
          </p>

          <p
            style={{
              maxWidth: '790px',
              margin: '0 auto 32px',
              color: '#667085',
              fontSize: '17px',
              lineHeight: '1.85',
              fontWeight: '600',
            }}
          >
            As a team, we kept developing the concept and thinking about how every
            part of the platform could contribute to a better student experience.
            Some ideas changed along the way, new ones appeared, and problems had
            to be solved before the platform could become what it is today.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '14px',
            }}
          >
            {[
              'Ideas',
              'Designs',
              'Features',
              'Testing',
              'Improvement',
              'Campora',
            ].map((item) => (
              <div
                key={item}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E3E6FA',
                  padding: '12px 18px',
                  borderRadius: '999px',
                  fontWeight: '900',
                  color: '#0B1A3F',
                  fontSize: '14px',
                }}
              >
                {item}
              </div>
            ))}
          </div>

          <p
            style={{
              margin: '32px auto 0',
              maxWidth: '760px',
              color: '#6366F1',
              fontSize: '22px',
              lineHeight: '1.6',
              fontWeight: '950',
            }}
          >
            Ideas became designs. Designs became features. Features became Campora.
          </p>
        </section>

        {/* WHY CAMPORA */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: '0.9fr 1.1fr',
            gap: '56px',
            alignItems: 'center',
            marginBottom: '110px',
          }}
        >
          <div
            style={{
              minHeight: '330px',
              background: '#0B1A3F',
              borderRadius: '32px',
              padding: '42px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 24px 60px rgba(11, 26, 63, 0.16)',
            }}
          >
            <Heart
              size={34}
              color="#FFFFFF"
              style={{ marginBottom: '20px' }}
            />

            <p
              style={{
                color: 'rgba(255,255,255,0.72)',
                fontWeight: '800',
                fontSize: '13px',
                letterSpacing: '1.4px',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              Why Campora?
            </p>

            <h2
              style={{
                color: '#FFFFFF',
                fontSize: '34px',
                lineHeight: '1.2',
                fontWeight: '950',
                marginBottom: '18px',
              }}
            >
              Because university life is more than classes.
            </h2>

            <p
              style={{
                color: 'rgba(255,255,255,0.78)',
                fontSize: '16px',
                lineHeight: '1.8',
                fontWeight: '600',
                margin: 0,
              }}
            >
              University is lectures, assignments, exams, and deadlines, but it is
              also friendships, opportunities, events, conversations, communities,
              planning, and everything happening in between.
            </p>
          </div>

          <div>
            <p
              style={{
                color: '#667085',
                fontSize: '17px',
                lineHeight: '1.85',
                fontWeight: '600',
                marginBottom: '22px',
              }}
            >
              We wanted Campora to reflect that full experience. It is not meant to
              focus on only one part of being a student.
            </p>

            <p
              style={{
                color: '#667085',
                fontSize: '17px',
                lineHeight: '1.85',
                fontWeight: '600',
                marginBottom: '26px',
              }}
            >
              It brings different parts of campus life into one experience so
              students can feel more organized, informed, involved, and connected.
            </p>

            <div
              style={{
                background: '#F1F3FF',
                borderRadius: '26px',
                padding: '30px',
                border: '1px solid #E2E6FF',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '27px',
                  lineHeight: '1.35',
                  fontWeight: '950',
                  color: '#6366F1',
                }}
              >
                “This is where my campus life comes together.”
              </p>
            </div>
          </div>
        </section>

        {/* TEAM */}
        <section
          style={{
            textAlign: 'center',
            marginBottom: '110px',
          }}
        >
          <div
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '18px',
              background: '#F1F2FF',
              color: '#6366F1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
            }}
          >
            <Users size={30} />
          </div>

          <p
            style={{
              color: '#6366F1',
              fontWeight: '900',
              fontSize: '13px',
              letterSpacing: '1.4px',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            The People Behind Campora
          </p>

          <h2
            style={{
              fontSize: '40px',
              fontWeight: '950',
              marginBottom: '18px',
            }}
          >
            Meet our team.
          </h2>

          <p
            style={{
              maxWidth: '760px',
              margin: '0 auto 42px',
              color: '#667085',
              fontSize: '17px',
              lineHeight: '1.8',
              fontWeight: '600',
            }}
          >
            Campora is the result of five students coming together with different
            academic backgrounds, perspectives, and ways of thinking. Our fields may
            be different, but throughout the process we shared the same goal: to take
            an idea we believed in and turn it into something real.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '18px',
            }}
          >
            {team.map((member, index) => (
              <div
                key={member.name}
                style={{
                  gridColumn:
                    index < 3
                      ? 'span 2'
                      : index === 3
                      ? '2 / span 2'
                      : '4 / span 2',
                  background:
                    index % 2 === 0 ? '#F7F5FF' : '#F3F7FF',
                  border: '1px solid #E4E6FA',
                  borderRadius: '26px',
                  padding: '28px 20px',
                  boxShadow: '0 14px 35px rgba(81, 95, 160, 0.06)',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 15px',
                    color: '#6366F1',
                    fontWeight: '950',
                    fontSize: '18px',
                  }}
                >
                  {member.name.charAt(0)}
                </div>

                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: '950',
                    marginBottom: '7px',
                  }}
                >
                  {member.name}
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: '#667085',
                    fontSize: '14px',
                    fontWeight: '700',
                  }}
                >
                  {member.major}
                </p>
              </div>
            ))}
          </div>

          <h3
            style={{
              fontSize: '24px',
              fontWeight: '950',
              marginTop: '34px',
              color: '#6366F1',
            }}
          >
            Five students. Different disciplines. One shared idea.
          </h3>
        </section>

        {/* VISION */}
        <section
          style={{
            textAlign: 'center',
            maxWidth: '850px',
            margin: '0 auto 100px',
          }}
        >
          <Sparkles
            size={34}
            color="#6366F1"
            style={{ marginBottom: '16px' }}
          />

          <p
            style={{
              color: '#6366F1',
              fontWeight: '900',
              fontSize: '13px',
              letterSpacing: '1.4px',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            Our Vision
          </p>

          <h2
            style={{
              fontSize: '40px',
              lineHeight: '1.2',
              fontWeight: '950',
              marginBottom: '22px',
            }}
          >
            Building the campus experience we want to have.
          </h2>

          <p
            style={{
              color: '#667085',
              fontSize: '17px',
              lineHeight: '1.85',
              fontWeight: '600',
              marginBottom: '18px',
            }}
          >
            Campora represents our vision for a university experience that feels
            simpler, more connected, and more student-centered.
          </p>

          <p
            style={{
              color: '#667085',
              fontSize: '17px',
              lineHeight: '1.85',
              fontWeight: '600',
              margin: 0,
            }}
          >
            We believe technology should make student life easier, not create
            another complicated system to manage. What we have built is something
            we are proud to have brought from an idea to life, but we also see
            Campora as something that can continue to grow.
          </p>
        </section>

        {/* FINAL */}
        <section
          style={{
            background:
              'linear-gradient(135deg, #0B1A3F 0%, #17295A 100%)',
            color: '#FFFFFF',
            borderRadius: '34px',
            padding: '52px 40px',
            textAlign: 'center',
            boxShadow: '0 24px 60px rgba(11, 26, 63, 0.18)',
          }}
        >
          <p
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: '13px',
              fontWeight: '900',
              letterSpacing: '1.4px',
              textTransform: 'uppercase',
              marginBottom: '14px',
            }}
          >
            This is Campora
          </p>

          <h2
            style={{
              color: '#FFFFFF',
              fontSize: '40px',
              lineHeight: '1.2',
              fontWeight: '950',
              marginBottom: '18px',
            }}
          >
            Built by students.
            <br />
            Made for student life.
          </h2>

          <p
            style={{
              maxWidth: '690px',
              margin: '0 auto',
              color: 'rgba(255,255,255,0.78)',
              fontSize: '16px',
              lineHeight: '1.8',
              fontWeight: '600',
            }}
          >
            Campora is an idea we imagined together, a project we built together,
            and a platform created around the student experience. And this is only
            the beginning.
          </p>
        </section>
      </div>
    </div>
  );
}