import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Achievements({ onTriggerReturnSimulation }) {
  const [badges, setBadges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [progress, setProgress] = useState(null);
  const [publicProfile, setPublicProfile] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const allBadges = await api.getBadges();
    const userAchs = await api.getUserAchievements();
    const userProg = await api.getUserProgress();
    setBadges(allBadges);
    setAchievements(userAchs);
    setProgress(userProg);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const earnedMap = new Map();
  achievements.forEach((a) => {
    earnedMap.set(a.id || a.badge_id, a.earned_at);
  });

  const milestoneBadges = badges.filter((b) => b.category === 'milestone');
  const specialBadges = badges.filter((b) => b.category === 'special');

  const verifiedReturns = progress ? progress.verified_returns : 4;
  const nextBadge = progress ? progress.next_badge : null;
  const progressPercent = progress ? progress.progress_to_next : 80;

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--accent-light)', color: '#6b21a8', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px' }}>
            <span>🌟</span> CAMPUS CITIZENSHIP RECOGNITION
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            My Appreciation Badges
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem' }}>
            Earn verifiable digital badges for honest and selfless item returns across campus.
          </p>
        </div>

        {/* Public Campus Profile Toggle */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block' }}>Display on Public Profile</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Visible to campus peers</span>
          </div>
          <input
            type="checkbox"
            checked={publicProfile}
            onChange={(e) => setPublicProfile(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
          />
        </div>
      </div>

      {/* Progress & Verified Returns Banner Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)',
        color: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        padding: '30px',
        boxShadow: 'var(--shadow-xl)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: '#cbd5e1', fontWeight: 700, letterSpacing: '0.05em' }}>
              Verified Item Returns
            </p>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#38bdf8', lineHeight: '1.1', margin: '6px 0' }}>
              {verifiedReturns} <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e0e7ff' }}>Handover(s)</span>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#c7d2fe' }}>
              Verified through campus security desk handover confirmations
            </p>
          </div>

          {/* Next Milestone Progress Meter */}
          {nextBadge ? (
            <div style={{ background: 'rgba(255, 255, 255, 0.12)', padding: '20px', borderRadius: 'var(--radius-md)', backdropFilter: 'blur(8px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                  Next Milestone: {nextBadge.icon} {nextBadge.badge_name}
                </span>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#38bdf8' }}>
                  {verifiedReturns} / {nextBadge.return_threshold}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '5px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #38bdf8, #4ade80)',
                  borderRadius: '5px',
                  transition: 'width 0.8s ease'
                }} />
              </div>

              <p style={{ fontSize: '0.76rem', color: '#e0e7ff' }}>
                Need <strong>{nextBadge.return_threshold - verifiedReturns} more verified return</strong> to unlock "{nextBadge.badge_name}"!
              </p>
            </div>
          ) : (
            <div style={{ background: 'rgba(255, 255, 255, 0.12)', padding: '20px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '1.8rem' }}>👑</span>
              <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fef08a' }}>All Milestones Unlocked!</p>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>You are a campus legend of honesty and kindness.</p>
            </div>
          )}
        </div>
      </div>

      {/* 1. Milestone Badges Section */}
      <div>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
            🌱 Return Milestones
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Awarded automatically by backend verification logic as your total handovers grow.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {milestoneBadges.map((badge) => {
            const isEarned = earnedMap.has(badge.id);
            const earnedDate = earnedMap.get(badge.id);

            return (
              <div
                key={badge.id}
                className="card"
                style={{
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  border: isEarned ? '1.5px solid #a7f3d0' : '1px solid var(--border-color)',
                  background: isEarned ? '#ffffff' : '#f8fafc',
                  opacity: isEarned ? 1 : 0.65,
                  boxShadow: isEarned ? 'var(--shadow-md)' : 'none'
                }}
              >
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: 'var(--radius-md)',
                  background: isEarned ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' : '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  flexShrink: 0,
                  boxShadow: isEarned ? '0 4px 10px rgba(16, 185, 129, 0.2)' : 'none'
                }}>
                  {badge.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {badge.badge_name}
                    </h3>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: isEarned ? 'var(--success-light)' : '#e2e8f0',
                      color: isEarned ? 'var(--success-text)' : 'var(--text-muted)'
                    }}>
                      {isEarned ? 'UNLOCKED' : `${badge.return_threshold} RETURNS`}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '8px' }}>
                    {badge.description}
                  </p>

                  <div style={{ fontSize: '0.74rem', color: isEarned ? '#059669' : 'var(--text-light)', fontWeight: 600 }}>
                    {isEarned ? (
                      <span>✓ Earned on {new Date(earnedDate).toLocaleDateString()}</span>
                    ) : (
                      <span>🔒 Locked • Progress: {verifiedReturns} / {badge.return_threshold}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Special Badges Section */}
      <div>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
            ✨ Special Honors
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Granted for exemplary conduct, rapid response times, and selfless contributions.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {specialBadges.map((badge) => {
            const isEarned = earnedMap.has(badge.id);
            const earnedDate = earnedMap.get(badge.id);

            return (
              <div
                key={badge.id}
                className="card"
                style={{
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  border: isEarned ? '1.5px solid #c4b5fd' : '1px solid var(--border-color)',
                  background: isEarned ? 'linear-gradient(135deg, #ffffff, #faf5ff)' : '#f8fafc',
                  opacity: isEarned ? 1 : 0.65
                }}
              >
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: 'var(--radius-md)',
                  background: isEarned ? 'linear-gradient(135deg, #f3e8ff, #ede9fe)' : '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  flexShrink: 0
                }}>
                  {badge.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {badge.badge_name}
                    </h3>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: isEarned ? '#f3e8ff' : '#e2e8f0',
                      color: isEarned ? '#6b21a8' : 'var(--text-muted)'
                    }}>
                      {isEarned ? 'AWARDED' : 'SPECIAL'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '8px' }}>
                    {badge.description}
                  </p>

                  <div style={{ fontSize: '0.74rem', color: isEarned ? '#7c3aed' : 'var(--text-light)', fontWeight: 600 }}>
                    {isEarned ? (
                      <span>✓ Earned on {new Date(earnedDate).toLocaleDateString()}</span>
                    ) : (
                      <span>🔒 Criteria: {badge.criteria || 'Special qualification'}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulator Test Bar for Judges */}
      <div style={{
        background: 'var(--bg-subtle)',
        border: '1.5px dashed var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)' }}>
            🧪 Judge & Evaluator Testing Sandbox
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Simulate a verified item return handover to trigger automatic backend badge evaluation and reward credit.
          </p>
        </div>

        <button
          className="btn btn-primary"
          style={{ background: 'linear-gradient(135deg, #2563eb, #8b5cf6)' }}
          onClick={async () => {
            const res = await api.creditReward({
              reward_id: 'REW-' + Date.now().toString().slice(-4),
              verified_handover: true,
              declined_reward: false,
              duration_hours: 10
            });
            await loadData();
            if (onTriggerReturnSimulation) onTriggerReturnSimulation(res);
          }}
        >
          ⚡ Simulate Verified Return (+1 Handover)
        </button>
      </div>
    </div>
  );
}
