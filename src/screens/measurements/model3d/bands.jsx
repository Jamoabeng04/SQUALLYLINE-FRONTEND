// screens/measurements/model3d/bands.jsx
// The gold measurement highlight drawn over the figure: a ring for girths, a
// capped line for lengths. Colour comes from the theme's antique-brass gold so
// it matches the 2D diagram and the rest of the UI.

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { PLACEMENTS, feminineScale } from './placements';

// A subtle pulse keeps the eye on the band without being noisy; driven by the
// material's emissiveIntensity in Figure's frame loop would couple files, so we
// keep it static here and let auto-rotate provide the motion.
const GOLD_ROUGHNESS = 0.35;

function GirthBand({ place, color, feminine, field }) {
  const r = feminine ? feminineScale(field, place.r) : place.r;
  const depth = (feminine ? feminineScale(field, place.depth ?? place.r * 0.72) : place.depth) ?? r * 0.72;
  return (
    <mesh
      position={[place.cx || 0, place.y, place.cz || 0]}
      rotation={[Math.PI / 2, 0, place.rot || 0]}
      scale={[1, depth / r, 1]}
    >
      {/* torus lies in the x/z plane after the x-rotation; y-scale squashes it
          front-to-back into the body's elliptical cross-section. */}
      <torusGeometry args={[r, 0.014, 18, 56]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.55}
        roughness={GOLD_ROUGHNESS}
        metalness={0.7}
        toneMapped={false}
      />
    </mesh>
  );
}

function LengthBand({ place, color }) {
  const { geometry, caps } = useMemo(() => {
    const pts = place.pts.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4);
    const geo = new THREE.TubeGeometry(curve, 48, 0.015, 12, false);
    return { geometry: geo, caps: [pts[0], pts[pts.length - 1]] };
  }, [place]);

  const mat = (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={0.55}
      roughness={GOLD_ROUGHNESS}
      metalness={0.7}
      toneMapped={false}
    />
  );

  return (
    <group>
      <mesh geometry={geometry}>{mat}</mesh>
      {caps.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.026, 16, 16]} />
          {mat}
        </mesh>
      ))}
    </group>
  );
}

export default function MeasureBand({ field, color, feminine }) {
  const place = PLACEMENTS[field];
  if (!place) return null;
  if (place.kind === 'girth') return <GirthBand place={place} color={color} feminine={feminine} field={field} />;
  return <LengthBand place={place} color={color} />;
}
