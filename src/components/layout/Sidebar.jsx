import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, Image, Ruler, User, ShoppingBag,
  Sun, Moon, LogOut, LogIn, Circle, X, LayoutDashboard, Calendar, Package, Heart, Scissors, Tags
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../providers/AuthProvider';

const Sidebar = ({ isOpen, isMobile, onClose, activeTab }) => {
  const navigate = useNavigate();
  const { colors, theme, updateTheme } = useTheme();
  const isDark = theme.mode === 'dark';
  const { user, isAuthenticated, isStaff, logout } = useAuth();

  const sidebarWidth = 280;

  // Navigation items. Staff get the admin entry; everyone else the shop links.
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Image, label: 'Gallery', path: '/gallery' },
    { icon: ShoppingBag, label: 'Categories', path: '/categories' },
    { icon: ShoppingBag, label: 'All Products', path: '/products' },
    { icon: Calendar, label: 'My Appointments', path: '/appointments' },
    { icon: Ruler, label: 'Measure', path: '/measure' },
    { icon: ShoppingBag, label: 'Cart', path: '/cart' },
    { icon: Package, label: 'Orders', path: '/orders' },
    { icon: Heart, label: 'Saved Styles', path: '/savedstyles' },
    { icon: User, label: 'Profile', path: '/profile' },
    ...(isStaff ? [{ icon: LayoutDashboard, label: 'Admin Overview', path: '/admin' }] : []),
    ...(user?.role === 'admin' ? [
      { icon: Package, label: 'Manage Products', path: '/admin/products' },
      { icon: Scissors, label: 'Manage Styles', path: '/admin/styles' },
      { icon: Tags, label: 'Manage Categories', path: '/admin/categories' },
    ] : []),
  ];


  // Glass tokens
  const glass = {
    sidebarBg: isDark
      ? colors.glassSidebarBg
      : colors.glassSidebarBg,
    sidebarBlur: isDark
      ? "blur(40px) saturate(220%)"
      : "blur(32px) saturate(180%)",
    sidebarBorder: isDark
      ? colors.glassSidebarBorder
      : colors.glassSidebarBorder,
    sidebarHeaderOverlay: isDark
      ? "rgba(10, 10, 10, 0.60)"
      : "rgba(248, 246, 241, 0.50)",
    tabActiveBg: isDark
      ? colors.selectedBg
      : colors.selectedBg,
  };

  // Toggle theme
  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    updateTheme({ mode: newMode, system: false });
  };

  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
    // Close sidebar on mobile after navigation
    if (isMobile) {
      onClose();
    }
  };

  // Sidebar styles
  const sidebarStyle = {
    width: `${sidebarWidth}px`,
    height: '100dvh',
    background: glass.sidebarBg,
    backdropFilter: glass.sidebarBlur,
    borderRight: `1px solid ${glass.sidebarBorder}`,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    overflow: 'hidden',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: isMobile && isOpen ? '4px 0 24px rgba(0,0,0,0.3)' : 'none',
  };

  // Handle positioning based on device and open state
  if (isMobile) {
    // Mobile: fixed position, slides in/out
    Object.assign(sidebarStyle, {
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 1000,
      transform: isOpen ? 'translateX(0)' : `translateX(-${sidebarWidth}px)`,
    });
  } else {
    // Desktop: relative position, collapses/expands via margin
    Object.assign(sidebarStyle, {
      position: 'relative',
      marginLeft: isOpen ? '0' : `-${sidebarWidth}px`,
      zIndex: 1,
    });
  }

  // Scrim overlay for mobile
  const scrimStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.50)',
    zIndex: 999,
    display: isMobile && isOpen ? 'block' : 'none',
    opacity: isMobile && isOpen ? 1 : 0,
    transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    pointerEvents: isMobile && isOpen ? 'auto' : 'none',
  };

  // Close button for mobile
  const closeButtonStyle = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    display: isMobile ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: colors.text,
    zIndex: 10,
  };

  // Sidebar header styles
  const headerStyle = {
    height: '140px',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,
  };

  const logoStyle = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    background: colors.surfaceL2,
  };

  const overlayStyle = {
    position: 'absolute',
    inset: 0,
    background: glass.sidebarHeaderOverlay,
    backdropFilter: 'blur(2px)',
  };

  const userInfoStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '12px 14px',
    background: `linear-gradient(180deg, transparent 0%, ${isDark ? 'rgba(10,10,10,0.85)' : 'rgba(248,246,241,0.85)'} 100%)`,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const usernameStyle = {
    fontSize: '14px',
    fontWeight: 700,
    color: isDark ? '#E4F0F6' : '#0A0F1E',
    textShadow: '0 1px 4px rgba(0,0,0,0.3)',
  };

  const emailStyle = {
    fontSize: '11px',
    color: isDark ? 'rgba(228,240,246,0.65)' : 'rgba(10,15,30,0.55)',
    textShadow: '0 1px 3px rgba(0,0,0,0.2)',
  };

  const statusPillStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '20px',
    background: 'rgba(22,163,74,0.25)',
    border: '1px solid rgba(22,163,74,0.4)',
    fontSize: '10px',
    color: '#4ADE80',
    marginTop: '2px',
    width: 'fit-content',
  };

  // Navigation styles
  const navContainerStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    scrollbarWidth: 'thin',
    scrollbarColor: isDark ? 'rgba(255,255,255,0.1) transparent' : 'rgba(0,0,0,0.1) transparent',
  };

  const navItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 14px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '14px',
    fontWeight: isActive ? 600 : 500,
    background: isActive ? glass.tabActiveBg : 'transparent',
    color: isActive ? colors.text : colors.secondaryText,
    position: 'relative',
  });

  const iconStyle = (isActive) => ({
    color: isActive ? colors.btnBg : colors.secondaryText,
    flexShrink: 0,
  });

  const activeBarStyle = {
    position: 'absolute',
    left: 0,
    top: '20%',
    height: '60%',
    width: '3px',
    borderRadius: '0 3px 3px 0',
    background: colors.btnBg,
  };

  // Footer styles
  const footerStyle = {
    flexShrink: 0,
    padding: '10px',
    borderTop: `1px solid ${glass.sidebarBorder}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const footerItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 14px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: colors.secondaryText,
    transition: 'all 0.2s ease',
  };

  return (
    <>
      {/* Scrim overlay */}
      {isMobile && (
        <div style={scrimStyle} onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside style={sidebarStyle}>
        {/* Close button (mobile only) */}
        <button style={closeButtonStyle} onClick={onClose}>
          <X size={18} />
        </button>

        {/* Section 1: Sidebar Header */}
        <div style={headerStyle}>
          <div style={logoStyle} />
          <div style={overlayStyle} />
          <div style={userInfoStyle}>
            <div style={usernameStyle}>
              {user?.fullName || 'Guest User'}
            </div>
            <div style={emailStyle}>
              {user?.email || 'Sign in to your account'}
            </div>
            {isAuthenticated && (
              <div style={statusPillStyle}>
                <Circle size={6} fill="#4ADE80" stroke="none" />
                {user?.role === 'admin' ? 'Administrator' : user?.role === 'apprentice' ? 'Tailor' : 'Online'}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Navigation Links */}
        <nav style={navContainerStyle}>
          {navItems.map((item) => {
            const isActive = activeTab === item.path;
            const Icon = item.icon;

            return (
              <div
                key={item.path}
                style={navItemStyle(isActive)}
                onClick={() => handleNavigation(item.path)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    const bg = isDark
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(10,15,30,0.04)';
                    e.currentTarget.style.background = bg;
                    e.currentTarget.style.color = colors.text;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = colors.secondaryText;
                  }
                }}
              >
                <Icon size={20} style={iconStyle(isActive)} />
                <span>{item.label}</span>
                {isActive && <div style={activeBarStyle} />}
              </div>
            );
          })}
        </nav>

        {/* Section 3: Sidebar Footer */}
        <div style={footerStyle}>
          {/* Theme Toggle */}
          <div
            style={footerItemStyle}
            onClick={toggleTheme}
            onMouseEnter={(e) => {
              const bg = isDark
                ? 'rgba(255,255,255,0.04)'
                : 'rgba(10,15,30,0.04)';
              e.currentTarget.style.background = bg;
              e.currentTarget.style.color = colors.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = colors.secondaryText;
            }}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
          </div>

          {/* Auth Button */}
          <div
            style={{
              ...footerItemStyle,
              color: isAuthenticated ? colors.error : colors.text,
            }}
            onClick={async () => {
              if (isAuthenticated) {
                await logout();
                navigate('/login');
              } else {
                navigate('/login');
              }
              if (isMobile) onClose();
            }}
            onMouseEnter={(e) => {
              const bg = isDark
                ? 'rgba(255,255,255,0.04)'
                : 'rgba(10,15,30,0.04)';
              e.currentTarget.style.background = bg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {isAuthenticated ? (
              <>
                <LogOut size={18} color={colors.error} />
                <span style={{ color: colors.error }}>Logout</span>
              </>
            ) : (
              <>
                <LogIn size={18} color={colors.btnBg} />
                <span>Login</span>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
