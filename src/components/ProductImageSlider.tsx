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
  const [currentFrame, setCurrentFrame] = useState(1);
  const [isSliding, setIsSliding] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Generate the image path for the current frame
  const getFrameImagePath = (frame: number) => {
    // Format frame number to have leading zeros (e.g., 001, 002, ..., 035)
    const frameNumber = frame.toString().padStart(3, "0");
    return `${baseImagePath}/${frameNumber}.jpg`;
  };

  // Handle slider input change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentFrame(parseInt(e.target.value));
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
    const frameStep = Math.floor(deltaX / 10); // Adjust sensitivity here

    if (Math.abs(frameStep) >= 1) {
      const newFrame = Math.max(
        1,
        Math.min(totalFrames, currentFrame + frameStep)
      );
      setCurrentFrame(newFrame);
      setStartX(e.clientX);
    }
  };

  const handlePointerUp = () => {
    setIsSliding(false);
    setIsDragging(false);
  };

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
        {" "}
        <Image
          src={getFrameImagePath(currentFrame)}
          alt={`${productName} - View ${currentFrame}`}
          fill
          className="object-cover"
          priority={currentFrame === 1}
          onError={(e) => {
            // Fallback to the product's main image if the frame doesn't exist
            const imgElement = e.currentTarget as HTMLImageElement;
            imgElement.src = `/images/products/${baseImagePath
              .split("/")
              .pop()}-1.jpg`;
          }}
        />
        <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-3 py-2 rounded-md text-sm font-medium">
          {currentFrame} / {totalFrames}
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
          min={1}
          max={totalFrames}
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
