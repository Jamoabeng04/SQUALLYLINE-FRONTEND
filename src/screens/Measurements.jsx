import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, Check, CheckCircle2, ChevronRight, CircleHelp,
  Clock3, Eye, Pencil, Plus, Ruler, Save, ShieldCheck, Trash2, User, Users,
} from 'lucide-react';
import { people as peopleApi, measurements as measurementsApi } from '../api/endpoints';
import { useToast } from '../providers/ToastProvider';
import {
  GUIDES, GROUPS, REQUIRED, ALL_FIELDS, NEED_LABELS, labelFor,
} from './measurements/guides';
import {
  loadSystem, saveSystem, unitLabel, toDisplay, toCanonical, rangeForInput, formatValue,
} from './measurements/units';
// The 3D dress-form guide is heavy (three.js), so it loads as its own chunk only
// when the workspace opens. It carries its own SVG-diagram fallback internally.
const MeasureModel3D = lazy(() => import('./measurements/model3d'));

const REQUIRED_SET = new Set(REQUIRED);
const EMPTY_VALUES = Object.fromEntries(ALL_FIELDS.map((field) => [field, '']));
const NEED_ICON = { tape: Ruler, mirror: Eye, helper: Users };

// Optional studio clips are served from here. Hosting them on a CDN keeps them
// out of the app bundle; falls back to /public when the env var is unset.
const GUIDE_BASE = process.env.REACT_APP_MEASURE_GUIDE_BASE || '/measurement-guides';
const draftKey = (personId, measurementId) => `squally-measure-draft:${personId}:${measurementId || 'new'}`;

// A field's stored value is canonical cm/kg; only the range check needs it back.
const outOfRange = (field, canonical) => {
  const value = Number(canonical);
  if (canonical === '' || Number.isNaN(value)) return false;
  const { min, max } = GUIDES[field].range;
  return value < min || value > max;
};
const outsideTypical = (field, canonical) => {
  const value = Number(canonical);
  if (canonical === '' || Number.isNaN(value)) return false;
  const [lo, hi] = GUIDES[field].range.typical;
  return value < lo || value > hi;
};

function GuidePanel({ field, gender }) {
  const [videoFailed, setVideoFailed] = useState(false);
  const guideGender = gender === 'F' ? 'female' : 'male';
  const source = `${GUIDE_BASE}/${guideGender}/${field}.mp4`;
  const guide = GUIDES[field];

  useEffect(() => setVideoFailed(false), [source]);

  return (
    <section className="measurement-guide" aria-live="polite">
      <div className="measurement-visual-frame">
        {!videoFailed ? (
          <video key={source} controls playsInline preload="metadata" onError={() => setVideoFailed(true)}>
            <source src={source} type="video/mp4" />
          </video>
        ) : (
          <Suspense fallback={<div className="measurement-model-stage is-loading"><span>Loading 3D…</span></div>}>
            <MeasureModel3D field={field} gender={gender} />
          </Suspense>
        )}
        <span className="measurement-visual-tag">{videoFailed ? '3D model' : `${guideGender} video`}</span>
      </div>

      <div className="measurement-guide-copy">
        <span className="measurement-guide-number">How to measure</span>
        <h2>{guide.label}</h2>
        <p>{guide.intro}</p>

        {guide.needs.length > 0 && (
          <ul className="measurement-needs">
            {guide.needs.map((need) => {
              const Icon = NEED_ICON[need] || CircleHelp;
              return <li key={need}><Icon size={14} />{NEED_LABELS[need]}</li>;
            })}
          </ul>
        )}

        <ol className="measurement-steps">
          {guide.steps.map((step, index) => <li key={index}>{step}</li>)}
        </ol>

        {guide.mistakes.length > 0 && (
          <div className="measurement-mistakes">
            <span><AlertTriangle size={14} /> Common mistakes</span>
            <ul>{guide.mistakes.map((mistake, index) => <li key={index}>{mistake}</li>)}</ul>
          </div>
        )}
      </div>
    </section>
  );
}

function PersonForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(initial || { name: '', relationship: 'other', gender: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const relationships = [['mother', 'Mother'], ['father', 'Father'], ['sister', 'Sister'], ['brother', 'Brother'], ['friend', 'Friend'], ['spouse', 'Spouse'], ['child', 'Child'], ['other', 'Other / myself']];
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setError(''); setSaving(true);
    try {
      if (!form.name.trim() || !form.gender) throw new Error('Name and guide gender are required.');
      const payload = { name: form.name.trim(), relationship: form.relationship, gender: form.gender, phone: form.phone || '', email: form.email || '' };
      if (initial?.id) await peopleApi.update(initial.id, payload); else await peopleApi.create(payload);
      onSaved();
    } catch (err) { setError(err?.message || 'Could not save this profile.'); }
    finally { setSaving(false); }
  };
  return (
    <section className="measurement-person-editor">
      <div className="measurement-section-head"><div><span>Profile</span><h2>{initial ? 'Edit person' : 'Who are you measuring?'}</h2></div></div>
      {error && <div className="measurement-error"><AlertTriangle size={17} />{error}</div>}
      <form onSubmit={submit} className="measurement-person-form">
        <label>Name<input autoFocus value={form.name} onChange={set('name')} placeholder="e.g. Ama" /></label>
        <label>Relationship<select value={form.relationship} onChange={set('relationship')}>{relationships.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label>Measurement guide<select required value={form.gender} onChange={set('gender')}><option value="">Choose a guide</option><option value="M">Male body</option><option value="F">Female body</option><option value="O">Other / use male guide</option></select></label>
        <label>Phone, optional<input value={form.phone || ''} onChange={set('phone')} /></label>
        <label>Email, optional<input type="email" value={form.email || ''} onChange={set('email')} /></label>
        <div className="measurement-form-actions"><button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button></div>
      </form>
    </section>
  );
}

function MeasurementWorkspace({ person, initial, onExit, onSaved }) {
  const { showToast } = useToast();
  const storageKey = draftKey(person.id, initial?.id);
  // `values` always holds canonical cm / kg, independent of the display unit.
  const [values, setValues] = useState(() => {
    try { const draft = JSON.parse(localStorage.getItem(storageKey)); if (draft?.values) return { ...EMPTY_VALUES, ...draft.values }; } catch (_) { /* ignore */ }
    return { ...EMPTY_VALUES, ...(initial?.data || {}) };
  });
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey))?.notes ?? initial?.notes ?? ''; } catch (_) { return initial?.notes ?? ''; }
  });
  const [activeField, setActiveField] = useState('chest');
  const [system, setSystem] = useState(loadSystem);
  const [entry, setEntry] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draftSavedAt, setDraftSavedAt] = useState(null);

  const activeUnit = GUIDES[activeField].unit;
  const completed = ALL_FIELDS.filter((field) => String(values[field] || '').trim()).length;
  const requiredCompleted = REQUIRED.filter((field) => String(values[field] || '').trim()).length;
  const progress = Math.round((requiredCompleted / REQUIRED.length) * 100);

  // Re-seed the input string from the canonical value whenever the field or the
  // unit system changes, so switching cm/in reformats without corrupting typing.
  useEffect(() => { setEntry(String(toDisplay(values[activeField], activeUnit, system))); }, [activeField, system]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify({ values, notes, updatedAt: new Date().toISOString() }));
      setDraftSavedAt(new Date());
    }, 250);
    return () => clearTimeout(timer);
  }, [values, notes, storageKey]);

  const onEntryChange = (event) => {
    const raw = event.target.value;
    setEntry(raw);
    setValues((current) => ({ ...current, [activeField]: raw === '' ? '' : String(toCanonical(raw, activeUnit, system)) }));
  };

  const changeSystem = (next) => { setSystem(next); saveSystem(next); };

  const save = async () => {
    const missing = REQUIRED.filter((field) => !String(values[field] || '').trim());
    if (missing.length) { setError(`Complete ${missing.map(labelFor).join(', ')} before saving.`); return; }
    const provided = Object.entries(values).filter(([, value]) => String(value).trim() !== '');
    const bad = provided.filter(([field, value]) => outOfRange(field, value));
    if (bad.length) { setError(`These look outside a realistic range — please re-check: ${bad.map(([field]) => labelFor(field)).join(', ')}.`); return; }
    const data = Object.fromEntries(provided);
    setSaving(true); setError('');
    try {
      const payload = { person: person.id, data, notes: notes.trim(), is_active: true };
      if (initial?.id) await measurementsApi.update(initial.id, payload); else await measurementsApi.create(payload);
      localStorage.removeItem(storageKey); showToast('Measurements saved.', 'success'); onSaved();
    } catch (err) { setError(err?.message || 'Could not save these measurements. Your local draft is still safe.'); }
    finally { setSaving(false); }
  };

  const move = (direction) => {
    const index = ALL_FIELDS.indexOf(activeField);
    setActiveField(ALL_FIELDS[Math.max(0, Math.min(ALL_FIELDS.length - 1, index + direction))]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const softWarning = outsideTypical(activeField, values[activeField]);
  const inputRange = rangeForInput(GUIDES[activeField].range, activeUnit, system);

  return (
    <main className="measurement-workspace">
      <header className="measurement-workspace-bar">
        <button className="icon-btn" onClick={onExit} title="Back to measurement profiles"><ArrowLeft size={19} /></button>
        <div className="measurement-workspace-title"><strong>{initial ? 'Update measurements' : 'New measurements'}</strong><span>{person.name} · {person.gender === 'F' ? 'female guide' : 'male guide'}</span></div>
        <div className="measurement-unit-toggle" role="group" aria-label="Measurement units">
          <button className={system === 'metric' ? 'active' : ''} onClick={() => changeSystem('metric')} type="button">cm</button>
          <button className={system === 'imperial' ? 'active' : ''} onClick={() => changeSystem('imperial')} type="button">in</button>
        </div>
        <div className="measurement-save-state"><Check size={14} />{draftSavedAt ? 'Draft saved' : 'Autosaving'}</div>
        <button className="btn btn-primary" disabled={saving} onClick={save}><Save size={16} />{saving ? 'Saving...' : 'Save measurements'}</button>
      </header>

      <div className="measurement-professional-note">
        <ShieldCheck size={22} /><div><strong>For the best fit, use a professional.</strong><p>Self-measurement can introduce small errors that affect a tailored garment. We recommend having a tailor or another person take and verify every measurement.</p></div>
      </div>

      {error && <div className="measurement-error"><AlertTriangle size={18} />{error}</div>}

      <div className="measurement-workspace-layout">
        <aside className="measurement-step-nav">
          <div className="measurement-progress">
            <div><span>Core measurements</span><b>{requiredCompleted}/{REQUIRED.length}</b></div>
            <progress value={progress} max="100" /><small>{completed} of {ALL_FIELDS.length} fields recorded</small>
          </div>
          {GROUPS.map((group) => (
            <div className="measurement-step-group" key={group.id}>
              <h3>{group.label}</h3>
              {group.fields.map((field) => (
                <button key={field} className={activeField === field ? 'active' : ''} onClick={() => setActiveField(field)}>
                  <span>{values[field] ? <CheckCircle2 size={16} /> : <span className="measurement-step-dot" />}{labelFor(field)}</span>
                  {REQUIRED_SET.has(field) && <small>required</small>}
                </button>
              ))}
            </div>
          ))}
        </aside>

        <section className="measurement-entry">
          <GuidePanel field={activeField} gender={person.gender} />

          <div className="measurement-entry-main">
            <div className="measurement-entry-heading">
              <span>{ALL_FIELDS.indexOf(activeField) + 1} of {ALL_FIELDS.length}</span>
              <h1>{labelFor(activeField)}{REQUIRED_SET.has(activeField) && <b>Required</b>}</h1>
            </div>

            <label className="measurement-value-field">
              <span>Enter the measurement in {unitLabel(activeUnit, system)}</span>
              <div>
                <input
                  autoFocus type="number" min={inputRange.min} max={inputRange.max} step={inputRange.step}
                  inputMode="decimal" value={entry} onChange={onEntryChange} placeholder="0.0"
                />
                <strong>{unitLabel(activeUnit, system)}</strong>
              </div>
              {softWarning
                ? <small className="measurement-soft-warn"><AlertTriangle size={13} /> Unusual for most people — double-check this value.</small>
                : <small>Measure twice. Enter the result only after both checks agree.</small>}
            </label>

            <label className="measurement-notes-field"><span>Notes for the tailor</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Posture, fit preference, mobility consideration, or anything the tailor should know." /></label>

            <div className="measurement-entry-actions">
              <button className="btn btn-ghost" disabled={activeField === ALL_FIELDS[0]} onClick={() => move(-1)}>Previous</button>
              <button className="btn btn-primary" disabled={activeField === ALL_FIELDS.at(-1)} onClick={() => move(1)}>Next measurement<ChevronRight size={16} /></button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function MeasurementsPage() {
  const { showToast } = useToast();
  const [people, setPeople] = useState([]);
  const [sets, setSets] = useState({});
  const [loading, setLoading] = useState(true);
  const [personEditor, setPersonEditor] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const system = useMemo(loadSystem, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const profiles = await peopleApi.list(); setPeople(profiles);
      const entries = await Promise.all(profiles.map(async (person) => [person.id, await peopleApi.measurements(person.id)]));
      setSets(Object.fromEntries(entries));
    } catch (err) { showToast(err?.message || 'Could not load measurement profiles.', 'error'); }
    finally { setLoading(false); }
  }, [showToast]);
  useEffect(() => { load(); }, [load]);

  const pendingDrafts = (() => {
    let count = 0; for (let index = 0; index < localStorage.length; index += 1) if (localStorage.key(index)?.startsWith('squally-measure-draft:')) count += 1; return count;
  })();
  const removePerson = async (person) => { if (!window.confirm(`Delete ${person.name} and all saved measurements?`)) return; await peopleApi.remove(person.id); load(); };
  const removeSet = async (measurement) => { if (!window.confirm('Delete this saved measurement set?')) return; await measurementsApi.remove(measurement.id); load(); };
  const activate = async (measurement) => { await measurementsApi.setActive(measurement.id); showToast('Active measurements updated.', 'success'); load(); };

  if (workspace) return <MeasurementWorkspace person={workspace.person} initial={workspace.measurement} onExit={() => setWorkspace(null)} onSaved={() => { setWorkspace(null); load(); }} />;

  return (
    <main className="measurement-page-v2">
      <header className="measurement-page-hero">
        <div><span><Ruler size={14} /> Fit profiles</span><h1>Measurements that your tailor can trust.</h1><p>Create a profile for each person, follow one field at a time with an illustrated guide, and keep every draft safe while you work.</p></div>
        <button className="btn btn-primary" onClick={() => setPersonEditor({ mode: 'new' })}><Plus size={16} />Add person</button>
      </header>

      <section className="measurement-disclaimer"><AlertTriangle size={22} /><div><strong>Professional measurement is recommended.</strong><p>Online guides reduce mistakes, but a professional tailor is still the best choice for close-fitting, formal, bridal, or high-value garments.</p></div></section>

      {pendingDrafts > 0 && <div className="measurement-draft-notice"><Clock3 size={18} /><span>{pendingDrafts} locally saved measurement draft{pendingDrafts === 1 ? '' : 's'} can be resumed from the relevant profile.</span></div>}

      {personEditor && <PersonForm initial={personEditor.person} onCancel={() => setPersonEditor(null)} onSaved={() => { setPersonEditor(null); load(); }} />}

      {loading ? <div className="measurement-loading">Loading profiles...</div> : people.length === 0 ? (
        <section className="measurement-empty-v2"><Users size={34} /><h2>Start with the person being measured</h2><p>The guide shown for each body area is selected from this profile.</p><button className="btn btn-primary" onClick={() => setPersonEditor({ mode: 'new' })}>Create first profile</button></section>
      ) : (
        <div className="measurement-profile-grid">{people.map((person) => {
          const measurements = sets[person.id] || []; const active = measurements.find((item) => item.is_active) || measurements[0];
          const activeDraft = active && localStorage.getItem(draftKey(person.id, active.id));
          const newDraft = localStorage.getItem(draftKey(person.id));
          const resumable = activeDraft || newDraft;
          return (
            <article className="measurement-profile-card" key={person.id}>
              <div className="measurement-profile-head">
                <div className="measurement-profile-avatar"><User size={22} /></div>
                <div><h2>{person.name}</h2><p>{person.relationship} · {person.gender === 'F' ? 'female guide' : 'male guide'}</p></div>
                <div className="measurement-profile-menu"><button className="icon-btn" title="Edit person" onClick={() => setPersonEditor({ mode: 'edit', person })}><Pencil size={16} /></button><button className="icon-btn" title="Delete person" onClick={() => removePerson(person)}><Trash2 size={16} /></button></div>
              </div>
              {active ? (
                <div className="measurement-summary">
                  <span><CheckCircle2 size={15} />Active set</span><strong>{new Date(active.updated_at || active.created_at).toLocaleDateString()}</strong>
                  <div>{['chest', 'waist', 'hips', 'shoulder'].map((field) => <span key={field}><small>{labelFor(field)}</small><b>{formatValue(active.data?.[field], 'length', system)}</b></span>)}</div>
                </div>
              ) : <div className="measurement-no-set">No completed measurement set yet.</div>}
              <div className="measurement-profile-actions">
                <button className="btn btn-primary" onClick={() => setWorkspace({ person, measurement: newDraft ? null : active || null })}>{resumable ? 'Resume draft' : active ? 'Update measurements' : 'Take measurements'}</button>
                <button className="btn btn-ghost" onClick={() => setWorkspace({ person, measurement: null })}><Plus size={15} />New set</button>
              </div>
              {measurements.length > 1 && <details className="measurement-history"><summary>{measurements.length} saved sets</summary>{measurements.map((measurement) => <div key={measurement.id}><span>{new Date(measurement.created_at).toLocaleDateString()}</span>{measurement.is_active ? <b>Active</b> : <button onClick={() => activate(measurement)}>Use this set</button>}<button className="icon-btn" onClick={() => removeSet(measurement)}><Trash2 size={14} /></button></div>)}</details>}
            </article>
          );
        })}</div>
      )}
    </main>
  );
}
