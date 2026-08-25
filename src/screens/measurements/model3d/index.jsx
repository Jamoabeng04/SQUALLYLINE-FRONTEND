// screens/measurements/model3d/index.jsx
// MeasureModel3D — real-3D replacement for the flat measurement diagram. Renders
// a rotating tailor's dress form (procedural, or an optional realistic GLB) with
// the active field's measurement drawn on it as a glowing gold band.
//
// Lazy-loaded from Measurements.jsx so three.js ships as its own chunk. Degrades
// safely: no WebGL, or any render/GLB error, falls back to the always-available
// SVG <MeasureDiagram>. Same { field, gender } contract as that diagram.

import React, { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useTheme } from '../../../hooks/useTheme';
import MeasureDiagram from '../diagrams';
import { ProceduralForm, GLBModel } from './Figure';
import MeasureBand from './bands';

extend({ OrbitControls });

const MODEL_URL = process.env.REACT_APP_MEASURE_MODEL_URL || '';

const hasWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch (_) {
    return false;
  }
};

// Generic boundary: on any error below it, render `fallback` instead. Used twice
// — the outer one swaps in the SVG diagram, the inner one swaps a failed GLB for
// the procedural form.
class Boundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function Controls() {
  const { camera, gl } = useThree();
  const ref = useRef();
  useFrame(() => ref.current && ref.current.update());
  return (
    <orbitControls
      ref={ref}
      args={[camera, gl.domElement]}
      target={[0, 1.02, 0]}
      enablePan={false}
      enableZoom={false}
      enableDamping
      dampingFactor={0.08}
      autoRotate
      autoRotateSpeed={1.1}
      minPolarAngle={Math.PI / 2.7}
      maxPolarAngle={Math.PI / 1.75}
    />
  );
}

function Scene({ field, gender, gold, dark }) {
  const feminine = gender === 'F';
  const body = MODEL_URL ? (
    <Suspense fallback={<ProceduralForm gender={gender} dark={dark} />}>
      <Boundary resetKey={MODEL_URL} fallback={<ProceduralForm gender={gender} dark={dark} />}>
        <GLBModel url={MODEL_URL} />
      </Boundary>
    </Suspense>
  ) : (
    <ProceduralForm gender={gender} dark={dark} />
  );

  return (
    <>
      <hemisphereLight args={[0xffffff, 0x9a8f78, 0.55]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 6, 4]} intensity={1.05} />
      <directionalLight position={[-4, 2, -3]} intensity={0.35} />
      {body}
      <MeasureBand field={field} color={gold} feminine={feminine} />
      <Controls />
    </>
  );
}

export default function MeasureModel3D({ field, gender }) {
  const { colors, theme } = useTheme();
  const [webgl] = useState(hasWebGL);
  const gold = colors?.primary || '#D4AF37';
  const dark = theme?.mode === 'dark';

  const svgFallback = useMemo(
    () => (
      <div className="measurement-diagram-stage">
        <MeasureDiagram field={field} gender={gender} />
      </div>
    ),
    [field, gender],
  );

  if (!webgl) return svgFallback;

  return (
    <Boundary resetKey={field} fallback={svgFallback}>
      <div className="measurement-model-stage">
        <Canvas
          camera={{ position: [0, 1.18, 3.0], fov: 42 }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
          style={{ width: '100%', height: '100%' }}
        >
          <Scene field={field} gender={gender} gold={gold} dark={dark} />
        </Canvas>
        <span className="measurement-model-hint">Drag to rotate</span>
      </div>
    </Boundary>
  );
}
