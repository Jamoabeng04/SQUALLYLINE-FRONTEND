// import React, { useState, useEffect, useRef } from 'react';
// import { 
//   Menu, X, User, ShoppingCart, Heart, Package, LogOut, 
//   LogIn, UserPlus 
// } from 'lucide-react';
// import { useTheme } from '../../hooks/useTheme';

// const Header = ({ toggleSidebar, isMobile, sidebarOpen }) => {
//   const { colors, theme } = useTheme();
//   const isDark = theme.mode === 'dark';
//   const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
//   const dropdownRef = useRef(null);
//   const [user] = useState({
//     isLoggedIn: true,
//   });

//   // Glass tokens
//   const glass = {
//     waterBg: isDark
//       ? "rgba(26, 37, 64, 0.55)"
//       : "rgba(228, 240, 246, 0.55)",
//     waterBorder: isDark
//       ? "rgba(255, 255, 255, 0.10)"
//       : "rgba(10, 15, 30, 0.12)",
//     waterBlur: "blur(16px) saturate(180%)",
//     dropdownBg: isDark
//       ? "rgba(17, 24, 39, 0.90)"
//       : "rgba(244, 249, 252, 0.92)",
//     dropdownBlur: "blur(24px) saturate(200%)",
//     dropdownBorder: isDark
//       ? "rgba(36, 56, 88, 0.90)"
//       : "rgba(200, 220, 232, 0.85)",
//     dropdownShadow: isDark
//       ? "0 20px 60px rgba(0,0,0,0.6)"
//       : "0 20px 60px rgba(10,15,30,0.12)",
//     tabActiveBg: isDark
//       ? "rgba(228, 240, 246, 0.12)"
//       : "rgba(10, 15, 30, 0.08)",
//   };

//   // Close dropdown on outside click
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setProfileDropdownOpen(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   const headerStyle = {
//     height: '64px',
//     padding: '0 16px',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: colors.glassNavBg || 'rgba(255, 255, 255, 0.72)',
//     backdropFilter: colors.glassNavBlur || 'blur(20px) saturate(160%)',
//     borderBottom: `1px solid ${colors.glassNavBorder || 'rgba(168, 137, 79, 0.22)'}`,
//     boxShadow: colors.glassNavShadow || '0 1px 0 rgba(168, 137, 79, 0.10)',
//     flexShrink: 0,
//     zIndex: 10,
//     position: 'relative',
//   };

//   const floatingElementStyle = {
//     background: glass.waterBg,
//     backdropFilter: glass.waterBlur,
//     border: `1px solid ${glass.waterBorder}`,
//     borderRadius: '12px',
//     transition: 'all 0.2s ease',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//   };

//   const toggleButtonStyle = {
//     ...floatingElementStyle,
//     width: '40px',
//     height: '40px',
//     cursor: 'pointer',
//     flexShrink: 0,
//   };

//   const companyStyle = {
//     ...floatingElementStyle,
//     padding: '8px 14px',
//     fontSize: '14px',
//     fontWeight: 600,
//     color: colors.text,
//     letterSpacing: '0.3px',
//     whiteSpace: 'nowrap',
//     display: isMobile ? 'none' : 'flex',
//   };

//   const profileButtonStyle = {
//     ...floatingElementStyle,
//     width: '40px',
//     height: '40px',
//     cursor: 'pointer',
//     borderRadius: '50%',
//     position: 'relative',
//     flexShrink: 0,
//   };

//   const dropdownStyle = {
//     position: 'absolute',
//     top: '48px',
//     right: '0',
//     minWidth: '200px',
//     borderRadius: '16px',
//     background: glass.dropdownBg,
//     backdropFilter: glass.dropdownBlur,
//     border: `1px solid ${glass.dropdownBorder}`,
//     boxShadow: glass.dropdownShadow,
//     padding: '8px',
//     zIndex: 200,
//     overflow: 'hidden',
//     opacity: profileDropdownOpen ? 1 : 0,
//     transform: profileDropdownOpen ? 'translateY(0)' : 'translateY(-8px)',
//     transition: 'all 200ms ease',
//     pointerEvents: profileDropdownOpen ? 'auto' : 'none',
//   };

//   const dropdownItemStyle = {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '10px',
//     padding: '10px 12px',
//     borderRadius: '10px',
//     fontSize: '14px',
//     color: colors.text,
//     cursor: 'pointer',
//     transition: 'background 0.15s',
//   };

//   const dividerStyle = {
//     height: '1px',
//     background: colors.border,
//     margin: '4px 0',
//   };

//   return (
//     <header style={headerStyle}>
//       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//         <div
//           style={toggleButtonStyle}
//           onClick={toggleSidebar}
//           onMouseEnter={(e) => {
//             const bg = isDark ? 'rgba(26,37,64,0.75)' : 'rgba(228,240,246,0.75)';
//             e.currentTarget.style.background = bg;
//           }}
//           onMouseLeave={(e) => {
//             e.currentTarget.style.background = glass.waterBg;
//           }}
//         >
//           {sidebarOpen ? <X size={20} color={colors.text} /> : <Menu size={20} color={colors.text} />}
//         </div>

//         <div style={companyStyle}>
//           Squally-Line Clothing
//         </div>
//       </div>

//       <div style={{ position: 'relative' }} ref={dropdownRef}>
//         <div
//           style={profileButtonStyle}
//           onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
//           onMouseEnter={(e) => {
//             const bg = isDark ? 'rgba(26,37,64,0.75)' : 'rgba(228,240,246,0.75)';
//             e.currentTarget.style.background = bg;
//           }}
//           onMouseLeave={(e) => {
//             e.currentTarget.style.background = glass.waterBg;
//           }}
//         >
//           <User size={20} color={colors.text} />
//         </div>

//         <div style={dropdownStyle}>
//           {user?.isLoggedIn ? (
//             <>
//               <div style={dropdownItemStyle} onMouseEnter={(e) => e.currentTarget.style.background = glass.tabActiveBg} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
//                 <User size={18} color={colors.text} />
//                 Profile
//               </div>
//               <div style={dropdownItemStyle} onMouseEnter={(e) => e.currentTarget.style.background = glass.tabActiveBg} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
//                 <ShoppingCart size={18} color={colors.text} />
//                 Cart
//               </div>
//               <div style={dropdownItemStyle} onMouseEnter={(e) => e.currentTarget.style.background = glass.tabActiveBg} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
//                 <Heart size={18} color={colors.text} />
//                 Favourites
//               </div>
//               <div style={dropdownItemStyle} onMouseEnter={(e) => e.currentTarget.style.background = glass.tabActiveBg} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
//                 <Package size={18} color={colors.text} />
//                 Orders
//               </div>
//               <div style={dividerStyle} />
//               <div style={{ ...dropdownItemStyle, color: colors.error }} onMouseEnter={(e) => e.currentTarget.style.background = glass.tabActiveBg} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
//                 <LogOut size={18} color={colors.error} />
//                 Logout
//               </div>
//             </>
//           ) : (
//             <>
//               <div style={dropdownItemStyle} onMouseEnter={(e) => e.currentTarget.style.background = glass.tabActiveBg} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
//                 <LogIn size={18} color={colors.text} />
//                 Login
//               </div>
//               <div style={dropdownItemStyle} onMouseEnter={(e) => e.currentTarget.style.background = glass.tabActiveBg} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
//                 <UserPlus size={18} color={colors.text} />
//                 Register
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;




















import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, X, User, ShoppingCart, Heart, Package, LogOut, 
  LogIn, UserPlus, Settings 
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const Header = ({ toggleSidebar, isMobile, sidebarOpen }) => {
  const navigate = useNavigate();
  const { colors, theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [user] = useState({
    isLoggedIn: true,
    name: 'Kwame Asante',
  });

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

  const isMobileWidth = windowWidth < 640;

  // Glass tokens with enhanced glassmorphism
  const glass = {
    waterBg: isDark
      ? "rgba(10, 10, 10, 0.40)"
      : "rgba(255, 255, 255, 0.40)",
    waterBorder: isDark
      ? "rgba(255, 255, 255, 0.08)"
      : "rgba(255, 255, 255, 0.25)",
    waterBlur: "blur(24px) saturate(180%)",
    dropdownBg: isDark
      ? "rgba(10, 10, 10, 0.88)"
      : "rgba(255, 255, 255, 0.88)",
    dropdownBlur: "blur(40px) saturate(200%)",
    dropdownBorder: isDark
      ? "rgba(255, 255, 255, 0.06)"
      : "rgba(255, 255, 255, 0.15)",
    dropdownShadow: isDark
      ? "0 20px 60px rgba(0,0,0,0.5)"
      : "0 20px 60px rgba(0,0,0,0.06)",
    tabActiveBg: isDark
      ? "rgba(168, 137, 79, 0.10)"
      : "rgba(168, 137, 79, 0.06)",
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigate handlers
  const handleNavigation = (path) => {
    setProfileDropdownOpen(false);
    navigate(path);
  };

  // Header style - NO background, fully transparent with margin
  const headerStyle = {
    height: '64px',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    pointerEvents: 'none',
    // Add margin to account for sidebar on desktop
    marginLeft: '0px',
    transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    width: '100%',
    boxSizing: 'border-box',
  };

  // Adjust header margin when sidebar is open on desktop
  const isDesktop = windowWidth >= 1024;
  if (isDesktop && sidebarOpen) {
    headerStyle.marginLeft = '280px';
    headerStyle.width = 'calc(100% - 280px)';
  } else {
    headerStyle.marginLeft = '0px';
    headerStyle.width = '100%';
  }

  // Floating element style - true glassmorphism
  const floatingElementStyle = {
    background: glass.waterBg,
    backdropFilter: glass.waterBlur,
    WebkitBackdropFilter: glass.waterBlur,
    border: `1px solid ${glass.waterBorder}`,
    borderRadius: '12px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
    boxShadow: isDark 
      ? '0 4px 24px rgba(0,0,0,0.15)' 
      : '0 4px 24px rgba(0,0,0,0.03)',
  };

  // Glass effect on hover
  const handleGlassHover = (e) => {
    const bg = isDark 
      ? 'rgba(10, 10, 10, 0.55)' 
      : 'rgba(255, 255, 255, 0.55)';
    e.currentTarget.style.background = bg;
    e.currentTarget.style.boxShadow = isDark 
      ? '0 8px 32px rgba(0,0,0,0.25)' 
      : '0 8px 32px rgba(0,0,0,0.05)';
    e.currentTarget.style.transform = 'scale(1.02)';
  };

  const handleGlassLeave = (e) => {
    e.currentTarget.style.background = glass.waterBg;
    e.currentTarget.style.boxShadow = isDark 
      ? '0 4px 24px rgba(0,0,0,0.15)' 
      : '0 4px 24px rgba(0,0,0,0.03)';
    e.currentTarget.style.transform = 'scale(1)';
  };

  // Toggle button
  const toggleButtonStyle = {
    ...floatingElementStyle,
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    flexShrink: 0,
    borderRadius: '10px',
  };

  // Company name container - responsive
  const companyContainerStyle = {
    ...floatingElementStyle,
    padding: isMobileWidth ? '4px 12px' : '6px 18px',
    height: isMobileWidth ? '36px' : '40px',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '10px',
    gap: isMobileWidth ? '4px' : '8px',
  };

  // Company name - main part
  const companyMainStyle = {
    fontSize: isMobileWidth ? '11px' : isMobile ? '13px' : '15px',
    fontWeight: 700,
    color: colors.heading,
    letterSpacing: isMobileWidth ? '0.1em' : '0.15em',
    fontFamily: "'Georgia', serif",
  };

  // Company name - gold part
  const companyGoldStyle = {
    fontSize: isMobileWidth ? '9px' : isMobile ? '11px' : '13px',
    fontWeight: 400,
    color: colors.primary,
    letterSpacing: isMobileWidth ? '0.15em' : '0.2em',
    fontFamily: "'Georgia', serif",
  };

  // Separator dot
  const dotStyle = {
    width: isMobileWidth ? '2px' : '3px',
    height: isMobileWidth ? '2px' : '3px',
    borderRadius: '50%',
    background: colors.primary,
    opacity: 0.3,
    flexShrink: 0,
  };

  // Profile button
  const profileButtonStyle = {
    ...floatingElementStyle,
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    borderRadius: '50%',
    position: 'relative',
    flexShrink: 0,
  };

  // Dropdown styles
  const dropdownStyle = {
    position: 'absolute',
    top: '52px',
    right: '0',
    minWidth: '220px',
    borderRadius: '16px',
    background: glass.dropdownBg,
    backdropFilter: glass.dropdownBlur,
    WebkitBackdropFilter: glass.dropdownBlur,
    border: `1px solid ${glass.dropdownBorder}`,
    boxShadow: glass.dropdownShadow,
    padding: '6px',
    zIndex: 200,
    overflow: 'hidden',
    opacity: profileDropdownOpen ? 1 : 0,
    transform: profileDropdownOpen ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.95)',
    transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    pointerEvents: profileDropdownOpen ? 'auto' : 'none',
    transformOrigin: 'top right',
  };

  const dropdownUserStyle = {
    padding: '10px 12px 8px',
    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
    marginBottom: '4px',
  };

  const dropdownUserNameStyle = {
    fontSize: '14px',
    fontWeight: 600,
    color: colors.text,
  };

  const dropdownUserEmailStyle = {
    fontSize: '11px',
    color: colors.secondaryText,
    marginTop: '2px',
  };

  const dropdownItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    borderRadius: '10px',
    fontSize: '13px',
    color: colors.text,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    width: '100%',
    background: 'none',
    border: 'none',
  };

  const dividerStyle = {
    height: '1px',
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    margin: '4px 0',
  };

  return (
    <header style={headerStyle}>
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'auto' }}>
        {/* Toggle Button */}
        <div
          style={toggleButtonStyle}
          onClick={toggleSidebar}
          onMouseEnter={handleGlassHover}
          onMouseLeave={handleGlassLeave}
        >
          {sidebarOpen ? <X size={18} color={colors.text} /> : <Menu size={18} color={colors.text} />}
        </div>

        {/* Company Name - Responsive */}
        <div style={companyContainerStyle}>
          <span style={companyMainStyle}>SQUALLY</span>
          <span style={dotStyle} />
          <span style={companyGoldStyle}>LINE</span>
          {!isMobileWidth && (
            <>
              <span style={dotStyle} />
              <span style={{ 
                ...companyMainStyle, 
                fontSize: isMobile ? '11px' : '13px',
                fontWeight: 400,
                color: colors.secondaryText,
                letterSpacing: '0.1em',
              }}>
                CLOTHING
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right side */}
      <div style={{ position: 'relative', pointerEvents: 'auto' }} ref={dropdownRef}>
        {/* Profile Button */}
        <div
          style={profileButtonStyle}
          onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          onMouseEnter={handleGlassHover}
          onMouseLeave={handleGlassLeave}
        >
          <User size={18} color={colors.text} />
        </div>

        {/* Dropdown */}
        <div style={dropdownStyle}>
          {user?.isLoggedIn ? (
            <>
              <div style={dropdownUserStyle}>
                <div style={dropdownUserNameStyle}>{user.name}</div>
                <div style={dropdownUserEmailStyle}>kwame@squallyclothing.com</div>
              </div>
              <button
                style={dropdownItemStyle}
                onClick={() => handleNavigation('/profile')}
                onMouseEnter={(e) => e.currentTarget.style.background = glass.tabActiveBg}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <User size={16} color={colors.text} />
                Profile
              </button>
              <button
                style={dropdownItemStyle}
                onClick={() => handleNavigation('/cart')}
                onMouseEnter={(e) => e.currentTarget.style.background = glass.tabActiveBg}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <ShoppingCart size={16} color={colors.text} />
                Cart
              </button>
              <button
                style={dropdownItemStyle}
                onClick={() => handleNavigation('/gallery')}
                onMouseEnter={(e) => e.currentTarget.style.background = glass.tabActiveBg}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Heart size={16} color={colors.text} />
                Saved Styles
              </button>
              <button
                style={dropdownItemStyle}
                onClick={() => handleNavigation('/orders')}
                onMouseEnter={(e) => e.currentTarget.style.background = glass.tabActiveBg}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Package size={16} color={colors.text} />
                Orders
              </button>
              <button
                style={dropdownItemStyle}
                onClick={() => handleNavigation('/appointments')}
                onMouseEnter={(e) => e.currentTarget.style.background = glass.tabActiveBg}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Settings size={16} color={colors.text} />
                Appointments
              </button>
              <div style={dividerStyle} />
              <button
                style={{ ...dropdownItemStyle, color: colors.error }}
                onClick={() => {
                  // Handle logout
                  setProfileDropdownOpen(false);
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = glass.tabActiveBg}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={16} color={colors.error} />
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                style={dropdownItemStyle}
                onClick={() => handleNavigation('/login')}
                onMouseEnter={(e) => e.currentTarget.style.background = glass.tabActiveBg}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <LogIn size={16} color={colors.text} />
                Login
              </button>
              <button
                style={dropdownItemStyle}
                onClick={() => handleNavigation('/register')}
                onMouseEnter={(e) => e.currentTarget.style.background = glass.tabActiveBg}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <UserPlus size={16} color={colors.text} />
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;