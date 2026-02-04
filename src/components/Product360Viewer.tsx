"use client";

import { useEffect, useRef, useState } from "react";

interface Product360ViewerProps {
  productId: string;
  totalFrames?: number;
  width?: number;
  height?: number;
  alt?: string;
}

export default function Product360Viewer({
  productId,
  totalFrames = 72,
  width = 480,
  height = 320,
  alt = "Product 360 view",
}: Product360ViewerProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const frameRef = useRef(1);
  const isDraggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const getSrc = (frame: number) =>
    `/uploads/products/${productId}/360/img${frame}.jpg`;

  // Préload intelligent
  useEffect(() => {
    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      img.src = getSrc(i);
    }
  }, [productId, totalFrames]);

  // Calcule la frame basée sur la position horizontale dans le conteneur
  const updateFrameFromPosition = (x: number, containerWidth: number) => {
    // Ne pas clamper ici - permettre les valeurs négatives et au-delà de la largeur
    // pour permettre de défiler même si la souris sort de l'image
    
    // Calculer la frame basée sur la position
    const percentage = x / containerWidth;
    const newFrame = Math.round(percentage * (totalFrames - 1)) + 1;
    
    // Clamper seulement la frame finale entre 1 et totalFrames
    const validFrame = Math.max(1, Math.min(newFrame, totalFrames));
    
    if (frameRef.current !== validFrame) {
      frameRef.current = validFrame;
      if (imgRef.current) {
        imgRef.current.src = getSrc(validFrame);
      }
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    
    // Utiliser offsetX/offsetY qui sont relatifs à l'image directement
    if (imgRef.current) {
      const imgRect = imgRef.current.getBoundingClientRect();
      const x = e.nativeEvent.offsetX;
      const y = e.nativeEvent.offsetY;
      
      // Calculer la frame
      updateFrameFromPosition(x, imgRect.width);
      
      // Position pour le point blanc
      const clampedX = Math.max(0, Math.min(x, imgRect.width));
      const clampedY = Math.max(0, Math.min(y, imgRect.height));
      
      setCursorPos({ x: clampedX, y: clampedY });
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    
    // Utiliser offsetX/offsetY qui sont relatifs à l'image directement
    if (imgRef.current) {
      const imgRect = imgRef.current.getBoundingClientRect();
      const x = e.nativeEvent.offsetX;
      const y = e.nativeEvent.offsetY;
      
      // Calculer la frame
      updateFrameFromPosition(x, imgRect.width);
      
      // Position pour le point blanc
      const clampedX = Math.max(0, Math.min(x, imgRect.width));
      const clampedY = Math.max(0, Math.min(y, imgRect.height));
      
      setCursorPos({ x: clampedX, y: clampedY });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    // Cacher le point blanc
    setCursorPos(null);
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg relative"
    >
      <div 
        ref={containerRef}
        className="relative inline-block"
        style={{
          userSelect: "none",
          touchAction: "none",
        }}
      >
        <img
          ref={imgRef}
          src={getSrc(frameRef.current)}
          width={width}
          height={height}
          alt={alt}
          draggable={false}
          data-image-type="360"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          style={{
            cursor: isDraggingRef.current ? "grabbing" : "grab",
            display: "block",
            maxWidth: "100%",
            height: "auto",
          }}
        />
        
        {/* Point blanc qui suit le curseur pendant le drag */}
        {cursorPos && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${cursorPos.x}px`,
              top: `${cursorPos.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="w-4 h-4 bg-white rounded-full shadow-lg border-2 border-gray-800 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
