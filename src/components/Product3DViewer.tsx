"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

interface Product3DViewerProps {
  modelPath?: string;
  className?: string;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return <primitive ref={meshRef} object={scene} scale={1.5} />;
}

function ModelPlaceholder() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
      meshRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 3, 0.5]} />
      <meshStandardMaterial color="#8B8B8B" />
    </mesh>
  );
}

export default function Product3DViewer({
  modelPath,
  className = "",
}: Product3DViewerProps) {
  return (
    <div
      className={`w-full h-96 bg-gray-100 rounded-lg overflow-hidden relative ${className}`}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        className="w-full h-full"
      >
        <Suspense fallback={null}>
          <Environment preset="studio" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />

          {modelPath ? <Model url={modelPath} /> : <ModelPlaceholder />}

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={8}
          />
        </Suspense>
      </Canvas>

      {!modelPath && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90">
          <div className="text-center">
            <div className="text-gray-500 text-sm">3D Model Preview</div>
            <div className="text-gray-400 text-xs mt-1">Coming Soon</div>
          </div>
        </div>
      )}
    </div>
  );
}
