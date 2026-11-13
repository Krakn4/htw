import React from 'react';

export default function BadgeUnlockedModal({ badge, isOpen, onClose }) {
  if (!isOpen || !badge) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '440px', textAlign: 'center', padding: '32px 24px', position: 'relative', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti / Sparkle background effect */}
        <div style={{
          position: 'absolute',
          top: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '280px',
          height: '280px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none'
        }} />

        {/* Big Animated Icon */}
        <div style={{
          width: '84px',
          height: '84px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #fef08a, #fde047)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '3.2rem',
          margin: '0 auto 18px',
          boxShadow: '0 10px 25px rgba(250, 204, 21, 0.4)',
          border: '4px solid #ffffff'
        }}>
          {badge.icon}
        </div>

        <span style={{
          background: 'linear-gradient(135deg, #ede9fe, #dbeafe)',
          color: '#6b21a8',
          fontSize: '0.78rem',
          fontWeight: 800,
          padding: '4px 14px',
          borderRadius: 'var(--radius-full)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          border: '1px solid #c4b5fd'
        }}>
          🎉 New Achievement Unlocked!
        </span>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', margin: '14px 0 8px', letterSpacing: '-0.02em' }}>
          {badge.badge_name}
        </h2>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5', maxWidth: '320px', margin: '0 auto 24px' }}>
          {badge.description}
        </p>

        <div style={{
          background: 'var(--bg-subtle)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8rem',
          color: '#065f46',
          fontWeight: 600,
          marginBottom: '24px'
        }}>
          ✓ Added to your verified campus honors profile
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '12px', fontSize: '0.96rem', background: 'linear-gradient(135deg, #2563eb, #8b5cf6)' }}
          onClick={onClose}
        >
          Awesome! Collect Honor 🎖️
        </button>
      </div>
    </div>
  );
}
