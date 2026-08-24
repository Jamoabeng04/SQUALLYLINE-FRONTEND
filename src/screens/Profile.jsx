import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Heart,
  ShoppingBag,
  Calendar,
  Package,
  Scissors,
  ChevronRight,
  Sparkles,
  Award,
  Users,
  Edit2,
  Mail,
  Phone,
  MapPin,
  Ruler,
  Lock,
  LogOut,
  Save,
  X,
  Eye,
  EyeOff,
  Camera,
  AlertCircle,
  Cake,
  BadgeCheck,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../providers/AuthProvider';
import { useToast } from '../providers/ToastProvider';
import {
  auth as authApi,
  orders as ordersApi,
  appointments as appointmentsApi,
  shop,
} from '../api/endpoints';
import {
  adaptOrder,
  adaptAppointment,
  adaptStyle,
  adaptPage,
  formatPrice,
  formatDate,
  errorText,
  mediaUrl,
} from '../api/adapters';

// Profile.GENDER_CHOICES on the backend — a single character, and a different
// vocabulary from the product gender in adapters.js (which means Men/Women/Kids).
const GENDER_OPTIONS = [
  { value: '', label: 'Prefer not to say' },
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'O', label: 'Other' },
];

const GENDER_LABEL = { M: 'Male', F: 'Female', O: 'Other' };

const ROLE_LABEL = { admin: 'Studio admin', apprentice: 'Studio team', customer: 'Client' };

// Order.STATUS_CHOICES.
const ORDER_STATUS_COLOR = {
  pending: '#F59E0B',
  confirmed: '#10B981',
  processing: '#3B82F6',
  ready: '#8B5CF6',
  completed: '#10B981',
  cancelled: '#EF4444',
  refunded: '#6B7280',
};

const APPOINTMENT_STATUS_COLOR = {
  pending: '#F59E0B',
  confirmed: '#10B981',
  in_progress: '#3B82F6',
  completed: '#8B5CF6',
  cancelled: '#EF4444',
  no_show: '#6B7280',
};

// Slot dates are plain YYYY-MM-DD strings; splitting them beats new Date(iso),
// which would read them as UTC midnight and could shift the day.
const asLocalDate = (iso) => {
  if (!iso) return null;
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const initialsOf = (name, email) => {
  const source = (name || email || '').trim();
  if (!source) return '?';
  const parts = source.split(/[\s.@_-]+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join('');
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { colors, theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const { user: sessionUser, logout, refreshUser, isCustomer } = useAuth();
  const { showToast } = useToast();

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // ------------------------------------------------------------------ state
  const [account, setAccount] = useState(null);
  const [profile, setProfile] = useState(null);
  const [orderRows, setOrderRows] = useState([]);
  const [appointmentRows, setAppointmentRows] = useState([]);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [savedStyles, setSavedStyles] = useState([]);
  const [savedStyleCount, setSavedStyleCount] = useState(0);
  const [savedProductCount, setSavedProductCount] = useState(0);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [picFile, setPicFile] = useState(null);
  const [picPreview, setPicPreview] = useState('');
  const [saving, setSaving] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ old_password: '', new_password: '', confirm_new_password: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // ------------------------------------------------------------------- load
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    // /auth/me/ is the one call the page cannot do without. The rest only feed
    // counts and preview cards, so a failure there degrades instead of blocking
    // — and my-summary answers 403 for anyone who is not a customer.
    Promise.all([
      authApi.me(),
      ordersApi.mine().catch(() => []),
      appointmentsApi.mine({ per_page: 50 }).catch(() => null),
      shop.savedStyles().catch(() => null),
      shop.savedProducts().catch(() => null),
      isCustomer ? authApi.mySummary().catch(() => null) : Promise.resolve(null),
    ])
      .then(([me, orders, appointmentPayload, stylePayload, productPayload, mySummary]) => {
        if (cancelled) return;

        setAccount(me?.user || null);
        setProfile(me?.profile || null);
        setOrderRows((orders || []).map(adaptOrder));

        const appointmentPage = adaptPage(appointmentPayload || {}, adaptAppointment);
        setAppointmentRows(appointmentPage.results);
        setAppointmentCount(appointmentPage.count || appointmentPage.results.length);

        const stylePage = adaptPage(stylePayload || {}, adaptStyle);
        setSavedStyles(stylePage.results);
        setSavedStyleCount(stylePage.count || stylePage.results.length);

        const productPage = adaptPage(productPayload || {});
        setSavedProductCount(productPage.count || productPage.results.length);

        setSummary(mySummary || null);
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err, 'Could not load your profile.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey, isCustomer]);

  // Object URLs leak until revoked, so tie the preview's life to the chosen file.
  useEffect(() => {
    if (!picFile) {
      setPicPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(picFile);
    setPicPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [picFile]);

  // ---------------------------------------------------------------- derived
  const fullName = account?.full_name || sessionUser?.fullName || account?.username || '';
  const avatarUrl = mediaUrl(profile?.profile_pic);
  const roleLabel = ROLE_LABEL[account?.role] || account?.role || '';

  const upcomingAppointment = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (
      appointmentRows
        .filter((a) => ['pending', 'confirmed'].includes(a.status))
        .filter((a) => {
          const dt = asLocalDate(a.date);
          return dt && dt >= today;
        })
        // my_appointments hands them back newest-created first; the soonest
        // meeting is what matters here.
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0] || null
    );
  }, [appointmentRows]);

  // my_orders orders by -created_at, so the freshest one is already first.
  const latestOrder = orderRows[0] || null;

  const stats = useMemo(() => {
    const rows = [
      { key: 'orders', label: 'Orders', value: orderRows.length, icon: Package, color: '#3B82F6', to: '/orders' },
      { key: 'appointments', label: 'Appointments', value: appointmentCount, icon: Calendar, color: '#8B5CF6', to: '/appointments' },
      { key: 'saved', label: 'Saved', value: savedStyleCount + savedProductCount, icon: Heart, color: '#EF4444', to: '/savedstyles' },
    ];
    // my-summary only exists for customers, so the people tile does too.
    if (summary) {
      rows.push({
        key: 'people',
        label: 'People',
        value: summary.people_count ?? (summary.people || []).length,
        icon: Users,
        color: '#10B981',
        to: '/measure',
      });
    }
    return rows;
  }, [orderRows.length, appointmentCount, savedStyleCount, savedProductCount, summary]);

  // ------------------------------------------------------------------ edit
  const openEdit = useCallback(() => {
    setForm({
      first_name: account?.first_name || '',
      last_name: account?.last_name || '',
      username: account?.username || '',
      email: account?.email || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      date_of_birth: profile?.date_of_birth || '',
      gender: profile?.gender || '',
    });
    setPicFile(null);
    setChangingPassword(false);
    setEditing(true);
  }, [account, profile]);

  const closeEdit = () => {
    setEditing(false);
    setForm(null);
    setPicFile(null);
  };

  const setField = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSave = async () => {
    if (!form) return;

    // first_name/last_name/username/email are CharFields with no allow_blank on
    // UpdateProfileSerializer, so sending '' is a validation error rather than a
    // clear. Omit them instead — and refuse to submit an empty name outright.
    const identity = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
    };
    if (!identity.username) {
      showToast('A username is required.', 'error');
      return;
    }
    if (!identity.email) {
      showToast('An email address is required.', 'error');
      return;
    }

    const payload = {};
    Object.entries(identity).forEach(([key, value]) => {
      if (value) payload[key] = value;
    });
    // phone, address and gender all accept a blank string, so these can be cleared.
    payload.phone = form.phone.trim();
    payload.address = form.address.trim();
    payload.gender = form.gender;

    setSaving(true);
    try {
      let body;
      if (picFile) {
        // An image has to go up as multipart; the client picks that path off the
        // FormData instance itself.
        body = new FormData();
        Object.entries(payload).forEach(([key, value]) => body.append(key, value));
        // FormData cannot carry null, so an empty date is left out entirely.
        if (form.date_of_birth) body.append('date_of_birth', form.date_of_birth);
        body.append('profile_pic', picFile);
      } else {
        // DateField rejects '' but takes null, which is how a birthday is cleared.
        body = { ...payload, date_of_birth: form.date_of_birth || null };
      }

      await authApi.updateProfile(body);
      showToast('Profile updated.', 'success');
      closeEdit();
      // Keep the header, cached session and this page in step.
      await refreshUser().catch(() => null);
      setReloadKey((key) => key + 1);
    } catch (err) {
      showToast(errorText(err, 'Could not save your profile.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------- password
  const handleChangePassword = async () => {
    if (!passwords.old_password || !passwords.new_password) {
      showToast('Enter your current and new password.', 'error');
      return;
    }
    if (passwords.new_password !== passwords.confirm_new_password) {
      showToast('The new passwords do not match.', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword(passwords);
      showToast('Password changed.', 'success');
      setPasswords({ old_password: '', new_password: '', confirm_new_password: '' });
      setChangingPassword(false);
    } catch (err) {
      showToast(errorText(err, 'Could not change your password.'), 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // ---------------------------------------------------------------- styles
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

  const headerStyle = { marginBottom: isMobile ? '20px' : '24px' };

  const headerTopStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  };

  const titleStyle = {
    fontSize: isMobile ? '20px' : '24px',
    fontWeight: 800,
    color: colors.heading,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const cardStyle = {
    padding: isMobile ? '20px' : '24px',
    borderRadius: '16px',
    background: isDark ? 'rgba(20,20,20,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.06)' : 'rgba(168, 137, 79,0.08)'}`,
    marginBottom: '20px',
  };

  const softCardStyle = {
    padding: isMobile ? '14px' : '16px',
    borderRadius: '12px',
    background: isDark ? 'rgba(20,20,20,0.40)' : 'rgba(255,255,255,0.40)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.04)' : 'rgba(168, 137, 79,0.06)'}`,
  };

  const userTopStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '14px' : '20px',
    marginBottom: isMobile ? '14px' : '16px',
    flexWrap: 'wrap',
  };

  const avatarStyle = {
    width: isMobile ? '56px' : '72px',
    height: isMobile ? '56px' : '72px',
    borderRadius: '50%',
    background: `${colors.primary}1F`,
    border: `2px solid ${colors.primary}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.primary,
    fontSize: isMobile ? '18px' : '22px',
    fontWeight: 700,
    overflow: 'hidden',
    flexShrink: 0,
  };

  const userNameStyle = {
    fontSize: isMobile ? '18px' : '22px',
    fontWeight: 700,
    color: colors.heading,
    margin: 0,
  };

  const userEmailStyle = {
    fontSize: isMobile ? '12px' : '14px',
    color: colors.secondaryText,
    marginTop: '2px',
  };

  const rolePillStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '6px',
    padding: '3px 10px',
    borderRadius: '8px',
    fontSize: '10px',
    fontWeight: 600,
    background: `${colors.primary}20`,
    color: colors.primary,
    border: `1px solid ${colors.primary}30`,
  };

  const userMetaStyle = {
    display: 'flex',
    gap: isMobile ? '12px' : '18px',
    flexWrap: 'wrap',
    marginTop: isMobile ? '8px' : '10px',
  };

  const userMetaItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: isMobile ? '11px' : '13px',
    color: colors.secondaryText,
  };

  const ghostButtonStyle = {
    padding: '8px 14px',
    borderRadius: '10px',
    background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.80)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)'}`,
    cursor: 'pointer',
    color: colors.text,
    fontSize: '12px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
  };

  const primaryButtonStyle = {
    padding: '10px 18px',
    borderRadius: '10px',
    background: colors.primary,
    border: 'none',
    cursor: 'pointer',
    color: isDark ? '#0A0A0A' : '#FFFFFF',
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : `repeat(${stats.length}, 1fr)`,
    gap: isMobile ? '10px' : '12px',
    marginBottom: '20px',
  };

  const statCardStyle = { ...softCardStyle, textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease' };

  const statIconStyle = (color) => ({
    display: 'inline-flex',
    padding: '6px',
    borderRadius: '8px',
    background: isDark ? `${color}20` : `${color}10`,
    color,
    marginBottom: '6px',
  });

  const statValueStyle = { fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: colors.heading };
  const statLabelStyle = { fontSize: isMobile ? '10px' : '12px', color: colors.secondaryText, marginTop: '2px' };

  const sectionStyle = { marginBottom: '20px' };

  const sectionHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  };

  const sectionTitleStyle = {
    fontSize: isMobile ? '15px' : '18px',
    fontWeight: 600,
    color: colors.heading,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const sectionLinkStyle = {
    fontSize: isMobile ? '11px' : '13px',
    color: colors.primary,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
  };

  const grid2Style = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: '16px',
    alignItems: 'start',
  };

  const rowCardStyle = { ...softCardStyle, cursor: 'pointer', transition: 'all 0.3s ease' };

  const badgeStyle = (color) => ({
    padding: '3px 10px',
    borderRadius: '8px',
    fontSize: '10px',
    fontWeight: 600,
    background: `${color}20`,
    color,
    border: `1px solid ${color}30`,
    whiteSpace: 'nowrap',
  });

  const rowTopStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '8px',
  };

  const rowTitleStyle = { fontSize: isMobile ? '13px' : '14px', fontWeight: 600, color: colors.text };

  const detailsRowStyle = { display: 'flex', gap: isMobile ? '12px' : '16px', flexWrap: 'wrap' };

  const detailStyle = { fontSize: isMobile ? '11px' : '12px', color: colors.secondaryText };

  const emptyBoxStyle = {
    ...softCardStyle,
    textAlign: 'center',
    padding: isMobile ? '20px 14px' : '26px 16px',
  };

  const emptyTextStyle = { fontSize: isMobile ? '12px' : '13px', color: colors.secondaryText, marginTop: '8px' };

  const styleItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
    borderBottom: `1px solid ${isDark ? 'rgba(168, 137, 79,0.04)' : 'rgba(168, 137, 79,0.06)'}`,
    cursor: 'pointer',
  };

  const styleImageStyle = { width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 };

  const actionsGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' };

  const actionCardStyle = { ...softCardStyle, textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease' };

  const fieldGridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: '12px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: colors.secondaryText,
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 13px',
    borderRadius: '10px',
    background: isDark ? 'rgba(10,10,10,0.60)' : 'rgba(255,255,255,0.80)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)'}`,
    color: colors.text,
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const lift = (event, on) => {
    event.currentTarget.style.transform = on ? 'translateY(-2px)' : 'translateY(0)';
    event.currentTarget.style.boxShadow = on
      ? isDark
        ? '0 4px 16px rgba(0,0,0,0.20)'
        : '0 4px 16px rgba(0,0,0,0.04)'
      : 'none';
  };

  // --------------------------------------------------------------- loading
  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div className="skeleton" style={{ height: '32px', width: '160px', borderRadius: '10px', marginBottom: '20px' }} />
          <div className="skeleton" style={{ height: isMobile ? '150px' : '170px', borderRadius: '16px', marginBottom: '20px' }} />
          <div style={statsGridStyle}>
            {[0, 1, 2, 3].map((n) => (
              <div key={n} className="skeleton" style={{ height: '92px', borderRadius: '12px' }} />
            ))}
          </div>
          <div style={grid2Style}>
            <div className="skeleton" style={{ height: '160px', borderRadius: '12px' }} />
            <div className="skeleton" style={{ height: '160px', borderRadius: '12px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div style={{ ...cardStyle, textAlign: 'center', padding: isMobile ? '32px 20px' : '48px 24px' }}>
            <AlertCircle size={40} color="#EF4444" />
            <div style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: 600, color: colors.heading, marginTop: '14px' }}>
              We could not load your profile
            </div>
            <div style={emptyTextStyle}>{error}</div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '18px', flexWrap: 'wrap' }}>
              <button style={primaryButtonStyle} onClick={() => setReloadKey((key) => key + 1)}>
                Try again
              </button>
              <button style={ghostButtonStyle} onClick={() => navigate('/')}>
                Back home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={headerTopStyle}>
            <h1 style={titleStyle}>
              <User size={isMobile ? 22 : 28} style={{ color: colors.primary }} />
              Profile
            </h1>
            <button
              style={ghostButtonStyle}
              onClick={handleLogout}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#EF4444';
                e.currentTarget.style.color = '#EF4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)';
                e.currentTarget.style.color = colors.text;
              }}
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>

        {/* Identity */}
        <div style={cardStyle}>
          <div style={userTopStyle}>
            <div style={avatarStyle}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initialsOf(fullName, account?.email)
              )}
            </div>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={userNameStyle}>{fullName || 'Your account'}</div>
              <div style={userEmailStyle}>{account?.email}</div>
              {roleLabel && (
                <span style={rolePillStyle}>
                  <BadgeCheck size={11} />
                  {roleLabel}
                </span>
              )}
            </div>
            {account?.date_joined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={16} color={colors.primary} />
                <span style={{ fontSize: '11px', color: colors.secondaryText }}>
                  Member since {formatDate(account.date_joined)}
                </span>
              </div>
            )}
          </div>

          <div style={userMetaStyle}>
            <span style={userMetaItemStyle}>
              <Mail size={14} />
              {account?.email || '—'}
            </span>
            <span style={userMetaItemStyle}>
              <Phone size={14} />
              {profile?.phone || 'No phone yet'}
            </span>
            <span style={userMetaItemStyle}>
              <MapPin size={14} />
              {profile?.address || 'No address yet'}
            </span>
            {profile?.date_of_birth && (
              <span style={userMetaItemStyle}>
                <Cake size={14} />
                {formatDate(profile.date_of_birth)}
              </span>
            )}
            {profile?.gender && (
              <span style={userMetaItemStyle}>
                <User size={14} />
                {GENDER_LABEL[profile.gender] || profile.gender}
              </span>
            )}
          </div>

          {!editing && !changingPassword && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
              <button style={ghostButtonStyle} onClick={openEdit}>
                <Edit2 size={14} />
                Edit details
              </button>
              <button style={ghostButtonStyle} onClick={() => setChangingPassword(true)}>
                <Lock size={14} />
                Change password
              </button>
            </div>
          )}

          {/* Edit form */}
          {editing && form && (
            <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: `1px solid ${isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.12)'}` }}>
              <div style={fieldGridStyle}>
                <div>
                  <label style={labelStyle}>First name</label>
                  <input style={inputStyle} value={form.first_name} onChange={setField('first_name')} placeholder="Kwabena" />
                </div>
                <div>
                  <label style={labelStyle}>Last name</label>
                  <input style={inputStyle} value={form.last_name} onChange={setField('last_name')} placeholder="Mensah" />
                </div>
                <div>
                  <label style={labelStyle}>Username</label>
                  <input style={inputStyle} value={form.username} onChange={setField('username')} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input style={inputStyle} type="email" value={form.email} onChange={setField('email')} />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input style={inputStyle} value={form.phone} onChange={setField('phone')} placeholder="+233 20 123 4567" />
                </div>
                <div>
                  <label style={labelStyle}>Date of birth</label>
                  <input style={inputStyle} type="date" value={form.date_of_birth || ''} onChange={setField('date_of_birth')} />
                </div>
                <div>
                  <label style={labelStyle}>Gender</label>
                  <select style={inputStyle} value={form.gender} onChange={setField('gender')}>
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option.value || 'blank'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Profile picture</label>
                  <label
                    style={{ ...ghostButtonStyle, justifyContent: 'center', padding: '10px 14px' }}
                    htmlFor="profile-pic-input"
                  >
                    <Camera size={14} />
                    {picFile ? picFile.name.slice(0, 22) : 'Choose an image'}
                  </label>
                  <input
                    id="profile-pic-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => setPicFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={labelStyle}>Address</label>
                <textarea
                  style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
                  value={form.address}
                  onChange={setField('address')}
                  placeholder="Street, area, city"
                />
              </div>

              {picPreview && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                  <img
                    src={picPreview}
                    alt="Chosen avatar preview"
                    style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${colors.primary}` }}
                  />
                  <span style={detailStyle}>This replaces your current picture when you save.</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
                <button style={{ ...primaryButtonStyle, opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>
                  <Save size={14} />
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button style={ghostButtonStyle} onClick={closeEdit} disabled={saving}>
                  <X size={14} />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Change password */}
          {changingPassword && (
            <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: `1px solid ${isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.12)'}` }}>
              <div style={fieldGridStyle}>
                <div>
                  <label style={labelStyle}>Current password</label>
                  <input
                    style={inputStyle}
                    type={showPasswords ? 'text' : 'password'}
                    value={passwords.old_password}
                    onChange={(e) => setPasswords((prev) => ({ ...prev, old_password: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={labelStyle}>New password</label>
                  <input
                    style={inputStyle}
                    type={showPasswords ? 'text' : 'password'}
                    value={passwords.new_password}
                    onChange={(e) => setPasswords((prev) => ({ ...prev, new_password: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Confirm new password</label>
                  <input
                    style={inputStyle}
                    type={showPasswords ? 'text' : 'password'}
                    value={passwords.confirm_new_password}
                    onChange={(e) => setPasswords((prev) => ({ ...prev, confirm_new_password: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ ...detailStyle, marginTop: '10px' }}>
                At least 8 characters, with an uppercase letter, a lowercase letter, a number and a symbol.
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
                <button
                  style={{ ...primaryButtonStyle, opacity: savingPassword ? 0.6 : 1 }}
                  onClick={handleChangePassword}
                  disabled={savingPassword}
                >
                  <Lock size={14} />
                  {savingPassword ? 'Saving…' : 'Update password'}
                </button>
                <button style={ghostButtonStyle} onClick={() => setShowPasswords((v) => !v)}>
                  {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showPasswords ? 'Hide' : 'Show'}
                </button>
                <button
                  style={ghostButtonStyle}
                  onClick={() => {
                    setChangingPassword(false);
                    setPasswords({ old_password: '', new_password: '', confirm_new_password: '' });
                  }}
                  disabled={savingPassword}
                >
                  <X size={14} />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={statsGridStyle}>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.key}
                style={statCardStyle}
                onClick={() => navigate(stat.to)}
                onMouseEnter={(e) => lift(e, true)}
                onMouseLeave={(e) => lift(e, false)}
              >
                <div style={statIconStyle(stat.color)}>
                  <Icon size={isMobile ? 16 : 20} />
                </div>
                <div style={statValueStyle}>{stat.value}</div>
                <div style={statLabelStyle}>{stat.label}</div>
              </div>
            );
          })}
        </div>

        <div style={grid2Style}>
          {/* Next appointment + latest order */}
          <div>
            <div style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <span style={sectionTitleStyle}>
                  <Calendar size={isMobile ? 16 : 18} style={{ color: colors.primary }} />
                  Next appointment
                </span>
                <button style={sectionLinkStyle} onClick={() => navigate('/appointments')}>
                  View all <ChevronRight size={14} />
                </button>
              </div>
              {upcomingAppointment ? (
                <div
                  style={rowCardStyle}
                  onClick={() => navigate(`/appointments/${upcomingAppointment.id}`)}
                  onMouseEnter={(e) => lift(e, true)}
                  onMouseLeave={(e) => lift(e, false)}
                >
                  <div style={rowTopStyle}>
                    <span style={rowTitleStyle}>
                      {upcomingAppointment.styleName || upcomingAppointment.typeLabel}
                    </span>
                    <span style={badgeStyle(APPOINTMENT_STATUS_COLOR[upcomingAppointment.status] || colors.primary)}>
                      {upcomingAppointment.statusLabel}
                    </span>
                  </div>
                  <div style={detailsRowStyle}>
                    <span style={detailStyle}>
                      {formatDate(upcomingAppointment.date)}
                      {upcomingAppointment.time ? ` · ${upcomingAppointment.time}` : ''}
                    </span>
                    {upcomingAppointment.tierName && <span style={detailStyle}>{upcomingAppointment.tierName}</span>}
                    {upcomingAppointment.personName && <span style={detailStyle}>For {upcomingAppointment.personName}</span>}
                    <span style={detailStyle}>
                      {upcomingAppointment.isPaid
                        ? 'Paid'
                        : `Due ${formatPrice(upcomingAppointment.finalPrice ?? upcomingAppointment.tierFee)}`}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={emptyBoxStyle}>
                  <Calendar size={26} color={colors.secondaryText} />
                  <div style={emptyTextStyle}>Nothing on the calendar yet.</div>
                  <button style={{ ...primaryButtonStyle, margin: '14px auto 0' }} onClick={() => navigate('/appointments/book')}>
                    Book an appointment
                  </button>
                </div>
              )}
            </div>

            <div style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <span style={sectionTitleStyle}>
                  <Package size={isMobile ? 16 : 18} style={{ color: colors.primary }} />
                  Latest order
                </span>
                <button style={sectionLinkStyle} onClick={() => navigate('/orders')}>
                  View all <ChevronRight size={14} />
                </button>
              </div>
              {latestOrder ? (
                <div
                  style={rowCardStyle}
                  onClick={() => navigate(`/orders/${latestOrder.id}`)}
                  onMouseEnter={(e) => lift(e, true)}
                  onMouseLeave={(e) => lift(e, false)}
                >
                  <div style={rowTopStyle}>
                    <span style={rowTitleStyle}>{latestOrder.number}</span>
                    <span style={badgeStyle(ORDER_STATUS_COLOR[latestOrder.status] || colors.primary)}>
                      {latestOrder.statusLabel}
                    </span>
                  </div>
                  <div style={detailsRowStyle}>
                    <span style={detailStyle}>
                      {latestOrder.itemCount} {latestOrder.itemCount === 1 ? 'item' : 'items'}
                    </span>
                    <span style={detailStyle}>{formatPrice(latestOrder.total)}</span>
                    <span style={detailStyle}>{latestOrder.paymentStatusLabel}</span>
                    {latestOrder.orderedAt && <span style={detailStyle}>{formatDate(latestOrder.orderedAt)}</span>}
                  </div>
                </div>
              ) : (
                <div style={emptyBoxStyle}>
                  <Package size={26} color={colors.secondaryText} />
                  <div style={emptyTextStyle}>No orders yet.</div>
                  <button style={{ ...primaryButtonStyle, margin: '14px auto 0' }} onClick={() => navigate('/products')}>
                    Start shopping
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Saved styles */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span style={sectionTitleStyle}>
                <Heart size={isMobile ? 16 : 18} style={{ color: colors.primary }} />
                Saved styles
              </span>
              <button style={sectionLinkStyle} onClick={() => navigate('/savedstyles')}>
                View all <ChevronRight size={14} />
              </button>
            </div>
            {savedStyles.length ? (
              <div style={softCardStyle}>
                {savedStyles.slice(0, 4).map((style) => (
                  <div
                    key={style.id}
                    style={styleItemStyle}
                    onClick={() => navigate(`/styles/order/${style.slug || style.id}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isDark ? 'rgba(168, 137, 79,0.04)' : 'rgba(168, 137, 79,0.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <img src={style.image} alt={style.name} style={styleImageStyle} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 500, color: colors.text }}>
                        {style.name}
                      </div>
                      <div style={{ fontSize: '10px', color: colors.secondaryText, marginTop: '2px' }}>
                        {formatPrice(style.price)}
                        {style.category ? ` · ${style.category}` : ''}
                      </div>
                    </div>
                    <ChevronRight size={16} color={colors.secondaryText} />
                  </div>
                ))}
                {savedStyleCount > 4 && (
                  <button style={{ ...sectionLinkStyle, marginTop: '10px' }} onClick={() => navigate('/savedstyles')}>
                    {savedStyleCount - 4} more saved <ChevronRight size={14} />
                  </button>
                )}
              </div>
            ) : (
              <div style={emptyBoxStyle}>
                <Heart size={26} color={colors.secondaryText} />
                <div style={emptyTextStyle}>Nothing saved yet. Tap the heart on a style to keep it here.</div>
                <button style={{ ...primaryButtonStyle, margin: '14px auto 0' }} onClick={() => navigate('/gallery')}>
                  Browse the gallery
                </button>
              </div>
            )}
          </div>
        </div>

        {/* People and measurements — customers only, since my-summary is too */}
        {summary && (
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span style={sectionTitleStyle}>
                <Ruler size={isMobile ? 16 : 18} style={{ color: colors.primary }} />
                People and measurements
              </span>
              <button style={sectionLinkStyle} onClick={() => navigate('/measure')}>
                Manage <ChevronRight size={14} />
              </button>
            </div>
            {(summary.people || []).length ? (
              <div style={softCardStyle}>
                {summary.people.map((person) => (
                  <div key={person.id} style={{ ...styleItemStyle, cursor: 'default' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: `${colors.primary}18`,
                        color: colors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {initialsOf(person.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 500, color: colors.text }}>
                        {person.name}
                      </div>
                      <div style={{ fontSize: '10px', color: colors.secondaryText, marginTop: '2px', textTransform: 'capitalize' }}>
                        {person.relationship}
                        {' · '}
                        {person.measurement_count}{' '}
                        {person.measurement_count === 1 ? 'measurement' : 'measurements'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={emptyBoxStyle}>
                <Ruler size={26} color={colors.secondaryText} />
                <div style={emptyTextStyle}>
                  Add the people you order for and save their measurements once — the studio reuses them on every order.
                </div>
                <button style={{ ...primaryButtonStyle, margin: '14px auto 0' }} onClick={() => navigate('/measure')}>
                  Add measurements
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick actions */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span style={sectionTitleStyle}>
              <Sparkles size={isMobile ? 16 : 18} style={{ color: colors.primary }} />
              Quick actions
            </span>
          </div>
          <div style={actionsGridStyle}>
            {[
              { label: 'View cart', icon: ShoppingBag, to: '/cart' },
              { label: 'Explore styles', icon: Scissors, to: '/gallery' },
              { label: 'Book appointment', icon: Calendar, to: '/appointments/book' },
              { label: 'My measurements', icon: Ruler, to: '/measure' },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.to}
                  style={actionCardStyle}
                  onClick={() => navigate(action.to)}
                  onMouseEnter={(e) => lift(e, true)}
                  onMouseLeave={(e) => lift(e, false)}
                >
                  <Icon size={isMobile ? 20 : 24} style={{ color: colors.primary, marginBottom: '6px' }} />
                  <div style={{ fontSize: isMobile ? '11px' : '12px', color: colors.text, fontWeight: 500 }}>
                    {action.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
