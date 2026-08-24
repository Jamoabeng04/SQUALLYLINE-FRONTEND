import React, { useCallback, useEffect, useState } from 'react';
import { Crown, FileSignature, ImagePlus, Send, Trash2, UploadCloud } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { appointmentsAdmin } from '../../api/endpoints';
import { mediaUrl } from '../../api/config';
import AdminShell from '../../components/admin/AdminShell';

const SPEC_FIELDS = [
  'fabric_source', 'fabric_type', 'colour', 'fit', 'neckline', 'sleeve_style',
  'sleeve_length', 'garment_length', 'lining', 'pockets', 'closures',
  'embellishment', 'alterations', 'included_fittings', 'delivery_method',
];

const EMPTY = {
  garment_type: '', total_price: '', payment_plan: 'deposit_percent',
  deposit_percent: '50', deposit_amount: '', deposit_due_date: '',
  balance_due_date: '', completion_date: '', expires_at: '',
  customer_notes: '', internal_notes: '', specification: {},
};

export default function ProposalEditor() {
  const { appointmentId } = useParams();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () => appointmentsAdmin.proposals(appointmentId).then(setItems),
    [appointmentId],
  );
  useEffect(() => { load(); }, [load]);

  const changeSpec = (key, value) =>
    setForm((current) => ({ ...current, specification: { ...current.specification, [key]: value } }));

  const addImages = (files) =>
    setImages((current) =>
      [...current, ...[...files].map((file) => ({ file, preview: URL.createObjectURL(file) }))].slice(0, 10));

  const removeImage = (index) => setImages((current) => current.filter((_, i) => i !== index));

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const proposal = await appointmentsAdmin.createProposal(appointmentId, form);
      if (images.length) {
        const data = new FormData();
        images.forEach((item) => data.append('images', item.file));
        await appointmentsAdmin.uploadProposalImages(proposal.id, data);
      }
      setForm(EMPTY);
      setImages([]);
      load();
    } finally {
      setBusy(false);
    }
  };

  const depositFixed = form.payment_plan === 'deposit_fixed';

  return (
    <AdminShell
      className="mw-shell"
      eyebrow={<><FileSignature size={13} />Structured agreement</>}
      title="Consultation proposal"
      subtitle="Record the exact garment agreement and give every reference image a permanent place in the client record."
    >
      <div className="pe-layout">
        <form className="pe-form" onSubmit={save}>
          {/* -------------------------------------------------- garment brief */}
          <section className="dash-panel">
            <div className="dash-section-head">
              <div><span className="dash-eyebrow">Step 01</span><h2>Garment brief</h2></div>
            </div>
            <label className="dash-field">
              <span>Garment type<b>Required</b></span>
              <input required value={form.garment_type} onChange={(event) => setForm({ ...form, garment_type: event.target.value })} placeholder="e.g. Three-piece suit" />
            </label>
            <div className="pe-spec-grid">
              {SPEC_FIELDS.map((key) => (
                <label className="dash-field" key={key}>
                  <span>{key.replaceAll('_', ' ')}</span>
                  <input value={form.specification[key] || ''} onChange={(event) => changeSpec(key, event.target.value)} />
                </label>
              ))}
            </div>
          </section>

          {/* ----------------------------------------------- visual references */}
          <section className="dash-panel">
            <div className="dash-section-head">
              <div><span className="dash-eyebrow">Step 02</span><h2>Visual references</h2></div>
              <p>Up to 10 images. Files are validated and optimised automatically.</p>
            </div>
            <label className="ce-dropzone">
              <input type="file" hidden multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => addImages(event.target.files)} />
              <UploadCloud size={26} />
              <strong>Upload design references</strong>
              <span>JPG, PNG or WebP · up to 10 images</span>
            </label>
            <div className="ce-gallery pe-gallery">
              {images.map((item, index) => (
                <figure className={`ce-tile ${index === 0 ? 'primary' : ''}`} key={item.preview}>
                  <img src={item.preview} alt="Reference preview" />
                  {index === 0 && <span className="ce-badge"><Crown size={12} />Lead reference</span>}
                  <button className="ce-remove" type="button" onClick={() => removeImage(index)}><Trash2 size={14} /></button>
                </figure>
              ))}
              {!images.length && (
                <div className="ce-gallery-empty">
                  <ImagePlus size={28} />
                  <span>No reference images selected.</span>
                </div>
              )}
            </div>
          </section>

          {/* ---------------------------------------------- price and promises */}
          <section className="dash-panel">
            <div className="dash-section-head">
              <div><span className="dash-eyebrow">Step 03</span><h2>Price &amp; promises</h2></div>
            </div>
            <div className="dash-field-row">
              <label className="dash-field">
                <span>Total price<b>Required</b></span>
                <input required type="number" min="0" step=".01" value={form.total_price} onChange={(event) => setForm({ ...form, total_price: event.target.value })} />
              </label>
              <label className="dash-field">
                <span>Payment plan</span>
                <select value={form.payment_plan} onChange={(event) => setForm({ ...form, payment_plan: event.target.value })}>
                  <option value="full">Full payment</option>
                  <option value="deposit_percent">Percentage deposit</option>
                  <option value="deposit_fixed">Fixed deposit</option>
                </select>
              </label>
              <label className="dash-field">
                <span>{depositFixed ? 'Deposit amount' : 'Deposit %'}</span>
                <input
                  type="number"
                  value={depositFixed ? form.deposit_amount : form.deposit_percent}
                  onChange={(event) => setForm({ ...form, [depositFixed ? 'deposit_amount' : 'deposit_percent']: event.target.value })}
                />
              </label>
            </div>
            <div className="dash-field-row">
              <label className="dash-field"><span>Deposit due</span><input type="date" value={form.deposit_due_date} onChange={(event) => setForm({ ...form, deposit_due_date: event.target.value })} /></label>
              <label className="dash-field"><span>Balance due</span><input type="date" value={form.balance_due_date} onChange={(event) => setForm({ ...form, balance_due_date: event.target.value })} /></label>
              <label className="dash-field"><span>Completion date</span><input type="date" value={form.completion_date} onChange={(event) => setForm({ ...form, completion_date: event.target.value })} /></label>
            </div>
          </section>

          {/* -------------------------------------------------------- notes */}
          <section className="dash-panel">
            <div className="dash-section-head">
              <div><span className="dash-eyebrow">Step 04</span><h2>Notes</h2></div>
            </div>
            <label className="dash-field"><span>Customer-visible notes</span><textarea value={form.customer_notes} onChange={(event) => setForm({ ...form, customer_notes: event.target.value })} /></label>
            <label className="dash-field"><span>Private workshop notes</span><textarea value={form.internal_notes} onChange={(event) => setForm({ ...form, internal_notes: event.target.value })} /></label>
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save proposal draft'}</button>
          </section>
        </form>

        {/* ----------------------------------------------------- history rail */}
        <aside className="pe-history dash-panel">
          <div className="dash-section-head"><div><h2>Proposal versions</h2></div></div>
          {!items.length ? (
            <p className="pe-history-empty">No versions saved yet. Your first draft will appear here.</p>
          ) : (
            <div className="pe-versions">
              {items.map((proposal) => (
                <article className="pe-version" key={proposal.id}>
                  <span className="pe-version-thumb">
                    {proposal.reference_images?.[0]
                      ? <img src={mediaUrl(proposal.reference_images[0].image)} alt="" />
                      : <ImagePlus size={18} />}
                  </span>
                  <div className="pe-version-main">
                    <b>Version {proposal.version}</b>
                    <small>{proposal.reference_images?.length || 0} references · {proposal.status}</small>
                    <strong>GH₵ {proposal.total_price}</strong>
                  </div>
                  {proposal.status === 'draft' && (
                    <button className="btn btn-primary btn-sm" onClick={() => appointmentsAdmin.sendProposal(proposal.id).then(load)}>
                      <Send size={13} />Send
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </aside>
      </div>
    </AdminShell>
  );
}
