import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Package,
  Scissors,
  Calendar,
  Ruler,
  CreditCard,
  Shield,
  Lock,
  AlertCircle,
  StickyNote,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../providers/ToastProvider';
import { useCart } from '../providers/CartProvider';
import { useAuth } from '../providers/AuthProvider';
import { orders as ordersApi, payments } from '../api/endpoints';
import { formatPrice, errorText } from '../api/adapters';

const KIND_ICON = {
  product: Package,
  style: Scissors,
  appointment: Calendar,
  custom: Ruler,
};

const REQUIRED = ['address', 'city', 'phone'];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { colors, theme } = useTheme();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { items, count, subtotal, loading, refresh } = useCart();
  const isDark = theme.mode === 'dark';

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'Ghana',
    phone: '',
    billingSame: true,
    billingAddress: '',
    notes: '',
  });
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // Seed the form from the saved profile so a returning customer only confirms.
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      address: prev.address || user.address || '',
      phone: prev.phone || user.phone || '',
    }));
  }, [user]);

  const errors = useMemo(() => {
    const next = {};
    if (!form.address.trim()) next.address = 'Where should we deliver?';
    if (!form.city.trim()) next.city = 'City or town is required.';
    if (!form.phone.trim()) next.phone = 'A phone number is required.';
    else if (form.phone.replace(/\D/g, '').length < 9) next.phone = 'That phone number looks short.';
    if (!form.billingSame && !form.billingAddress.trim()) {
      next.billingAddress = 'Add the billing address or tick "same as delivery".';
    }
    return next;
  }, [form]);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ address: true, city: true, phone: true, billingAddress: true });

    if (Object.keys(errors).length > 0) {
      showToast('Check the delivery details first.', 'error');
      return;
    }
    if (items.length === 0) {
      showToast('Your bag is empty.', 'info');
      return;
    }

    setSubmitting(true);
    let order = placedOrder;

    try {
      // The order is created from the whole cart server-side, and the cart is
      // cleared in the same transaction — so only create it once even if the
      // payment step has to be retried.
      if (!order) {
        order = await ordersApi.create({
          shipping_address: form.address.trim(),
          shipping_city: form.city.trim(),
          shipping_state: form.state.trim(),
          shipping_country: form.country.trim() || 'Ghana',
          shipping_zip: form.zip.trim(),
          shipping_phone: form.phone.trim(),
          billing_same_as_shipping: form.billingSame,
          billing_address: form.billingSame ? '' : form.billingAddress.trim(),
          customer_notes: form.notes.trim(),
        });
        setPlacedOrder(order);
        await refresh();
      }

      const payment = await payments.initialize({ order_id: order.id, payment_method: 'paystack' });
      if (payment?.authorization_url) {
        window.location.href = payment.authorization_url;
        return;
      }
      throw new Error('The payment gateway did not return a checkout link.');
    } catch (err) {
      if (order) {
        // The order is safely placed; only the gateway hop failed. Send the
        // customer to the order so they can pay from there.
        showToast(
          errorText(err, 'Order placed, but payment could not start. Try paying from the order.'),
          'error'
        );
        navigate(`/orders/${order.id}`, { replace: true });
        return;
      }
      showToast(errorText(err, 'Could not place your order.'), 'error');
    } finally {
      setSubmitting(false);
    }
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

  const backButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: colors.secondaryText,
    fontSize: isMobile ? '12px' : '13px',
    padding: 0,
    marginBottom: '10px',
    fontFamily: 'inherit',
  };

  const titleStyle = {
    fontSize: isMobile ? '20px' : '24px',
    fontWeight: 800,
    color: colors.heading,
    margin: '0 0 4px',
  };

  const subtitleStyle = {
    fontSize: isMobile ? '12px' : '13px',
    color: colors.secondaryText,
    margin: `0 0 ${isMobile ? '14px' : '20px'}`,
  };

  const mainLayoutStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? '16px' : '20px',
  };

  const leftColumnStyle = { flex: 1, minWidth: 0 };
  const rightColumnStyle = { width: isMobile ? '100%' : '320px', flexShrink: 0 };

  const cardStyle = {
    padding: isMobile ? '14px' : '18px',
    borderRadius: '14px',
    background: isDark ? 'rgba(20,20,20,0.40)' : 'rgba(255,255,255,0.40)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)'}`,
    marginBottom: '16px',
  };

  const cardTitleStyle = {
    fontSize: isMobile ? '14px' : '16px',
    fontWeight: 700,
    color: colors.heading,
    margin: '0 0 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const rowStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? '0' : '12px',
  };

  const fieldStyle = { flex: 1, marginBottom: '12px', minWidth: 0 };

  const labelStyle = {
    display: 'block',
    fontSize: isMobile ? '11px' : '12px',
    fontWeight: 600,
    color: colors.secondaryText,
    marginBottom: '4px',
  };

  const inputStyle = (invalid) => ({
    width: '100%',
    padding: isMobile ? '10px 12px' : '11px 14px',
    borderRadius: '10px',
    background: isDark ? 'rgba(10,10,10,0.40)' : 'rgba(255,255,255,0.70)',
    border: `1px solid ${invalid ? 'rgba(239,68,68,0.60)' : isDark ? 'rgba(212, 175, 55,0.12)' : 'rgba(212, 175, 55,0.18)'}`,
    color: colors.text,
    fontSize: isMobile ? '13px' : '14px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
  });

  const fieldErrorStyle = {
    fontSize: '11px',
    color: '#EF4444',
    marginTop: '4px',
  };

  const checkboxRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: isMobile ? '12px' : '13px',
    color: colors.text,
    cursor: 'pointer',
    marginBottom: '12px',
  };

  const summaryStyle = {
    padding: isMobile ? '14px' : '16px',
    borderRadius: '14px',
    background: isDark ? 'rgba(20,20,20,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.08)' : 'rgba(212, 175, 55,0.10)'}`,
    position: isMobile ? 'static' : 'sticky',
    top: '16px',
  };

  const lineStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 0',
    borderBottom: `1px solid ${isDark ? 'rgba(212, 175, 55,0.04)' : 'rgba(212, 175, 55,0.06)'}`,
  };

  const lineNameStyle = {
    flex: 1,
    minWidth: 0,
    fontSize: isMobile ? '12px' : '13px',
    color: colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const linePriceStyle = {
    fontSize: isMobile ? '12px' : '13px',
    fontWeight: 600,
    color: colors.text,
    whiteSpace: 'nowrap',
  };

  const summaryRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    gap: '10px',
  };

  const summaryLabelStyle = { fontSize: isMobile ? '12px' : '13px', color: colors.secondaryText };
  const summaryValueStyle = {
    fontSize: isMobile ? '12px' : '13px',
    fontWeight: 500,
    color: colors.text,
    textAlign: 'right',
  };

  const payButtonStyle = {
    width: '100%',
    padding: isMobile ? '12px' : '14px',
    borderRadius: '10px',
    background: submitting ? colors.secondaryText : colors.primary,
    color: submitting ? colors.mainBg : '#1A1A1A',
    border: 'none',
    cursor: submitting ? 'wait' : 'pointer',
    fontSize: isMobile ? '14px' : '15px',
    fontWeight: 600,
    marginTop: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontFamily: 'inherit',
  };

  const noteStyle = {
    fontSize: isMobile ? '10px' : '11px',
    color: colors.secondaryText,
    marginTop: '8px',
    textAlign: 'center',
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

  const primaryCtaStyle = {
    padding: '10px 20px',
    borderRadius: '10px',
    background: colors.primary,
    color: '#1A1A1A',
    border: 'none',
    cursor: 'pointer',
    fontSize: isMobile ? '13px' : '14px',
    fontWeight: 600,
    fontFamily: 'inherit',
  };

  const renderField = (name, label, extra = {}) => {
    const invalid = touched[name] && Boolean(errors[name]);
    const { multiline, ...inputProps } = extra;
    const Tag = multiline ? 'textarea' : 'input';
    return (
      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor={`checkout-${name}`}>
          {label}
          {REQUIRED.includes(name) && <span style={{ color: colors.primary }}> *</span>}
        </label>
        <Tag
          id={`checkout-${name}`}
          value={form[name]}
          onChange={(e) => setField(name, e.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, [name]: true }))}
          style={inputStyle(invalid)}
          {...inputProps}
        />
        {invalid && <div style={fieldErrorStyle}>{errors[name]}</div>}
      </div>
    );
  };

  // Cart emptied itself server-side once the order was created, so an empty bag
  // right after a submit is expected — don't show the "nothing to check out" wall.
  if (!loading && items.length === 0 && !placedOrder) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <button style={backButtonStyle} onClick={() => navigate('/cart')}>
            <ArrowLeft size={14} /> Back to cart
          </button>
          <div style={{ ...cardStyle, textAlign: 'center', padding: isMobile ? '30px 16px' : '48px' }}>
            <div style={{ fontSize: '42px', color: colors.primary, opacity: 0.3, marginBottom: '10px' }}>
              ✦
            </div>
            <h2 style={{ ...titleStyle, fontSize: isMobile ? '16px' : '18px' }}>
              Nothing to check out
            </h2>
            <p style={{ ...subtitleStyle, margin: '4px 0 16px' }}>
              Add a piece to your bag and come back.
            </p>
            <button style={primaryCtaStyle} onClick={() => navigate('/products')}>
              Browse the shop
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <button style={backButtonStyle} onClick={() => navigate('/cart')}>
          <ArrowLeft size={14} /> Back to cart
        </button>
        <h1 style={titleStyle}>Checkout</h1>
        <p style={subtitleStyle}>
          {count} {count === 1 ? 'item' : 'items'} — pay securely with Paystack.
        </p>

        {placedOrder && (
          <div style={warningStyle}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              Order {placedOrder.order_number || placedOrder.id} is already placed. Pressing pay
              again only restarts the payment — it will not create a second order.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={mainLayoutStyle}>
            <div style={leftColumnStyle}>
              <div style={cardStyle}>
                <h2 style={cardTitleStyle}>
                  <MapPin size={isMobile ? 14 : 16} style={{ color: colors.primary }} />
                  Delivery Details
                </h2>

                {renderField('address', 'Street address', {
                  multiline: true,
                  rows: 2,
                  placeholder: 'House number, street, landmark',
                })}

                <div style={rowStyle}>
                  {renderField('city', 'City / Town', { placeholder: 'Accra' })}
                  {renderField('state', 'Region', { placeholder: 'Greater Accra' })}
                </div>

                <div style={rowStyle}>
                  {renderField('zip', 'Digital address / Postcode', { placeholder: 'GA-123-4567' })}
                  {renderField('country', 'Country')}
                </div>

                {renderField('phone', 'Phone number', {
                  type: 'tel',
                  placeholder: '024 000 0000',
                  inputMode: 'tel',
                })}

                <p style={{ fontSize: '11px', color: colors.secondaryText, margin: 0, display: 'flex', gap: '6px' }}>
                  <Phone size={12} style={{ flexShrink: 0, marginTop: '1px' }} />
                  We call this number to arrange delivery and any fitting.
                </p>
              </div>

              <div style={cardStyle}>
                <h2 style={cardTitleStyle}>
                  <CreditCard size={isMobile ? 14 : 16} style={{ color: colors.primary }} />
                  Billing
                </h2>

                <label style={checkboxRowStyle}>
                  <input
                    type="checkbox"
                    checked={form.billingSame}
                    onChange={(e) => setField('billingSame', e.target.checked)}
                    style={{ accentColor: colors.primary, width: '16px', height: '16px' }}
                  />
                  Billing address is the same as delivery
                </label>

                {!form.billingSame &&
                  renderField('billingAddress', 'Billing address', {
                    multiline: true,
                    rows: 2,
                    placeholder: 'Billing address',
                  })}
              </div>

              <div style={cardStyle}>
                <h2 style={cardTitleStyle}>
                  <StickyNote size={isMobile ? 14 : 16} style={{ color: colors.primary }} />
                  Notes for the studio
                </h2>
                {renderField('notes', 'Anything we should know? (optional)', {
                  multiline: true,
                  rows: 3,
                  placeholder: 'Preferred delivery time, gift wrapping, fabric notes…',
                })}
              </div>
            </div>

            <div style={rightColumnStyle}>
              <div style={summaryStyle}>
                <h2 style={{ ...cardTitleStyle, marginBottom: '8px' }}>Your Order</h2>

                {loading && items.length === 0
                  ? [0, 1].map((i) => (
                      <div
                        key={`checkout-skeleton-${i}`}
                        className="skeleton"
                        style={{ height: '28px', margin: '8px 0', borderRadius: '8px' }}
                      />
                    ))
                  : items.map((item) => {
                      const Icon = KIND_ICON[item.kind] || Package;
                      return (
                        <div key={item.id} style={lineStyle}>
                          <Icon
                            size={13}
                            style={{ color: colors.primary, flexShrink: 0 }}
                          />
                          <span style={lineNameStyle}>
                            {item.name}
                            {item.quantity > 1 ? ` ×${item.quantity}` : ''}
                          </span>
                          <span style={linePriceStyle}>{formatPrice(item.total)}</span>
                        </div>
                      );
                    })}

                <div style={{ marginTop: '10px' }}>
                  <div style={summaryRowStyle}>
                    <span style={summaryLabelStyle}>Subtotal</span>
                    <span style={summaryValueStyle}>{formatPrice(subtotal)}</span>
                  </div>
                  {/* The studio quotes delivery per address after the order lands. */}
                  <div style={summaryRowStyle}>
                    <span style={summaryLabelStyle}>Delivery</span>
                    <span style={summaryValueStyle}>Quoted after order</span>
                  </div>
                  <div
                    style={{
                      borderTop: `1px solid ${isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.12)'}`,
                      marginTop: '6px',
                      paddingTop: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ ...summaryLabelStyle, fontWeight: 700 }}>Pay now</span>
                    <span
                      style={{
                        fontSize: isMobile ? '16px' : '18px',
                        fontWeight: 700,
                        color: colors.primary,
                      }}
                    >
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                </div>

                <button type="submit" style={payButtonStyle} disabled={submitting}>
                  <Lock size={isMobile ? 15 : 16} />
                  {submitting ? 'Starting payment…' : `Pay ${formatPrice(subtotal)}`}
                </button>

                <p style={noteStyle}>
                  <Shield size={11} style={{ verticalAlign: '-1px', marginRight: '4px' }} />
                  You will finish on Paystack's secure page and return here automatically.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
