import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight, FileSignature } from 'lucide-react';
import { appointmentsAdmin } from '../../api/endpoints';
import AdminShell from '../../components/admin/AdminShell';

export default function Consultations() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appointmentsAdmin.list({ per_page: 100 })
      .then((r) => setRows(r.appointments || r.results || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell
      eyebrow={<><FileSignature size={13} />Client agreements</>}
      title="Consultations"
      subtitle="Turn a physical meeting into a clear, reviewable garment agreement."
      actions={!loading && rows.length ? <span className="dash-toolbar-meta">{rows.length} consultations</span> : null}
    >
      {loading ? (
        <div className="dash-loading">Loading consultations…</div>
      ) : !rows.length ? (
        <div className="dash-empty">
          <CalendarDays size={30} />
          <h3>No consultations yet</h3>
          <p>Booked consultations will appear here, ready to be turned into agreements.</p>
        </div>
      ) : (
        <div className="cons-list">
          {rows.map((a) => (
            <Link className="cons-row dash-card" to={`/admin/consultations/${a.id}`} key={a.id}>
              <span className="cons-icon"><CalendarDays size={18} /></span>
              <div className="cons-main">
                <h3>{a.user_name}</h3>
                <p>{a.style_name || 'Customer’s own design'} · {a.appointment_type?.replaceAll('_', ' ')}</p>
              </div>
              <span className="cons-date">
                {a.slot_date}
                <small>{a.tier_name}</small>
              </span>
              <ChevronRight className="cons-chevron" size={18} />
            </Link>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
