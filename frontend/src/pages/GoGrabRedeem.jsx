import React, { useState, useEffect } from 'react';
import { api, GOGRAB_CATALOG } from '../services/api';

export default function GoGrabRedeem({ navigateTo, onRedemptionSuccess }) {
  const [wallet, setWallet] = useState(null);
  const [cart, setCart] = useState({});
  const [useWalletAmount, setUseWalletAmount] = useState(0);
  const [activeToken, setActiveToken] = useState(null);
  const [dispensed, setDispensed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function fetchWallet() {
      const w = await api.getWallet();
      setWallet(w);
    }
    fetchWallet();
  }, []);

  // Calculate cart total
  const cartItems = Object.entries(cart)
    .filter(([_, qty]) => qty > 0)
    .map(([id, qty]) => {
      const item = GOGRAB_CATALOG.find((p) => p.id === id);
      return { ...item, qty, subtotal: item.price * qty };
    });

  const totalPurchase = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const availableBalance = wallet ? wallet.available_balance : 0;

  // Auto-set wallet deduction when cart changes
  useEffect(() => {
    const maxUsable = Math.min(availableBalance, totalPurchase);
    setUseWalletAmount(maxUsable);
  }, [totalPurchase, availableBalance]);

  const remainingUpi = Math.max(0, totalPurchase - useWalletAmount);

  const handleQtyChange = (id, delta) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleGenerateToken = async () => {
    setErrorMsg('');
    if (totalPurchase === 0) {
      setErrorMsg('Please select at least one item from the GoGrab catalogue.');
      return;
    }
    if (useWalletAmount > availableBalance) {
      setErrorMsg(`Wallet amount (₹${useWalletAmount}) cannot exceed your available balance of ₹${availableBalance}.`);
      return;
    }

    setLoading(true);
    try {
      const res = await api.redeemWallet({
        purchase_amount: totalPurchase,
        wallet_amount_to_use: useWalletAmount,
        items: cartItems.map((i) => ({ id: i.id, name: i.name, qty: i.qty, price: i.price }))
      });
      setActiveToken(res.redemption);
      setWallet(res.updated_wallet);
      if (onRedemptionSuccess) onRedemptionSuccess(res);
    } catch (err) {
      setErrorMsg(err.message || 'Redemption failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateDispense = async () => {
    if (!activeToken) return;
    setLoading(true);
    try {
      await api.validateRedemption(activeToken.redemption_token);
      setDispensed(true);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <button
            onClick={() => navigateTo('wallet')}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', marginBottom: '6px' }}
          >
            ← Back to Rewards Wallet
          </button>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            GoGrab Smart Vending Kiosk
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Choose snacks or drinks and pay using your FindIt rewards. Partial wallet + UPI payments supported.
          </p>
        </div>

        {/* Live Wallet Pill */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1.5px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 20px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '1.4rem' }}>💳</span>
          <div>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              Available Wallet Balance
            </span>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#059669' }}>
              ₹{wallet ? wallet.available_balance.toFixed(2) : '0.00'}
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Main Kiosk Area */}
      {dispensed ? (
        /* Dispensed Success Screen */
        <div className="card" style={{ textAlign: 'center', padding: '50px 24px', background: '#ffffff' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '14px' }}>🎉</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#065f46', marginBottom: '8px' }}>
            Items Dispensed Successfully!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', maxWidth: '480px', margin: '0 auto 24px' }}>
            Please collect your snacks from the GoGrab Vending Machine pickup tray. Your FindIt Wallet transaction has been recorded.
          </p>

          <div style={{
            background: 'var(--bg-subtle)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            maxWidth: '380px',
            margin: '0 auto 28px',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Receipt Summary:</p>
            {cartItems.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span>{item.name} × {item.qty}</span>
                <span style={{ fontWeight: 600 }}>₹{item.subtotal}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.88rem' }}>
              <span>Total Paid via Wallet:</span>
              <span style={{ color: '#059669' }}>₹{useWalletAmount.toFixed(2)}</span>
            </div>
            {remainingUpi > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                <span>Paid via Simulated UPI:</span>
                <span>₹{remainingUpi.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={() => navigateTo('wallet')}>
              View Wallet History
            </button>
            <button className="btn btn-primary" onClick={() => {
              setCart({});
              setActiveToken(null);
              setDispensed(false);
            }}>
              Make Another Purchase
            </button>
          </div>
        </div>
      ) : activeToken ? (
        /* Active Redemption Token & QR Screen */
        <div className="card" style={{ padding: '32px', textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ecfdf5',
            color: '#065f46',
            padding: '4px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '16px'
          }}>
            <span>⚡</span> REDEMPTION CODE GENERATED
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>
            Scan or Enter Code at GoGrab Machine
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Machine Location: <strong>Central Library Foyer (VM #01)</strong> • Valid for 10 minutes
          </p>

          {/* Visual Simulated QR Box */}
          <div style={{
            background: '#ffffff',
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            display: 'inline-block',
            margin: '0 auto 20px'
          }}>
            <div style={{
              width: '180px',
              height: '180px',
              background: 'repeating-conic-gradient(#1e293b 0% 25%, #ffffff 0% 50%) 50% / 20px 20px',
              borderRadius: '8px',
              border: '6px solid #0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)'
            }}>
              <div style={{ background: '#ffffff', padding: '6px 10px', borderRadius: '4px', fontWeight: 900, fontSize: '0.9rem', color: '#1e3a8a' }}>
                GoGrab QR
              </div>
            </div>
          </div>

          {/* Digital Token Code */}
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              One-Time Machine PIN
            </span>
            <div style={{
              fontSize: '2rem',
              fontWeight: 900,
              letterSpacing: '0.15em',
              color: 'var(--primary)',
              background: 'var(--primary-light)',
              padding: '8px 24px',
              borderRadius: 'var(--radius-md)',
              display: 'inline-block',
              marginTop: '4px',
              border: '1.5px solid var(--primary-border)'
            }}>
              {activeToken.redemption_token}
            </div>
          </div>

          {/* Split Payment Breakdown */}
          <div style={{
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            textAlign: 'left',
            marginBottom: '24px',
            fontSize: '0.86rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Total Purchase:</span>
              <strong>₹{activeToken.purchase_amount.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', marginBottom: '6px' }}>
              <span>FindIt Wallet Deducted:</span>
              <strong>-₹{activeToken.wallet_amount_used.toFixed(2)}</strong>
            </div>
            {activeToken.remaining_upi_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706', fontWeight: 700, borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                <span>Remaining to Pay via Machine UPI:</span>
                <span>₹{activeToken.remaining_upi_amount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            ⚠️ <em>Hackathon Simulator Note:</em> Click the button below to simulate the vending machine hardware dispensing your items.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={() => setActiveToken(null)}>
              Cancel
            </button>
            <button
              className="btn btn-success"
              onClick={handleSimulateDispense}
              disabled={loading}
              style={{ padding: '12px 24px' }}
            >
              {loading ? 'Validating Token...' : '🥤 Simulate Machine Dispense'}
            </button>
          </div>
        </div>
      ) : (
        /* Catalogue & Cart Split Grid */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
          {/* Left: Product Catalogue */}
          <div>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Available Vending Products</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{GOGRAB_CATALOG.length} items in stock</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {GOGRAB_CATALOG.map((prod) => {
                const qty = cart[prod.id] || 0;
                return (
                  <div
                    key={prod.id}
                    className="card"
                    style={{
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: qty > 0 ? '1.5px solid var(--primary)' : '1.5px solid var(--border-color)',
                      background: qty > 0 ? 'var(--primary-light)' : '#ffffff'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '2.4rem', textAlign: 'center', marginBottom: '8px' }}>
                        {prod.image}
                      </div>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                        {prod.category}
                      </span>
                      <h4 style={{ fontSize: '0.94rem', fontWeight: 700, margin: '4px 0 6px', lineHeight: '1.3' }}>
                        {prod.name}
                      </h4>
                      <p style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '12px' }}>
                        ₹{prod.price}
                      </p>
                    </div>

                    {qty === 0 ? (
                      <button
                        className="btn btn-outline"
                        style={{ width: '100%', padding: '6px 12px', fontSize: '0.82rem' }}
                        onClick={() => handleQtyChange(prod.id, 1)}
                      >
                        + Add to Cart
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-border)', padding: '4px 8px' }}>
                        <button
                          onClick={() => handleQtyChange(prod.id, -1)}
                          style={{ border: 'none', background: 'none', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 700, color: 'var(--danger)' }}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>{qty}</span>
                        <button
                          onClick={() => handleQtyChange(prod.id, 1)}
                          style={{ border: 'none', background: 'none', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 700, color: 'var(--primary)' }}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Checkout & Partial Wallet Breakdown Card */}
          <div>
            <div className="card" style={{ padding: '24px', position: 'sticky', top: '90px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                Order Summary
              </h3>

              {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Your cart is empty. Pick items from the vending catalogue.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Cart List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                    {cartItems.map((item) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                        <span>{item.name} × {item.qty}</span>
                        <span style={{ fontWeight: 600 }}>₹{item.subtotal}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.94rem', fontWeight: 700, marginBottom: '12px' }}>
                      <span>Total Purchase:</span>
                      <span>₹{totalPurchase.toFixed(2)}</span>
                    </div>

                    {/* FindIt Wallet Applied Slider / Amount */}
                    <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                        <span>Apply FindIt Rewards:</span>
                        <span style={{ color: '#059669' }}>-₹{useWalletAmount.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={Math.min(availableBalance, totalPurchase)}
                        step="5"
                        value={useWalletAmount}
                        onChange={(e) => setUseWalletAmount(parseFloat(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <span>₹0</span>
                        <span>Max Usable: ₹{Math.min(availableBalance, totalPurchase).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Remaining UPI Payment */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: remainingUpi > 0 ? '#fffbeb' : '#ecfdf5',
                      border: remainingUpi > 0 ? '1px solid #fef08a' : '1px solid #a7f3d0',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '16px'
                    }}>
                      <div>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: remainingUpi > 0 ? '#92400e' : '#065f46' }}>
                          {remainingUpi > 0 ? 'Remaining to pay via UPI:' : 'Fully Covered by Wallet!'}
                        </p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {remainingUpi > 0 ? 'Pay at vending machine scanner' : 'Zero extra cash needed'}
                        </p>
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: remainingUpi > 0 ? '#b45309' : '#059669' }}>
                        ₹{remainingUpi.toFixed(2)}
                      </div>
                    </div>

                    {/* Disclaimer */}
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '16px' }}>
                      🔒 Anti-fraud security: Generates a simulated single-use token. Does not debit your real bank account.
                    </p>

                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', fontSize: '0.94rem' }}
                      onClick={handleGenerateToken}
                      disabled={loading || totalPurchase === 0}
                    >
                      {loading ? 'Generating Token...' : 'Generate GoGrab Token 🎟️'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
