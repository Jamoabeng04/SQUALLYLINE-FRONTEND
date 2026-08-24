import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Image, Ruler, User } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const MobileTabs = ({ activeTab }) => {
  const navigate = useNavigate();
  const { colors, theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const tabBarRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const tabs = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Image, label: 'Gallery', path: '/gallery' },
    { icon: Ruler, label: 'Measure', path: '/measure' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const glass = {
    tabBarBg: isDark
      ? colors.glassNavBg
      : colors.glassNavBg,
    tabBarBlur: "blur(28px) saturate(220%)",
    tabBarBorder: isDark
      ? colors.glassNavBorder
      : colors.glassNavBorder,
    tabActiveBg: isDark
      ? colors.selectedBg
      : colors.selectedBg,
  };

  // Calculate container width
  useEffect(() => {
    if (tabBarRef.current) {
      setContainerWidth(tabBarRef.current.offsetWidth);
    }

    const handleResize = () => {
      if (tabBarRef.current) {
        setContainerWidth(tabBarRef.current.offsetWidth);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeIndex = tabs.findIndex(tab => tab.path === activeTab);
  const tabWidth = containerWidth / tabs.length;
  const pillWidth = Math.min(48, tabWidth - 16);
  const pillLeft = activeIndex !== -1 
    ? (activeIndex * tabWidth) + (tabWidth - pillWidth) / 2 
    : 0;

  const tabBarStyle = {
    position: 'fixed',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 32px)',
    maxWidth: '500px',
    height: '72px',
    zIndex: 100,
    background: glass.tabBarBg,
    backdropFilter: glass.tabBarBlur,
    border: `1px solid ${glass.tabBarBorder}`,
    borderRadius: '24px',
    boxShadow: isDark
      ? '0 8px 32px rgba(0,0,0,0.6), 0 1px 0 rgba(168, 137, 79,0.08) inset'
      : '0 8px 32px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.8) inset',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '0 4px',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  };

  const pillStyle = {
    position: 'absolute',
    top: '8px',
    width: `${pillWidth}px`,
    height: 'calc(100% - 16px)',
    borderRadius: '14px',
    background: glass.tabActiveBg,
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(255,255,255,0.5)'}`,
    transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    left: `${pillLeft}px`,
    boxShadow: isDark
      ? '0 0 20px rgba(168, 137, 79,0.05)'
      : '0 0 20px rgba(168, 137, 79,0.08)',
  };

  const tabStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    position: 'relative',
    cursor: 'pointer',
    paddingTop: '8px',
    height: '100%',
    zIndex: 1,
  };

  const iconStyle = (isActive) => ({
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isActive ? 'translateY(-2px) scale(1.1)' : 'translateY(0) scale(1)',
    color: isActive ? colors.btnBg : colors.secondaryText,
  });

  const labelStyle = (isActive) => ({
    fontSize: '10px',
    fontWeight: isActive ? 600 : 400,
    color: isActive ? colors.btnBg : colors.secondaryText,
    opacity: isActive ? 1 : 0.7,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    letterSpacing: '0.2px',
  });

  const handleTabClick = (path) => {
    navigate(path);
  };

  return (
    <div style={tabBarStyle} ref={tabBarRef}>
      <div style={pillStyle} />
      
      {tabs.map((tab) => {
        const isActive = activeTab === tab.path;
        const Icon = tab.icon;

        return (
          <div
            key={tab.path}
            style={tabStyle}
            onClick={() => handleTabClick(tab.path)}
          >
            <Icon 
              size={22} 
              style={iconStyle(isActive)}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span style={labelStyle(isActive)}>
              {tab.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default MobileTabs;
