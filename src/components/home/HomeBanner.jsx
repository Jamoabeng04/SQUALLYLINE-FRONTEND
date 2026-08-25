import React from 'react';
import { useTheme } from '../../hooks/useTheme';

const HomeBanner = () => {
  const { colors, theme } = useTheme();
  const isDark = theme.mode === 'dark';

  // Styles
  const bannerStyle = {
    height: '25vh',
    minHeight: '160px',
    maxHeight: '280px',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: isDark ? '#0A0A0A' : '#F8F6F1',
    display: 'flex',
    alignItems: 'center',
    padding: '0 40px',
    borderRadius: '12px',
    marginBottom: '20px',
  };

  // Gradient overlay - from theme color to transparent
  const gradientStyle = {
    position: 'absolute',
    inset: 0,
    background: isDark
      ? 'linear-gradient(90deg, rgba(10,10,10,0.95) 40%, rgba(10,10,10,0.70) 60%, rgba(10,10,10,0.30) 80%, transparent 100%)'
      : 'linear-gradient(90deg, rgba(248,246,241,0.95) 40%, rgba(248,246,241,0.70) 60%, rgba(248,246,241,0.30) 80%, transparent 100%)',
    zIndex: 2,
  };

  // Logo background - positioned on the right
  const logoStyle = {
    position: 'absolute',
    right: '-20px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 'clamp(180px, 25vw, 350px)',
    fontWeight: 900,
    color: isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)',
    letterSpacing: '8px',
    fontFamily: "'Georgia', serif",
    zIndex: 1,
    pointerEvents: 'none',
    userSelect: 'none',
    lineHeight: 1,
    whiteSpace: 'nowrap',
  };

  // Gold accent line - decorative
  const accentLineStyle = {
    position: 'absolute',
    bottom: '15%',
    left: '40px',
    width: '60px',
    height: '2px',
    background: colors.primary,
    zIndex: 3,
    opacity: 0.6,
  };

  // Content container
  const contentStyle = {
    position: 'relative',
    zIndex: 3,
    maxWidth: '70%',
  };

  // Main title
  const titleStyle = {
    fontSize: 'clamp(20px, 4vw, 48px)',
    fontWeight: 800,
    color: colors.primary,
    letterSpacing: '0.08em',
    margin: 0,
    lineHeight: 1.1,
    fontFamily: "'Georgia', serif",
    textTransform: 'uppercase',
  };

  // Subtitle
  const subtitleStyle = {
    fontSize: 'clamp(10px, 1.2vw, 16px)',
    fontWeight: 400,
    color: isDark ? 'rgba(212, 175, 55,0.70)' : 'rgba(212, 175, 55,0.80)',
    letterSpacing: '0.3em',
    marginTop: '6px',
    textTransform: 'uppercase',
    fontFamily: "'Georgia', serif",
  };

  // Decorative lines around subtitle
  const decorativeLineStyle = {
    display: 'inline-block',
    width: '30px',
    height: '1px',
    background: colors.primary,
    opacity: 0.3,
    verticalAlign: 'middle',
  };

  return (
    <div style={bannerStyle}>
      {/* Gradient Overlay */}
      <div style={gradientStyle} />

      {/* Background Logo */}
      <div style={logoStyle}>
        SL
      </div>

      {/* Accent Line */}
      <div style={accentLineStyle} />

      {/* Content */}
      <div style={contentStyle}>
        <h1 style={titleStyle}>
          SQUALLY-LINE
          <br />
          <span style={{ fontWeight: 300, letterSpacing: '0.15em' }}>
            CLOTHING
          </span>
        </h1>
        
        <div style={subtitleStyle}>
          <span style={decorativeLineStyle} />
          <span style={{ margin: '0 12px' }}>✦</span>
          LUXURY IN SIMPLICITY
          <span style={{ margin: '0 12px' }}>✦</span>
          <span style={decorativeLineStyle} />
        </div>
      </div>
    </div>
  );
};

export default HomeBanner;