import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Scissors, Users, Star, Ruler } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const EndlessStylesBanner = () => {
  const navigate = useNavigate();
  const { colors, theme } = useTheme();
  const isDark = theme.mode === 'dark';

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  // Banner style - FIXED overflow
  const bannerStyle = {
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    padding: isMobile ? '28px 16px' : isTablet ? '36px 24px' : '44px 32px',
    borderRadius: '16px',
    position: 'relative',
    overflow: 'hidden',
    margin: isMobile ? '16px 0' : '24px 0',
    background: colors.surfaceL2,
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.12)' : 'rgba(168, 137, 79,0.18)'}`,
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: isMobile ? '16px' : '24px',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: isHovered 
      ? isDark 
        ? '0 12px 48px rgba(0,0,0,0.40), 0 0 0 1px rgba(168, 137, 79,0.08)' 
        : '0 12px 48px rgba(0,0,0,0.06), 0 0 0 1px rgba(168, 137, 79,0.08)'
      : 'none',
    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
  };

  // Decorative elements
  const decorativeGlowStyle = {
    position: 'absolute',
    top: '-40%',
    right: isMobile ? '-20%' : '-5%',
    width: isMobile ? '300px' : '500px',
    height: isMobile ? '300px' : '500px',
    borderRadius: '50%',
    background: 'transparent',
    pointerEvents: 'none',
  };

  const decorativeGlow2Style = {
    position: 'absolute',
    bottom: '-30%',
    left: isMobile ? '-30%' : '-5%',
    width: isMobile ? '200px' : '350px',
    height: isMobile ? '200px' : '350px',
    borderRadius: '50%',
    background: 'transparent',
    pointerEvents: 'none',
  };

  // Gold sparkle decoration
  const sparkleStyle = {
    position: 'absolute',
    top: isMobile ? '10%' : '15%',
    right: isMobile ? '10%' : '20%',
    fontSize: isMobile ? '24px' : '40px',
    color: colors.primary,
    opacity: 0.06,
    pointerEvents: 'none',
    userSelect: 'none',
    transform: 'rotate(12deg)',
  };

  const sparkle2Style = {
    position: 'absolute',
    bottom: isMobile ? '15%' : '20%',
    left: isMobile ? '8%' : '12%',
    fontSize: isMobile ? '18px' : '30px',
    color: colors.primary,
    opacity: 0.04,
    pointerEvents: 'none',
    userSelect: 'none',
    transform: 'rotate(-8deg)',
  };

  // Content container - FIXED overflow
  const contentStyle = {
    position: 'relative',
    zIndex: 2,
    flex: 1,
    width: '100%',
    maxWidth: isMobile ? '100%' : '65%',
    minWidth: 0,
    boxSizing: 'border-box',
  };

  // Badge
  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: isMobile ? '4px 10px' : '6px 14px',
    borderRadius: '20px',
    background: isDark ? 'rgba(168, 137, 79,0.12)' : 'rgba(168, 137, 79,0.08)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.15)' : 'rgba(168, 137, 79,0.20)'}`,
    fontSize: isMobile ? '10px' : '12px',
    fontWeight: 500,
    color: colors.primary,
    marginBottom: isMobile ? '6px' : '10px',
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
  };

  // Title
  const titleStyle = {
    fontSize: isMobile ? '22px' : isTablet ? '30px' : '40px',
    fontWeight: 800,
    color: colors.heading,
    margin: 0,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  };

  const highlightStyle = {
    color: colors.primary,
    position: 'relative',
    display: 'inline-block',
  };

  // Underline for highlight
  const highlightUnderlineStyle = {
    position: 'absolute',
    bottom: isMobile ? '-2px' : '-4px',
    left: 0,
    right: 0,
    height: '2px',
    background: colors.primary,
    opacity: 0.3,
    borderRadius: '2px',
  };

  // Description
  const descStyle = {
    fontSize: isMobile ? '13px' : isTablet ? '14px' : '16px',
    color: colors.secondaryText,
    lineHeight: 1.6,
    maxWidth: isMobile ? '100%' : '100%',
    marginTop: isMobile ? '4px' : '8px',
  };

  // Feature tags container
  const featuresContainerStyle = {
    display: 'flex',
    gap: isMobile ? '8px' : '12px',
    flexWrap: 'wrap',
    marginTop: isMobile ? '10px' : '14px',
  };

  const featureTagStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: isMobile ? '10px' : '12px',
    color: colors.secondaryText,
    background: isDark ? 'rgba(168, 137, 79,0.04)' : 'rgba(168, 137, 79,0.03)',
    padding: isMobile ? '3px 8px' : '5px 12px',
    borderRadius: '16px',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.06)' : 'rgba(168, 137, 79,0.08)'}`,
  };

  // Stats
  const statsContainerStyle = {
    display: 'flex',
    gap: isMobile ? '12px' : '20px',
    marginTop: isMobile ? '10px' : '14px',
    flexWrap: 'wrap',
  };

  const statItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: isMobile ? '10px' : '12px',
    color: colors.secondaryText,
  };

  const statNumberStyle = {
    fontSize: isMobile ? '14px' : '18px',
    fontWeight: 700,
    color: colors.primary,
  };

  // Accent line
  const accentLineStyle = {
    width: isMobile ? '24px' : '40px',
    height: '2px',
    background: colors.primary,
    marginTop: isMobile ? '8px' : '12px',
    opacity: 0.4,
    borderRadius: '2px',
  };

  // Button container - FIXED overflow
  const buttonContainerStyle = {
    position: 'relative',
    zIndex: 2,
    flexShrink: 0,
    width: isMobile ? '100%' : 'auto',
    maxWidth: isMobile ? '100%' : '280px',
    boxSizing: 'border-box',
  };

  const buttonStyle = {
    width: isMobile ? '100%' : '100%',
    minWidth: isMobile ? '100%' : '200px',
    padding: isMobile ? '14px 20px' : '16px 28px',
    borderRadius: '12px',
    background: colors.primary,
    color: '#1A1A1A',
    border: 'none',
    cursor: 'pointer',
    fontSize: isMobile ? '14px' : '15px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    whiteSpace: 'nowrap',
    boxShadow: isHovered 
      ? isDark 
        ? '0 8px 32px rgba(168, 137, 79,0.25)' 
        : '0 8px 32px rgba(168, 137, 79,0.20)'
      : 'none',
    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
    boxSizing: 'border-box',
  };

  const buttonTextStyle = {
    fontSize: isMobile ? '13px' : '15px',
  };

  return (
    <div 
      style={bannerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Decorative elements */}
      <div style={decorativeGlowStyle} />
      <div style={decorativeGlow2Style} />
      <div style={sparkleStyle}>✦</div>
      <div style={sparkle2Style}>✦</div>

      {/* Content */}
      <div style={contentStyle}>
        <div style={badgeStyle}>
          <Sparkles size={isMobile ? 12 : 14} />
          Endless Possibilities
        </div>

        <h2 style={titleStyle}>
          Find Your <span style={highlightStyle}>
            Perfect Style
            <span style={highlightUnderlineStyle} />
          </span>
        </h2>

        <p style={descStyle}>
          Explore thousands of unique styles, customize every detail, 
          and bring your vision to life.
        </p>

        {/* Stats */}
        <div style={statsContainerStyle}>
          <div style={statItemStyle}>
            <span style={statNumberStyle}>500+</span>
            <span>Styles</span>
          </div>
          <div style={statItemStyle}>
            <span style={statNumberStyle}>50+</span>
            <span>Tailors</span>
          </div>
          <div style={statItemStyle}>
            <span style={statNumberStyle}>5K+</span>
            <span>Happy Clients</span>
          </div>
        </div>

        {/* Feature tags */}
        <div style={featuresContainerStyle}>
          <span style={featureTagStyle}>
            <Scissors size={isMobile ? 12 : 14} color={colors.primary} />
            Custom
          </span>
          <span style={featureTagStyle}>
            <Users size={isMobile ? 12 : 14} color={colors.primary} />
            Expert
          </span>
          <span style={featureTagStyle}>
            <Star size={isMobile ? 12 : 14} color={colors.primary} />
            Premium
          </span>
          <span style={featureTagStyle}>
            <Ruler size={isMobile ? 12 : 14} color={colors.primary} />
            Perfect Fit
          </span>
        </div>

        <div style={accentLineStyle} />
      </div>

      {/* Button */}
      <div style={buttonContainerStyle}>
        <button
          style={buttonStyle}
          onClick={() => navigate('/gallery')}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? '#C9B183' : '#8A6F3A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.primary;
          }}
        >
          <span style={buttonTextStyle}>Explore Styles</span>
          <ArrowRight size={isMobile ? 16 : 18} style={{ transition: 'transform 0.3s ease' }} />
        </button>

        {/* Subtle text below button */}
        <div style={{
          fontSize: isMobile ? '9px' : '10px',
          color: colors.secondaryText,
          textAlign: 'center',
          marginTop: '6px',
          opacity: 0.5,
          letterSpacing: '0.3px',
        }}>
          Browse thousands of styles
        </div>
      </div>
    </div>
  );
};

export default EndlessStylesBanner;