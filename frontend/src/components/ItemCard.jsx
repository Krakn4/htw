import React from 'react';

export default function ItemCard({ item, onSelect, onClaim, onViewMatch }) {
  const isLost = item.type === 'lost';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: 0 }}>
      {/* Card Image Container */}
      <div style={{ position: 'relative', width: '100%', height: '190px', backgroundColor: 'var(--cream)' }}>
        <img
          src={item.imageUrl || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80'}
          alt={item.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Status Badge */}
        <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
          <span className={`badge ${isLost ? 'badge-lost' : 'badge-found'}`}>
            {isLost ? '🔴 LOST' : '🟢 FOUND'}
          </span>
        </div>

        {/* AI Match Alert Badge if applicable */}
        {item.hasMatch && (
          <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
            <span className="badge badge-ai" style={{ cursor: 'pointer', background: 'var(--cream)', color: 'var(--dark-chocolate)' }} onClick={() => onViewMatch && onViewMatch(item)}>
              ✨ 94% Match
            </span>
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--mocha-brown)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {item.category}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
            📅 {item.date}
          </span>
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--espresso)', marginBottom: '8px', lineHeight: '1.3' }}>
          {item.title}
        </h3>

        <p style={{
          fontSize: '0.84rem',
          color: 'var(--text-muted)',
          marginBottom: '14px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          flex: 1,
          lineHeight: '1.5'
        }}>
          {item.description}
        </p>

        {/* Location Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          <span>📍</span>
          <span style={{ fontWeight: 500 }}>{item.location}</span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
          <button
            className="btn btn-outline"
            style={{ flex: 1, padding: '8px 12px', fontSize: '0.84rem' }}
            onClick={() => onSelect && onSelect(item)}
          >
            Details
          </button>

          {item.hasMatch ? (
            <button
              className="btn btn-primary"
              style={{ flex: 1.2, padding: '8px 12px', fontSize: '0.84rem' }}
              onClick={() => onViewMatch && onViewMatch(item)}
            >
              ✨ View Match
            </button>
          ) : (
            <button
              className={`btn ${isLost ? 'btn-danger' : 'btn-success'}`}
              style={{ flex: 1.2, padding: '8px 12px', fontSize: '0.84rem' }}
              onClick={() => onClaim && onClaim(item)}
            >
              {isLost ? "I've Found This" : 'Claim Item'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
