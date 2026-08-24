import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  User,
  Users,
  Plus,
  X,
  Check,
  Clock,
  Ruler,
  Scissors,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
  Mail,
  FileText,
  Send,
  Zap,
  Calendar as CalendarIcon,
  CheckCircle,
  Minus,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../providers/ToastProvider';
import { useAuth } from '../providers/AuthProvider';
import { shop, people as peopleApi, appointments as appointmentsApi } from '../api/endpoints';
import { adaptStyleDetail, errorText, formatMoney, formatDate } from '../api/adapters';

// The backend's three tiers, dressed for the customer. Fee and description come
// from the server; everything here is presentation the API doesn't carry.
const TIER_PRESENTATION = {
  normal: {
    label: 'Standard',
    blurb: 'Regular queue, standard consultation slot',
    response: 'Reply within 3–5 business days',
    color: '#10B981',
    icon: Clock,
  },
  urgent: {
    label: 'Priority',
    blurb: 'Moved up the queue with a priority slot',
    response: 'Reply within 1–2 business days',
    color: '#F59E0B',
    icon: Zap,
  },
  express: {
    label: 'Express',
    blurb: 'Fastest service, dedicated express slot',
    response: 'Reply within 24 hours',
    color: '#EF4444',
    icon: Zap,
  },
};

const RELATIONSHIPS = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'sister', label: 'Sister' },
  { value: 'brother', label: 'Brother' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'friend', label: 'Friend' },
  { value: 'other', label: 'Myself / Other' },
];

const APPOINTMENT_TYPES = [
  { value: 'style_order', label: 'Style order' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'fitting', label: 'Fitting' },
];

const MEASUREMENT_LABELS = {
  chest: 'Chest',
  bust: 'Bust',
  waist: 'Waist',
  hips: 'Hips',
  shoulder: 'Shoulder',
  neck: 'Neck',
  inseam: 'Inseam',
  outseam: 'Outseam',
  arm_length: 'Arm',
  sleeve_length: 'Sleeve',
  bicep: 'Bicep',
  wrist: 'Wrist',
  thigh: 'Thigh',
  knee: 'Knee',
  calf: 'Calf',
  ankle: 'Ankle',
  back_width: 'Back width',
  front_length: 'Front length',
  shoulder_to_waist: 'Shoulder to waist',
  waist_to_knee: 'Waist to knee',
  waist_to_ankle: 'Waist to ankle',
  height: 'Height',
  weight: 'Weight',
};

const timeRange = (slot) => {
  const trim = (t) => (t || '').slice(0, 5);
  return `${trim(slot.start_time)} – ${trim(slot.end_time)}`;
};

const StyleOrderPage = () => {
  const { styleId } = useParams();
  const navigate = useNavigate();
  const { colors, theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const { showToast } = useToast();
  const { isAuthenticated, user } = useAuth();

  const [style, setStyle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [people, setPeople] = useState([]);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [personMeasurements, setPersonMeasurements] = useState([]);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState('');
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);

  const [tiers, setTiers] = useState([]);
  const [tierName, setTierName] = useState('normal');
  const [slots, setSlots] = useState([]);
  const [slotDate, setSlotDate] = useState('');
  const [slotId, setSlotId] = useState('');

  const [appointmentType, setAppointmentType] = useState('style_order');
  const [fabricProvider, setFabricProvider] = useState('tailor');
  const [fabricType, setFabricType] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [showNewPersonForm, setShowNewPersonForm] = useState(false);
  const [newPerson, setNewPerson] = useState({
    name: '',
    relationship: 'other',
    phone: '',
    email: '',
    gender: '',
  });
  const [savingPerson, setSavingPerson] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
    recipient: true,
    measurements: true,
    fabric: true,
    urgency: true,
    slot: true,
    contact: true,
    notes: true,
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);

  // The route carries the style's slug; ProductDetails and the gallery both
  // link with it.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    shop
      .style(styleId)
      .then((row) => {
        if (cancelled) return;
        setStyle(adaptStyleDetail(row));
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err, 'This style could not be loaded.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [styleId, reloadKey]);

  // Tiers and slots are public, so the form fills in before sign-in too.
  useEffect(() => {
    let cancelled = false;
    Promise.all([appointmentsApi.tiers(), appointmentsApi.slots()])
      .then(([tierRows, slotRows]) => {
        if (cancelled) return;
        const activeTiers = (tierRows || []).filter((t) => t.is_active !== false);
        setTiers(activeTiers);
        if (activeTiers.length && !activeTiers.some((t) => t.name === 'normal')) {
          setTierName(activeTiers[0].name);
        }
        setSlots(slotRows || []);
      })
      .catch((err) => showToast(errorText(err, 'Could not load consultation slots.'), 'error'));
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  // People and their measurements live behind auth; a signed-out visitor fills
  // the rest of the form and is asked to sign in at submit.
  useEffect(() => {
    if (!isAuthenticated) {
      setPeople([]);
      setSelectedPersonId('');
      return undefined;
    }
    let cancelled = false;
    peopleApi
      .list()
      .then((rows) => {
        if (cancelled) return;
        const list = rows || [];
        setPeople(list);
        if (list.length) setSelectedPersonId((current) => current || list[0].id);
      })
      .catch((err) => showToast(errorText(err, 'Could not load your saved people.'), 'error'));
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, showToast]);

  // Prefill contact details from the signed-in profile.
  useEffect(() => {
    if (!user) return;
    setContactPhone((current) => current || user.phone || '');
    setContactEmail((current) => current || user.email || '');
  }, [user]);

  useEffect(() => {
    if (!selectedPersonId) {
      setPersonMeasurements([]);
      setSelectedMeasurementId('');
      return undefined;
    }
    let cancelled = false;
    setLoadingMeasurements(true);
    peopleApi
      .measurements(selectedPersonId)
      .then((rows) => {
        if (cancelled) return;
        const list = rows || [];
        setPersonMeasurements(list);
        const active = list.find((m) => m.is_active) || list[0];
        setSelectedMeasurementId(active ? active.id : '');
      })
      .catch(() => {
        if (!cancelled) {
          // No measurements on file is a normal state for a new person.
          setPersonMeasurements([]);
          setSelectedMeasurementId('');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMeasurements(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPersonId]);

  // Express bookings draw on a separate pool, so which slots are open depends on
  // the tier the customer picked.
  const slotsForTier = useMemo(() => {
    const isExpress = tierName === 'express';
    return slots.filter((s) => (isExpress ? !s.is_express_full : !s.is_normal_full));
  }, [slots, tierName]);

  const slotDates = useMemo(
    () => [...new Set(slotsForTier.map((s) => s.date))].sort(),
    [slotsForTier]
  );

  const slotsOnDate = useMemo(
    () => slotsForTier.filter((s) => s.date === slotDate),
    [slotsForTier, slotDate]
  );

  // Keep the date and time selections valid whenever the pool changes.
  useEffect(() => {
    if (slotDates.length === 0) {
      setSlotDate('');
      return;
    }
    if (!slotDates.includes(slotDate)) setSlotDate(slotDates[0]);
  }, [slotDates, slotDate]);

  useEffect(() => {
    if (!slotsOnDate.some((s) => s.id === slotId)) {
      setSlotId(slotsOnDate[0]?.id || '');
    }
  }, [slotsOnDate, slotId]);

  const selectedPerson = people.find((p) => p.id === selectedPersonId) || null;
  const selectedMeasurement =
    personMeasurements.find((m) => m.id === selectedMeasurementId) || null;
  const selectedTier = tiers.find((t) => t.name === tierName) || null;
  const selectedSlot = slots.find((s) => s.id === slotId) || null;

  // Drives the step indicator — real completion, not a counter that never moves.
  const formStep =
    1 +
    (selectedPerson ? 1 : 0) +
    (selectedMeasurement ? 1 : 0) +
    (selectedSlot && contactPhone.trim() ? 1 : 0);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSavePerson = async () => {
    if (!isAuthenticated) {
      showToast('Sign in first to save people.', 'info');
      navigate('/login');
      return;
    }
    if (!newPerson.name.trim()) {
      showToast('Give this person a name.', 'info');
      return;
    }
    setSavingPerson(true);
    try {
      const created = await peopleApi.create({
        name: newPerson.name.trim(),
        relationship: newPerson.relationship,
        phone: newPerson.phone.trim(),
        email: newPerson.email.trim(),
        gender: newPerson.gender,
      });
      setPeople((prev) => [...prev, created]);
      setSelectedPersonId(created.id);
      setShowNewPersonForm(false);
      setNewPerson({ name: '', relationship: 'other', phone: '', email: '', gender: '' });
      showToast(`${created.name} saved.`, 'success');
    } catch (err) {
      showToast(errorText(err, 'Could not save that person.'), 'error');
    } finally {
      setSavingPerson(false);
    }
  };

  // A style request is an appointment with the style attached: the tailor
  // reviews it, quotes it, then work begins. The backend enforces that a style
  // booking carries both a person and a measurement.
  const handleSubmit = async () => {
    if (!isAuthenticated) {
      showToast('Sign in to send this request.', 'info');
      navigate('/login');
      return;
    }
    if (!selectedPerson) {
      showToast('Choose who this is for.', 'info');
      return;
    }
    if (!selectedMeasurement) {
      showToast('This person needs saved measurements first.', 'info');
      return;
    }
    if (!selectedSlot) {
      showToast('Pick a consultation slot.', 'info');
      return;
    }
    if (!contactPhone.trim()) {
      showToast('Add a phone number the tailor can reach you on.', 'info');
      return;
    }
    if (!agreedToTerms) {
      showToast('Please confirm the terms before sending.', 'info');
      return;
    }

    setSubmitting(true);
    try {
      const appointment = await appointmentsApi.create({
        slot_id: selectedSlot.id,
        tier_name: tierName,
        appointment_type: appointmentType,
        style_id: style.id,
        person_id: selectedPerson.id,
        measurement_id: selectedMeasurement.id,
        fabric_provider: fabricProvider,
        fabric_type: fabricType.trim(),
        quantity,
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim(),
        additional_notes: additionalNotes.trim(),
      });
      setCreatedAppointment(appointment);
    } catch (err) {
      showToast(errorText(err, 'Could not send that request.'), 'error');
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
    maxWidth: '900px',
    margin: '0 auto',
    padding: '16px',
  };

  const backButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '12px',
    background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)'}`,
    cursor: 'pointer',
    color: colors.text,
    fontSize: '13px',
    transition: 'all 0.2s ease',
    marginBottom: '16px',
    fontFamily: 'inherit',
  };

  const headerStyle = {
    display: 'flex',
    gap: '20px',
    padding: '20px',
    borderRadius: '16px',
    background: isDark ? 'rgba(20,20,20,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.10)'}`,
    marginBottom: '24px',
    flexWrap: 'wrap',
  };

  const styleImageStyle = {
    width: '120px',
    height: '120px',
    borderRadius: '12px',
    objectFit: 'cover',
    flexShrink: 0,
  };

  const styleInfoStyle = { flex: 1, minWidth: '220px' };

  const styleNameStyle = {
    fontSize: '18px',
    fontWeight: 700,
    color: colors.heading,
    margin: 0,
  };

  const styleCategoryStyle = {
    fontSize: '12px',
    color: colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  };

  const sectionStyle = {
    marginBottom: '20px',
    borderRadius: '16px',
    background: isDark ? 'rgba(20,20,20,0.40)' : 'rgba(255,255,255,0.40)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.06)' : 'rgba(168, 137, 79,0.08)'}`,
    overflow: 'hidden',
  };

  const sectionHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    width: '100%',
    color: colors.text,
    fontFamily: 'inherit',
  };

  const sectionTitleStyle = {
    fontSize: '15px',
    fontWeight: 600,
    color: colors.text,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const sectionIconStyle = { color: colors.primary };

  const sectionContentStyle = { padding: '0 20px 20px' };

  const personCardStyle = (isSelected) => ({
    padding: '12px 16px',
    borderRadius: '12px',
    cursor: 'pointer',
    background: isSelected
      ? isDark
        ? 'rgba(168, 137, 79,0.12)'
        : 'rgba(168, 137, 79,0.08)'
      : 'transparent',
    border: `1px solid ${
      isSelected ? colors.primary : isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.10)'
    }`,
    transition: 'all 0.2s ease',
    marginBottom: '8px',
  });

  const personNameStyle = { fontSize: '14px', fontWeight: 600, color: colors.text };

  const personRelationshipStyle = { fontSize: '12px', color: colors.secondaryText };

  const measurementGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '8px',
    marginTop: '8px',
  };

  const measurementItemStyle = {
    padding: '6px 10px',
    borderRadius: '8px',
    background: isDark ? 'rgba(26,26,26,0.40)' : 'rgba(248,246,241,0.40)',
    textAlign: 'center',
  };

  const measurementLabelStyle = {
    fontSize: '9px',
    color: colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  };

  const measurementValueStyle = { fontSize: '13px', fontWeight: 600, color: colors.text };

  const urgencyCardStyle = (isSelected, accent) => ({
    padding: '14px 16px',
    borderRadius: '12px',
    cursor: 'pointer',
    background: isSelected
      ? isDark
        ? 'rgba(168, 137, 79,0.12)'
        : 'rgba(168, 137, 79,0.08)'
      : 'transparent',
    border: `1px solid ${
      isSelected ? accent : isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.10)'
    }`,
    transition: 'all 0.2s ease',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  });

  const urgencyNameStyle = { fontSize: '14px', fontWeight: 600, color: colors.text };

  const urgencyDescriptionStyle = { fontSize: '12px', color: colors.secondaryText };

  const urgencyBadgeStyle = (accent) => ({
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: 600,
    background: accent,
    color: '#FFFFFF',
    opacity: 0.9,
    whiteSpace: 'nowrap',
  });

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.80)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)'}`,
    color: colors.text,
    fontSize: '13px',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const textareaStyle = {
    ...inputStyle,
    resize: 'vertical',
    minHeight: '80px',
  };

  const labelStyle = {
    fontSize: '13px',
    fontWeight: 500,
    color: colors.text,
    display: 'block',
    marginBottom: '6px',
  };

  const helperTextStyle = { fontSize: '12px', color: colors.secondaryText, marginTop: '4px' };

  const choiceGroupStyle = { display: 'flex', gap: '8px', flexWrap: 'wrap' };

  const choiceButtonStyle = (isSelected) => ({
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: isSelected ? 600 : 400,
    cursor: 'pointer',
    background: isSelected
      ? colors.primary
      : isDark
        ? 'rgba(26,26,26,0.60)'
        : 'rgba(255,255,255,0.80)',
    color: isSelected ? '#1A1A1A' : colors.secondaryText,
    border: `1px solid ${
      isSelected ? colors.primary : isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)'
    }`,
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: 'inherit',
  });

  const footerStyle = {
    position: 'sticky',
    bottom: 0,
    padding: '16px 20px',
    background: isDark ? 'rgba(10,10,10,0.95)' : 'rgba(248,246,241,0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderTop: `1px solid ${isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.10)'}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  };

  const submitButtonStyle = {
    padding: '12px 32px',
    borderRadius: '12px',
    background: colors.primary,
    color: '#1A1A1A',
    fontSize: '15px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'inherit',
    opacity: agreedToTerms && !submitting ? 1 : 0.5,
  };

  const termsCheckboxStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    marginTop: '12px',
  };

  const successOverlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.70)',
    backdropFilter: 'blur(8px)',
    zIndex: 2000,
    display: createdAppointment ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    padding: '20px',
  };

  const successCardStyle = {
    maxWidth: '480px',
    width: '100%',
    background: isDark ? 'rgba(20,20,20,0.95)' : 'rgba(255,255,255,0.95)',
    borderRadius: '20px',
    padding: '40px',
    textAlign: 'center',
  };

  // A measurement row's `data` is a free-form JSON blob, so render whatever
  // keys it happens to carry rather than a fixed list.
  const renderMeasurementTiles = (data) =>
    Object.entries(data || {})
      .filter(([, value]) => value !== '' && value != null)
      .map(([key, value]) => (
        <div key={key} style={measurementItemStyle}>
          <div style={measurementLabelStyle}>{MEASUREMENT_LABELS[key] || key.replace(/_/g, ' ')}</div>
          <div style={measurementValueStyle}>{key === 'weight' ? `${value} kg` : `${value}"`}</div>
        </div>
      ));

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div className="skeleton" style={{ height: 40, width: 160, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 160, borderRadius: 16, margin: '16px 0 24px' }} />
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 90, borderRadius: 16, marginBottom: 20 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !style) {
    return (
      <div style={pageStyle}>
        <div style={{ ...containerStyle, textAlign: 'center', paddingTop: '80px' }}>
          <AlertCircle size={32} style={{ color: colors.error, marginBottom: 12 }} />
          <p style={{ fontSize: '15px', color: colors.text, margin: 0 }}>
            {error || 'This style is no longer available.'}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={() => setReloadKey((k) => k + 1)}>
              Try again
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/gallery')}>
              Back to gallery
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tierRows = tiers.length
    ? tiers
    : Object.keys(TIER_PRESENTATION).map((name) => ({ name, fee: 0, description: '' }));

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <button
          style={backButtonStyle}
          onClick={() => navigate(-1)}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark
              ? 'rgba(168, 137, 79,0.10)'
              : 'rgba(168, 137, 79,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isDark
              ? 'rgba(26,26,26,0.60)'
              : 'rgba(255,255,255,0.60)';
          }}
        >
          <ChevronLeft size={18} />
          Back
        </button>

        {/* Style Header */}
        <div style={headerStyle}>
          <img src={style.image} alt={style.name} style={styleImageStyle} draggable={false} />
          <div style={styleInfoStyle}>
            <div style={styleCategoryStyle}>{style.category}</div>
            <h1 style={styleNameStyle}>{style.name}</h1>
            {style.description && (
              <p style={{ fontSize: '13px', color: colors.secondaryText, margin: '4px 0' }}>
                {style.description}
              </p>
            )}
            <div style={{ fontSize: '13px', fontWeight: 600, color: colors.primary, marginTop: '4px' }}>
              From {formatMoney(style.price)}
            </div>
            {style.makingDays && (
              <div style={{ fontSize: '12px', color: colors.secondaryText, marginTop: '4px' }}>
                <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                About {style.makingDays} days to make
              </div>
            )}
            {style.tags.length > 0 && (
              <div style={{ fontSize: '12px', color: colors.secondaryText }}>
                {style.tags.join(' · ')}
              </div>
            )}
          </div>
        </div>

        {/* Progress — driven by what's actually filled in */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '24px',
            padding: '0 4px',
          }}
        >
          {['Style', 'Recipient', 'Measurements', 'Booking'].map((step, index) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  background:
                    formStep > index
                      ? colors.primary
                      : isDark
                        ? 'rgba(26,26,26,0.60)'
                        : 'rgba(255,255,255,0.60)',
                  border: `1px solid ${
                    formStep > index
                      ? colors.primary
                      : isDark
                        ? 'rgba(168, 137, 79,0.10)'
                        : 'rgba(168, 137, 79,0.15)'
                  }`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: formStep > index ? '#1A1A1A' : colors.secondaryText,
                  fontSize: '12px',
                  fontWeight: 600,
                }}
                title={step}
              >
                {formStep > index ? <Check size={16} /> : index + 1}
              </div>
              {index < 3 && (
                <div
                  style={{
                    flex: 1,
                    height: '1px',
                    background: isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)',
                    margin: '0 8px',
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Section 1: Who is this for? */}
        <div style={sectionStyle}>
          <button style={sectionHeaderStyle} onClick={() => toggleSection('recipient')}>
            <span style={sectionTitleStyle}>
              <Users size={18} style={sectionIconStyle} />
              Who is this for?
            </span>
            {expandedSections.recipient ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {expandedSections.recipient && (
            <div style={sectionContentStyle}>
              {!isAuthenticated ? (
                <div>
                  <p style={{ fontSize: '13px', color: colors.secondaryText, marginTop: 0 }}>
                    Sign in to use your saved people and measurements.
                  </p>
                  <button className="btn btn-primary" onClick={() => navigate('/login')}>
                    Sign in
                  </button>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: '13px', color: colors.secondaryText, marginTop: 0, marginBottom: '12px' }}>
                    Pick whose measurements this piece should be cut to.
                  </p>

                  {people.length === 0 && (
                    <p style={{ fontSize: '13px', color: colors.secondaryText }}>
                      You have no one saved yet. Add yourself or a family member below.
                    </p>
                  )}

                  {people.map((person) => (
                    <div
                      key={person.id}
                      style={personCardStyle(selectedPersonId === person.id)}
                      onClick={() => setSelectedPersonId(person.id)}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={personNameStyle}>{person.name}</div>
                          <div style={personRelationshipStyle}>
                            {RELATIONSHIPS.find((r) => r.value === person.relationship)?.label ||
                              person.relationship}
                            {person.phone ? ` · ${person.phone}` : ''}
                          </div>
                        </div>
                        {selectedPersonId === person.id && (
                          <Check size={18} color={colors.primary} />
                        )}
                      </div>
                    </div>
                  ))}

                  {!showNewPersonForm ? (
                    <button
                      style={{
                        ...choiceButtonStyle(false),
                        width: '100%',
                        justifyContent: 'center',
                        padding: '12px',
                        borderStyle: 'dashed',
                      }}
                      onClick={() => setShowNewPersonForm(true)}
                    >
                      <Plus size={16} />
                      Add someone
                    </button>
                  ) : (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '16px',
                        borderRadius: '12px',
                        background: isDark ? 'rgba(26,26,26,0.40)' : 'rgba(248,246,241,0.40)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px',
                        }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>
                          New person
                        </span>
                        <button
                          onClick={() => setShowNewPersonForm(false)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: colors.secondaryText,
                          }}
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                          gap: '10px',
                        }}
                      >
                        <div>
                          <label style={labelStyle}>Name</label>
                          <input
                            style={inputStyle}
                            placeholder="Full name"
                            value={newPerson.name}
                            onChange={(e) =>
                              setNewPerson((p) => ({ ...p, name: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Relationship</label>
                          <select
                            style={inputStyle}
                            value={newPerson.relationship}
                            onChange={(e) =>
                              setNewPerson((p) => ({ ...p, relationship: e.target.value }))
                            }
                          >
                            {RELATIONSHIPS.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>Phone</label>
                          <input
                            style={inputStyle}
                            placeholder="+233 XX XXX XXXX"
                            value={newPerson.phone}
                            onChange={(e) =>
                              setNewPerson((p) => ({ ...p, phone: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Email</label>
                          <input
                            style={inputStyle}
                            type="email"
                            placeholder="name@example.com"
                            value={newPerson.email}
                            onChange={(e) =>
                              setNewPerson((p) => ({ ...p, email: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          {/* Gender picks which measuring demo the tutorial shows. */}
                          <label style={labelStyle}>Measured as</label>
                          <select
                            style={inputStyle}
                            value={newPerson.gender}
                            onChange={(e) =>
                              setNewPerson((p) => ({ ...p, gender: e.target.value }))
                            }
                          >
                            <option value="">Prefer not to say</option>
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                            <option value="O">Other</option>
                          </select>
                        </div>
                      </div>
                      <button
                        style={{
                          ...submitButtonStyle,
                          opacity: savingPerson ? 0.6 : 1,
                          marginTop: '12px',
                          width: '100%',
                          justifyContent: 'center',
                        }}
                        onClick={handleSavePerson}
                        disabled={savingPerson}
                      >
                        <User size={16} />
                        {savingPerson ? 'Saving…' : 'Save person'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Measurements */}
        <div style={sectionStyle}>
          <button style={sectionHeaderStyle} onClick={() => toggleSection('measurements')}>
            <span style={sectionTitleStyle}>
              <Ruler size={18} style={sectionIconStyle} />
              Measurements
            </span>
            {expandedSections.measurements ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {expandedSections.measurements && (
            <div style={sectionContentStyle}>
              {!selectedPerson ? (
                <p style={{ fontSize: '13px', color: colors.secondaryText, margin: 0 }}>
                  Choose who this is for first.
                </p>
              ) : loadingMeasurements ? (
                <div className="skeleton" style={{ height: 70, borderRadius: 12 }} />
              ) : personMeasurements.length === 0 ? (
                <div>
                  <p style={{ fontSize: '13px', color: colors.secondaryText, marginTop: 0 }}>
                    {selectedPerson.name} has no measurements on file. The tailor needs them
                    before this can be cut.
                  </p>
                  <button className="btn btn-primary" onClick={() => navigate('/measure')}>
                    <Ruler size={16} style={{ marginRight: 6 }} />
                    Take measurements
                  </button>
                </div>
              ) : (
                <>
                  {personMeasurements.length > 1 && (
                    <div style={{ marginBottom: '12px' }}>
                      <label style={labelStyle}>Which set?</label>
                      <select
                        style={inputStyle}
                        value={selectedMeasurementId}
                        onChange={(e) => setSelectedMeasurementId(e.target.value)}
                      >
                        {personMeasurements.map((m) => (
                          <option key={m.id} value={m.id}>
                            {formatDate(m.created_at)}
                            {m.is_active ? ' — current' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text }}>
                      {selectedPerson.name}
                    </span>
                    <span style={{ fontSize: '11px', color: colors.secondaryText }}>
                      taken {formatDate(selectedMeasurement?.created_at)}
                    </span>
                  </div>

                  <div style={measurementGridStyle}>
                    {renderMeasurementTiles(selectedMeasurement?.data)}
                  </div>

                  {selectedMeasurement?.notes && (
                    <p style={{ ...helperTextStyle, marginTop: '10px' }}>
                      {selectedMeasurement.notes}
                    </p>
                  )}

                  <div
                    style={{
                      marginTop: '12px',
                      padding: '12px',
                      borderRadius: '8px',
                      background: isDark ? 'rgba(168, 137, 79,0.04)' : 'rgba(168, 137, 79,0.03)',
                    }}
                  >
                    <p style={{ fontSize: '12px', color: colors.secondaryText, margin: 0 }}>
                      <Info
                        size={12}
                        style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }}
                      />
                      Numbers can be re-taken any time on the measurements page.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Section 3: Fabric */}
        <div style={sectionStyle}>
          <button style={sectionHeaderStyle} onClick={() => toggleSection('fabric')}>
            <span style={sectionTitleStyle}>
              <Scissors size={18} style={sectionIconStyle} />
              Fabric
            </span>
            {expandedSections.fabric ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {expandedSections.fabric && (
            <div style={sectionContentStyle}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Who provides the fabric?</label>
                <div style={choiceGroupStyle}>
                  <button
                    style={choiceButtonStyle(fabricProvider === 'tailor')}
                    onClick={() => setFabricProvider('tailor')}
                  >
                    The tailor sources it
                  </button>
                  <button
                    style={choiceButtonStyle(fabricProvider === 'user')}
                    onClick={() => setFabricProvider('user')}
                  >
                    I bring my own
                  </button>
                </div>
                <div style={helperTextStyle}>
                  {fabricProvider === 'tailor'
                    ? 'The fabric cost is added to your quote after the consultation.'
                    : 'Bring the fabric to the consultation so it can be checked before cutting.'}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Fabric you have in mind</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. navy wool suiting, kente, silk crepe"
                  value={fabricType}
                  onChange={(e) => setFabricType(e.target.value)}
                  maxLength={100}
                />
                <div style={helperTextStyle}>
                  Leave blank to go with whatever the style was designed in.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Urgency */}
        <div style={sectionStyle}>
          <button style={sectionHeaderStyle} onClick={() => toggleSection('urgency')}>
            <span style={sectionTitleStyle}>
              <Clock size={18} style={sectionIconStyle} />
              How soon do you need it?
            </span>
            {expandedSections.urgency ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {expandedSections.urgency && (
            <div style={sectionContentStyle}>
              <p style={{ fontSize: '13px', color: colors.secondaryText, marginTop: 0, marginBottom: '12px' }}>
                The tier sets your consultation fee and how quickly the tailor replies.
              </p>
              {tierRows.map((tier) => {
                const look = TIER_PRESENTATION[tier.name] || TIER_PRESENTATION.normal;
                const Icon = look.icon;
                return (
                  <div
                    key={tier.name}
                    style={urgencyCardStyle(tierName === tier.name, look.color)}
                    onClick={() => setTierName(tier.name)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon size={16} color={look.color} />
                        <div style={urgencyNameStyle}>{look.label}</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: colors.primary }}>
                          {formatMoney(tier.fee)}
                        </div>
                      </div>
                      <div style={urgencyDescriptionStyle}>{tier.description || look.blurb}</div>
                      <div style={{ fontSize: '11px', color: colors.secondaryText, marginTop: '2px' }}>
                        <CalendarIcon size={10} style={{ display: 'inline', marginRight: '4px' }} />
                        {look.response}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={urgencyBadgeStyle(look.color)}>{look.label}</div>
                      {tierName === tier.name && (
                        <Check size={16} color={colors.primary} style={{ marginTop: '4px' }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 5: Consultation slot */}
        <div style={sectionStyle}>
          <button style={sectionHeaderStyle} onClick={() => toggleSection('slot')}>
            <span style={sectionTitleStyle}>
              <CalendarIcon size={18} style={sectionIconStyle} />
              Consultation slot
            </span>
            {expandedSections.slot ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {expandedSections.slot && (
            <div style={sectionContentStyle}>
              {slotDates.length === 0 ? (
                <p style={{ fontSize: '13px', color: colors.secondaryText, margin: 0 }}>
                  No slots are open for this tier right now. Try another tier or check back soon.
                </p>
              ) : (
                <>
                  <label style={labelStyle}>Date</label>
                  <div style={{ ...choiceGroupStyle, marginBottom: '16px' }}>
                    {slotDates.map((date) => (
                      <button
                        key={date}
                        style={choiceButtonStyle(slotDate === date)}
                        onClick={() => setSlotDate(date)}
                      >
                        {formatDate(date)}
                      </button>
                    ))}
                  </div>

                  <label style={labelStyle}>Time</label>
                  <div style={choiceGroupStyle}>
                    {slotsOnDate.map((slot) => (
                      <button
                        key={slot.id}
                        style={choiceButtonStyle(slotId === slot.id)}
                        onClick={() => setSlotId(slot.id)}
                      >
                        {timeRange(slot)}
                      </button>
                    ))}
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <label style={labelStyle}>What is the appointment for?</label>
                    <div style={choiceGroupStyle}>
                      {APPOINTMENT_TYPES.map((type) => (
                        <button
                          key={type.value}
                          style={choiceButtonStyle(appointmentType === type.value)}
                          onClick={() => setAppointmentType(type.value)}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Section 6: Contact */}
        <div style={sectionStyle}>
          <button style={sectionHeaderStyle} onClick={() => toggleSection('contact')}>
            <span style={sectionTitleStyle}>
              <Mail size={18} style={sectionIconStyle} />
              How to reach you
            </span>
            {expandedSections.contact ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {expandedSections.contact && (
            <div style={sectionContentStyle}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                }}
              >
                <div>
                  <label style={labelStyle}>Phone number</label>
                  <input
                    style={inputStyle}
                    placeholder="+233 XX XXX XXXX"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    style={inputStyle}
                    type="email"
                    placeholder="name@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
              </div>
              <div style={helperTextStyle}>
                Delivery is arranged after the tailor confirms the quote.
              </div>
            </div>
          )}
        </div>

        {/* Section 7: Quantity & notes */}
        <div style={sectionStyle}>
          <button style={sectionHeaderStyle} onClick={() => toggleSection('notes')}>
            <span style={sectionTitleStyle}>
              <FileText size={18} style={sectionIconStyle} />
              Quantity & requests
            </span>
            {expandedSections.notes ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {expandedSections.notes && (
            <div style={sectionContentStyle}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>How many pieces?</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.80)',
                      border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.text,
                    }}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Minus size={16} />
                  </button>
                  <span
                    style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      color: colors.text,
                      minWidth: '40px',
                      textAlign: 'center',
                    }}
                  >
                    {quantity}
                  </span>
                  <button
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.80)',
                      border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.text,
                    }}
                    onClick={() => setQuantity((q) => Math.min(100, q + 1))}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Anything the tailor should know</label>
                <textarea
                  style={textareaStyle}
                  placeholder="Modifications, a deadline, fitting preferences, colour changes…"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                />
                <div style={helperTextStyle}>
                  The more detail here, the closer the first quote will be.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Terms */}
        <div
          style={{
            ...sectionStyle,
            borderColor: isDark ? 'rgba(168, 137, 79,0.12)' : 'rgba(168, 137, 79,0.15)',
          }}
        >
          <div style={{ padding: '16px 20px' }}>
            <div style={termsCheckboxStyle}>
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  marginTop: '2px',
                  accentColor: colors.primary,
                  cursor: 'pointer',
                }}
              />
              <div>
                <span style={{ fontSize: '13px', color: colors.text }}>
                  I confirm the details above are correct, and I understand that:
                </span>
                <ul
                  style={{
                    fontSize: '12px',
                    color: colors.secondaryText,
                    margin: '4px 0 0',
                    paddingLeft: '16px',
                  }}
                >
                  <li>This is a request the tailor reviews before any work starts</li>
                  <li>
                    The {formatMoney(selectedTier?.fee || 0)} consultation fee is charged for the
                    booking
                  </li>
                  <li>The final garment price is confirmed after the consultation</li>
                  <li>Reply time follows the tier selected above</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <div>
            <div style={{ fontSize: '12px', color: colors.secondaryText }}>Your request</div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>
                {quantity} {quantity > 1 ? 'pieces' : 'piece'}
              </span>
              <span style={{ fontSize: '12px', color: colors.secondaryText }}>•</span>
              <span style={{ fontSize: '12px', color: colors.secondaryText }}>
                {(TIER_PRESENTATION[tierName] || {}).label} · {formatMoney(selectedTier?.fee || 0)}
              </span>
              {selectedSlot && (
                <>
                  <span style={{ fontSize: '12px', color: colors.secondaryText }}>•</span>
                  <span style={{ fontSize: '12px', color: colors.secondaryText }}>
                    {formatDate(selectedSlot.date)} {timeRange(selectedSlot)}
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            style={submitButtonStyle}
            onClick={handleSubmit}
            disabled={!agreedToTerms || submitting}
            onMouseEnter={(e) => {
              if (agreedToTerms && !submitting) {
                e.currentTarget.style.background = isDark ? '#C9B183' : '#8A6F3A';
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.primary;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {submitting ? (
              <>
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(0,0,0,0.10)',
                    borderTop: '2px solid #1A1A1A',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block',
                  }}
                />
                Sending…
              </>
            ) : (
              <>
                <Send size={18} />
                Send request
              </>
            )}
          </button>
        </div>

        {/* Success */}
        <div style={successOverlayStyle}>
          <div style={successCardStyle}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle size={32} color="#1A1A1A" />
            </div>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: colors.heading,
                marginBottom: '8px',
              }}
            >
              Request sent
            </h2>
            <p style={{ fontSize: '14px', color: colors.secondaryText, marginBottom: '8px' }}>
              The tailor has your details for {style.name}.
            </p>
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: isDark ? 'rgba(168, 137, 79,0.06)' : 'rgba(168, 137, 79,0.04)',
                marginBottom: '16px',
              }}
            >
              <p style={{ fontSize: '13px', color: colors.text, margin: 0 }}>
                <CalendarIcon
                  size={14}
                  style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }}
                />
                {createdAppointment
                  ? `${formatDate(createdAppointment.slot_date)} · ${createdAppointment.slot_time}`
                  : ''}
              </p>
              <p style={{ fontSize: '12px', color: colors.secondaryText, margin: '6px 0 0' }}>
                {(TIER_PRESENTATION[tierName] || TIER_PRESENTATION.normal).response}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  background: colors.primary,
                  color: '#1A1A1A',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                }}
                onClick={() => navigate('/appointments')}
              >
                View my appointments
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setCreatedAppointment(null);
                  navigate('/gallery');
                }}
              >
                Keep browsing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleOrderPage;
