import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Truck,
  Eye,
  Search,
  ChevronDown,
  ChevronUp,
  CreditCard,
  MapPin,
  RefreshCw,
  Scissors,
  Ruler,
  Loader,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../providers/ToastProvider';
import { orders as ordersApi, payments } from '../api/endpoints';
import { adaptOrder, formatPrice, formatDate, formatDateTime, errorText } from '../api/adapters';

// Mirrors Order.STATUS_CHOICES on the backend, in lifecycle order.
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'processing', label: 'Processing' },
  { id: 'ready', label: 'Ready' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLOR = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  processing: '#3B82F6',
  ready: '#8B5CF6',
  completed: '#10B981',
  cancelled: '#EF4444',
  refunded: '#EF4444',
};

const STATUS_ICON = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: RefreshCw,
  ready: Truck,
  completed: CheckCircle,
  cancelled: XCircle,
  refunded: XCircle,
};

const TYPE_ICON = {
  product: Package,
  style: Scissors,
  custom: Ruler,
  appointment: Calendar,
};

const PAYMENT_COLOR = {
  paid: '#10B981',
  pending: '#F59E0B',
  failed: '#EF4444',
  refunded: '#EF4444',
  partial: '#F59E0B',
};

const OrderListPage = () => {
  const navigate = useNavigate();
  const { colors, theme } = useTheme();
  const { showToast } = useToast();
  const isDark = theme.mode === 'dark';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [expandedId, setExpandedId] = useState(null);
  // The list serializer omits items, address and tracking, so the expanded
  // panel pulls the detail row once and caches it.
  const [details, setDetails] = useState({});
  const [detailLoading, setDetailLoading] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    ordersApi
      .mine()
      .then((rows) => {
        if (cancelled) return;
        setOrders((rows || []).map(adaptOrder));
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err, 'Could not load your orders.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const loadDetail = useCallback(
    async (orderId) => {
      if (details[orderId]) return;
      setDetailLoading(orderId);
      try {
        const row = await ordersApi.detail(orderId);
        setDetails((prev) => ({ ...prev, [orderId]: adaptOrder(row) }));
      } catch (err) {
        showToast(errorText(err, 'Could not load that order.'), 'error');
      } finally {
        setDetailLoading(null);
      }
    },
    [details, showToast]
  );

  const toggleExpand = (orderId) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(orderId);
    loadDetail(orderId);
  };

  const handleCancel = async (order) => {
    setBusyId(order.id);
    try {
      await ordersApi.cancel(order.id, 'Cancelled by customer');
      showToast(`Order ${order.number} cancelled.`, 'success');
      setDetails((prev) => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });
      setReloadKey((k) => k + 1);
    } catch (err) {
      showToast(errorText(err, 'Could not cancel that order.'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handlePay = async (order) => {
    setBusyId(order.id);
    try {
      const payment = await payments.initialize({
        order_id: order.id,
        payment_method: 'paystack',
      });
      if (payment?.authorization_url) {
        window.location.href = payment.authorization_url;
        return;
      }
      throw new Error('The payment gateway did not return a checkout link.');
    } catch (err) {
      showToast(errorText(err, 'Could not start that payment.'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const counts = useMemo(() => {
    const map = { all: orders.length };
    orders.forEach((o) => {
      map[o.status] = (map[o.status] || 0) + 1;
    });
    return map;
  }, [orders]);

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      active: orders.filter((o) => ['confirmed', 'processing', 'ready'].includes(o.status)).length,
      completed: orders.filter((o) => o.status === 'completed').length,
    }),
    [orders]
  );

  const visibleOrders = useMemo(() => {
    let result = orders;

    if (activeFilter !== 'all') {
      result = result.filter((o) => o.status === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((o) =>
        [o.number, o.typeLabel, o.statusLabel, o.paymentStatusLabel]
          .join(' ')
          .toLowerCase()
          .includes(query)
      );
    }

    const sorted = [...result];
    switch (sortBy) {
      case 'oldest':
        sorted.sort((a, b) => new Date(a.orderedAt) - new Date(b.orderedAt));
        break;
      case 'highest':
        sorted.sort((a, b) => b.total - a.total);
        break;
      case 'lowest':
        sorted.sort((a, b) => a.total - b.total);
        break;
      default:
        sorted.sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt));
        break;
    }
    return sorted;
  }, [orders, activeFilter, searchQuery, sortBy]);

  const statusColor = (status) => STATUS_COLOR[status] || colors.secondaryText;

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

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
    gap: '8px',
    marginBottom: '16px',
  };

  const statCardStyle = {
    padding: isMobile ? '8px 10px' : '10px 14px',
    borderRadius: '10px',
    background: isDark ? 'rgba(20,20,20,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.06)' : 'rgba(168, 137, 79,0.08)'}`,
    textAlign: 'center',
  };

  const statNumberStyle = {
    fontSize: isMobile ? '16px' : '20px',
    fontWeight: 700,
    color: colors.heading,
  };

  const statLabelStyle = {
    fontSize: isMobile ? '8px' : '10px',
    color: colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    marginTop: '2px',
  };

  const filterBarStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '14px',
    alignItems: 'center',
  };

  const filterChipStyle = (isActive) => ({
    padding: isMobile ? '4px 10px' : '5px 14px',
    borderRadius: '14px',
    fontSize: isMobile ? '10px' : '12px',
    fontWeight: isActive ? 600 : 400,
    cursor: 'pointer',
    background: isActive ? colors.primary : 'transparent',
    color: isActive ? '#1A1A1A' : colors.secondaryText,
    border: `1px solid ${isActive ? colors.primary : isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.10)'}`,
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  });

  const filterCountStyle = {
    fontSize: isMobile ? '7px' : '9px',
    marginLeft: '3px',
    opacity: 0.6,
  };

  const searchWrapperStyle = {
    position: 'relative',
    flex: 1,
    minWidth: isMobile ? '120px' : '160px',
    maxWidth: isMobile ? '150px' : '220px',
    marginLeft: 'auto',
  };

  const searchInputStyle = {
    width: '100%',
    padding: isMobile ? '4px 8px 4px 24px' : '5px 10px 5px 28px',
    borderRadius: '12px',
    background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.80)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.10)'}`,
    color: colors.text,
    fontSize: isMobile ? '10px' : '11px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const sortSelectStyle = {
    padding: isMobile ? '4px 8px' : '5px 12px',
    borderRadius: '12px',
    background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.80)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.10)'}`,
    color: colors.text,
    fontSize: isMobile ? '10px' : '11px',
    cursor: 'pointer',
    outline: 'none',
    fontFamily: 'inherit',
  };

  const cardStyle = (isExpanded) => ({
    marginBottom: isMobile ? '10px' : '12px',
    borderRadius: '12px',
    background: isDark ? 'rgba(20,20,20,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.06)' : 'rgba(168, 137, 79,0.08)'}`,
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    boxShadow: isExpanded
      ? isDark
        ? '0 4px 20px rgba(0,0,0,0.30)'
        : '0 4px 20px rgba(0,0,0,0.06)'
      : 'none',
  });

  const cardHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: isMobile ? '10px 12px' : '14px 16px',
    gap: isMobile ? '10px' : '14px',
    flexWrap: isMobile ? 'wrap' : 'nowrap',
    cursor: 'pointer',
  };

  const orderIdStyle = {
    fontSize: isMobile ? '12px' : '14px',
    fontWeight: 600,
    color: colors.text,
    flexShrink: 0,
  };

  const badgeStyle = (color) => ({
    padding: '2px 10px',
    borderRadius: '8px',
    fontSize: isMobile ? '8px' : '10px',
    fontWeight: 600,
    background: isDark ? `${color}20` : `${color}15`,
    color,
    border: `1px solid ${color}`,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    whiteSpace: 'nowrap',
  });

  const cardMetaStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '8px' : '12px',
    flexWrap: 'wrap',
    flex: 1,
  };

  const cardMetaItemStyle = {
    fontSize: isMobile ? '10px' : '12px',
    color: colors.secondaryText,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const cardTotalStyle = {
    fontSize: isMobile ? '14px' : '16px',
    fontWeight: 700,
    color: colors.primary,
    flexShrink: 0,
  };

  const expandedContentStyle = {
    padding: isMobile ? '0 12px 12px' : '0 16px 16px',
    borderTop: `1px solid ${isDark ? 'rgba(168, 137, 79,0.06)' : 'rgba(168, 137, 79,0.08)'}`,
    paddingTop: isMobile ? '10px' : '12px',
  };

  const itemRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '4px 0',
  };

  const itemImageStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    objectFit: 'cover',
    flexShrink: 0,
  };

  const itemDetailsStyle = {
    flex: 1,
    minWidth: 0,
    fontSize: isMobile ? '12px' : '13px',
    color: colors.text,
  };

  const itemPriceStyle = {
    fontSize: isMobile ? '11px' : '12px',
    fontWeight: 500,
    color: colors.secondaryText,
    whiteSpace: 'nowrap',
  };

  const detailGridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: isMobile ? '6px' : '10px',
    marginTop: '8px',
  };

  const detailItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    padding: '4px 0',
    borderBottom: `1px solid ${isDark ? 'rgba(168, 137, 79,0.04)' : 'rgba(168, 137, 79,0.06)'}`,
  };

  const detailLabelStyle = {
    fontSize: isMobile ? '11px' : '12px',
    color: colors.secondaryText,
    whiteSpace: 'nowrap',
  };

  const detailValueStyle = {
    fontSize: isMobile ? '11px' : '12px',
    fontWeight: 500,
    color: colors.text,
    textAlign: 'right',
  };

  const actionButtonsStyle = {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
    flexWrap: 'wrap',
  };

  const actionButtonStyle = (isPrimary = false) => ({
    padding: isMobile ? '6px 14px' : '8px 18px',
    borderRadius: '8px',
    background: isPrimary
      ? colors.primary
      : isDark
        ? 'rgba(26,26,26,0.60)'
        : 'rgba(255,255,255,0.80)',
    color: isPrimary ? '#1A1A1A' : colors.text,
    border: isPrimary
      ? 'none'
      : `1px solid ${isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)'}`,
    cursor: 'pointer',
    fontSize: isMobile ? '11px' : '12px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  });

  const emptyStateStyle = {
    textAlign: 'center',
    padding: isMobile ? '40px 16px' : '60px 20px',
  };

  const emptyIconStyle = {
    fontSize: isMobile ? '40px' : '56px',
    color: colors.primary,
    opacity: 0.3,
    marginBottom: '12px',
  };

  const primaryCtaStyle = {
    marginTop: '16px',
    padding: '10px 24px',
    borderRadius: '10px',
    background: colors.primary,
    color: '#1A1A1A',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: 'inherit',
  };

  const renderExpanded = (order) => {
    const detail = details[order.id];

    if (detailLoading === order.id && !detail) {
      return (
        <div style={expandedContentStyle}>
          {[0, 1].map((i) => (
            <div
              key={`detail-skeleton-${order.id}-${i}`}
              className="skeleton"
              style={{ height: '32px', margin: '6px 0', borderRadius: '8px' }}
            />
          ))}
        </div>
      );
    }

    if (!detail) {
      return (
        <div style={expandedContentStyle}>
          <button style={actionButtonStyle(false)} onClick={() => loadDetail(order.id)}>
            <RefreshCw size={13} /> Load details
          </button>
        </div>
      );
    }

    const busy = busyId === order.id;

    return (
      <div style={expandedContentStyle}>
        <div style={{ marginBottom: '10px' }}>
          {detail.items.map((item) => (
            <div key={item.id} style={itemRowStyle}>
              <img src={item.image} alt={item.name} style={itemImageStyle} draggable={false} />
              <div style={itemDetailsStyle}>
                {item.name}
                {item.personName && (
                  <span style={{ color: colors.secondaryText }}> — for {item.personName}</span>
                )}
              </div>
              <div style={itemPriceStyle}>
                ×{item.quantity} • {formatPrice(item.total)}
              </div>
            </div>
          ))}
        </div>

        <div style={detailGridStyle}>
          <div>
            <div style={detailItemStyle}>
              <span style={detailLabelStyle}>Placed</span>
              <span style={detailValueStyle}>{formatDateTime(detail.orderedAt)}</span>
            </div>
            <div style={detailItemStyle}>
              <span style={detailLabelStyle}>Subtotal</span>
              <span style={detailValueStyle}>{formatPrice(detail.subtotal)}</span>
            </div>
            {detail.discount > 0 && (
              <div style={detailItemStyle}>
                <span style={detailLabelStyle}>Discount</span>
                <span style={detailValueStyle}>−{formatPrice(detail.discount)}</span>
              </div>
            )}
            <div style={detailItemStyle}>
              <span style={detailLabelStyle}>Delivery</span>
              <span style={detailValueStyle}>
                {detail.shippingFee > 0 ? formatPrice(detail.shippingFee) : 'Arranged with you'}
              </span>
            </div>
            <div style={detailItemStyle}>
              <span style={detailLabelStyle}>Total</span>
              <span style={detailValueStyle}>{formatPrice(detail.total)}</span>
            </div>
          </div>
          <div>
            <div style={detailItemStyle}>
              <span style={detailLabelStyle}>Payment</span>
              <span style={{ ...detailValueStyle, color: PAYMENT_COLOR[detail.paymentStatus] }}>
                {detail.paymentStatusLabel}
              </span>
            </div>
            {detail.shippingAddress && (
              <div style={detailItemStyle}>
                <span style={detailLabelStyle}>Deliver to</span>
                <span style={detailValueStyle}>
                  {[detail.shippingAddress, detail.shippingCity].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            {detail.shippingPhone && (
              <div style={detailItemStyle}>
                <span style={detailLabelStyle}>Phone</span>
                <span style={detailValueStyle}>{detail.shippingPhone}</span>
              </div>
            )}
            {detail.trackingNumber && (
              <div style={detailItemStyle}>
                <span style={detailLabelStyle}>Tracking</span>
                <span style={detailValueStyle}>
                  {detail.courier ? `${detail.courier} • ` : ''}
                  {detail.trackingNumber}
                </span>
              </div>
            )}
            {detail.estimatedDelivery && (
              <div style={detailItemStyle}>
                <span style={detailLabelStyle}>Est. delivery</span>
                <span style={detailValueStyle}>{formatDate(detail.estimatedDelivery)}</span>
              </div>
            )}
          </div>
        </div>

        {detail.notes && (
          <div
            style={{
              marginTop: '6px',
              fontSize: isMobile ? '11px' : '12px',
              color: colors.secondaryText,
            }}
          >
            <strong>Your note:</strong> {detail.notes}
          </div>
        )}

        <div style={actionButtonsStyle}>
          <button
            style={actionButtonStyle(true)}
            onClick={() => navigate(`/orders/${order.id}`)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? '#C9B183' : '#8A6F3A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.primary;
            }}
          >
            <Eye size={isMobile ? 14 : 16} />
            View Details
          </button>

          {detail.canPay && (
            <button
              style={actionButtonStyle(false)}
              disabled={busy}
              onClick={() => handlePay(order)}
            >
              <CreditCard size={isMobile ? 14 : 16} />
              {busy ? 'Starting…' : 'Pay now'}
            </button>
          )}

          {detail.trackingUrl && (
            <a
              href={detail.trackingUrl}
              target="_blank"
              rel="noreferrer"
              style={{ ...actionButtonStyle(false), textDecoration: 'none' }}
            >
              <Truck size={isMobile ? 14 : 16} />
              Track
            </a>
          )}

          {detail.canCancel && (
            <button
              style={actionButtonStyle(false)}
              disabled={busy}
              onClick={() => handleCancel(order)}
            >
              <XCircle size={isMobile ? 14 : 16} />
              {busy ? 'Cancelling…' : 'Cancel order'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>
            <Package size={isMobile ? 22 : 28} />
            Orders
            {orders.length > 0 && <span style={titleBadgeStyle}>{visibleOrders.length}</span>}
          </h1>
        </div>

        {orders.length > 0 && (
          <div style={statsGridStyle}>
            <div style={statCardStyle}>
              <div style={statNumberStyle}>{stats.total}</div>
              <div style={statLabelStyle}>Total</div>
            </div>
            <div style={statCardStyle}>
              <div style={{ ...statNumberStyle, color: '#F59E0B' }}>{stats.pending}</div>
              <div style={statLabelStyle}>Pending</div>
            </div>
            <div style={statCardStyle}>
              <div style={{ ...statNumberStyle, color: '#3B82F6' }}>{stats.active}</div>
              <div style={statLabelStyle}>In progress</div>
            </div>
            <div style={statCardStyle}>
              <div style={{ ...statNumberStyle, color: '#10B981' }}>{stats.completed}</div>
              <div style={statLabelStyle}>Completed</div>
            </div>
          </div>
        )}

        {orders.length > 0 && (
          <div style={filterBarStyle}>
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  style={filterChipStyle(isActive)}
                  onClick={() => setActiveFilter(filter.id)}
                >
                  {filter.label}
                  <span style={filterCountStyle}>{counts[filter.id] || 0}</span>
                </button>
              );
            })}

            <div style={searchWrapperStyle}>
              <Search
                size={isMobile ? 11 : 13}
                color={colors.secondaryText}
                style={{
                  position: 'absolute',
                  left: isMobile ? '6px' : '9px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              <input
                style={searchInputStyle}
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              style={sortSelectStyle}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort orders"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest</option>
              <option value="lowest">Lowest</option>
            </select>
          </div>
        )}

        {loading ? (
          [0, 1, 2].map((i) => (
            <div
              key={`order-skeleton-${i}`}
              className="skeleton"
              style={{ height: '64px', marginBottom: '12px', borderRadius: '12px' }}
            />
          ))
        ) : error ? (
          <div style={emptyStateStyle}>
            <AlertCircle size={isMobile ? 32 : 40} color="#EF4444" />
            <p
              style={{
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: 600,
                color: colors.text,
                margin: '10px 0 0',
              }}
            >
              {error}
            </p>
            <button style={primaryCtaStyle} onClick={() => setReloadKey((k) => k + 1)}>
              Try again
            </button>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div style={emptyStateStyle}>
            <div style={emptyIconStyle}>✦</div>
            <p
              style={{
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: 600,
                color: colors.text,
                margin: 0,
              }}
            >
              {orders.length === 0 ? 'No orders yet' : 'Nothing matches that'}
            </p>
            <p
              style={{
                fontSize: isMobile ? '12px' : '13px',
                color: colors.secondaryText,
                marginTop: '4px',
              }}
            >
              {orders.length === 0
                ? 'Your first order will appear here the moment you place it.'
                : 'Try a different filter or search.'}
            </p>
            <button
              style={primaryCtaStyle}
              onClick={() => {
                if (orders.length === 0) {
                  navigate('/gallery');
                  return;
                }
                setActiveFilter('all');
                setSearchQuery('');
              }}
            >
              {orders.length === 0 ? 'Browse Gallery' : 'Clear filters'}
            </button>
          </div>
        ) : (
          visibleOrders.map((order) => {
            const isExpanded = expandedId === order.id;
            const StatusIcon = STATUS_ICON[order.status] || AlertCircle;
            const TypeIcon = TYPE_ICON[order.type] || Package;

            return (
              <div key={order.id} style={cardStyle(isExpanded)}>
                <div
                  style={cardHeaderStyle}
                  onClick={() => toggleExpand(order.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') toggleExpand(order.id);
                  }}
                >
                  <div style={orderIdStyle}>{order.number}</div>

                  <span style={badgeStyle(statusColor(order.status))}>
                    <StatusIcon size={isMobile ? 10 : 12} />
                    {order.statusLabel}
                  </span>

                  {!order.isPaid && (
                    <span style={badgeStyle(PAYMENT_COLOR[order.paymentStatus] || '#F59E0B')}>
                      {order.paymentStatusLabel}
                    </span>
                  )}

                  <div style={cardMetaStyle}>
                    <span style={cardMetaItemStyle}>
                      <Calendar size={isMobile ? 10 : 12} />
                      {formatDate(order.orderedAt)}
                    </span>
                    <span style={cardMetaItemStyle}>
                      <TypeIcon size={isMobile ? 10 : 12} />
                      {order.typeLabel || order.type}
                    </span>
                    <span style={cardMetaItemStyle}>
                      <MapPin size={isMobile ? 10 : 12} />
                      {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <div style={cardTotalStyle}>{formatPrice(order.total)}</div>

                  <div style={{ flexShrink: 0, color: colors.secondaryText }}>
                    {detailLoading === order.id ? (
                      <Loader
                        size={isMobile ? 14 : 16}
                        style={{ animation: 'spin 1s linear infinite' }}
                      />
                    ) : isExpanded ? (
                      <ChevronUp size={isMobile ? 16 : 18} />
                    ) : (
                      <ChevronDown size={isMobile ? 16 : 18} />
                    )}
                  </div>
                </div>

                {isExpanded && renderExpanded(order)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OrderListPage;
