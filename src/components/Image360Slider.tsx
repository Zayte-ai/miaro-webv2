"use client";

import { useEffect, useMemo, useState } from "react";

interface Image360SliderProps {
  sampleImage: string; // example: "/project/360/001.jpg"
  frames: number;
  className?: string;
  alt?: string;
  idSuffix?: string; // to make ids unique when multiple components render
}

export default function Image360Slider({
  sampleImage,
  frames,
  className = "",
  alt = "",
  idSuffix = "",
}: Image360SliderProps) {
  const { dir, prefix, ext, pad } = useMemo(() => {
    // Parse sampleImage to detect directory, optional prefix, numeric part and extension
    // Supports names like '/project/360/001.jpg' and '/web0001.jpg'
    try {
      const m = sampleImage.match(/^(.*\/)(.*?)(\d+)\.(\w+)$/);
      if (m) {
        return { dir: m[1], prefix: m[2], ext: m[4], pad: m[3].length };
      }
    } catch (e) {}
    // fallback: treat last path segment as prefix + number not detected — use the directory and extension
    return { dir: sampleImage.replace(/[^\/]+$/, ""), prefix: "", ext: sampleImage.split('.').pop() || 'jpg', pad: 4 };
  }, [sampleImage]);

  const [frame, setFrame] = useState(1);

  const src = useMemo(() => {
    const s = String(frame).padStart(pad, "0");
    return `${dir}${prefix}${s}.${ext}`;
  }, [dir, ext, frame, pad, prefix]);

  // Preload current frame (and optionally next few) to make sliding smooth
  useEffect(() => {
    const img = new Image();
    img.src = src;
    return () => {
      // allow GC
    };
  }, [src]);

  const sliderId = `slider-${idSuffix}`;
  const imageId = `product-image-${idSuffix}`;

  return (
    <div className={`w-full h-full relative ${className}`}>
      <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
        {/* plain img used for simplicity and predictable behavior inside cards */}
        <img
          id={imageId}
          src={src}
          alt={alt}
          className="object-cover w-full h-full"
          draggable={false}
        />
      </div>

      <div className="absolute left-2 right-2 bottom-2 p-1 bg-black bg-opacity-40 rounded-md">
        <input
          id={sliderId}
          aria-label="Frame slider"
          type="range"
          min={1}
          max={frames}
          value={frame}
          onChange={(e) => setFrame(Number(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
}
