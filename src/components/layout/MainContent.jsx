// components/layout/MainContent.jsx
import React from 'react';

const MainContent = ({ children }) => {
  return (
    <main
      style={{
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingTop: 'var(--header-height)',
          paddingBottom: 'calc(var(--mobile-tabs-height) + var(--safe-area-bottom))',
          paddingLeft: 'var(--sidebar-width)',
          transition: 'padding 0.3s ease',
          WebkitOverflowScrolling: 'touch',
        }}
        id="main-content-scroll"
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '24px',
            minHeight: 'calc(100vh - var(--header-height) - var(--mobile-tabs-height))',
          }}
        >
          {children}
        </div>
      </div>
    </main>
  );
};

export default MainContent;