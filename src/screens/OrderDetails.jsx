import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Package,
  Scissors,
  Ruler,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Truck,
  MapPin,
  Phone,
  CreditCard,
  ExternalLink,
  Printer,
  AlertCircle,
  StickyNote,
  User,
  X,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../providers/ToastProvider';
import { orders as ordersApi, payments } from '../api/endpoints';
import { adaptOrder, formatPrice, formatDate, formatDateTime, errorText } from '../api/adapters';

// Mirrors Order.STATUS_CHOICES on the backend.
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

const PAYMENT_COLOR = {
  paid: '#10B981',
  pending: '#F59E0B',
  failed: '#EF4444',
  refunded: '#EF4444',
  partial: '#F59E0B',
};

const TYPE_ICON = { product: Package, style: Scissors, custom: Ruler, appointment: Calendar };

const KIND_LABEL = {
  product: 'Ready to wear',
  style: 'Made to measure',
  custom: 'Custom',
  appointment: 'Consultation',
};

// OrderItem.PRODUCTION_STAGE_CHOICES, in the order the studio works through them.
const STAGES = [
  'pending',
  'pattern_making',
  'cutting',
  'sewing',
  'fitting',
  'finishing',
  'quality_check',
  'ready',
  'completed',
];

const STAGE_LABEL = {
  pending: 'Pending',
  pattern_making: 'Pattern making',
  cutting: 'Cutting',
  sewing: 'Sewing',
  fitting: 'Fitting',
  finishing: 'Finishing',
  quality_check: 'Quality check',
  ready: 'Ready',
  completed: 'Completed',
};

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'items', label: 'Items' },
  { id: 'timeline', label: 'Timeline' },
];

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { colors, theme } = useTheme();
  const { showToast } = useToast();
  const isDark = theme.mode === 'dark';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [busy, setBusy] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [expanded, setExpanded] = useState({ delivery: true, payment: true });
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // The detail serializer carries items, transactions and history on one row, so
  // a single call fills every tab.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    ordersApi
      .detail(orderId)
      .then((row) => {
        if (cancelled) return;
        setOrder(adaptOrder(row));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(errorText(err, 'We could not load that order.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId, reloadKey]);

  const handlePay = async () => {
    setBusy('pay');
    try {
      const payment = await payments.initialize({ order_id: order.id, payment_method: 'paystack' });
      if (payment?.authorization_url) {
        window.location.href = payment.authorization_url;
        return;
      }
      throw new Error('The payment gateway did not return a checkout link.');
    } catch (err) {
      showToast(errorText(err, 'Could not start that payment.'), 'error');
    } finally {
      setBusy('');
    }
  };

  const handleCancel = async () => {
    setBusy('cancel');
    try {
      await ordersApi.cancel(order.id, 'Cancelled by customer');
      showToast(`Order ${order.number} cancelled.`, 'success');
      setShowCancelModal(false);
      setReloadKey((k) => k + 1);
    } catch (err) {
      showToast(errorText(err, 'Could not cancel that order.'), 'error');
    } finally {
      setBusy('');
    }
  };

  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  // History arrives newest-first from the backend; a timeline reads better the
  // other way round.
  const timeline = useMemo(() => (order ? [...order.history].reverse() : []), [order]);

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

  const backButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: colors.secondaryText,
    fontSize: isMobile ? '12px' : '13px',
    padding: 0,
    marginBottom: '12px',
    fontFamily: 'inherit',
  };

  const cardStyle = {
    borderRadius: '14px',
    background: isDark ? 'rgba(20,20,20,0.40)' : 'rgba(255,255,255,0.40)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.06)' : 'rgba(168, 137, 79,0.08)'}`,
    marginBottom: '16px',
    overflow: 'hidden',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: isMobile ? '14px' : '18px',
    padding: isMobile ? '14px 16px' : '18px 22px',
    borderRadius: '14px',
    background: isDark ? 'rgba(20,20,20,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.06)' : 'rgba(168, 137, 79,0.08)'}`,
  };

  const headerTitleStyle = {
    fontSize: isMobile ? '18px' : '22px',
    fontWeight: 800,
    color: colors.heading,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  };

  const chipStyle = (color) => ({
    padding: '3px 10px',
    borderRadius: '8px',
    fontSize: isMobile ? '10px' : '11px',
    fontWeight: 600,
    background: isDark ? `${color}22` : `${color}18`,
    color,
    border: `1px solid ${color}55`,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    whiteSpace: 'nowrap',
  });

  const buttonStyle = (variant = 'ghost') => ({
    padding: isMobile ? '7px 13px' : '9px 16px',
    borderRadius: '9px',
    background:
      variant === 'primary'
        ? colors.primary
        : variant === 'danger'
          ? 'rgba(239,68,68,0.12)'
          : isDark
            ? 'rgba(26,26,26,0.60)'
            : 'rgba(255,255,255,0.80)',
    color: variant === 'primary' ? '#1A1A1A' : variant === 'danger' ? '#EF4444' : colors.text,
    border:
      variant === 'primary'
        ? 'none'
        : variant === 'danger'
          ? '1px solid rgba(239,68,68,0.35)'
          : `1px solid ${isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)'}`,
    cursor: busy ? 'wait' : 'pointer',
    fontSize: isMobile ? '11px' : '12px',
    fontWeight: 600,
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    textDecoration: 'none',
  });

  const tabsStyle = {
    display: 'flex',
    gap: isMobile ? '14px' : '22px',
    borderBottom: `1px solid ${isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.10)'}`,
    marginBottom: '18px',
    overflowX: 'auto',
  };

  const tabStyle = (isActive) => ({
    fontSize: isMobile ? '12px' : '14px',
    fontWeight: isActive ? 700 : 500,
    color: isActive ? colors.primary : colors.secondaryText,
    cursor: 'pointer',
    padding: '0 0 8px',
    background: 'none',
    border: 'none',
    borderBottom: `2px solid ${isActive ? colors.primary : 'transparent'}`,
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  });

  const sectionHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: isMobile ? '12px 14px' : '14px 18px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    width: '100%',
    color: colors.text,
    fontFamily: 'inherit',
  };

  const sectionTitleStyle = {
    fontSize: isMobile ? '13px' : '14px',
    fontWeight: 700,
    color: colors.text,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const sectionBodyStyle = { padding: isMobile ? '0 14px 14px' : '0 18px 18px' };

  const detailRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '6px 0',
    borderBottom: `1px solid ${isDark ? 'rgba(168, 137, 79,0.04)' : 'rgba(168, 137, 79,0.06)'}`,
  };

  const detailLabelStyle = {
    fontSize: isMobile ? '11px' : '12px',
    color: colors.secondaryText,
    flexShrink: 0,
  };

  const detailValueStyle = {
    fontSize: isMobile ? '11px' : '12px',
    fontWeight: 500,
    color: colors.text,
    textAlign: 'right',
    wordBreak: 'break-word',
  };

  const statCardStyle = {
    padding: isMobile ? '10px' : '14px',
    borderRadius: '12px',
    background: isDark ? 'rgba(20,20,20,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.06)' : 'rgba(168, 137, 79,0.08)'}`,
    textAlign: 'center',
  };

  const statLabelStyle = { fontSize: isMobile ? '10px' : '11px', color: colors.secondaryText };

  const noteBoxStyle = {
    marginTop: '10px',
    padding: '10px 12px',
    borderRadius: '10px',
    background: isDark ? 'rgba(26,26,26,0.40)' : 'rgba(248,246,241,0.60)',
  };

  const modalOverlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.60)',
    backdropFilter: 'blur(8px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  };

  const modalStyle = {
    maxWidth: '400px',
    width: '100%',
    background: isDark ? 'rgba(20,20,20,0.97)' : 'rgba(255,255,255,0.97)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.12)' : 'rgba(168, 137, 79,0.18)'}`,
    borderRadius: '16px',
    padding: isMobile ? '22px' : '28px',
    position: 'relative',
  };

  const renderDetail = (label, value) =>
    value ? (
      <div style={detailRowStyle}>
        <span style={detailLabelStyle}>{label}</span>
        <span style={detailValueStyle}>{value}</span>
      </div>
    ) : null;

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div className="skeleton" style={{ height: '92px', borderRadius: '14px', marginBottom: '16px' }} />
          <div className="skeleton" style={{ height: '30px', width: '240px', borderRadius: '8px', marginBottom: '18px' }} />
          <div className="skeleton" style={{ height: '78px', borderRadius: '12px', marginBottom: '16px' }} />
          <div className="skeleton" style={{ height: '180px', borderRadius: '14px' }} />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <button style={backButtonStyle} onClick={() => navigate('/orders')}>
            <ChevronLeft size={15} /> Back to orders
          </button>
          <div style={{ ...cardStyle, textAlign: 'center', padding: isMobile ? '32px 16px' : '48px' }}>
            <AlertCircle size={36} color="#EF4444" />
            <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 700, color: colors.heading, margin: '12px 0 4px' }}>
              Order unavailable
            </h2>
            <p style={{ fontSize: '13px', color: colors.secondaryText, margin: '0 0 16px' }}>
              {error || 'That order could not be found.'}
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button style={buttonStyle('primary')} onClick={() => setReloadKey((k) => k + 1)}>
                <RefreshCw size={14} /> Try again
              </button>
              <button style={buttonStyle()} onClick={() => navigate('/orders')}>
                My orders
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const StatusIcon = STATUS_ICON[order.status] || Clock;
  const statusColor = STATUS_COLOR[order.status] || colors.secondaryText;
  const paymentColor = PAYMENT_COLOR[order.paymentStatus] || colors.secondaryText;
  const TypeIcon = TYPE_ICON[order.type] || Package;

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <button style={backButtonStyle} onClick={() => navigate('/orders')}>
          <ChevronLeft size={15} /> Back to orders
        </button>

        <div style={headerStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={headerTitleStyle}>
              {order.number}
              <span style={chipStyle(statusColor)}>
                <StatusIcon size={isMobile ? 11 : 12} />
                {order.statusLabel}
              </span>
              {!order.isPaid && (
                <span style={chipStyle(paymentColor)}>
                  <CreditCard size={isMobile ? 11 : 12} />
                  {order.paymentStatusLabel}
                </span>
              )}
            </h1>
            <div
              style={{
                fontSize: isMobile ? '12px' : '13px',
                color: colors.secondaryText,
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexWrap: 'wrap',
              }}
            >
              <TypeIcon size={13} style={{ color: colors.primary }} />
              {order.typeLabel || order.type}
              <span>•</span>
              Placed {formatDateTime(order.orderedAt)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {order.canPay && (
              <button style={buttonStyle('primary')} onClick={handlePay} disabled={Boolean(busy)}>
                <CreditCard size={14} />
                {busy === 'pay' ? 'Starting…' : 'Pay now'}
              </button>
            )}
            {order.trackingUrl && (
              <a style={buttonStyle()} href={order.trackingUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={14} /> Track
              </a>
            )}
            <button style={buttonStyle()} onClick={() => window.print()}>
              <Printer size={14} /> Print
            </button>
            {order.canCancel && (
              <button style={buttonStyle('danger')} onClick={() => setShowCancelModal(true)}>
                <XCircle size={14} /> Cancel
              </button>
            )}
          </div>
        </div>

        <div style={tabsStyle}>
          {TABS.map((tab) => (
            <button key={tab.id} style={tabStyle(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
              {tab.id === 'items' ? ` (${order.itemCount})` : ''}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                gap: isMobile ? '8px' : '12px',
                marginBottom: '16px',
              }}
            >
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Total</div>
                <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 800, color: colors.primary }}>
                  {formatPrice(order.total)}
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Items</div>
                <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 800, color: colors.text }}>
                  {order.itemCount}
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Payment</div>
                <div style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 700, color: paymentColor }}>
                  {order.paymentStatusLabel}
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Est. delivery</div>
                <div style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 700, color: colors.text }}>
                  {order.estimatedDelivery ? formatDate(order.estimatedDelivery) : 'To be set'}
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <button style={sectionHeaderStyle} onClick={() => toggle('delivery')}>
                <span style={sectionTitleStyle}>
                  <Truck size={isMobile ? 15 : 17} style={{ color: colors.primary }} />
                  Delivery
                </span>
                {expanded.delivery ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {expanded.delivery && (
                <div style={sectionBodyStyle}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <MapPin size={14} style={{ color: colors.primary, flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: isMobile ? '12px' : '13px', color: colors.text, lineHeight: 1.6 }}>
                      {order.shippingAddress || 'No delivery address on this order.'}
                      {order.shippingCity && (
                        <div style={{ color: colors.secondaryText }}>
                          {[order.shippingCity, order.shippingState, order.shippingCountry]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {order.shippingPhone && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        fontSize: isMobile ? '12px' : '13px',
                        color: colors.text,
                        marginBottom: '8px',
                      }}
                    >
                      <Phone size={14} style={{ color: colors.primary, flexShrink: 0 }} />
                      {order.shippingPhone}
                    </div>
                  )}

                  {renderDetail('Courier', order.courier)}
                  {renderDetail('Tracking number', order.trackingNumber)}
                  {renderDetail(
                    'Est. delivery',
                    order.estimatedDelivery ? formatDate(order.estimatedDelivery) : ''
                  )}
                  {!order.trackingNumber && (
                    <div style={detailRowStyle}>
                      <span style={detailLabelStyle}>Tracking</span>
                      <span style={detailValueStyle}>Added once the piece leaves the studio</span>
                    </div>
                  )}

                  {order.notes && (
                    <div style={noteBoxStyle}>
                      <div style={{ ...detailLabelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <StickyNote size={12} style={{ color: colors.primary }} />
                        Your note
                      </div>
                      <p
                        style={{
                          fontSize: isMobile ? '12px' : '13px',
                          color: colors.text,
                          margin: '4px 0 0',
                          lineHeight: 1.6,
                        }}
                      >
                        {order.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <button style={sectionHeaderStyle} onClick={() => toggle('payment')}>
                <span style={sectionTitleStyle}>
                  <CreditCard size={isMobile ? 15 : 17} style={{ color: colors.primary }} />
                  Payment
                </span>
                {expanded.payment ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {expanded.payment && (
                <div style={sectionBodyStyle}>
                  <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>Subtotal</span>
                    <span style={detailValueStyle}>{formatPrice(order.subtotal)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div style={detailRowStyle}>
                      <span style={detailLabelStyle}>Discount</span>
                      <span style={{ ...detailValueStyle, color: '#10B981' }}>
                        -{formatPrice(order.discount)}
                      </span>
                    </div>
                  )}
                  {order.tax > 0 && (
                    <div style={detailRowStyle}>
                      <span style={detailLabelStyle}>Tax</span>
                      <span style={detailValueStyle}>{formatPrice(order.tax)}</span>
                    </div>
                  )}
                  {/* The studio quotes delivery per address rather than charging it up front. */}
                  <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>Delivery</span>
                    <span style={detailValueStyle}>
                      {order.shippingFee > 0 ? formatPrice(order.shippingFee) : 'Arranged with you'}
                    </span>
                  </div>
                  <div style={{ ...detailRowStyle, borderBottom: 'none', paddingTop: '10px' }}>
                    <span style={{ ...detailLabelStyle, fontWeight: 700, fontSize: isMobile ? '12px' : '13px' }}>
                      Total
                    </span>
                    <span style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: 800, color: colors.primary }}>
                      {formatPrice(order.total)}
                    </span>
                  </div>

                  {renderDetail('Paid on', order.paidAt ? formatDateTime(order.paidAt) : '')}

                  {order.transactions.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ ...detailLabelStyle, marginBottom: '6px' }}>Transactions</div>
                      {order.transactions.map((tx) => (
                        <div
                          key={tx.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '10px',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            marginBottom: '6px',
                            background: isDark ? 'rgba(26,26,26,0.40)' : 'rgba(248,246,241,0.60)',
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: isMobile ? '11px' : '12px',
                                color: colors.text,
                                fontFamily: 'monospace',
                                wordBreak: 'break-all',
                              }}
                            >
                              {tx.reference}
                            </div>
                            <div style={{ fontSize: '10px', color: colors.secondaryText }}>
                              {tx.payment_method_display || tx.payment_method} • {formatDateTime(tx.created_at)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: isMobile ? '11px' : '12px', fontWeight: 700, color: colors.text }}>
                              {formatPrice(tx.amount)}
                            </div>
                            <div
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                color:
                                  tx.status === 'success'
                                    ? '#10B981'
                                    : tx.status === 'failed'
                                      ? '#EF4444'
                                      : '#F59E0B',
                              }}
                            >
                              {tx.status_display || tx.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {order.canPay && (
                    <button
                      style={{
                        ...buttonStyle('primary'),
                        width: '100%',
                        justifyContent: 'center',
                        marginTop: '10px',
                      }}
                      onClick={handlePay}
                      disabled={Boolean(busy)}
                    >
                      <CreditCard size={14} />
                      {busy === 'pay' ? 'Starting payment…' : `Pay ${formatPrice(order.total)}`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div>
            {order.items.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: isMobile ? '28px 16px' : '40px' }}>
                <Package size={32} style={{ color: colors.primary, opacity: 0.4 }} />
                <p style={{ fontSize: '13px', color: colors.secondaryText, margin: '10px 0 0' }}>
                  This order has no line items.
                </p>
              </div>
            ) : (
              order.items.map((item) => {
                const ItemIcon = TYPE_ICON[item.kind] || Package;
                const stageIndex = STAGES.indexOf(item.productionStage);
                // Only made-to-measure work moves through the studio stages;
                // ready-to-wear is simply picked and packed.
                const showStages = (item.kind === 'style' || item.kind === 'custom') && stageIndex >= 0;
                // Measurement blobs are free-form JSON, so only render the flat
                // scalar entries and skip anything nested.
                const measurements =
                  item.measurements && typeof item.measurements === 'object'
                    ? Object.entries(item.measurements).filter(
                        ([, value]) => value !== null && value !== '' && typeof value !== 'object'
                      )
                    : [];

                return (
                  <div key={item.id} style={cardStyle}>
                    <div style={{ padding: isMobile ? '14px' : '18px' }}>
                      <div style={{ display: 'flex', gap: isMobile ? '12px' : '16px' }}>
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: isMobile ? '68px' : '88px',
                            height: isMobile ? '68px' : '88px',
                            borderRadius: '10px',
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: '10px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <h3
                              style={{
                                fontSize: isMobile ? '14px' : '16px',
                                fontWeight: 700,
                                color: colors.heading,
                                margin: 0,
                              }}
                            >
                              {item.name}
                            </h3>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div
                                style={{
                                  fontSize: isMobile ? '13px' : '15px',
                                  fontWeight: 700,
                                  color: colors.primary,
                                }}
                              >
                                {formatPrice(item.total)}
                              </div>
                              <div style={{ fontSize: '11px', color: colors.secondaryText }}>
                                {item.quantity} × {formatPrice(item.price)}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                            <span style={chipStyle(colors.primary)}>
                              <ItemIcon size={11} />
                              {KIND_LABEL[item.kind] || item.kind}
                            </span>
                            {[
                              item.category,
                              item.size ? `Size ${item.size}` : '',
                              item.makingDays ? `${item.makingDays} days to make` : '',
                              item.appointmentDate ? formatDate(item.appointmentDate) : '',
                              item.fabric,
                            ]
                              .filter(Boolean)
                              .map((label) => (
                                <span
                                  key={label}
                                  style={{ fontSize: '11px', color: colors.secondaryText, alignSelf: 'center' }}
                                >
                                  {label}
                                </span>
                              ))}
                          </div>

                          {item.personName && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '11px',
                                color: colors.secondaryText,
                                marginTop: '6px',
                              }}
                            >
                              <User size={11} style={{ color: colors.primary }} />
                              Cut for {item.personName}
                            </div>
                          )}
                        </div>
                      </div>

                      {showStages && (
                        <div style={{ marginTop: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={detailLabelStyle}>Production</span>
                            <span
                              style={{
                                fontSize: isMobile ? '11px' : '12px',
                                fontWeight: 700,
                                color: colors.primary,
                              }}
                            >
                              {STAGE_LABEL[item.productionStage] || item.productionStage}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '3px' }}>
                            {STAGES.map((stage, idx) => (
                              <div
                                key={stage}
                                title={STAGE_LABEL[stage]}
                                style={{
                                  flex: 1,
                                  height: '5px',
                                  borderRadius: '3px',
                                  background:
                                    idx <= stageIndex
                                      ? colors.primary
                                      : isDark
                                        ? 'rgba(168, 137, 79,0.12)'
                                        : 'rgba(168, 137, 79,0.18)',
                                }}
                              />
                            ))}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '9px',
                              color: colors.secondaryText,
                              marginTop: '4px',
                            }}
                          >
                            <span>{STAGE_LABEL[STAGES[0]]}</span>
                            <span>{STAGE_LABEL[STAGES[STAGES.length - 1]]}</span>
                          </div>
                        </div>
                      )}

                      {measurements.length > 0 && (
                        <div style={{ marginTop: '14px' }}>
                          <div style={{ ...detailLabelStyle, marginBottom: '6px' }}>Measurements used</div>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))',
                              gap: '6px',
                            }}
                          >
                            {measurements.map(([key, value]) => (
                              <div
                                key={key}
                                style={{
                                  padding: '6px 8px',
                                  borderRadius: '8px',
                                  background: isDark ? 'rgba(26,26,26,0.40)' : 'rgba(248,246,241,0.60)',
                                  textAlign: 'center',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '8px',
                                    color: colors.secondaryText,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                  }}
                                >
                                  {key.replace(/_/g, ' ')}
                                </div>
                                <div
                                  style={{
                                    fontSize: isMobile ? '12px' : '13px',
                                    fontWeight: 700,
                                    color: colors.text,
                                  }}
                                >
                                  {String(value)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.notes && (
                        <div style={noteBoxStyle}>
                          <div style={detailLabelStyle}>Studio notes</div>
                          <p
                            style={{
                              fontSize: isMobile ? '12px' : '13px',
                              color: colors.text,
                              margin: '4px 0 0',
                              lineHeight: 1.6,
                            }}
                          >
                            {item.notes}
                          </p>
                        </div>
                      )}

                      {item.slug && (item.kind === 'product' || item.kind === 'style') && (
                        <button
                          style={{ ...buttonStyle(), marginTop: '12px' }}
                          onClick={() =>
                            navigate(
                              item.kind === 'product'
                                ? `/product/${item.slug}`
                                : `/styles/order/${item.slug}`
                            )
                          }
                        >
                          {item.kind === 'product' ? 'View product' : 'Order this style again'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div style={cardStyle}>
            <div style={{ padding: isMobile ? '14px' : '18px' }}>
              {timeline.length === 0 ? (
                <div style={{ textAlign: 'center', padding: isMobile ? '20px' : '30px' }}>
                  <Clock size={30} style={{ color: colors.primary, opacity: 0.4 }} />
                  <p style={{ fontSize: '13px', color: colors.secondaryText, margin: '10px 0 0' }}>
                    No updates logged on this order yet.
                  </p>
                </div>
              ) : (
                timeline.map((entry, index) => {
                  const EntryIcon = STATUS_ICON[entry.new_status] || Clock;
                  const entryColor = STATUS_COLOR[entry.new_status] || colors.primary;
                  const isLast = index === timeline.length - 1;
                  return (
                    <div
                      key={entry.id}
                      style={{
                        display: 'flex',
                        gap: isMobile ? '10px' : '14px',
                        paddingBottom: isLast ? 0 : isMobile ? '14px' : '18px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: isDark ? `${entryColor}22` : `${entryColor}18`,
                            border: `1px solid ${entryColor}66`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <EntryIcon size={13} color={entryColor} />
                        </div>
                        {!isLast && (
                          <div
                            style={{
                              flex: 1,
                              width: '2px',
                              minHeight: '18px',
                              background: isDark ? 'rgba(168, 137, 79,0.12)' : 'rgba(168, 137, 79,0.20)',
                              marginTop: '4px',
                            }}
                          />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, paddingTop: '2px' }}>
                        <div style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 700, color: colors.text }}>
                          {entry.note || `Status changed to ${entry.new_status}`}
                        </div>
                        {entry.old_status !== entry.new_status && (
                          <div style={{ fontSize: '11px', color: colors.secondaryText, marginTop: '2px' }}>
                            {entry.old_status} to {entry.new_status}
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: colors.secondaryText, marginTop: '2px' }}>
                          {formatDateTime(entry.created_at)}
                          {entry.changed_by_name ? ` • ${entry.changed_by_name}` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {showCancelModal && (
          <div style={modalOverlayStyle} onClick={() => setShowCancelModal(false)}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
              <button
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.secondaryText,
                }}
                onClick={() => setShowCancelModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
              <h3
                style={{
                  fontSize: isMobile ? '16px' : '18px',
                  fontWeight: 700,
                  color: colors.heading,
                  margin: '0 0 8px',
                }}
              >
                Cancel order {order.number}?
              </h3>
              <p style={{ fontSize: '13px', color: colors.secondaryText, margin: '0 0 18px', lineHeight: 1.6 }}>
                This cannot be undone. The studio stops all work on this order and you would need to
                place a new one to continue.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  style={{ ...buttonStyle('danger'), flex: 1, justifyContent: 'center' }}
                  onClick={handleCancel}
                  disabled={Boolean(busy)}
                >
                  {busy === 'cancel' ? 'Cancelling…' : 'Yes, cancel it'}
                </button>
                <button
                  style={{ ...buttonStyle(), flex: 1, justifyContent: 'center' }}
                  onClick={() => setShowCancelModal(false)}
                >
                  Keep order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsPage;
