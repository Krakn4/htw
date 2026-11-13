import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function WalletDashboard({ navigateTo }) {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadWalletData = async () => {
    setLoading(true);
    const w = await api.getWallet();
    const t = await api.getWalletTransactions();
    setWallet(w);
    setTransactions(t);
    setLoading(false);
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'all') return true;
    return t.transaction_type === filterType;
  });

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px' }}>
            <span>💳</span> FINDIT CAMPUS INCENTIVE SYSTEM
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            FindIt Rewards Wallet
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem' }}>
            Earn appreciation rewards for verified item handovers. Spend your balance at campus GoGrab vending machines.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-outline"
            onClick={() => navigateTo('achievements')}
          >
            🏆 View Badges
          </button>
          <button
            className="btn btn-primary"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
            onClick={() => navigateTo('gograb')}
          >
            🥤 Redeem at GoGrab
          </button>
        </div>
      </div>

      {/* Prominent Wallet Balance Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e3a8a 100%)',
        color: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        boxShadow: 'var(--shadow-xl)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative circles */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-20px',
          width: '260px',
          height: '260px',
          background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(139,92,246,0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', position: 'relative', zIndex: 1 }}>
          {/* Main Available Balance */}
          <div>
            <p style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#cbd5e1', fontWeight: 700 }}>
              Available Reward Balance
            </p>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#38bdf8', lineHeight: '1.1', margin: '8px 0' }}>
              ₹{wallet ? wallet.available_balance.toFixed(2) : '0.00'}
            </div>
            <p style={{ fontSize: '0.84rem', color: '#93c5fd' }}>
              Ready for GoGrab snacks, drinks & meals
            </p>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', alignContent: 'center' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '14px', borderRadius: 'var(--radius-md)', backdropFilter: 'blur(8px)' }}>
              <p style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#cbd5e1', fontWeight: 600 }}>Total Earned</p>
              <p style={{ fontSize: '1.35rem', fontWeight: 800, color: '#4ade80' }}>
                ₹{wallet ? wallet.total_earned.toFixed(2) : '0.00'}
              </p>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '14px', borderRadius: 'var(--radius-md)', backdropFilter: 'blur(8px)' }}>
              <p style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#cbd5e1', fontWeight: 600 }}>Total Redeemed</p>
              <p style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fca5a5' }}>
                ₹{wallet ? wallet.total_redeemed.toFixed(2) : '0.00'}
              </p>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '14px', borderRadius: 'var(--radius-md)', backdropFilter: 'blur(8px)', gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#cbd5e1', fontWeight: 600 }}>Pending Handover Rewards</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fde047' }}>
                    ₹{wallet ? wallet.pending_rewards.toFixed(2) : '0.00'}
                  </p>
                </div>
                <span style={{ fontSize: '0.74rem', background: 'rgba(250, 204, 21, 0.2)', color: '#fef08a', padding: '4px 10px', borderRadius: '10px', fontWeight: 700 }}>
                  Awaiting Handover
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* GoGrab Quick Action Bar inside Banner */}
        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: '#e2e8f0' }}>
            <span>🥤</span>
            <span>Use rewards for cold drinks, chips, chocolate bars, and coffee at any campus machine.</span>
          </div>
          <button
            onClick={() => navigateTo('gograb')}
            className="btn"
            style={{ background: '#ffffff', color: '#1e3a8a', fontWeight: 700, fontSize: '0.88rem', padding: '8px 18px' }}
          >
            Launch GoGrab Kiosk →
          </button>
        </div>
      </div>

      {/* How Rewards Work Explainer Card */}
      <div className="card" style={{ padding: '22px 28px', background: 'var(--bg-card)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>💡</span> How FindIt Rewards Work
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '1.4rem' }}>1️⃣</span>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '6px 0 2px' }}>Owner Sets Bounty</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Students can attach an optional reward (₹50, ₹100, ₹150) when reporting a lost item.
            </p>
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '1.4rem' }}>2️⃣</span>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '6px 0 2px' }}>AI Match & Verification</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Multimodal AI connects lost and found reports. Anti-fraud proof verifies the true owner.
            </p>
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '1.4rem' }}>3️⃣</span>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '6px 0 2px' }}>Verified Release</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Reward is credited ONLY after safe physical handover is verified by the campus security desk.
            </p>
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '1.4rem' }}>4️⃣</span>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '6px 0 2px' }}>GoGrab Vending</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Finder uses their wallet balance for instant snacks & refreshments across campus.
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Transaction History</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Audit trail of all rewards credited, redeemed, and pending.</p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-subtle)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'reward_credited', label: 'Credits (+)' },
              { id: 'reward_redeemed', label: 'Redemptions (-)' },
              { id: 'pending_reward', label: 'Pending' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  fontWeight: filterType === f.id ? 700 : 500,
                  background: filterType === f.id ? '#ffffff' : 'transparent',
                  color: filterType === f.id ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: filterType === f.id ? 'var(--shadow-sm)' : 'none',
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        {filteredTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            No transactions found for this filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredTransactions.map((txn) => {
              const isCredit = txn.transaction_type === 'reward_credited';
              const isRedeem = txn.transaction_type === 'reward_redeemed';
              const isPending = txn.transaction_type === 'pending_reward';

              return (
                <div
                  key={txn.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: isPending ? '#fffbeb' : '#ffffff',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: isCredit ? 'var(--success-light)' : isRedeem ? '#fee2e2' : '#fef3c7',
                      color: isCredit ? 'var(--success-text)' : isRedeem ? '#991b1b' : '#92400e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      fontWeight: 700
                    }}>
                      {isCredit ? '↓' : isRedeem ? '↑' : '⏳'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-main)' }}>
                          {isCredit ? 'Reward Credited' : isRedeem ? 'GoGrab Vending Machine' : 'Pending Verification'}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 700,
                          background: txn.status === 'completed' ? 'var(--success-light)' : '#fef3c7',
                          color: txn.status === 'completed' ? 'var(--success-text)' : '#92400e'
                        }}>
                          {txn.status.toUpperCase()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {txn.description}
                      </p>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-light)', marginTop: '4px' }}>
                        <span>ID: {txn.id}</span> • <span>Ref: {txn.reference_id}</span> • <span>{new Date(txn.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: isCredit ? '#059669' : isRedeem ? '#dc2626' : '#d97706'
                    }}>
                      {isCredit ? `+₹${txn.amount.toFixed(2)}` : isRedeem ? `-₹${txn.amount.toFixed(2)}` : `₹${txn.amount.toFixed(2)}`}
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {isCredit ? 'Added to Wallet' : isRedeem ? 'Debited from Wallet' : 'In Escrow'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
