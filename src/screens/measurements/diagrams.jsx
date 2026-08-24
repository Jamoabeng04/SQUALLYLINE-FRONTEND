// screens/measurements/diagrams.jsx
// Lightweight, always-available body diagrams for the measurement workspace.
//
// These are the reliable base layer of the tutorial: no external assets, no
// video download, theme-aware through CSS classes (see .measure-diagram in
// App.css). A per-field highlight is drawn over a shared silhouette — a gold
// "tape" loop for girths (front arc solid, back arc dashed to imply wrapping
// round the body) and a capped gold line for lengths.
//
// All geometry lives here, co-located with the silhouettes it references, so
// guides.js only carries content. Each field names a `figure` in guides.js; the
// exact coordinates for its highlight are in HIGHLIGHTS below.

import React from 'react';
import { GUIDES } from './guides';

// ------------------------------------------------------------- silhouettes

const Torso = () => (
  <g className="md-fig">
    <ellipse className="md-body" cx="80" cy="26" rx="15" ry="17" />
    <rect className="md-body" x="71" y="40" width="18" height="14" rx="4" />
    <path className="md-body-2" d="M44,64 L32,68 L28,180 L40,182 L52,74 Z" />
    <path className="md-body-2" d="M116,64 L128,68 L132,180 L120,182 L108,74 Z" />
    <path className="md-body" d="M44,62 L116,62 L106,150 L112,230 L48,230 L54,150 Z" />
  </g>
);

const FullBody = () => (
  <g className="md-fig">
    <ellipse className="md-body" cx="80" cy="30" rx="16" ry="19" />
    <rect className="md-body" x="71" y="46" width="18" height="12" rx="4" />
    <path className="md-body-2" d="M48,68 L36,72 L30,176 L42,178 L52,80 Z" />
    <path className="md-body-2" d="M112,68 L124,72 L130,176 L118,178 L108,80 Z" />
    <path className="md-body" d="M48,66 L112,66 L102,150 L110,208 L50,208 L58,150 Z" />
    <path className="md-body" d="M50,206 L52,332 L74,332 L79,210 Z" />
    <path className="md-body" d="M110,206 L108,332 L86,332 L81,210 Z" />
  </g>
);

const Neck = () => (
  <g className="md-fig">
    <path className="md-body" d="M18,152 C40,150 40,150 56,150 L64,150 L96,150 L104,150 C120,150 120,150 142,152 L142,182 L18,182 Z" />
    <path className="md-body" d="M62,98 L98,98 L106,152 L54,152 Z" />
    <ellipse className="md-body" cx="80" cy="58" rx="33" ry="40" />
  </g>
);

const Arm = () => (
  <g className="md-fig">
    <path className="md-body md-limb" d="M46,46 L60,140 L120,204" fill="none" />
    <ellipse className="md-body" cx="128" cy="214" rx="12" ry="9" />
    <circle className="md-body" cx="46" cy="46" r="16" />
  </g>
);

const Leg = () => (
  <g className="md-fig">
    <path className="md-body" d="M42,14 C34,60 36,120 44,150 C40,200 44,250 47,286 L44,300 L86,300 L83,286 C86,250 90,200 86,150 C94,120 96,60 88,14 Z" />
  </g>
);

const Scale = () => (
  <g className="md-fig">
    <rect className="md-body" x="34" y="40" width="92" height="80" rx="12" />
    <circle className="md-body-2" cx="80" cy="80" r="26" />
    <line className="md-line" x1="80" y1="80" x2="94" y2="66" />
    <circle className="md-cap" cx="80" cy="80" r="3.5" />
  </g>
);

const FIGURES = {
  torso: { View: Torso, viewBox: '0 0 160 250' },
  fullbody: { View: FullBody, viewBox: '0 0 160 344' },
  neck: { View: Neck, viewBox: '0 0 160 190' },
  arm: { View: Arm, viewBox: '0 0 170 250' },
  leg: { View: Leg, viewBox: '0 0 130 320' },
  scale: { View: Scale, viewBox: '0 0 160 160' },
};

// --------------------------------------------------- per-field highlights
// kind 'girth' = tape loop {cx,cy,rx,ry, rotate?}; 'line' = capped measure line
// {points:[[x,y]...]}; the figure is taken from GUIDES[field].figure.

const HIGHLIGHTS = {
  chest: { kind: 'girth', cx: 80, cy: 100, rx: 48, ry: 13 },
  bust: { kind: 'girth', cx: 80, cy: 106, rx: 50, ry: 14 },
  waist: { kind: 'girth', cx: 80, cy: 170, rx: 40, ry: 12 },
  hips: { kind: 'girth', cx: 80, cy: 216, rx: 52, ry: 15 },
  shoulder: { kind: 'line', points: [[44, 62], [116, 62]] },
  back_width: { kind: 'line', points: [[54, 90], [106, 90]] },
  front_length: { kind: 'line', points: [[80, 58], [82, 132], [84, 228]] },
  shoulder_to_waist: { kind: 'line', points: [[72, 58], [76, 110], [78, 170]] },
  neck: { kind: 'girth', cx: 80, cy: 128, rx: 26, ry: 9 },

  bicep: { kind: 'girth', cx: 53, cy: 92, rx: 23, ry: 8, rotate: 9 },
  wrist: { kind: 'girth', cx: 116, cy: 200, rx: 15, ry: 7, rotate: 46 },
  arm_length: { kind: 'line', points: [[46, 46], [60, 140], [120, 204]] },
  sleeve_length: { kind: 'line', points: [[80, 16], [46, 46], [60, 140], [120, 204]] },

  thigh: { kind: 'girth', cx: 64, cy: 66, rx: 30, ry: 10 },
  knee: { kind: 'girth', cx: 64, cy: 150, rx: 22, ry: 9 },
  calf: { kind: 'girth', cx: 64, cy: 206, rx: 27, ry: 10 },
  ankle: { kind: 'girth', cx: 64, cy: 282, rx: 18, ry: 8 },
  inseam: { kind: 'line', points: [[64, 46], [64, 292]] },
  outseam: { kind: 'line', points: [[40, 16], [46, 150], [47, 292]] },
  waist_to_knee: { kind: 'line', points: [[40, 16], [44, 90], [46, 150]] },
  waist_to_ankle: { kind: 'line', points: [[38, 16], [43, 150], [45, 292]] },

  height: { kind: 'line', points: [[142, 12], [142, 332]] },
  weight: null,
};

// A tape loop: back (upper) arc dashed, front (lower) arc solid → reads as
// wrapping around the body. Optionally rotated to follow a limb.
const Girth = ({ cx, cy, rx, ry, rotate = 0 }) => {
  const left = `${cx - rx},${cy}`;
  const right = `${cx + rx},${cy}`;
  const back = `M${left} A${rx},${ry} 0 0 1 ${right}`;
  const front = `M${left} A${rx},${ry} 0 0 0 ${right}`;
  return (
    <g transform={rotate ? `rotate(${rotate} ${cx} ${cy})` : undefined}>
      <path className="md-wrap-back" d={back} fill="none" />
      <path className="md-line" d={front} fill="none" />
      <circle className="md-cap" cx={cx - rx} cy={cy} r="3" />
      <circle className="md-cap" cx={cx + rx} cy={cy} r="3" />
    </g>
  );
};

const MeasureLine = ({ points }) => {
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
  const [fx, fy] = points[0];
  const [lx, ly] = points[points.length - 1];
  return (
    <g>
      <path className="md-line" d={d} fill="none" />
      <circle className="md-cap" cx={fx} cy={fy} r="4" />
      <circle className="md-cap" cx={lx} cy={ly} r="4" />
    </g>
  );
};

export default function MeasureDiagram({ field, gender }) {
  const guide = GUIDES[field];
  const figure = FIGURES[guide?.figure] || FIGURES.torso;
  const { View, viewBox } = figure;
  const hl = HIGHLIGHTS[field];
  const feminine = gender === 'F';

  return (
    <svg
      className={`measure-diagram${feminine ? ' is-feminine' : ''}`}
      viewBox={viewBox}
      role="img"
      aria-label={`Diagram showing where to measure the ${guide?.label?.toLowerCase() || field}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <View />
      {hl?.kind === 'girth' && <Girth {...hl} />}
      {hl?.kind === 'line' && <MeasureLine points={hl.points} />}
    </svg>
  );
}
