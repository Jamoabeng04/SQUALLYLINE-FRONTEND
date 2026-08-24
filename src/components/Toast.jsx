// components/Toast.jsx
import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const Toast = ({ 
  message, 
  type = 'info', // 'success', 'error', 'info', 'warning'
  duration = 3000, 
  onClose,
  position = 'top-right' // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch(type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <Info size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  const getBackgroundColor = () => {
    switch(type) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      default:
        return '#3B82F6';
    }
  };

  const getPositionStyle = () => {
    switch(position) {
      case 'top-left':
        return { top: '70px', left: '20px' };
      case 'bottom-right':
        return { bottom: '70px', right: '20px' };
      case 'bottom-left':
        return { bottom: '70px', left: '20px' };
      default:
        return { top: '70px', right: '20px' };
    }
  };

  return (
    <div style={{
      position: 'fixed',
      ...getPositionStyle(),
      zIndex: 9999,
      animation: 'slideIn 0.3s ease'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 20px',
        backgroundColor: getBackgroundColor(),
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
        minWidth: '280px',
        maxWidth: '400px'
      }}>
        {getIcon()}
        <span style={{ flex: 1, fontSize: '14px', fontWeight: '500' }}>{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.8,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toast;