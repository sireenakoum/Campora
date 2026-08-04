import React, { useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

import {
  getNotificationsForCurrentUser,
  markNotificationAsRead,
} from '../lib/queries';

function formatNotificationDate(dateValue) {
  if (!dateValue) return '';

  return new Date(dateValue).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      try {
        const data = await getNotificationsForCurrentUser();

        if (!cancelled) {
          setNotifications(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load notifications.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleMarkAsRead(notificationId) {
    try {
      setUpdatingId(notificationId);

      await markNotificationAsRead(notificationId);

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                status: 'read',
                read_at: new Date().toISOString(),
              }
            : notification
        )
      );
    } catch (err) {
      setError(err.message || 'Could not update the notification.');
    } finally {
      setUpdatingId(null);
    }
  }

  const unreadCount = notifications.filter(
    (notification) => notification.status === 'unread'
  ).length;

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '30px',
          gap: '20px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '40px',
              fontWeight: '900',
              color: '#0B1A3F',
              marginBottom: '8px',
            }}
          >
            Notifications
          </h1>

          <p
            style={{
              color: '#A3AED0',
              fontWeight: '700',
            }}
          >
            View your reminders, alerts, and important updates.
          </p>
        </div>

        <div
          style={{
            background: unreadCount > 0 ? '#0B1A3F' : '#F4F7FE',
            color: unreadCount > 0 ? 'white' : '#A3AED0',
            padding: '10px 16px',
            borderRadius: '14px',
            fontWeight: '900',
            fontSize: '13px',
            whiteSpace: 'nowrap',
          }}
        >
          {unreadCount} unread
        </div>
      </div>

      {loading && (
        <div
          className="card"
          style={{
            minHeight: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#A3AED0',
            fontWeight: '800',
          }}
        >
          Loading notifications...
        </div>
      )}

      {!loading && error && (
        <div
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#991B1B',
            background: '#FEE2E2',
            fontWeight: '800',
          }}
        >
          <AlertCircle size={22} />
          {error}
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <div
          className="card"
          style={{
            minHeight: '420px',
            border: '1.5px solid #E9EDF7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div>
            <Bell
              size={48}
              color="#A3AED0"
              style={{ marginBottom: '15px' }}
            />

            <h3
              style={{
                color: '#0B1A3F',
                fontWeight: '900',
                marginBottom: '8px',
              }}
            >
              No notifications yet
            </h3>

            <p
              style={{
                color: '#A3AED0',
                fontWeight: '700',
              }}
            >
              Your reminders and alerts will appear here.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && notifications.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {notifications.map((notification) => {
            const isUnread = notification.status === 'unread';
            const relatedReminder = notification.reminders;

            return (
              <div
                key={notification.id}
                className="card"
                style={{
                  border: isUnread
                    ? '2px solid #0B1A3F'
                    : '1.5px solid #E9EDF7',
                  background: isUnread ? '#F8FAFF' : 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '20px',
                  padding: '22px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '14px',
                      background: isUnread ? '#0B1A3F' : '#F4F7FE',
                      color: isUnread ? 'white' : '#A3AED0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Bell size={21} />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '6px',
                      }}
                    >
                      <h3
                        style={{
                          color: '#0B1A3F',
                          fontSize: '17px',
                          fontWeight: '900',
                          margin: 0,
                        }}
                      >
                        {notification.title}
                      </h3>

                      {isUnread && (
                        <span
                          style={{
                            background: '#0B1A3F',
                            color: 'white',
                            fontSize: '9px',
                            fontWeight: '900',
                            padding: '4px 8px',
                            borderRadius: '20px',
                          }}
                        >
                          NEW
                        </span>
                      )}
                    </div>

                    <p
                      style={{
                        color: '#667085',
                        fontWeight: '700',
                        marginBottom: '9px',
                      }}
                    >
                      {notification.message}
                    </p>

                    {relatedReminder && (
                      <p
                        style={{
                          color: '#0B1A3F',
                          fontSize: '12px',
                          fontWeight: '800',
                          marginBottom: '8px',
                        }}
                      >
                        Reminder: {relatedReminder.title}
                      </p>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#A3AED0',
                        fontSize: '11px',
                        fontWeight: '800',
                      }}
                    >
                      <Clock size={13} />
                      {formatNotificationDate(
                        notification.sent_at || notification.created_at
                      )}
                    </div>
                  </div>
                </div>

                {isUnread ? (
                  <button
                    type="button"
                    disabled={updatingId === notification.id}
                    onClick={() => handleMarkAsRead(notification.id)}
                    style={{
                      border: 'none',
                      borderRadius: '12px',
                      padding: '11px 15px',
                      background: '#0B1A3F',
                      color: 'white',
                      fontWeight: '900',
                      cursor:
                        updatingId === notification.id
                          ? 'not-allowed'
                          : 'pointer',
                      opacity:
                        updatingId === notification.id ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {updatingId === notification.id
                      ? 'Updating...'
                      : 'Mark as read'}
                  </button>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      color: '#05CD99',
                      fontWeight: '900',
                      fontSize: '13px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <CheckCircle2 size={18} />
                    Read
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}