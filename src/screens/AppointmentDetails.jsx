import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  FileText,
  Edit,
  Save,
  X,
  Ruler,
  Scissors,
  CreditCard,
  Zap,
  ChevronDown,
  ChevronUp,
  Layers,
  Printer,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../providers/ToastProvider';
import { appointments as appointmentsApi, payments } from '../api/endpoints';
import { mediaUrl } from '../api/config';
import {
  adaptAppointmentDetail,
  formatPrice,
  formatDate,
  formatDateTime,
  errorText,
  APPOINTMENT_STATUS_LABEL,
  APPOINTMENT_TYPE_LABEL,
} from '../api/adapters';

const STATUS_COLOR = {
  pending: '#F59E0B',
  confirmed: '#10B981',
  in_progress: '#3B82F6',
  completed: '#8B5CF6',
  cancelled: '#EF4444',
  no_show: '#6B7280',
};

const STATUS_ICON = {
  pending: Clock,
  confirmed: CheckCircle,
  in_progress: RefreshCw,
  completed: CheckCircle,
  cancelled: XCircle,
  no_show: AlertCircle,
};

const TIER_COLOR = { Express: '#EF4444', Urgent: '#F59E0B', Normal: '#10B981' };

// Appointment.FABRIC_PROVIDER_CHOICES.
const FABRIC_PROVIDER_LABEL = { user: 'I provide the fabric', tailor: 'Studio provides the fabric' };

const TYPE_OPTIONS = Object.entries(APPOINTMENT_TYPE_LABEL).map(([value, label]) => ({ value, label }));

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'proposal', label: 'Agreement' },
  { id: 'details', label: 'Details' },
  { id: 'timeline', label: 'Timeline' },
];

const AppointmentDetailsPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { colors, theme } = useTheme();
  const { showToast } = useToast();
  const isDark = theme.mode === 'dark';

  const [appointment, setAppointment] = useState(null);
  const [history, setHistory] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [busy, setBusy] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [expanded, setExpanded] = useState({ booking: true, measurements: true, notes: true });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    appointmentsApi
      .detail(appointmentId)
      .then((row) => {
        if (cancelled) return;
        setAppointment(adaptAppointmentDetail(row));
        // History lives on its own endpoint; a booking with no recorded
        // changes yet is normal, so a failure here must not blank the page.
        return appointmentsApi.history(appointmentId).catch(() => []);
      })
      .then((rows) => {
        if (!cancelled && rows) setHistory(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err, 'We could not load that appointment.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [appointmentId, reloadKey]);

  useEffect(() => {
    appointmentsApi.proposals(appointmentId).then(setProposals).catch(() => setProposals([]));
  }, [appointmentId, reloadKey]);

  const handleProposalAction = async (proposal, action) => {
    setBusy(`proposal-${proposal.id}`);
    try {
      let response;
      if (action === 'accept') response = await appointmentsApi.acceptProposal(proposal.id);
      if (action === 'revision') {
        const reason = window.prompt('What should the studio change?');
        if (!reason) return;
        response = await appointmentsApi.requestRevision(proposal.id, reason);
      }
      if (action === 'reject') {
        const reason = window.prompt('Why are you declining this proposal?');
        if (!reason) return;
        response = await appointmentsApi.rejectProposal(proposal.id, reason);
      }
      showToast(action === 'accept' ? 'Agreement accepted and order created.' : 'Your response was sent.', 'success');
      if (response?.order_id) navigate(`/orders/${response.order_id}`); else setReloadKey((value) => value + 1);
    } catch (err) { showToast(errorText(err, 'Could not update this agreement.'), 'error'); }
    finally { setBusy(''); }
  };

  // History arrives newest-first; a timeline reads better the other way round.
  const timeline = useMemo(() => [...history].reverse(), [history]);

  // Measurement blobs are free-form JSON, so render only the flat scalars.
  const measurements = useMemo(() => {
    const data = appointment?.measurement?.data;
    if (!data || typeof data !== 'object') return [];
    return Object.entries(data).filter(
      ([, value]) => value !== null && value !== '' && typeof value !== 'object'
    );
  }, [appointment]);

  const startEditing = () => {
    setForm({
      appointment_type: appointment.type || 'consultation',
      fabric_provider: appointment.fabricProvider || 'user',
      fabric_type: appointment.fabricType || '',
      quantity: appointment.quantity || 1,
      contact_phone: appointment.contactPhone || '',
      contact_email: appointment.contactEmail || '',
      additional_notes: appointment.notes || '',
    });
    setIsEditing(true);
    setActiveTab('details');
  };

  const handleSave = async () => {
    setBusy('save');
    try {
      // Only the fields a customer owns. final_price, estimated_completion_date
      // and admin_notes are the studio's to set, even though the update
      // serializer would accept them.
      await appointmentsApi.update(appointmentId, {
        ...form,
        quantity: Number(form.quantity) || 1,
      });
      showToast('Appointment updated.', 'success');
      setIsEditing(false);
      setReloadKey((k) => k + 1);
    } catch (err) {
      showToast(errorText(err, 'Could not save those changes.'), 'error');
    } finally {
      setBusy('');
    }
  };

  const handlePay = async () => {
    setBusy('pay');
    try {
      const payment = await payments.initialize({
        appointment_id: appointment.id,
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
      setBusy('');
    }
  };

  const handleCancel = async () => {
    setBusy('cancel');
    try {
      await appointmentsApi.cancel(appointment.id);
      showToast('Appointment cancelled.', 'success');
      setShowCancelModal(false);
      setReloadKey((k) => k + 1);
    } catch (err) {
      showToast(errorText(err, 'Could not cancel that appointment.'), 'error');
    } finally {
      setBusy('');
    }
  };

  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  // Styles
  const pageStyle = {
    backgroundColor: colors.mainBg,
    minHeight: '100vh',
    paddingBottom: '40px',
  };

  const containerStyle = {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '16px',
  };

  const backButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '10px',
    background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.15)'}`,
    cursor: 'pointer',
    color: colors.text,
    fontSize: '13px',
    fontFamily: 'inherit',
    marginBottom: '16px',
  };

  const cardStyle = {
    borderRadius: '12px',
    background: isDark ? 'rgba(20,20,20,0.50)' : 'rgba(255,255,255,0.50)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)'}`,
    overflow: 'hidden',
    marginBottom: '14px',
  };

  const primaryButtonStyle = {
    padding: '9px 18px',
    borderRadius: '10px',
    background: colors.primary,
    color: '#1A1A1A',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const ghostButtonStyle = {
    padding: '9px 18px',
    borderRadius: '10px',
    background: 'transparent',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.15)' : 'rgba(212, 175, 55,0.20)'}`,
    color: colors.text,
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const dangerButtonStyle = {
    ...ghostButtonStyle,
    color: '#EF4444',
    borderColor: 'rgba(239,68,68,0.35)',
  };

  const sectionHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    width: '100%',
    color: colors.text,
    fontFamily: 'inherit',
  };

  const sectionTitleStyle = {
    fontSize: '13px',
    fontWeight: 600,
    color: colors.text,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const sectionContentStyle = { padding: '0 16px 16px' };

  const detailRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '7px 0',
    borderBottom: `1px solid ${isDark ? 'rgba(212, 175, 55,0.04)' : 'rgba(212, 175, 55,0.06)'}`,
  };

  const detailLabelStyle = { fontSize: '12px', color: colors.secondaryText, flexShrink: 0 };

  const detailValueStyle = {
    fontSize: '12px',
    fontWeight: 500,
    color: colors.text,
    textAlign: 'right',
    maxWidth: '62%',
    wordBreak: 'break-word',
  };

  const inputStyle = {
    padding: '7px 10px',
    borderRadius: '8px',
    background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.80)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.15)'}`,
    color: colors.text,
    fontSize: '12px',
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
  };

  const fieldLabelStyle = {
    display: 'block',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    color: colors.secondaryText,
    marginBottom: '4px',
  };

  const statCardStyle = {
    padding: '12px 14px',
    borderRadius: '10px',
    background: isDark ? 'rgba(20,20,20,0.50)' : 'rgba(255,255,255,0.50)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)'}`,
  };

  const statLabelStyle = {
    fontSize: '9px',
    color: colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  };

  const statValueStyle = { fontSize: '14px', fontWeight: 700, color: colors.heading, marginTop: '3px' };

  const tabsStyle = {
    display: 'flex',
    gap: '16px',
    borderBottom: `1px solid ${isDark ? 'rgba(212, 175, 55,0.08)' : 'rgba(212, 175, 55,0.10)'}`,
    paddingBottom: '8px',
    marginBottom: '18px',
    overflowX: 'auto',
  };

  const tabStyle = (isActive) => ({
    fontSize: '13px',
    fontWeight: isActive ? 600 : 400,
    color: isActive ? colors.primary : colors.secondaryText,
    cursor: 'pointer',
    padding: '4px 0',
    borderBottom: isActive ? `2px solid ${colors.primary}` : '2px solid transparent',
    whiteSpace: 'nowrap',
    background: 'none',
    border: 'none',
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid',
    borderBottomColor: isActive ? colors.primary : 'transparent',
    fontFamily: 'inherit',
  });

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div className="skeleton" style={{ height: '34px', width: '190px', borderRadius: '10px', marginBottom: '16px' }} />
          <div className="skeleton" style={{ height: '104px', borderRadius: '14px', marginBottom: '18px' }} />
          <div className="skeleton" style={{ height: '26px', width: '55%', borderRadius: '8px', marginBottom: '18px' }} />
          <div className="skeleton" style={{ height: '150px', borderRadius: '12px', marginBottom: '14px' }} />
          <div className="skeleton" style={{ height: '150px', borderRadius: '12px' }} />
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div style={pageStyle}>
        <div style={{ ...containerStyle, textAlign: 'center', padding: '60px 20px' }}>
          <AlertCircle size={38} color="#EF4444" style={{ marginBottom: '12px' }} />
          <p style={{ fontSize: '15px', fontWeight: 700, color: colors.heading, margin: 0 }}>
            Appointment unavailable
          </p>
          <p style={{ fontSize: '12px', color: colors.secondaryText, margin: '6px 0 18px' }}>
            {error || 'That appointment could not be found.'}
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={primaryButtonStyle} onClick={() => setReloadKey((k) => k + 1)}>
              <RefreshCw size={14} />
              Try again
            </button>
            <button style={ghostButtonStyle} onClick={() => navigate('/appointments')}>
              My appointments
            </button>
          </div>
        </div>
      </div>
    );
  }

  const StatusIcon = STATUS_ICON[appointment.status] || AlertCircle;
  const statusColor = STATUS_COLOR[appointment.status] || colors.secondaryText;
  // final_price is set when the studio reviews the booking; until then the
  // tier fee is what is owed.
  const amount = appointment.finalPrice != null ? appointment.finalPrice : appointment.tierFee;
  const canPay = !appointment.isPaid && amount > 0 && !['cancelled', 'no_show'].includes(appointment.status);
  const title = appointment.styleName || appointment.typeLabel || 'Appointment';

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <button style={backButtonStyle} onClick={() => navigate('/appointments')}>
          <ChevronLeft size={18} />
          Back to appointments
        </button>

        {/* Header */}
        <div style={{ ...cardStyle, padding: '16px 18px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', minWidth: 0 }}>
              {appointment.style?.image && (
                <img
                  src={appointment.style.image}
                  alt={appointment.style.name}
                  style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                />
              )}
              <div style={{ minWidth: 0 }}>
                <h1 style={{ fontSize: '18px', fontWeight: 800, color: colors.heading, margin: 0 }}>{title}</h1>
                <div style={{ fontSize: '12px', color: colors.secondaryText, marginTop: '3px' }}>
                  {formatDate(appointment.date)}
                  {appointment.time ? ` · ${appointment.time}` : ''}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span
                    style={{
                      padding: '3px 11px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: isDark ? `${statusColor}26` : `${statusColor}1A`,
                      color: statusColor,
                      border: `1px solid ${statusColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <StatusIcon size={12} />
                    {appointment.statusLabel || APPOINTMENT_STATUS_LABEL[appointment.status]}
                  </span>
                  {appointment.tierName && (
                    <span
                      style={{
                        padding: '2px 10px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: 700,
                        background: TIER_COLOR[appointment.tierName] || colors.secondaryText,
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {appointment.tierName === 'Express' && <Zap size={10} />}
                      {appointment.tierName}
                    </span>
                  )}
                  <span
                    style={{
                      padding: '2px 10px',
                      borderRadius: '8px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: appointment.isPaid ? '#10B981' : '#F59E0B',
                      background: appointment.isPaid
                        ? isDark
                          ? 'rgba(16,185,129,0.15)'
                          : 'rgba(16,185,129,0.10)'
                        : isDark
                        ? 'rgba(245,158,11,0.15)'
                        : 'rgba(245,158,11,0.10)',
                    }}
                  >
                    {appointment.isPaid ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {canPay && (
                <button style={primaryButtonStyle} onClick={handlePay} disabled={busy === 'pay'}>
                  <CreditCard size={14} />
                  {busy === 'pay' ? 'Starting…' : `Pay ${formatPrice(amount)}`}
                </button>
              )}
              {/* update_appointment refuses anything past pending. */}
              {appointment.status === 'pending' && !isEditing && (
                <button style={ghostButtonStyle} onClick={startEditing}>
                  <Edit size={14} />
                  Edit
                </button>
              )}
              <button style={ghostButtonStyle} onClick={() => window.print()}>
                <Printer size={14} />
                Print
              </button>
              {appointment.canCancel && (
                <button style={dangerButtonStyle} onClick={() => setShowCancelModal(true)}>
                  <XCircle size={14} />
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={tabsStyle}>
          {TABS.map((tab) => (
            <button key={tab.id} style={tabStyle(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
              {tab.id === 'timeline' && timeline.length > 0 ? ` (${timeline.length})` : ''}
              {tab.id === 'proposal' && proposals.length > 0 ? ` (${proposals.length})` : ''}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '10px',
                marginBottom: '14px',
              }}
            >
              <div style={statCardStyle}>
                <div style={statLabelStyle}>When</div>
                <div style={statValueStyle}>{formatDate(appointment.date)}</div>
                <div style={{ fontSize: '11px', color: colors.secondaryText, marginTop: '2px' }}>
                  {appointment.time || '—'}
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>{appointment.finalPrice != null ? 'Agreed price' : 'Booking fee'}</div>
                <div style={{ ...statValueStyle, color: colors.primary }}>{formatPrice(amount)}</div>
                <div style={{ fontSize: '11px', color: colors.secondaryText, marginTop: '2px' }}>
                  {appointment.tierName ? `${appointment.tierName} service` : '—'}
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>For</div>
                <div style={statValueStyle}>{appointment.personName || 'Myself'}</div>
                <div style={{ fontSize: '11px', color: colors.secondaryText, marginTop: '2px' }}>
                  {appointment.person?.relationship || (appointment.personName ? '' : 'Your own measurements')}
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Type</div>
                <div style={statValueStyle}>{appointment.typeLabel || '—'}</div>
                <div style={{ fontSize: '11px', color: colors.secondaryText, marginTop: '2px' }}>
                  {appointment.quantity > 1 ? `${appointment.quantity} pieces` : '1 piece'}
                </div>
              </div>
            </div>

            {/* The studio fills this in when it reviews the booking. */}
            {appointment.estimatedCompletion && (
              <div style={{ ...cardStyle, padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Calendar size={16} color={colors.primary} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: colors.text }}>
                    Ready by {formatDate(appointment.estimatedCompletion)}
                  </div>
                  <div style={{ fontSize: '11px', color: colors.secondaryText }}>
                    Estimated completion set by the studio.
                  </div>
                </div>
              </div>
            )}

            {appointment.style && (
              <div style={{ ...cardStyle, padding: '14px 16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <img
                    src={appointment.style.image}
                    alt={appointment.style.name}
                    style={{ width: '72px', height: '90px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: colors.heading }}>
                      {appointment.style.name}
                    </div>
                    <div style={{ fontSize: '11px', color: colors.secondaryText, marginTop: '2px' }}>
                      {[
                        appointment.style.category,
                        appointment.style.makingDays ? `${appointment.style.makingDays} days to make` : '',
                        formatPrice(appointment.style.price),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                    {appointment.style.description && (
                      <p style={{ fontSize: '12px', color: colors.text, margin: '8px 0 0', lineHeight: 1.55 }}>
                        {appointment.style.description}
                      </p>
                    )}
                    {appointment.styleSlug && (
                      <button
                        style={{
                          ...ghostButtonStyle,
                          marginTop: '10px',
                          padding: '6px 12px',
                          fontSize: '11px',
                        }}
                        onClick={() => navigate(`/styles/order/${appointment.styleSlug}`)}
                      >
                        <Scissors size={12} />
                        View style
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(appointment.notes || appointment.adminNotes) && (
              <div style={cardStyle}>
                <button style={sectionHeaderStyle} onClick={() => toggle('notes')}>
                  <span style={sectionTitleStyle}>
                    <FileText size={15} color={colors.primary} />
                    Notes
                  </span>
                  {expanded.notes ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                {expanded.notes && (
                  <div style={sectionContentStyle}>
                    {appointment.notes && (
                      <div style={{ marginBottom: appointment.adminNotes ? '12px' : 0 }}>
                        <div style={statLabelStyle}>What you asked for</div>
                        <p style={{ fontSize: '12px', color: colors.text, margin: '4px 0 0', lineHeight: 1.55 }}>
                          {appointment.notes}
                        </p>
                      </div>
                    )}
                    {appointment.adminNotes && (
                      <div>
                        <div style={statLabelStyle}>From the studio</div>
                        <p style={{ fontSize: '12px', color: colors.text, margin: '4px 0 0', lineHeight: 1.55 }}>
                          {appointment.adminNotes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Details */}
        {activeTab === 'details' && (
          <div>
            <div style={cardStyle}>
              <button style={sectionHeaderStyle} onClick={() => toggle('booking')}>
                <span style={sectionTitleStyle}>
                  <Layers size={15} color={colors.primary} />
                  Booking
                </span>
                {expanded.booking ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
              {expanded.booking && (
                <div style={sectionContentStyle}>
                  {isEditing && form ? (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div>
                        <label style={fieldLabelStyle} htmlFor="apt-type">
                          Appointment type
                        </label>
                        <select
                          id="apt-type"
                          style={inputStyle}
                          value={form.appointment_type}
                          onChange={(e) => setForm({ ...form, appointment_type: e.target.value })}
                        >
                          {TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={fieldLabelStyle} htmlFor="apt-fabric-provider">
                          Who supplies the fabric
                        </label>
                        <select
                          id="apt-fabric-provider"
                          style={inputStyle}
                          value={form.fabric_provider}
                          onChange={(e) => setForm({ ...form, fabric_provider: e.target.value })}
                        >
                          <option value="user">{FABRIC_PROVIDER_LABEL.user}</option>
                          <option value="tailor">{FABRIC_PROVIDER_LABEL.tailor}</option>
                        </select>
                      </div>
                      <div>
                        <label style={fieldLabelStyle} htmlFor="apt-fabric-type">
                          Fabric
                        </label>
                        <input
                          id="apt-fabric-type"
                          style={inputStyle}
                          placeholder="Kente, linen, silk…"
                          value={form.fabric_type}
                          onChange={(e) => setForm({ ...form, fabric_type: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={fieldLabelStyle} htmlFor="apt-quantity">
                          Pieces
                        </label>
                        <input
                          id="apt-quantity"
                          style={{ ...inputStyle, maxWidth: '120px' }}
                          type="number"
                          min="1"
                          value={form.quantity}
                          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={fieldLabelStyle} htmlFor="apt-phone">
                          Phone
                        </label>
                        <input
                          id="apt-phone"
                          style={inputStyle}
                          value={form.contact_phone}
                          onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={fieldLabelStyle} htmlFor="apt-email">
                          Email
                        </label>
                        <input
                          id="apt-email"
                          style={inputStyle}
                          type="email"
                          value={form.contact_email}
                          onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={fieldLabelStyle} htmlFor="apt-notes">
                          Notes for the studio
                        </label>
                        <textarea
                          id="apt-notes"
                          style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                          value={form.additional_notes}
                          onChange={(e) => setForm({ ...form, additional_notes: e.target.value })}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button style={primaryButtonStyle} onClick={handleSave} disabled={busy === 'save'}>
                          <Save size={14} />
                          {busy === 'save' ? 'Saving…' : 'Save changes'}
                        </button>
                        <button style={ghostButtonStyle} onClick={() => setIsEditing(false)}>
                          <X size={14} />
                          Discard
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={detailRowStyle}>
                        <span style={detailLabelStyle}>Type</span>
                        <span style={detailValueStyle}>{appointment.typeLabel || '—'}</span>
                      </div>
                      <div style={detailRowStyle}>
                        <span style={detailLabelStyle}>Service</span>
                        <span style={detailValueStyle}>
                          {appointment.tierName ? `${appointment.tierName} · ${formatPrice(appointment.tierFee)}` : '—'}
                        </span>
                      </div>
                      {appointment.finalPrice != null && (
                        <div style={detailRowStyle}>
                          <span style={detailLabelStyle}>Agreed price</span>
                          <span style={{ ...detailValueStyle, color: colors.primary, fontWeight: 700 }}>
                            {formatPrice(appointment.finalPrice)}
                          </span>
                        </div>
                      )}
                      <div style={detailRowStyle}>
                        <span style={detailLabelStyle}>Style</span>
                        <span style={detailValueStyle}>{appointment.styleName || 'Not tied to a style'}</span>
                      </div>
                      <div style={detailRowStyle}>
                        <span style={detailLabelStyle}>Fabric</span>
                        <span style={detailValueStyle}>
                          {[FABRIC_PROVIDER_LABEL[appointment.fabricProvider], appointment.fabricType]
                            .filter(Boolean)
                            .join(' · ') || '—'}
                        </span>
                      </div>
                      <div style={detailRowStyle}>
                        <span style={detailLabelStyle}>Pieces</span>
                        <span style={detailValueStyle}>{appointment.quantity}</span>
                      </div>
                      <div style={detailRowStyle}>
                        <span style={detailLabelStyle}>Phone</span>
                        <span style={detailValueStyle}>{appointment.contactPhone || '—'}</span>
                      </div>
                      <div style={detailRowStyle}>
                        <span style={detailLabelStyle}>Email</span>
                        <span style={detailValueStyle}>{appointment.contactEmail || '—'}</span>
                      </div>
                      <div style={detailRowStyle}>
                        <span style={detailLabelStyle}>Booked</span>
                        <span style={detailValueStyle}>{formatDateTime(appointment.createdAt)}</span>
                      </div>
                      {appointment.estimatedCompletion && (
                        <div style={detailRowStyle}>
                          <span style={detailLabelStyle}>Ready by</span>
                          <span style={detailValueStyle}>{formatDate(appointment.estimatedCompletion)}</span>
                        </div>
                      )}
                      {appointment.notes && (
                        <div style={{ marginTop: '12px' }}>
                          <div style={statLabelStyle}>Your notes</div>
                          <p style={{ fontSize: '12px', color: colors.text, margin: '4px 0 0', lineHeight: 1.55 }}>
                            {appointment.notes}
                          </p>
                        </div>
                      )}
                      {appointment.status !== 'pending' && (
                        <p style={{ fontSize: '11px', color: colors.secondaryText, margin: '12px 0 0' }}>
                          Changes are only possible while a booking is still pending. Call the studio for anything
                          after that.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Person + measurements */}
            <div style={cardStyle}>
              <button style={sectionHeaderStyle} onClick={() => toggle('measurements')}>
                <span style={sectionTitleStyle}>
                  <Ruler size={15} color={colors.primary} />
                  Measurements
                  {measurements.length > 0 ? ` (${measurements.length})` : ''}
                </span>
                {expanded.measurements ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
              {expanded.measurements && (
                <div style={sectionContentStyle}>
                  {appointment.person && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '14px',
                        flexWrap: 'wrap',
                        paddingBottom: '12px',
                        marginBottom: '12px',
                        borderBottom: `1px solid ${isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)'}`,
                      }}
                    >
                      <span style={{ fontSize: '12px', color: colors.text, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <User size={12} color={colors.secondaryText} />
                        {appointment.person.name}
                        {appointment.person.relationship ? ` · ${appointment.person.relationship}` : ''}
                      </span>
                      {appointment.person.phone && (
                        <span style={{ fontSize: '12px', color: colors.secondaryText, display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Phone size={12} />
                          {appointment.person.phone}
                        </span>
                      )}
                      {appointment.person.email && (
                        <span style={{ fontSize: '12px', color: colors.secondaryText, display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Mail size={12} />
                          {appointment.person.email}
                        </span>
                      )}
                    </div>
                  )}

                  {measurements.length > 0 ? (
                    <>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                          gap: '8px',
                        }}
                      >
                        {measurements.map(([key, value]) => (
                          <div
                            key={key}
                            style={{
                              padding: '7px 10px',
                              borderRadius: '8px',
                              background: isDark ? 'rgba(26,26,26,0.40)' : 'rgba(248,246,241,0.60)',
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontSize: '8px', color: colors.secondaryText, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                              {key.replace(/_/g, ' ')}
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>{value}</div>
                          </div>
                        ))}
                      </div>
                      {appointment.measurement?.notes && (
                        <p style={{ fontSize: '11px', color: colors.secondaryText, margin: '10px 0 0', lineHeight: 1.5 }}>
                          {appointment.measurement.notes}
                        </p>
                      )}
                    </>
                  ) : (
                    <div>
                      <p style={{ fontSize: '12px', color: colors.secondaryText, margin: 0 }}>
                        No measurements attached to this booking. The studio will take them at your fitting, or you
                        can save a set now.
                      </p>
                      <button
                        style={{ ...ghostButtonStyle, marginTop: '10px', padding: '7px 14px', fontSize: '11px' }}
                        onClick={() => navigate('/measure')}
                      >
                        <Ruler size={12} />
                        My measurements
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'proposal' && (
          <div className="customer-proposals">
            {!proposals.length ? <div className="customer-proposal-empty"><FileText size={26}/><h3>No agreement has been sent yet</h3><p>After your consultation, the studio will place the agreed design, references, price and payment terms here.</p></div> : proposals.map((proposal) => <article className="customer-proposal" key={proposal.id}>
              <header><div><span>Proposal version {proposal.version}</span><h2>{proposal.garment_type || 'Bespoke garment'}</h2></div><b>{proposal.status.replaceAll('_',' ')}</b></header>
              {!!proposal.reference_images?.length && <div className="customer-proposal-gallery">{proposal.reference_images.map((image,index)=><img className={index===0?'lead':''} key={image.id} src={mediaUrl(image.image)} alt={image.alt_text || proposal.garment_type}/>)}</div>}
              <div className="customer-proposal-terms"><span><small>Total</small><strong>{formatPrice(proposal.total_price)}</strong></span><span><small>Required before work</small><strong>{formatPrice(proposal.deposit_amount)}</strong></span><span><small>Balance due</small><strong>{proposal.balance_due_date ? formatDate(proposal.balance_due_date) : 'Not set'}</strong></span><span><small>Expected completion</small><strong>{proposal.completion_date ? formatDate(proposal.completion_date) : 'Not set'}</strong></span></div>
              <div className="customer-proposal-spec">{Object.entries(proposal.specification || {}).filter(([,value])=>value).map(([key,value])=><span key={key}><small>{key.replaceAll('_',' ')}</small><b>{value}</b></span>)}</div>
              {proposal.customer_notes && <p className="customer-proposal-note">{proposal.customer_notes}</p>}
              {proposal.status === 'sent' && <footer><button className="btn btn-ghost" onClick={()=>handleProposalAction(proposal,'reject')}>Decline</button><button className="btn btn-ghost" onClick={()=>handleProposalAction(proposal,'revision')}>Request changes</button><button className="btn btn-primary" disabled={busy===`proposal-${proposal.id}`} onClick={()=>handleProposalAction(proposal,'accept')}>Accept agreement</button></footer>}
            </article>)}
          </div>
        )}

        {/* Timeline */}
        {activeTab === 'timeline' && (
          <div style={{ ...cardStyle, padding: '16px' }}>
            {timeline.length === 0 ? (
              <p style={{ fontSize: '12px', color: colors.secondaryText, margin: 0, textAlign: 'center', padding: '20px 0' }}>
                Nothing recorded yet. Updates from the studio show up here.
              </p>
            ) : (
              timeline.map((entry, index) => (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    paddingLeft: '16px',
                    marginLeft: '10px',
                    paddingBottom: index === timeline.length - 1 ? 0 : '16px',
                    borderLeft: `2px solid ${
                      index === timeline.length - 1 ? 'transparent' : isDark ? 'rgba(212, 175, 55,0.20)' : 'rgba(212, 175, 55,0.25)'
                    }`,
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: '-6px',
                      top: '3px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: STATUS_COLOR[entry.new_status] || colors.primary,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: colors.text }}>
                      {entry.note || `Status changed to ${APPOINTMENT_STATUS_LABEL[entry.new_status] || entry.new_status}`}
                    </div>
                    {entry.old_status !== entry.new_status && (
                      <div style={{ fontSize: '11px', color: colors.secondaryText, marginTop: '2px' }}>
                        {APPOINTMENT_STATUS_LABEL[entry.old_status] || entry.old_status} to{' '}
                        {APPOINTMENT_STATUS_LABEL[entry.new_status] || entry.new_status}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: colors.secondaryText, marginTop: '2px' }}>
                      {formatDateTime(entry.created_at)}
                      {entry.changed_by_name ? ` · ${entry.changed_by_name}` : ''}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Cancel confirmation */}
      {showCancelModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.60)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowCancelModal(false)}
        >
          <div
            style={{
              maxWidth: '420px',
              width: '100%',
              background: isDark ? 'rgba(20,20,20,0.97)' : 'rgba(255,255,255,0.97)',
              borderRadius: '16px',
              padding: '26px 24px',
              border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.12)' : 'rgba(212, 175, 55,0.18)'}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: colors.heading, margin: '0 0 8px' }}>
              Cancel this appointment?
            </h3>
            <p style={{ fontSize: '13px', color: colors.secondaryText, margin: '0 0 20px', lineHeight: 1.6 }}>
              Your slot on {formatDate(appointment.date)} is released and someone else can take it. Booking again
              means picking whatever is free at the time.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                style={{
                  ...primaryButtonStyle,
                  background: '#EF4444',
                  color: '#FFFFFF',
                  flex: 1,
                  justifyContent: 'center',
                }}
                onClick={handleCancel}
                disabled={busy === 'cancel'}
              >
                {busy === 'cancel' ? 'Cancelling…' : 'Yes, cancel it'}
              </button>
              <button
                style={{ ...ghostButtonStyle, flex: 1, justifyContent: 'center' }}
                onClick={() => setShowCancelModal(false)}
              >
                Keep it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentDetailsPage;
