import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileTabs from './MobileTabs';
import { useTheme } from '../../hooks/useTheme';
import Footer from '../footer';

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const location = useLocation();
  const { colors } = useTheme();
  const scrollRef = useRef(null);

  // Handle resize and initial setup
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Auto-open sidebar on desktop, auto-close on mobile
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="app-shell" style={{
      display: 'flex',
      height: '100dvh',
      overflow: 'hidden',
      backgroundColor: colors.mainBg,
    }}>
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        isMobile={isMobile} 
        onClose={() => setSidebarOpen(false)}
        activeTab={location.pathname}
      />

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100dvh',
        overflow: 'hidden',
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <Header 
          toggleSidebar={toggleSidebar} 
          isMobile={isMobile}
          sidebarOpen={sidebarOpen}
        />
        
        <main ref={scrollRef} className="app-scroll" style={{
          flex: 1,
          overflow: 'auto',
        //   padding: isMobile ? '16px' : '24px',
          paddingBottom: isMobile ? 'calc(104px + env(safe-area-inset-bottom))' : '32px',
          paddingTop: '64px',
          backgroundColor: colors.mainBg,
          width: '100%',
        }}>
          <div className="route-canvas">{children}</div>
          <Footer />
        </main>

        {/* Mobile Tabs - pass activeTab */}
        {isMobile && <MobileTabs activeTab={location.pathname} />}
      </div>
    </div>
  );
};

export default AppLayout;
