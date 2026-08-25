import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  HeartOff,
  Search,
  X,
  Eye,
  ShoppingBag,
  Sparkles,
  LayoutGrid,
  LayoutList,
  AlertCircle,
  BookmarkX,
  Scissors,
  Package,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useCart } from '../providers/CartProvider';
import { useToast } from '../providers/ToastProvider';
import { shop } from '../api/endpoints';
import { adaptProduct, adaptStyle, adaptPage, formatPrice, errorText } from '../api/adapters';

// The four "my list" endpoints, each paginated. Saved is a bookmark; liked is a
// heart — the backend keeps them in separate tables, so the page does too.
const TABS = [
  { id: 'savedStyles', label: 'Saved styles', kind: 'style', action: 'save', icon: Scissors },
  { id: 'savedProducts', label: 'Saved pieces', kind: 'product', action: 'save', icon: Package },
  { id: 'likedStyles', label: 'Liked styles', kind: 'style', action: 'like', icon: Heart },
  { id: 'likedProducts', label: 'Liked pieces', kind: 'product', action: 'like', icon: Heart },
];

const EMPTY_COPY = {
  savedStyles: {
    title: 'No saved styles yet',
    body: 'Bookmark a style from the gallery and it waits for you here.',
    cta: 'Browse the gallery',
    to: '/gallery',
  },
  savedProducts: {
    title: 'No saved pieces yet',
    body: 'Bookmark anything from the shop to keep it close.',
    cta: 'Browse the shop',
    to: '/products',
  },
  likedStyles: {
    title: 'No liked styles yet',
    body: 'Tap the heart on a style to show the studio what you are drawn to.',
    cta: 'Browse the gallery',
    to: '/gallery',
  },
  likedProducts: {
    title: 'No liked pieces yet',
    body: 'Tap the heart on a piece and it lands here.',
    cta: 'Browse the shop',
    to: '/products',
  },
};

const SavedStylesPage = () => {
  const navigate = useNavigate();
  const { colors, theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const { add: addToCart } = useCart();
  const { showToast } = useToast();

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  const [lists, setLists] = useState({ savedStyles: [], savedProducts: [], likedStyles: [], likedProducts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [tabId, setTabId] = useState('savedStyles');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [busyId, setBusyId] = useState(null);

  // ------------------------------------------------------------------- load
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    // One failing list should not blank the others, so each catch falls back to
    // an empty page and the whole screen only errors if every call died.
    Promise.all([
      shop.savedStyles().catch(() => null),
      shop.savedProducts().catch(() => null),
      shop.likedStyles().catch(() => null),
      shop.likedProducts().catch(() => null),
    ])
      .then(([savedStyles, savedProducts, likedStyles, likedProducts]) => {
        if (cancelled) return;

        if (!savedStyles && !savedProducts && !likedStyles && !likedProducts) {
          setError('Could not load your lists.');
          return;
        }

        setLists({
          savedStyles: adaptPage(savedStyles || {}, adaptStyle).results,
          savedProducts: adaptPage(savedProducts || {}, adaptProduct).results,
          likedStyles: adaptPage(likedStyles || {}, adaptStyle).results,
          likedProducts: adaptPage(likedProducts || {}, adaptProduct).results,
        });
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err, 'Could not load your lists.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // ---------------------------------------------------------------- derived
  const tab = TABS.find((t) => t.id === tabId) || TABS[0];
  // Memoised so the fallback array is not a fresh reference on every render,
  // which would defeat the memos below.
  const items = useMemo(() => lists[tabId] || [], [lists, tabId]);

  const categories = useMemo(() => {
    const names = [...new Set(items.map((i) => i.category).filter(Boolean))].sort();
    return ['all', ...names];
  }, [items]);

  // A chip from the previous tab may not exist in this one.
  useEffect(() => {
    setCategory('all');
  }, [tabId]);

  const visible = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = category === 'all' || item.category === category;
      if (!matchesCategory) return false;
      if (!needle) return true;
      return (
        String(item.name || '').toLowerCase().includes(needle) ||
        String(item.category || '').toLowerCase().includes(needle)
      );
    });
  }, [items, searchQuery, category]);

  const openItem = useCallback(
    (item) => {
      const slug = item.slug || item.id;
      navigate(item.kind === 'product' ? `/product/${slug}` : `/styles/order/${slug}`);
    },
    [navigate]
  );

  // Both endpoints are toggles, so calling one on something already in the list
  // takes it out. Drop the row locally rather than refetching four lists.
  const handleRemove = async (item) => {
    if (busyId) return;
    setBusyId(item.id);
    try {
      if (tab.action === 'save') {
        if (item.kind === 'product') await shop.saveProduct(item.slug);
        else await shop.saveStyle(item.slug);
      } else if (item.kind === 'product') {
        await shop.likeProduct(item.slug);
      } else {
        await shop.likeStyle(item.slug);
      }

      setLists((prev) => ({ ...prev, [tabId]: (prev[tabId] || []).filter((row) => row.id !== item.id) }));
      showToast(tab.action === 'save' ? 'Removed from saved.' : 'Removed from liked.', 'success');
    } catch (err) {
      showToast(errorText(err, 'Could not update your list.'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleAddToCart = async (item) => {
    if (busyId) return;
    setBusyId(item.id);
    try {
      await addToCart({ item_type: 'product', product_id: item.id, quantity: 1 });
      showToast(`${item.name} added to your cart.`, 'success');
    } catch (err) {
      showToast(errorText(err, 'Could not add that to your cart.'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  // ---------------------------------------------------------------- styles
  const pageStyle = { backgroundColor: colors.mainBg, minHeight: '100vh', paddingBottom: '40px' };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: isMobile ? '12px' : '16px',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isMobile ? '16px' : '20px',
    flexWrap: 'wrap',
    gap: '10px',
  };

  const titleStyle = {
    fontSize: isMobile ? '22px' : '28px',
    fontWeight: 800,
    color: colors.heading,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const titleBadgeStyle = {
    fontSize: '12px',
    fontWeight: 600,
    padding: '2px 10px',
    borderRadius: '10px',
    background: colors.primary,
    color: '#1A1A1A',
  };

  const searchWrapperStyle = { position: 'relative', width: '100%', maxWidth: '400px' };

  const searchInputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 40px',
    borderRadius: '12px',
    background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.80)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.15)'}`,
    color: colors.text,
    fontSize: '13px',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  const chipRowStyle = {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '4px',
    marginBottom: '14px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  };

  const chipStyle = (active) => ({
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    background: active ? colors.primary : isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.80)',
    color: active ? '#1A1A1A' : colors.secondaryText,
    border: `1px solid ${active ? colors.primary : isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.15)'}`,
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  });

  const viewToggleStyle = {
    display: 'flex',
    gap: '4px',
    background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.80)',
    borderRadius: '8px',
    padding: '4px',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.15)'}`,
  };

  const viewButtonStyle = (active) => ({
    padding: '6px',
    borderRadius: '6px',
    cursor: 'pointer',
    background: active ? colors.primary : 'transparent',
    color: active ? '#1A1A1A' : colors.secondaryText,
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  });

  const gridColumns = () => {
    if (viewMode === 'list') return '1fr';
    if (isMobile) return 'repeat(2, 1fr)';
    if (isTablet) return 'repeat(3, 1fr)';
    return 'repeat(4, 1fr)';
  };

  const gridStyle = { display: 'grid', gridTemplateColumns: gridColumns(), gap: isMobile ? '10px' : '16px' };

  const cardStyle = {
    borderRadius: '14px',
    overflow: 'hidden',
    background: isDark ? 'rgba(20,20,20,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)'}`,
    transition: 'all 0.3s ease',
    display: viewMode === 'list' ? 'flex' : 'block',
    alignItems: 'center',
    gap: viewMode === 'list' ? '14px' : 0,
  };

  const imageStyle = {
    width: viewMode === 'list' ? (isMobile ? '84px' : '110px') : '100%',
    height: viewMode === 'list' ? (isMobile ? '84px' : '110px') : isMobile ? '190px' : '260px',
    objectFit: 'cover',
    cursor: 'pointer',
    flexShrink: 0,
  };

  const infoStyle = { padding: viewMode === 'list' ? '10px 14px 10px 0' : '12px 14px', flex: 1, minWidth: 0 };

  const nameStyle = {
    fontSize: isMobile ? '13px' : '15px',
    fontWeight: 600,
    color: colors.text,
    margin: 0,
    cursor: 'pointer',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const metaStyle = { fontSize: '11px', color: colors.secondaryText, marginTop: '2px' };

  const actionsStyle = { display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' };

  const smallButtonStyle = {
    padding: '5px 10px',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: 500,
    background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.80)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.15)'}`,
    color: colors.text,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s ease',
  };

  const primaryButtonStyle = {
    padding: '10px 18px',
    borderRadius: '10px',
    background: colors.primary,
    border: 'none',
    cursor: 'pointer',
    color: isDark ? '#0A0A0A' : '#FFFFFF',
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const emptyStyle = {
    padding: isMobile ? '40px 20px' : '64px 24px',
    borderRadius: '16px',
    background: isDark ? 'rgba(20,20,20,0.40)' : 'rgba(255,255,255,0.40)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.04)' : 'rgba(212, 175, 55,0.06)'}`,
    textAlign: 'center',
  };

  // --------------------------------------------------------------- loading
  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div className="skeleton" style={{ height: '34px', width: '200px', borderRadius: '10px', marginBottom: '18px' }} />
          <div className="skeleton" style={{ height: '42px', borderRadius: '12px', marginBottom: '16px' }} />
          <div style={gridStyle}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
              <div key={n} className="skeleton" style={{ height: isMobile ? '250px' : '340px', borderRadius: '14px' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div style={emptyStyle}>
            <AlertCircle size={40} color="#EF4444" />
            <div style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: 600, color: colors.heading, marginTop: '14px' }}>
              We could not load your lists
            </div>
            <div style={{ fontSize: '13px', color: colors.secondaryText, marginTop: '8px' }}>{error}</div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '18px', flexWrap: 'wrap' }}>
              <button style={primaryButtonStyle} onClick={() => setReloadKey((key) => key + 1)}>
                Try again
              </button>
              <button
                style={{ ...smallButtonStyle, padding: '10px 18px', fontSize: '13px' }}
                onClick={() => navigate('/gallery')}
              >
                Browse the gallery
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const empty = EMPTY_COPY[tabId];

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h1 style={titleStyle}>
            <Heart size={isMobile ? 24 : 30} style={{ color: colors.primary }} />
            My lists
            <span style={titleBadgeStyle}>{items.length}</span>
          </h1>
          <div style={viewToggleStyle}>
            <button style={viewButtonStyle(viewMode === 'grid')} onClick={() => setViewMode('grid')} aria-label="Grid view">
              <LayoutGrid size={16} />
            </button>
            <button style={viewButtonStyle(viewMode === 'list')} onClick={() => setViewMode('list')} aria-label="List view">
              <LayoutList size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={chipRowStyle}>
          {TABS.map((entry) => {
            const Icon = entry.icon;
            return (
              <button key={entry.id} style={chipStyle(entry.id === tabId)} onClick={() => setTabId(entry.id)}>
                <Icon size={13} />
                {entry.label}
                <span style={{ opacity: 0.7 }}>{(lists[entry.id] || []).length}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        {items.length > 0 && (
          <div style={{ ...searchWrapperStyle, marginBottom: '14px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: colors.secondaryText }}
            />
            <input
              style={searchInputStyle}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${tab.label.toLowerCase()}…`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.secondaryText,
                  display: 'flex',
                }}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Category chips — only worth showing once there is a choice to make */}
        {categories.length > 2 && (
          <div style={chipRowStyle}>
            {categories.map((name) => (
              <button key={name} style={chipStyle(name === category)} onClick={() => setCategory(name)}>
                {name === 'all' ? 'All' : name}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {items.length === 0 ? (
          <div style={emptyStyle}>
            <Sparkles size={40} color={colors.primary} />
            <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, color: colors.heading, marginTop: '14px' }}>
              {empty.title}
            </div>
            <div style={{ fontSize: '13px', color: colors.secondaryText, marginTop: '8px', maxWidth: '380px', margin: '8px auto 0' }}>
              {empty.body}
            </div>
            <button style={{ ...primaryButtonStyle, margin: '18px auto 0' }} onClick={() => navigate(empty.to)}>
              {empty.cta}
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div style={emptyStyle}>
            <Search size={36} color={colors.secondaryText} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: colors.heading, marginTop: '12px' }}>
              Nothing matches that
            </div>
            <div style={{ fontSize: '13px', color: colors.secondaryText, marginTop: '8px' }}>
              Try another word, or clear the filters.
            </div>
            <button
              style={{ ...primaryButtonStyle, margin: '18px auto 0' }}
              onClick={() => {
                setSearchQuery('');
                setCategory('all');
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div style={gridStyle}>
            {visible.map((item) => (
              <div
                key={item.id}
                style={cardStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = isDark ? '0 8px 24px rgba(0,0,0,0.30)' : '0 8px 24px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <img src={item.image} alt={item.name} style={imageStyle} onClick={() => openItem(item)} />
                <div style={infoStyle}>
                  <div style={nameStyle} onClick={() => openItem(item)}>
                    {item.name}
                  </div>
                  <div style={metaStyle}>
                    {formatPrice(item.price)}
                    {item.category ? ` · ${item.category}` : ''}
                  </div>
                  {item.kind === 'product' && !item.inStock && (
                    <div style={{ ...metaStyle, color: '#EF4444' }}>Out of stock</div>
                  )}
                  {item.kind === 'style' && item.makingDays != null && (
                    <div style={metaStyle}>About {item.makingDays} days to make</div>
                  )}

                  <div style={actionsStyle}>
                    <button style={smallButtonStyle} onClick={() => openItem(item)}>
                      <Eye size={11} />
                      View
                    </button>
                    {item.kind === 'product' && item.inStock && (
                      <button
                        style={{ ...smallButtonStyle, opacity: busyId === item.id ? 0.5 : 1 }}
                        onClick={() => handleAddToCart(item)}
                        disabled={busyId === item.id}
                      >
                        <ShoppingBag size={11} />
                        Add
                      </button>
                    )}
                    <button
                      style={{ ...smallButtonStyle, opacity: busyId === item.id ? 0.5 : 1 }}
                      onClick={() => handleRemove(item)}
                      disabled={busyId === item.id}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#EF4444';
                        e.currentTarget.style.color = '#EF4444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.15)';
                        e.currentTarget.style.color = colors.text;
                      }}
                    >
                      {tab.action === 'save' ? <BookmarkX size={11} /> : <HeartOff size={11} />}
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedStylesPage;
