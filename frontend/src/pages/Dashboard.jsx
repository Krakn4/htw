import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ItemCard from '../components/ItemCard';
import { api } from '../services/api';

export default function Dashboard({ items, navigateTo, onSelectDetail, onViewMatch, onClaimItem }) {
  const [currentTab, setTab] = useState('overview');
  const [wallet, setWallet] = useState(null);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    async function loadDash() {
      const w = await api.getWallet();
      const a = await api.getUserAchievements();
      setWallet(w);
      setAchievements(a);
    }
    loadDash();
  }, []);

  const myLostItems = items.filter(i => i.type === 'lost');
  const myFoundItems = items.filter(i => i.type === 'found');
  const matchCandidates = items.filter(i => i.hasMatch);

  const stats = {
    lostCount: myLostItems.length,
    foundCount: myFoundItems.length,
    matchCount: matchCandidates.length,
    notifCount: 3,
    walletBalance: wallet ? wallet.available_balance : 150,
    badgeCount: achievements.length || 3
  };

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Sidebar */}
      <Sidebar currentTab={currentTab} setTab={setTab} stats={stats} navigateTo={navigateTo} />

      {/* Main Content Area */}
      <div style={{ flex: '1 1 600px' }}>
        {/* Welcome Header */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
          color: 'white',
          padding: '28px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'inline-block', background: 'rgba(255, 255, 255, 0.2)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '8px' }}>
              CAMPUS STUDENT ID: 24BCE1042
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>
              Welcome back, Aarav! 👋
            </h1>
            <p style={{ opacity: 0.9, fontSize: '0.92rem' }}>
              B.Tech Computer Science & Engineering • Hostel Block 4, Room 218
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn"
              style={{ background: 'white', color: 'var(--primary)', fontWeight: 700 }}
              onClick={() => navigateTo('report-lost')}
            >
              + Report Lost
            </button>
            <button
              className="btn"
              style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.4)' }}
              onClick={() => navigateTo('report-found')}
            >
              + Report Found
            </button>
          </div>
        </div>

        {/* Rewards Wallet & Achievements Quick Access Row */}
        <div className="grid-2" style={{ marginBottom: '24px' }}>
          {/* Wallet Card */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, #064e3b, #047857)',
            color: '#ffffff',
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#a7f3d0', fontWeight: 800, letterSpacing: '0.05em' }}>
                💳 FindIt Rewards Balance
              </span>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#6ee7b7', margin: '4px 0' }}>
                ₹{wallet ? wallet.available_balance.toFixed(2) : '150.00'}
              </div>
              <p style={{ fontSize: '0.78rem', color: '#d1fae5' }}>
                Earned from verified campus item returns
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                className="btn"
                style={{ background: '#ffffff', color: '#065f46', fontSize: '0.8rem', padding: '6px 14px', fontWeight: 800 }}
                onClick={() => navigateTo('gograb')}
              >
                🥤 GoGrab Vending
              </button>
              <button
                className="btn"
                style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', fontSize: '0.8rem', padding: '6px 14px', border: '1px solid rgba(255, 255, 255, 0.3)' }}
                onClick={() => navigateTo('wallet')}
              >
                View History
              </button>
            </div>
          </div>

          {/* Badges Card */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, #4c1d95, #6d28d9)',
            color: '#ffffff',
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#c4b5fd', fontWeight: 800, letterSpacing: '0.05em' }}>
                🏆 Appreciation Badges
              </span>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fde047', margin: '4px 0' }}>
                {achievements.length || 3} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#e9d5ff' }}>Unlocked</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#ddd6fe' }}>
                🌱 First Finder • 🤝 Helping Hand • 🔍 Sharp Eye
              </p>
            </div>
            <button
              className="btn"
              style={{ background: '#ffffff', color: '#5b21b6', fontSize: '0.82rem', padding: '8px 16px', fontWeight: 800 }}
              onClick={() => navigateTo('achievements')}
            >
              Honors Wall →
            </button>
          </div>
        </div>

        {/* 4 Stat Metric Counters */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          {[
            { label: 'Lost Items Reported', count: stats.lostCount, icon: '🎒', color: 'var(--danger)', bg: 'var(--danger-light)' },
            { label: 'Found Items Turned In', count: stats.foundCount, icon: '🤝', color: 'var(--success)', bg: 'var(--success-light)' },
            { label: 'AI Matches Found', count: stats.matchCount, icon: '✨', color: '#8b5cf6', bg: '#f3e8ff', badge: 'Action Required' },
            { label: 'Total Verified Returns', count: 4, icon: '🛡️', color: '#0284c7', bg: '#e0f2fe' }
          ].map((metric) => (
            <div key={metric.label} className="card" style={{ padding: '16px', position: 'relative' }}>
              {metric.badge && (
                <span style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: '#8b5cf6',
                  color: 'white',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '10px'
                }}>
                  {metric.badge}
                </span>
              )}
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: metric.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                marginBottom: '10px'
              }}>
                {metric.icon}
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1' }}>
                {metric.count}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
                {metric.label}
              </div>
            </div>
          ))}
        </div>

        {/* Prominent AI Match Notification Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #ede9fe, #dbeafe)',
          border: '1.5px solid #c4b5fd',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: '#8b5cf6',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem'
            }}>
              ✨
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4c1d95' }}>
                  AI Found a 94% Match for your Lost Backpack!
                </h3>
                <span className="badge badge-ai">High Confidence</span>
              </div>
              <p style={{ fontSize: '0.86rem', color: '#5b21b6', marginTop: '2px' }}>
                Found item matched at Central Library Circulation Desk • ₹100 Reward attached for verified return.
              </p>
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ background: '#7c3aed', padding: '10px 20px', fontWeight: 700 }}
            onClick={() => onViewMatch()}
          >
            Review AI Match & Claim →
          </button>
        </div>

        {/* Items Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              {currentTab === 'my-lost' ? 'Your Active Lost Reports' :
               currentTab === 'my-found' ? 'Items You Turned In' :
               currentTab === 'matches' ? 'High Confidence AI Matches' :
               'Your Reported Campus Items'}
            </h2>
            <button
              className="btn btn-outline"
              style={{ fontSize: '0.84rem', padding: '6px 12px' }}
              onClick={() => navigateTo('browse')}
            >
              Browse Global Catalog
            </button>
          </div>

          <div className="grid-cards">
            {(currentTab === 'my-lost' ? myLostItems :
              currentTab === 'my-found' ? myFoundItems :
              currentTab === 'matches' ? matchCandidates :
              items.slice(0, 4)
            ).map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onSelect={onSelectDetail}
                onClaim={onClaimItem}
                onViewMatch={onViewMatch}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
