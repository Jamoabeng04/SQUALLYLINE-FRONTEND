import React from 'react';
import { useTheme } from '../hooks/useTheme';

const LuxuryTagline = () => {
  const { colors } = useTheme();

  const containerStyle = {
    width: '100%',
    padding: '20px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  };

  // Main text - "LUXURY"
  const mainTextStyle = {
    fontSize: 'clamp(28px, 6vw, 64px)',
    fontWeight: 300,
    color: colors.heading,
    letterSpacing: '0.15em',
    margin: 0,
    lineHeight: 1.1,
    textAlign: 'center',
    fontFamily: "'Georgia', serif",
  };

  // Gold accent word - "IN"
  const goldTextStyle = {
    color: colors.primary,
    fontWeight: 400,
  };

  // Second line - "SIMPLICITY"
  const subTextStyle = {
    fontSize: 'clamp(28px, 6vw, 64px)',
    fontWeight: 300,
    color: colors.heading,
    letterSpacing: '0.15em',
    margin: 0,
    lineHeight: 1.1,
    textAlign: 'center',
    fontFamily: "'Georgia', serif",
  };

  // Decorative elements container
  const decorativeContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginTop: '16px',
    width: '100%',
    maxWidth: '400px',
  };

  // Left decorative line
  const leftLineStyle = {
    flex: 1,
    height: '0.5px',
    background: colors.primary,
    opacity: 0.3,
  };

  // Right decorative line
  const rightLineStyle = {
    flex: 1,
    height: '0.5px',
    background: colors.primary,
    opacity: 0.3,
  };

  // Diamond symbol
  const diamondStyle = {
    width: '8px',
    height: '8px',
    background: colors.primary,
    transform: 'rotate(45deg)',
    flexShrink: 0,
    opacity: 0.5,
  };

  // Small dots on sides
  const dotStyle = {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: colors.primary,
    opacity: 0.2,
  };

  // Bottom accent line
  const accentLineStyle = {
    width: '40px',
    height: '1px',
    background: colors.primary,
    marginTop: '16px',
    opacity: 0.2,
  };

  return (
    <div style={containerStyle}>
      {/* Main text - LUXURY */}
      <div style={mainTextStyle}>
        LUXURY
      </div>

      {/* IN + SIMPLICITY with gold IN */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        <span style={subTextStyle}>
          <span style={goldTextStyle}>IN</span>
        </span>
        <span style={{ ...subTextStyle, marginLeft: '8px' }}>
          SIMPLICITY
        </span>
      </div>

      {/* Decorative elements */}
      <div style={decorativeContainerStyle}>
        <div style={leftLineStyle} />
        <div style={dotStyle} />
        <div style={diamondStyle} />
        <div style={dotStyle} />
        <div style={rightLineStyle} />
      </div>

      {/* Bottom accent */}
      <div style={accentLineStyle} />
    </div>
  );
};

export default LuxuryTagline;