import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminStudyGroups() {
  const [pendingGroups, setPendingGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdmin = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsAdmin(false);
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

    return admin;
  };

  const fetchPendingGroups = async () => {
    try {
      setLoading(true);

      const admin = await checkAdmin();

      if (!admin) {
        setPendingGroups([]);
        return;
      }

      const { data, error } = await supabase
        .from('study_groups')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Pending groups error:', error);
        return;
      }

      setPendingGroups(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingGroups();
  }, []);

  const approveGroup = async (groupId) => {
    setActionLoading(groupId);

    try {
      const { error } = await supabase
        .from('study_groups')
        .update({
          approval_status: 'approved',
        })
        .eq('id', groupId);

      if (error) {
        console.error(error);
        alert('Could not approve this study circle.');
        return;
      }

      setPendingGroups((current) =>
        current.filter((group) => group.id !== groupId)
      );
    } finally {
      setActionLoading(null);
    }
  };

  const declineGroup = async (groupId) => {
    const confirmed = window.confirm(
      'Decline this study circle? It will not appear in Discover.'
    );

    if (!confirmed) return;

    setActionLoading(groupId);

    try {
      const { error } = await supabase
        .from('study_groups')
        .update({
          approval_status: 'rejected',
        })
        .eq('id', groupId);

      if (error) {
        console.error(error);
        alert('Could not decline this study circle.');
        return;
      }

      setPendingGroups((current) =>
        current.filter((group) => group.id !== groupId)
      );
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#717786',
          fontWeight: '800',
        }}
      >
        Loading review requests...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            width: '100%',
            textAlign: 'center',
            background: '#FFFFFF',
            border: '1.5px solid #E8ECF4',
            borderRadius: '28px',
            padding: '48px 36px',
            boxShadow: '0 18px 50px rgba(0, 45, 98, 0.07)',
          }}
        >
          <div
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '22px',
              background: '#F1EFFF',
              color: '#6366F1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <ShieldCheck size={34} />
          </div>

          <h2
            style={{
              color: '#1A1B1F',
              fontSize: '28px',
              fontWeight: '900',
              marginBottom: '8px',
            }}
          >
            Admin Access Only
          </h2>

          <p
            style={{
              color: '#717786',
              fontWeight: '700',
              lineHeight: '1.6',
            }}
          >
            You do not have permission to review Campora study circles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1250px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '20px',
          marginBottom: '34px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#F1EFFF',
              color: '#6366F1',
              padding: '8px 13px',
              borderRadius: '999px',
              fontWeight: '900',
              fontSize: '12px',
              marginBottom: '12px',
            }}
          >
            <ShieldCheck size={15} />
            CAMPORA ADMIN
          </div>

          <h1
            style={{
              color: '#1A1B1F',
              fontSize: '42px',
              fontWeight: '900',
              margin: 0,
            }}
          >
            Study Circle Reviews
          </h1>

          <p
            style={{
              margin: '8px 0 0',
              color: '#717786',
              fontWeight: '700',
              fontSize: '15px',
            }}
          >
            Review submitted study circles before they become visible to the
            Campora community.
          </p>
        </div>

        <button
          onClick={fetchPendingGroups}
          style={{
            border: '1.5px solid #E3E2E7',
            background: '#FFFFFF',
            color: '#1A1B1F',
            borderRadius: '14px',
            padding: '11px 16px',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div
        style={{
          background:
            'linear-gradient(135deg, #F3F1FF 0%, #F7FBFF 100%)',
          border: '1.5px solid #E2E5FF',
          borderRadius: '20px',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '28px',
        }}
      >
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: '#E7E3FF',
            color: '#6366F1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Clock3 size={21} />
        </div>

        <div>
          <p
            style={{
              margin: 0,
              color: '#1A1B1F',
              fontWeight: '900',
              fontSize: '14px',
            }}
          >
            {pendingGroups.length} request
            {pendingGroups.length === 1 ? '' : 's'} waiting for review
          </p>

          <p
            style={{
              margin: '3px 0 0',
              color: '#8F9BB3',
              fontWeight: '700',
              fontSize: '13px',
            }}
          >
            Approved circles appear in Discover. Declined circles remain
            hidden.
          </p>
        </div>
      </div>

      {pendingGroups.length === 0 ? (
        <div
          style={{
            minHeight: '360px',
            background: '#FFFFFF',
            border: '1.5px solid #E8ECF4',
            borderRadius: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '40px',
          }}
        >
          <div>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '22px',
                background: '#ECFBF6',
                color: '#00B887',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
              }}
            >
              <Check size={32} />
            </div>

            <h2
              style={{
                margin: '0 0 8px',
                color: '#1A1B1F',
                fontSize: '25px',
                fontWeight: '900',
              }}
            >
              All caught up
            </h2>

            <p
              style={{
                margin: 0,
                color: '#717786',
                fontWeight: '700',
              }}
            >
              There are no study circles waiting for review.
            </p>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(430px, 1fr))',
            gap: '24px',
          }}
        >
          {pendingGroups.map((group) => (
            <div
              key={group.id}
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #E8ECF4',
                borderRadius: '26px',
                padding: '26px',
                boxShadow:
                  '0 16px 40px rgba(0, 45, 98, 0.06)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '15px',
                  alignItems: 'flex-start',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 10px',
                      borderRadius: '10px',
                      background: '#FFF7E6',
                      border: '1px solid #F6D48B',
                      color: '#B7791F',
                      fontSize: '11px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                    }}
                  >
                    <Clock3 size={12} />
                    Pending Review
                  </span>

                  <h2
                    style={{
                      color: '#1A1B1F',
                      fontSize: '26px',
                      fontWeight: '900',
                      margin: '14px 0 4px',
                    }}
                  >
                    {group.name}
                  </h2>

                  {group.subject && (
                    <p
                      style={{
                        margin: 0,
                        color: '#717786',
                        fontWeight: '800',
                      }}
                    >
                      {group.subject}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '15px',
                    background: group.color || '#EEF2FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1A1B1F',
                  }}
                >
                  <Users size={22} />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '18px',
                }}
              >
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
                <div
                  style={{
                    background: '#E9E7ED',
                    borderRadius: '14px',
                    padding: '14px',
                    marginBottom: '20px',
                  }}
                >
                  <p
                    style={{
                      margin: '0 0 4px',
                      color: '#717786',
                      fontSize: '10px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                    }}
                  >
                    Description
                  </p>

                  <p
                    style={{
                      margin: 0,
                      color: '#42506D',
                      fontSize: '13px',
                      lineHeight: '1.55',
                      fontWeight: '700',
                    }}
                  >
                    {group.description}
                  </p>
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}
              >
                <button
                  disabled={actionLoading === group.id}
                  onClick={() => declineGroup(group.id)}
                  style={{
                    border: '1.5px solid #FFD0D0',
                    background: '#FFF1F1',
                    color: '#D84C4C',
                    padding: '13px',
                    borderRadius: '14px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <X size={17} />
                  Decline
                </button>

                <button
                  disabled={actionLoading === group.id}
                  onClick={() => approveGroup(group.id)}
                  style={{
                    border: 'none',
                    background: '#002D62',
                    color: '#FFFFFF',
                    padding: '13px',
                    borderRadius: '14px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Check size={17} />
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div
      style={{
        background: '#E9E7ED',
        border: '1px solid #EDF1F7',
        borderRadius: '14px',
        padding: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          color: '#717786',
          fontSize: '10px',
          fontWeight: '900',
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}
      >
        {icon}
        {label}
      </div>

      <div
        style={{
          color: '#1A1B1F',
          fontSize: '13px',
          fontWeight: '800',
        }}
      >
        {value}
      </div>
    </div>
  );
}