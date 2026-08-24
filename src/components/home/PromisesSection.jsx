import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Truck, Ruler, Shield, Users, Heart, Clock, ChevronLeft, Sparkles } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

// Kept at module scope so the array identity is stable across renders — the
// auto-scroll effect depends on its length and would restart every render.
const promises = [
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Same-day in Accra',
  },
  {
    icon: Ruler,
    title: 'Perfect Fit',
    description: 'Tailored to you',
  },
  {
    icon: Shield,
    title: 'Quality Guaranteed',
    description: 'Premium materials',
  },
  {
    icon: Users,
    title: 'Expert Team',
    description: '5,000+ happy clients',
  },
  {
    icon: Heart,
    title: 'Loved by Many',
    description: 'Trusted brand',
  },
  {
    icon: Clock,
    title: 'On Time',
    description: 'Always punctual',
  },
];

const PromisesSection = () => {
  const { colors, theme } = useTheme();
  const isDark = theme.mode === 'dark';

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [isVisible, setIsVisible] = useState(false);
  const [showArrows, setShowArrows] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const sectionRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const autoScrollInterval = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Check if horizontal scroll is needed
  useEffect(() => {
    const checkOverflow = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        setShowArrows(container.scrollWidth > container.clientWidth);
      }
    };
    
    setTimeout(checkOverflow, 100);
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [windowWidth]);

  // Auto-scroll functionality
  useEffect(() => {
    if (!isVisible || !showArrows || !isAutoScrolling) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const totalItems = promises.length;
    const itemWidth = container.scrollWidth / totalItems;

    autoScrollInterval.current = setInterval(() => {
      const nextIndex = (currentIndex + 1) % totalItems;
      setCurrentIndex(nextIndex);
      
      container.scrollTo({
        left: nextIndex * itemWidth,
        behavior: 'smooth',
      });
    }, 3000);

    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [currentIndex, isVisible, showArrows, isAutoScrolling]);

  // Stop auto-scroll on hover
  const handleMouseEnter = () => {
    setIsAutoScrolling(false);
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
  };

  const handleMouseLeave = () => {
    setIsAutoScrolling(true);
  };

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth',
      });
      setIsAutoScrolling(false);
      setTimeout(() => setIsAutoScrolling(true), 5000);
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth',
      });
      setIsAutoScrolling(false);
      setTimeout(() => setIsAutoScrolling(true), 5000);
    }
  };

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  // Styles
  const sectionStyle = {
    padding: isMobile ? '30px 0' : '50px 0',
    position: 'relative',
  };

  // Header
  const headerStyle = {
    textAlign: 'center',
    marginBottom: isMobile ? '30px' : '40px',
  };

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 14px',
    borderRadius: '20px',
    background: isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.05)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)'}`,
    fontSize: '11px',
    fontWeight: 500,
    color: colors.primary,
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
    marginBottom: '12px',
  };

  const titleStyle = {
    fontSize: isMobile ? '24px' : isTablet ? '32px' : '38px',
    fontWeight: 800,
    color: colors.heading,
    margin: 0,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  };

  const highlightStyle = {
    color: colors.primary,
  };

  const descStyle = {
    fontSize: isMobile ? '14px' : '16px',
    color: colors.secondaryText,
    lineHeight: 1.6,
    marginTop: '10px',
    maxWidth: '480px',
    marginLeft: 'auto',
    marginRight: 'auto',
  };

  // Scroll container
  const scrollContainerStyle = {
    display: 'flex',
    overflowX: 'auto',
    gap: isMobile ? '0px' : '0px',
    padding: isMobile ? '10px 16px' : '10px 20px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    WebkitOverflowScrolling: 'touch',
    scrollSnapType: 'x mandatory',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'scroll-behavior 0.5s ease',
  };

  // Chain wrapper
  const chainWrapperStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  // Individual circle wrapper
  const circleWrapperStyle = (index) => ({
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    transform: isVisible ? 'scale(1)' : 'scale(0.8)',
    opacity: isVisible ? 1 : 0,
    transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 100}ms`,
    flexShrink: 0,
  });

  // Circle style - overlapping
  const circleStyle = {
    width: isMobile ? '120px' : isTablet ? '150px' : '170px',
    height: isMobile ? '120px' : isTablet ? '150px' : '170px',
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: isDark ? 'rgba(20,20,20,0.80)' : 'rgba(255,255,255,0.80)',
    border: `2px solid ${isDark ? 'rgba(168, 137, 79,0.12)' : 'rgba(168, 137, 79,0.15)'}`,
    position: 'relative',
    zIndex: 2,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'default',
    boxShadow: isDark 
      ? '0 4px 20px rgba(0,0,0,0.20)' 
      : '0 4px 20px rgba(0,0,0,0.04)',
    scrollSnapAlign: 'center',
    flexShrink: 0,
  };

  // Connecting line between circles
  const connectorStyle = (index) => ({
    width: isMobile ? '16px' : '24px',
    height: '2px',
    background: isDark ? 'rgba(168, 137, 79,0.15)' : 'rgba(168, 137, 79,0.20)',
    position: 'relative',
    zIndex: 1,
    transform: isVisible ? 'scaleX(1)' : 'scaleX(0)',
    transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 100 + 50}ms`,
    transformOrigin: 'left',
    flexShrink: 0,
  });

  // Gold ring around circle
  const goldRingStyle = {
    position: 'absolute',
    inset: '-6px',
    borderRadius: '50%',
    border: `2px solid ${isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.10)'}`,
    pointerEvents: 'none',
  };

  // Icon style
  const iconStyle = {
    color: colors.primary,
    marginBottom: isMobile ? '4px' : '6px',
  };

  // Title inside circle
  const circleTitleStyle = {
    fontSize: isMobile ? '11px' : isTablet ? '13px' : '14px',
    fontWeight: 700,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 1.2,
    padding: '0 8px',
  };

  // Description inside circle (small)
  const circleDescStyle = {
    fontSize: isMobile ? '8px' : '9px',
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: '2px',
    padding: '0 8px',
    lineHeight: 1.2,
  };

  // Arrow styles
  const arrowStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 10,
    width: isMobile ? '36px' : '44px',
    height: isMobile ? '36px' : '44px',
    borderRadius: '50%',
    background: isDark ? 'rgba(20,20,20,0.85)' : 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(12px)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)'}`,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.text,
    transition: 'all 0.3s ease',
    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.30)' : '0 4px 20px rgba(0,0,0,0.06)',
  };

  const arrowLeftStyle = {
    ...arrowStyle,
    left: isMobile ? '4px' : '8px',
  };

  const arrowRightStyle = {
    ...arrowStyle,
    right: isMobile ? '4px' : '8px',
  };

  // Progress dots
  const dotsContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginTop: isMobile ? '16px' : '20px',
  };

  const dotStyle = (active) => ({
    width: active ? '28px' : '8px',
    height: '8px',
    borderRadius: '4px',
    background: active ? colors.primary : (isDark ? 'rgba(168, 137, 79,0.15)' : 'rgba(168, 137, 79,0.20)'),
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  });

  // Dot click handler
  const handleDotClick = (index) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const totalItems = promises.length;
      const itemWidth = container.scrollWidth / totalItems;
      
      setCurrentIndex(index);
      container.scrollTo({
        left: index * itemWidth,
        behavior: 'smooth',
      });
      
      setIsAutoScrolling(false);
      setTimeout(() => setIsAutoScrolling(true), 5000);
    }
  };

  return (
    <div 
      style={sectionStyle} 
      ref={sectionRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div style={headerStyle}>
        <div style={badgeStyle}>
          <Sparkles size={14} />
          Why Choose Us
        </div>
        <h2 style={titleStyle}>
          Our <span style={highlightStyle}>Promise</span> to You
        </h2>
        <p style={descStyle}>
          We're committed to delivering exceptional quality and service 
          with every piece we create.
        </p>
      </div>

      {/* Scroll Container with Arrows */}
      <div style={{ position: 'relative' }}>
        {/* Left Arrow */}
        {showArrows && (
          <button
            style={arrowLeftStyle}
            onClick={scrollLeft}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(168, 137, 79,0.15)' : 'rgba(168, 137, 79,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(20,20,20,0.85)' : 'rgba(255,255,255,0.85)';
            }}
          >
            <ChevronLeft size={isMobile ? 18 : 22} />
          </button>
        )}

        {/* Right Arrow */}
        {showArrows && (
          <button
            style={arrowRightStyle}
            onClick={scrollRight}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(168, 137, 79,0.15)' : 'rgba(168, 137, 79,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(20,20,20,0.85)' : 'rgba(255,255,255,0.85)';
            }}
          >
            <ChevronRight size={isMobile ? 18 : 22} />
          </button>
        )}

        {/* Scrollable Chain */}
        <div
          ref={scrollContainerRef}
          style={scrollContainerStyle}
          className="hide-scrollbar"
        >
          {promises.map((promise, index) => {
            const Icon = promise.icon;
            const isLast = index === promises.length - 1;

            return (
              <div key={index} style={chainWrapperStyle}>
                {/* Circle */}
                <div style={circleWrapperStyle(index)}>
                  <div
                    style={circleStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.boxShadow = isDark 
                        ? '0 8px 32px rgba(168, 137, 79,0.15)' 
                        : '0 8px 32px rgba(168, 137, 79,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.borderColor = isDark ? 'rgba(168, 137, 79,0.12)' : 'rgba(168, 137, 79,0.15)';
                      e.currentTarget.style.boxShadow = isDark 
                        ? '0 4px 20px rgba(0,0,0,0.20)' 
                        : '0 4px 20px rgba(0,0,0,0.04)';
                    }}
                  >
                    <div style={goldRingStyle} />
                    <Icon size={isMobile ? 22 : 28} style={iconStyle} />
                    <div style={circleTitleStyle}>{promise.title}</div>
                    <div style={circleDescStyle}>{promise.description}</div>
                  </div>
                </div>

                {/* Connector line between circles */}
                {!isLast && (
                  <div style={connectorStyle(index)} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Dots */}
      {showArrows && (
        <div style={dotsContainerStyle}>
          {promises.map((_, index) => (
            <div
              key={index}
              style={dotStyle(currentIndex === index)}
              onClick={() => handleDotClick(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PromisesSection;