import React, { useState, useMemo } from 'react';
import ItemCard from '../components/ItemCard';
import SearchBar from '../components/SearchBar';

export default function BrowseItems({
  items,
  initialQuery = '',
  onSelectItem,
  onClaimItem,
  onViewMatch,
  navigateTo
}) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState('all'); // 'all', 'lost', 'found'
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  // Filter items dynamically based on search, type, and category
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Type filter
      if (selectedType !== 'all' && item.type !== selectedType) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        const matchesLoc = (item.location || '').toLowerCase().includes(q);
        const matchesCat = (item.category || '').toLowerCase().includes(q);
        return matchesTitle || matchesDesc || matchesLoc || matchesCat;
      }
      return true;
    });
  }, [items, selectedType, selectedCategory, searchQuery]);

  return (
    <div>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Campus Lost & Found Directory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem' }}>
            Browse active campus listings or filter to locate what you misplaced.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-danger" onClick={() => navigateTo('report-lost')}>
            + Report Lost
          </button>
          <button className="btn btn-success" onClick={() => navigateTo('report-found')}>
            + Report Found
          </button>
        </div>
      </div>

      {/* Search & Filter Component */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
      />

      {/* Filter summary indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredItems.length}</strong> {filteredItems.length === 1 ? 'item' : 'items'}
          {selectedType !== 'all' ? ` in ${selectedType.toUpperCase()}` : ''}
          {selectedCategory !== 'all' ? ` under "${selectedCategory}"` : ''}
        </p>

        {(selectedType !== 'all' || selectedCategory !== 'all' || searchQuery) && (
          <button
            onClick={() => {
              setSelectedType('all');
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600 }}
          >
            Reset Filters ↺
          </button>
        )}
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>No matching items found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '420px', margin: '0 auto 20px' }}>
            Try broadening your search terms or report the missing item so our AI can notify you when found.
          </p>
          <button className="btn btn-primary" onClick={() => navigateTo('report-lost')}>
            Report Missing Item
          </button>
        </div>
      ) : (
        <div className="grid-cards">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onSelect={onSelectItem}
              onClaim={onClaimItem}
              onViewMatch={onViewMatch}
            />
          ))}
        </div>
      )}
    </div>
  );
}
