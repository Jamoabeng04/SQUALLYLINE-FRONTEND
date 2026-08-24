import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

// Shared chrome for the sign-in / sign-up screens: split layout with an
// editorial gold panel on the left and the form on the right.
export const AuthShell = ({ eyebrow, title, subtitle, children, footer }) => {
  const { colors } = useTheme();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: colors.mainBg,
        color: colors.text,
      }}
    >
      {/* Brand panel — hidden on narrow screens via CSS below */}
      <div className="auth-brand-panel">
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: colors.navBg,
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: colors.goldGlow }} />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '64px 56px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                color: colors.primary,
                marginBottom: 18,
              }}
            >
              Squally Line
            </div>
            <div
              style={{
                width: 48,
                height: 1,
                background: colors.primary,
                opacity: 0.6,
              }}
            />
          </div>

          <div>
            <h2
              style={{
                fontSize: 'clamp(28px, 3vw, 42px)',
                lineHeight: 1.18,
                fontWeight: 300,
                color: '#F8F6F1',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              Tailoring made
              <br />
              <span style={{ color: colors.primary, fontWeight: 400 }}>personal.</span>
            </h2>
            <p
              style={{
                marginTop: 20,
                maxWidth: 340,
                fontSize: 15,
                lineHeight: 1.7,
                color: 'rgba(232, 224, 214, 0.72)',
              }}
            >
              Bespoke pieces cut to your measurements, ready-to-wear collections, and
              fittings booked in a few taps.
            </p>
          </div>

          <div
            style={{
              fontSize: 12,
              color: 'rgba(232, 224, 214, 0.45)',
              letterSpacing: '0.08em',
            }}
          >
            ACCRA · GHANA
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          {eyebrow && (
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: colors.primary,
                marginBottom: 14,
              }}
            >
              {eyebrow}
            </div>
          )}
          <h1
            style={{
              fontSize: 'clamp(26px, 4vw, 34px)',
              fontWeight: 300,
              letterSpacing: '-0.02em',
              color: colors.heading,
              margin: 0,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p style={{ marginTop: 10, marginBottom: 0, color: colors.secondaryText, fontSize: 14.5 }}>
              {subtitle}
            </p>
          )}

          <div style={{ marginTop: 30 }}>{children}</div>

          {footer && (
            <div
              style={{
                marginTop: 26,
                paddingTop: 20,
                borderTop: `1px solid ${colors.border}`,
                fontSize: 14,
                color: colors.secondaryText,
                textAlign: 'center',
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export const AuthField = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
  required,
  hint,
  children,
}) => {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && reveal ? 'text' : type;

  const inputStyle = {
    width: '100%',
    padding: '13px 15px',
    paddingRight: isPassword ? 44 : 15,
    borderRadius: 10,
    border: `1px solid ${error ? colors.error : focused ? colors.borderFocus : colors.border}`,
    background: colors.surfaceL1,
    color: colors.text,
    fontSize: 15,
    outline: 'none',
    boxShadow: focused ? colors.focusRing : 'none',
    transition: 'border-color 160ms ease, box-shadow 160ms ease',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  return (
    <label style={{ display: 'block', marginBottom: 16 }}>
      <span
        style={{
          display: 'block',
          fontSize: 12.5,
          fontWeight: 500,
          letterSpacing: '0.04em',
          color: colors.secondaryText,
          marginBottom: 7,
        }}
      >
        {label}
        {required && <span style={{ color: colors.primary, marginLeft: 3 }}>*</span>}
      </span>

      <div style={{ position: 'relative' }}>
        {children ? (
          React.cloneElement(children, {
            style: { ...inputStyle, ...(children.props.style || {}) },
            onFocus: () => setFocused(true),
            onBlur: () => setFocused(false),
          })
        ) : (
          <input
            type={inputType}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            autoComplete={autoComplete}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={inputStyle}
          />
        )}

        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: colors.mutedText,
              padding: 6,
              display: 'flex',
            }}
          >
            {reveal ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>

      {error && (
        <span style={{ display: 'block', marginTop: 6, fontSize: 12.5, color: colors.error }}>{error}</span>
      )}
      {!error && hint && (
        <span style={{ display: 'block', marginTop: 6, fontSize: 12.5, color: colors.mutedText }}>{hint}</span>
      )}
    </label>
  );
};

export const AuthSubmit = ({ loading, children, disabled }) => {
  const { colors } = useTheme();
  const [hover, setHover] = useState(false);

  return (
    <button
      type="submit"
      disabled={loading || disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%',
        padding: '14px 20px',
        marginTop: 8,
        borderRadius: 10,
        border: `1px solid ${colors.wateryBtnBorder}`,
        background: loading || disabled ? colors.waterySoftBg : colors.wateryBtnBg,
        color: loading || disabled ? colors.mutedText : colors.btnText,
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: '0.02em',
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
        boxShadow: loading || disabled ? 'none' : hover ? colors.shadowGold : colors.wateryBtnShine,
        transform: hover && !loading && !disabled ? 'translateY(-1px)' : 'none',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
        fontFamily: 'inherit',
      }}
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
};

export const AuthAlert = ({ message }) => {
  const { colors } = useTheme();
  if (!message) return null;

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        padding: '12px 14px',
        marginBottom: 18,
        borderRadius: 10,
        background: colors.errorBg,
        border: `1px solid ${colors.error}33`,
        color: colors.errorText,
        fontSize: 13.5,
        lineHeight: 1.55,
        whiteSpace: 'pre-line',
      }}
    >
      <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{message}</span>
    </div>
  );
};

export const AuthLink = ({ to, children }) => {
  const { colors } = useTheme();
  return (
    <Link to={to} style={{ color: colors.primary, fontWeight: 500, textDecoration: 'none' }}>
      {children}
    </Link>
  );
};
