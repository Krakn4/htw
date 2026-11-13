import React, { useState } from 'react';
import UploadImage from '../components/UploadImage';

export default function ReportLost({ onSubmit, onCancel, navigateTo }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Electronics',
    date: new Date().toISOString().split('T')[0],
    location: '',
    description: '',
    secretDetail: '',
    enableReward: false,
    rewardBudget: 0,
    customReward: '',
    contactName: 'Aarav Sharma',
    contactRoll: '24BCE1042',
    imageUrl: ''
  });

  const [loading, setLoading] = useState(false);

  const categories = [
    'Electronics',
    'Cards & IDs',
    'Bags & Backpacks',
    'Keys',
    'Stationery',
    'Accessories & Watches',
    'Clothing',
    'Other Personal Belonging'
  ];

  const commonCampusLocations = [
    'Central Library (Ground / 1st / 2nd Floor)',
    'Main Canteen / Food Court',
    'Academic Block A (Lecture Halls)',
    'Academic Block B (Engineering Labs)',
    'Academic Block C (Auditorium & Classrooms)',
    'Indoor Sports Complex & Gym',
    'Hostel Area / Residential Quad',
    'Campus Main Gate / Parking Lot',
    'Other / Outdoor Walkway'
  ];

  const rewardPresets = [50, 100, 150];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.imageUrl && !formData.description.trim()) {
      alert('Please either upload a photo OR provide a detailed description for our Cross-Modal Text-to-Image AI!');
      return;
    }

    setLoading(true);

    const finalReward = formData.enableReward
      ? (formData.customReward ? parseFloat(formData.customReward) : formData.rewardBudget)
      : 0;

    setTimeout(() => {
      setLoading(false);
      onSubmit({
        ...formData,
        rewardBudget: finalReward,
        type: 'lost'
      });
    }, 1000);
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '28px', textAlign: 'center' }}>
        <span className="badge badge-lost" style={{ marginBottom: '8px' }}>
          🚨 Missing Property Report
        </span>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Report a Lost Item
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem', marginTop: '4px' }}>
          Our AI vision model will scan inventory in real-time. You can optionally attach an appreciation reward.
        </p>
      </div>

      {/* Form Card */}
      <div className="card" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit}>
          {/* Image Upload Component */}
          <UploadImage
            imageUrl={formData.imageUrl}
            setImageUrl={(url) => setFormData({ ...formData, imageUrl: url })}
            label="Upload Item Photo (or reference photo)"
          />

          {/* Item Name */}
          <div className="form-group">
            <label className="form-label">
              Item Name & Brand <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Navy Blue Dell Laptop Backpack, Casio fx-991EX..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <span className="form-help">Include color, brand, or visible badges to aid AI matching.</span>
          </div>

          {/* Category & Date Row */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Date Lost</label>
              <input
                type="date"
                className="form-input"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          {/* Location */}
          <div className="form-group">
            <label className="form-label">
              Approximate Campus Location <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              list="campus-locations"
              className="form-input"
              required
              placeholder="Select or type where you last saw the item..."
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <datalist id="campus-locations">
              {commonCampusLocations.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>

          {/* FindIt Rewards Option Section */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
            border: '1.5px solid #a7f3d0',
            borderRadius: 'var(--radius-md)',
            padding: '18px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: formData.enableReward ? '14px' : '0' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '1.2rem' }}>💰</span>
                  <label htmlFor="enable-reward-cb" style={{ fontWeight: 800, fontSize: '0.94rem', color: '#065f46', cursor: 'pointer' }}>
                    Enable FindIt Appreciation Reward
                  </label>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#166534', marginTop: '2px' }}>
                  Motivate fellow students! Reward is credited only after you confirm physical return.
                </p>
              </div>
              <input
                type="checkbox"
                id="enable-reward-cb"
                checked={formData.enableReward}
                onChange={(e) => setFormData({ ...formData, enableReward: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#059669' }}
              />
            </div>

            {formData.enableReward && (
              <div style={{ borderTop: '1px solid #bbf7d0', paddingTop: '14px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '8px' }}>
                  Select Reward Budget:
                </span>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {rewardPresets.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setFormData({ ...formData, rewardBudget: amt, customReward: '' })}
                      style={{
                        padding: '6px 16px',
                        borderRadius: 'var(--radius-full)',
                        border: '1.5px solid #059669',
                        background: (!formData.customReward && formData.rewardBudget === amt) ? '#059669' : '#ffffff',
                        color: (!formData.customReward && formData.rewardBudget === amt) ? '#ffffff' : '#065f46',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        cursor: 'pointer'
                      }}
                    >
                      ₹{amt}
                    </button>
                  ))}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#166534' }}>Custom ₹:</span>
                    <input
                      type="number"
                      placeholder="e.g. 200"
                      value={formData.customReward}
                      onChange={(e) => setFormData({ ...formData, customReward: e.target.value })}
                      style={{
                        width: '90px',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid #86efac',
                        fontSize: '0.88rem',
                        fontWeight: 700
                      }}
                    />
                  </div>
                </div>
                <p style={{ fontSize: '0.74rem', color: '#15803d', marginTop: '8px' }}>
                  Finder can use this ₹{formData.customReward || formData.rewardBudget} at campus GoGrab Vending Machines.
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Detailed Visual Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Mention recognizable markings, scratches, keychains, stickers, or distinctive features..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Secret Identifying Mark */}
          <div className="form-group" style={{ background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🔒 Secret Detail for Verification (Hidden from Public)</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Hidden inside note, sticker on bottom, lock pattern hint..."
              value={formData.secretDetail}
              onChange={(e) => setFormData({ ...formData, secretDetail: e.target.value })}
            />
            <span className="form-help">
              This private note will be used by the security desk to verify your ownership when claiming.
            </span>
          </div>

          {/* Form Action Buttons */}
          <div style={{ display: 'flex', gap: '14px', marginTop: '24px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onCancel || (() => navigateTo('home'))}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              style={{ minWidth: '180px' }}
              disabled={loading}
            >
              {loading ? '🧠 AI Scanning Database...' : '🚀 Submit Lost Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
