'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface Image360ViewerProps {
  productId: string;
  totalFrames?: number;
  alt?: string;
  className?: string;
}

/**
 * StockX-Style 360° Product Viewer
 * 
 * Features:
 * - Drag-based rotation with smooth inertia
 * - Momentum continues after mouse/touch release
 * - Natural deceleration (ease-out)
 * - No visible UI controls (just drag)
 * - Intelligent preloading strategy
 * - Grab/grabbing cursor states
 * - requestAnimationFrame for 60fps
 */
export default function Image360Viewer({
  productId,
  totalFrames = 37,
  alt = 'Product 360° View',
  className = ''
}: Image360ViewerProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Refs for physics-based rotation
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const velocityRef = useRef(0); // Pixels per frame
  const lastTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  
  // Preloading state
  const loadedImagesRef = useRef(new Set<number>());
  
  // Sensitivity: how many pixels to drag to advance one frame (lower = more sensitive)
  const SENSITIVITY = 2;
  const DECAY = 0.92; // Momentum decay factor (0.92 = smooth deceleration)
  
  // Generate URLs for all frames
  const urls = Array.from({ length: totalFrames }, (_, i) => {
    const frameNumber = String(i + 1).padStart(3, '0');
    return `/images/products/${productId}/360/${frameNumber}.jpg`;
  });

  // Mount effect for hydration safety
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initial image load
  useEffect(() => {
    if (urls.length === 0) return;
    
    const img = new window.Image();
    img.onload = () => {
      loadedImagesRef.current.add(0);
      setIsLoading(false);
    };
    img.onerror = () => {
      console.error(`Failed to load initial 360° image: ${urls[0]}`);
      setIsLoading(false);
    };
    img.src = urls[0];
  }, [urls]);

  // Intelligent preloading strategy
  useEffect(() => {
    if (isLoading || urls.length === 0) return;

    // Priority 1: Current frame + immediate neighbors (±5 frames)
    const priorityFrames = [];
    for (let offset = -5; offset <= 5; offset++) {
      const frameIdx = (currentFrame + offset + totalFrames) % totalFrames;
      if (!loadedImagesRef.current.has(frameIdx)) {
        priorityFrames.push(frameIdx);
      }
    }

    // Preload priority frames first
    priorityFrames.forEach(frameIdx => {
      const img = new window.Image();
      img.onload = () => loadedImagesRef.current.add(frameIdx);
      img.src = urls[frameIdx];
    });

    // Priority 2: Background load remaining frames
    const timeout = setTimeout(() => {
      for (let i = 0; i < totalFrames; i++) {
        if (!loadedImagesRef.current.has(i)) {
          const img = new window.Image();
          img.onload = () => loadedImagesRef.current.add(i);
          img.src = urls[i];
        }
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [currentFrame, isLoading, urls, totalFrames]);

  // Momentum animation loop
  const animate = useCallback(() => {
    if (Math.abs(velocityRef.current) < 0.1) {
      // Stop animation when velocity is negligible
      velocityRef.current = 0;
      animationFrameRef.current = null;
      return;
    }

    // Apply velocity to current frame
    setCurrentFrame((prev) => {
      const delta = velocityRef.current / SENSITIVITY;
      const newFrame = prev + delta;
      // Normalize to 0-totalFrames range (infinite loop)
      return ((Math.round(newFrame) % totalFrames) + totalFrames) % totalFrames;
    });

    // Decay velocity (ease-out effect)
    velocityRef.current *= DECAY;
    
    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [totalFrames]);

  // Start momentum animation
  const startMomentum = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [animate]);

  // Pointer down (mouse + touch unified)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    velocityRef.current = 0; // Reset velocity when starting new drag
    lastTimeRef.current = Date.now();
    
    // Update cursor position
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    
    // Cancel any ongoing momentum
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Capture pointer for smooth tracking
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  // Pointer move (dragging)
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Always update cursor position when moving inside container
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }

    if (!isDragging) return;
    e.preventDefault();

    const deltaX = e.clientX - startXRef.current;
    const currentTime = Date.now();
    const deltaTime = Math.max(currentTime - lastTimeRef.current, 1); // Prevent division by zero

    // Calculate velocity (pixels per millisecond, scaled to 60fps)
    velocityRef.current = (deltaX / deltaTime) * 16; // 16ms ≈ 60fps frame time
    
    // Update frame based on drag distance
    setCurrentFrame((prev) => {
      const frameDelta = deltaX / SENSITIVITY;
      const newFrame = prev + frameDelta;
      // Normalize to 0-totalFrames range
      return ((Math.round(newFrame) % totalFrames) + totalFrames) % totalFrames;
    });

    // Reset reference point for next move
    startXRef.current = e.clientX;
    lastTimeRef.current = currentTime;
  }, [isDragging, totalFrames]);

  // Pointer up (release)
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Release pointer capture
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    // Start momentum animation if velocity is significant
    if (Math.abs(velocityRef.current) > 1) {
      startMomentum();
    }
  }, [isDragging, startMomentum]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Pointer cancel (for edge cases like touch interruption)
  const handlePointerCancel = handlePointerUp;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-gray-50 select-none ${className}`}
      style={{
        aspectRatio: '1',
        cursor: 'none', // Hide default cursor
        touchAction: 'none', // Prevent browser touch gestures
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {/* Custom cursor - white ball that follows mouse */}
      {isMounted && (
        <div
          className="absolute pointer-events-none z-50 transition-transform duration-75"
          style={{
            left: `${cursorPos.x}px`,
            top: `${cursorPos.y}px`,
            transform: 'translate(-50%, -50%)',
            width: isDragging ? '24px' : '20px',
            height: isDragging ? '24px' : '20px',
            transition: 'width 0.2s ease, height 0.2s ease'
          }}
        >
          <div 
            className={`w-full h-full rounded-full border-2 ${
              isDragging 
                ? 'bg-white/90 border-black/60 shadow-lg' 
                : 'bg-white/70 border-black/40 shadow-md'
            }`}
            style={{
              transition: 'all 0.2s ease'
            }}
          />
        </div>
      )}

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
        </div>
      )}

      {/* Current frame image */}
      {!isLoading && (
        <Image
          src={urls[currentFrame]}
          alt={`${alt} - frame ${currentFrame + 1}`}
          fill
          className="object-contain pointer-events-none"
          priority={currentFrame === 0}
          draggable={false}
          quality={95}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      )}

      {/* Subtle hint on first load (only after mount to avoid hydration issues) */}
      {isMounted && !isDragging && currentFrame === 0 && !isLoading && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm animate-pulse pointer-events-none">
          Drag to rotate
        </div>
      )}

      {/* Frame counter (optional, can be hidden for cleaner look) */}
      {isMounted && !isLoading && (
        <div className="absolute top-2 right-2 bg-black/40 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
          {currentFrame + 1}/{totalFrames}
        </div>
      )}
    </div>
  );
}
