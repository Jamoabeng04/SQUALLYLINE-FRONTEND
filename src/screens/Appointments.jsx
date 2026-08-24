import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Search,
  CalendarDays,
  Zap,
  User,
  Eye,
  Plus,
  Scissors,
  Layers,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { appointments as appointmentsApi } from '../api/endpoints';
import {
  adaptAppointment,
  adaptPage,
  formatPrice,
  errorText,
  APPOINTMENT_STATUS_LABEL,
} from '../api/adapters';

// Appointment.STATUS_CHOICES on the backend, in the order a booking moves
// through them. Note the underscore in in_progress and that no_show exists.
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'no_show', label: 'No Show' },
];

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

// tier_name arrives as the display value of AppointmentTier.name.
const TIER_COLOR = { Express: '#EF4444', Urgent: '#F59E0B', Normal: '#10B981' };

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
    year: y,
    relative: diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : '',
    isPast: diffDays < 0,
  };
};

const MyAppointmentsPage = () => {
  const navigate = useNavigate();
  const { colors, theme } = useTheme();
  const isDark = theme.mode === 'dark';

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 600;

  // my_appointments is paginated and caps per_page at 100. Walking every page
  // once keeps the filter counts, stats and search exact instead of describing
  // only whichever page happens to be loaded.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    (async () => {
      try {
        const rows = [];
        let page = 1;
        let totalPages = 1;
        do {
          const payload = await appointmentsApi.mine({ page, per_page: 100 });
          const chunk = adaptPage(payload, adaptAppointment);
          rows.push(...chunk.results);
          totalPages = chunk.totalPages || 1;
          page += 1;
          // 10 pages of 100 is far past any real customer history; the guard
          // only exists so a bad total_pages cannot spin forever.
        } while (page <= totalPages && page <= 10 && !cancelled);

        if (cancelled) return;
        setAppointments(rows);
      } catch (err) {
        if (!cancelled) setError(errorText(err, 'Could not load your appointments.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const counts = useMemo(() => {
    const map = { all: appointments.length };
    FILTERS.forEach((f) => {
      if (f.id !== 'all') map[f.id] = appointments.filter((a) => a.status === f.id).length;
    });
    return map;
  }, [appointments]);

  const filtered = useMemo(() => {
    let result = appointments;

    if (activeFilter !== 'all') {
      result = result.filter((apt) => apt.status === activeFilter);
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((apt) =>
        [apt.styleName, apt.personName, apt.typeLabel, apt.tierName, apt.date, apt.time, apt.fabricType]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(query))
      );
    }

    return result;
  }, [appointments, activeFilter, searchQuery]);

  const stats = useMemo(
    () => [
      { label: 'Total', value: appointments.length, icon: CalendarDays },
      { label: 'Pending', value: counts.pending || 0, icon: Clock, color: '#F59E0B' },
      {
        label: 'Active',
        value: (counts.confirmed || 0) + (counts.in_progress || 0),
        icon: CheckCircle,
        color: '#10B981',
      },
      {
        label: 'Express',
        value: appointments.filter((a) => a.tierName === 'Express').length,
        icon: Zap,
        color: '#EF4444',
      },
    ],
    [appointments, counts]
  );

  const statusBg = (status) => {
    const color = STATUS_COLOR[status] || colors.secondaryText;
    return isDark ? `${color}26` : `${color}1A`;
  };

  // Styles
  const pageStyle = {
    backgroundColor: colors.mainBg,
    minHeight: '100vh',
    paddingBottom: '32px',
  };

  const containerStyle = {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '12px 16px',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  };

  const titleStyle = {
    fontSize: isMobile ? '19px' : '22px',
    fontWeight: 800,
    color: colors.heading,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const titleBadgeStyle = {
    fontSize: '12px',
    fontWeight: 600,
    padding: '2px 10px',
    borderRadius: '10px',
    background: colors.primary,
    color: '#1A1A1A',
  };

  const bookButtonStyle = {
    padding: '8px 14px',
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
    padding: '8px 14px',
    borderRadius: '10px',
    background: 'transparent',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.15)' : 'rgba(168, 137, 79,0.20)'}`,
    color: colors.text,
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
    gap: '10px',
    marginBottom: '16px',
  };

  const statCardStyle = {
    padding: '10px 14px',
    borderRadius: '10px',
    background: isDark ? 'rgba(20,20,20,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.06)' : 'rgba(168, 137, 79,0.08)'}`,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const statIconWrapperStyle = (color) => ({
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: color
      ? isDark
        ? `${color}20`
        : `${color}15`
      : isDark
      ? 'rgba(168, 137, 79,0.10)'
      : 'rgba(168, 137, 79,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: color || colors.primary,
    flexShrink: 0,
  });

  const statValueStyle = {
    fontSize: '18px',
    fontWeight: 700,
    color: colors.heading,
    lineHeight: 1.2,
  };

  const statLabelStyle = {
    fontSize: '9px',
    color: colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  };

  const filterBarStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '14px',
    alignItems: 'center',
  };

  const filterChipStyle = (isActive) => ({
    padding: '4px 12px',
    borderRadius: '14px',
    fontSize: '11px',
    fontWeight: isActive ? 600 : 400,
    cursor: 'pointer',
    background: isActive ? colors.primary : 'transparent',
    color: isActive ? '#1A1A1A' : colors.secondaryText,
    border: `1px solid ${
      isActive ? colors.primary : isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.10)'
    }`,
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  });

  const searchWrapperStyle = {
    position: 'relative',
    flex: 1,
    minWidth: '140px',
    maxWidth: '220px',
    marginLeft: 'auto',
  };

  const searchInputStyle = {
    width: '100%',
    padding: '5px 10px 5px 28px',
    borderRadius: '14px',
    background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.80)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.10)'}`,
    color: colors.text,
    fontSize: '11px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const cardGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '10px',
  };

  const cardStyle = {
    display: 'flex',
    borderRadius: '10px',
    background: isDark ? 'rgba(20,20,20,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.06)' : 'rgba(168, 137, 79,0.08)'}`,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    height: '150px',
    position: 'relative',
  };

  // The date tile replaces the style photo the list endpoint does not carry —
  // and the date is what a customer actually scans this list for.
  const dateTileStyle = (dimmed) => ({
    width: '35%',
    minWidth: '35%',
    padding: '10px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    background: isDark ? 'rgba(0,0,0,0.20)' : 'rgba(0,0,0,0.02)',
    borderRight: `1px solid ${isDark ? 'rgba(168, 137, 79,0.06)' : 'rgba(168, 137, 79,0.06)'}`,
    opacity: dimmed ? 0.55 : 1,
  });

  const dayStyle = {
    fontSize: '26px',
    fontWeight: 800,
    color: colors.heading,
    lineHeight: 1,
  };

  const monthStyle = {
    fontSize: '10px',
    fontWeight: 600,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  };

  const weekdayStyle = {
    fontSize: '9px',
    color: colors.secondaryText,
  };

  const rightSectionStyle = {
    flex: 1,
    padding: '10px 12px 24px 14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minWidth: 0,
    overflow: 'hidden',
  };

  const topRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '6px',
  };

  const personStyle = {
    fontSize: '11px',
    fontWeight: 500,
    color: colors.text,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    overflow: 'hidden',
    minWidth: 0,
  };

  const statusBadgeStyle = (status) => ({
    padding: '1px 8px',
    borderRadius: '8px',
    fontSize: '8px',
    fontWeight: 600,
    background: statusBg(status),
    color: STATUS_COLOR[status] || colors.secondaryText,
    border: `1px solid ${STATUS_COLOR[status] || colors.secondaryText}`,
    opacity: 0.85,
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  });

  const tierBadgeStyle = (tier) => ({
    padding: '1px 7px',
    borderRadius: '6px',
    fontSize: '7px',
    fontWeight: 700,
    background: TIER_COLOR[tier] || colors.secondaryText,
    color: '#FFFFFF',
    opacity: 0.85,
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  });

  const metaRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  };

  const metaItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '9px',
    color: colors.secondaryText,
    minWidth: 0,
  };

  const styleLineStyle = {
    fontSize: '10px',
    color: colors.text,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const priceStyle = {
    fontSize: '11px',
    fontWeight: 700,
    color: colors.primary,
  };

  const viewButtonStyle = {
    position: 'absolute',
    bottom: '8px',
    right: '10px',
    padding: '3px 10px',
    borderRadius: '10px',
    background: colors.primary,
    color: '#1A1A1A',
    fontSize: '9px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    transition: 'all 0.2s ease',
    opacity: 0,
    transform: 'translateY(4px)',
    fontFamily: 'inherit',
  };

  const emptyStateStyle = {
    textAlign: 'center',
    padding: '40px 20px',
  };

  const emptyIconStyle = {
    fontSize: '40px',
    color: colors.primary,
    opacity: 0.3,
    marginBottom: '12px',
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div className="skeleton" style={{ height: '30px', width: '220px', borderRadius: '8px', marginBottom: '16px' }} />
          <div style={statsGridStyle}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: '54px', borderRadius: '10px' }} />
            ))}
          </div>
          <div className="skeleton" style={{ height: '26px', width: '70%', borderRadius: '14px', marginBottom: '14px' }} />
          <div style={cardGridStyle}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: '150px', borderRadius: '10px' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <div style={{ ...containerStyle, ...emptyStateStyle }}>
          <AlertCircle size={38} color="#EF4444" style={{ marginBottom: '12px' }} />
          <p style={{ fontSize: '15px', fontWeight: 700, color: colors.heading, margin: 0 }}>
            Appointments unavailable
          </p>
          <p style={{ fontSize: '12px', color: colors.secondaryText, margin: '6px 0 16px' }}>{error}</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={bookButtonStyle} onClick={() => setReloadKey((k) => k + 1)}>
              <RefreshCw size={14} />
              Try again
            </button>
            <button style={ghostButtonStyle} onClick={() => navigate('/')}>
              Home
            </button>
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
          <h1 style={titleStyle}>
            <Calendar size={isMobile ? 20 : 24} />
            Appointments
            <span style={titleBadgeStyle}>{filtered.length}</span>
          </h1>
          <button style={bookButtonStyle} onClick={() => navigate('/appointments/book')}>
            <Plus size={14} />
            Book
          </button>
        </div>

        {/* Stats */}
        <div style={statsGridStyle}>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} style={statCardStyle}>
                <div style={statIconWrapperStyle(stat.color)}>
                  <Icon size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={statValueStyle}>{stat.value}</div>
                  <div style={statLabelStyle}>{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter bar — every chip is a real Appointment.STATUS_CHOICES value */}
        <div style={filterBarStyle}>
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              style={filterChipStyle(activeFilter === filter.id)}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
              <span style={{ fontSize: '8px', marginLeft: '3px', opacity: 0.5 }}>
                {counts[filter.id] || 0}
              </span>
            </button>
          ))}

          <div style={searchWrapperStyle}>
            <Search
              size={12}
              color={colors.secondaryText}
              style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              style={searchInputStyle}
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Card grid */}
        {filtered.length === 0 ? (
          <div style={emptyStateStyle}>
            <div style={emptyIconStyle}>✦</div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: colors.text, margin: 0 }}>
              {appointments.length === 0 ? 'No appointments yet' : 'Nothing matches that'}
            </p>
            <p style={{ fontSize: '12px', color: colors.secondaryText, margin: '4px 0 16px' }}>
              {appointments.length === 0
                ? 'Book a fitting or consultation and it will show up here.'
                : 'Try another filter or clear your search.'}
            </p>
            {appointments.length === 0 ? (
              <button style={{ ...bookButtonStyle, margin: '0 auto' }} onClick={() => navigate('/appointments/book')}>
                <Plus size={14} />
                Book an appointment
              </button>
            ) : (
              <button
                style={{ ...ghostButtonStyle, margin: '0 auto' }}
                onClick={() => {
                  setActiveFilter('all');
                  setSearchQuery('');
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div style={cardGridStyle}>
            {filtered.map((apt) => {
              const StatusIcon = STATUS_ICON[apt.status] || AlertCircle;
              const when = dateParts(apt.date);
              const dimmed = ['cancelled', 'completed', 'no_show'].includes(apt.status);
              // final_price is only set once the studio has reviewed the
              // booking; until then the tier fee is what the customer owes.
              const amount = apt.finalPrice != null ? apt.finalPrice : apt.tierFee;

              return (
                <div
                  key={apt.id}
                  style={cardStyle}
                  onClick={() => navigate(`/appointments/${apt.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = isDark
                      ? '0 4px 16px rgba(0,0,0,0.30)'
                      : '0 4px 16px rgba(0,0,0,0.06)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    const viewBtn = e.currentTarget.querySelector('.view-btn');
                    if (viewBtn) {
                      viewBtn.style.opacity = '1';
                      viewBtn.style.transform = 'translateY(0)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                    const viewBtn = e.currentTarget.querySelector('.view-btn');
                    if (viewBtn) {
                      viewBtn.style.opacity = '0';
                      viewBtn.style.transform = 'translateY(4px)';
                    }
                  }}
                >
                  {/* Date tile */}
                  <div style={dateTileStyle(dimmed)}>
                    {when ? (
                      <>
                        <div style={dayStyle}>{when.day}</div>
                        <div style={monthStyle}>
                          {when.month} {when.year !== new Date().getFullYear() ? when.year : ''}
                        </div>
                        <div style={weekdayStyle}>{when.relative || when.weekday}</div>
                      </>
                    ) : (
                      <div style={{ ...weekdayStyle, textAlign: 'center' }}>No date</div>
                    )}
                    <span style={{ ...tierBadgeStyle(apt.tierName), marginTop: '6px' }}>
                      {apt.tierName || '—'}
                    </span>
                  </div>

                  {/* Detail */}
                  <div style={rightSectionStyle}>
                    <div style={topRowStyle}>
                      <div style={personStyle}>
                        <User size={10} color={colors.secondaryText} />
                        <span style={{ fontSize: '9px', color: colors.secondaryText }}>For:</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {apt.personName || 'Myself'}
                        </span>
                      </div>
                      <span style={statusBadgeStyle(apt.status)}>
                        <StatusIcon size={8} />
                        {apt.statusLabel || APPOINTMENT_STATUS_LABEL[apt.status] || apt.status}
                      </span>
                    </div>

                    <div style={metaRowStyle}>
                      {apt.time && (
                        <span style={metaItemStyle}>
                          <Clock size={10} />
                          {apt.time}
                        </span>
                      )}
                      {apt.typeLabel && (
                        <span style={metaItemStyle}>
                          <Layers size={10} />
                          {apt.typeLabel}
                        </span>
                      )}
                      {apt.quantity > 1 && <span style={metaItemStyle}>×{apt.quantity}</span>}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <div style={styleLineStyle}>
                        {apt.styleName ? (
                          <>
                            <Scissors size={10} color={colors.secondaryText} />
                            {apt.styleName}
                          </>
                        ) : (
                          <span style={{ color: colors.secondaryText }}>
                            {apt.fabricProvider === 'tailor' ? 'Studio fabric' : 'Own fabric'}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                        <span style={priceStyle}>{formatPrice(amount)}</span>
                        <span
                          style={{
                            fontSize: '7px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '5px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px',
                            color: apt.isPaid ? '#10B981' : '#F59E0B',
                            background: apt.isPaid
                              ? isDark
                                ? 'rgba(16,185,129,0.15)'
                                : 'rgba(16,185,129,0.10)'
                              : isDark
                              ? 'rgba(245,158,11,0.15)'
                              : 'rgba(245,158,11,0.10)',
                          }}
                        >
                          {apt.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Floating view button */}
                  <button
                    className="view-btn"
                    style={viewButtonStyle}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/appointments/${apt.id}`);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isDark ? '#C9B183' : '#8A6F3A';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = colors.primary;
                    }}
                  >
                    <Eye size={10} />
                    View
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAppointmentsPage;
