"use client";

import { useRef, useState, useEffect, TouchEvent, MouseEvent } from "react";
import Image from "next/image";
import { RotateCw } from "lucide-react";

interface SimpleRotation360Props {
  imageUrl: string;
  alt?: string;
  className?: string;
  sensitivity?: number; // Pixels de mouvement pour une rotation complète (défaut: 500)
}

export default function SimpleRotation360({
  imageUrl,
  alt = "Vue 360°",
  className = "",
  sensitivity = 500,
}: SimpleRotation360Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(0); // Angle de rotation en degrés (0-360)
  const lastX = useRef<number>(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Calculer la position du background en fonction de la rotation
  const backgroundPosition = `${(rotation / 360) * 100}% center`;

  // Gérer le début du drag (souris)
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    lastX.current = e.clientX;
  };

  // Gérer le mouvement de la souris
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastX.current;
    lastX.current = e.clientX;

    // Calculer le nouveau degré de rotation
    const rotationDelta = (deltaX / sensitivity) * 360;
    setRotation((prev) => {
      const newRotation = prev + rotationDelta;
      // Garder entre 0 et 360
      return ((newRotation % 360) + 360) % 360;
    });
  };

  // Gérer la fin du drag (souris)
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Gérer le début du drag (tactile)
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    lastX.current = e.touches[0].clientX;
  };

  // Gérer le mouvement tactile
  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length === 0) return;

    const deltaX = e.touches[0].clientX - lastX.current;
    lastX.current = e.touches[0].clientX;

    const rotationDelta = (deltaX / sensitivity) * 360;
    setRotation((prev) => {
      const newRotation = prev + rotationDelta;
      return ((newRotation % 360) + 360) % 360;
    });
  };

  // Gérer la fin du drag (tactile)
  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Ajouter les event listeners globaux
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: globalThis.MouseEvent) => {
        const deltaX = e.clientX - lastX.current;
        lastX.current = e.clientX;

        const rotationDelta = (deltaX / sensitivity) * 360;
        setRotation((prev) => {
          const newRotation = prev + rotationDelta;
          return ((newRotation % 360) + 360) % 360;
        });
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
      };

      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleGlobalMouseMove);
        window.removeEventListener("mouseup", handleGlobalMouseUp);
      };
    }
  }, [isDragging, sensitivity]);

  return (
    <div className={`relative ${className}`}>
      {/* Container de l'image 360 */}
      <div
        ref={containerRef}
        className={`relative w-full h-full overflow-hidden rounded-lg ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          touchAction: "none",
        }}
      >
        {/* Image de fond avec position calculée */}
        <div
          className="w-full h-full bg-cover bg-no-repeat transition-all duration-75"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundPosition: backgroundPosition,
            backgroundSize: "auto 100%",
          }}
        >
          {/* Image préchargée (cachée) pour Next.js Image optimization */}
          <Image
            src={imageUrl}
            alt={alt}
            fill
            className="opacity-0 pointer-events-none"
            onLoad={() => setImageLoaded(true)}
            priority
          />
        </div>

        {/* Indicateur de chargement */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <RotateCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Chargement de la vue 360°...</p>
            </div>
          </div>
        )}

        {/* Instructions overlay */}
        {imageLoaded && !isDragging && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm pointer-events-none animate-pulse">
            <div className="flex items-center gap-2">
              <RotateCw className="h-4 w-4" />
              <span>Glissez pour faire pivoter</span>
            </div>
          </div>
        )}
      </div>

      {/* Indicateur de rotation (optionnel) */}
      <div className="absolute top-2 right-2 bg-black/60 text-white px-3 py-1 rounded-full text-xs">
        {Math.round(rotation)}°
      </div>
    </div>
  );
}
