import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Grid,
  List,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../providers/ToastProvider';
import { useCart } from '../providers/CartProvider';
import { useAuth } from '../providers/AuthProvider';
import ProductCard from '../components/ProductCard';
import { shop } from '../api/endpoints';
import { adaptProduct, adaptCategory, errorText, GENDER_LABEL } from '../api/adapters';

// Backend ordering keys, mapped from the labels the customer sees.
const SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: '-views', label: 'Most Popular' },
  { value: 'name', label: 'Name A–Z' },
];

const ProductsPage = () => {
  const navigate = useNavigate();
  const { colors, theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const { showToast } = useToast();
  const { add } = useCart();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters live in the URL so a filtered grid can be shared or reloaded.
  const page = Number(searchParams.get('page') || 1);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const gender = searchParams.get('gender') || '';
  const ordering = searchParams.get('ordering') || '-created_at';
  const onSale = searchParams.get('on_sale') === 'true';
  const inStock = searchParams.get('in_stock') === 'true';

  const [searchDraft, setSearchDraft] = useState(search);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  const setParam = useCallback(
    (patch) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([k, v]) => {
        if (v === '' || v === null || v === undefined || v === false) next.delete(k);
        else next.set(k, String(v));
      });
      // Any filter change resets paging; only an explicit page keeps it.
      if (!('page' in patch)) next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debounce typing so we don't fire a request per keystroke.
  const searchTimer = useRef(null);
  useEffect(() => {
    if (searchDraft === search) return undefined;
    searchTimer.current = setTimeout(() => setParam({ search: searchDraft }), 400);
    return () => clearTimeout(searchTimer.current);
  }, [searchDraft, search, setParam]);

  useEffect(() => {
    let cancelled = false;
    shop
      .categories()
      .then((rows) => {
        if (!cancelled) setCategories((rows || []).map(adaptCategory));
      })
      .catch(() => {
        // A missing filter list is not worth an error banner over the grid.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = { page, ordering };
    if (search) params.search = search;
    if (category) params.category = category;
    if (gender) params.gender = gender;
    if (onSale) params.on_sale = 'true';
    if (inStock) params.in_stock = 'true';

    shop
      .products(params)
      .then((data) => {
        if (cancelled) return;
        setProducts((data?.results || []).map(adaptProduct));
        setCount(data?.count ?? 0);
        setTotalPages(data?.total_pages ?? 1);
        setError('');
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err, 'Could not load products.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, ordering, search, category, gender, onSale, inStock]);

  const handleProductPress = (productId) => {
    const item = products.find((p) => p.id === productId);
    navigate(`/product/${item?.slug || productId}`);
  };

  const handleProductAction = async (action, payload) => {
    const id = typeof payload === 'object' ? payload.id : payload;
    const item = products.find((p) => p.id === id);
    if (!item) return;

    if (!isAuthenticated && (action === 'like' || action === 'addToCart')) {
      showToast('Sign in first to save or buy.', 'info');
      navigate('/login');
      return;
    }

    try {
      if (action === 'like') {
        await shop.likeProduct(item.slug);
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isLiked: !p.isLiked } : p))
        );
      } else if (action === 'addToCart' || action === 'updateCart') {
        await add({
          item_type: 'product',
          product_id: item.id,
          quantity: typeof payload === 'object' ? payload.quantity : 1,
        });
        showToast(`${item.name} added to your bag.`, 'success');
      }
    } catch (err) {
      showToast(errorText(err, 'That did not go through.'), 'error');
    }
  };

  const clearFilters = () => {
    setSearchDraft('');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const activeFilterCount =
    (category ? 1 : 0) + (gender ? 1 : 0) + (onSale ? 1 : 0) + (inStock ? 1 : 0);

  // Flatten the tree so a subcategory is selectable straight from the chips.
  const categoryChips = categories.flatMap((c) => [c, ...(c.subcategories || [])]);

  const getMinMaxValue = () => {
    if (viewMode === 'list') return '1fr';
    if (windowWidth < 480) return 'minmax(140px, 1fr)';
    if (windowWidth < 640) return 'minmax(160px, 1fr)';
    if (windowWidth < 768) return 'minmax(180px, 1fr)';
    if (windowWidth < 1024) return 'minmax(200px, 1fr)';
    if (windowWidth < 1280) return 'minmax(220px, 1fr)';
    return 'minmax(240px, 1fr)';
  };

  const pageStyle = {
    backgroundColor: colors.mainBg,
    minHeight: '100vh',
    paddingBottom: '40px',
  };

  const headerStyle = {
    padding: '20px 20px 16px',
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: isDark ? 'rgba(10,10,10,0.60)' : 'rgba(248,246,241,0.60)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: 800,
    color: colors.heading,
    letterSpacing: '-0.3px',
    margin: 0,
  };

  const viewToggleStyle = {
    display: 'flex',
    gap: '4px',
    background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.60)',
    borderRadius: '8px',
    padding: '4px',
    border: `1px solid ${colors.border}`,
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

  const searchInputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 40px',
    borderRadius: '12px',
    background: isDark ? 'rgba(26,26,26,0.80)' : 'rgba(255,255,255,0.80)',
    border: `1px solid ${colors.border}`,
    fontSize: '13px',
    color: colors.text,
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  };

  const pillButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    borderRadius: '20px',
    background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${colors.border}`,
    fontSize: '12px',
    color: colors.text,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  };

  const sortSelectStyle = {
    ...pillButtonStyle,
    appearance: 'none',
    paddingRight: '30px',
    outline: 'none',
  };

  const filterLabelStyle = {
    fontSize: '11px',
    fontWeight: 600,
    color: colors.secondaryText,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    marginBottom: '8px',
    display: 'block',
  };

  const chipStyle = (active) => ({
    padding: '4px 14px',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: active ? colors.primary : isDark ? 'rgba(26,26,26,0.60)' : 'rgba(248,246,241,0.60)',
    color: active ? '#1A1A1A' : colors.secondaryText,
    border: `1px solid ${active ? colors.primary : colors.border}`,
    fontFamily: 'inherit',
  });

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns:
      viewMode === 'list' ? '1fr' : `repeat(auto-fit, ${getMinMaxValue()})`,
    gap: windowWidth < 480 ? '6px' : '8px',
    padding: '16px',
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <h1 style={titleStyle}>Products</h1>
          <div style={viewToggleStyle}>
            <button style={viewButtonStyle(viewMode === 'grid')} onClick={() => setViewMode('grid')}>
              <Grid size={16} />
            </button>
            <button style={viewButtonStyle(viewMode === 'list')} onClick={() => setViewMode('list')}>
              <List size={16} />
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', width: '100%' }}>
          <Search
            size={16}
            color={colors.secondaryText}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          />
          <input
            style={searchInputStyle}
            type="text"
            placeholder="Search products…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
          />
          {searchDraft && (
            <button
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                color: colors.secondaryText,
              }}
              onClick={() => setSearchDraft('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '12px',
            gap: '8px',
          }}
        >
          <button style={pillButtonStyle} onClick={() => setShowFilters(!showFilters)}>
            <Filter size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: colors.primary,
                  color: '#1A1A1A',
                  fontSize: '9px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>

          <select
            style={sortSelectStyle}
            value={ordering}
            onChange={(e) => setParam({ ordering: e.target.value })}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showFilters && (
        <div
          style={{
            padding: '16px 20px',
            background: isDark ? 'rgba(20,20,20,0.90)' : 'rgba(255,255,255,0.90)',
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ marginBottom: '14px' }}>
            <span style={filterLabelStyle}>Category</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {categoryChips.map((c) => (
                <button
                  key={c.id}
                  style={chipStyle(category === c.slug)}
                  onClick={() => setParam({ category: category === c.slug ? '' : c.slug })}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <span style={filterLabelStyle}>Wearer</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {Object.entries(GENDER_LABEL).map(([key, label]) => (
                <button
                  key={key}
                  style={chipStyle(gender === key)}
                  onClick={() => setParam({ gender: gender === key ? '' : key })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <span style={filterLabelStyle}>Availability</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button style={chipStyle(onSale)} onClick={() => setParam({ on_sale: !onSale })}>
                On sale
              </button>
              <button style={chipStyle(inStock)} onClick={() => setParam({ in_stock: !inStock })}>
                In stock
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: colors.secondaryText }}>
              {count} product{count === 1 ? '' : 's'}
            </span>
            <button
              style={{
                fontSize: '11px',
                color: colors.primary,
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: 0,
                fontFamily: 'inherit',
              }}
              onClick={clearFilters}
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={gridStyle}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 320 }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: colors.secondaryText }}>
          <AlertCircle size={28} style={{ color: colors.error, marginBottom: 12 }} />
          <p style={{ fontSize: '14px', margin: 0 }}>{error}</p>
          <button className="btn btn-ghost" style={{ marginTop: 18 }} onClick={() => setParam({ page })}>
            Try again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: colors.secondaryText }}>
          <div style={{ fontSize: '48px', color: colors.primary, opacity: 0.3, marginBottom: '16px' }}>✦</div>
          <p style={{ fontSize: '14px', margin: 0 }}>No products found</p>
          <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
            Try adjusting your filters or search
          </p>
        </div>
      ) : (
        <>
          <div style={{ fontSize: '12px', color: colors.secondaryText, padding: '0 16px 8px' }}>
            Showing {products.length} of {count} products
          </div>
          <div style={gridStyle}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={handleProductPress}
                onAction={handleProductAction}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                padding: '20px 0 6px',
              }}
            >
              <button
                className="icon-btn"
                disabled={page <= 1}
                onClick={() => setParam({ page: page - 1 })}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: 13, color: colors.secondaryText }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="icon-btn"
                disabled={page >= totalPages}
                onClick={() => setParam({ page: page + 1 })}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductsPage;
