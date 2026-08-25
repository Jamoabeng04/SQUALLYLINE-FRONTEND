import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ArrowRight,
  Video,
  Phone,
  MapPin,
  User,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const BookAppointmentSection = () => {
  const navigate = useNavigate();
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

  // Appointment types
  const appointmentTypes = [
    {
      id: 'consultation',
      icon: Users,
      title: 'Style Consultation',
      description: 'Get personalized fashion advice',
      color: colors.primary,
    },
    {
      id: 'video',
      icon: Video,
      title: 'Video Call',
      description: 'Connect from anywhere',
      color: '#8B5CF6',
    },
    {
      id: 'phone',
      icon: Phone,
      title: 'Phone Call',
      description: 'Quick and convenient',
      color: '#3B82F6',
    },
    {
      id: 'inperson',
      icon: MapPin,
      title: 'In Person',
      description: 'Visit our studio',
      color: '#10B981',
    },
  ];

  // Styles
  const sectionStyle = {
    padding: isMobile ? '24px 0' : '40px 0',
    position: 'relative',
  };

  // Header
  const headerStyle = {
    textAlign: 'center',
    maxWidth: '600px',
    margin: '0 auto 32px',
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

  // Appointment types grid
  const typesGridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(4, 1fr)' : 'repeat(4, 1fr)',
    gap: isMobile ? '10px' : '16px',
    maxWidth: '800px',
    margin: '0 auto 32px',
  };

  const typeCardStyle = {
    padding: isMobile ? '16px 12px' : '20px 16px',
    borderRadius: '12px',
    background: isDark ? 'rgba(20,20,20,0.40)' : 'rgba(255,255,255,0.40)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)'}`,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const typeIconStyle = (color) => ({
    width: isMobile ? '40px' : '48px',
    height: isMobile ? '40px' : '48px',
    borderRadius: '50%',
    background: isDark ? `${color}20` : `${color}10`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 8px',
    color: color,
  });

  const typeTitleStyle = {
    fontSize: isMobile ? '12px' : '14px',
    fontWeight: 600,
    color: colors.text,
    margin: 0,
  };

  const typeDescStyle = {
    fontSize: isMobile ? '9px' : '11px',
    color: colors.secondaryText,
    marginTop: '2px',
  };

  // Features
  const featuresContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: isMobile ? '16px' : '32px',
    flexWrap: 'wrap',
    marginBottom: '32px',
  };

  const featureItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: isMobile ? '12px' : '14px',
    color: colors.secondaryText,
  };

  const featureCheckStyle = {
    color: colors.primary,
  };

  // CTA Button
  const buttonContainerStyle = {
    textAlign: 'center',
  };

  const buttonStyle = {
    padding: isMobile ? '14px 32px' : '16px 40px',
    borderRadius: '12px',
    background: colors.primary,
    color: '#1A1A1A',
    border: 'none',
    cursor: 'pointer',
    fontSize: isMobile ? '14px' : '16px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.3s ease',
  };

  // Testimonial
  const testimonialStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '24px',
    padding: '16px 24px',
    borderRadius: '12px',
    background: isDark ? 'rgba(20,20,20,0.30)' : 'rgba(255,255,255,0.30)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.04)' : 'rgba(212, 175, 55,0.06)'}`,
    maxWidth: '500px',
    marginLeft: 'auto',
    marginRight: 'auto',
    flexWrap: 'wrap',
  };

  const testimonialAvatarStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: colors.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#1A1A1A',
    flexShrink: 0,
  };

  const testimonialTextStyle = {
    fontSize: isMobile ? '12px' : '14px',
    color: colors.secondaryText,
    textAlign: 'center',
  };

  const testimonialNameStyle = {
    fontWeight: 600,
    color: colors.text,
  };

  // Decorative element - simple gold line
  const decorativeLineStyle = {
    width: '40px',
    height: '2px',
    background: colors.primary,
    margin: '0 auto 16px',
    opacity: 0.3,
    borderRadius: '2px',
  };

  return (
    <div style={sectionStyle}>
      {/* Decorative line */}
      <div style={decorativeLineStyle} />

      {/* Header */}
      <div style={headerStyle}>
        <div style={badgeStyle}>
          <Sparkles size={14} />
          Book Now
        </div>

        <h2 style={titleStyle}>
          Book Your <span style={highlightStyle}>Appointment</span>
        </h2>

        <p style={descStyle}>
          Get professional fashion advice and consultation from our expert team.
          Choose the way that works best for you.
        </p>
      </div>

      {/* Appointment Types */}
      <div style={typesGridStyle}>
        {appointmentTypes.map((type) => {
          const Icon = type.icon;
          return (
            <div
              key={type.id}
              style={typeCardStyle}
              onClick={() => navigate('/appointments/book')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = isDark 
                  ? '0 8px 24px rgba(0,0,0,0.30)' 
                  : '0 8px 24px rgba(0,0,0,0.06)';
                e.currentTarget.style.borderColor = type.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)';
              }}
            >
              <div style={typeIconStyle(type.color)}>
                <Icon size={isMobile ? 18 : 22} />
              </div>
              <div style={typeTitleStyle}>{type.title}</div>
              <div style={typeDescStyle}>{type.description}</div>
            </div>
          );
        })}
      </div>

      {/* Features */}
      <div style={featuresContainerStyle}>
        <span style={featureItemStyle}>
          <CheckCircle size={isMobile ? 14 : 16} style={featureCheckStyle} />
          Free Consultation
        </span>
        <span style={featureItemStyle}>
          <CheckCircle size={isMobile ? 14 : 16} style={featureCheckStyle} />
          Expert Stylists
        </span>
        <span style={featureItemStyle}>
          <CheckCircle size={isMobile ? 14 : 16} style={featureCheckStyle} />
          Flexible Timing
        </span>
        <span style={featureItemStyle}>
          <CheckCircle size={isMobile ? 14 : 16} style={featureCheckStyle} />
          No Commitment
        </span>
      </div>

      {/* Testimonial */}
      <div style={testimonialStyle}>
        <div style={testimonialAvatarStyle}>
          <User size={18} />
        </div>
        <div style={testimonialTextStyle}>
          <span style={testimonialNameStyle}>Ama S.</span> • 
          "The consultation helped me find the perfect style for my wedding. 
          The team was incredibly professional and patient."
        </div>
      </div>

      {/* CTA Button */}
      <div style={buttonContainerStyle}>
        <button
          style={buttonStyle}
          onClick={() => navigate('/appointments/book')}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? '#F0D888' : '#927619';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.primary;
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Book Your Appointment
          <ArrowRight size={isMobile ? 16 : 18} />
        </button>
      </div>
    </div>
  );
};

export default BookAppointmentSection;