import React from 'react';

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  selectedType,
  setSelectedType,
  selectedCategory,
  setSelectedCategory,
  categories
}) {
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 'var(--radius-lg)',
      padding: '16px 20px',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-sm)',
      marginBottom: '24px'
    }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '14px',
        alignItems: 'center'
      }}>
        {/* Search Input */}
        <div style={{
          position: 'relative',
          flex: '1 1 280px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }}>
            🔍
          </span>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '40px', paddingRight: searchQuery ? '36px' : '14px' }}
            placeholder="Search by item name, color, brand, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Type Toggle Pills (All, Lost, Found) */}
        <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          {[
            { id: 'all', label: 'All Items' },
            { id: 'lost', label: '🔴 Lost' },
            { id: 'found', label: '🟢 Found' }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.86rem',
                fontWeight: selectedType === type.id ? 700 : 500,
                background: selectedType === type.id ? '#ffffff' : 'transparent',
                color: selectedType === type.id ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: selectedType === type.id ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Category Dropdown */}
        <div style={{ minWidth: '180px' }}>
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
