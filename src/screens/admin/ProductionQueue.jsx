import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, Factory, Scissors, WalletCards } from 'lucide-react';
import { ordersAdmin } from '../../api/endpoints';
import AdminShell from '../../components/admin/AdminShell';

const LABELS = { express: 'Express line', priority: 'Premium line', standard: 'Standard line' };
const RISKS = {
  payment_overdue: { label: 'Payment hold', tone: 'error' },
  production_overdue: { label: 'Overdue', tone: 'error' },
  due_soon: { label: 'Due soon', tone: 'warning' },
  awaiting_deposit: { label: 'Awaiting deposit', tone: 'warning' },
  on_track: { label: 'On track', tone: 'success' },
};
const money = (n) => `GH₵ ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

export default function ProductionQueue() {
  const [queue, setQueue] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersAdmin.productionQueue().then(setQueue).finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell
      eyebrow={<><Factory size={13} />Workshop control</>}
      title="Production queue"
      subtitle="Deadline-first work list, separated by the urgency agreed with each client."
    >
      {loading ? (
        <div className="dash-loading">Preparing the workshop queue…</div>
      ) : (
        ['express', 'priority', 'standard'].map((group) => {
          const orders = queue[group] || [];
          return (
            <section className="pq-group" key={group}>
              <div className="pq-group-head">
                <h2>{LABELS[group]}</h2>
                <span className="pill tone-gold">{orders.length}</span>
              </div>

              {!orders.length ? (
                <div className="pq-empty">No garments in this line.</div>
              ) : (
                <div className="dash-grid pq-grid">
                  {orders.map((order) => {
                    const risk = RISKS[order.risk] || { label: order.risk, tone: 'muted' };
                    return (
                      <Link to={`/orders/${order.id}`} className="pq-card dash-card" key={order.id}>
                        <div className="pq-card-top">
                          <span className={`pill tone-${risk.tone}`}><span className="dot" />{risk.label}</span>
                          <small>{order.order_number}</small>
                        </div>
                        <h3>{order.items?.[0]?.item_name || 'Bespoke garment'}</h3>
                        <p>{order.user_name}</p>
                        <div className="pq-meta">
                          <span><Clock3 size={14} />{order.days_remaining == null ? 'Date pending' : order.days_remaining < 0 ? `${Math.abs(order.days_remaining)} days late` : `${order.days_remaining} days left`}</span>
                          <span><Scissors size={14} />{order.items?.[0]?.production_stage?.replaceAll('_', ' ') || 'pending'}</span>
                          <span><WalletCards size={14} />{money(order.amount_paid)} paid</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })
      )}
    </AdminShell>
  );
}
