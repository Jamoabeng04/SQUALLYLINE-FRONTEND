import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles, Flame, TrendingUp, Eye } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { shop } from '../../api/endpoints';
import { adaptStyle } from '../../api/adapters';

// 12.4k reads better than 12400 on a badge this small.
const compactViews = (value) => {
  const n = Number(value) || 0;
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(n < 10000 ? 1 : 0)}k`;
};

const TrendingStyles = () => {
  const navigate = useNavigate();
  const { colors, theme } = useTheme();
  const isDark = theme.mode === 'dark';

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [isHovered, setIsHovered] = useState(false);
  const [trendingStyles, setTrendingStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // Most-viewed styles, straight off the catalogue.
  useEffect(() => {
    let cancelled = false;
    shop
      .styles({ ordering: '-views' })
      .then((data) => {
        if (cancelled) return;
        setTrendingStyles((data?.results || []).slice(0, 8).map(adaptStyle));
      })
      .catch(() => {
        // A quiet homepage beats an error banner on a decorative rail.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const itemStride = (isMobile ? 260 : 320) + (isMobile ? 12 : 16);

  const scroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const amount = isMobile ? 280 : 320;
    scrollContainerRef.current.scrollTo({
      left: scrollContainerRef.current.scrollLeft + (direction === 'left' ? -amount : amount),
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return undefined;
    const handleScroll = () => {
      const index = Math.round(container.scrollLeft / itemStride);
      setActiveIndex(Math.min(index, Math.max(0, trendingStyles.length - 1)));
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [itemStride, trendingStyles.length]);

  // Styles
  const sectionStyle = {
    margin: isMobile ? '20px 0' : '32px 0',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isMobile ? '14px' : '18px',
  };

  const titleContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const titleStyle = {
    fontSize: isMobile ? '20px' : '26px',
    fontWeight: 700,
    color: colors.heading,
    margin: 0,
  };

  const titleIconStyle = {
    color: colors.primary,
  };

  const viewAllStyle = {
    fontSize: isMobile ? '12px' : '14px',
    color: colors.primary,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    fontFamily: 'inherit',
  };

  const scrollContainerStyle = {
    display: 'flex',
    overflowX: 'auto',
    gap: isMobile ? '12px' : '16px',
    padding: isMobile ? '4px 0 8px' : '8px 0 12px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    WebkitOverflowScrolling: 'touch',
    scrollSnapType: 'x mandatory',
    position: 'relative',
  };

  const itemStyle = {
    flexShrink: 0,
    width: isMobile ? '260px' : '320px',
    height: isMobile ? '340px' : '420px',
    borderRadius: '14px',
    overflow: 'hidden',
    position: 'relative',
    cursor: 'pointer',
    scrollSnapAlign: 'start',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
  };

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const overlayStyle = {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, transparent 40%, rgba(10,10,10,0.70) 100%)',
    opacity: 0.6,
    transition: 'opacity 0.4s ease',
  };

  const nameContainerStyle = {
    position: 'absolute',
    bottom: isMobile ? '20px' : '28px',
    left: isMobile ? '16px' : '22px',
    right: isMobile ? '16px' : '22px',
    zIndex: 2,
  };

  const nameStyle = {
    fontSize: isMobile ? '16px' : '20px',
    fontWeight: 700,
    color: '#F8F6F1',
    margin: 0,
    letterSpacing: '0.3px',
    textShadow: '0 2px 12px rgba(0,0,0,0.3)',
  };

  const categoryStyle = {
    fontSize: isMobile ? '11px' : '13px',
    color: 'rgba(248,246,241,0.70)',
    marginTop: '4px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    textShadow: '0 2px 8px rgba(0,0,0,0.2)',
  };

  const viewsBadgeStyle = {
    position: 'absolute',
    top: isMobile ? '12px' : '16px',
    right: isMobile ? '12px' : '16px',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: isMobile ? '4px 10px' : '6px 14px',
    borderRadius: '20px',
    background: 'rgba(10,10,10,0.50)',
    backdropFilter: 'blur(8px)',
    fontSize: isMobile ? '10px' : '12px',
    color: 'rgba(248,246,241,0.85)',
    border: '1px solid rgba(255,255,255,0.06)',
  };

  const trendingBadgeStyle = {
    position: 'absolute',
    top: isMobile ? '12px' : '16px',
    left: isMobile ? '12px' : '16px',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: isMobile ? '4px 10px' : '6px 14px',
    borderRadius: '20px',
    background: colors.primary,
    color: '#1A1A1A',
    fontSize: isMobile ? '9px' : '11px',
    fontWeight: 700,
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
  };

  const arrowStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 5,
    width: isMobile ? '32px' : '40px',
    height: isMobile ? '32px' : '40px',
    borderRadius: '50%',
    background: isDark ? 'rgba(20,20,20,0.80)' : 'rgba(255,255,255,0.80)',
    backdropFilter: 'blur(12px)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.15)'}`,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.text,
    transition: 'all 0.3s ease',
    boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.30)' : '0 4px 16px rgba(0,0,0,0.06)',
  };

  const arrowLeftStyle = { ...arrowStyle, left: isMobile ? '4px' : '8px' };
  const arrowRightStyle = { ...arrowStyle, right: isMobile ? '4px' : '8px' };

  const dotsContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '6px',
    marginTop: isMobile ? '12px' : '16px',
  };

  const dotStyle = (active) => ({
    width: active ? '24px' : '6px',
    height: '6px',
    borderRadius: '3px',
    background: active ? colors.primary : isDark ? 'rgba(212, 175, 55,0.15)' : 'rgba(212, 175, 55,0.20)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    border: 'none',
    padding: 0,
  });

  // Nothing published yet — leave the homepage clean rather than showing an
  // empty rail.
  if (!loading && trendingStyles.length === 0) return null;

  return (
    <div style={sectionStyle}>
      <div style={headerStyle}>
        <div style={titleContainerStyle}>
          <TrendingUp size={isMobile ? 20 : 24} style={titleIconStyle} />
          <h2 style={titleStyle}>Trending Styles</h2>
          <Flame size={isMobile ? 14 : 18} color="#EF4444" />
        </div>
        <button style={viewAllStyle} onClick={() => navigate('/gallery')}>
          View All <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <div style={scrollContainerStyle}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={`trend-skeleton-${i}`}
              className="skeleton"
              style={{
                flexShrink: 0,
                width: isMobile ? '260px' : '320px',
                height: isMobile ? '340px' : '420px',
                borderRadius: '14px',
              }}
            />
          ))}
        </div>
      ) : (
        <>
          <div style={{ position: 'relative' }}>
            <button
              style={arrowLeftStyle}
              aria-label="Scroll left"
              onClick={() => scroll('left')}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark
                  ? 'rgba(212, 175, 55,0.15)'
                  : 'rgba(212, 175, 55,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDark
                  ? 'rgba(20,20,20,0.80)'
                  : 'rgba(255,255,255,0.80)';
              }}
            >
              <ChevronRight size={isMobile ? 16 : 20} style={{ transform: 'rotate(180deg)' }} />
            </button>

            <button
              style={arrowRightStyle}
              aria-label="Scroll right"
              onClick={() => scroll('right')}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark
                  ? 'rgba(212, 175, 55,0.15)'
                  : 'rgba(212, 175, 55,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDark
                  ? 'rgba(20,20,20,0.80)'
                  : 'rgba(255,255,255,0.80)';
              }}
            >
              <ChevronRight size={isMobile ? 16 : 20} />
            </button>

            <div
              ref={scrollContainerRef}
              style={scrollContainerStyle}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {trendingStyles.map((style, index) => (
                <div
                  key={style.id}
                  style={itemStyle}
                  onClick={() => navigate(`/styles/order/${style.slug}`)}
                  onMouseEnter={(e) => {
                    const img = e.currentTarget.querySelector('.style-img');
                    if (img) img.style.transform = 'scale(1.08)';
                  }}
                  onMouseLeave={(e) => {
                    const img = e.currentTarget.querySelector('.style-img');
                    if (img) img.style.transform = 'scale(1)';
                  }}
                >
                  <img
                    src={style.image}
                    alt={style.name}
                    className="style-img"
                    style={imageStyle}
                    draggable={false}
                  />
                  <div style={overlayStyle} />

                  {/* The three most-viewed carry the badge. */}
                  {index < 3 && (
                    <div style={trendingBadgeStyle}>
                      <Sparkles size={isMobile ? 10 : 12} />
                      Trending
                    </div>
                  )}

                  {style.views > 0 && (
                    <div style={viewsBadgeStyle}>
                      <Eye size={isMobile ? 10 : 12} />
                      {compactViews(style.views)}
                    </div>
                  )}

                  <div style={nameContainerStyle}>
                    <div style={nameStyle}>{style.name}</div>
                    <div style={categoryStyle}>{style.category}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {trendingStyles.length > 1 && (
            <div style={dotsContainerStyle}>
              {trendingStyles.map((style, idx) => (
                <button
                  key={style.id}
                  aria-label={`Go to ${style.name}`}
                  style={dotStyle(activeIndex === idx)}
                  onClick={() => {
                    scrollContainerRef.current?.scrollTo({
                      left: idx * itemStride,
                      behavior: 'smooth',
                    });
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TrendingStyles;
