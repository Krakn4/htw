import React, { useState } from 'react';
import ItemCard from '../components/ItemCard';

export default function Home({ items, navigateTo, onSelectRecent, onClaimItem, onViewMatch }) {
  const [quickSearch, setQuickSearch] = useState('');

  // Recently reported items
  const recentItems = items.slice(0, 4);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    navigateTo('browse', { query: quickSearch });
  };

  return (
    <div className="landing-page" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      {/* Hero Section - Mocha Minimalist Aesthetic */}
      <section style={{
        background: 'linear-gradient(145deg, #FAF8F3 0%, #F5EFE6 55%, #EBE3D5 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '64px 36px',
        textAlign: 'center',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative warm element */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          right: '-60px',
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgba(216,195,165,0.35) 0%, rgba(245,239,230,0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '820px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--warm-beige)',
            padding: '6px 18px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.82rem',
            fontWeight: 600,
            marginBottom: '24px',
            color: 'var(--dark-chocolate)'
          }}>
            <span>✨</span> Next-Gen AI Vision for College Campuses
          </div>

          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.4rem, 5.5vw, 3.8rem)',
            fontWeight: 800,
            lineHeight: '1.15',
            letterSpacing: '-0.02em',
            color: 'var(--espresso)',
            marginBottom: '18px'
          }}>
            Lost Something? <br />
            <span style={{ fontStyle: 'italic', fontWeight: 600, color: 'var(--mocha-brown)' }}>
              Let's Find It.
            </span>
          </h1>

          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '1.05rem',
            color: 'var(--text-muted)',
            lineHeight: '1.7',
            maxWidth: '620px',
            margin: '0 auto 36px'
          }}>
            Findly.ai pairs sophisticated multimodal computer vision with our campus community, reuniting students with misplaced items safely and swiftly.
          </p>

          {/* Quick Search Box */}
          <form onSubmit={handleHeroSearch} style={{
            display: 'flex',
            maxWidth: '560px',
            margin: '0 auto 32px',
            background: '#ffffff',
            borderRadius: 'var(--radius-full)',
            padding: '6px 8px 6px 20px',
            border: '1.5px solid var(--warm-beige)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <input
              type="text"
              placeholder="Search keys, student ID, Dell backpack, water bottle..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.94rem',
                color: 'var(--espresso)'
              }}
            />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)', padding: '10px 24px' }}>
              Search
            </button>
          </form>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigateTo('report-lost')}
            >
              🚨 Report Lost Item
            </button>
            <button
              className="btn btn-outline btn-lg"
              onClick={() => navigateTo('report-found')}
            >
              🤝 Report Found Item
            </button>
          </div>
        </div>
      </section>

      {/* Campus Impact Metrics */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        {[
          { label: 'Campus Items Reunited', value: '480+', icon: '🌿', color: 'var(--mocha-brown)' },
          { label: 'AI Similarity Accuracy', value: '94.2%', icon: '🎯', color: 'var(--dark-chocolate)' },
          { label: 'Avg Recovery Time', value: '< 4 Hours', icon: '⚡', color: 'var(--success)' },
          { label: 'GoGrab Rewards Paid', value: '₹14,500', icon: '🥤', color: 'var(--mocha-brown)' }
        ].map((metric) => (
          <div key={metric.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 24px', background: '#FFFFFF' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--cream)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem'
            }}>
              {metric.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--espresso)', fontFamily: 'var(--font-serif)', lineHeight: '1.2' }}>
                {metric.value}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {metric.label}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Recently Found & Lost Items Section */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--mocha-brown)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Live Campus Catalog
            </span>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--espresso)', letterSpacing: '-0.02em', marginTop: '2px' }}>
              Recently Found & Reported Items
            </h2>
          </div>
          <button
            className="btn btn-outline"
            onClick={() => navigateTo('browse')}
          >
            Explore All ({items.length}) →
          </button>
        </div>

        <div className="grid-cards">
          {recentItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onSelect={onSelectRecent}
              onClaim={onClaimItem}
              onViewMatch={onViewMatch}
            />
          ))}
        </div>
      </section>

      {/* How Findly Works */}
      <section style={{
        background: 'var(--cream)',
        borderRadius: 'var(--radius-lg)',
        padding: '48px 36px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 40px' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--espresso)', marginBottom: '8px' }}>
            How Findly.ai Works
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem' }}>
            A compassionate, secure cycle designed for modern university campuses.
          </p>
        </div>

        <div className="grid-4">
          {[
            { step: '01', title: 'Snap & Report', desc: 'Upload a picture and approximate campus location where lost or found.', icon: '📸' },
            { step: '02', title: 'AI Feature Matching', desc: 'Multimodal vision models analyze colors, brand emblems, and dimensions.', icon: '🧠' },
            { step: '03', title: 'Smart Match Scoring', desc: 'Confidence scores alert students when a prospective match is cataloged.', icon: '⚡' },
            { step: '04', title: 'Verified Handover', desc: 'Anti-fraud verification ensures true owners collect their valuables.', icon: '🛡️' }
          ].map((item) => (
            <div key={item.step} style={{ textAlign: 'left', padding: '20px', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '1.8rem' }}>{item.icon}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--dark-chocolate)', background: 'var(--cream)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                  STEP {item.step}
                </span>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px', color: 'var(--espresso)' }}>{item.title}</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
