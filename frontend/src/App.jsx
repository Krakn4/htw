import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Notification from './components/Notification';
import ItemDetailModal from './components/ItemDetailModal';
import ClaimModal from './components/ClaimModal';
import BadgeUnlockedModal from './components/BadgeUnlockedModal';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ReportLost from './pages/ReportLost';
import ReportFound from './pages/ReportFound';
import BrowseItems from './pages/BrowseItems';
import MatchResults from './pages/MatchResults';
import WalletDashboard from './pages/WalletDashboard';
import GoGrabRedeem from './pages/GoGrabRedeem';
import Achievements from './pages/Achievements';

import { api } from './services/api';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [pageParams, setPageParams] = useState({});
  const [items, setItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // Modals state
  const [selectedItemForDetail, setSelectedItemForDetail] = useState(null);
  const [selectedItemForClaim, setSelectedItemForClaim] = useState(null);
  const [unlockedBadge, setUnlockedBadge] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [aiMatchData, setAiMatchData] = useState(null);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      const fetchedItems = await api.getItems();
      setItems(fetchedItems);
      const fetchedNotifs = await api.getNotifications();
      setNotifications(fetchedNotifs);
      const defaultMatch = await api.getAiMatches();
      setAiMatchData(defaultMatch);
    }
    loadData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  const navigateTo = (pageId, params = {}) => {
    setActivePage(pageId);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openMatchForItem = async (item) => {
    if (item && item.id) {
      const liveMatch = await api.getAiMatches(item.id);
      if (liveMatch) {
        setAiMatchData(liveMatch);
      }
    }
    navigateTo('matches');
  };

  // Submit Lost Item (with Reward budget)
  const handleReportLostSubmit = async (newItemData) => {
    const saved = await api.createItem(newItemData);
    setItems([saved, ...items]);
    if (saved && saved.id) {
      const liveMatch = await api.getAiMatches(saved.id);
      if (liveMatch) setAiMatchData(liveMatch);
    }
    showToast(`🚨 Lost report submitted with ₹${saved.rewardBudget || 0} appreciation bounty!`);
    
    const newNotif = {
      id: 'notif-' + Date.now(),
      title: 'Report Active: ' + saved.title,
      message: `Your report is active with ₹${saved.rewardBudget || 0} bounty escrow. AI matching is scanning.`,
      time: 'Just now',
      read: false,
      type: 'system'
    };
    setNotifications([newNotif, ...notifications]);
    navigateTo('dashboard');
  };

  // Submit Found Item
  const handleReportFoundSubmit = async (newItemData) => {
    const saved = await api.createItem(newItemData);
    setItems([saved, ...items]);
    if (saved && saved.id) {
      const liveMatch = await api.getAiMatches(saved.id);
      if (liveMatch) setAiMatchData(liveMatch);
    }
    showToast('🤝 Thank you! Found item published. Citizenship karma credited.');

    const newNotif = {
      id: 'notif-' + Date.now(),
      title: 'Found Item Logged: ' + saved.title,
      message: 'Item has been logged. Students looking for this will be alerted.',
      time: 'Just now',
      read: false,
      type: 'reward'
    };
    setNotifications([newNotif, ...notifications]);
    navigateTo('dashboard');
  };

  // Claim confirmed (Step 1)
  const handleConfirmClaim = async (item, details) => {
    const claimRes = await api.submitClaim(item.id, details.studentId, details.proofAnswer);
    const statusLabel = claimRes.status === 'approved' ? 'Auto-Approved (Answer Matched!)' : 'Pending Verification';
    showToast(`🛡️ Claim ${statusLabel} for "${item.title}"!`);
    const newNotif = {
      id: claimRes.id || ('notif-' + Date.now()),
      title: `Claim ${statusLabel}: ${item.title}`,
      message: claimRes.status === 'approved'
        ? 'Your verification answer matched! Proceed to physical handover.'
        : 'Custodian received your secret verification note. Complete physical handover at the desk.',
      time: 'Just now',
      read: false,
      type: 'system'
    };
    setNotifications([newNotif, ...notifications]);
  };

  // Handover Completed & Reward Released (Step 2)
  const handleCompleteHandover = async (item, { declineReward }) => {
    const res = await api.creditReward({
      reward_id: 'REW-' + Date.now().toString().slice(-4),
      verified_handover: true,
      declined_reward: declineReward,
      duration_hours: 8
    });

    if (declineReward) {
      showToast('💖 Verified return completed! Selfless Soul honor awarded.');
    } else {
      showToast(`🎉 Return verified! ₹${item.rewardAmount || 100} credited to finder's FindIt Wallet.`);
    }

    // Check if new badges unlocked
    if (res.newly_unlocked_badges && res.newly_unlocked_badges.length > 0) {
      setUnlockedBadge(res.newly_unlocked_badges[0]);
    }

    const notif = {
      id: 'notif-' + Date.now(),
      title: declineReward ? '💖 Selfless Return Verified' : '💰 Reward Credited!',
      message: declineReward
        ? 'Verified return completed without accepting reward. Selfless Soul badge awarded!'
        : `₹${item.rewardAmount || 100} has been added to your FindIt Rewards Wallet.`,
      time: 'Just now',
      read: false,
      type: 'wallet'
    };
    setNotifications([notif, ...notifications]);
  };

  // Mark all notifications read
  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read.');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        activePage={activePage}
        setActivePage={navigateTo}
        unreadCount={unreadCount}
        toggleNotifications={() => setIsNotifOpen(!isNotifOpen)}
      />

      {/* Floating Notification Drawer */}
      <Notification
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onViewMatch={() => {
          setIsNotifOpen(false);
          navigateTo('matches');
        }}
        onMarkAllRead={handleMarkAllRead}
      />

      {/* Main Page Content */}
      <main className="main-content">
        {activePage === 'home' && (
          <Home
            items={items}
            navigateTo={navigateTo}
            onSelectRecent={(item) => setSelectedItemForDetail(item)}
            onClaimItem={(item) => setSelectedItemForClaim(item)}
            onViewMatch={(item) => openMatchForItem(item)}
          />
        )}

        {activePage === 'dashboard' && (
          <Dashboard
            items={items}
            navigateTo={navigateTo}
            onSelectDetail={(item) => setSelectedItemForDetail(item)}
            onViewMatch={(item) => openMatchForItem(item)}
            onClaimItem={(item) => setSelectedItemForClaim(item)}
          />
        )}

        {activePage === 'wallet' && (
          <WalletDashboard
            navigateTo={navigateTo}
          />
        )}

        {activePage === 'gograb' && (
          <GoGrabRedeem
            navigateTo={navigateTo}
            onRedemptionSuccess={(res) => {
              showToast(`🥤 Vending token ${res.redemption.redemption_token} generated!`);
            }}
          />
        )}

        {activePage === 'achievements' && (
          <Achievements
            onTriggerReturnSimulation={(res) => {
              if (res.newly_unlocked_badges && res.newly_unlocked_badges.length > 0) {
                setUnlockedBadge(res.newly_unlocked_badges[0]);
              } else {
                showToast(`⚡ Verified return simulated! Total handovers: ${res.verified_returns_total}`);
              }
            }}
          />
        )}

        {activePage === 'report-lost' && (
          <ReportLost
            onSubmit={handleReportLostSubmit}
            onCancel={() => navigateTo('home')}
            navigateTo={navigateTo}
          />
        )}

        {activePage === 'report-found' && (
          <ReportFound
            onSubmit={handleReportFoundSubmit}
            onCancel={() => navigateTo('home')}
            navigateTo={navigateTo}
          />
        )}

        {activePage === 'browse' && (
          <BrowseItems
            items={items}
            initialQuery={pageParams.query || ''}
            onSelectItem={(item) => setSelectedItemForDetail(item)}
            onClaimItem={(item) => setSelectedItemForClaim(item)}
            onViewMatch={(item) => openMatchForItem(item)}
            navigateTo={navigateTo}
          />
        )}

        {activePage === 'matches' && (
          <MatchResults
            matchData={aiMatchData}
            onRequestClaim={(foundItem) => setSelectedItemForClaim(foundItem)}
            navigateTo={navigateTo}
          />
        )}
      </main>

      {/* Global Modals */}
      <ItemDetailModal
        item={selectedItemForDetail}
        isOpen={!!selectedItemForDetail}
        onClose={() => setSelectedItemForDetail(null)}
        onClaim={(item) => setSelectedItemForClaim(item)}
        onViewMatch={(item) => openMatchForItem(item)}
      />

      <ClaimModal
        item={selectedItemForClaim}
        isOpen={!!selectedItemForClaim}
        onClose={() => setSelectedItemForClaim(null)}
        onConfirmClaim={handleConfirmClaim}
        onCompleteHandover={handleCompleteHandover}
      />

      {/* Badge Celebration Unlocked Modal */}
      <BadgeUnlockedModal
        badge={unlockedBadge}
        isOpen={!!unlockedBadge}
        onClose={() => setUnlockedBadge(null)}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="toast-banner">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        background: '#ffffff',
        padding: '24px 20px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--text-main)' }}>
            <span>FindIt.ai</span>
            <span>•</span>
            <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Smart Campus Lost & Found + GoGrab Rewards</span>
          </div>
          <div>
            Honest Item Returns Rewarded • Powered by AI Vision & GoGrab Smart Vending
          </div>
        </div>
      </footer>
    </div>
  );
}
