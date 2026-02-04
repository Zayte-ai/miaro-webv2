"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface ProductImageSliderProps {
  productName: string;
  baseImagePath: string;
  totalFrames?: number;
  className?: string;
}

export default function ProductImageSlider({
  productName,
  baseImagePath,
  totalFrames = 35,
  className = "",
}: ProductImageSliderProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [imagePath, setImagePath] = useState("");

  // Generate the image path for the current frame
  const getFrameImagePath = (frame: number): string => {
    const frameNumber = (frame).toString().padStart(3, "0");
    return `${baseImagePath}/${frameNumber}.jpg`;
  };

  // Update image path whenever frame changes
  useEffect(() => {
    const newPath = getFrameImagePath(currentFrame);
    setImagePath(newPath);
    console.log("📸 Frame", currentFrame, "→", newPath);
  }, [currentFrame, baseImagePath]);

  // Handle slider input change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFrame = parseInt(e.target.value);
    console.log("📊 Slider:", newFrame);
    setCurrentFrame(newFrame);
  };

  // Handle touch/mouse events for interactive sliding
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsSliding(true);
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isSliding) return;

    const deltaX = e.clientX - startX;
    const frameStep = Math.floor(deltaX / 10);

    if (Math.abs(frameStep) >= 1) {
      const newFrame = (currentFrame + frameStep + totalFrames * 10) % totalFrames;
      console.log("🖱️ Drag step", frameStep, "frame", newFrame);
      setCurrentFrame(newFrame);
      setStartX(e.clientX);
    }
  };

  const handlePointerUp = () => {
    setIsSliding(false);
    setIsDragging(false);
  };

  // Preload all images
  useEffect(() => {
    for (let i = 0; i < totalFrames; i++) {
      const img = new window.Image();
      img.src = getFrameImagePath(i);
    }
    console.log("🎬 Preloaded", totalFrames, "frames from", baseImagePath);
  }, [totalFrames, baseImagePath]);

  // Clean up event listeners
  useEffect(() => {
    const handlePointerUpGlobal = () => {
      setIsSliding(false);
      setIsDragging(false);
    };

    window.addEventListener("pointerup", handlePointerUpGlobal);
    return () => {
      window.removeEventListener("pointerup", handlePointerUpGlobal);
    };
  }, []);

  if (!imagePath) return <div className="aspect-square bg-gray-100 rounded-lg" />;

  return (
    <div className={`relative ${className}`}>
      {/* Main Image Frame */}
      <div
        className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-grab ${
          isDragging ? "cursor-grabbing" : ""
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <Image
          key={imagePath}
          src={imagePath}
          alt={`${productName} - View ${currentFrame + 1}`}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority={currentFrame === 0}
        />
        <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-3 py-2 rounded-md text-sm font-medium">
          {currentFrame + 1} / {totalFrames}
        </div>
        {/* Fallback message that will display if images aren't available */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <div className="inline-block bg-white bg-opacity-90 px-3 py-2 rounded-md text-xs text-gray-600">
            360° view - drag to rotate
          </div>
        </div>
      </div>

      {/* Slider Control */}
      <div className="mt-4 px-2">
        <input
          type="range"
          min={0}
          max={totalFrames - 1}
          value={currentFrame}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Helper Text */}
      <p className="text-center text-sm text-gray-500 mt-2">
        Drag image or use slider to rotate view
      </p>
    </div>
  );
}
