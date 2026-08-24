// screens/measurements/units.js
// Unit handling for the measurement workspace.
//
// The canonical stored value is ALWAYS centimetres for lengths and kilograms for
// weight — that is the contract every other screen reads. The unit system here
// only changes how a value is shown in, and typed into, the input. Nothing that
// reaches the API changes unit.

export const SYSTEMS = {
  metric: { length: 'cm', weight: 'kg' },
  imperial: { length: 'in', weight: 'lb' },
};

const CM_PER_IN = 2.54;
const LB_PER_KG = 2.2046226218;

const UNIT_STORAGE_KEY = 'squally-measure-units';

export const loadSystem = () => {
  try {
    const saved = localStorage.getItem(UNIT_STORAGE_KEY);
    if (saved === 'metric' || saved === 'imperial') return saved;
  } catch (_) { /* ignore */ }
  return 'metric';
};

export const saveSystem = (system) => {
  try { localStorage.setItem(UNIT_STORAGE_KEY, system); } catch (_) { /* ignore */ }
};

// Display precision differs by unit so the input never shows noise like 30.48.
const round = (value, decimals) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const unitLabel = (type, system) => SYSTEMS[system][type];

// Canonical (cm/kg) -> the number shown in the input for the active system.
export const toDisplay = (canonical, type, system) => {
  if (canonical === '' || canonical === null || canonical === undefined) return '';
  const value = Number(canonical);
  if (Number.isNaN(value)) return '';
  if (system === 'metric') return round(value, type === 'weight' ? 1 : 1);
  return type === 'weight' ? round(value * LB_PER_KG, 1) : round(value / CM_PER_IN, 2);
};

// The number typed in the active system -> canonical cm/kg for storage.
export const toCanonical = (display, type, system) => {
  if (display === '' || display === null || display === undefined) return '';
  const value = Number(display);
  if (Number.isNaN(value)) return '';
  if (system === 'metric') return round(value, 2);
  return type === 'weight' ? round(value / LB_PER_KG, 2) : round(value * CM_PER_IN, 2);
};

// Convert a canonical range bound into the active system, for input min/max/step.
export const rangeForInput = (range, type, system) => ({
  min: toDisplay(range.min, type, system),
  max: toDisplay(range.max, type, system),
  step: system === 'imperial' && type === 'length' ? 0.25 : 0.1,
});

// A short, unit-aware string for summaries, e.g. "94 cm" / "37"".
export const formatValue = (canonical, type, system) => {
  const shown = toDisplay(canonical, type, system);
  if (shown === '') return '—';
  const unit = unitLabel(type, system);
  return unit === 'in' ? `${shown}"` : `${shown} ${unit}`;
};
