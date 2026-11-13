import React from 'react';

export default function Notification({ isOpen, onClose, notifications, onViewMatch, onMarkAllRead }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '70px',
      right: '20px',
      width: '360px',
      maxWidth: '90vw',
      background: '#ffffff',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-xl)',
      border: '1px solid var(--border-color)',
      zIndex: 1050,
      overflow: 'hidden',
      animation: 'slideUp 0.25s ease'
    }}>
      {/* Drawer Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.1rem' }}>🔔</span>
          <span style={{ fontWeight: 700, fontSize: '0.96rem' }}>Notifications</span>
          <span style={{
            background: 'var(--primary)',
            color: 'white',
            fontSize: '0.72rem',
            padding: '2px 7px',
            borderRadius: '10px',
            fontWeight: 700
          }}>
            {notifications.filter(n => !n.read).length} new
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-muted)' }}
        >
          ✕
        </button>
      </div>

      {/* Notifications List */}
      <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '10px' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No new notifications
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '8px',
                background: notif.read ? 'transparent' : 'var(--primary-light)',
                border: notif.read ? '1px solid transparent' : '1px solid var(--primary-border)',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                  {notif.title}
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-light)' }}>
                  {notif.time}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '8px' }}>
                {notif.message}
              </p>

              {notif.type === 'match' && (
                <button
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', width: '100%' }}
                  onClick={() => {
                    onViewMatch();
                    onClose();
                  }}
                >
                  ✨ View 94% Match in AI Hub
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        background: 'var(--bg-body)'
      }}>
        <button
          onClick={onMarkAllRead}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Mark all as read
        </button>
      </div>
    </div>
  );
}
