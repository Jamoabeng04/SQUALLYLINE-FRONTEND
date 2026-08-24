import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Package, RefreshCw } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useCart } from '../providers/CartProvider';
import { payments } from '../api/endpoints';
import { formatMoney, errorText } from '../api/adapters';

// Paystack sends the customer back here after the hosted checkout page, with
// ?reference= (and ?trxref= as an alias). Verification is server-side; this
// screen only reports the verdict and routes onward.
const PaymentCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { colors, theme } = useTheme();
  const { refresh } = useCart();
  const isDark = theme.mode === 'dark';

  const reference = searchParams.get('reference') || searchParams.get('trxref') || '';

  const [state, setState] = useState(reference ? 'verifying' : 'missing');
  const [message, setMessage] = useState('');
  const [transaction, setTransaction] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!reference) return undefined;
    let cancelled = false;

    setState('verifying');
    payments
      .verify(reference)
      .then((data) => {
        if (cancelled) return;
        setTransaction(data?.transaction || null);
        setState('success');
        setMessage(data?.message || 'Payment received.');
        // The order emptied the cart server-side; sync the badge.
        refresh();
      })
      .catch((err) => {
        if (cancelled) return;
        setTransaction(err?.data?.transaction || null);
        setState('failed');
        setMessage(errorText(err, 'We could not confirm that payment.'));
      });

    return () => {
      cancelled = true;
    };
  }, [reference, attempt, refresh]);

  const orderId = transaction?.order || transaction?.order_id || null;
  const amount = transaction?.amount;

  // Styles
  const pageStyle = {
    backgroundColor: colors.mainBg,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  };

  const cardStyle = {
    maxWidth: '440px',
    width: '100%',
    padding: '32px 24px',
    borderRadius: '18px',
    textAlign: 'center',
    background: isDark ? 'rgba(20,20,20,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.12)'}`,
  };

  const titleStyle = {
    fontSize: '20px',
    fontWeight: 800,
    color: colors.heading,
    margin: '14px 0 6px',
  };

  const bodyStyle = {
    fontSize: '13px',
    color: colors.secondaryText,
    margin: '0 0 6px',
    lineHeight: 1.6,
  };

  const refStyle = {
    fontSize: '11px',
    color: colors.secondaryText,
    fontFamily: 'monospace',
    marginTop: '10px',
    wordBreak: 'break-all',
  };

  const buttonRowStyle = {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: '20px',
  };

  const primaryButtonStyle = {
    padding: '10px 20px',
    borderRadius: '10px',
    background: colors.primary,
    color: '#1A1A1A',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const ghostButtonStyle = {
    padding: '10px 20px',
    borderRadius: '10px',
    background: 'transparent',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.15)' : 'rgba(168, 137, 79,0.20)'}`,
    cursor: 'pointer',
    color: colors.text,
    fontSize: '13px',
    fontWeight: 500,
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const content = {
    missing: {
      icon: <XCircle size={44} color="#EF4444" />,
      title: 'No payment to confirm',
      body: 'This page opens automatically after a payment. There is no reference in the link.',
    },
    verifying: {
      icon: (
        <Loader
          size={44}
          style={{ color: colors.primary, animation: 'spin 1s linear infinite' }}
        />
      ),
      title: 'Confirming your payment',
      body: 'Hold on — we are checking with Paystack. Do not close this page.',
    },
    success: {
      icon: <CheckCircle size={44} color="#10B981" />,
      title: 'Payment confirmed',
      body: message,
    },
    failed: {
      icon: <XCircle size={44} color="#EF4444" />,
      title: 'Payment not confirmed',
      body: message,
    },
  }[state];

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {content.icon}
        <h1 style={titleStyle}>{content.title}</h1>
        <p style={bodyStyle}>{content.body}</p>

        {state === 'success' && amount != null && (
          <p style={{ ...bodyStyle, color: colors.primary, fontWeight: 700, fontSize: '15px' }}>
            {formatMoney(amount)}
          </p>
        )}

        {state === 'failed' && (
          <p style={bodyStyle}>
            If money left your account, keep this reference and contact us — nothing is lost.
          </p>
        )}

        {reference && <div style={refStyle}>Ref: {reference}</div>}

        <div style={buttonRowStyle}>
          {state === 'failed' && (
            <button style={primaryButtonStyle} onClick={() => setAttempt((n) => n + 1)}>
              <RefreshCw size={14} />
              Check again
            </button>
          )}
          {state !== 'verifying' && (
            <>
              <button
                style={state === 'failed' ? ghostButtonStyle : primaryButtonStyle}
                onClick={() => navigate(orderId ? `/orders/${orderId}` : '/orders')}
              >
                <Package size={14} />
                {orderId ? 'View order' : 'My orders'}
              </button>
              <button style={ghostButtonStyle} onClick={() => navigate('/')}>
                Keep shopping
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCallbackPage;
