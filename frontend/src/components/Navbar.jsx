import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Navbar({ activePage, setActivePage, unreadCount, toggleNotifications }) {
  const [walletBalance, setWalletBalance] = useState(150);

  useEffect(() => {
    async function fetchBal() {
      const b = await api.getWalletBalance();
      if (b && typeof b.available_balance === 'number') {
        setWalletBalance(b.available_balance);
      }
    }
    fetchBal();
  }, [activePage]);

  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'browse', label: 'Browse', icon: '🔍' },
    { id: 'wallet', label: 'Rewards Wallet', icon: '💳', highlightValue: `₹${walletBalance}` },
    { id: 'achievements', label: 'Badges', icon: '🏆' },
    { id: 'matches', label: 'AI Matches', icon: '✨', badge: '94%' }
  ];

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <div className="brand-logo" onClick={() => handleNavClick('home')}>
          <div className="brand-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <path d="M11 8v6"></path>
              <path d="M8 11h6"></path>
            </svg>
          </div>
          <span>FindIt<span style={{ color: '#8b5cf6' }}>.ai</span></span>
        </div>

        {/* Navigation Tabs */}
        <ul className="nav-links" style={{ display: 'flex' }}>
          {navItems.map((item) => (
            <li
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.highlightValue && (
                <span style={{
                  background: 'var(--success-light)',
                  color: 'var(--success-text)',
                  fontSize: '0.74rem',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  border: '1px solid #a7f3d0'
                }}>
                  {item.highlightValue}
                </span>
              )}
              {item.badge && (
                <span style={{
                  background: '#8b5cf6',
                  color: 'white',
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: 700
                }}>
                  {item.badge}
                </span>
              )}
            </li>
          ))}
        </ul>

        {/* Right Actions */}
        <div className="nav-actions">
          {/* Quick GoGrab Button */}
          <button
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.82rem', borderColor: '#a7f3d0', background: '#ecfdf5', color: '#065f46' }}
            onClick={() => handleNavClick('gograb')}
            title="Redeem at GoGrab Vending"
          >
            🥤 GoGrab
          </button>

          {/* Notification Button */}
          <button
            className="icon-btn"
            onClick={toggleNotifications}
            title="View Notifications"
            aria-label="Notifications"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
          </button>

          {/* Student Profile Chip */}
          <div className="user-chip" onClick={() => handleNavClick('dashboard')} title="Student Portal">
            <div className="user-avatar">AS</div>
            <div className="user-name">
              <span>Aarav S.</span>
              <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>24BCE1042</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
