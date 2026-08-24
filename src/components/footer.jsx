import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import CompanyName from './CompanyName';

const Footer = () => {
  const navigate = useNavigate();
  const { colors, theme } = useTheme();
  const isDark = theme.mode === 'dark';

  // Current year for copyright
  const currentYear = new Date().getFullYear();

  // Quick links
  const quickLinks = [
    { label: 'Home', path: '/' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Products', path: '/products' },
    { label: 'Categories', path: '/categories' },
    { label: 'Appointments', path: '/appointments' },
  ];

  // Contact info
  const contactInfo = [
    { icon: MapPin, label: '123 Fashion Avenue, Accra, Ghana' },
    { icon: Phone, label: '+233 24 123 4567' },
    { icon: Mail, label: 'hello@squallyline.com' },
  ];

  // Opening hours
  const openingHours = [
    { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM' },
    { day: 'Saturday', hours: '10:00 AM - 4:00 PM' },
    { day: 'Sunday', hours: 'Closed' },
  ];

  // Styles
  const footerStyle = {
    backgroundColor: isDark ? 'rgba(10,10,10,0.95)' : 'rgba(248,246,241,0.95)',
    borderTop: `1px solid ${isDark ? 'rgba(168, 137, 79,0.06)' : 'rgba(168, 137, 79,0.08)'}`,
    padding: '40px 20px 20px',
    marginTop: '20px',
  };

  const containerStyle = {
    maxWidth: '1100px',
    margin: '0 auto',
  };

  // Top section - grid
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '30px',
    marginBottom: '30px',
  };

  // Brand column
  const brandColumnStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  };

  const taglineStyle = {
    fontSize: '13px',
    color: colors.secondaryText,
    lineHeight: 1.6,
    maxWidth: '280px',
  };

  // Links column
  const linksTitleStyle = {
    fontSize: '13px',
    fontWeight: 600,
    color: colors.heading,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    marginBottom: '12px',
  };

  const linkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 0',
    color: colors.secondaryText,
    textDecoration: 'none',
    fontSize: '13px',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  };

  // Contact column
  const contactItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '4px 0',
    fontSize: '13px',
    color: colors.secondaryText,
  };

  const contactIconStyle = {
    color: colors.primary,
    flexShrink: 0,
  };

  // Hours column
  const hoursItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '3px 0',
    fontSize: '13px',
    color: colors.secondaryText,
  };

  const hoursDayStyle = {
    fontWeight: 400,
  };

  const hoursTimeStyle = {
    color: colors.secondaryText,
  };

  // Map section
  const mapSectionStyle = {
    marginTop: '10px',
    marginBottom: '30px',
    borderRadius: '12px',
    overflow: 'hidden',
    position: 'relative',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.10)'}`,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const mapImageStyle = {
    width: '100%',
    height: '180px',
    objectFit: 'cover',
    display: 'block',
  };

  // Map overlay with location pin
  const mapOverlayStyle = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(10,10,10,0.15)',
    transition: 'background 0.3s ease',
  };

  const pinContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    background: isDark ? 'rgba(10,10,10,0.70)' : 'rgba(255,255,255,0.70)',
    backdropFilter: 'blur(8px)',
    padding: '12px 20px',
    borderRadius: '12px',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.15)' : 'rgba(168, 137, 79,0.20)'}`,
  };

  const pinIconStyle = {
    color: colors.primary,
  };

  const pinTextStyle = {
    fontSize: '12px',
    fontWeight: 500,
    color: colors.text,
    letterSpacing: '0.3px',
  };

  const pinSubtextStyle = {
    fontSize: '10px',
    color: colors.secondaryText,
  };

  // Bottom bar
  const bottomBarStyle = {
    borderTop: `1px solid ${isDark ? 'rgba(168, 137, 79,0.06)' : 'rgba(168, 137, 79,0.08)'}`,
    paddingTop: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  };

  const copyrightStyle = {
    fontSize: '12px',
    color: colors.secondaryText,
  };

  const bottomLinksStyle = {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  };

  const bottomLinkStyle = {
    fontSize: '12px',
    color: colors.secondaryText,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
    background: 'none',
    border: 'none',
  };

  // Handle map click
  const handleMapClick = () => {
    // Open Google Maps with the location
    const address = encodeURIComponent('123 Fashion Avenue, Accra, Ghana');
    window.open(`https://www.google.com/maps/search/${address}`, '_blank');
  };

  return (
    <footer style={footerStyle}>
      <div style={containerStyle}>
        {/* Grid */}
        <div style={gridStyle}>
          {/* Brand Column */}
          <div style={brandColumnStyle}>
            <CompanyName />
            <p style={taglineStyle}>
              Premium fashion for those who appreciate 
              quality, craftsmanship, and timeless style.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <div style={linksTitleStyle}>Quick Links</div>
            {quickLinks.map((link) => (
              <button
                key={link.path}
                style={linkStyle}
                onClick={() => navigate(link.path)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.primary;
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.secondaryText;
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <ChevronRight size={12} style={{ color: colors.primary, opacity: 0.5 }} />
                {link.label}
              </button>
            ))}
          </div>

          {/* Contact */}
          <div>
            <div style={linksTitleStyle}>Contact</div>
            {contactInfo.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} style={contactItemStyle}>
                  <Icon size={14} style={contactIconStyle} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>

          {/* Hours */}
          <div>
            <div style={linksTitleStyle}>Opening Hours</div>
            {openingHours.map((item, index) => (
              <div key={index} style={hoursItemStyle}>
                <span style={hoursDayStyle}>{item.day}</span>
                <span style={hoursTimeStyle}>{item.hours}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Map Section */}
        <div
          style={mapSectionStyle}
          onClick={handleMapClick}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = isDark 
              ? '0 4px 20px rgba(0,0,0,0.30)' 
              : '0 4px 20px rgba(0,0,0,0.06)';
            const overlay = e.currentTarget.querySelector('.map-overlay');
            if (overlay) {
              overlay.style.background = 'rgba(10,10,10,0.25)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            const overlay = e.currentTarget.querySelector('.map-overlay');
            if (overlay) {
              overlay.style.background = 'rgba(10,10,10,0.15)';
            }
          }}
        >
          <img
            src={`https://placehold.co/1100x180/${isDark ? '1A1A1A' : 'E8E0D6'}/C9A84C?text=Google+Maps`}
            alt="Location Map"
            style={mapImageStyle}
            draggable={false}
          />
          <div className="map-overlay" style={mapOverlayStyle}>
            <div style={pinContainerStyle}>
              <MapPin size={28} style={pinIconStyle} />
              <div style={pinTextStyle}>Find Us Here</div>
              <div style={pinSubtextStyle}>Click to open in Google Maps</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={bottomBarStyle}>
          <div style={copyrightStyle}>
            © {currentYear} Squally-Line Clothing.
          </div>
          <div style={bottomLinksStyle}>
            <button
              style={bottomLinkStyle}
              onMouseEnter={(e) => { e.currentTarget.style.color = colors.primary; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = colors.secondaryText; }}
            >
              Privacy Policy
            </button>
            <button
              style={bottomLinkStyle}
              onMouseEnter={(e) => { e.currentTarget.style.color = colors.primary; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = colors.secondaryText; }}
            >
              Terms of Service
            </button>
            <button
              style={bottomLinkStyle}
              onMouseEnter={(e) => { e.currentTarget.style.color = colors.primary; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = colors.secondaryText; }}
            >
              Returns
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;