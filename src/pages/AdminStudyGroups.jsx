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
  Search,
  UserRoundCheck,
  UserRoundX,
  RotateCcw,
  Ban,
  ChevronLeft,
  Flag,
  MessageSquareText,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const ADMIN_NAVY = '#0B1A3F';
const ADMIN_NAVY_SOFT = '#F1F4F8';
const ADMIN_NAVY_BORDER = '#D8E0EB';

const NAVY = '#0B1A3F';
const MUTED = '#717786';
const TEXT = '#1A1B1F';

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

export default function AdminStudyGroups() {
  const [activeTab, setActiveTab] = useState('study');

  const [pendingGroups, setPendingGroups] = useState([]);
  const [mentorApplications, setMentorApplications] = useState([]);
  const [pendingPulsePosts, setPendingPulsePosts] = useState([]);

  const [reports, setReports] = useState([]);

  const [profiles, setProfiles] = useState({});
  const [selectedReport, setSelectedReport] = useState(null);

  const [reportFilter, setReportFilter] = useState('all');
  const [messageSearch, setMessageSearch] = useState('');

  const [userList, setUserList] = useState([]);
  const [adminIds, setAdminIds] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');

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

  const fetchPendingPulsePosts = async () => {
    const { data, error } = await supabase
      .from('campus_pulse_posts')
      .select('*')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Campus Pulse reviews error:', error);
      throw error;
    }

    const rows = data || [];
    setPendingPulsePosts(rows);
    await mergeProfilesByIds(rows.map((post) => post.user_id));
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

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('message_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Message reports loading error:', error);
      throw error;
    }

    const rows = data || [];
    setReports(rows);

    const userIds = rows.flatMap((report) => [
      report.reporter_id,
      report.sender_id,
      report.receiver_id,
      report.reviewed_by,
    ]);

    await mergeProfilesByIds(userIds);
  };

  const fetchUsers = async () => {
    const [profilesResult, adminsResult] = await Promise.all([
      supabase
        .from('profiles')
        .select(
          'id, name, role, account_type, avatar_url, is_deactivated, deactivated_at, created_at'
        )
        .order('created_at', { ascending: false }),
      supabase.from('campora_admins').select('user_id'),
    ]);

    if (profilesResult.error) {
      console.error('Users loading error:', profilesResult.error);
      throw profilesResult.error;
    }

    setUserList(profilesResult.data || []);
    setAdminIds((adminsResult.data || []).map((row) => row.user_id));
  };

  const loadTab = async (tab = activeTab) => {
    setSectionLoading(true);
    try {
      if (tab === 'study') await fetchPendingGroups();
      if (tab === 'pulse') await fetchPendingPulsePosts();
      if (tab === 'mentors') await fetchMentorApplications();
      if (tab === 'messages') await fetchReports();
      if (tab === 'users') await fetchUsers();
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
    setSelectedReport(null);
    setMessageSearch('');
    setReportFilter('all');
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

  const reviewPulsePost = async (postId, status) => {
    if (status === 'rejected' && !window.confirm('Reject this Campus Pulse post? It will remain hidden from the public feed.')) return;

    setActionLoading(`pulse-${postId}`);
    try {
      const { data, error } = await supabase
        .from('campus_pulse_posts')
        .update({
          approval_status: status,
          reviewed_by: adminUserId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .select('id, approval_status, reviewed_by, reviewed_at')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('This moderation action was blocked by database permissions.');
      setPendingPulsePosts((current) => current.filter((post) => post.id !== postId));
    } catch (error) {
      alert(`Could not ${status === 'approved' ? 'approve' : 'reject'} this post: ${error.message}`);
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

    const reportTypeLabel = (type) => {
    const labels = {
      dm: 'Direct Message',
      group: 'Study Group',
      'custom-group': 'Private Group',
    };
    return labels[type] || 'Message';
  };

  const cleanReportedText = (raw) =>
    String(raw || '')
      .replace(/^\[\[CAMPORA_ATTACHMENT:[^\]]*\]\]/, '')
      .replace(/^\[\[CAMPORA_SOURCE:[^\]]*\]\]/, '')
      .replace(/^\[\[CAMPORA_DM:[^\]]*\]\]/, '')
      .trim();

  const reportItems = useMemo(() => {
    let rows = [...reports];

    if (reportFilter !== 'all') {
      rows = rows.filter((report) => report.status === reportFilter);
    }

    const query = messageSearch.trim().toLowerCase();

    if (query) {
      rows = rows.filter((report) => {
        const searchable = [
          report.content || '',
          report.reason || '',
          report.note || '',
          profileName(report.sender_id, ''),
          profileName(report.reporter_id, ''),
          reportTypeLabel(report.message_type),
        ]
          .join(' ')
          .toLowerCase();

        return searchable.includes(query);
      });
    }

    return rows.sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    );
  }, [reports, reportFilter, messageSearch, profiles]);

  const resolveReport = async (reportId, reviewed) => {
    setActionLoading(`report-${reportId}`);

    try {
      const { error } = await supabase
        .from('message_reports')
        .update({
          status: reviewed ? 'reviewed' : 'pending',
          reviewed_by: reviewed ? adminUserId : null,
          reviewed_at: reviewed ? new Date().toISOString() : null,
        })
        .eq('id', reportId);

      if (error) throw error;

      const updated = {
        status: reviewed ? 'reviewed' : 'pending',
        reviewed_by: reviewed ? adminUserId : null,
        reviewed_at: reviewed ? new Date().toISOString() : null,
      };

      setReports((current) =>
        current.map((report) =>
          report.id === reportId ? { ...report, ...updated } : report
        )
      );

      setSelectedReport((current) =>
        current && current.id === reportId
          ? { ...current, ...updated }
          : current
      );
    } catch (error) {
      alert(
        `Could not ${reviewed ? 'resolve' : 'reopen'} this report: ${
          error.message
        }`
      );
    } finally {
      setActionLoading(null);
    }
  };

  const toggleUserDeactivation = async (user) => {
    const deactivating = !user.is_deactivated;

    if (
      deactivating &&
      !window.confirm(
        `Deactivate ${user.name || 'this user'}? They will be signed out and blocked from logging in until reactivated.`
      )
    ) {
      return;
    }

    setActionLoading(`user-${user.id}`);

    try {
      const updates = {
        is_deactivated: deactivating,
        deactivated_at: deactivating ? new Date().toISOString() : null,
        deactivated_by: deactivating ? adminUserId : null,
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select(
          'id, name, role, account_type, avatar_url, is_deactivated, deactivated_at, created_at'
        )
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('Blocked by database permissions.');
      }

      setUserList((current) =>
        current.map((item) => (item.id === user.id ? { ...item, ...data } : item))
      );
    } catch (error) {
      const needsSql =
        /does not exist|permission denied|policy|row-level security/i.test(
          error?.message || ''
        );

      alert(
        `Could not update this account: ${error.message}.${
          needsSql
            ? ' Run the latest supabase-deactivate-users.sql in the Supabase SQL editor, then try again.'
            : ''
        }`
      );
    } finally {
      setActionLoading(null);
    }
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
            Review community submissions, mentor applications, and reported
            messages from one place.
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
          active={activeTab === 'pulse'}
          icon={<MessageSquareText size={17} />}
          label="Campus Pulse Reviews"
          count={pendingPulsePosts.length}
          onClick={() => changeTab('pulse')}
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
          icon={<Flag size={17} />}
          label="Reported Messages"
          count={
            reports.filter((report) => report.status === 'pending').length
          }
          onClick={() => changeTab('messages')}
        />

        <AdminTab
          active={activeTab === 'users'}
          icon={<Ban size={17} />}
          label="User Accounts"
          count={
            userList.filter((user) => user.is_deactivated).length
          }
          onClick={() => changeTab('users')}
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

          {activeTab === 'pulse' && (
            <CampusPulseReviewSection
              posts={pendingPulsePosts}
              profiles={profiles}
              actionLoading={actionLoading}
              onReview={reviewPulsePost}
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
            <ReportsSection
              reports={reportItems}
              selectedReport={selectedReport}
              setSelectedReport={setSelectedReport}
              filter={reportFilter}
              setFilter={setReportFilter}
              search={messageSearch}
              setSearch={setMessageSearch}
              profileName={profileName}
              reportTypeLabel={reportTypeLabel}
              cleanReportedText={cleanReportedText}
              formatDate={formatDate}
              actionLoading={actionLoading}
              onResolve={resolveReport}
            />
          )}

          {activeTab === 'users' && (
            <UsersSection
              users={userList}
              adminIds={adminIds}
              currentUserId={adminUserId}
              search={userSearch}
              setSearch={setUserSearch}
              statusFilter={userStatusFilter}
              setStatusFilter={setUserStatusFilter}
              actionLoading={actionLoading}
              onToggle={toggleUserDeactivation}
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
      style={{
        appearance: 'none',
        WebkitAppearance: 'none',
        border: active
          ? '1.5px solid #0B1A3F'
          : '1.5px solid #D8E0EB',
        borderRadius: '999px',
        padding: '11px 18px',
        minHeight: '46px',
        background: active ? '#0B1A3F' : '#F1F4F8',
        color: active ? '#FFFFFF' : '#0B1A3F',
        boxShadow: active
          ? '0 8px 20px rgba(11,26,63,.16)'
          : '0 3px 10px rgba(11,26,63,.04)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: '900',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        outline: 'none',
        transition:
          'transform .16s ease, box-shadow .16s ease, background .16s ease',
        transform: active ? 'translateY(-1px)' : 'none',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>

      <span>{label}</span>

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
              ? 'rgba(255,255,255,.16)'
              : '#FFFFFF',
            color: active ? '#FFFFFF' : '#0B1A3F',
            border: active
              ? '1px solid rgba(255,255,255,.18)'
              : '1px solid #D8E0EB',
            fontSize: '10px',
            fontWeight: '900',
            lineHeight: 1,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function UsersSection({
  users,
  adminIds,
  currentUserId,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  actionLoading,
  onToggle,
}) {
  const filtered = useMemo(() => {
    let rows = [...users];

    if (statusFilter === 'active') {
      rows = rows.filter((user) => !user.is_deactivated);
    } else if (statusFilter === 'deactivated') {
      rows = rows.filter((user) => user.is_deactivated);
    }

    const query = search.trim().toLowerCase();

    if (query) {
      rows = rows.filter((user) =>
        [user.name || '', user.role || '', user.account_type || '']
          .join(' ')
          .toLowerCase()
          .includes(query)
      );
    }

    return rows;
  }, [users, statusFilter, search]);

  const deactivatedCount = users.filter((user) => user.is_deactivated).length;

  return (
    <>
      <SectionIntro
        icon={<Ban size={21} />}
        title={`${users.length} account${users.length === 1 ? '' : 's'} registered`}
        description={
          deactivatedCount
            ? `${deactivatedCount} deactivated. Deactivated users cannot log in or write data until reactivated.`
            : 'Deactivate an account to block its access. Admin accounts and your own account are protected.'
        }
      />

      <div style={moderationToolbar}>
        <div style={searchBox}>
          <Search size={17} color="#717786" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, role, or account type..."
            style={searchInput}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'deactivated', label: 'Deactivated' },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setStatusFilter(option.key)}
              style={{
                ...filterButton,
                ...(statusFilter === option.key
                  ? {
                      background: '#0B1A3F',
                      color: '#FFFFFF',
                      borderColor: '#0B1A3F',
                    }
                  : {}),
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {!filtered.length ? (
        <EmptyState
          icon={<Users size={32} />}
          title="No accounts found"
          text="Try a different search or status filter."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isAdminAccount={adminIds.includes(user.id)}
              isSelf={user.id === currentUserId}
              actionLoading={actionLoading}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </>
  );
}

function UserRow({ user, isAdminAccount, isSelf, actionLoading, onToggle }) {
  const busy = actionLoading === `user-${user.id}`;
  const deactivated = !!user.is_deactivated;
  const protectedAccount = isSelf || isAdminAccount;

  return (
    <div
      style={{
        ...userRow,
        ...(deactivated ? userRowDeactivated : {}),
      }}
    >
      <div style={conversationAvatar}>
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 15 }}
          />
        ) : (
          (user.name || '?').charAt(0).toUpperCase()
        )}
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={conversationTitleRow}>
          <span style={userName}>{user.name || 'Unnamed student'}</span>

          {isAdminAccount && (
            <span style={{ ...accountChip, background: '#E8F0FA', color: NAVY }}>
              <ShieldCheck size={11} />
              ADMIN
            </span>
          )}

          <span style={accountChip}>{user.account_type || user.role || 'Student'}</span>

          <span
            style={{
              ...accountChip,
              background: deactivated ? '#FDECEC' : '#E7F6EC',
              color: deactivated ? '#C0392B' : '#1E8449',
            }}
          >
            {deactivated ? 'DEACTIVATED' : 'ACTIVE'}
          </span>
        </div>

        <p style={userMeta}>
          Joined {formatDate(user.created_at) || 'unknown date'}
          {deactivated && user.deactivated_at
            ? ` · Deactivated ${formatDate(user.deactivated_at)}`
            : ''}
        </p>
      </div>

      {protectedAccount ? (
        <span style={protectedNote}>
          {isSelf ? 'This is you' : 'Admin account'}
        </span>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => onToggle(user)}
          style={deactivated ? reactivateButton : deactivateButton}
        >
          {deactivated ? <RotateCcw size={15} /> : <UserRoundX size={15} />}
          {busy ? 'Saving...' : deactivated ? 'Reactivate' : 'Deactivate'}
        </button>
      )}
    </div>
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

function CampusPulseReviewSection({ posts, profiles, actionLoading, onReview }) {
  return (
    <>
      <SectionIntro
        icon={<MessageSquareText size={21} />}
        title={`${posts.length} Campus Pulse post${posts.length === 1 ? '' : 's'} waiting for review`}
        description="Approve posts to publish them on Campus Pulse. Rejected posts remain hidden from the public feed."
      />

      {!posts.length ? (
        <EmptyState
          icon={<Check size={32} />}
          title="All caught up"
          text="There are no Campus Pulse posts waiting for review."
        />
      ) : (
        <div style={cardGrid}>
          {posts.map((post) => {
            const profile = profiles[post.user_id];
            const author = post.is_anonymous
              ? 'Anonymous Student'
              : post.author_name || profile?.name || 'Student';
            const busy = actionLoading === `pulse-${post.id}`;

            return (
              <div key={post.id} style={reviewCard}>
                <div style={cardTop}>
                  <div style={{ minWidth: 0 }}>
                    <StatusBadge status="pending" />
                    <h2 style={cardTitle}>{post.title || 'Untitled post'}</h2>
                    <p style={cardSubtitle}>
                      {author} · {post.category || 'Campus Pulse'} · {formatDate(post.created_at)}
                    </p>
                  </div>
                  <div style={{ ...smallIcon, background: '#E8F0FA', color: NAVY }}>
                    <MessageSquareText size={22} />
                  </div>
                </div>

                <DetailBlock label="POST CONTENT" value={post.content || '(No text)'} />

                {post.image_url && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={miniLabel}>ATTACHED IMAGE</div>
                    <img
                      src={post.image_url}
                      alt="Campus Pulse attachment"
                      style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 14, marginTop: 8 }}
                    />
                  </div>
                )}

                <div style={twoButtons}>
                  <button disabled={busy} onClick={() => onReview(post.id, 'rejected')} style={denyButton}>
                    <X size={17} />
                    {busy ? 'Saving...' : 'Reject'}
                  </button>
                  <button disabled={busy} onClick={() => onReview(post.id, 'approved')} style={approveButton}>
                    <Check size={17} />
                    {busy ? 'Saving...' : 'Approve Post'}
                  </button>
                </div>
              </div>
            );
          })}
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

function ReportsSection({
  reports,
  selectedReport,
  setSelectedReport,
  filter,
  setFilter,
  search,
  setSearch,
  profileName,
  reportTypeLabel,
  cleanReportedText,
  formatDate,
  actionLoading,
  onResolve,
}) {
  if (selectedReport) {
    return (
      <ReportDetail
        report={selectedReport}
        onBack={() => setSelectedReport(null)}
        profileName={profileName}
        reportTypeLabel={reportTypeLabel}
        cleanReportedText={cleanReportedText}
        formatDate={formatDate}
        actionLoading={actionLoading}
        onResolve={onResolve}
      />
    );
  }

  return (
    <>
      <SectionIntro
        icon={<Flag size={21} />}
        title="Reported Messages"
        description="Messages students have flagged for review. Only the reported message is shown — never the whole conversation."
      />

      <div style={moderationToolbar}>
        <div style={searchBox}>
          <Search size={17} color={MUTED} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search sender, reporter, reason, or message..."
            style={searchInput}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            ['all', 'All'],
            ['pending', 'Pending'],
            ['reviewed', 'Reviewed'],
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

      {!reports.length ? (
        <EmptyState
          icon={<Flag size={32} />}
          title="No reported messages"
          text="Messages students report will appear here. Conversation contents are never visible to admins otherwise."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reports.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => setSelectedReport(report)}
              style={reportRow}
            >
              <div style={conversationAvatar}>
                <Flag size={21} />
              </div>

              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={conversationTitleRow}>
                  <strong style={conversationTitle}>
                    {profileName(report.sender_id, 'Student')}
                  </strong>
                  <span style={conversationType}>
                    {reportTypeLabel(report.message_type)}
                  </span>
                  <span
                    style={{
                      ...conversationType,
                      background:
                        report.status === 'reviewed' ? '#ECFBF6' : '#FFF7E6',
                      color:
                        report.status === 'reviewed' ? '#008E68' : '#B7791F',
                    }}
                  >
                    {report.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                  </span>
                </div>

                <div style={conversationPreview}>
                  <strong style={{ color: '#0B1A3F' }}>
                    {report.reason || 'Reported'}
                  </strong>{' '}
                  — {cleanReportedText(report.content) || '(Empty message)'}
                </div>
              </div>

              <div style={conversationDate}>
                {formatDate(report.created_at)}
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function ReportDetail({
  report,
  onBack,
  profileName,
  reportTypeLabel,
  cleanReportedText,
  formatDate,
  actionLoading,
  onResolve,
}) {
  const isPending = report.status === 'pending';

  return (
    <div>
      <button type="button" onClick={onBack} style={backButton}>
        <ChevronLeft size={17} />
        Back to reported messages
      </button>

      <div style={conversationHeader}>
        <div>
          <div style={miniLabel}>REPORTED MESSAGE</div>
          <h2 style={{ margin: '5px 0 4px', color: TEXT, fontSize: 27 }}>
            {profileName(report.sender_id, 'Student')}
          </h2>
          <p style={{ margin: 0, color: MUTED, fontWeight: 700 }}>
            {reportTypeLabel(report.message_type)} · Reported{' '}
            {formatDate(report.created_at)}
          </p>
        </div>

        <Flag size={28} color={NAVY} />
      </div>

      <div style={reportMetaGrid}>
        <div style={infoItem}>
          <div style={infoLabel}>REASON</div>
          <div style={infoValue}>{report.reason || 'Not specified'}</div>
        </div>

        <div style={infoItem}>
          <div style={infoLabel}>REPORTED BY</div>
          <div style={infoValue}>{profileName(report.reporter_id, 'Student')}</div>
        </div>
      </div>

      {report.note && (
        <DetailBlock label="REPORTER NOTE" value={report.note} />
      )}

      <div style={{ marginBottom: 14 }}>
        <div style={miniLabel}>THE REPORTED MESSAGE</div>
      </div>

      <div style={messageViewer}>
        <div style={moderationMessage}>
          <div style={messageMeta}>
            <strong style={{ color: NAVY }}>
              {profileName(report.sender_id, 'Student')}
            </strong>
            <span>{formatDate(report.created_at)}</span>
          </div>
          <div style={messageBody}>
            {cleanReportedText(report.content) || '(Empty message)'}
          </div>
        </div>
      </div>

      {report.reviewed_at && (
        <DetailBlock
          label={`RESOLVED BY ${profileName(report.reviewed_by, 'An admin')}`}
          value={`${formatDate(report.reviewed_at)} — this message was reviewed and resolved.`}
        />
      )}

      <div style={twoButtons}>
        {isPending ? (
          <button
            disabled={actionLoading === `report-${report.id}`}
            onClick={() => onResolve(report.id, true)}
            style={approveButton}
          >
            <Check size={17} />
            Mark as reviewed
          </button>
        ) : (
          <button
            disabled={actionLoading === `report-${report.id}`}
            onClick={() => onResolve(report.id, false)}
            style={denyButton}
          >
            <RefreshCw size={17} />
            Reopen report
          </button>
        )}
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
  alignItems: 'center',
  gap: 12,
  marginBottom: 28,
  paddingBottom: 20,
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

const userRow = {
  border: '1.5px solid #E5EAF1',
  background: '#FFFFFF',
  borderRadius: 18,
  padding: '14px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: 13,
  boxShadow: '0 8px 24px rgba(0,45,98,.035)',
};

const userRowDeactivated = {
  background: '#FBF6F6',
  borderColor: '#F2DCDC',
};

const userName = {
  color: TEXT,
  fontSize: 15,
  fontWeight: 900,
};

const accountChip = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  background: '#EEF3FB',
  color: '#42506D',
  borderRadius: 999,
  padding: '4px 9px',
  fontSize: 10,
  fontWeight: 900,
};

const userMeta = {
  margin: '6px 0 0',
  color: MUTED,
  fontSize: 12,
  fontWeight: 700,
};

const protectedNote = {
  color: '#8A91A0',
  fontSize: 11,
  fontWeight: 900,
  flexShrink: 0,
};

const deactivateButton = {
  border: '1.5px solid #FFD0D0',
  background: '#FFF1F1',
  color: '#D84C4C',
  borderRadius: 12,
  padding: '10px 14px',
  fontWeight: 900,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  flexShrink: 0,
};

const reactivateButton = {
  border: 'none',
  background: NAVY,
  color: '#FFFFFF',
  borderRadius: 12,
  padding: '10px 14px',
  fontWeight: 900,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  flexShrink: 0,
};

const reportRow = {
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

const reportMetaGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
  marginBottom: 14,
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