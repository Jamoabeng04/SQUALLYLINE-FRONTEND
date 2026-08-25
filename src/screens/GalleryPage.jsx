import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, LayoutGrid, LayoutList, AlertCircle } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../providers/ToastProvider';
import { useAuth } from '../providers/AuthProvider';
import GalleryCard from '../components/GalleryCard';
import { shop } from '../api/endpoints';
import { adaptStyle, errorText, GENDER_LABEL } from '../api/adapters';

// The masonry look depends on tiles of differing heights, but a style row has
// no aspect ratio of its own. Derive one from the slug so the same style always
// lands in the same shape and the column layout never reshuffles mid-scroll.
const RATIOS = [1.18, 1.34, 1.52, 1.72, 1.92, 1.42, 2.08];
const ratioFor = (seed = '') => {
  let hash = 0;
  for (let i = 0; i < String(seed).length; i += 1) {
    hash = (hash * 31 + String(seed).charCodeAt(i)) % 997;
  }
  return RATIOS[hash % RATIOS.length];
};

// Chips that don't come from the category tree. Each carries the query params
// the styles endpoint actually understands.
const STATIC_CHIPS = [
  { key: 'all', label: 'All', params: {} },
  { key: 'featured', label: 'Featured', params: { featured: 'true' } },
  { key: 'trending', label: 'Trending', params: { ordering: '-views' } },
  { key: 'custom', label: 'Made to Measure', params: { customizable: 'true' } },
];

const GalleryPage = () => {
  const navigate = useNavigate();
  const { colors, theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState('all');
  const [categoryChips, setCategoryChips] = useState([]);

  const [feedMode, setFeedMode] = useState(false);
  const [cols, setCols] = useState(2);

  const sentinelRef = useRef(null);
  // The observer callback closes over the paging state, so keep a live copy the
  // callback can read without being torn down and rebuilt on every change.
  const stateRef = useRef({ page: 1, totalPages: 1, busy: true });
  stateRef.current = { page, totalPages, busy: loading || loadingMore };

  const hasMore = page < totalPages;

  // Top-level categories become chips, so the filter row reflects whatever the
  // client has actually published rather than a hardcoded list.
  useEffect(() => {
    let cancelled = false;
    shop
      .categories()
      .then((rows) => {
        if (cancelled) return;
        setCategoryChips(
          (rows || [])
            .filter((r) => !r.parent)
            .map((r) => ({ key: `cat:${r.slug}`, label: r.name, params: { category: r.slug } }))
        );
      })
      .catch(() => {
        // Chips are a convenience; the gallery still works without them.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const chips = useMemo(() => [...STATIC_CHIPS, ...categoryChips], [categoryChips]);

  const activeParams = useMemo(() => {
    const chip = chips.find((c) => c.key === activeChip);
    return chip ? chip.params : {};
  }, [chips, activeChip]);

  // 400 ms is long enough to finish a word, short enough to feel live.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const buildParams = useCallback(
    (pageNumber) => ({
      ...activeParams,
      ...(search ? { search } : {}),
      page: pageNumber,
    }),
    [activeParams, search]
  );

  // First page. Changing the filter or the search term starts a fresh list
  // rather than appending to the one already on screen.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    shop
      .styles(buildParams(1))
      .then((data) => {
        if (cancelled) return;
        setItems((data?.results || []).map(adaptStyle));
        setCount(data?.count ?? 0);
        setTotalPages(data?.total_pages ?? 1);
        setPage(1);
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err, 'Could not load the gallery.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [buildParams, reloadKey]);

  const loadMore = useCallback(() => {
    const { page: current, totalPages: total, busy } = stateRef.current;
    if (busy || current >= total) return;
    setLoadingMore(true);
    shop
      .styles(buildParams(current + 1))
      .then((data) => {
        const next = (data?.results || []).map(adaptStyle);
        // A slug can arrive twice if a row shifts pages between requests.
        setItems((prev) => {
          const seen = new Set(prev.map((p) => p.slug));
          return [...prev, ...next.filter((n) => !seen.has(n.slug))];
        });
        setPage(data?.current_page ?? current + 1);
        setTotalPages(data?.total_pages ?? total);
      })
      .catch((err) => showToast(errorText(err, 'Could not load more styles.'), 'error'))
      .finally(() => setLoadingMore(false));
  }, [buildParams, showToast]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1, rootMargin: '200px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setCols(feedMode ? 1 : width < 520 ? 2 : width < 900 ? 3 : width < 1280 ? 4 : 5);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [feedMode]);

  // GalleryCard flips its own icon straight away; this only has to persist the
  // change and put the row back if the server refuses it.
  const handleAction = useCallback(
    (action, slug) => {
      if (action !== 'like' && action !== 'bookmark') return;
      if (!isAuthenticated) {
        showToast('Sign in first to save styles.', 'info');
        navigate('/login');
        return;
      }
      const request = action === 'like' ? shop.likeStyle(slug) : shop.saveStyle(slug);
      request.catch((err) => showToast(errorText(err, 'Could not update that style.'), 'error'));
    },
    [isAuthenticated, navigate, showToast]
  );

  // GalleryCard navigates with item.id, and the order screen looks styles up by
  // slug, so the slug is what the card has to carry as its id. The list
  // endpoint doesn't send tags, so the chips below the image describe the cut
  // from the fields it does send.
  const cards = useMemo(
    () =>
      items.map((style) => ({
        id: style.slug,
        image: style.image,
        aspectRatio: ratioFor(style.slug),
        name: style.name,
        likes: style.likes,
        isLiked: style.isLiked,
        isBookmarked: style.isSaved,
        tags: [
          style.category,
          GENDER_LABEL[style.gender],
          style.makingDays ? `${style.makingDays} day make` : null,
        ].filter(Boolean),
        designer: '',
        isNew: style.badge?.type === 'new',
      })),
    [items]
  );

  const skeletonHeights = [180, 240, 200, 260, 190, 230, 210, 250];

  // Styles
  const pageStyle = {
    backgroundColor: colors.mainBg,
    minHeight: '100vh',
    overflowX: 'hidden',
  };

  const filterBarStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 40,
    background: isDark ? 'rgba(10,10,10,0.85)' : 'rgba(248,246,241,0.88)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderBottom: `1px solid ${isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.15)'}`,
    padding: '12px 16px',
  };

  const searchWrapperStyle = {
    position: 'relative',
    width: '100%',
  };

  const searchInputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 16px 10px 40px',
    borderRadius: '24px',
    background: isDark ? 'rgba(26,26,26,0.90)' : 'rgba(255,255,255,0.90)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.15)' : 'rgba(212, 175, 55,0.25)'}`,
    fontSize: '13px',
    color: colors.text,
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    fontFamily: 'inherit',
  };

  const chipsContainerStyle = {
    overflowX: 'auto',
    display: 'flex',
    gap: '8px',
    paddingBottom: '2px',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  };

  const chipStyle = (isActive) => ({
    flexShrink: 0,
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
    background: isActive ? '#D4AF37' : isDark ? 'rgba(26,26,26,0.80)' : 'rgba(255,255,255,0.80)',
    color: isActive ? '#1A1A1A' : colors.secondaryText,
    border: isActive
      ? '1px solid #D4AF37'
      : isDark
        ? '1px solid rgba(212, 175, 55,0.12)'
        : '1px solid rgba(212,175,55,0.22)',
  });

  const pageHeadingStyle = {
    padding: '20px 16px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const headingTitleStyle = {
    fontSize: '24px',
    fontWeight: 800,
    color: colors.heading,
    margin: 0,
    letterSpacing: '-0.3px',
  };

  const headingCountStyle = {
    fontSize: '12px',
    color: colors.secondaryText,
    margin: '2px 0 0',
  };

  const layoutToggleStyle = {
    background: isDark ? 'rgba(26,26,26,0.80)' : 'rgba(255,255,255,0.80)',
    border: isDark ? '1px solid rgba(212, 175, 55,0.12)' : '1px solid #EBEAE4',
    borderRadius: '10px',
    padding: '4px',
    display: 'flex',
    gap: '4px',
  };

  const layoutButtonStyle = (isActive) => ({
    padding: '6px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isActive ? '#D4AF37' : 'transparent',
    color: isActive ? '#1A1A1A' : colors.secondaryText,
    border: 'none',
  });

  const masonryStyle = {
    columnCount: feedMode ? 1 : cols,
    columnGap: '16px',
    padding: '0 clamp(12px, 2.5vw, 32px)',
    width: '100%',
    boxSizing: 'border-box',
  };

  const itemWrapperStyle = {
    display: 'inline-block',
    width: '100%',
    breakInside: 'avoid',
    WebkitColumnBreakInside: 'avoid',
    marginBottom: '16px',
    verticalAlign: 'top',
  };

  const spinnerStyle = {
    display: 'flex',
    justifyContent: 'center',
    padding: '20px',
  };

  const spinnerCircleStyle = {
    width: '24px',
    height: '24px',
    border: '2px solid rgba(212,175,55,0.22)',
    borderTop: '2px solid #D4AF37',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  };

  const endMarkerStyle = {
    padding: '32px 20px',
    textAlign: 'center',
  };

  const endLineStyle = {
    height: '0.5px',
    background: '#D4AF37',
    opacity: 0.3,
    margin: '0 auto 16px',
    width: '40px',
  };

  const endTextStyle = {
    fontSize: '12px',
    color: colors.secondaryText,
    letterSpacing: '0.3px',
  };

  const emptyStateStyle = {
    textAlign: 'center',
    padding: '60px 20px',
    color: colors.secondaryText,
  };

  const renderSkeletons = () =>
    skeletonHeights.map((h, i) => (
      <div key={`skeleton-${i}`} style={itemWrapperStyle}>
        <div
          className="skeleton"
          style={{ height: `${h}px`, borderRadius: '16px', width: '100%' }}
        />
      </div>
    ));

  const renderBody = () => {
    if (loading) {
      return <div className="squally-gallery" style={masonryStyle}>{renderSkeletons()}</div>;
    }

    if (error) {
      return (
        <div style={emptyStateStyle}>
          <AlertCircle size={28} style={{ color: colors.error, marginBottom: 12 }} />
          <p style={{ fontSize: '14px', margin: 0 }}>{error}</p>
          <button
            className="btn btn-ghost"
            style={{ marginTop: 18 }}
            onClick={() => setReloadKey((k) => k + 1)}
          >
            Try again
          </button>
        </div>
      );
    }

    if (cards.length === 0) {
      return (
        <div style={emptyStateStyle}>
          <div style={{ fontSize: '48px', color: colors.primary, opacity: 0.3, marginBottom: 16 }}>
            ✦
          </div>
          <p style={{ fontSize: '14px', margin: 0 }}>No styles here yet</p>
          <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
            {search || activeChip !== 'all'
              ? 'Try another filter or search term'
              : 'The lookbook is still being prepared'}
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="squally-gallery" style={masonryStyle}>
          {cards.map((item) => (
            <div key={item.id} style={itemWrapperStyle}>
              <GalleryCard
                item={item}
                onNavigate={(path) => navigate(path)}
                onAction={handleAction}
              />
            </div>
          ))}
        </div>

        {/* Sentinel — crossing it pulls the next page. */}
        <div ref={sentinelRef} style={{ height: '40px' }} />

        {loadingMore && (
          <div style={spinnerStyle}>
            <div style={spinnerCircleStyle} />
          </div>
        )}

        {!hasMore && (
          <div style={endMarkerStyle}>
            <div style={endLineStyle} />
            <p style={endTextStyle}>You&apos;ve seen it all</p>
          </div>
        )}
      </>
    );
  };

  return (
    <div style={pageStyle}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes menuItemPop {
          0%   { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.6); }
          60%  { transform: translate(var(--tx), var(--ty)) scale(1.1); }
          100% { opacity: 1; transform: translate(var(--tx), var(--ty)) scale(1); }
        }
        @keyframes heartBeat {
          0%   { transform: scale(1); }
          25%  { transform: scale(1.35); }
          50%  { transform: scale(0.95); }
          75%  { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes ripple {
          from { transform: scale(0); opacity: 0.6; }
          to   { transform: scale(2.5); opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .squally-gallery::-webkit-scrollbar { display: none; }
        .squally-gallery { -ms-overflow-style: none; scrollbar-width: none; }
        .squally-card-wrapper { break-inside: avoid; }
        .squally-img { transition: transform 0.5s cubic-bezier(0.4,0,0.2,1); }
        .squally-card-root:hover .squally-img { transform: scale(1.04); }
        .menu-item-pop {
          animation: menuItemPop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .menu-item-pop-exit {
          animation: menuItemPop 0.2s cubic-bezier(0.4,0,0.2,1) reverse forwards;
        }
      `}} />

      <div style={filterBarStyle}>
        <div style={searchWrapperStyle}>
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
            placeholder="Search styles, tags…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(212, 175, 55,0.60)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212, 175, 55,0.10)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = isDark
                ? 'rgba(212, 175, 55,0.15)'
                : 'rgba(212, 175, 55,0.25)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {searchInput && (
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
              onClick={() => setSearchInput('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ marginTop: '10px' }}>
          <div style={chipsContainerStyle} className="hide-scrollbar">
            {chips.map((chip) => (
              <button
                key={chip.key}
                style={chipStyle(activeChip === chip.key)}
                onClick={() => setActiveChip(chip.key)}
                onMouseEnter={(e) => {
                  if (activeChip !== chip.key) {
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55,0.45)';
                    e.currentTarget.style.color = colors.text;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeChip !== chip.key) {
                    e.currentTarget.style.borderColor = isDark
                      ? 'rgba(212, 175, 55,0.12)'
                      : 'rgba(212,175,55,0.22)';
                    e.currentTarget.style.color = colors.secondaryText;
                  }
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={pageHeadingStyle}>
        <div style={{ flex: 1 }}>
          <h1 style={headingTitleStyle}>Gallery</h1>
          <p style={headingCountStyle}>
            {loading ? 'Loading…' : `${count} ${count === 1 ? 'style' : 'styles'}`}
          </p>
        </div>
        <div style={layoutToggleStyle}>
          <button style={layoutButtonStyle(!feedMode)} onClick={() => setFeedMode(false)}>
            <LayoutGrid size={16} />
          </button>
          <button style={layoutButtonStyle(feedMode)} onClick={() => setFeedMode(true)}>
            <LayoutList size={16} />
          </button>
        </div>
      </div>

      {renderBody()}
    </div>
  );
};

export default GalleryPage;
