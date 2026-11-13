import React from 'react';

export default function ItemDetailModal({ item, isOpen, onClose, onClaim, onViewMatch }) {
  if (!isOpen || !item) return null;

  const isLost = item.type === 'lost';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${isLost ? 'badge-lost' : 'badge-found'}`}>
              {isLost ? '🔴 LOST REPORT' : '🟢 FOUND ITEM'}
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>ID: #{item.id}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          <div style={{ width: '100%', height: '240px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '18px', background: '#e2e8f0' }}>
            <img
              src={item.imageUrl}
              alt={item.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
            {item.title}
          </h2>

          <div className="grid-2" style={{ gap: '12px', background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Category</p>
              <p style={{ fontSize: '0.92rem', fontWeight: 600 }}>{item.category}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Date</p>
              <p style={{ fontSize: '0.92rem', fontWeight: 600 }}>{item.date}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Campus Location</p>
              <p style={{ fontSize: '0.92rem', fontWeight: 600 }}>📍 {item.location}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Reported By</p>
              <p style={{ fontSize: '0.92rem', fontWeight: 600 }}>👤 {item.contactName} ({item.contactRoll})</p>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Full Description
            </h4>
            <p style={{ fontSize: '0.94rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
              {item.description}
            </p>
          </div>

          {/* AI Match notice if exists */}
          {item.hasMatch && (
            <div style={{
              background: 'linear-gradient(135deg, #ede9fe, #dbeafe)',
              border: '1px solid #c4b5fd',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>✨</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#5b21b6' }}>
                  AI found a 94% similarity match for this item!
                </span>
              </div>
              <button
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#7c3aed' }}
                onClick={() => {
                  onClose();
                  onViewMatch && onViewMatch(item);
                }}
              >
                View Match
              </button>
            </div>
          )}

          {/* Security Notice */}
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            🔒 Privacy protection active: Private contact phone numbers are never publicly listed. Claims require ownership verification at the campus security desk.
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>

          {isLost ? (
            <button
              className="btn btn-danger"
              onClick={() => {
                onClose();
                onClaim(item);
              }}
            >
              I Found This Item
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={() => {
                onClose();
                onClaim(item);
              }}
            >
              Claim This Item
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
