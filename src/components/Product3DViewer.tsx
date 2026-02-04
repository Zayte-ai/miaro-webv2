"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface Product3DViewerProps {
  modelPath?: string;
  className?: string;
}

function Model({ url }: { url: string }) {
  const [error, setError] = useState(false);
  
  try {
    const { scene } = useGLTF(url, undefined, undefined, (error) => {
      console.error("Error loading 3D model:", error);
      setError(true);
    });
    const meshRef = useRef<THREE.Group>(null);

    useFrame((state) => {
      if (meshRef.current) {
        meshRef.current.rotation.y =
          Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      }
    });

    if (error) {
      return <ModelPlaceholder />;
    }

    return <primitive ref={meshRef} object={scene} scale={1.5} />;
  } catch (err) {
    console.error("Model loading error:", err);
    return <ModelPlaceholder />;
  }
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
  // Valider que le modelPath est un fichier .glb ou .gltf valide
  const isValidModelPath = modelPath && 
    (modelPath.endsWith('.glb') || modelPath.endsWith('.gltf')) &&
    (modelPath.startsWith('/') || modelPath.startsWith('http'));

  return (
    <div
      className={`w-full h-96 bg-gray-100 rounded-lg overflow-hidden relative ${className}`}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        className="w-full h-full"
      >
        <Suspense fallback={null}>
          {/* Environment simple sans HDR externe */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 10, 5]} intensity={1.2} />
          <directionalLight position={[-10, -10, -5]} intensity={0.5} />
          <pointLight position={[0, 5, 0]} intensity={0.5} />

          {isValidModelPath ? <Model url={modelPath} /> : <ModelPlaceholder />}

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={8}
          />
        </Suspense>
      </Canvas>

      {!isValidModelPath && (
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
