import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  CheckCircle,
  ChevronLeft,
  Clock,
  CreditCard,
  FileText,
  Info,
  Plus,
  Ruler,
  Scissors,
  Sparkles,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../providers/ToastProvider';
import { useAuth } from '../providers/AuthProvider';
import { appointments as appointmentsApi, people as peopleApi, payments } from '../api/endpoints';
import { adaptAppointment, errorText, formatMoney } from '../api/adapters';

// AppointmentTier.name choices. Fee and description come from the server; the
// label, blurb and colour are presentation the API does not carry.
const TIER_PRESENTATION = {
  normal: {
    label: 'Standard',
    blurb: 'Regular queue, standard slot',
    response: 'Reply within 3–5 business days',
    color: '#10B981',
    icon: Clock,
  },
  urgent: {
    label: 'Priority',
    blurb: 'Moved up the queue',
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

// Appointment.APPOINTMENT_TYPE_CHOICES minus style_order: the backend requires a
// style, a person and a measurement for that one, so it is booked from the
// style's own page instead.
const SERVICE_TYPES = [
  {
    value: 'consultation',
    label: 'Consultation',
    blurb: 'Talk through ideas and options',
    icon: Users,
    color: '#A8894F',
  },
  {
    value: 'custom_order',
    label: 'Custom piece',
    blurb: 'Something made from scratch',
    icon: Scissors,
    color: '#8B5CF6',
  },
  {
    value: 'fitting',
    label: 'Fitting',
    blurb: 'Try on and adjust work in progress',
    icon: Ruler,
    color: '#3B82F6',
  },
  {
    value: 'other',
    label: 'Something else',
    blurb: 'Tell us in the notes',
    icon: FileText,
    color: '#10B981',
  },
];

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

const STEPS = [
  { id: 1, label: 'Service' },
  { id: 2, label: 'Date' },
  { id: 3, label: 'Details' },
  { id: 4, label: 'Contact' },
];

// start_time/end_time arrive as "HH:MM:SS".
const timeRange = (slot) => {
  const trim = (t) => (t || '').slice(0, 5);
  return `${trim(slot.start_time)} – ${trim(slot.end_time)}`;
};

// Slot dates are plain YYYY-MM-DD strings; splitting them beats new Date(iso),
// which would read them as UTC midnight and could shift the day.
const dateParts = (iso) => {
  if (!iso) return null;
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((dt - today) / 864e5);
  return {
    day: String(d).padStart(2, '0'),
    month: dt.toLocaleDateString('en-GB', { month: 'short' }),
    weekday: dt.toLocaleDateString('en-GB', { weekday: 'short' }),
    long: dt.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    relative: diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : '',
  };
};

// Express bookings draw on their own pool; urgent shares the normal one.
const seatsLeft = (slot, isExpress) =>
  isExpress
    ? Math.max(0, (slot.express_slots ?? 0) - (slot.booked_express_count ?? 0))
    : Math.max(0, (slot.normal_slots ?? 0) - (slot.booked_normal_count ?? 0));

const BookAppointmentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { colors, theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const { showToast } = useToast();
  const { isAuthenticated, user } = useAuth();

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [currentStep, setCurrentStep] = useState(1);

  const [tiers, setTiers] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [serviceType, setServiceType] = useState('consultation');
  const [tierName, setTierName] = useState('normal');
  const [slotDate, setSlotDate] = useState('');
  const [slotId, setSlotId] = useState('');

  const [people, setPeople] = useState([]);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [personMeasurements, setPersonMeasurements] = useState([]);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState('');
  const [showNewPersonForm, setShowNewPersonForm] = useState(false);
  const [newPerson, setNewPerson] = useState({
    name: '',
    relationship: 'other',
    phone: '',
    email: '',
    gender: '',
  });
  const [savingPerson, setSavingPerson] = useState(false);

  const [fabricProvider, setFabricProvider] = useState('tailor');
  const [fabricType, setFabricType] = useState('');
  const [quantity, setQuantity] = useState(1);

  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  // ProductDetails sends the piece the customer was looking at through router
  // state, so the studio knows what the conversation is about.
  const [notes, setNotes] = useState(() =>
    location.state?.productName ? `About: ${location.state.productName}` : ''
  );

  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  // Tiers and slots are public, so the form fills in before sign-in too.
  useEffect(() => {
    let cancelled = false;
    setLoadingOptions(true);
    setOptionsError('');
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
      .catch((err) => {
        if (!cancelled) setOptionsError(errorText(err, 'Could not load the booking calendar.'));
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Saved people live behind auth; a signed-out visitor fills the rest of the
  // form and is asked to sign in at submit.
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
        if (!cancelled) setPeople(rows || []);
      })
      .catch(() => {
        // No saved people is a normal state; the booking works without one.
        if (!cancelled) setPeople([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Attaching the person's active measurement saves the studio a phone call.
  useEffect(() => {
    if (!selectedPersonId) {
      setPersonMeasurements([]);
      setSelectedMeasurementId('');
      return undefined;
    }
    let cancelled = false;
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
          setPersonMeasurements([]);
          setSelectedMeasurementId('');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPersonId]);

  useEffect(() => {
    if (!user) return;
    setContactPhone((current) => current || user.phone || '');
    setContactEmail((current) => current || user.email || '');
  }, [user]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep, created]);

  const isExpress = tierName === 'express';

  const slotsForTier = useMemo(
    () => slots.filter((s) => (isExpress ? !s.is_express_full : !s.is_normal_full)),
    [slots, isExpress]
  );

  const slotDates = useMemo(
    () => [...new Set(slotsForTier.map((s) => s.date))].sort(),
    [slotsForTier]
  );

  const slotsOnDate = useMemo(
    () => slotsForTier.filter((s) => s.date === slotDate),
    [slotsForTier, slotDate]
  );

  // Switching tier changes which slots are open, so keep the selection valid.
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

  const selectedTier = tiers.find((t) => t.name === tierName) || null;
  const selectedSlot = slots.find((s) => s.id === slotId) || null;
  const selectedPerson = people.find((p) => p.id === selectedPersonId) || null;
  const selectedService = SERVICE_TYPES.find((s) => s.value === serviceType) || SERVICE_TYPES[0];
  const fee = Number(selectedTier?.fee ?? 0);
  // Fabric only matters once something is being made.
  const needsFabric = serviceType !== 'consultation';

  const handleSavePerson = async () => {
    if (!isAuthenticated) {
      showToast('Sign in first to save people.', 'info');
      navigate('/login', { state: { from: '/appointments/book' } });
      return;
    }
    if (!newPerson.name.trim()) {
      showToast('Give this person a name.', 'info');
      return;
    }
    setSavingPerson(true);
    try {
      const person = await peopleApi.create({
        name: newPerson.name.trim(),
        relationship: newPerson.relationship,
        phone: newPerson.phone.trim(),
        email: newPerson.email.trim(),
        gender: newPerson.gender,
      });
      setPeople((prev) => [...prev, person]);
      setSelectedPersonId(person.id);
      setShowNewPersonForm(false);
      setNewPerson({ name: '', relationship: 'other', phone: '', email: '', gender: '' });
      showToast(`${person.name} saved.`, 'success');
    } catch (err) {
      showToast(errorText(err, 'Could not save that person.'), 'error');
    } finally {
      setSavingPerson(false);
    }
  };

  const stepIsValid = (step) => {
    if (step === 1) return Boolean(serviceType && tierName);
    if (step === 2) return Boolean(selectedSlot);
    if (step === 4) return Boolean(contactPhone.trim());
    return true;
  };

  const stepComplaint = (step) => {
    if (step === 1) return 'Pick a service and how fast you need it.';
    if (step === 2) return 'Pick a date and a time that is still open.';
    return 'Add a phone number the studio can reach you on.';
  };

  const nextStep = () => {
    if (!stepIsValid(currentStep)) {
      showToast(stepComplaint(currentStep), 'info');
      return;
    }
    setCurrentStep((s) => Math.min(4, s + 1));
  };

  const prevStep = () => setCurrentStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      showToast('Sign in to confirm this booking.', 'info');
      navigate('/login', { state: { from: '/appointments/book' } });
      return;
    }
    if (!selectedSlot) {
      showToast('Pick a date and time first.', 'info');
      setCurrentStep(2);
      return;
    }
    if (!contactPhone.trim()) {
      showToast('Add a phone number the studio can reach you on.', 'info');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        slot_id: selectedSlot.id,
        tier_name: tierName,
        appointment_type: serviceType,
        // The model allows a blank provider, and a plain consultation has no
        // fabric to speak of yet.
        fabric_provider: needsFabric ? fabricProvider : '',
        fabric_type: needsFabric ? fabricType.trim() : '',
        quantity: Number(quantity) || 1,
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim(),
        additional_notes: notes.trim(),
      };
      // Both are optional without a style attached, but sending the person's
      // measurement means the studio has the numbers before the meeting.
      if (selectedPersonId) payload.person_id = selectedPersonId;
      if (selectedPersonId && selectedMeasurementId) payload.measurement_id = selectedMeasurementId;

      const row = await appointmentsApi.create(payload);
      setCreated(adaptAppointment(row));
    } catch (err) {
      showToast(errorText(err, 'Could not book that appointment.'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayNow = async () => {
    if (!created) return;
    setPaying(true);
    try {
      const payment = await payments.initialize({
        appointment_id: created.id,
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
      setPaying(false);
    }
  };

  // ------------------------------------------------------------------ styles

  const pageStyle = {
    backgroundColor: colors.mainBg,
    minHeight: '100vh',
    paddingBottom: '40px',
  };

  const containerStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: isMobile ? '12px' : '16px',
  };

  const backButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '12px',
    background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)'}`,
    color: colors.secondaryText,
    fontSize: '13px',
    cursor: 'pointer',
    marginBottom: '16px',
  };

  const headerStyle = { textAlign: 'center', marginBottom: isMobile ? '24px' : '32px' };

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 14px',
    borderRadius: '20px',
    background: isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.05)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)'}`,
    fontSize: '11px',
    fontWeight: 500,
    color: colors.primary,
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
    marginBottom: '10px',
  };

  const titleStyle = {
    fontSize: isMobile ? '24px' : isTablet ? '32px' : '38px',
    fontWeight: 800,
    color: colors.heading,
    margin: 0,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  };

  const descStyle = {
    fontSize: isMobile ? '14px' : '16px',
    color: colors.secondaryText,
    lineHeight: 1.6,
    marginTop: '8px',
    maxWidth: '480px',
    marginLeft: 'auto',
    marginRight: 'auto',
  };

  const progressStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: isMobile ? '24px' : '32px',
  };

  const stepIndicatorStyle = (active, completed) => ({
    width: isMobile ? '32px' : '40px',
    height: isMobile ? '32px' : '40px',
    minWidth: isMobile ? '32px' : '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      completed || active
        ? colors.primary
        : isDark
        ? 'rgba(26,26,26,0.60)'
        : 'rgba(255,255,255,0.80)',
    color: completed || active ? '#1A1A1A' : colors.secondaryText,
    border: `2px solid ${
      completed || active
        ? colors.primary
        : isDark
        ? 'rgba(168, 137, 79,0.10)'
        : 'rgba(168, 137, 79,0.15)'
    }`,
    fontWeight: 700,
    fontSize: isMobile ? '12px' : '14px',
    transition: 'all 0.3s ease',
    cursor: completed ? 'pointer' : 'default',
  });

  const stepLineStyle = (completed) => ({
    flex: 1,
    height: '2px',
    background: completed
      ? colors.primary
      : isDark
      ? 'rgba(168, 137, 79,0.10)'
      : 'rgba(168, 137, 79,0.15)',
    margin: '0 8px',
    maxWidth: '60px',
    transition: 'all 0.3s ease',
  });

  const stepLabelStyle = {
    fontSize: isMobile ? '8px' : '10px',
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: '4px',
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
  };

  const cardStyle = {
    padding: isMobile ? '20px' : '28px',
    borderRadius: '16px',
    background: isDark ? 'rgba(20,20,20,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.06)' : 'rgba(168, 137, 79,0.08)'}`,
    marginBottom: '20px',
  };

  const cardTitleStyle = {
    fontSize: isMobile ? '16px' : '18px',
    fontWeight: 700,
    color: colors.heading,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const sectionLabelStyle = {
    fontSize: '13px',
    fontWeight: 600,
    color: colors.text,
    marginBottom: '10px',
    marginTop: '20px',
  };

  const optionGridStyle = (columns) => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr 1fr' : `repeat(${columns}, 1fr)`,
    gap: isMobile ? '10px' : '14px',
  });

  const optionCardStyle = (isActive, color) => ({
    padding: isMobile ? '14px 12px' : '18px 16px',
    borderRadius: '12px',
    background: isActive
      ? isDark
        ? `${color}15`
        : `${color}08`
      : isDark
      ? 'rgba(26,26,26,0.40)'
      : 'rgba(255,255,255,0.80)',
    border: `2px solid ${
      isActive ? color : isDark ? 'rgba(168, 137, 79,0.06)' : 'rgba(168, 137, 79,0.08)'
    }`,
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.3s ease',
  });

  const optionIconStyle = (color) => ({
    width: isMobile ? '40px' : '48px',
    height: isMobile ? '40px' : '48px',
    borderRadius: '50%',
    background: isDark ? `${color}20` : `${color}10`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 8px',
    color,
  });

  const optionTitleStyle = {
    fontSize: isMobile ? '12px' : '14px',
    fontWeight: 600,
    color: colors.text,
    margin: 0,
  };

  const optionBlurbStyle = {
    fontSize: isMobile ? '9px' : '11px',
    color: colors.secondaryText,
    marginTop: '2px',
    lineHeight: 1.4,
  };

  const optionMetaStyle = (color) => ({
    fontSize: isMobile ? '10px' : '12px',
    fontWeight: 700,
    color,
    marginTop: '6px',
  });

  const dateGridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)',
    gap: isMobile ? '8px' : '10px',
  };

  const dateCardStyle = (isActive) => ({
    padding: isMobile ? '10px 6px' : '12px 8px',
    borderRadius: '10px',
    background: isActive
      ? colors.primary
      : isDark
      ? 'rgba(26,26,26,0.40)'
      : 'rgba(255,255,255,0.80)',
    border: `1px solid ${
      isActive ? colors.primary : isDark ? 'rgba(168, 137, 79,0.06)' : 'rgba(168, 137, 79,0.08)'
    }`,
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    color: isActive ? '#1A1A1A' : colors.text,
  });

  const timeGridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
    gap: '8px',
  };

  const timeCardStyle = (isActive) => ({
    padding: isMobile ? '10px 8px' : '12px 10px',
    borderRadius: '10px',
    background: isActive
      ? colors.primary
      : isDark
      ? 'rgba(26,26,26,0.40)'
      : 'rgba(255,255,255,0.80)',
    border: `1px solid ${
      isActive ? colors.primary : isDark ? 'rgba(168, 137, 79,0.06)' : 'rgba(168, 137, 79,0.08)'
    }`,
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    color: isActive ? '#1A1A1A' : colors.text,
    fontSize: isMobile ? '12px' : '13px',
    fontWeight: isActive ? 700 : 500,
  });

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.80)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)'}`,
    color: colors.text,
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const textareaStyle = { ...inputStyle, minHeight: '90px', resize: 'vertical' };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: 500,
    color: colors.text,
    display: 'block',
    marginBottom: '4px',
  };

  const formGridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: '14px',
  };

  const noticeStyle = {
    display: 'flex',
    gap: '8px',
    padding: '12px 14px',
    borderRadius: '10px',
    background: isDark ? 'rgba(168, 137, 79,0.06)' : 'rgba(168, 137, 79,0.04)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.12)'}`,
    fontSize: '12px',
    color: colors.secondaryText,
    lineHeight: 1.6,
    marginTop: '16px',
  };

  const summaryRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '8px 0',
    borderBottom: `1px solid ${isDark ? 'rgba(168, 137, 79,0.06)' : 'rgba(168, 137, 79,0.08)'}`,
    fontSize: '13px',
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginTop: isMobile ? '16px' : '20px',
  };

  const buttonStyle = (isPrimary = false) => ({
    padding: isMobile ? '12px 20px' : '14px 28px',
    borderRadius: '10px',
    background: isPrimary ? colors.primary : 'transparent',
    color: isPrimary ? '#1A1A1A' : colors.secondaryText,
    border: isPrimary
      ? 'none'
      : `1px solid ${isDark ? 'rgba(168, 137, 79,0.15)' : 'rgba(168, 137, 79,0.20)'}`,
    cursor: 'pointer',
    fontSize: isMobile ? '13px' : '14px',
    fontWeight: isPrimary ? 600 : 400,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
  });

  const chipButtonStyle = (isActive) => ({
    padding: '10px 14px',
    borderRadius: '10px',
    background: isActive
      ? colors.primary
      : isDark
      ? 'rgba(26,26,26,0.40)'
      : 'rgba(255,255,255,0.80)',
    border: `1px solid ${
      isActive ? colors.primary : isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)'
    }`,
    color: isActive ? '#1A1A1A' : colors.text,
    fontSize: '13px',
    fontWeight: isActive ? 600 : 400,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  });

  const skeletonBlock = (height) => (
    <div
      className="skeleton"
      style={{ height, borderRadius: '12px', marginBottom: '10px' }}
    />
  );

  // ------------------------------------------------------------------ render

  if (loadingOptions) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div style={headerStyle}>
            <div style={badgeStyle}>
              <Sparkles size={14} />
              Book now
            </div>
            <h1 style={titleStyle}>
              Book your <span style={{ color: colors.primary }}>appointment</span>
            </h1>
          </div>
          <div style={cardStyle}>
            {skeletonBlock('20px')}
            {skeletonBlock('80px')}
            {skeletonBlock('80px')}
            {skeletonBlock('40px')}
          </div>
        </div>
      </div>
    );
  }

  if (optionsError) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 24px' }}>
            <AlertCircle size={40} color="#EF4444" style={{ marginBottom: '12px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: colors.heading, margin: 0 }}>
              Booking unavailable
            </h2>
            <p style={{ ...descStyle, marginBottom: '20px' }}>{optionsError}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button style={buttonStyle(true)} onClick={() => setReloadKey((k) => k + 1)}>
                Try again
              </button>
              <button style={buttonStyle(false)} onClick={() => navigate('/')}>
                Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Booking confirmed — everything below is real, from the created row.
  if (created) {
    const parts = dateParts(created.date);
    const owed = created.finalPrice != null ? created.finalPrice : created.tierFee;
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div style={cardStyle}>
            <div style={{ textAlign: 'center', padding: isMobile ? '20px 0' : '32px 0' }}>
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
                  color: '#1A1A1A',
                }}
              >
                <CheckCircle size={32} />
              </div>
              <h2
                style={{
                  fontSize: isMobile ? '20px' : '24px',
                  fontWeight: 700,
                  color: colors.heading,
                  marginBottom: '8px',
                }}
              >
                Booking sent
              </h2>
              <p style={{ fontSize: isMobile ? '13px' : '15px', color: colors.secondaryText }}>
                The studio reviews it and confirms your slot. You can follow it from your
                appointments any time.
              </p>

              <div
                style={{
                  marginTop: '20px',
                  padding: '16px',
                  borderRadius: '12px',
                  textAlign: 'left',
                  background: isDark ? 'rgba(168, 137, 79,0.05)' : 'rgba(168, 137, 79,0.03)',
                  border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.10)'}`,
                }}
              >
                <div style={summaryRowStyle}>
                  <span style={{ color: colors.secondaryText }}>When</span>
                  <span style={{ color: colors.text, fontWeight: 600, textAlign: 'right' }}>
                    {parts ? parts.long : created.date}
                    <br />
                    {created.time}
                  </span>
                </div>
                <div style={summaryRowStyle}>
                  <span style={{ color: colors.secondaryText }}>Service</span>
                  <span style={{ color: colors.text, fontWeight: 600 }}>{created.typeLabel}</span>
                </div>
                <div style={summaryRowStyle}>
                  <span style={{ color: colors.secondaryText }}>Speed</span>
                  <span style={{ color: colors.text, fontWeight: 600 }}>{created.tierName}</span>
                </div>
                <div style={{ ...summaryRowStyle, borderBottom: 'none' }}>
                  <span style={{ color: colors.secondaryText }}>Status</span>
                  <span style={{ color: colors.primary, fontWeight: 700 }}>
                    {created.statusLabel}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  marginTop: '20px',
                }}
              >
                {/* The booking fee is what is owed until the studio quotes the work. */}
                {!created.isPaid && owed > 0 && (
                  <button style={buttonStyle(true)} onClick={handlePayNow} disabled={paying}>
                    <CreditCard size={16} />
                    {paying ? 'Opening Paystack…' : `Pay ${formatMoney(owed)}`}
                  </button>
                )}
                <button
                  style={buttonStyle(!(!created.isPaid && owed > 0))}
                  onClick={() => navigate(`/appointments/${created.id}`)}
                >
                  View booking
                  <ArrowRight size={16} />
                </button>
                <button style={buttonStyle(false)} onClick={() => navigate('/appointments')}>
                  All appointments
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const noSlotsAtAll = slots.length === 0;

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <button style={backButtonStyle} onClick={() => navigate(-1)}>
          <ChevronLeft size={16} />
          Back
        </button>

        <div style={headerStyle}>
          <div style={badgeStyle}>
            <Sparkles size={14} />
            Book now
          </div>
          <h1 style={titleStyle}>
            Book your <span style={{ color: colors.primary }}>appointment</span>
          </h1>
          <p style={descStyle}>
            Pick a service, take one of the open slots, and tell the studio what you need.
          </p>
        </div>

        {/* Progress */}
        <div style={progressStyle}>
          {STEPS.map((step) => {
            const active = currentStep === step.id;
            const completed = currentStep > step.id;
            return (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: step.id === STEPS.length ? 0 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <div
                    style={stepIndicatorStyle(active, completed)}
                    onClick={() => completed && setCurrentStep(step.id)}
                  >
                    {completed ? <Check size={isMobile ? 14 : 16} /> : step.id}
                  </div>
                  {step.id < STEPS.length && <div style={stepLineStyle(completed)} />}
                </div>
                <div style={stepLabelStyle}>{step.label}</div>
              </div>
            );
          })}
        </div>

        {/* Step 1 — service and speed */}
        {currentStep === 1 && (
          <div style={cardStyle}>
            <div style={cardTitleStyle}>
              <CalendarIcon size={20} color={colors.primary} />
              What do you need?
            </div>
            <div style={optionGridStyle(4)}>
              {SERVICE_TYPES.map((service) => {
                const Icon = service.icon;
                const active = serviceType === service.value;
                return (
                  <div
                    key={service.value}
                    style={optionCardStyle(active, service.color)}
                    onClick={() => setServiceType(service.value)}
                  >
                    <div style={optionIconStyle(service.color)}>
                      <Icon size={isMobile ? 18 : 22} />
                    </div>
                    <div style={optionTitleStyle}>{service.label}</div>
                    <div style={optionBlurbStyle}>{service.blurb}</div>
                  </div>
                );
              })}
            </div>

            <div style={sectionLabelStyle}>How fast do you need it?</div>
            {tiers.length === 0 ? (
              <div style={{ fontSize: '13px', color: colors.secondaryText }}>
                No booking tiers are set up yet. Call the studio to arrange a visit.
              </div>
            ) : (
              <div style={optionGridStyle(tiers.length)}>
                {tiers.map((tier) => {
                  const presentation = TIER_PRESENTATION[tier.name] || {
                    label: tier.name,
                    blurb: tier.description || '',
                    response: '',
                    color: colors.primary,
                    icon: Clock,
                  };
                  const Icon = presentation.icon;
                  const active = tierName === tier.name;
                  return (
                    <div
                      key={tier.id}
                      style={optionCardStyle(active, presentation.color)}
                      onClick={() => setTierName(tier.name)}
                    >
                      <div style={optionIconStyle(presentation.color)}>
                        <Icon size={isMobile ? 18 : 22} />
                      </div>
                      <div style={optionTitleStyle}>{presentation.label}</div>
                      <div style={optionBlurbStyle}>
                        {tier.description || presentation.blurb}
                      </div>
                      <div style={optionMetaStyle(presentation.color)}>
                        {formatMoney(tier.fee)}
                      </div>
                      {presentation.response && (
                        <div style={optionBlurbStyle}>{presentation.response}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={noticeStyle}>
              <Info size={16} color={colors.primary} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>
                Ordering one of the studio's styles? Open the style from the gallery and use
                “Request this style” instead — that booking carries the measurements with it.
              </span>
            </div>
          </div>
        )}

        {/* Step 2 — date and time, from the real slot calendar */}
        {currentStep === 2 && (
          <div style={cardStyle}>
            <div style={cardTitleStyle}>
              <Clock size={20} color={colors.primary} />
              Pick a slot
            </div>

            {noSlotsAtAll ? (
              <div style={{ fontSize: '13px', color: colors.secondaryText, lineHeight: 1.7 }}>
                The studio has not opened any dates yet. Check back shortly, or call to arrange a
                visit directly.
              </div>
            ) : slotDates.length === 0 ? (
              <div style={{ fontSize: '13px', color: colors.secondaryText, lineHeight: 1.7 }}>
                Every {TIER_PRESENTATION[tierName]?.label || tierName} slot is taken. Try another
                speed on the previous step.
              </div>
            ) : (
              <>
                <div style={{ ...sectionLabelStyle, marginTop: 0 }}>Date</div>
                <div style={dateGridStyle}>
                  {slotDates.map((date) => {
                    const parts = dateParts(date);
                    const active = slotDate === date;
                    return (
                      <div key={date} style={dateCardStyle(active)} onClick={() => setSlotDate(date)}>
                        <div
                          style={{
                            fontSize: isMobile ? '9px' : '11px',
                            color: active ? 'rgba(26,26,26,0.60)' : colors.secondaryText,
                          }}
                        >
                          {parts?.weekday}
                        </div>
                        <div
                          style={{
                            fontSize: isMobile ? '16px' : '20px',
                            fontWeight: 700,
                            color: active ? '#1A1A1A' : colors.text,
                          }}
                        >
                          {parts?.day}
                        </div>
                        <div
                          style={{
                            fontSize: isMobile ? '9px' : '10px',
                            color: active ? 'rgba(26,26,26,0.60)' : colors.secondaryText,
                          }}
                        >
                          {parts?.relative || parts?.month}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={sectionLabelStyle}>Time</div>
                <div style={timeGridStyle}>
                  {slotsOnDate.map((slot) => {
                    const active = slotId === slot.id;
                    const left = seatsLeft(slot, isExpress);
                    return (
                      <div key={slot.id} style={timeCardStyle(active)} onClick={() => setSlotId(slot.id)}>
                        <div>{timeRange(slot)}</div>
                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: 500,
                            marginTop: '2px',
                            color: active ? 'rgba(26,26,26,0.60)' : colors.secondaryText,
                          }}
                        >
                          {left === 1 ? '1 place left' : `${left} places left`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3 — who it is for, and fabric */}
        {currentStep === 3 && (
          <div style={cardStyle}>
            <div style={cardTitleStyle}>
              <Users size={20} color={colors.primary} />
              Who is this for?
            </div>

            {!isAuthenticated ? (
              <div style={{ fontSize: '13px', color: colors.secondaryText, lineHeight: 1.7 }}>
                Sign in to book for someone whose measurements you have saved. You can also carry
                on and book for yourself.
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button style={chipButtonStyle(!selectedPersonId)} onClick={() => setSelectedPersonId('')}>
                    <User size={14} />
                    Myself
                  </button>
                  {people.map((person) => (
                    <button
                      key={person.id}
                      style={chipButtonStyle(selectedPersonId === person.id)}
                      onClick={() => setSelectedPersonId(person.id)}
                    >
                      {person.name}
                    </button>
                  ))}
                  <button
                    style={chipButtonStyle(false)}
                    onClick={() => setShowNewPersonForm((v) => !v)}
                  >
                    {showNewPersonForm ? <X size={14} /> : <Plus size={14} />}
                    {showNewPersonForm ? 'Cancel' : 'Someone new'}
                  </button>
                </div>

                {showNewPersonForm && (
                  <div
                    style={{
                      marginTop: '14px',
                      padding: '14px',
                      borderRadius: '12px',
                      background: isDark ? 'rgba(26,26,26,0.40)' : 'rgba(255,255,255,0.70)',
                      border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.12)'}`,
                    }}
                  >
                    <div style={formGridStyle}>
                      <div>
                        <label style={labelStyle}>Name *</label>
                        <input
                          style={inputStyle}
                          value={newPerson.name}
                          placeholder="Their full name"
                          onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Relationship</label>
                        <select
                          style={inputStyle}
                          value={newPerson.relationship}
                          onChange={(e) =>
                            setNewPerson({ ...newPerson, relationship: e.target.value })
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
                          value={newPerson.phone}
                          placeholder="+233 24 000 0000"
                          onChange={(e) => setNewPerson({ ...newPerson, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Email</label>
                        <input
                          style={inputStyle}
                          type="email"
                          value={newPerson.email}
                          placeholder="them@email.com"
                          onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <button
                      style={{ ...buttonStyle(true), marginTop: '12px' }}
                      onClick={handleSavePerson}
                      disabled={savingPerson}
                    >
                      {savingPerson ? 'Saving…' : 'Save person'}
                    </button>
                  </div>
                )}

                {selectedPerson && (
                  <div style={noticeStyle}>
                    <Ruler size={16} color={colors.primary} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>
                      {selectedMeasurementId
                        ? `${selectedPerson.name}'s saved measurements go with this booking, so the studio has the numbers before you arrive.`
                        : `${selectedPerson.name} has no saved measurements yet. The studio will take them at the appointment, or you can add them from My measurements.`}
                    </span>
                  </div>
                )}
                {selectedPerson && !selectedMeasurementId && (
                  <button
                    style={{ ...buttonStyle(false), marginTop: '10px' }}
                    onClick={() => navigate('/measure')}
                  >
                    <Ruler size={16} />
                    My measurements
                  </button>
                )}
                {selectedPerson && personMeasurements.length > 1 && (
                  <div style={{ marginTop: '14px' }}>
                    <label style={labelStyle}>Which measurements?</label>
                    <select
                      style={inputStyle}
                      value={selectedMeasurementId}
                      onChange={(e) => setSelectedMeasurementId(e.target.value)}
                    >
                      {personMeasurements.map((m) => (
                        <option key={m.id} value={m.id}>
                          {new Date(m.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                          {m.is_active ? ' · current' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {needsFabric && (
              <>
                <div style={sectionLabelStyle}>Fabric</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    style={chipButtonStyle(fabricProvider === 'tailor')}
                    onClick={() => setFabricProvider('tailor')}
                  >
                    Studio provides it
                  </button>
                  <button
                    style={chipButtonStyle(fabricProvider === 'user')}
                    onClick={() => setFabricProvider('user')}
                  >
                    I provide it
                  </button>
                </div>
                <div style={{ ...formGridStyle, marginTop: '14px' }}>
                  <div>
                    <label style={labelStyle}>
                      {fabricProvider === 'user' ? 'What fabric are you bringing?' : 'Fabric you have in mind'}
                    </label>
                    <input
                      style={inputStyle}
                      value={fabricType}
                      placeholder="Kente, lace, linen…"
                      onChange={(e) => setFabricType(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>How many pieces?</label>
                    <input
                      style={inputStyle}
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 4 — contact, notes and the summary */}
        {currentStep === 4 && (
          <div style={cardStyle}>
            <div style={cardTitleStyle}>
              <User size={20} color={colors.primary} />
              How do we reach you?
            </div>

            <div style={formGridStyle}>
              <div>
                <label style={labelStyle}>Phone *</label>
                <input
                  style={inputStyle}
                  type="tel"
                  value={contactPhone}
                  placeholder="+233 24 000 0000"
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  style={inputStyle}
                  type="email"
                  value={contactEmail}
                  placeholder="you@email.com"
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: '14px' }}>
              <label style={labelStyle}>Anything else the studio should know?</label>
              <textarea
                style={textareaStyle}
                value={notes}
                placeholder="Occasion, deadline, colours, references…"
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div
              style={{
                marginTop: '18px',
                padding: '16px',
                borderRadius: '12px',
                background: isDark ? 'rgba(168, 137, 79,0.05)' : 'rgba(168, 137, 79,0.03)',
                border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.10)'}`,
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: colors.text,
                  marginBottom: '8px',
                }}
              >
                Your booking
              </div>
              <div style={summaryRowStyle}>
                <span style={{ color: colors.secondaryText }}>Service</span>
                <span style={{ color: colors.text, fontWeight: 600 }}>{selectedService.label}</span>
              </div>
              <div style={summaryRowStyle}>
                <span style={{ color: colors.secondaryText }}>Speed</span>
                <span style={{ color: colors.text, fontWeight: 600 }}>
                  {TIER_PRESENTATION[tierName]?.label || tierName}
                </span>
              </div>
              <div style={summaryRowStyle}>
                <span style={{ color: colors.secondaryText }}>When</span>
                <span style={{ color: colors.text, fontWeight: 600, textAlign: 'right' }}>
                  {selectedSlot ? (
                    <>
                      {dateParts(selectedSlot.date)?.long}
                      <br />
                      {timeRange(selectedSlot)}
                    </>
                  ) : (
                    'Not picked yet'
                  )}
                </span>
              </div>
              <div style={summaryRowStyle}>
                <span style={{ color: colors.secondaryText }}>For</span>
                <span style={{ color: colors.text, fontWeight: 600 }}>
                  {selectedPerson ? selectedPerson.name : 'Myself'}
                </span>
              </div>
              {needsFabric && (
                <div style={summaryRowStyle}>
                  <span style={{ color: colors.secondaryText }}>Fabric</span>
                  <span style={{ color: colors.text, fontWeight: 600 }}>
                    {fabricProvider === 'user' ? 'I provide it' : 'Studio provides it'}
                    {fabricType.trim() ? ` · ${fabricType.trim()}` : ''}
                  </span>
                </div>
              )}
              <div style={{ ...summaryRowStyle, borderBottom: 'none' }}>
                <span style={{ color: colors.secondaryText }}>Booking fee</span>
                <span style={{ color: colors.primary, fontWeight: 700 }}>{formatMoney(fee)}</span>
              </div>
            </div>

            <div style={noticeStyle}>
              <Info size={16} color={colors.primary} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>
                The fee above holds your slot. Anything the studio makes for you is quoted
                separately after this meeting, and you approve that price before work starts.
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={buttonContainerStyle}>
          {currentStep > 1 && (
            <button style={buttonStyle(false)} onClick={prevStep}>
              <ChevronLeft size={16} />
              Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {currentStep < 4 ? (
            <button style={buttonStyle(true)} onClick={nextStep}>
              Continue
              <ArrowRight size={16} />
            </button>
          ) : (
            <button style={buttonStyle(true)} onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Booking…' : 'Confirm booking'}
              {!submitting && <ArrowRight size={16} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookAppointmentPage;
