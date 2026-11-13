import React, { useState } from 'react';

export default function ClaimModal({ item, isOpen, onClose, onConfirmClaim, onCompleteHandover }) {
  const [proofAnswer, setProofAnswer] = useState('');
  const [studentId, setStudentId] = useState('24BCE1042');
  const [contactPhone, setContactPhone] = useState('');
  const [isHandoverStep, setIsHandoverStep] = useState(false);
  const [declineReward, setDeclineReward] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !item) return null;

  const rewardAmount = item.rewardAmount || 100;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onConfirmClaim(item, { proofAnswer, studentId, contactPhone });
      setSubmitted(false);
      setIsHandoverStep(true);
    }, 1000);
  };

  const handleFinalHandover = async () => {
    setSubmitted(true);
    if (onCompleteHandover) {
      await onCompleteHandover(item, { declineReward });
    }
    setSubmitted(false);
    setIsHandoverStep(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🛡️</span>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                {isHandoverStep ? 'Confirm Physical Handover' : 'Ownership Verification & Claim'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {isHandoverStep ? 'Step 2: Security Desk Handover & Reward Release' : 'Step 1: Anti-fraud verification check'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="modal-body" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '14px' }}>⏳</div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              Processing Campus Security Handover...
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Verifying student credentials and updating FindIt Rewards Ledger.
            </p>
          </div>
        ) : isHandoverStep ? (
          /* Step 2: Complete Physical Handover & Release Reward */
          <div className="modal-body">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🤝</div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Physical Handover Confirmed!</h4>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                Both student and item custodian have verified the item at <strong>{item.location}</strong>.
              </p>
            </div>

            <div style={{
              background: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#065f46' }}>
                  FindIt Appreciation Reward
                </span>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#059669' }}>
                  ₹{rewardAmount}.00
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#047857', lineHeight: '1.4' }}>
                This reward will be credited directly to the finder's FindIt Rewards Wallet for GoGrab vending machines.
              </p>

              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #bbf7d0', paddingTop: '10px' }}>
                <input
                  type="checkbox"
                  id="decline-reward-cb"
                  checked={declineReward}
                  onChange={(e) => setDeclineReward(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#059669' }}
                />
                <label htmlFor="decline-reward-cb" style={{ fontSize: '0.78rem', color: '#065f46', fontWeight: 700, cursor: 'pointer' }}>
                  Finder declines reward (Unlocks "💖 Selfless Soul" badge!)
                </label>
              </div>
            </div>

            <div className="modal-footer" style={{ margin: '-24px', marginTop: '20px' }}>
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Postpone
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleFinalHandover}
              >
                Confirm Handover & Release Reward 🚀
              </button>
            </div>
          </div>
        ) : (
          /* Step 1: Proof of ownership */
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Item Summary Preview */}
              <div style={{
                display: 'flex',
                gap: '12px',
                padding: '12px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '18px'
              }}>
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ fontSize: '0.96rem', fontWeight: 700 }}>{item.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 Location: {item.location}</p>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#059669' }}>
                    🏆 Finder Reward: ₹{rewardAmount}.00 Attached
                  </span>
                </div>
              </div>

              {/* Ownership Verification Question */}
              <div className="form-group">
                <label className="form-label">
                  {item.verification_question
                    ? `Security Question: "${item.verification_question}"`
                    : 'Ownership Proof / Hidden Identifying Feature'}{' '}
                  <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  required
                  placeholder="Describe a hidden detail only the real owner knows (e.g. lock wallpaper, internal contents, sticker on the back)..."
                  value={proofAnswer}
                  onChange={(e) => setProofAnswer(e.target.value)}
                />
                <span className="form-help">
                  🔒 Kept strictly private between you and the verified staff custodian.
                </span>
              </div>

              {/* Verified Student Credentials */}
              <div className="grid-2" style={{ gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Campus Roll Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Contact Mobile</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+91 98765 43210"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Verify Proof & Proceed
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
