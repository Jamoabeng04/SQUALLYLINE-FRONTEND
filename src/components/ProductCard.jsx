import React, { useState } from 'react';
import { Heart, Share2, ShoppingBag, Minus, Plus } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const ProductCard = ({ product, onPress, onAction }) => {
  const { colors, theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const action = onAction || (() => {});

  // Local state
  const [isLiked, setIsLiked] = useState(product.isLiked || false);
  const [isHovered, setIsHovered] = useState(false);
  const [quantity, setQuantity] = useState(0);

  // Handle like
  const handleLike = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    action('like', product.id);
  };

  // Handle share
  const handleShare = (e) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description || '',
        url: window.location.origin + '/product/' + product.id,
      }).catch(() => {});
    }
    action('share', product.id);
  };

  // Handle add to cart
  const handleAddToCart = (e) => {
    e.stopPropagation();
    setQuantity(1);
    action('addToCart', { id: product.id, quantity: 1 });
  };

  // Handle quantity change
  const handleQuantityChange = (e, change) => {
    e.stopPropagation();
    const newQuantity = quantity + change;
    if (newQuantity <= 0) {
      setQuantity(0);
      action('removeFromCart', product.id);
    } else {
      setQuantity(newQuantity);
      action('updateCart', { id: product.id, quantity: newQuantity });
    }
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Card wrapper - DISCONNECTED layout
  const cardWrapperStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px', // This creates the disconnect between image and name
    cursor: 'pointer',
  };

  // Image Section - reduced height
  const imageSectionStyle = {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '16px',
    backgroundColor: isDark ? '#0A0A0A' : '#F8F6F1',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)'}`,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
    boxShadow: isHovered 
      ? isDark 
        ? '0 8px 32px rgba(0,0,0,0.30)' 
        : '0 8px 32px rgba(0,0,0,0.06)'
      : 'none',
  };

  const imageStyle = {
    width: '100%',
    height: '220px', // Reduced from 280px to 220px
    objectFit: 'cover',
    display: 'block',
    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isHovered ? 'scale(1.04)' : 'scale(1)',
  };

  // Price tag on image
  const priceTagStyle = {
    position: 'absolute',
    bottom: '14px',
    left: '14px',
    padding: '5px 12px',
    borderRadius: '10px',
    background: isDark 
      ? 'rgba(10,10,10,0.80)' 
      : 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.15)' : 'rgba(212, 175, 55,0.20)'}`,
    fontSize: '14px',
    fontWeight: 700,
    color: colors.primary,
    letterSpacing: '0.2px',
    zIndex: 2,
  };

  // Badge (if product has one)
  const badgeStyle = (type) => ({
    position: 'absolute',
    top: '10px',
    left: '10px',
    padding: '3px 10px',
    borderRadius: '8px',
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    zIndex: 2,
    ...(type === 'new' && {
      background: isDark ? 'rgba(212, 175, 55,0.20)' : 'rgba(212, 175, 55,0.15)',
      color: colors.primary,
      border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.20)' : 'rgba(212, 175, 55,0.25)'}`,
    }),
    ...(type === 'sale' && {
      background: '#CC0000',
      color: '#FFFFFF',
    }),
    ...(type === 'limited' && {
      background: isDark ? 'rgba(10,10,10,0.80)' : 'rgba(255,255,255,0.85)',
      color: colors.text,
      border: `1px solid ${colors.primary}`,
    }),
  });

  // Quick action overlay (appears on hover)
  const overlayStyle = {
    position: 'absolute',
    inset: 0,
    background: `linear-gradient(0deg, rgba(10,10,10,0.20) 0%, transparent 50%)`,
    opacity: isHovered ? 1 : 0,
    transition: 'opacity 0.4s ease',
    pointerEvents: 'none',
  };

  // Name Section - COMPLETELY SEPARATE with border
  const nameSectionStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '10px 12px 12px',
    borderRadius: '12px',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.12)' : 'rgba(212, 175, 55,0.15)'}`,
    background: isDark ? 'rgba(20,20,20,0.40)' : 'rgba(255,255,255,0.40)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    transition: 'border-color 0.3s ease',
  };

  // Product name and details
  const detailsStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const productNameStyle = {
    fontSize: '13px',
    fontWeight: 600,
    color: colors.text,
    letterSpacing: '0.2px',
    lineHeight: 1.3,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };

  const productCategoryStyle = {
    fontSize: '10px',
    color: colors.secondaryText,
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
  };

  // Actions Row - second section of name area
  const actionsRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    paddingTop: '8px',
    borderTop: `1px solid ${isDark ? 'rgba(212, 175, 55,0.08)' : 'rgba(212, 175, 55,0.10)'}`,
  };

  const actionButtonsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  };

  const actionButtonStyle = {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    transition: 'all 0.2s ease',
    color: colors.secondaryText,
  };

  // Add to cart / Quantity control
  const addToCartContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const addToCartStyle = {
    padding: '5px 12px',
    borderRadius: '14px',
    background: colors.primary,
    color: '#1A1A1A',
    fontSize: '10px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    letterSpacing: '0.3px',
    whiteSpace: 'nowrap',
  };

  const quantityControlStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(248,246,241,0.60)',
    borderRadius: '14px',
    padding: '2px',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.15)'}`,
  };

  const quantityButtonStyle = {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    color: colors.text,
    transition: 'all 0.2s ease',
    fontSize: '12px',
    fontWeight: 600,
  };

  const quantityTextStyle = {
    fontSize: '12px',
    fontWeight: 600,
    color: colors.text,
    minWidth: '16px',
    textAlign: 'center',
  };

  return (
    <div
      style={cardWrapperStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPress && onPress(product.id)}
    >
      {/* Image Section - Separate */}
      <div style={imageSectionStyle}>
        <img
          src={product.image}
          alt={product.name}
          style={imageStyle}
          draggable={false}
        />
        
        {/* Price Tag */}
        <div style={priceTagStyle}>
          {formatPrice(product.price)}
        </div>

        {/* Badge */}
        {product.badge && (
          <div style={badgeStyle(product.badge.type)}>
            {product.badge.label}
          </div>
        )}

        {/* Hover overlay */}
        <div style={overlayStyle} />
      </div>

      {/* Name Section - Completely Separate with visible border */}
      <div style={nameSectionStyle}>
        {/* Part 1: Name and details */}
        <div style={detailsStyle}>
          <div style={productNameStyle}>{product.name}</div>
          {product.category && (
            <div style={productCategoryStyle}>{product.category}</div>
          )}
        </div>

        {/* Part 2: Actions */}
        <div style={actionsRowStyle}>
          <div style={actionButtonsStyle}>
            <button
              style={actionButtonStyle}
              onClick={handleLike}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark 
                  ? 'rgba(212, 175, 55,0.10)' 
                  : 'rgba(212, 175, 55,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Heart
                size={15}
                fill={isLiked ? colors.primary : 'none'}
                color={isLiked ? colors.primary : colors.secondaryText}
              />
            </button>
            <button
              style={actionButtonStyle}
              onClick={handleShare}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark 
                  ? 'rgba(212, 175, 55,0.10)' 
                  : 'rgba(212, 175, 55,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Share2 size={15} color={colors.secondaryText} />
            </button>
          </div>

          <div style={addToCartContainerStyle}>
            {quantity > 0 ? (
              <div style={quantityControlStyle}>
                <button
                  style={quantityButtonStyle}
                  onClick={(e) => handleQuantityChange(e, -1)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark 
                      ? 'rgba(212, 175, 55,0.10)' 
                      : 'rgba(212, 175, 55,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Minus size={12} />
                </button>
                <span style={quantityTextStyle}>{quantity}</span>
                <button
                  style={quantityButtonStyle}
                  onClick={(e) => handleQuantityChange(e, 1)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark 
                      ? 'rgba(212, 175, 55,0.10)' 
                      : 'rgba(212, 175, 55,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Plus size={12} />
                </button>
              </div>
            ) : (
              <button
                style={addToCartStyle}
                onClick={handleAddToCart}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark 
                    ? '#F0D888'
                    : '#927619';
                  e.currentTarget.style.transform = 'scale(1.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.primary;
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <ShoppingBag size={12} />
                Add
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;