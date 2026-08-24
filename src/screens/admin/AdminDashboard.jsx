// screens/admin/AdminDashboard.jsx
// Single admin console with tabbed sections. Admins and apprentices both land
// here (App.js lets apprentices through); destructive controls are gated on
// role === 'admin' so a tailor can move production along without being able to
// delete catalogue items or deactivate accounts.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LayoutDashboard, Package, Scissors, CalendarDays, ShoppingBag, Users,
  Wallet, CheckCircle2, AlertCircle, RefreshCw, Search,
  ChevronLeft, ChevronRight, Ban, ShieldCheck,
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../providers/ToastProvider';
import { useAuth } from '../../providers/AuthProvider';
import {
  analytics, ordersAdmin, appointmentsAdmin, users as usersApi,
} from '../../api/endpoints';
import AdminShell from '../../components/admin/AdminShell';

const CURRENCY = 'GHS';
const money = (n) => `${CURRENCY} ${Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const shortDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled', 'refunded'];
const PRODUCTION_STAGES = [
  'pending', 'pattern_making', 'cutting', 'sewing', 'fitting',
  'finishing', 'quality_check', 'ready', 'completed',
];
const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];

const STAGE_LABEL = (s) => String(s || '').replace(/_/g, ' ');

// ----------------------------------------------------------------- primitives

// Maps a status/payment value to one of the semantic pill tones defined in
// dashboard.css, so light and dark themes stay in sync automatically.
const PILL_TONE = {
  completed: 'success', ready: 'success', paid: 'success',
  confirmed: 'info', processing: 'info', in_progress: 'info',
  pending: 'warning', partial: 'warning',
  cancelled: 'error', refunded: 'error', failed: 'error', no_show: 'error',
};

const StatusPill = ({ value }) => {
  const v = String(value || '').toLowerCase();
  const tone = PILL_TONE[v] || 'muted';
  return <span className={`pill tone-${tone}`}>{STAGE_LABEL(v) || '—'}</span>;
};

const StatCard = ({ icon: Icon, label, value, sub, tone }) => (
  <div className="dash-stat">
    <span
      className="dash-stat-icon"
      style={tone ? { background: `color-mix(in srgb, ${tone} 15%, transparent)`, color: tone } : undefined}
    >
      <Icon size={18} />
    </span>
    <div className="dash-stat-value">{value}</div>
    <div className="dash-stat-label">{label}</div>
    {sub && <div className="dash-stat-sub">{sub}</div>}
  </div>
);

// A carded section with an optional header row. Tables pass pad={false} so the
// table can run flush to the card edges; everything else keeps inner padding.
const Panel = ({ title, action, children, pad = true }) => (
  <div className="dash-block">
    {(title || action) && (
      <header className="dash-block-head">
        <h2>{title}</h2>
        {action}
      </header>
    )}
    <div className={pad ? 'dash-block-body' : undefined}>{children}</div>
  </div>
);

const EmptyRow = ({ colSpan, message }) => (
  <tr>
    <td colSpan={colSpan} className="dash-table-empty">{message}</td>
  </tr>
);

const Loading = ({ label = 'Loading…' }) => (
  <div className="dash-inline-loading">
    <span className="spin" />
    {label}
  </div>
);

const Pager = ({ page, totalPages, onChange }) => {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="dash-pager">
      <button className="icon-btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={16} />
      </button>
      <span>Page {page} of {totalPages}</span>
      <button className="icon-btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

// A native select styled to match the theme — used for every inline status edit.
const InlineSelect = ({ value, options, onChange, disabled }) => (
  <select
    className="dash-inline-select"
    value={value || ''}
    disabled={disabled}
    onChange={(e) => onChange(e.target.value)}
  >
    {options.map((o) => (
      <option key={o} value={o}>{STAGE_LABEL(o) || 'All'}</option>
    ))}
  </select>
);

// -------------------------------------------------------------------- overview

const OverviewTab = ({ colors }) => {
  const [data, setData] = useState(null);
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [overview, revenue] = await Promise.all([
        analytics.overview(),
        analytics.revenueChart({ days: 30 }).catch(() => null),
      ]);
      setData(overview?.overview || null);
      setChart(revenue?.data || []);
      setError('');
    } catch (err) {
      setError(err?.message || 'Could not load the dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loading label="Crunching numbers…" />;
  if (error) {
    return (
      <div className="dash-error">
        <AlertCircle size={26} />
        <div>{error}</div>
        <button className="btn btn-ghost" onClick={load}>Retry</button>
      </div>
    );
  }
  if (!data) return null;

  const { revenue = {}, orders = {}, production = {}, customers = {}, appointments = {}, products = {}, recent_orders = [] } = data;
  const peak = Math.max(1, ...chart.map((d) => Number(d.revenue) || 0));

  return (
    <>
      <div className="dash-stat-grid">
        <StatCard icon={Wallet} label="Revenue this month" value={money(revenue.this_month)} sub={`${money(revenue.total)} all time`} tone={colors.primary} />
        <StatCard icon={ShoppingBag} label="Orders" value={orders.total ?? 0} sub={`${orders.pending ?? 0} pending · ${orders.processing ?? 0} processing`} tone={colors.info} />
        <StatCard icon={Scissors} label="In production" value={production.total_in_progress ?? 0} sub={`${production.ready ?? 0} ready for pickup`} tone={colors.warning} />
        <StatCard icon={Users} label="Customers" value={customers.total ?? 0} sub={`${customers.new_this_month ?? 0} joined this month`} tone={colors.success} />
        <StatCard icon={CalendarDays} label="Appointments" value={appointments.total ?? 0} sub={`${appointments.pending ?? 0} awaiting review`} tone={colors.info} />
        <StatCard icon={Package} label="Catalogue" value={products.total_products ?? 0} sub={`${products.out_of_stock ?? 0} out of stock · ${products.low_stock ?? 0} low`} tone={colors.accent} />
      </div>

      <Panel
        title="Revenue — last 30 days"
        action={<button className="icon-btn" onClick={load} title="Refresh"><RefreshCw size={15} /></button>}
      >
        {chart.length === 0 ? (
          <div className="dash-chart-empty">No revenue recorded yet.</div>
        ) : (
          <>
            <div className="dash-bars">
              {chart.map((d) => {
                const pct = ((Number(d.revenue) || 0) / peak) * 100;
                return (
                  <div
                    key={d.date}
                    className="dash-bar"
                    title={`${d.date} · ${money(d.revenue)} · ${d.orders} order(s)`}
                    style={{ height: `${Math.max(pct, 2)}%`, opacity: pct > 0 ? 1 : 0.4 }}
                  />
                );
              })}
            </div>
            <div className="dash-bars-axis">
              <span>{chart[0]?.date}</span>
              <span>Peak {money(peak)}</span>
              <span>{chart[chart.length - 1]?.date}</span>
            </div>
          </>
        )}
      </Panel>

      <div className="dash-split">
        <Panel title="Production pipeline">
          {PRODUCTION_STAGES.filter((s) => s !== 'completed').map((stage) => {
            const count = production[stage] ?? 0;
            const total = Math.max(1, PRODUCTION_STAGES.reduce((n, s) => n + (production[s] ?? 0), 0));
            return (
              <div key={stage} className="dash-progress">
                <div className="dash-progress-head">
                  <span>{STAGE_LABEL(stage)}</span>
                  <b>{count}</b>
                </div>
                <div className="dash-progress-track">
                  <div className="dash-progress-fill" style={{ width: `${(count / total) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </Panel>

        <Panel title="Recent orders" pad={false}>
          <div className="dash-table-scroll">
            <table className="dash-table">
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recent_orders.length === 0 ? (
                  <EmptyRow colSpan={4} message="No orders yet." />
                ) : recent_orders.slice(0, 8).map((o) => (
                  <tr key={o.id || o.order_number}>
                    <td className="dash-strong">{o.order_number || String(o.id).slice(0, 8)}</td>
                    <td className="dash-muted">{o.customer_name || o.user_email || '—'}</td>
                    <td>{money(o.total)}</td>
                    <td><StatusPill value={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------- orders

const OrdersTab = ({ showToast, canManage }) => {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      if (status) params.status = status;
      if (query.trim()) params.search = query.trim();
      const res = await ordersAdmin.list(params);
      setRows(res?.orders || res?.results || []);
      setTotalPages(res?.total_pages || 1);
    } catch (err) {
      showToast(err?.message || 'Could not load orders.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, status, query, showToast]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (order, next) => {
    setBusy(order.id);
    try {
      await ordersAdmin.updateStatus(order.id, { status: next });
      setRows((rs) => rs.map((r) => (r.id === order.id ? { ...r, status: next } : r)));
      showToast(`Order ${order.order_number || ''} → ${STAGE_LABEL(next)}.`, 'success');
    } catch (err) {
      showToast(err?.message || 'Could not update that order.', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel
      title="Orders"
      pad={false}
      action={
        <div className="dash-actions">
          <div className="dash-mini-search">
            <Search size={14} />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search orders…"
            />
          </div>
          <InlineSelect
            value={status}
            options={['', ...ORDER_STATUSES]}
            onChange={(v) => { setStatus(v); setPage(1); }}
          />
          <button className="icon-btn" onClick={load} title="Refresh"><RefreshCw size={15} /></button>
        </div>
      }
    >
      {loading ? <Loading /> : (
        <>
          <div className="dash-table-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Order</th><th>Customer</th><th>Items</th><th>Total</th>
                  <th>Payment</th><th>Placed</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <EmptyRow colSpan={7} message={status || query ? 'No orders match that filter.' : 'No orders yet.'} />
                ) : rows.map((o) => (
                  <tr key={o.id}>
                    <td className="dash-strong">{o.order_number || String(o.id).slice(0, 8)}</td>
                    <td className="dash-muted">{o.customer_name || o.user_email || '—'}</td>
                    <td>{o.item_count ?? o.items?.length ?? '—'}</td>
                    <td>{money(o.total)}</td>
                    <td><StatusPill value={o.payment_status} /></td>
                    <td className="dash-muted dash-nowrap">{shortDate(o.created_at)}</td>
                    <td>
                      {canManage ? (
                        <InlineSelect
                          value={o.status}
                          options={ORDER_STATUSES}
                          disabled={busy === o.id}
                          onChange={(v) => changeStatus(o, v)}
                        />
                      ) : <StatusPill value={o.status} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </Panel>
  );
};

// ------------------------------------------------------------------ production

const ProductionTab = ({ showToast }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [stageFilter, setStageFilter] = useState('');

  // Production work lives on order items, so pull the orders and flatten to
  // their sewn (style) items — those are the ones that move through stages.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersAdmin.list({ page: 1 });
      const orders = res?.orders || res?.results || [];
      const flat = [];
      orders.forEach((o) => {
        (o.items || []).forEach((it) => {
          if (it.item_type === 'style') {
            flat.push({ ...it, order_number: o.order_number, customer: o.customer_name || o.user_email });
          }
        });
      });
      setItems(flat);
    } catch (err) {
      showToast(err?.message || 'Could not load production items.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const advance = async (item, stage) => {
    setBusy(item.id);
    try {
      await ordersAdmin.updateProduction(item.id, { production_stage: stage });
      setItems((is) => is.map((i) => (i.id === item.id ? { ...i, production_stage: stage } : i)));
      showToast(`${item.item_name} → ${STAGE_LABEL(stage)}.`, 'success');
    } catch (err) {
      showToast(err?.message || 'Could not update the production stage.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const visible = stageFilter ? items.filter((i) => i.production_stage === stageFilter) : items;

  return (
    <Panel
      title="Production floor"
      pad={false}
      action={
        <div className="dash-actions">
          <InlineSelect value={stageFilter} options={['', ...PRODUCTION_STAGES]} onChange={setStageFilter} />
          <button className="icon-btn" onClick={load} title="Refresh"><RefreshCw size={15} /></button>
        </div>
      }
    >
      {loading ? <Loading /> : (
        <div className="dash-table-scroll">
          <table className="dash-table">
            <thead>
              <tr><th>Piece</th><th>For</th><th>Order</th><th>Qty</th><th>Stage</th></tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <EmptyRow colSpan={5} message={stageFilter ? 'Nothing at that stage.' : 'No tailored pieces in production.'} />
              ) : visible.map((it) => (
                <tr key={it.id}>
                  <td className="dash-strong">{it.item_name}</td>
                  <td className="dash-muted">{it.person_name || it.customer || '—'}</td>
                  <td className="dash-muted">{it.order_number || '—'}</td>
                  <td>{it.quantity}</td>
                  <td>
                    <InlineSelect
                      value={it.production_stage}
                      options={PRODUCTION_STAGES}
                      disabled={busy === it.id}
                      onChange={(v) => advance(it, v)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
};

// ---------------------------------------------------------------- appointments

const AppointmentsTab = ({ showToast }) => {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      if (status) params.status = status;
      const res = await appointmentsAdmin.list(params);
      setRows(res?.results || res?.appointments || []);
      setTotalPages(res?.total_pages || 1);
    } catch (err) {
      showToast(err?.message || 'Could not load appointments.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, status, showToast]);

  useEffect(() => { load(); }, [load]);

  const setStatusFor = async (apt, next) => {
    setBusy(apt.id);
    try {
      await appointmentsAdmin.updateStatus(apt.id, { status: next });
      setRows((rs) => rs.map((r) => (r.id === apt.id ? { ...r, status: next } : r)));
      showToast(`Appointment → ${STAGE_LABEL(next)}.`, 'success');
    } catch (err) {
      showToast(err?.message || 'Could not update that appointment.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const markPaid = async (apt) => {
    setBusy(apt.id);
    try {
      await appointmentsAdmin.markPaid(apt.id);
      setRows((rs) => rs.map((r) => (r.id === apt.id ? { ...r, payment_status: 'paid' } : r)));
      showToast('Marked as paid.', 'success');
    } catch (err) {
      showToast(err?.message || 'Could not mark that as paid.', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel
      title="Appointments"
      pad={false}
      action={
        <div className="dash-actions">
          <InlineSelect value={status} options={['', ...APPOINTMENT_STATUSES]} onChange={(v) => { setStatus(v); setPage(1); }} />
          <button className="icon-btn" onClick={load} title="Refresh"><RefreshCw size={15} /></button>
        </div>
      }
    >
      {loading ? <Loading /> : (
        <>
          <div className="dash-table-scroll">
            <table className="dash-table">
              <thead>
                <tr><th>Customer</th><th>Tier</th><th>Date</th><th>Time</th><th>Payment</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <EmptyRow colSpan={7} message={status ? 'None with that status.' : 'No appointments booked yet.'} />
                ) : rows.map((a) => (
                  <tr key={a.id}>
                    <td className="dash-strong">{a.customer_name || a.user_email || '—'}</td>
                    <td className="dash-muted">{a.tier_name || '—'}</td>
                    <td className="dash-nowrap">{a.slot_date || shortDate(a.created_at)}</td>
                    <td className="dash-muted dash-nowrap">{a.slot_time || '—'}</td>
                    <td><StatusPill value={a.payment_status} /></td>
                    <td>
                      <InlineSelect
                        value={a.status}
                        options={APPOINTMENT_STATUSES}
                        disabled={busy === a.id}
                        onChange={(v) => setStatusFor(a, v)}
                      />
                    </td>
                    <td>
                      {a.payment_status !== 'paid' && (
                        <button className="btn btn-ghost btn-sm" disabled={busy === a.id} onClick={() => markPaid(a)}>
                          <CheckCircle2 size={13} /> Mark paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </Panel>
  );
};

// ---------------------------------------------------------------------- users

const UsersTab = ({ showToast, canManage }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [role, setRole] = useState('');
  const { user: me } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (role) params.role = role;
      const res = await usersApi.list(params);
      setRows(res?.users || res?.results || []);
    } catch (err) {
      showToast(err?.message || 'Could not load users.', 'error');
    } finally {
      setLoading(false);
    }
  }, [role, showToast]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (u) => {
    const verb = u.is_active ? 'deactivate' : 'reactivate';
    if (!window.confirm(`Really ${verb} ${u.full_name || u.email}?`)) return;
    setBusy(u.id);
    try {
      await usersApi.toggleStatus(u.id);
      setRows((rs) => rs.map((r) => (r.id === u.id ? { ...r, is_active: !r.is_active } : r)));
      showToast(`${u.email} ${u.is_active ? 'deactivated' : 'reactivated'}.`, 'success');
    } catch (err) {
      showToast(err?.message || 'Could not change that account.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const changeRole = async (u, next) => {
    setBusy(u.id);
    try {
      await usersApi.update(u.id, { role: next });
      setRows((rs) => rs.map((r) => (r.id === u.id ? { ...r, role: next } : r)));
      showToast(`${u.email} is now ${next}.`, 'success');
    } catch (err) {
      showToast(err?.message || 'Could not change that role.', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel
      title="People"
      pad={false}
      action={
        <div className="dash-actions">
          <InlineSelect value={role} options={['', 'admin', 'apprentice', 'customer']} onChange={setRole} />
          <button className="icon-btn" onClick={load} title="Refresh"><RefreshCw size={15} /></button>
        </div>
      }
    >
      {loading ? <Loading /> : (
        <div className="dash-table-scroll">
          <table className="dash-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Role</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <EmptyRow colSpan={7} message="No accounts match." />
              ) : rows.map((u) => {
                const isMe = u.id === me?.id;
                return (
                  <tr key={u.id}>
                    <td className="dash-strong">
                      {u.full_name || u.username}
                      {isMe && <span className="dash-you">you</span>}
                    </td>
                    <td className="dash-muted">{u.email}</td>
                    <td className="dash-muted">{u.phone || '—'}</td>
                    <td className="dash-muted dash-nowrap">{shortDate(u.date_joined)}</td>
                    <td>
                      {canManage && !isMe ? (
                        <InlineSelect
                          value={u.role}
                          options={['admin', 'apprentice', 'customer']}
                          disabled={busy === u.id}
                          onChange={(v) => changeRole(u, v)}
                        />
                      ) : (
                        <span className="pill tone-gold">{u.role}</span>
                      )}
                    </td>
                    <td>
                      <span className={`pill tone-${u.is_active ? 'success' : 'error'}`}>
                        {u.is_active ? 'active' : 'disabled'}
                      </span>
                    </td>
                    <td>
                      {canManage && !isMe && (
                        <button className="btn btn-ghost btn-sm" disabled={busy === u.id} onClick={() => toggle(u)}>
                          {u.is_active ? <><Ban size={13} /> Disable</> : <><ShieldCheck size={13} /> Enable</>}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
};

// ----------------------------------------------------------------------- page

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'orders', label: 'Orders', icon: ShoppingBag },
  { key: 'production', label: 'Production', icon: Scissors },
  { key: 'appointments', label: 'Appointments', icon: CalendarDays },
  { key: 'users', label: 'People', icon: Users },
];

const AdminDashboard = () => {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { user, isAdmin } = useAuth();
  const [tab, setTab] = useState('overview');

  // Apprentices see everything but can only move work along; role and account
  // changes stay with the owner.
  const canManage = Boolean(isAdmin);

  const body = useMemo(() => {
    switch (tab) {
      case 'orders': return <OrdersTab showToast={showToast} canManage={canManage} />;
      case 'production': return <ProductionTab showToast={showToast} />;
      case 'appointments': return <AppointmentsTab showToast={showToast} />;
      case 'users': return <UsersTab showToast={showToast} canManage={canManage} />;
      default: return <OverviewTab colors={colors} />;
    }
  }, [tab, colors, showToast, canManage]);

  return (
    <AdminShell
      eyebrow={<><LayoutDashboard size={13} />{isAdmin ? 'Administrator' : 'Workshop'}</>}
      title="Studio console"
      subtitle={`Welcome back${user?.firstName ? `, ${user.firstName}` : ''}. Track revenue, move orders through the workshop, and keep the booking diary tidy.`}
    >
      <div className="dash-tabs" role="tablist">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`dash-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {body}
    </AdminShell>
  );
};

export default AdminDashboard;
