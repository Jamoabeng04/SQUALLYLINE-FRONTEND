# Measurement guides

Every measurement field in the workspace shows a **rotating 3D tailor's dress
form** with a gold band marking exactly where to measure, plus written steps,
common mistakes, and the tools needed. The dress form is built procedurally, so
it ships with the app — no assets, no downloads. An optional realistic `.glb`
model can replace it (see `public/models/README.md`). Where WebGL is unavailable,
a theme-aware SVG body diagram (`src/screens/measurements/diagrams.jsx`) is shown
instead.

Studio **video clips are an optional enhancement**. When a clip is present for a
field it plays in place of the 3D model; when it is missing (or fails to load)
the 3D model is shown instead. You can ship the app with no videos at all.

## Where clips are loaded from

By default the workspace looks for clips under `/measurement-guides`:

```text
public/measurement-guides/male/<field>.mp4
public/measurement-guides/female/<field>.mp4
```

To serve clips from a CDN or object storage instead of bundling them in
`/public`, set the base URL at build time:

```bash
REACT_APP_MEASURE_GUIDE_BASE=https://cdn.example.com/measure-guides
```

The workspace then requests `<base>/male/<field>.mp4` and
`<base>/female/<field>.mp4`. Leaving the variable unset falls back to the local
`/measurement-guides` path above.

## Field names

Each gender folder may contain any subset of clips named: `chest`, `waist`,
`hips`, `shoulder`, `neck`, `bust`, `back_width`, `front_length`,
`shoulder_to_waist`, `arm_length`, `sleeve_length`, `bicep`, `wrist`, `inseam`,
`outseam`, `thigh`, `knee`, `calf`, `ankle`, `waist_to_knee`, `waist_to_ankle`,
`height`, and `weight`. Any field without a clip simply uses its diagram.

The `female` folder is used for profiles whose measurement guide is female; all
other profiles use `male`. These names are the field keys and must not be
renamed — they match the saved measurement data contract.

## Producing clips

Use short landscape or portrait MP4/H.264 clips with clear consent and usage
rights. Keep the full body and tape visible, avoid background music, and add
captions directly to the video or as WebVTT tracks. Target under 8 MB per clip.
