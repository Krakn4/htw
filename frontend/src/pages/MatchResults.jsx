import React from 'react';

export default function MatchResults({ matchData, onRequestClaim, navigateTo }) {
  const match = matchData || {
    matchFound: true,
    similarityScore: 94,
    confidenceTier: 'High Confidence',
    status: 'Ready for Student Claim',
    rewardAmount: 100,
    rewardOffered: true,
    lostItem: {
      id: 'item-101',
      title: 'Navy Blue Dell Laptop Bag',
      category: 'Bags & Backpacks',
      location: 'Central Library, 2nd Floor',
      date: '2026-11-12',
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
      reportedBy: 'Aarav Sharma (24BCE1042)',
      description: 'Dark blue backpack with Dell emblem. Contains scientific calculator in front compartment.'
    },
    foundItem: {
      id: 'item-102',
      title: 'Navy Dell Backpack with Cables',
      category: 'Bags & Backpacks',
      location: 'Central Library, Reading Hall B',
      date: '2026-11-12',
      imageUrl: 'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?auto=format&fit=crop&w=600&q=80',
      custodian: 'Library Circulation Counter #2',
      foundBy: 'Pooja Verma (Staff)',
      description: 'Found unattended at desk 14. Handed over to library circulation desk for student claim.'
    },
    matchBreakdown: [
      { label: 'Color & Hue Distribution', score: 96, detail: 'Dark navy blue dominant palette matching Lost report (Delta-E < 2.1)' },
      { label: 'Form Factor & Silhouette', score: 92, detail: 'Double-compartment ergonomic backpack silhouette' },
      { label: 'Brand & Emblem Detection', score: 95, detail: 'Dell circular emblem detected at upper center' },
      { label: 'Spatio-Temporal Proximity', score: 88, detail: 'Found at Central Library within 2.5 hours of loss report (< 30m distance)' }
    ],
    aiExplanation: 'The visual embedding model identified congruent geometry, matching fabric textures, and exact brand glyphs. Spatio-temporal records correlate the items within 30 meters of the reported study cubicle.'
  };

  const rewardAmount = match.rewardAmount || 100;

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Top Banner - Highlight of the Hackathon */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
        color: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        marginBottom: '28px',
        boxShadow: 'var(--shadow-xl)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '10px'
            }}>
              ✨ FINDIT AI MULTIMODAL VISION ENGINE
            </div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>
              AI Match Analysis Result
            </h1>
            <p style={{ color: '#c7d2fe', fontSize: '0.98rem' }}>
              Automated image feature extraction detected a high-probability match across campus inventory.
            </p>
          </div>

          {/* Big Score Gauge */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 28px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#38bdf8', lineHeight: '1' }}>
              {match.similarityScore}%
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e0e7ff', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {match.confidenceTier}
            </div>
          </div>
        </div>
      </div>

      {/* Rewards Incentive Alert Card */}
      <div style={{
        background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
        border: '1.5px solid #6ee7b7',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 22px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.8rem' }}>💰</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#065f46' }}>
                Owner-Authorized Reward: ₹{rewardAmount}.00
              </span>
              <span style={{ fontSize: '0.74rem', background: '#059669', color: '#ffffff', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>
                Escrow Protected
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#047857', marginTop: '2px' }}>
              Upon verified physical return at the Library Desk, ₹{rewardAmount} will be automatically credited to the finder's FindIt Rewards Wallet.
            </p>
          </div>
        </div>

        <button
          className="btn btn-outline"
          style={{ borderColor: '#059669', color: '#065f46', fontSize: '0.84rem' }}
          onClick={() => navigateTo('wallet')}
        >
          View Rewards Policy
        </button>
      </div>

      {/* Side-by-Side Visual Comparison Cards */}
      <div className="grid-2" style={{ marginBottom: '32px' }}>
        {/* Left: Lost Item */}
        <div className="card" style={{ border: '2px solid #fecaca', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 2 }}>
            <span className="badge badge-lost">🔴 YOUR REPORTED LOST ITEM</span>
          </div>

          <div style={{ height: '260px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '16px', background: '#e2e8f0' }}>
            <img
              src={match.lostItem.imageUrl}
              alt="Lost item"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
            {match.lostItem.title}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            <div>📍 <strong>Reported Location:</strong> {match.lostItem.location}</div>
            <div>📅 <strong>Date Lost:</strong> {match.lostItem.date}</div>
            <div>👤 <strong>Reported by:</strong> {match.lostItem.reportedBy}</div>
            <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: 'var(--radius-sm)', marginTop: '6px' }}>
              "{match.lostItem.description}"
            </div>
          </div>
        </div>

        {/* Right: Found Item */}
        <div className="card" style={{ border: '2px solid #a7f3d0', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 2 }}>
            <span className="badge badge-found">🟢 MATCHED FOUND ITEM</span>
          </div>

          <div style={{ height: '260px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '16px', background: '#e2e8f0' }}>
            <img
              src={match.foundItem.imageUrl}
              alt="Found item"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
            {match.foundItem.title}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            <div>📍 <strong>Found Location:</strong> {match.foundItem.location}</div>
            <div>📅 <strong>Date Discovered:</strong> {match.foundItem.date}</div>
            <div>🛡️ <strong>Current Custodian:</strong> <span style={{ color: '#059669', fontWeight: 700 }}>{match.foundItem.custodian}</span></div>
            <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: 'var(--radius-sm)', marginTop: '6px' }}>
              "{match.foundItem.description}"
            </div>
          </div>
        </div>
      </div>

      {/* AI Vector Feature Breakdown Section */}
      <div className="card" style={{ padding: '28px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              🧠 Multimodal AI Feature Breakdown
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Vector similarity score generated by comparing image embeddings and spatial proximity.
            </p>
          </div>
          <span className="badge badge-ai" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            Status: {match.status}
          </span>
        </div>

        {/* Progress Bars for Individual Vectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {match.matchBreakdown.map((item) => (
            <div key={item.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.label}</span>
                <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{item.score}% Match</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{
                  width: `${item.score}%`,
                  height: '100%',
                  background: item.score > 90 ? 'linear-gradient(90deg, #3b82f6, #10b981)' : 'linear-gradient(90deg, #3b82f6, #f59e0b)',
                  borderRadius: '5px',
                  transition: 'width 0.8s ease-in-out'
                }} />
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        {/* AI Model Reasoning Summary */}
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc, #eff6ff)',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          fontSize: '0.88rem',
          lineHeight: '1.5'
        }}>
          <strong style={{ color: '#1e40af' }}>🤖 AI Explanation Note: </strong>
          <span style={{ color: '#1e3a8a' }}>{match.aiExplanation}</span>
        </div>
      </div>

      {/* Claim / Handover Action Center */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Ready to claim this item?</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            Answer the security verification question to receive an OTP and authorize release of the ₹{rewardAmount} finder reward.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn btn-outline"
            onClick={() => navigateTo('browse')}
          >
            Not My Item
          </button>
          <button
            className="btn btn-primary"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '12px 24px', fontWeight: 700 }}
            onClick={() => onRequestClaim && onRequestClaim({ ...match.foundItem, rewardAmount })}
          >
            🛡️ Verify Ownership & Authorize Handover
          </button>
        </div>
      </div>
    </div>
  );
}
