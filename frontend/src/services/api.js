/**
 * FindIt AI - Extended API Service Layer
 * Coordinates Rewards Wallet, GoGrab Vending Machine Redemptions, and Appreciation Badges.
 * Seamlessly connects to live backend (/api/...) and falls back to rich local state if offline.
 */

const API_BASE_URL = 'http://localhost:8000';
const USE_MOCK_FALLBACK = true;
const CURRENT_USER_ID = 'student-24bce1042';

function mapBackendItemToFrontend(it) {
  return {
    ...it,
    imageUrl: it.image_url || it.imageUrl || '',
    contactName: it.reporter_name || it.contactName || 'Campus Student',
    contactRoll: it.contactRoll || '24BCE1042',
    hasMatch: it.hasMatch !== undefined ? it.hasMatch : true,
    rewardBudget: it.rewardBudget !== undefined ? it.rewardBudget : 100,
    enableReward: true,
    secretDetail: it.verification_question || it.secretDetail || 'Verified at Campus Desk'
  };
}

async function imageUrlToBlob(imageUrl) {
  if (!imageUrl) return null;
  try {
    const res = await fetch(imageUrl);
    return await res.blob();
  } catch (e) {
    return null;
  }
}

// ----------------------------------------------------------------------
// INITIAL SEED STATE
// ----------------------------------------------------------------------
const INITIAL_WALLET = {
  id: 'wallet-01',
  user_id: CURRENT_USER_ID,
  available_balance: 150.00,
  total_earned: 250.00,
  total_redeemed: 100.00,
  pending_rewards: 100.00,
  currency: 'INR',
  currency_symbol: '₹',
  updated_at: new Date().toISOString()
};

const INITIAL_TRANSACTIONS = [
  {
    id: 'TXN-904128',
    wallet_id: 'wallet-01',
    transaction_type: 'reward_credited',
    amount: 150.00,
    reference_id: 'REW-101',
    description: 'Reward credited for verified return of "Boat Rockerz Headphones" at Library Desk',
    status: 'completed',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'TXN-881245',
    wallet_id: 'wallet-01',
    transaction_type: 'reward_redeemed',
    amount: 100.00,
    reference_id: 'RED-552',
    description: 'GoGrab Vending Machine #01 (Snickers Bar & Cold Coffee)',
    status: 'completed',
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'TXN-762910',
    wallet_id: 'wallet-01',
    transaction_type: 'pending_reward',
    amount: 100.00,
    reference_id: 'REW-102',
    description: 'Pending verification for "Navy Blue Dell Laptop Bag"',
    status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString()
  }
];

const INITIAL_BADGES = [
  { id: 'badge-first-finder', badge_name: 'First Finder', description: 'Completed 1 verified item return on campus.', icon: '🌱', category: 'milestone', return_threshold: 1 },
  { id: 'badge-helping-hand', badge_name: 'Helping Hand', description: 'Completed 3 verified item returns.', icon: '🤝', category: 'milestone', return_threshold: 3 },
  { id: 'badge-campus-hero', badge_name: 'Campus Hero', description: 'Completed 5 verified item returns.', icon: '🏅', category: 'milestone', return_threshold: 5 },
  { id: 'badge-guardian', badge_name: 'Guardian of Goodness', description: 'Completed 10 verified item returns.', icon: '💎', category: 'milestone', return_threshold: 10 },
  { id: 'badge-kindness-champ', badge_name: 'Kindness Champion', description: 'Completed 15 verified item returns.', icon: '❤️', category: 'milestone', return_threshold: 15 },
  { id: 'badge-legend-honesty', badge_name: 'Legend of Honesty', description: 'Completed 25 verified item returns.', icon: '👑', category: 'milestone', return_threshold: 25 },
  { id: 'badge-sharp-eye', badge_name: 'Sharp Eye', description: 'Submitted a high-quality found-item report with clear visual tags.', icon: '🔍', category: 'special', return_threshold: 0, criteria: 'High-quality image + detailed tags' },
  { id: 'badge-selfless-soul', badge_name: 'Selfless Soul', description: 'Completed a verified return without accepting a monetary reward.', icon: '💖', category: 'special', return_threshold: 0, criteria: 'Declined reward upon handover' },
  { id: 'badge-quick-helper', badge_name: 'Quick Helper', description: 'Completed a verified return within 24 hours of report.', icon: '⚡', category: 'special', return_threshold: 0, criteria: 'Return completed in < 24 hours' },
  { id: 'badge-community-star', badge_name: 'Community Star', description: 'Received verified appreciation acknowledgements from peers.', icon: '🌟', category: 'special', return_threshold: 0, criteria: '3+ positive feedback notes' }
];

const INITIAL_ACHIEVEMENTS = [
  { badge_id: 'badge-first-finder', earned_at: new Date(Date.now() - 86400000 * 5).toISOString() },
  { badge_id: 'badge-helping-hand', earned_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { badge_id: 'badge-sharp-eye', earned_at: new Date(Date.now() - 86400000 * 4).toISOString() }
];

// GoGrab Vending Machine Catalog Mock
export const GOGRAB_CATALOG = [
  { id: 'gograb-01', name: 'Amul Kool Cold Coffee (200ml)', price: 40, category: 'Beverage', image: '☕' },
  { id: 'gograb-02', name: 'Snickers Almond Chocolate Bar', price: 50, category: 'Snack', image: '🍫' },
  { id: 'gograb-03', name: 'Lay\'s India\'s Magic Masala (50g)', price: 20, category: 'Chips', image: '🥔' },
  { id: 'gograb-04', name: 'Raw Pressery Tender Coconut Water', price: 60, category: 'Beverage', image: '🥥' },
  { id: 'gograb-05', name: 'RiteBite Max Protein Bar (Choco Slim)', price: 80, category: 'Fitness', image: '💪' },
  { id: 'gograb-06', name: 'Red Bull Energy Drink (250ml)', price: 125, category: 'Energy', image: '⚡' },
  { id: 'gograb-07', name: 'Paper Boat Aam Panna (250ml)', price: 35, category: 'Beverage', image: '🥭' },
  { id: 'gograb-08', name: 'Oreo Original Cream Biscuits', price: 30, category: 'Snack', image: '🍪' }
];

// Helper local storage functions
function getStored(key, defaultVal) {
  try {
    const val = localStorage.getItem('findit_' + key);
    return val ? JSON.parse(val) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setStored(key, val) {
  try {
    localStorage.setItem('findit_' + key, JSON.stringify(val));
  } catch (e) {}
}

export const api = {
  // -------------------------------------------------------------------
  // WALLET & REWARDS APIs
  // -------------------------------------------------------------------

  async getWallet() {
    try {
      const res = await fetch(`${API_BASE_URL}/wallet`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return getStored('wallet', INITIAL_WALLET);
  },

  async getWalletBalance() {
    try {
      const res = await fetch(`${API_BASE_URL}/wallet/balance`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const w = getStored('wallet', INITIAL_WALLET);
    return {
      available_balance: w.available_balance,
      pending_rewards: w.pending_rewards,
      currency: 'INR',
      currency_symbol: '₹'
    };
  },

  async getWalletTransactions() {
    try {
      const res = await fetch(`${API_BASE_URL}/wallet/transactions`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return getStored('transactions', INITIAL_TRANSACTIONS);
  },

  async createReward(itemId, rewardAmount) {
    try {
      const res = await fetch(`${API_BASE_URL}/rewards/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, reward_amount: rewardAmount })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      success: true,
      reward: {
        id: 'REW-' + Date.now().toString().slice(-6),
        item_id: itemId,
        reward_amount: parseFloat(rewardAmount) || 0,
        status: 'offered'
      }
    };
  },

  async creditReward({ reward_id, finder_id = CURRENT_USER_ID, verified_handover = true, declined_reward = false, duration_hours = 12 }) {
    try {
      const res = await fetch(`${API_BASE_URL}/rewards/credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reward_id, finder_id, verified_handover, declined_reward, duration_hours })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Fallback simulation
    const wallet = getStored('wallet', INITIAL_WALLET);
    const txns = getStored('transactions', INITIAL_TRANSACTIONS);
    const achievements = getStored('achievements', INITIAL_ACHIEVEMENTS);
    const returnsCount = (getStored('verified_returns', 4)) + 1;
    setStored('verified_returns', returnsCount);

    let creditedTxn = null;
    let newBadges = [];

    if (!declined_reward) {
      const creditAmt = 100.00;
      wallet.available_balance += creditAmt;
      wallet.total_earned += creditAmt;
      if (wallet.pending_rewards >= creditAmt) {
        wallet.pending_rewards -= creditAmt;
      }
      setStored('wallet', wallet);

      creditedTxn = {
        id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
        wallet_id: wallet.id,
        transaction_type: 'reward_credited',
        amount: creditAmt,
        reference_id: reward_id || 'HANDOVER-VERIFIED',
        description: 'FindIt Reward credited for verified return of campus item',
        status: 'completed',
        created_at: new Date().toISOString()
      };
      txns.unshift(creditedTxn);
      setStored('transactions', txns);
    }

    // Check Milestone badges
    const earnedIds = new Set(achievements.map(a => a.badge_id));
    INITIAL_BADGES.filter(b => b.category === 'milestone').forEach(b => {
      if (returnsCount >= b.return_threshold && !earnedIds.has(b.id)) {
        const ach = { badge_id: b.id, earned_at: new Date().toISOString() };
        achievements.push(ach);
        earnedIds.add(b.id);
        newBadges.push(b);
      }
    });

    if (declined_reward && !earnedIds.has('badge-selfless-soul')) {
      const b = INITIAL_BADGES.find(x => x.id === 'badge-selfless-soul');
      achievements.push({ badge_id: b.id, earned_at: new Date().toISOString() });
      newBadges.push(b);
    } else if (duration_hours < 24 && !earnedIds.has('badge-quick-helper')) {
      const b = INITIAL_BADGES.find(x => x.id === 'badge-quick-helper');
      achievements.push({ badge_id: b.id, earned_at: new Date().toISOString() });
      newBadges.push(b);
    }
    setStored('achievements', achievements);

    return {
      success: true,
      wallet,
      transaction: creditedTxn,
      verified_returns_total: returnsCount,
      newly_unlocked_badges: newBadges
    };
  },

  // -------------------------------------------------------------------
  // GOGRAB REDEMPTION APIS
  // -------------------------------------------------------------------

  async redeemWallet({ purchase_amount, wallet_amount_to_use, items }) {
    try {
      const res = await fetch(`${API_BASE_URL}/wallet/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchase_amount, wallet_amount_to_use, items })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Fallback simulation
    const wallet = getStored('wallet', INITIAL_WALLET);
    const txns = getStored('transactions', INITIAL_TRANSACTIONS);

    const total = parseFloat(purchase_amount);
    const useWallet = parseFloat(wallet_amount_to_use);

    if (useWallet > wallet.available_balance) {
      throw new Error(`Insufficient wallet balance. Available: ₹${wallet.available_balance}`);
    }

    const remainingUpi = Math.max(0, total - useWallet);
    wallet.available_balance -= useWallet;
    wallet.total_redeemed += useWallet;
    setStored('wallet', wallet);

    const token = 'GOGRAB-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const txn = {
      id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
      wallet_id: wallet.id,
      transaction_type: 'reward_redeemed',
      amount: useWallet,
      reference_id: token,
      description: `GoGrab Vending: ${items.map(i => i.name).join(', ')}`,
      status: 'completed',
      created_at: new Date().toISOString()
    };
    txns.unshift(txn);
    setStored('transactions', txns);

    const redemption = {
      id: 'RED-' + Math.floor(100 + Math.random() * 900),
      user_id: CURRENT_USER_ID,
      transaction_id: txn.id,
      redemption_token: token,
      purchase_amount: total,
      wallet_amount_used: useWallet,
      remaining_upi_amount: remainingUpi,
      status: 'issued',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      item_summary: items,
      created_at: new Date().toISOString()
    };

    return {
      success: true,
      redemption,
      updated_wallet: wallet,
      transaction: txn
    };
  },

  async validateRedemption(token) {
    try {
      const res = await fetch(`${API_BASE_URL}/wallet/validate-redemption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redemption_token: token })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return {
      success: true,
      message: 'Token validated successfully! GoGrab Vending Machine dispensing items.'
    };
  },

  // -------------------------------------------------------------------
  // BADGES & ACHIEVEMENTS APIS
  // -------------------------------------------------------------------

  async getBadges() {
    try {
      const res = await fetch(`${API_BASE_URL}/badges`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return INITIAL_BADGES;
  },

  async getUserAchievements(userId = CURRENT_USER_ID) {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/achievements`);
      if (res.ok) return await res.json();
    } catch (e) {}

    const achs = getStored('achievements', INITIAL_ACHIEVEMENTS);
    return achs.map(a => {
      const def = INITIAL_BADGES.find(b => b.id === a.badge_id);
      return { ...def, earned_at: a.earned_at };
    });
  },

  async getUserProgress(userId = CURRENT_USER_ID) {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/progress`);
      if (res.ok) return await res.json();
    } catch (e) {}

    const count = getStored('verified_returns', 4);
    const milestones = INITIAL_BADGES.filter(b => b.category === 'milestone').sort((a,b) => a.return_threshold - b.return_threshold);
    const nextBadge = milestones.find(b => b.return_threshold > count) || null;

    return {
      user_id: userId,
      verified_returns: count,
      next_badge: nextBadge,
      progress_to_next: nextBadge ? Math.min(100, Math.round((count / nextBadge.return_threshold) * 100)) : 100
    };
  },

  // -------------------------------------------------------------------
  // EXISTING ITEMS & MATCHES APIS
  // -------------------------------------------------------------------

  async getItems() {
    try {
      const res = await fetch(`${API_BASE_URL}/items`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map(mapBackendItemToFrontend);
        }
      }
    } catch (e) {}
    return getStored('items', [
      {
        id: 'item-101',
        type: 'lost',
        title: 'Navy Blue Dell Laptop Bag',
        category: 'Bags & Backpacks',
        date: '2026-11-12',
        location: 'Central Library, 2nd Floor',
        description: 'Dark blue backpack with padded straps. Has a red metal carabiner on the side loop and Dell logo embossed on front.',
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
        contactName: 'Aarav Sharma',
        contactRoll: '24BCE1042',
        status: 'matching',
        hasMatch: true,
        rewardBudget: 100,
        enableReward: true,
        secretDetail: 'Carabiner on left pocket + scientific calculator in front zip'
      },
      {
        id: 'item-102',
        type: 'found',
        title: 'Navy Dell Backpack with Cables',
        category: 'Bags & Backpacks',
        date: '2026-11-12',
        location: 'Central Library, Reading Hall B',
        description: 'Found unattended at desk 14. Deep navy blue color with Dell branding. Handed over to library reception desk.',
        imageUrl: 'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?auto=format&fit=crop&w=600&q=80',
        contactName: 'Pooja Verma (Librarian)',
        contactRoll: 'STAFF-LIB-04',
        status: 'available',
        hasMatch: true,
        rewardBudget: 100,
        secretDetail: 'Held at Circulation Desk #2'
      },
      {
        id: 'item-103',
        type: 'found',
        title: 'Student ID Card - CSE 2nd Year',
        category: 'Cards & IDs',
        date: '2026-11-13',
        location: 'Campus Canteen, Near Counter 3',
        description: 'University smart ID card with lanyard. Name begins with "R. Kumar", Department of Computer Science.',
        imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
        status: 'available',
        hasMatch: false
      },
      {
        id: 'item-104',
        type: 'found',
        title: 'AirPods Pro Gen 2 Case',
        category: 'Electronics',
        date: '2026-11-11',
        location: 'Indoor Sports Complex - Gym',
        description: 'Glossy white charging case with subtle scratch near hinge. Turned into sports office equipment room.',
        imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=600&q=80',
        status: 'available',
        hasMatch: false
      },
      {
        id: 'item-105',
        type: 'lost',
        title: 'Casio Scientific Calculator fx-991EX',
        category: 'Stationery',
        date: '2026-11-12',
        location: 'Block C, Room 304 (Math Lecture)',
        description: 'ClassWiz model with protective slide cover. Small yellow sticker with initials "AS" on the backside.',
        imageUrl: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=600&q=80',
        status: 'active',
        rewardBudget: 50,
        enableReward: true,
        hasMatch: false
      },
      {
        id: 'item-106',
        type: 'found',
        title: 'Dorm Key Set with Batman Keychain',
        category: 'Keys',
        date: '2026-11-10',
        location: 'Hostel Block 4 Walkway',
        description: 'Three brass keys on a black metallic keyring with a black and yellow Batman logo charm.',
        imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80',
        status: 'available',
        hasMatch: false
      }
    ]);
  },

  async createItem(item) {
    try {
      const formData = new FormData();
      formData.append('type', item.type || 'lost');
      formData.append('title', item.title || '');
      formData.append('description', item.description || '');
      formData.append('category', item.category || '');
      formData.append('location', item.location || '');
      formData.append('date', item.date || new Date().toISOString().split('T')[0]);
      formData.append('reporter_name', item.contactName || 'Aarav Sharma');
      if (item.type === 'found') {
        formData.append('verification_question', item.verification_question || 'What identifying detail or sticker is on this item?');
        formData.append('verification_answer', item.verification_answer || item.secretDetail || '');
      }
      const blob = await imageUrlToBlob(item.imageUrl);
      if (blob) {
        formData.append('image', blob, 'upload.jpg');
      }
      const res = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const created = await res.json();
        return mapBackendItemToFrontend({
          ...item,
          ...created,
          hasMatch: true
        });
      }
    } catch (e) {}

    const items = await this.getItems();
    const newItem = {
      ...item,
      id: 'item-' + Date.now(),
      status: item.type === 'lost' ? 'active' : 'available',
      hasMatch: true
    };
    items.unshift(newItem);
    setStored('items', items);
    return newItem;
  },

  async submitClaim(itemId, claimantName, answer) {
    try {
      const res = await fetch(`${API_BASE_URL}/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: itemId,
          claimant_name: claimantName || 'Aarav Sharma',
          answer: answer || ''
        })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    return { id: 'claim-' + Date.now(), status: 'pending' };
  },

  async getAiMatches(targetItemId = 'lost-wallet-fossil') {
    try {
      const itemRes = await fetch(`${API_BASE_URL}/items/${targetItemId}`);
      const matchRes = await fetch(`${API_BASE_URL}/matches/${targetItemId}`);
      if (itemRes.ok && matchRes.ok) {
        const queryItem = await itemRes.json();
        const matches = await matchRes.json();
        if (Array.isArray(matches) && matches.length > 0) {
          const best = matches[0];
          const matchedItem = best.item;
          const isQueryLost = queryItem.type === 'lost';
          const lostRaw = isQueryLost ? queryItem : matchedItem;
          const foundRaw = isQueryLost ? matchedItem : queryItem;
          const b = best.breakdown || {};
          const scorePct = Math.round((best.score || 0.88) * 100);
          const confLabel = best.confidence === 'high' ? 'High Confidence' : (best.confidence === 'medium' ? 'Medium Confidence' : 'Low Confidence');

          return {
            matchFound: true,
            similarityScore: scorePct,
            confidenceTier: confLabel,
            status: 'Ready for Student Claim',
            rewardAmount: 100,
            rewardOffered: true,
            allMatches: matches,
            lostItem: {
              id: lostRaw.id,
              title: lostRaw.title,
              category: lostRaw.category,
              location: lostRaw.location,
              date: lostRaw.date,
              imageUrl: lostRaw.image_url,
              reportedBy: lostRaw.reporter_name || 'Student Reporter',
              description: lostRaw.description
            },
            foundItem: {
              id: foundRaw.id,
              title: foundRaw.title,
              category: foundRaw.category,
              location: foundRaw.location,
              date: foundRaw.date,
              imageUrl: foundRaw.image_url,
              custodian: foundRaw.location || 'Campus Desk',
              foundBy: foundRaw.reporter_name || 'Campus Finder',
              description: foundRaw.description,
              verification_question: foundRaw.verification_question
            },
            matchBreakdown: [
              { label: 'Image Embedding Similarity (CLIP / Vision)', score: Math.round((b.image || 0) * 100), detail: '512-dim L2-normalized visual cosine similarity' },
              { label: 'Cross-Modal Text Description Match', score: Math.round((b.text || 0) * 100), detail: 'Semantic alignment between text description and item visuals' },
              { label: 'Category & Color Consistency', score: Math.round((b.category || 0) * 100), detail: `Category (${foundRaw.category}) and color (${foundRaw.color || 'matched'}) alignment` },
              { label: 'Location & Time Proximity', score: Math.round((((b.location || 0) * 0.67) + ((b.time || 0) * 0.33)) * 100), detail: `Location (${foundRaw.location}) and date (${foundRaw.date}) correlation` },
              { label: 'Vision LLM Re-Ranking Score', score: Math.round((b.llm || 0) * 100), detail: best.reason || 'Fine-grained visual verification across top candidates' }
            ],
            aiExplanation: best.reason || 'Matched via hybrid visual embeddings, metadata correlation, and vision re-ranking.'
          };
        }
      }
    } catch (e) {}

    return {
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
  },

  async getNotifications() {
    const defaultNotifs = [
      {
        id: 'notif-1',
        title: '🎯 High Confidence AI Match!',
        message: 'AI found an 88% similarity match for "Black Leather Fossil Wallet" at Main Library 2nd Floor Desk!',
        time: 'Just now',
        read: false,
        type: 'match'
      },
      {
        id: 'notif-2',
        title: '💰 FindIt Reward Credited!',
        message: '₹150 has been credited to your Rewards Wallet for verified return of headphones at Library.',
        time: '2 hours ago',
        read: false,
        type: 'wallet'
      },
      {
        id: 'notif-3',
        title: '🏆 Achievement Unlocked: Helping Hand',
        message: 'Congratulations! You have completed 3 verified item returns on campus.',
        time: '1 day ago',
        read: true,
        type: 'badge'
      }
    ];
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`);
      if (res.ok) {
        const backendNotifs = await res.json();
        if (Array.isArray(backendNotifs) && backendNotifs.length > 0) {
          const mapped = backendNotifs.slice(0, 5).map(n => ({
            id: n.id,
            title: '🎯 Live AI Match Notification',
            message: n.message,
            time: 'Live from Backend',
            read: Boolean(n.read),
            type: 'match'
          }));
          return [...mapped, ...defaultNotifs];
        }
      }
    } catch (e) {}
    return defaultNotifs;
  }
};
