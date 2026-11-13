import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const BASE_DIR = __dirname;

// In-Memory Database State (Persisted during server runtime)
const DEFAULT_USER_ID = 'student-24bce1042';

// 1. Wallets Store
const wallets = {
  [DEFAULT_USER_ID]: {
    id: 'wallet-01',
    user_id: DEFAULT_USER_ID,
    available_balance: 150.00,
    total_earned: 250.00,
    total_redeemed: 100.00,
    pending_rewards: 100.00,
    currency: 'INR',
    updated_at: new Date().toISOString()
  }
};

// 2. Transactions Store
const wallet_transactions = [
  {
    id: 'TXN-904128',
    wallet_id: 'wallet-01',
    transaction_type: 'reward_credited',
    amount: 150.00,
    reference_id: 'REW-101',
    description: 'Reward credited for verified return of "Boat Rockerz Headphones" at Library',
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

// 3. Rewards Escrow Store
const rewards = [
  {
    id: 'REW-101',
    owner_id: 'student-24ece0819',
    finder_id: DEFAULT_USER_ID,
    item_id: 'item-106',
    reward_amount: 150.00,
    status: 'credited',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    completed_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'REW-102',
    owner_id: 'student-aarav',
    finder_id: 'student-pooja',
    item_id: 'item-101',
    reward_amount: 100.00,
    status: 'pending_handover',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    completed_at: null
  }
];

// 4. Redemptions Store
const reward_redemptions = [
  {
    id: 'RED-552',
    user_id: DEFAULT_USER_ID,
    transaction_id: 'TXN-881245',
    redemption_token: 'GOGRAB-TK-8812',
    purchase_amount: 140.00,
    wallet_amount_used: 100.00,
    remaining_upi_amount: 40.00,
    status: 'dispensed',
    vending_machine_id: 'GOGRAB-VM-CAMPUS-01',
    item_summary: [
      { name: 'Cold Coffee 250ml', qty: 1, price: 50 },
      { name: 'Snickers Almond', qty: 2, price: 45 }
    ],
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

// 5. Badge Definitions
const badge_definitions = [
  { id: 'badge-first-finder', badge_name: 'First Finder', description: 'Completed 1 verified item return on campus.', icon: '🌱', category: 'milestone', return_threshold: 1 },
  { id: 'badge-helping-hand', badge_name: 'Helping Hand', description: 'Completed 3 verified item returns.', icon: '🤝', category: 'milestone', return_threshold: 3 },
  { id: 'badge-campus-hero', badge_name: 'Campus Hero', description: 'Completed 5 verified item returns.', icon: '🏅', category: 'milestone', return_threshold: 5 },
  { id: 'badge-guardian', badge_name: 'Guardian of Goodness', description: 'Completed 10 verified item returns.', icon: '💎', category: 'milestone', return_threshold: 10 },
  { id: 'badge-kindness-champ', badge_name: 'Kindness Champion', description: 'Completed 15 verified item returns.', icon: '❤️', category: 'milestone', return_threshold: 15 },
  { id: 'badge-legend-honesty', badge_name: 'Legend of Honesty', description: 'Completed 25 verified item returns.', icon: '👑', category: 'milestone', return_threshold: 25 },
  // Special Badges
  { id: 'badge-sharp-eye', badge_name: 'Sharp Eye', description: 'Submitted a high-quality found-item report with clear visual tags.', icon: '🔍', category: 'special', return_threshold: 0, criteria: 'High-quality image + detailed description' },
  { id: 'badge-selfless-soul', badge_name: 'Selfless Soul', description: 'Completed a verified return without accepting a monetary reward.', icon: '💖', category: 'special', return_threshold: 0, criteria: 'Declined reward upon handover' },
  { id: 'badge-quick-helper', badge_name: 'Quick Helper', description: 'Completed a verified return within 24 hours of report.', icon: '⚡', category: 'special', return_threshold: 0, criteria: 'Return completed in < 24 hours' },
  { id: 'badge-community-star', badge_name: 'Community Star', description: 'Received verified appreciation acknowledgements from peers.', icon: '🌟', category: 'special', return_threshold: 0, criteria: '3+ positive feedback notes' }
];

// 6. User Achievements Store
const user_achievements = {
  [DEFAULT_USER_ID]: [
    { badge_id: 'badge-first-finder', earned_at: new Date(Date.now() - 86400000 * 5).toISOString() },
    { badge_id: 'badge-helping-hand', earned_at: new Date(Date.now() - 86400000 * 2).toISOString() },
    { badge_id: 'badge-sharp-eye', earned_at: new Date(Date.now() - 86400000 * 4).toISOString() }
  ]
};

// User stats
const user_stats = {
  [DEFAULT_USER_ID]: {
    verified_returns: 4
  }
};

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.jsx': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Helper to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Check and award badges based on verified returns
function checkAndAwardBadges(userId, isSpecial = null) {
  const currentAchievements = user_achievements[userId] || [];
  const earnedBadgeIds = new Set(currentAchievements.map(a => a.badge_id));
  const returnsCount = user_stats[userId]?.verified_returns || 0;
  const newlyUnlocked = [];

  // Check milestones
  badge_definitions.filter(b => b.category === 'milestone').forEach(b => {
    if (returnsCount >= b.return_threshold && !earnedBadgeIds.has(b.id)) {
      const ach = { badge_id: b.id, earned_at: new Date().toISOString() };
      currentAchievements.push(ach);
      earnedBadgeIds.add(b.id);
      newlyUnlocked.push(b);
    }
  });

  // Check special triggers
  if (isSpecial && !earnedBadgeIds.has(isSpecial)) {
    const specialBadge = badge_definitions.find(b => b.id === isSpecial);
    if (specialBadge) {
      currentAchievements.push({ badge_id: specialBadge.id, earned_at: new Date().toISOString() });
      newlyUnlocked.push(specialBadge);
    }
  }

  user_achievements[userId] = currentAchievements;
  return newlyUnlocked;
}

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // JSON responder helper
  const jsonResponse = (statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
  };

  // -------------------------------------------------------------------
  // BACKEND REST API ENDPOINTS
  // -------------------------------------------------------------------

  // GET /api/wallet or /wallet
  if ((pathname === '/api/wallet' || pathname === '/wallet') && req.method === 'GET') {
    const wallet = wallets[DEFAULT_USER_ID];
    return jsonResponse(200, {
      ...wallet,
      currency_symbol: '₹'
    });
  }

  // GET /api/wallet/balance or /wallet/balance
  if ((pathname === '/api/wallet/balance' || pathname === '/wallet/balance') && req.method === 'GET') {
    const wallet = wallets[DEFAULT_USER_ID];
    return jsonResponse(200, {
      available_balance: wallet.available_balance,
      pending_rewards: wallet.pending_rewards,
      currency: 'INR',
      currency_symbol: '₹'
    });
  }

  // GET /api/wallet/transactions or /wallet/transactions
  if ((pathname === '/api/wallet/transactions' || pathname === '/wallet/transactions') && req.method === 'GET') {
    const userWallet = wallets[DEFAULT_USER_ID];
    const txns = wallet_transactions.filter(t => t.wallet_id === userWallet.id);
    return jsonResponse(200, txns);
  }

  // POST /api/rewards/create or /rewards/create
  if ((pathname === '/api/rewards/create' || pathname === '/rewards/create') && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { item_id, reward_amount } = body;
      const amount = parseFloat(reward_amount) || 0;

      const newReward = {
        id: 'REW-' + Date.now().toString().slice(-6),
        owner_id: DEFAULT_USER_ID,
        finder_id: null,
        item_id: item_id || 'item-unknown',
        reward_amount: amount,
        status: 'offered',
        created_at: new Date().toISOString(),
        completed_at: null
      };
      rewards.push(newReward);
      return jsonResponse(201, { success: true, reward: newReward });
    } catch (err) {
      return jsonResponse(400, { error: 'Invalid JSON request' });
    }
  }

  // POST /api/rewards/credit or /rewards/credit (Handover completed -> credit finder)
  if ((pathname === '/api/rewards/credit' || pathname === '/rewards/credit') && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { reward_id, finder_id = DEFAULT_USER_ID, verified_handover, declined_reward = false, duration_hours = 12 } = body;

      // Rule: Reward must not be credited before successful handover verification
      if (!verified_handover) {
        return jsonResponse(400, {
          error: 'Security Exception: Cannot credit reward before successful verified handover verification.'
        });
      }

      const reward = rewards.find(r => r.id === reward_id);
      if (reward && reward.status === 'credited') {
        // Prevent duplicate reward credits
        return jsonResponse(409, { error: 'Duplicate reward credit rejected: This reward has already been credited.' });
      }

      // Record verified return increment
      user_stats[finder_id] = user_stats[finder_id] || { verified_returns: 0 };
      user_stats[finder_id].verified_returns += 1;

      let creditedTxn = null;
      let targetWallet = wallets[finder_id];
      if (!targetWallet) {
        targetWallet = {
          id: 'wallet-' + finder_id,
          user_id: finder_id,
          available_balance: 0,
          total_earned: 0,
          total_redeemed: 0,
          pending_rewards: 0,
          currency: 'INR'
        };
        wallets[finder_id] = targetWallet;
      }

      if (declined_reward) {
        if (reward) reward.status = 'declined';
      } else {
        const creditAmount = reward ? reward.reward_amount : (body.amount || 100);
        targetWallet.available_balance += creditAmount;
        targetWallet.total_earned += creditAmount;
        if (targetWallet.pending_rewards >= creditAmount) {
          targetWallet.pending_rewards -= creditAmount;
        }

        if (reward) {
          reward.status = 'credited';
          reward.completed_at = new Date().toISOString();
        }

        // Unique transaction ID
        creditedTxn = {
          id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
          wallet_id: targetWallet.id,
          transaction_type: 'reward_credited',
          amount: creditAmount,
          reference_id: reward_id || 'HANDOVER-VERIFIED',
          description: `FindIt Reward credited for verified return of campus item`,
          status: 'completed',
          created_at: new Date().toISOString()
        };
        wallet_transactions.unshift(creditedTxn);
      }

      // Check special badge conditions
      let specialBadge = null;
      if (declined_reward) specialBadge = 'badge-selfless-soul';
      else if (duration_hours < 24) specialBadge = 'badge-quick-helper';

      const newlyUnlockedBadges = checkAndAwardBadges(finder_id, specialBadge);

      return jsonResponse(200, {
        success: true,
        message: declined_reward ? 'Verified return recorded! Selfless contribution acknowledged.' : `₹${creditedTxn.amount} successfully credited to FindIt Rewards Wallet!`,
        wallet: targetWallet,
        transaction: creditedTxn,
        verified_returns_total: user_stats[finder_id].verified_returns,
        newly_unlocked_badges: newlyUnlockedBadges
      });
    } catch (err) {
      return jsonResponse(500, { error: err.message });
    }
  }

  // POST /api/wallet/redeem or /wallet/redeem (GoGrab Vending Machine)
  if ((pathname === '/api/wallet/redeem' || pathname === '/wallet/redeem') && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { purchase_amount, wallet_amount_to_use, items: cartItems = [] } = body;
      const totalPurchase = parseFloat(purchase_amount) || 0;
      const requestedWallet = parseFloat(wallet_amount_to_use) || 0;

      const wallet = wallets[DEFAULT_USER_ID];

      // Security rule: Validate wallet balances on the backend, not only on the frontend
      // Rule: Do not allow a user to spend more than their available wallet balance
      if (requestedWallet > wallet.available_balance) {
        return jsonResponse(400, {
          error: `Insufficient Wallet Balance: Requested ₹${requestedWallet.toFixed(2)}, but available balance is only ₹${wallet.available_balance.toFixed(2)}.`
        });
      }

      if (requestedWallet > totalPurchase) {
        return jsonResponse(400, {
          error: 'Invalid Redemption: Wallet deduction cannot exceed total purchase amount.'
        });
      }

      // Calculate partial redemption split
      const remainingUpi = Math.max(0, totalPurchase - requestedWallet);

      // Unique token generation (Expires in 10 minutes)
      const redemptionToken = 'GOGRAB-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const txnId = 'TXN-' + Math.floor(100000 + Math.random() * 900000);

      // Atomic Balance Deduction
      wallet.available_balance -= requestedWallet;
      wallet.total_redeemed += requestedWallet;
      wallet.updated_at = new Date().toISOString();

      // Record transaction
      const txn = {
        id: txnId,
        wallet_id: wallet.id,
        transaction_type: 'reward_redeemed',
        amount: requestedWallet,
        reference_id: redemptionToken,
        description: `GoGrab Vending: ${cartItems.map(i => i.name).join(', ') || 'Campus Snacks'}`,
        status: 'completed',
        created_at: new Date().toISOString()
      };
      wallet_transactions.unshift(txn);

      // Record redemption voucher
      const redemptionRecord = {
        id: 'RED-' + Math.floor(100 + Math.random() * 900),
        user_id: DEFAULT_USER_ID,
        transaction_id: txnId,
        redemption_token: redemptionToken,
        purchase_amount: totalPurchase,
        wallet_amount_used: requestedWallet,
        remaining_upi_amount: remainingUpi,
        status: 'issued',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        item_summary: cartItems,
        created_at: new Date().toISOString()
      };
      reward_redemptions.unshift(redemptionRecord);

      return jsonResponse(200, {
        success: true,
        redemption: redemptionRecord,
        updated_wallet: wallet,
        transaction: txn
      });
    } catch (err) {
      return jsonResponse(500, { error: err.message });
    }
  }

  // POST /api/wallet/validate-redemption or /wallet/validate-redemption (Vending machine validation)
  if ((pathname === '/api/wallet/validate-redemption' || pathname === '/wallet/validate-redemption') && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { redemption_token } = body;
      const record = reward_redemptions.find(r => r.redemption_token === redemption_token);

      if (!record) {
        return jsonResponse(404, { error: 'Invalid or unknown redemption token.' });
      }

      if (record.status === 'dispensed') {
        return jsonResponse(409, { error: 'Duplicate redemption attempt: Token already dispensed.' });
      }

      if (new Date() > new Date(record.expires_at)) {
        record.status = 'expired';
        return jsonResponse(410, { error: 'Redemption token expired.' });
      }

      record.status = 'dispensed';
      record.validated_at = new Date().toISOString();

      return jsonResponse(200, {
        success: true,
        message: 'Token validated successfully! GoGrab Vending Machine dispensing items.',
        redemption: record
      });
    } catch (err) {
      return jsonResponse(500, { error: err.message });
    }
  }

  // GET /api/wallet/redemptions or /wallet/redemptions
  if ((pathname === '/api/wallet/redemptions' || pathname === '/wallet/redemptions') && req.method === 'GET') {
    return jsonResponse(200, reward_redemptions);
  }

  // GET /api/badges or /badges
  if ((pathname === '/api/badges' || pathname === '/badges') && req.method === 'GET') {
    return jsonResponse(200, badge_definitions);
  }

  // GET /api/users/:id/achievements or /users/:id/achievements
  const achievementsMatch = pathname.match(/^\/(?:api\/)?users\/([^/]+)\/achievements$/);
  if (achievementsMatch && req.method === 'GET') {
    const userId = achievementsMatch[1];
    const earned = user_achievements[userId] || [];
    const fullBadges = earned.map(a => {
      const def = badge_definitions.find(b => b.id === a.badge_id);
      return { ...def, earned_at: a.earned_at };
    });
    return jsonResponse(200, fullBadges);
  }

  // GET /api/users/:id/progress or /users/:id/progress
  const progressMatch = pathname.match(/^\/(?:api\/)?users\/([^/]+)\/progress$/);
  if (progressMatch && req.method === 'GET') {
    const userId = progressMatch[1];
    const count = user_stats[userId]?.verified_returns || 0;
    const milestones = badge_definitions.filter(b => b.category === 'milestone').sort((a,b) => a.return_threshold - b.return_threshold);
    const nextBadge = milestones.find(b => b.return_threshold > count) || null;
    return jsonResponse(200, {
      user_id: userId,
      verified_returns: count,
      next_badge: nextBadge,
      progress_to_next: nextBadge ? Math.min(100, Math.round((count / nextBadge.return_threshold) * 100)) : 100
    });
  }

  // -------------------------------------------------------------------
  // STATIC FILE SERVING
  // -------------------------------------------------------------------
  let reqPath = pathname;
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/preview.html';
  }

  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(BASE_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: ${reqPath}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`FindIt AI Portal & Rewards API live at http://127.0.0.1:${PORT}/`);
  console.log(`Serving files from: ${BASE_DIR}`);
});
