import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ruler,
  Users,
  ArrowRight,
  Shield,
  Zap,
  Heart
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const MeasurementsBanner = () => {
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

  // Banner style - matches the first banner
  const bannerStyle = {
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    padding: isMobile ? '28px 16px' : isTablet ? '36px 24px' : '44px 32px',
    // borderRadius: '16px',
    position: 'relative',
    overflow: 'hidden',
    margin: isMobile ? '16px 0' : '24px 0',
    background: colors.surfaceL2,
    // border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.15)'}`,
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: isMobile ? '16px' : '24px',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: isHovered 
      ? isDark 
        ? '0 12px 48px rgba(0,0,0,0.40), 0 0 0 1px rgba(212, 175, 55,0.06)' 
        : '0 12px 48px rgba(0,0,0,0.06), 0 0 0 1px rgba(212, 175, 55,0.06)'
      : 'none',
    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
  };

  // Decorative elements - subtle and elegant
  const decorativeGlowStyle = {
    position: 'absolute',
    top: '-40%',
    right: isMobile ? '-30%' : '-10%',
    width: isMobile ? '250px' : '400px',
    height: isMobile ? '250px' : '400px',
    borderRadius: '50%',
    background: 'transparent',
    pointerEvents: 'none',
  };

  const decorativeGlow2Style = {
    position: 'absolute',
    bottom: '-30%',
    left: isMobile ? '-30%' : '-10%',
    width: isMobile ? '200px' : '300px',
    height: isMobile ? '200px' : '300px',
    borderRadius: '50%',
    background: 'transparent',
    pointerEvents: 'none',
  };

  // Content container
  const contentStyle = {
    position: 'relative',
    zIndex: 2,
    flex: 1,
    width: '100%',
    maxWidth: isMobile ? '100%' : '62%',
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
    background: isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.06)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.12)' : 'rgba(212, 175, 55,0.18)'}`,
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
    maxWidth: '100%',
    marginTop: isMobile ? '4px' : '8px',
  };

  // Steps container
  const stepsContainerStyle = {
    display: 'flex',
    gap: isMobile ? '8px' : '16px',
    flexWrap: 'wrap',
    marginTop: isMobile ? '10px' : '14px',
  };

  const stepItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: isMobile ? '11px' : '13px',
    color: colors.text,
    background: isDark ? 'rgba(212, 175, 55,0.04)' : 'rgba(212, 175, 55,0.03)',
    padding: isMobile ? '6px 12px' : '8px 16px',
    borderRadius: '20px',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)'}`,
  };

  const stepNumberStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: isMobile ? '18px' : '22px',
    height: isMobile ? '18px' : '22px',
    borderRadius: '50%',
    background: colors.primary,
    color: '#1A1A1A',
    fontSize: isMobile ? '9px' : '11px',
    fontWeight: 700,
    flexShrink: 0,
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

  // Button container
  const buttonContainerStyle = {
    position: 'relative',
    zIndex: 2,
    flexShrink: 0,
    width: isMobile ? '100%' : 'auto',
    maxWidth: isMobile ? '100%' : '260px',
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
        ? '0 8px 32px rgba(212, 175, 55,0.25)' 
        : '0 8px 32px rgba(212, 175, 55,0.20)'
      : 'none',
    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
    boxSizing: 'border-box',
  };

  // Feature highlights
  const featureHighlightsStyle = {
    display: 'flex',
    gap: isMobile ? '12px' : '20px',
    marginTop: isMobile ? '10px' : '14px',
    flexWrap: 'wrap',
  };

  const featureHighlightStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: isMobile ? '10px' : '12px',
    color: colors.secondaryText,
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

      {/* Content */}
      <div style={contentStyle}>
        <div style={badgeStyle}>
          <Ruler size={isMobile ? 12 : 14} />
          Perfect Fit Guaranteed
        </div>

        <h2 style={titleStyle}>
          Save Your <span style={highlightStyle}>
            Measurements
            <span style={highlightUnderlineStyle} />
          </span>
          <br />
          <span style={{ fontSize: isMobile ? '18px' : isTablet ? '24px' : '32px', fontWeight: 600 }}>
            For You & Your Loved Ones
          </span>
        </h2>

        <p style={descStyle}>
          Store measurements for yourself, family, and friends. Our AI-powered 
          assistant makes it easy with step-by-step guidance.
        </p>

        {/* Steps */}
        <div style={stepsContainerStyle}>
          <div style={stepItemStyle}>
            <span style={stepNumberStyle}>1</span>
            <span>Add Person</span>
          </div>
          <div style={stepItemStyle}>
            <span style={stepNumberStyle}>2</span>
            <span>Enter Measurements</span>
          </div>
          <div style={stepItemStyle}>
            <span style={stepNumberStyle}>3</span>
            <span>AI Assistance</span>
          </div>
          <div style={stepItemStyle}>
            <span style={stepNumberStyle}>4</span>
            <span>Save & Use</span>
          </div>
        </div>

        {/* Feature highlights */}
        <div style={featureHighlightsStyle}>
          <span style={featureHighlightStyle}>
            <Shield size={isMobile ? 12 : 14} color={colors.primary} />
            Secure Storage
          </span>
          <span style={featureHighlightStyle}>
            <Users size={isMobile ? 12 : 14} color={colors.primary} />
            Multiple Profiles
          </span>
          <span style={featureHighlightStyle}>
            <Zap size={isMobile ? 12 : 14} color={colors.primary} />
            AI-Powered
          </span>
          <span style={featureHighlightStyle}>
            <Heart size={isMobile ? 12 : 14} color={colors.primary} />
            For Everyone
          </span>
        </div>

        <div style={accentLineStyle} />
      </div>

      {/* Button */}
      <div style={buttonContainerStyle}>
        <button
          style={buttonStyle}
          onClick={() => navigate('/measurements')}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? '#F0D888' : '#927619';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.primary;
          }}
        >
          <span style={{ fontSize: isMobile ? '13px' : '15px' }}>Get Started</span>
          <ArrowRight size={isMobile ? 16 : 18} style={{ transition: 'transform 0.3s ease' }} />
        </button>

        <div style={{
          fontSize: isMobile ? '9px' : '10px',
          color: colors.secondaryText,
          textAlign: 'center',
          marginTop: '6px',
          opacity: 0.5,
          letterSpacing: '0.3px',
        }}>
          Free & easy to use
        </div>
      </div>
    </div>
  );
};

export default MeasurementsBanner;