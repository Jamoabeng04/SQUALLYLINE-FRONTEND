import React from 'react';
import { useTheme } from '../hooks/useTheme';

const CompanyName = () => {
  const { colors } = useTheme();

  const containerStyle = {
    width: '100%',
    padding: '16px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  };

  // Main text - "SQUALLY-LINE"
  const mainTextStyle = {
    fontSize: 'clamp(22px, 4vw, 48px)',
    fontWeight: 700,
    color: colors.heading,
    letterSpacing: '0.12em',
    margin: 0,
    lineHeight: 1.1,
    textAlign: 'center',
    fontFamily: "'Georgia', serif",
    textTransform: 'uppercase',
  };

  // Gold accent - "CLOTHING" 
  const goldTextStyle = {
    color: colors.primary,
    fontWeight: 400,
    letterSpacing: '0.15em',
  };

  // Subtitle - "Luxury in Simplicity"
  const subtitleStyle = {
    fontSize: 'clamp(10px, 1.2vw, 14px)',
    fontWeight: 300,
    color: colors.secondaryText,
    letterSpacing: '0.3em',
    marginTop: '6px',
    textAlign: 'center',
    fontFamily: "'Georgia', serif",
    textTransform: 'uppercase',
  };

  // Decorative elements container
  const decorativeContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '12px',
    width: '100%',
    maxWidth: '300px',
  };

  // Left decorative line
  const leftLineStyle = {
    flex: 1,
    height: '0.5px',
    background: colors.primary,
    opacity: 0.25,
  };

  // Right decorative line
  const rightLineStyle = {
    flex: 1,
    height: '0.5px',
    background: colors.primary,
    opacity: 0.25,
  };

  // Diamond symbol
  const diamondStyle = {
    width: '6px',
    height: '6px',
    background: colors.primary,
    transform: 'rotate(45deg)',
    flexShrink: 0,
    opacity: 0.4,
  };

  // Small dots on sides
  const dotStyle = {
    width: '3px',
    height: '3px',
    borderRadius: '50%',
    background: colors.primary,
    opacity: 0.2,
  };

  return (
    <div style={containerStyle}>
      {/* Main text - SQUALLY-LINE */}
      <div style={mainTextStyle}>
        SQUALLY-LINE
      </div>

      {/* CLOTHING in gold */}
      <div style={{ 
        ...mainTextStyle, 
        fontSize: 'clamp(18px, 3.2vw, 38px)',
        fontWeight: 400,
        marginTop: '-2px',
      }}>
        <span style={goldTextStyle}>CLOTHING</span>
      </div>

      {/* Subtitle */}
      <div style={subtitleStyle}>
        Luxury in Simplicity
      </div>

      {/* Decorative elements */}
      <div style={decorativeContainerStyle}>
        <div style={leftLineStyle} />
        <div style={dotStyle} />
        <div style={diamondStyle} />
        <div style={dotStyle} />
        <div style={rightLineStyle} />
      </div>
    </div>
  );
};

export default CompanyName;