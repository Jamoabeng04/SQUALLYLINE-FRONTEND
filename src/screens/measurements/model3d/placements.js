// screens/measurements/model3d/placements.js
// Per-field 3D measurement highlights for the dress-form model — the 3D
// counterpart to HIGHLIGHTS in ../diagrams.jsx.
//
// All coordinates are in MODEL SPACE, a body 2.0 units tall standing with feet
// at y=0 and the crown near y=1.9, centred on x=z=0, facing +z. The procedural
// dress form is built to these proportions; a loaded GLB is uniformly scaled and
// re-centred to the same 2.0-unit box on load (see Figure.jsx), so the same
// numbers line up on either model — that is what makes band placement robust to
// whichever mesh is supplied.
//
//   kind 'girth'  -> a tape ring around a body part.
//       { y, r, depth?, cx?, cz?, rot? }  r = ring radius, depth = front/back
//       radius (ellipse; defaults to r*0.72), cx/cz = ring centre offset for a
//       limb, rot = tilt in radians about z to follow a limb.
//   kind 'length' -> a capped line running along the body.
//       { pts: [[x,y,z], ...] }
//   null          -> no band (weight).

export const BODY_HEIGHT = 2.0;

export const PLACEMENTS = {
  // ---------------------------------------------------------------- core fit
  chest: { kind: 'girth', y: 1.44, r: 0.205, depth: 0.15 },
  waist: { kind: 'girth', y: 1.24, r: 0.16, depth: 0.12 },
  hips: { kind: 'girth', y: 1.06, r: 0.225, depth: 0.16 },
  neck: { kind: 'girth', y: 1.62, r: 0.088, depth: 0.075 },
  shoulder: { kind: 'length', pts: [[-0.23, 1.58, 0.02], [0, 1.61, 0.05], [0.23, 1.58, 0.02]] },

  // --------------------------------------------------------------- upper body
  bust: { kind: 'girth', y: 1.42, r: 0.215, depth: 0.165 },
  back_width: { kind: 'length', pts: [[-0.2, 1.5, -0.06], [0, 1.52, -0.09], [0.2, 1.5, -0.06]] },
  front_length: { kind: 'length', pts: [[0, 1.6, 0.07], [0, 1.32, 0.15], [0, 1.02, 0.11]] },
  shoulder_to_waist: { kind: 'length', pts: [[-0.11, 1.6, 0.05], [-0.03, 1.42, 0.13], [0, 1.24, 0.07]] },
  arm_length: { kind: 'length', pts: [[0.21, 1.58, 0.02], [0.25, 1.3, 0.04], [0.27, 1.0, 0.02]] },
  sleeve_length: { kind: 'length', pts: [[0, 1.62, -0.03], [0.21, 1.58, 0.0], [0.27, 1.0, 0.02]] },
  bicep: { kind: 'girth', y: 1.36, r: 0.062, depth: 0.058, cx: 0.24 },
  wrist: { kind: 'girth', y: 1.0, r: 0.036, depth: 0.033, cx: 0.27 },

  // --------------------------------------------------------------- lower body
  thigh: { kind: 'girth', y: 0.86, r: 0.12, depth: 0.11, cx: 0.1 },
  knee: { kind: 'girth', y: 0.54, r: 0.078, depth: 0.072, cx: 0.1 },
  calf: { kind: 'girth', y: 0.4, r: 0.088, depth: 0.082, cx: 0.1 },
  ankle: { kind: 'girth', y: 0.11, r: 0.05, depth: 0.046, cx: 0.1 },
  inseam: { kind: 'length', pts: [[0.06, 0.94, 0.02], [0.09, 0.5, 0.01], [0.1, 0.12, 0.0]] },
  outseam: { kind: 'length', pts: [[0.17, 1.24, 0.04], [0.18, 0.6, 0.02], [0.16, 0.12, 0.0]] },
  waist_to_knee: { kind: 'length', pts: [[0.17, 1.24, 0.04], [0.15, 0.88, 0.05], [0.11, 0.54, 0.02]] },
  waist_to_ankle: { kind: 'length', pts: [[0.17, 1.24, 0.04], [0.16, 0.6, 0.02], [0.11, 0.12, 0.0]] },

  // ------------------------------------------------------------------ general
  height: { kind: 'length', pts: [[0.35, 0.02, 0], [0.35, 1.9, 0]] },
  weight: null,
};

// Feminine guide: gentle silhouette shift used by both the lathe profile and the
// girth radii (nipped waist, fuller hips/bust).
export const feminineScale = (field, r) => {
  if (field === 'hips') return r * 1.06;
  if (field === 'waist') return r * 0.93;
  if (field === 'bust' || field === 'chest') return r * 1.02;
  return r;
};
