import React, { useState } from 'react';

export default function UploadImage({ imageUrl, setImageUrl, label = "Item Photograph" }) {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [tempUrl, setTempUrl] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyUrl = () => {
    if (tempUrl.trim()) {
      setImageUrl(tempUrl.trim());
      setShowUrlInput(false);
    }
  };

  const sampleImages = [
    { label: 'Laptop Bag', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80' },
    { label: 'Keys', url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80' },
    { label: 'Earbuds', url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=600&q=80' },
    { label: 'Water Bottle', url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80' }
  ];

  return (
    <div className="form-group">
      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{label} <span style={{ color: 'var(--danger)' }}>*</span></span>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
        >
          {showUrlInput ? 'Switch to File Upload' : 'Paste Image URL'}
        </button>
      </label>

      {imageUrl ? (
        <div className="upload-preview-container">
          <img src={imageUrl} alt="Uploaded item preview" className="upload-preview-img" />
          <button
            type="button"
            className="upload-clear-btn"
            onClick={() => { setImageUrl(''); setTempUrl(''); }}
            title="Remove image"
          >
            ✕
          </button>
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            color: '#ffffff',
            padding: '6px 10px',
            fontSize: '0.75rem',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <span>✨</span> Ready for AI similarity vectorization
          </div>
        </div>
      ) : showUrlInput ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="https://example.com/item.jpg"
            value={tempUrl}
            onChange={(e) => setTempUrl(e.target.value)}
          />
          <button type="button" className="btn btn-primary" onClick={handleApplyUrl}>
            Load
          </button>
        </div>
      ) : (
        <div className="upload-dropzone" onClick={() => document.getElementById('item-image-input').click()}>
          <input
            type="file"
            id="item-image-input"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem'
          }}>
            📷
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.94rem', color: 'var(--text-main)', marginBottom: '2px' }}>
              Click or drag photo here
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              PNG, JPG, or WEBP up to 5MB (Clear lighting recommended)
            </p>
          </div>

          {/* Quick preset chips for rapid hackathon testing */}
          <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Or sample:</span>
            {sampleImages.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageUrl(s.url);
                }}
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer'
                }}
              >
                + {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
