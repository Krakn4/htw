import React from 'react';

export default function Sidebar({ currentTab, setTab, stats, navigateTo }) {
  const links = [
    { id: 'overview', label: 'Dashboard Overview', icon: '📊', isPage: false },
    { id: 'wallet', label: 'FindIt Rewards Wallet', icon: '💳', count: `₹${stats?.walletBalance || 150}`, isPage: true, highlight: true },
    { id: 'gograb', label: 'GoGrab Vending Kiosk', icon: '🥤', isPage: true },
    { id: 'achievements', label: 'My Achievements', icon: '🏆', count: `${stats?.badgeCount || 3} Badges`, isPage: true },
    { id: 'my-lost', label: 'My Lost Items', icon: '🎒', count: stats?.lostCount || 2, isPage: false },
    { id: 'my-found', label: 'Turned In Items', icon: '🤝', count: stats?.foundCount || 1, isPage: false },
    { id: 'matches', label: 'AI Match Alerts', icon: '✨', count: stats?.matchCount || 1, isPage: true }
  ];

  const handleClick = (link) => {
    if (link.isPage && navigateTo) {
      navigateTo(link.id);
    } else {
      setTab(link.id);
    }
  };

  return (
    <aside style={{
      width: '260px',
      background: '#ffffff',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      padding: '20px 16px',
      height: 'fit-content',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ marginBottom: '16px', paddingLeft: '8px' }}>
        <p style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
          Portal Navigation
        </p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {links.map((link) => (
          <button
            key={link.id}
            onClick={() => handleClick(link)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: currentTab === link.id ? 'var(--primary-light)' : 'transparent',
              color: currentTab === link.id ? 'var(--primary)' : 'var(--text-main)',
              fontWeight: currentTab === link.id ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </div>
            {link.count && (
              <span style={{
                fontSize: '0.74rem',
                padding: '2px 8px',
                borderRadius: '10px',
                background: link.highlight ? '#ecfdf5' : (currentTab === link.id ? 'var(--primary)' : '#e2e8f0'),
                color: link.highlight ? '#065f46' : (currentTab === link.id ? '#ffffff' : 'var(--text-muted)'),
                fontWeight: 700,
                border: link.highlight ? '1px solid #a7f3d0' : 'none'
              }}>
                {link.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Rewards Banner */}
      <div style={{
        marginTop: '24px',
        padding: '14px',
        background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
        border: '1px solid #bbf7d0',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.82rem'
      }}>
        <div style={{ fontWeight: 800, color: '#166534', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🥤</span> GoGrab Snack Credits
        </div>
        <p style={{ color: '#15803d', fontSize: '0.78rem', lineHeight: '1.4' }}>
          Verified returners get instant wallet rewards redeemable at campus smart vending machines.
        </p>
      </div>
    </aside>
  );
}
