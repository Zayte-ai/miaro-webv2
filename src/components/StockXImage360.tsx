'use client';

import { useRef, useEffect, useCallback } from 'react';

interface StockXImage360Props {
  productId: string;
  productName: string;
  totalFrames?: number;
  width?: number;
  height?: number;
  sensitivity?: number;
  className?: string;
}

/**
 * StockX-Style 360° Viewer
 * Single <img> tag with dynamic src swapping
 * Zero canvas, zero 3D, zero sprite sheets
 * Pure drag-to-rotate with inertia
 */
export default function StockXImage360({
  productId,
  productName,
  totalFrames = 72,
  width = 480,
  height = 320,
  sensitivity = 6,
  className = ''
}: StockXImage360Props) {
  // Refs - NO useState for animation (performance critical)
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameIndexRef = useRef(1); // Start at img1.jpg
  const velocityRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const imagesCacheRef = useRef<Set<number>>(new Set());
  
  const DECAY = 0.93; // Inertia decay (StockX-like feel)
  const MIN_VELOCITY = 0.1;

  // Generate image URL
  const getImageUrl = useCallback((frameNum: number): string => {
    return `/uploads/products/${productId}/360/img${frameNum}.jpg`;
  }, [productId]);

  // Update image src (direct DOM manipulation for zero React overhead)
  const updateFrame = useCallback((frameNum: number) => {
    if (!imgRef.current) return;
    
    // Normalize frame (circular wrap) - MUST round to integer
    let normalized = Math.round(((frameNum - 1) % totalFrames) + 1);
    if (normalized < 1) normalized += totalFrames;
    if (normalized > totalFrames) normalized = totalFrames;
    
    frameIndexRef.current = normalized;
    imgRef.current.src = getImageUrl(normalized);
  }, [totalFrames, getImageUrl]);

  // Preload images (StockX strategy)
  useEffect(() => {
    const preloadQueue: number[] = [];
    
    // Priority 1: Current frame ± 5
    for (let offset = -5; offset <= 5; offset++) {
      let frame = frameIndexRef.current + offset;
      if (frame < 1) frame += totalFrames;
      if (frame > totalFrames) frame -= totalFrames;
      if (!imagesCacheRef.current.has(frame)) {
        preloadQueue.push(frame);
      }
    }
    
    // Priority 2: All remaining frames
    for (let i = 1; i <= totalFrames; i++) {
      if (!imagesCacheRef.current.has(i) && !preloadQueue.includes(i)) {
        preloadQueue.push(i);
      }
    }
    
    // Async preload
    preloadQueue.forEach((frameNum, index) => {
      setTimeout(() => {
        const img = new Image();
        img.onload = () => imagesCacheRef.current.add(frameNum);
        img.src = getImageUrl(frameNum);
      }, index * 50); // Stagger loading
    });
  }, [totalFrames, getImageUrl]);

  // Momentum animation loop (requestAnimationFrame only)
  const animate = useCallback(() => {
    if (Math.abs(velocityRef.current) < MIN_VELOCITY) {
      velocityRef.current = 0;
      animationFrameRef.current = null;
      return;
    }

    // Apply velocity
    const delta = velocityRef.current / sensitivity;
    updateFrame(frameIndexRef.current + delta);

    // Decay
    velocityRef.current *= DECAY;

    // Continue
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [sensitivity, updateFrame]);

  // Mouse/Touch handlers
  const handlePointerDown = useCallback((e: PointerEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    lastXRef.current = e.clientX;
    velocityRef.current = 0;

    // Cancel momentum
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Pointer capture
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    // Grabbing cursor
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
    }
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();

    const deltaX = e.clientX - lastXRef.current;
    
    // Update velocity (for inertia)
    velocityRef.current = deltaX;
    
    // Update frame
    const frameDelta = deltaX / sensitivity;
    updateFrame(frameIndexRef.current + frameDelta);
    
    lastXRef.current = e.clientX;
  }, [sensitivity, updateFrame]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    
    // Release pointer
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    // Grab cursor
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }

    // Start momentum if velocity significant
    if (Math.abs(velocityRef.current) > MIN_VELOCITY) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  // Setup DOM event listeners (bypass React for performance)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: `${width} / ${height}`,
        cursor: 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        overflow: 'hidden'
      }}
    >
      <img
        ref={imgRef}
        width={width}
        height={height}
        alt={productName}
        draggable="false"
        data-image-type="360"
        src={getImageUrl(1)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      />
    </div>
  );
}
