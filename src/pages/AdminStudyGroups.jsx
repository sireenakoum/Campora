import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  X,
  ShieldCheck,
  Clock3,
  Users,
  Target,
  MapPin,
  Volume2,
  RefreshCw,
  GraduationCap,
  MessagesSquare,
  Search,
  UserRoundCheck,
  ChevronLeft,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const ADMIN_NAVY = '#0B1A3F';
const ADMIN_NAVY_SOFT = '#F1F4F8';
const ADMIN_NAVY_BORDER = '#D8E0EB';

const NAVY = '#0B1A3F';
const MUTED = '#717786';
const TEXT = '#1A1B1F';

export default function AdminStudyGroups() {
  const [activeTab, setActiveTab] = useState('study');

  const [pendingGroups, setPendingGroups] = useState([]);
  const [mentorApplications, setMentorApplications] = useState([]);

  const [directMessages, setDirectMessages] = useState([]);
  const [studyGroups, setStudyGroups] = useState([]);
  const [groupMessages, setGroupMessages] = useState([]);
  const [privateGroups, setPrivateGroups] = useState([]);
  const [privateGroupMessages, setPrivateGroupMessages] = useState([]);

  const [profiles, setProfiles] = useState({});
  const [selectedConversation, setSelectedConversation] = useState(null);

  const [messageFilter, setMessageFilter] = useState('all');
  const [messageSearch, setMessageSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUserId, setAdminUserId] = useState(null);

  const checkAdmin = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsAdmin(false);
      setAdminUserId(null);
      return false;
    }

    const { data, error } = await supabase
      .from('campora_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Admin check error:', error);
      setIsAdmin(false);
      return false;
    }

    const admin = !!data;
    setIsAdmin(admin);
    setAdminUserId(admin ? user.id : null);
    return admin;
  };

  const mergeProfilesByIds = async (ids) => {
    const uniqueIds = [...new Set((ids || []).filter(Boolean))];
    if (!uniqueIds.length) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', uniqueIds);

    if (error) {
      console.error('Profile loading error:', error);
      return;
    }

    setProfiles((current) => {
      const next = { ...current };
      (data || []).forEach((profile) => {
        next[profile.id] = profile;
      });
      return next;
    });
  };

  const fetchPendingGroups = async () => {
    const { data, error } = await supabase
      .from('study_groups')
      .select('*')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Pending groups error:', error);
      throw error;
    }

    setPendingGroups(data || []);
  };

  const fetchMentorApplications = async () => {
    const { data, error } = await supabase
      .from('mentor_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Mentor applications error:', error);
      throw error;
    }

    const rows = data || [];
    setMentorApplications(rows);
    await mergeProfilesByIds(rows.map((item) => item.user_id));
  };

  const fetchMessageModeration = async () => {
    const [
      dmResult,
      studyGroupResult,
      groupMessageResult,
      privateGroupResult,
      privateMessageResult,
    ] = await Promise.all([
      supabase
        .from('direct_messages')
        .select('*')
        .order('created_at', { ascending: true }),

      supabase
        .from('study_groups')
        .select('*')
        .order('created_at', { ascending: false }),

      supabase
        .from('group_messages')
        .select('*')
        .order('created_at', { ascending: true }),

      supabase
        .from('message_groups')
        .select('*')
        .order('created_at', { ascending: false }),

      supabase
        .from('message_group_messages')
        .select('*')
        .order('created_at', { ascending: true }),
    ]);

    const errors = [
      dmResult.error,
      studyGroupResult.error,
      groupMessageResult.error,
      privateGroupResult.error,
      privateMessageResult.error,
    ].filter(Boolean);

    if (errors.length) {
      console.error('Message moderation loading error:', errors);
      throw errors[0];
    }

    const dms = dmResult.data || [];
    const groups = studyGroupResult.data || [];
    const studyMessages = groupMessageResult.data || [];
    const customGroups = privateGroupResult.data || [];
    const customMessages = privateMessageResult.data || [];

    setDirectMessages(dms);
    setStudyGroups(groups);
    setGroupMessages(studyMessages);
    setPrivateGroups(customGroups);
    setPrivateGroupMessages(customMessages);

    const userIds = [
      ...dms.flatMap((m) => [m.sender_id, m.receiver_id]),
      ...studyMessages.map((m) => m.user_id),
      ...customMessages.map((m) => m.sender_id),
    ];

    await mergeProfilesByIds(userIds);
  };

  const loadTab = async (tab = activeTab) => {
    setSectionLoading(true);
    try {
      if (tab === 'study') await fetchPendingGroups();
      if (tab === 'mentors') await fetchMentorApplications();
      if (tab === 'messages') await fetchMessageModeration();
    } catch (error) {
      alert(
        `Could not load this admin section: ${
          error?.message || 'Unknown database error'
        }`
      );
    } finally {
      setSectionLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const admin = await checkAdmin();
        if (!admin) return;
        await fetchPendingGroups();
      } catch (error) {
        console.error('Admin Reviews initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const changeTab = async (tab) => {
    setActiveTab(tab);
    setSelectedConversation(null);
    setMessageSearch('');
    setMessageFilter('all');
    await loadTab(tab);
  };

  const approveGroup = async (groupId) => {
    setActionLoading(groupId);

    try {
      const { data, error } = await supabase
        .from('study_groups')
        .update({ approval_status: 'approved' })
        .eq('id', groupId)
        .select('id, approval_status')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('The approval was blocked by database permissions.');

      setPendingGroups((current) =>
        current.filter((group) => group.id !== groupId)
      );
    } catch (error) {
      alert(`Could not approve this study circle: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const declineGroup = async (groupId) => {
    if (!window.confirm('Decline this study circle? It will not appear in Discover.')) {
      return;
    }

    setActionLoading(groupId);

    try {
      const { data, error } = await supabase
        .from('study_groups')
        .update({ approval_status: 'rejected' })
        .eq('id', groupId)
        .select('id, approval_status')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('The decline was blocked by database permissions.');

      setPendingGroups((current) =>
        current.filter((group) => group.id !== groupId)
      );
    } catch (error) {
      alert(`Could not decline this study circle: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const reviewMentor = async (mentorId, status) => {
    const verb = status === 'approved' ? 'approve' : 'deny';

    if (
      status === 'denied' &&
      !window.confirm('Deny this mentor application?')
    ) {
      return;
    }

    setActionLoading(`mentor-${mentorId}`);

    try {
      const { data, error } = await supabase
        .from('mentor_profiles')
        .update({
          approval_status: status,
          is_active: status === 'approved',
          reviewed_by: adminUserId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', mentorId)
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error(`The ${verb} action was blocked by database permissions.`);
      }

      setMentorApplications((current) =>
        current.map((item) => (item.id === mentorId ? data : item))
      );
    } catch (error) {
      alert(`Could not ${verb} this mentor: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const profileName = (id, fallback = 'Student') => {
    const profile = profiles[id];
    return (
      profile?.name ||
      profile?.full_name ||
      profile?.display_name ||
      profile?.email?.split('@')[0] ||
      fallback
    );
  };

  const dmThreads = useMemo(() => {
    const map = {};

    directMessages.forEach((message) => {
      if (!message.sender_id || !message.receiver_id) return;

      const key = [message.sender_id, message.receiver_id].sort().join('__');

      if (!map[key]) {
        map[key] = {
          id: `dm-${key}`,
          type: 'dm',
          title: '',
          subtitle: 'Direct Message',
          participantIds: [message.sender_id, message.receiver_id],
          messages: [],
        };
      }

      map[key].messages.push(message);
    });

    return Object.values(map).map((thread) => {
      const [a, b] = thread.participantIds;
      const latest = thread.messages[thread.messages.length - 1];

      return {
        ...thread,
        title: `${profileName(a)} ↔ ${profileName(b)}`,
        latestAt: latest?.created_at,
        preview: latest?.content || latest?.message || 'No messages yet',
      };
    });
  }, [directMessages, profiles]);

  const studyThreads = useMemo(() => {
    return studyGroups
      .map((group) => {
        const messages = groupMessages.filter(
          (message) => message.group_id === group.id
        );
        const latest = messages[messages.length - 1];

        return {
          id: `study-${group.id}`,
          type: 'study',
          title: group.name || group.subject || 'Study Group',
          subtitle: 'Study Group',
          group,
          messages,
          latestAt: latest?.created_at || group.created_at,
          preview: latest?.content || 'No messages yet',
        };
      })
      .filter((thread) => thread.messages.length > 0);
  }, [studyGroups, groupMessages]);

  const privateThreads = useMemo(() => {
    return privateGroups
      .map((group) => {
        const messages = privateGroupMessages.filter(
          (message) => message.group_id === group.id
        );
        const latest = messages[messages.length - 1];

        return {
          id: `private-${group.id}`,
          type: 'private',
          title: group.name || 'Private Group',
          subtitle: 'Private Group',
          group,
          messages,
          latestAt: latest?.created_at || group.created_at,
          preview: latest?.content || 'No messages yet',
        };
      })
      .filter((thread) => thread.messages.length > 0);
  }, [privateGroups, privateGroupMessages]);

  const moderationThreads = useMemo(() => {
    let rows = [...dmThreads, ...studyThreads, ...privateThreads];

    if (messageFilter !== 'all') {
      rows = rows.filter((thread) => thread.type === messageFilter);
    }

    const query = messageSearch.trim().toLowerCase();

    if (query) {
      rows = rows.filter((thread) => {
        const searchable = [
          thread.title,
          thread.subtitle,
          thread.preview,
          ...(thread.messages || []).map(
            (m) =>
              `${m.content || m.message || ''} ${profileName(
                m.sender_id || m.user_id,
                m.sender_name || ''
              )}`
          ),
        ]
          .join(' ')
          .toLowerCase();

        return searchable.includes(query);
      });
    }

    return rows.sort(
      (a, b) =>
        new Date(b.latestAt || 0).getTime() -
        new Date(a.latestAt || 0).getTime()
    );
  }, [
    dmThreads,
    studyThreads,
    privateThreads,
    messageFilter,
    messageSearch,
    profiles,
  ]);

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={centerPage}>
        <RefreshCw size={22} />
        Loading Admin Reviews...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={centerPage}>
        <div style={accessCard}>
          <div style={largeIcon}>
            <ShieldCheck size={34} />
          </div>
          <h2 style={{ margin: '0 0 8px', color: TEXT, fontSize: 28 }}>
            Admin Access Only
          </h2>
          <p style={{ margin: 0, color: MUTED, fontWeight: 700 }}>
            You do not have permission to access Campora Admin Reviews.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: 1250, margin: '0 auto' }}>
      <div style={headerRow}>
        <div>
          <div style={adminBadge}>
            <ShieldCheck size={15} />
            CAMPORA ADMIN
          </div>

          <h1 style={pageTitle}>Admin Reviews</h1>

          <p style={pageSubtitle}>
            Review community submissions, mentor applications, and platform
            conversations from one place.
          </p>
        </div>

        <button onClick={() => loadTab()} style={refreshButton}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div style={tabBar}>
        <AdminTab
          active={activeTab === 'study'}
          icon={<Users size={17} />}
          label="Study Circle Reviews"
          count={pendingGroups.length}
          onClick={() => changeTab('study')}
        />

        <AdminTab
          active={activeTab === 'mentors'}
          icon={<GraduationCap size={17} />}
          label="Mentor Applications"
          count={
            mentorApplications.filter(
              (item) => item.approval_status === 'pending'
            ).length
          }
          onClick={() => changeTab('mentors')}
        />

        <AdminTab
          active={activeTab === 'messages'}
          icon={<MessagesSquare size={17} />}
          label="Message Moderation"
          onClick={() => changeTab('messages')}
        />
      </div>

      {sectionLoading ? (
        <div style={sectionLoader}>
          <RefreshCw size={20} />
          Loading...
        </div>
      ) : (
        <>
          {activeTab === 'study' && (
            <StudyReviewSection
              pendingGroups={pendingGroups}
              actionLoading={actionLoading}
              approveGroup={approveGroup}
              declineGroup={declineGroup}
            />
          )}

          {activeTab === 'mentors' && (
            <MentorSection
              applications={mentorApplications}
              profiles={profiles}
              actionLoading={actionLoading}
              onReview={reviewMentor}
            />
          )}

          {activeTab === 'messages' && (
            <MessageModerationSection
              threads={moderationThreads}
              selectedConversation={selectedConversation}
              setSelectedConversation={setSelectedConversation}
              filter={messageFilter}
              setFilter={setMessageFilter}
              search={messageSearch}
              setSearch={setMessageSearch}
              profileName={profileName}
              formatDate={formatDate}
            />
          )}
        </>
      )}
    </div>
  );
}

function AdminTab({ active, icon, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`filter-chip ${active ? 'active' : ''}`}
      style={
        active
          ? {
              background: '#0B1A3F',
              color: '#FFFFFF',
              borderColor: '#0B1A3F',
              boxShadow: '0 5px 16px rgba(11,26,63,.18)',
              transform: 'translateY(-1px)',
            }
          : {
              background: '#EEF3FB',
              color: '#0B1A3F',
              borderColor: '#D8E2FF',
              boxShadow: 'none',
            }
      }
    >
      {icon}
      {label}

      {typeof count === 'number' && count > 0 && (
        <span
          style={{
            minWidth: '22px',
            height: '22px',
            padding: '0 6px',
            borderRadius: '999px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: active
              ? 'rgba(255,255,255,.18)'
              : '#FFFFFF',
            color: active ? '#FFFFFF' : '#0B1A3F',
            border: active
              ? '1px solid rgba(255,255,255,.14)'
              : '1px solid #D8E2FF',
            fontSize: '10px',
            fontWeight: '900',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function StudyReviewSection({
  pendingGroups,
  actionLoading,
  approveGroup,
  declineGroup,
}) {
  return (
    <>
      <SectionIntro
        icon={<Clock3 size={21} />}
        title={`${pendingGroups.length} request${
          pendingGroups.length === 1 ? '' : 's'
        } waiting for review`}
        description="Approved circles appear in Discover. Declined circles remain hidden."
      />

      {!pendingGroups.length ? (
        <EmptyState
          icon={<Check size={32} />}
          title="All caught up"
          text="There are no study circles waiting for review."
        />
      ) : (
        <div style={cardGrid}>
          {pendingGroups.map((group) => (
            <div key={group.id} style={reviewCard}>
              <div style={cardTop}>
                <div>
                  <StatusBadge status="pending" />
                  <h2 style={cardTitle}>{group.name}</h2>
                  {group.subject && <p style={cardSubtitle}>{group.subject}</p>}
                </div>

                <div
                  style={{
                    ...smallIcon,
                    background: group.color || '#EEF2FF',
                  }}
                >
                  <Users size={22} />
                </div>
              </div>

              <div style={infoGrid}>
                <InfoItem
                  icon={<Target size={16} />}
                  label="Goal"
                  value={group.goal || 'Not specified'}
                />
                <InfoItem
                  icon={<Volume2 size={16} />}
                  label="Environment"
                  value={group.environment || 'Not specified'}
                />
                <InfoItem
                  icon={<Users size={16} />}
                  label="Major"
                  value={group.major || 'All Majors'}
                />
                <InfoItem
                  icon={<MapPin size={16} />}
                  label="Mode"
                  value={group.mode || 'Not specified'}
                />
              </div>

              {group.description && (
                <div style={descriptionBox}>
                  <div style={miniLabel}>DESCRIPTION</div>
                  <p style={descriptionText}>{group.description}</p>
                </div>
              )}

              <div style={twoButtons}>
                <button
                  disabled={actionLoading === group.id}
                  onClick={() => declineGroup(group.id)}
                  style={denyButton}
                >
                  <X size={17} />
                  Decline
                </button>

                <button
                  disabled={actionLoading === group.id}
                  onClick={() => approveGroup(group.id)}
                  style={approveButton}
                >
                  <Check size={17} />
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function MentorSection({ applications, profiles, actionLoading, onReview }) {
  const pending = applications.filter(
    (item) => item.approval_status === 'pending'
  );
  const reviewed = applications.filter(
    (item) => item.approval_status !== 'pending'
  );

  return (
    <>
      <SectionIntro
        icon={<UserRoundCheck size={21} />}
        title={`${pending.length} mentor application${
          pending.length === 1 ? '' : 's'
        } waiting for review`}
        description="Only approved mentors become active and visible in the student Mentors directory."
      />

      {!applications.length ? (
        <EmptyState
          icon={<GraduationCap size={32} />}
          title="No mentor applications"
          text="Mentor applications will appear here when users apply."
        />
      ) : (
        <>
          {pending.length > 0 && (
            <div style={cardGrid}>
              {pending.map((mentor) => (
                <MentorCard
                  key={mentor.id}
                  mentor={mentor}
                  profile={profiles[mentor.user_id]}
                  actionLoading={actionLoading}
                  onReview={onReview}
                />
              ))}
            </div>
          )}

          {reviewed.length > 0 && (
            <div style={{ marginTop: pending.length ? 36 : 0 }}>
              <h3
                style={{
                  color: TEXT,
                  margin: '0 0 16px',
                  fontSize: 22,
                  fontWeight: 900,
                }}
              >
                Reviewed Applications
              </h3>
              <div style={cardGrid}>
                {reviewed.map((mentor) => (
                  <MentorCard
                    key={mentor.id}
                    mentor={mentor}
                    profile={profiles[mentor.user_id]}
                    actionLoading={actionLoading}
                    onReview={onReview}
                    reviewed
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

function MentorCard({
  mentor,
  profile,
  actionLoading,
  onReview,
  reviewed = false,
}) {
  const name =
    profile?.name ||
    profile?.full_name ||
    profile?.display_name ||
    profile?.email?.split('@')[0] ||
    'Mentor Applicant';

  const specialties = Array.isArray(mentor.specialties)
    ? mentor.specialties.join(' • ')
    : mentor.specialties || '';

  const courses = Array.isArray(mentor.courses)
    ? mentor.courses.join(' • ')
    : mentor.courses || '';

  return (
    <div style={reviewCard}>
      <div style={cardTop}>
        <div>
          <StatusBadge status={mentor.approval_status || 'pending'} />
          <h2 style={cardTitle}>{name}</h2>
          <p style={cardSubtitle}>
            {mentor.title || mentor.mentor_type || 'Mentor'}
          </p>
        </div>

        <div style={{ ...smallIcon, background: '#E8F0FA', color: NAVY }}>
          <GraduationCap size={22} />
        </div>
      </div>

      <div style={infoGrid}>
        <InfoItem
          label="Department"
          value={mentor.department || 'Not specified'}
        />
        <InfoItem
          label="Mentor Type"
          value={mentor.mentor_type || 'Mentor'}
        />
        <InfoItem label="Office" value={mentor.office || 'Not specified'} />
        <InfoItem
          label="Availability"
          value={mentor.availability || 'Not specified'}
        />
      </div>

      {specialties && (
        <DetailBlock label="SPECIALTIES" value={specialties} />
      )}

      {courses && <DetailBlock label="COURSES" value={courses} />}

      {mentor.bio && <DetailBlock label="BIO" value={mentor.bio} />}

      {!reviewed && (
        <div style={twoButtons}>
          <button
            disabled={actionLoading === `mentor-${mentor.id}`}
            onClick={() => onReview(mentor.id, 'denied')}
            style={denyButton}
          >
            <X size={17} />
            Deny
          </button>

          <button
            disabled={actionLoading === `mentor-${mentor.id}`}
            onClick={() => onReview(mentor.id, 'approved')}
            style={approveButton}
          >
            <Check size={17} />
            Approve Mentor
          </button>
        </div>
      )}
    </div>
  );
}

function MessageModerationSection({
  threads,
  selectedConversation,
  setSelectedConversation,
  filter,
  setFilter,
  search,
  setSearch,
  profileName,
  formatDate,
}) {
  if (selectedConversation) {
    return (
      <ConversationViewer
        thread={selectedConversation}
        onBack={() => setSelectedConversation(null)}
        profileName={profileName}
        formatDate={formatDate}
      />
    );
  }

  return (
    <>
      <SectionIntro
        icon={<MessagesSquare size={21} />}
        title="Message Moderation"
        description="Read-only access to Campora conversations for safety and moderation."
      />

      <div style={moderationToolbar}>
        <div style={searchBox}>
          <Search size={17} color={MUTED} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search user, group, or message..."
            style={searchInput}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            ['all', 'All'],
            ['dm', 'Direct Messages'],
            ['study', 'Study Groups'],
            ['private', 'Private Groups'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              style={{
                ...filterButton,
                ...(filter === key
                  ? { background: NAVY, color: '#FFFFFF', borderColor: NAVY }
                  : {}),
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!threads.length ? (
        <EmptyState
          icon={<MessagesSquare size={32} />}
          title="No conversations found"
          text="There are no conversations matching this filter."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => setSelectedConversation(thread)}
              style={conversationRow}
            >
              <div style={conversationAvatar}>
                {thread.type === 'dm' ? (
                  <Users size={21} />
                ) : (
                  <MessagesSquare size={21} />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={conversationTitleRow}>
                  <strong style={conversationTitle}>{thread.title}</strong>
                  <span style={conversationType}>{thread.subtitle}</span>
                </div>

                <div style={conversationPreview}>{thread.preview}</div>
              </div>

              <div style={conversationDate}>{formatDate(thread.latestAt)}</div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function ConversationViewer({ thread, onBack, profileName, formatDate }) {
  return (
    <div>
      <button type="button" onClick={onBack} style={backButton}>
        <ChevronLeft size={17} />
        Back to conversations
      </button>

      <div style={conversationHeader}>
        <div>
          <div style={miniLabel}>READ-ONLY MODERATION VIEW</div>
          <h2 style={{ margin: '5px 0 4px', color: TEXT, fontSize: 27 }}>
            {thread.title}
          </h2>
          <p style={{ margin: 0, color: MUTED, fontWeight: 700 }}>
            {thread.subtitle} · {thread.messages.length} message
            {thread.messages.length === 1 ? '' : 's'}
          </p>
        </div>

        <ShieldCheck size={28} color={NAVY} />
      </div>

      <div style={messageViewer}>
        {thread.messages.map((message) => {
          const senderId = message.sender_id || message.user_id;
          const sender = profileName(
            senderId,
            message.sender_name || 'Student'
          );
          const body = message.content || message.message || '';

          return (
            <div key={message.id} style={moderationMessage}>
              <div style={messageMeta}>
                <strong style={{ color: NAVY }}>{sender}</strong>
                <span>{formatDate(message.created_at)}</span>
              </div>
              <div style={messageBody}>{body || '(Empty message)'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionIntro({ icon, title, description }) {
  return (
    <div style={sectionIntro}>
      <div style={sectionIcon}>{icon}</div>
      <div>
        <p style={{ margin: 0, color: TEXT, fontWeight: 900, fontSize: 17 }}>
          {title}
        </p>
        <p
          style={{
            margin: '5px 0 0',
            color: MUTED,
            fontWeight: 700,
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <div style={emptyState}>
      <div style={{ ...largeIcon, margin: '0 auto 18px' }}>{icon}</div>
      <h2 style={{ margin: '0 0 8px', color: TEXT, fontSize: 25 }}>{title}</h2>
      <p style={{ margin: 0, color: MUTED, fontWeight: 700 }}>{text}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: {
      background: '#FFF7E6',
      border: '1px solid #F6D48B',
      color: '#B7791F',
      label: 'Pending Review',
    },
    approved: {
      background: '#ECFBF6',
      border: '1px solid #BDEBDA',
      color: '#008E68',
      label: 'Approved',
    },
    denied: {
      background: '#FFF1F1',
      border: '1px solid #FFD0D0',
      color: '#D84C4C',
      label: 'Denied',
    },
  };

  const item = styles[status] || styles.pending;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 10px',
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 900,
        textTransform: 'uppercase',
        background: item.background,
        border: item.border,
        color: item.color,
      }}
    >
      <Clock3 size={12} />
      {item.label}
    </span>
  );
}

function DetailBlock({ label, value }) {
  return (
    <div style={descriptionBox}>
      <div style={miniLabel}>{label}</div>
      <p style={descriptionText}>{value}</p>
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div style={infoItem}>
      <div style={infoLabel}>
        {icon}
        {label}
      </div>
      <div style={infoValue}>{value}</div>
    </div>
  );
}

const centerPage = {
  minHeight: '65vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  color: MUTED,
  fontWeight: 800,
};

const accessCard = {
  maxWidth: 520,
  width: '100%',
  textAlign: 'center',
  background: '#FFFFFF',
  border: '1.5px solid #E3E7EE',
  borderRadius: 28,
  padding: '48px 36px',
  boxShadow: '0 18px 50px rgba(0,45,98,.07)',
};

const largeIcon = {
  width: 70,
  height: 70,
  borderRadius: 22,
  background: '#D8E0EB',
  color: NAVY,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const headerRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 20,
  marginBottom: 24,
  flexWrap: 'wrap',
};

const adminBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: '#D8E0EB',
  color: NAVY,
  padding: '8px 13px',
  borderRadius: 999,
  fontWeight: 900,
  fontSize: 12,
  marginBottom: 12,
};

const pageTitle = {
  color: TEXT,
  fontSize: 42,
  fontWeight: 900,
  margin: 0,
};

const pageSubtitle = {
  margin: '8px 0 0',
  color: MUTED,
  fontWeight: 700,
  fontSize: 15,
};

const refreshButton = {
  border: '1.5px solid #E3E2E7',
  background: '#FFFFFF',
  color: TEXT,
  borderRadius: 14,
  padding: '11px 16px',
  fontWeight: 900,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const tabBar = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 9,
  marginBottom: 26,
  paddingBottom: 18,
  borderBottom: '1px solid #E6EBF2',
};

const sectionLoader = {
  minHeight: 320,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 9,
  color: MUTED,
  fontWeight: 800,
};

const sectionIntro = {
  background: 'linear-gradient(135deg, #F4F7FC 0%, #F7FBFF 100%)',
  border: '1.5px solid #DDE7F5',
  borderRadius: 20,
  padding: '18px 20px',
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  marginBottom: 28,
};

const sectionIcon = {
  width: 46,
  height: 46,
  borderRadius: 14,
  background: '#D8E0EB',
  color: NAVY,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const emptyState = {
  minHeight: 340,
  background: '#FFFFFF',
  border: '1.5px solid #E3E7EE',
  borderRadius: 28,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: 40,
};

const cardGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(430px, 1fr))',
  gap: 24,
};

const reviewCard = {
  background: '#FFFFFF',
  border: '1.5px solid #E3E7EE',
  borderRadius: 26,
  padding: 26,
  boxShadow: '0 16px 40px rgba(0,45,98,.06)',
};

const cardTop = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 15,
  alignItems: 'flex-start',
  marginBottom: 20,
};

const cardTitle = {
  color: TEXT,
  fontSize: 26,
  fontWeight: 900,
  margin: '14px 0 4px',
};

const cardSubtitle = {
  margin: 0,
  color: MUTED,
  fontSize: 15,
  fontWeight: 800,
  lineHeight: 1.45,
};

const smallIcon = {
  width: 48,
  height: 48,
  borderRadius: 15,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: TEXT,
  flexShrink: 0,
};

const infoGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
  marginBottom: 18,
};

const infoItem = {
  background: '#F5F7FA',
  border: '1px solid #EDF1F7',
  borderRadius: 14,
  padding: '15px 14px',
};

const infoLabel = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  color: MUTED,
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  marginBottom: 6,
};

const infoValue = {
  color: TEXT,
  fontSize: 15,
  fontWeight: 800,
  lineHeight: 1.45,
  wordBreak: 'break-word',
};

const descriptionBox = {
  background: '#F5F7FA',
  borderRadius: 14,
  padding: 16,
  marginBottom: 14,
};

const miniLabel = {
  margin: '0 0 4px',
  color: MUTED,
  fontSize: 10,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '.4px',
};

const descriptionText = {
  margin: 0,
  color: '#42506D',
  fontSize: 13,
  lineHeight: 1.55,
  fontWeight: 700,
};

const twoButtons = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
  marginTop: 20,
};

const denyButton = {
  border: '1.5px solid #FFD0D0',
  background: '#FFF1F1',
  color: '#D84C4C',
  padding: 13,
  borderRadius: 14,
  fontWeight: 900,
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
};

const approveButton = {
  border: 'none',
  background: NAVY,
  color: '#FFFFFF',
  padding: 13,
  borderRadius: 14,
  fontWeight: 900,
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
};

const moderationToolbar = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 14,
  flexWrap: 'wrap',
  marginBottom: 18,
};

const searchBox = {
  minWidth: 280,
  flex: 1,
  maxWidth: 520,
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  background: '#FFFFFF',
  border: '1.5px solid #E2E7EF',
  borderRadius: 14,
  padding: '0 13px',
};

const searchInput = {
  width: '100%',
  height: 44,
  border: 0,
  outline: 0,
  background: 'transparent',
  color: TEXT,
  fontWeight: 700,
};

const filterButton = {
  border: '1px solid #E2E7EF',
  background: '#FFFFFF',
  color: '#42506D',
  borderRadius: 999,
  padding: '9px 12px',
  fontWeight: 900,
  cursor: 'pointer',
  fontSize: 12,
};

const conversationRow = {
  width: '100%',
  border: '1.5px solid #E5EAF1',
  background: '#FFFFFF',
  borderRadius: 18,
  padding: '15px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: 13,
  cursor: 'pointer',
  boxShadow: '0 8px 24px rgba(0,45,98,.035)',
};

const conversationAvatar = {
  width: 46,
  height: 46,
  borderRadius: 15,
  background: '#E8F0FA',
  color: NAVY,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const conversationTitleRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
};

const conversationTitle = {
  color: TEXT,
  fontSize: 14,
};

const conversationType = {
  background: '#EDF3FA',
  color: NAVY,
  borderRadius: 999,
  padding: '4px 8px',
  fontSize: 10,
  fontWeight: 900,
};

const conversationPreview = {
  color: MUTED,
  fontSize: 12,
  fontWeight: 700,
  marginTop: 5,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const conversationDate = {
  color: '#8A91A0',
  fontSize: 11,
  fontWeight: 800,
  flexShrink: 0,
};

const backButton = {
  border: 0,
  background: '#E8F0FA',
  color: NAVY,
  borderRadius: 12,
  padding: '9px 12px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontWeight: 900,
  cursor: 'pointer',
  marginBottom: 16,
};

const conversationHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 20,
  background: '#FFFFFF',
  border: '1.5px solid #E3E7EE',
  borderRadius: 22,
  padding: '20px 22px',
  marginBottom: 14,
};

const messageViewer = {
  background: '#F6F8FB',
  border: '1.5px solid #E3E7EE',
  borderRadius: 22,
  padding: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  maxHeight: '62vh',
  overflowY: 'auto',
};

const moderationMessage = {
  background: '#FFFFFF',
  border: '1px solid #E4E9F0',
  borderRadius: 15,
  padding: '12px 14px',
};

const messageMeta = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  color: '#8A91A0',
  fontSize: 10,
  fontWeight: 800,
  marginBottom: 6,
};

const messageBody = {
  color: '#344054',
  fontSize: 13,
  lineHeight: 1.55,
  fontWeight: 650,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};