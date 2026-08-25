import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  User,
  Calendar,
  Package,
  Scissors,
  Clock,
  CreditCard,
  Truck,
  Shield,
  AlertCircle,
  Ruler,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../providers/ToastProvider';
import { useCart } from '../providers/CartProvider';
import { formatPrice, formatDate, errorText } from '../api/adapters';

// The backend groups a cart line by item_type; each group gets its own panel so
// ready-to-wear and made-to-measure work never look like the same purchase.
const GROUPS = [
  {
    key: 'product',
    title: 'Products',
    icon: Package,
    emptyTitle: 'No products in your bag',
    emptyHint: 'Browse the shop to add ready-to-wear pieces.',
    emptyCta: { label: 'Shop products', to: '/products' },
  },
  {
    key: 'style',
    title: 'Tailored Styles',
    icon: Scissors,
    emptyTitle: 'No tailored styles',
    emptyHint: 'Pick a style from the gallery and we will cut it to your measurements.',
    emptyCta: { label: 'Browse gallery', to: '/gallery' },
  },
  {
    key: 'appointment',
    title: 'Consultations',
    icon: Calendar,
    emptyTitle: 'No consultations to pay for',
    emptyHint: 'Book a fitting or a style consultation to add one here.',
    emptyCta: { label: 'Book appointment', to: '/appointments/book' },
  },
  {
    key: 'custom',
    title: 'Custom Requests',
    icon: Ruler,
    emptyTitle: 'No custom requests',
    emptyHint: '',
    emptyCta: null,
  },
];

const CartPage = () => {
  const navigate = useNavigate();
  const { colors, theme } = useTheme();
  const { showToast } = useToast();
  const isDark = theme.mode === 'dark';

  const { items, count, subtotal, loading, error, refresh, updateItem, removeItem, clear } =
    useCart();

  // Per-line spinner so a slow quantity change only disables its own row.
  const [busyId, setBusyId] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const grouped = useMemo(() => {
    const map = { product: [], style: [], appointment: [], custom: [] };
    items.forEach((item) => {
      (map[item.kind] || map.custom).push(item);
    });
    return map;
  }, [items]);

  // Only show a group's panel when it has lines, unless the bag is entirely
  // empty — then every panel doubles as a route into the catalogue.
  const visibleGroups = useMemo(() => {
    if (items.length === 0) return GROUPS.filter((g) => g.key !== 'custom');
    return GROUPS.filter((g) => grouped[g.key].length > 0);
  }, [items.length, grouped]);

  const outOfStock = useMemo(() => items.filter((i) => !i.inStock), [items]);

  const handleQuantityChange = async (item, change) => {
    const next = item.quantity + change;
    if (next < 1) return;
    if (item.maxQuantity && next > item.maxQuantity) {
      showToast(`Only ${item.maxQuantity} left in stock.`, 'info');
      return;
    }
    setBusyId(item.id);
    try {
      await updateItem(item.id, next);
    } catch (err) {
      showToast(errorText(err, 'Could not update that quantity.'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (item) => {
    setBusyId(item.id);
    try {
      await removeItem(item.id);
      showToast(`${item.name} removed from your bag.`, 'success');
    } catch (err) {
      showToast(errorText(err, 'Could not remove that item.'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await clear();
      showToast('Bag emptied.', 'success');
    } catch (err) {
      showToast(errorText(err, 'Could not empty your bag.'), 'error');
    } finally {
      setClearing(false);
    }
  };

  const openItem = (item) => {
    if (item.kind === 'product' && item.slug) navigate(`/product/${item.slug}`);
    else if (item.kind === 'style' && item.slug) navigate(`/styles/order/${item.slug}`);
    else if (item.kind === 'appointment' && item.appointmentId) {
      navigate(`/appointments/${item.appointmentId}`);
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      showToast('Your bag is empty.', 'info');
      return;
    }
    if (outOfStock.length > 0) {
      showToast('Remove the out-of-stock pieces before checking out.', 'error');
      return;
    }
    navigate('/checkout');
  };

  // Styles
  const pageStyle = {
    backgroundColor: colors.mainBg,
    minHeight: '100vh',
    paddingBottom: '40px',
  };

  const containerStyle = {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: isMobile ? '12px' : '16px',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isMobile ? '14px' : '20px',
    flexWrap: 'wrap',
    gap: '10px',
  };

  const titleStyle = {
    fontSize: isMobile ? '20px' : '24px',
    fontWeight: 800,
    color: colors.heading,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const titleBadgeStyle = {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 10px',
    borderRadius: '10px',
    background: colors.primary,
    color: '#1A1A1A',
  };

  const headerActionsStyle = {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  };

  const ghostButtonStyle = {
    padding: isMobile ? '6px 12px' : '8px 16px',
    borderRadius: '10px',
    background: 'transparent',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.15)' : 'rgba(212, 175, 55,0.20)'}`,
    cursor: 'pointer',
    color: colors.secondaryText,
    fontSize: isMobile ? '11px' : '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  };

  const mainLayoutStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? '16px' : '20px',
  };

  const leftColumnStyle = { flex: 1, minWidth: 0 };
  const rightColumnStyle = { width: isMobile ? '100%' : '300px', flexShrink: 0 };

  const sectionStyle = {
    marginBottom: '16px',
    borderRadius: '14px',
    background: isDark ? 'rgba(20,20,20,0.40)' : 'rgba(255,255,255,0.40)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)'}`,
    overflow: 'hidden',
  };

  const sectionHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: isMobile ? '10px 14px' : '14px 16px',
    borderBottom: `1px solid ${isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)'}`,
    flexWrap: 'wrap',
    gap: '6px',
  };

  const sectionTitleStyle = {
    fontSize: isMobile ? '13px' : '15px',
    fontWeight: 600,
    color: colors.text,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const sectionIconStyle = { color: colors.primary };

  const itemStyle = (busy) => ({
    display: 'flex',
    alignItems: 'flex-start',
    padding: isMobile ? '10px 12px' : '12px 16px',
    gap: isMobile ? '10px' : '14px',
    borderBottom: `1px solid ${isDark ? 'rgba(212, 175, 55,0.04)' : 'rgba(212, 175, 55,0.06)'}`,
    opacity: busy ? 0.5 : 1,
    pointerEvents: busy ? 'none' : 'auto',
    transition: 'opacity 0.2s ease',
  });

  const itemImageStyle = {
    width: isMobile ? '52px' : '64px',
    height: isMobile ? '52px' : '64px',
    borderRadius: '8px',
    objectFit: 'cover',
    flexShrink: 0,
    cursor: 'pointer',
  };

  const itemInfoStyle = { flex: 1, minWidth: 0 };

  const itemNameStyle = {
    fontSize: isMobile ? '13px' : '14px',
    fontWeight: 600,
    color: colors.text,
    margin: 0,
    cursor: 'pointer',
  };

  const itemMetaStyle = {
    fontSize: isMobile ? '10px' : '12px',
    color: colors.secondaryText,
    marginTop: '2px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexWrap: 'wrap',
  };

  const itemPriceStyle = {
    fontSize: isMobile ? '13px' : '14px',
    fontWeight: 700,
    color: colors.primary,
  };

  const unitPriceStyle = {
    fontSize: isMobile ? '10px' : '11px',
    color: colors.secondaryText,
    fontWeight: 400,
  };

  const quantityControlStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: isDark ? 'rgba(26,26,26,0.40)' : 'rgba(248,246,241,0.40)',
    borderRadius: '6px',
    padding: '2px',
  };

  const qtyButtonStyle = {
    width: isMobile ? '24px' : '28px',
    height: isMobile ? '24px' : '28px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    color: colors.text,
  };

  const qtyTextStyle = {
    fontSize: isMobile ? '12px' : '13px',
    fontWeight: 600,
    color: colors.text,
    minWidth: '20px',
    textAlign: 'center',
  };

  const removeButtonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: colors.secondaryText,
    padding: '4px',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  };

  const chipStyle = (color) => ({
    padding: '1px 8px',
    borderRadius: '6px',
    fontSize: isMobile ? '8px' : '9px',
    fontWeight: 600,
    background: isDark ? `${color}20` : `${color}15`,
    color,
    border: `1px solid ${color}`,
    whiteSpace: 'nowrap',
    textTransform: 'capitalize',
  });

  const emptyStateStyle = {
    textAlign: 'center',
    padding: isMobile ? '30px 16px' : '40px 20px',
  };

  const emptyIconStyle = {
    fontSize: isMobile ? '36px' : '48px',
    color: colors.primary,
    opacity: 0.3,
    marginBottom: '10px',
  };

  const emptyCtaStyle = {
    marginTop: '12px',
    padding: '8px 18px',
    borderRadius: '10px',
    background: colors.primary,
    color: '#1A1A1A',
    border: 'none',
    cursor: 'pointer',
    fontSize: isMobile ? '12px' : '13px',
    fontWeight: 600,
    fontFamily: 'inherit',
  };

  const summaryStyle = {
    padding: isMobile ? '14px' : '16px',
    borderRadius: '14px',
    background: isDark ? 'rgba(20,20,20,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.08)' : 'rgba(212, 175, 55,0.10)'}`,
    position: isMobile ? 'static' : 'sticky',
    top: '16px',
  };

  const summaryRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    gap: '10px',
  };

  const summaryLabelStyle = {
    fontSize: isMobile ? '12px' : '13px',
    color: colors.secondaryText,
  };

  const summaryValueStyle = {
    fontSize: isMobile ? '12px' : '13px',
    fontWeight: 500,
    color: colors.text,
    textAlign: 'right',
  };

  const summaryTotalStyle = {
    fontSize: isMobile ? '16px' : '18px',
    fontWeight: 700,
    color: colors.primary,
  };

  const checkoutButtonStyle = {
    width: '100%',
    padding: isMobile ? '12px' : '14px',
    borderRadius: '10px',
    background: items.length === 0 ? colors.secondaryText : colors.primary,
    color: items.length === 0 ? colors.mainBg : '#1A1A1A',
    border: 'none',
    cursor: items.length === 0 ? 'not-allowed' : 'pointer',
    fontSize: isMobile ? '14px' : '15px',
    fontWeight: 600,
    marginTop: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  };

  const footerIconsStyle = {
    marginTop: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  };

  const footerIconItemStyle = {
    fontSize: isMobile ? '10px' : '11px',
    color: colors.secondaryText,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const warningStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '10px 12px',
    borderRadius: '10px',
    background: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.30)',
    color: '#EF4444',
    fontSize: isMobile ? '11px' : '12px',
    marginBottom: '14px',
  };

  // The line under an item name changes with what the line actually is.
  const renderItemMeta = (item) => {
    if (item.kind === 'product') {
      return (
        <>
          <div style={itemMetaStyle}>
            {[item.category, item.size].filter(Boolean).join(' • ') || 'Ready to wear'}
            {!item.inStock && <span style={chipStyle('#EF4444')}>Out of stock</span>}
          </div>
        </>
      );
    }

    if (item.kind === 'style') {
      return (
        <>
          <div style={itemMetaStyle}>
            <User size={isMobile ? 9 : 10} />
            For {item.personName || 'you'}
            {item.category && <span>• {item.category}</span>}
          </div>
          {item.makingDays > 0 && (
            <div style={itemMetaStyle}>
              <Clock size={isMobile ? 9 : 10} />
              About {item.makingDays} days to make
            </div>
          )}
        </>
      );
    }

    if (item.kind === 'appointment') {
      return (
        <>
          <div style={itemMetaStyle}>
            <Calendar size={isMobile ? 9 : 10} />
            {item.appointmentDate ? formatDate(item.appointmentDate) : 'Date to confirm'}
            {item.appointmentTime && <span>• {item.appointmentTime}</span>}
          </div>
          <div style={itemMetaStyle}>
            {item.tierName && <span style={chipStyle(colors.primary)}>{item.tierName}</span>}
            {item.appointmentStatus && (
              <span style={chipStyle('#3B82F6')}>{item.appointmentStatus.replace(/_/g, ' ')}</span>
            )}
          </div>
        </>
      );
    }

    return (
      <div style={itemMetaStyle}>
        {item.customFabric ? `Fabric: ${item.customFabric}` : 'Priced after review'}
      </div>
    );
  };

  const renderItem = (item, group) => {
    const busy = busyId === item.id;
    // Consultation fees are per booking and custom work is not yet priced, so
    // neither takes a quantity stepper.
    const adjustable = group.key === 'product' || group.key === 'style';

    return (
      <div key={item.id} style={itemStyle(busy)}>
        <img
          src={item.image}
          alt={item.name}
          style={itemImageStyle}
          onClick={() => openItem(item)}
          draggable={false}
        />
        <div style={itemInfoStyle}>
          <div style={itemNameStyle} onClick={() => openItem(item)}>
            {item.name}
          </div>
          {renderItemMeta(item)}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginTop: '6px',
              flexWrap: 'wrap',
            }}
          >
            {adjustable ? (
              <div style={quantityControlStyle}>
                <button
                  style={qtyButtonStyle}
                  aria-label={`Reduce quantity of ${item.name}`}
                  onClick={() => handleQuantityChange(item, -1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus size={isMobile ? 10 : 12} />
                </button>
                <span style={qtyTextStyle}>{item.quantity}</span>
                <button
                  style={qtyButtonStyle}
                  aria-label={`Increase quantity of ${item.name}`}
                  onClick={() => handleQuantityChange(item, 1)}
                >
                  <Plus size={isMobile ? 10 : 12} />
                </button>
              </div>
            ) : (
              <span style={unitPriceStyle}>Qty {item.quantity}</span>
            )}
            <span style={itemPriceStyle}>
              {formatPrice(item.total)}
              {item.quantity > 1 && (
                <span style={unitPriceStyle}> ({formatPrice(item.price)} each)</span>
              )}
            </span>
          </div>
        </div>
        <button
          style={removeButtonStyle}
          aria-label={`Remove ${item.name}`}
          onClick={() => handleRemove(item)}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#EF4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.secondaryText;
          }}
        >
          <Trash2 size={isMobile ? 14 : 16} />
        </button>
      </div>
    );
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>
            <ShoppingBag size={isMobile ? 22 : 28} />
            Cart
            {count > 0 && <span style={titleBadgeStyle}>{count}</span>}
          </h1>
          <div style={headerActionsStyle}>
            {items.length > 0 && (
              <button
                style={ghostButtonStyle}
                onClick={handleClear}
                disabled={clearing}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#EF4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.secondaryText;
                }}
              >
                <Trash2 size={isMobile ? 13 : 15} />
                {clearing ? 'Emptying…' : 'Empty bag'}
              </button>
            )}
            <button
              style={ghostButtonStyle}
              onClick={() => navigate('/products')}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark
                  ? 'rgba(212, 175, 55,0.08)'
                  : 'rgba(212, 175, 55,0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Plus size={isMobile ? 14 : 16} />
              Continue Shopping
            </button>
          </div>
        </div>

        {error && (
          <div style={warningStyle}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              {error}
              <button
                style={{ ...ghostButtonStyle, marginTop: '8px', color: '#EF4444' }}
                onClick={refresh}
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {outOfStock.length > 0 && (
          <div style={warningStyle}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              {outOfStock.length === 1
                ? `${outOfStock[0].name} is out of stock.`
                : `${outOfStock.length} pieces in your bag are out of stock.`}{' '}
              Remove them to continue to checkout.
            </div>
          </div>
        )}

        <div style={mainLayoutStyle}>
          <div style={leftColumnStyle}>
            {loading && items.length === 0 ? (
              <div style={sectionStyle}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={`cart-skeleton-${i}`}
                    className="skeleton"
                    style={{ height: '84px', margin: '10px 12px', borderRadius: '10px' }}
                  />
                ))}
              </div>
            ) : (
              visibleGroups.map((group) => {
                const lines = grouped[group.key];
                const GroupIcon = group.icon;
                return (
                  <div key={group.key} style={sectionStyle}>
                    <div style={sectionHeaderStyle}>
                      <span style={sectionTitleStyle}>
                        <GroupIcon size={isMobile ? 14 : 16} style={sectionIconStyle} />
                        {group.title} ({lines.length})
                      </span>
                      {lines.length > 0 && (
                        <span
                          style={{
                            fontSize: isMobile ? '11px' : '12px',
                            fontWeight: 600,
                            color: colors.primary,
                          }}
                        >
                          {formatPrice(lines.reduce((sum, i) => sum + i.total, 0))}
                        </span>
                      )}
                    </div>

                    {lines.length === 0 ? (
                      <div style={emptyStateStyle}>
                        <div style={emptyIconStyle}>✦</div>
                        <p
                          style={{
                            fontSize: isMobile ? '13px' : '14px',
                            color: colors.text,
                            margin: 0,
                          }}
                        >
                          {group.emptyTitle}
                        </p>
                        {group.emptyHint && (
                          <p
                            style={{
                              fontSize: isMobile ? '11px' : '12px',
                              color: colors.secondaryText,
                              marginTop: '4px',
                            }}
                          >
                            {group.emptyHint}
                          </p>
                        )}
                        {group.emptyCta && (
                          <button
                            style={emptyCtaStyle}
                            onClick={() => navigate(group.emptyCta.to)}
                          >
                            {group.emptyCta.label}
                          </button>
                        )}
                      </div>
                    ) : (
                      lines.map((item) => renderItem(item, group))
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div style={rightColumnStyle}>
            <div style={summaryStyle}>
              <h3
                style={{
                  fontSize: isMobile ? '15px' : '16px',
                  fontWeight: 700,
                  color: colors.heading,
                  margin: '0 0 10px',
                }}
              >
                Order Summary
              </h3>

              {GROUPS.filter((g) => grouped[g.key].length > 0).map((g) => (
                <div key={g.key} style={summaryRowStyle}>
                  <span style={summaryLabelStyle}>
                    {g.title} ({grouped[g.key].reduce((n, i) => n + i.quantity, 0)})
                  </span>
                  <span style={summaryValueStyle}>
                    {formatPrice(grouped[g.key].reduce((sum, i) => sum + i.total, 0))}
                  </span>
                </div>
              ))}

              <div style={summaryRowStyle}>
                <span style={summaryLabelStyle}>Subtotal</span>
                <span style={summaryValueStyle}>{formatPrice(subtotal)}</span>
              </div>

              {/* Delivery is quoted per order once the address is known, so we
                  do not pretend to know it here. */}
              <div style={summaryRowStyle}>
                <span style={summaryLabelStyle}>Delivery</span>
                <span style={summaryValueStyle}>Quoted after checkout</span>
              </div>

              <div
                style={{
                  borderTop: `1px solid ${isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.12)'}`,
                  paddingTop: '10px',
                  marginTop: '6px',
                }}
              >
                <div style={summaryRowStyle}>
                  <span style={{ ...summaryLabelStyle, fontWeight: 700 }}>Total</span>
                  <span style={summaryTotalStyle}>{formatPrice(subtotal)}</span>
                </div>
              </div>

              <button
                style={checkoutButtonStyle}
                onClick={handleCheckout}
                disabled={items.length === 0}
                onMouseEnter={(e) => {
                  if (items.length === 0) return;
                  e.currentTarget.style.background = isDark ? '#F0D888' : '#927619';
                }}
                onMouseLeave={(e) => {
                  if (items.length === 0) return;
                  e.currentTarget.style.background = colors.primary;
                }}
              >
                <CreditCard size={isMobile ? 16 : 18} />
                Proceed to Checkout
              </button>

              <p
                style={{
                  fontSize: isMobile ? '10px' : '11px',
                  color: colors.secondaryText,
                  marginTop: '8px',
                  textAlign: 'center',
                }}
              >
                Checkout places one order for everything in your bag.
              </p>

              <div style={footerIconsStyle}>
                <span style={footerIconItemStyle}>
                  <Truck size={isMobile ? 11 : 12} />
                  Nationwide delivery
                </span>
                <span style={footerIconItemStyle}>
                  <Shield size={isMobile ? 11 : 12} />
                  Paystack secured
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
