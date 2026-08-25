import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const SocialSection = () => {
  const { colors, theme } = useTheme();
  const isDark = theme.mode === 'dark';

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  // Social links with SVG icons (since lucide-react doesn't have social icons)
  const socialLinks = [
    {
      id: 'instagram',
      name: 'Instagram',
      url: 'https://instagram.com/squallyline',
      icon: (
        <svg viewBox="0 0 24 24" width={isMobile ? 22 : 26} height={isMobile ? 22 : 26} fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
      ),
      color: '#E4405F',
      hoverColor: '#E4405F',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      url: 'https://facebook.com/squallyline',
      icon: (
        <svg viewBox="0 0 24 24" width={isMobile ? 22 : 26} height={isMobile ? 22 : 26} fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: '#1877F2',
      hoverColor: '#1877F2',
    },
    {
      id: 'x',
      name: 'X (Twitter)',
      url: 'https://x.com/squallyline',
      icon: (
        <svg viewBox="0 0 24 24" width={isMobile ? 22 : 26} height={isMobile ? 22 : 26} fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: '#000000',
      hoverColor: '#000000',
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      url: 'https://tiktok.com/@squallyline',
      icon: (
        <svg viewBox="0 0 24 24" width={isMobile ? 22 : 26} height={isMobile ? 22 : 26} fill="currentColor">
          <path d="M12.525.02c1.31-.013 2.61-.018 3.92-.02.014 3.064 2.065 6.45 6.18 6.482v4.295c-2.51-.02-4.77-.814-6.52-2.238v9.846c0 4.747-4.345 8.195-9.45 7.391-3.826-.617-6.74-3.543-7.34-7.36-.657-4.032 1.365-7.879 5.077-9.338 1.954-.76 4.196-.777 6.148-.053v4.193c-1.416-.428-2.985-.363-4.315.252-1.928.888-3.27 2.702-3.27 4.833 0 2.131 1.342 3.945 3.27 4.833 1.33.615 2.899.68 4.315.252 1.416-.428 2.515-1.392 3.134-2.745.603-1.318.715-2.792.715-4.234V.02z"/>
        </svg>
      ),
      color: '#000000',
      hoverColor: '#FE2C55',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      url: 'https://youtube.com/@squallyline',
      icon: (
        <svg viewBox="0 0 24 24" width={isMobile ? 22 : 26} height={isMobile ? 22 : 26} fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
      color: '#FF0000',
      hoverColor: '#FF0000',
    },
    {
      id: 'pinterest',
      name: 'Pinterest',
      url: 'https://pinterest.com/squallyline',
      icon: (
        <svg viewBox="0 0 24 24" width={isMobile ? 22 : 26} height={isMobile ? 22 : 26} fill="currentColor">
          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.244 3.768-5.487 0-2.866-2.063-4.869-5.008-4.869-3.41 0-5.41 2.563-5.41 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.393.165-1.454-.677-2.361-2.797-2.361-4.502 0-3.664 2.664-7.027 7.676-7.027 4.031 0 7.166 2.871 7.166 6.707 0 4.006-2.528 7.221-6.033 7.221-1.178 0-2.283-.614-2.664-1.337 0 0-.583 2.222-.724 2.766-.259.998-.951 2.235-1.418 2.997 1.065.333 2.197.512 3.377.512 6.618 0 11.982-5.367 11.982-11.987C23.999 5.364 18.633 0 12.017 0z"/>
        </svg>
      ),
      color: '#E60023',
      hoverColor: '#E60023',
    },
  ];

  // Styles
  const sectionStyle = {
    padding: isMobile ? '20px 0' : '40px 0',
    position: 'relative',
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: isMobile ? '24px' : '32px',
  };

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 14px',
    borderRadius: '20px',
    background: isDark ? 'rgba(212, 175, 55,0.08)' : 'rgba(212, 175, 55,0.05)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.15)'}`,
    fontSize: '11px',
    fontWeight: 500,
    color: colors.primary,
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
    marginBottom: '10px',
  };

  const titleStyle = {
    fontSize: isMobile ? '22px' : isTablet ? '30px' : '34px',
    fontWeight: 700,
    color: colors.heading,
    margin: 0,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  };

  const highlightStyle = {
    color: colors.primary,
  };

  const descStyle = {
    fontSize: isMobile ? '13px' : '15px',
    color: colors.secondaryText,
    lineHeight: 1.6,
    marginTop: '8px',
    maxWidth: '420px',
    marginLeft: 'auto',
    marginRight: 'auto',
  };

  // Social grid
  const socialGridStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: isMobile ? '12px' : isTablet ? '16px' : '20px',
    flexWrap: 'wrap',
  };

  const socialItemStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    textDecoration: 'none',
    padding: isMobile ? '8px 12px' : '12px 16px',
    borderRadius: '12px',
    background: isDark ? 'rgba(20,20,20,0.40)' : 'rgba(255,255,255,0.40)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.04)' : 'rgba(212, 175, 55,0.06)'}`,
    minWidth: isMobile ? '60px' : '70px',
  };

  const iconWrapperStyle = (color) => ({
    width: isMobile ? '44px' : '52px',
    height: isMobile ? '44px' : '52px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    color: color,
    transition: 'all 0.3s ease',
  });

  const socialNameStyle = {
    fontSize: isMobile ? '9px' : '10px',
    color: colors.secondaryText,
    fontWeight: 500,
    letterSpacing: '0.2px',
    textAlign: 'center',
  };

  // Decorative line
  const decorativeLineStyle = {
    width: '30px',
    height: '2px',
    background: colors.primary,
    margin: '12px auto 0',
    opacity: 0.3,
    borderRadius: '2px',
  };

  return (
    <div style={sectionStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={badgeStyle}>
          <Users size={14} />
          Connect With Us
        </div>
        <h2 style={titleStyle}>
          Follow <span style={highlightStyle}>Our Journey</span>
        </h2>
        <p style={descStyle}>
          Stay connected with us on social media for the latest updates, 
          style inspiration, and exclusive offers.
        </p>
        <div style={decorativeLineStyle} />
      </div>

      {/* Social Icons */}
      <div style={socialGridStyle}>
        {socialLinks.map((social) => (
          <a
            key={social.id}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            style={socialItemStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = social.color;
              e.currentTarget.style.boxShadow = isDark 
                ? `0 8px 24px rgba(0,0,0,0.30)` 
                : `0 8px 24px rgba(0,0,0,0.06)`;
              const icon = e.currentTarget.querySelector('.social-icon');
              if (icon) {
                icon.style.background = social.color;
                icon.style.color = '#FFFFFF';
                icon.style.transform = 'scale(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = isDark ? 'rgba(212, 175, 55,0.04)' : 'rgba(212, 175, 55,0.06)';
              e.currentTarget.style.boxShadow = 'none';
              const icon = e.currentTarget.querySelector('.social-icon');
              if (icon) {
                icon.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';
                icon.style.color = social.color;
                icon.style.transform = 'scale(1)';
              }
            }}
          >
            <div className="social-icon" style={iconWrapperStyle(social.color)}>
              {social.icon}
            </div>
            <span style={socialNameStyle}>{social.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default SocialSection;