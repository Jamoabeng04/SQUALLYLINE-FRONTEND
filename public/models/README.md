# 3D measurement model

The measurement workspace shows each field on a **rotating 3D tailor's dress form**
(`src/screens/measurements/model3d/`). By default the form is built procedurally
from geometry — a lathed bust block on a stand with lightly ghosted arms and legs —
so it always renders with no assets to ship or download.

## Using a realistic GLB model (optional)

You can replace the procedural form with a realistic `.glb` mannequin/dress-form:

1. Drop the file in this folder, e.g. `public/models/dress-form.glb`.
2. Point the app at it at build time:

   ```bash
   REACT_APP_MEASURE_MODEL_URL=/models/dress-form.glb
   ```

   To serve it from a CDN or object storage instead, set the full URL:

   ```bash
   REACT_APP_MEASURE_MODEL_URL=https://cdn.example.com/models/dress-form.glb
   ```

When the variable is set the app loads that model; if it is unset (the default),
or the file is missing or fails to load, the procedural dress form is used
instead. If WebGL is unavailable the workspace falls back to the flat SVG diagram
(`src/screens/measurements/diagrams.jsx`).

## Model requirements

The loader is tolerant, but a model works best when it is:

- **Upright**, standing, facing **+Z** (toward the viewer), roughly front-facing.
- Centred left-to-right; feet near the bottom of the mesh.
- Any real-world scale — the model is uniformly scaled and re-centred to a
  2-unit-tall box on load, so the gold measurement bands line up automatically.
- A single `.glb` (glTF binary). Keep it lean (a few MB); Draco/meshopt
  compression is fine as long as it decodes without extra loader setup.

The measurement bands (gold rings for girths, gold lines for lengths) are
positioned from `src/screens/measurements/model3d/placements.js` in that
normalized body space. If a specific model's proportions differ noticeably, tune
the values there.
