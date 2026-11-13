import React, { useState } from 'react';
import UploadImage from '../components/UploadImage';

export default function ReportFound({ onSubmit, onCancel, navigateTo }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Electronics',
    date: new Date().toISOString().split('T')[0],
    location: '',
    description: '',
    custodyLocation: 'Turned into Central Library Circulation Desk',
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

  const custodyOptions = [
    'Turned into Central Library Circulation Desk',
    'Turned into Campus Main Gate Security Office',
    'Turned into Department HOD / Lab Assistant Desk',
    'Turned into Sports Complex Admin Office',
    'Holding Safely with Me (Finder)'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.imageUrl) {
      alert('Please snap or upload a photo of the item you found!');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      onSubmit({
        ...formData,
        type: 'found'
      });
    }, 1000);
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '28px', textAlign: 'center' }}>
        <span className="badge badge-found" style={{ marginBottom: '8px' }}>
          🤝 Good Samaritan Good Deed
        </span>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Report a Found Item
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem', marginTop: '4px' }}>
          Help a fellow student! Upload a picture and tell us where the item was found or safely deposited.
        </p>
      </div>

      {/* Form Card */}
      <div className="card" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit}>
          {/* Image Upload Component */}
          <UploadImage
            imageUrl={formData.imageUrl}
            setImageUrl={(url) => setFormData({ ...formData, imageUrl: url })}
            label="Photograph of Found Item"
          />

          {/* Item Name */}
          <div className="form-group">
            <label className="form-label">
              What did you find? <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Black Titan Watch, Student ID card, Bluetooth earphones..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
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
              <label className="form-label">Date Discovered</label>
              <input
                type="date"
                className="form-input"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          {/* Location Found */}
          <div className="form-group">
            <label className="form-label">
              Exact Campus Spot Where Found <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              list="found-locations"
              className="form-input"
              required
              placeholder="e.g. Canteen Table 4, Block B Staircase..."
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <datalist id="found-locations">
              {commonCampusLocations.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>

          {/* Custody / Handover Location */}
          <div className="form-group">
            <label className="form-label">
              Current Custody / Safe Handover Point <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <select
              className="form-select"
              value={formData.custodyLocation}
              onChange={(e) => setFormData({ ...formData, custodyLocation: e.target.value })}
            >
              {custodyOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <span className="form-help">Where can the rightful student go to collect it?</span>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Physical Description & Condition</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describe color, general condition, or visible casing (keep sensitive personal contents private)..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Action Buttons */}
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
              className="btn btn-success"
              style={{ minWidth: '180px' }}
              disabled={loading}
            >
              {loading ? '🧠 Computing AI Visual Vectors...' : '🤝 Publish Found Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
