// screens/measurements/model3d/Figure.jsx
// The 3D body itself. Two interchangeable sources that share the same 2.0-unit
// proportions so ../placements.js lines up on either:
//   ProceduralForm — a tailor's dress form (lathed bust block on a stand) with
//                    lightly ghosted arms and legs, built from primitives. Always
//                    available, no assets.
//   GLBModel       — an optional realistic .glb, uniformly scaled and re-centred
//                    to the same box on load. Used when REACT_APP_MEASURE_MODEL_URL
//                    is set; falls back to ProceduralForm on any load error.

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { BODY_HEIGHT } from './placements';

const BONE_LIGHT = '#D8CEBC';
const BONE_DARK = '#C6B99F';
const STAND = '#6F6656';

const formColor = (dark) => (dark ? BONE_DARK : BONE_LIGHT);

// Dress-form silhouette as [y, radius] pairs, bottom (upper thigh) to neck.
const PROFILE = [
  [0.98, 0.145], [1.06, 0.225], [1.15, 0.188], [1.24, 0.155], [1.32, 0.178],
  [1.4, 0.2], [1.46, 0.204], [1.52, 0.192], [1.57, 0.2], [1.6, 0.15],
  [1.63, 0.1], [1.67, 0.078],
];

const feminineProfile = (y, r) => {
  if (y >= 1.02 && y <= 1.12) return r * 1.07; // fuller hips
  if (y >= 1.2 && y <= 1.28) return r * 0.9; // nipped waist
  if (y >= 1.38 && y <= 1.48) return r * 1.03; // fuller bust
  return r;
};

export function ProceduralForm({ gender, dark }) {
  const feminine = gender === 'F';
  const color = formColor(dark);

  const torso = useMemo(() => {
    const pts = PROFILE.map(([y, r]) => new THREE.Vector2(feminine ? feminineProfile(y, r) : r, y));
    return new THREE.LatheGeometry(pts, 64);
  }, [feminine]);

  const skin = { color, roughness: 0.8, metalness: 0.04 };
  const ghost = { color, roughness: 0.85, metalness: 0.03, transparent: true, opacity: 0.24, depthWrite: false };

  return (
    <group>
      {/* dress-form bust block */}
      <mesh geometry={torso} castShadow>
        <meshStandardMaterial {...skin} />
      </mesh>

      {/* neck stub + faint head so the neck field reads */}
      <mesh position={[0, 1.72, 0]}>
        <cylinderGeometry args={[0.072, 0.082, 0.12, 32]} />
        <meshStandardMaterial {...skin} />
      </mesh>
      <mesh position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.1, 32, 24]} />
        <meshStandardMaterial {...skin} transparent opacity={0.5} depthWrite={false} />
      </mesh>

      {/* ghost arms */}
      {[-1, 1].map((s) => (
        <mesh key={`a${s}`} position={[s * 0.235, 1.28, 0.0]} rotation={[0, 0, s * -0.05]}>
          <capsuleGeometry args={[0.05, 0.56, 6, 18]} />
          <meshStandardMaterial {...ghost} />
        </mesh>
      ))}

      {/* ghost legs */}
      {[-1, 1].map((s) => (
        <mesh key={`l${s}`} position={[s * 0.1, 0.54, 0.0]}>
          <capsuleGeometry args={[0.088, 0.72, 6, 18]} />
          <meshStandardMaterial {...ghost} />
        </mesh>
      ))}

      {/* tailor's stand: pole + base disc */}
      <mesh position={[0, 0.55, -0.02]}>
        <cylinderGeometry args={[0.028, 0.028, 0.9, 16]} />
        <meshStandardMaterial color={STAND} roughness={0.4} metalness={0.55} />
      </mesh>
      <mesh position={[0, 0.04, -0.02]}>
        <cylinderGeometry args={[0.3, 0.34, 0.06, 40]} />
        <meshStandardMaterial color={STAND} roughness={0.4} metalness={0.55} />
      </mesh>
    </group>
  );
}

export function GLBModel({ url }) {
  const gltf = useLoader(GLTFLoader, url);
  const scene = useMemo(() => {
    const root = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const scale = size.y > 0 ? BODY_HEIGHT / size.y : 1;
    root.scale.setScalar(scale);
    // re-centre x/z on the axis and drop feet to y=0
    root.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    return root;
  }, [gltf]);

  return <primitive object={scene} />;
}
