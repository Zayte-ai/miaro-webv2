"use client";

import { useRef, useEffect, useCallback, useState } from 'react';

interface ImageGallerySliderProps {
  totalImages: number;
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
}

export default function ImageGallerySlider({
  totalImages,
  width = 600,
  height = 600,
  alt = "Product image",
  className = "",
}: ImageGallerySliderProps) {
  // Refs pour éviter les re-renders
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentIndexRef = useRef(1);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const isTouchRef = useRef(false);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  
  // State pour forcer le re-render du slider
  const [currentIndex, setCurrentIndex] = useState(1);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isSliderDraggingRef = useRef(false);
  const [sliderPosition, setSliderPosition] = useState(0); // Position exacte du thumb en %

  // Configuration
  const SWIPE_THRESHOLD = 20; // pixels minimum pour changer d'image (réduit pour plus de réactivité)
  const TRANSITION_DURATION = 150; // ms (réduit pour plus de fluidité)

  // Fonction pour obtenir l'URL de l'image
  const getImageUrl = useCallback((index: number): string => {
    // Format: 0001.jpg, 0002.jpg, etc.
    const paddedIndex = index.toString().padStart(4, '0');
    return `/360-web/${paddedIndex}.jpg`;
  }, []);

  // Preload des images adjacentes (optimisé pour plus de fluidité)
  const preloadImages = useCallback((index: number) => {
    // Preload 3 images dans chaque direction pour une navigation ultra-fluide
    for (let offset = -3; offset <= 3; offset++) {
      if (offset === 0) continue;
      const targetIndex = index + offset;
      if (targetIndex >= 1 && targetIndex <= totalImages) {
        const img = new Image();
        img.src = getImageUrl(targetIndex);
      }
    }
  }, [totalImages, getImageUrl]);

  // Changer d'image avec animation
  const setImage = useCallback((newIndex: number, animate = true) => {
    console.log('setImage called:', { newIndex, animate, currentIndex: currentIndexRef.current });
    
    if (!imgRef.current) {
      console.log('No imgRef');
      return;
    }
    if (newIndex < 1 || newIndex > totalImages) {
      console.log('Index out of bounds:', newIndex);
      return;
    }
    if (newIndex === currentIndexRef.current && animate) {
      console.log('Same index, skipping');
      return;
    }

    const img = imgRef.current;
    const newUrl = getImageUrl(newIndex);
    console.log('Changing to:', newUrl);
    
    if (animate) {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;
      
      // Transition ultra-rapide et fluide
      img.style.transition = `opacity ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      img.style.opacity = '0.3';

      setTimeout(() => {
        currentIndexRef.current = newIndex;
        setCurrentIndex(newIndex);
        img.src = newUrl;
        console.log('Image changed to:', img.src);
        
        // Preload images adjacentes
        preloadImages(newIndex);
      }, TRANSITION_DURATION / 3);

      setTimeout(() => {
        img.style.opacity = '1';
        setTimeout(() => {
          img.style.transition = '';
          isTransitioningRef.current = false;
        }, TRANSITION_DURATION);
      }, TRANSITION_DURATION / 2 + 50);
    } else {
      // Changement immédiat sans animation
      currentIndexRef.current = newIndex;
      setCurrentIndex(newIndex);
      console.log('Setting img.src to:', newUrl, 'for index:', newIndex);
      img.src = newUrl;
      console.log('Image src is now:', img.src);
      preloadImages(newIndex);
    }
  }, [totalImages, getImageUrl, preloadImages, TRANSITION_DURATION]);

  // Handler pour la molette de souris
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (totalImages <= 1 || isTransitioningRef.current) return;
    
    e.preventDefault();
    
    const direction = e.deltaY > 0 ? 1 : -1;
    const newIndex = Math.max(1, Math.min(currentIndexRef.current + direction, totalImages));
    
    if (newIndex !== currentIndexRef.current) {
      setImage(newIndex, false);
    }
  }, [totalImages, setImage]);

  // Handlers de drag (souris et pointer)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    console.log('PointerDown triggered', e.pointerType);
    if (totalImages <= 1 || isTransitioningRef.current) return;
    
    // Ignorer si c'est un événement tactile (géré séparément)
    if (e.pointerType === 'touch') return;
    
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    currentXRef.current = e.clientX;

    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
      containerRef.current.setPointerCapture(e.pointerId);
    }

    e.preventDefault();
    e.stopPropagation();
  }, [totalImages]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    
    const deltaX = e.clientX - currentXRef.current;
    currentXRef.current = e.clientX;
    
    // Navigation fluide en temps réel pendant le drag
    const totalDeltaX = currentXRef.current - startXRef.current;
    const sensitivity = 30; // pixels pour changer d'image
    const imageChange = Math.floor(Math.abs(totalDeltaX) / sensitivity);
    
    if (imageChange > 0 && !isTransitioningRef.current) {
      // Inverser la direction: glisser à droite (deltaX > 0) → index augmente
      const direction = totalDeltaX > 0 ? 1 : -1;
      const newIndex = currentIndexRef.current + (direction * imageChange);
      const clampedIndex = Math.max(1, Math.min(newIndex, totalImages));
      
      if (clampedIndex !== currentIndexRef.current) {
        setImage(clampedIndex, false);
        startXRef.current = currentXRef.current; // Reset pour éviter le saut
      }
    }
    
    console.log('Dragging, deltaX:', totalDeltaX);
    e.preventDefault();
    e.stopPropagation();
  }, [totalImages, setImage]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    console.log('PointerUp triggered, isDragging:', isDraggingRef.current);
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }

    const deltaX = currentXRef.current - startXRef.current;
    const currentIndex = currentIndexRef.current;

    console.log('Drag ended:', { deltaX, currentIndex, threshold: SWIPE_THRESHOLD });

    // Le changement d'image se fait déjà en temps réel pendant le drag
    // On n'a plus besoin de logique ici, mais on peut ajouter un snap si nécessaire
    console.log('Drag ended, current index:', currentIndex);

    e.preventDefault();
    e.stopPropagation();
  }, [totalImages, setImage, SWIPE_THRESHOLD]);

  // Handlers tactiles dédiés pour mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    console.log('TouchStart triggered');
    if (totalImages <= 1 || isTransitioningRef.current) return;
    
    isTouchRef.current = true;
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    startXRef.current = touch.clientX;
    currentXRef.current = touch.clientX;
  }, [totalImages]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isTouchRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    
    // Déterminer si c'est un swipe horizontal (rotation 360) ou vertical (scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Swipe horizontal - rotation 360
      e.preventDefault(); // Empêcher le scroll
      
      currentXRef.current = touch.clientX;
      
      // Navigation fluide en temps réel pendant le swipe
      const totalDeltaX = currentXRef.current - startXRef.current;
      const sensitivity = 25; // pixels pour changer d'image (optimisé pour tactile)
      const imageChange = Math.floor(Math.abs(totalDeltaX) / sensitivity);
      
      if (imageChange > 0 && !isTransitioningRef.current) {
        // Inverser la direction: swiper à droite (deltaX > 0) → index augmente
        const direction = totalDeltaX > 0 ? 1 : -1;
        const newIndex = currentIndexRef.current + (direction * imageChange);
        const clampedIndex = Math.max(1, Math.min(newIndex, totalImages));
        
        if (clampedIndex !== currentIndexRef.current) {
          setImage(clampedIndex, false);
          startXRef.current = currentXRef.current;
        }
      }
    }
    // Si c'est un swipe vertical, laisser le comportement par défaut (scroll)
  }, [totalImages, setImage]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    console.log('TouchEnd triggered');
    if (!isTouchRef.current) return;
    
    isTouchRef.current = false;
    console.log('Touch ended, current index:', currentIndexRef.current);
  }, []);

  // Initialisation
  useEffect(() => {
    if (imgRef.current && totalImages > 0) {
      imgRef.current.src = getImageUrl(1);
      preloadImages(1);
    }
  }, [totalImages, getImageUrl, preloadImages]);

  // Handler pour le drag du slider
  const handleSliderMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    
    isSliderDraggingRef.current = true;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newIndex = Math.round(percentage * (totalImages - 1)) + 1;
    
    // Mettre à jour la position exacte du thumb (pas arrondie)
    setSliderPosition(percentage * 100);
    setImage(newIndex, false);
    e.preventDefault();
  }, [totalImages, setImage]);

  // Ajouter des listeners globaux pour mouseup et mousemove
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!sliderRef.current || !isSliderDraggingRef.current) return;
      
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newIndex = Math.round(percentage * (totalImages - 1)) + 1;
      
      // Mettre à jour la position exacte du thumb en temps réel
      setSliderPosition(percentage * 100);
      setImage(newIndex, false);
    };

    const handleGlobalMouseUp = () => {
      isSliderDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [totalImages, setImage]);

  // Support clavier (optionnel mais utile)
  useEffect(() => {
    if (totalImages <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioningRef.current) return;

      if (e.key === 'ArrowLeft') {
        const prevIndex = Math.max(currentIndexRef.current - 1, 1);
        setImage(prevIndex, true);
      } else if (e.key === 'ArrowRight') {
        const nextIndex = Math.min(currentIndexRef.current + 1, totalImages);
        setImage(nextIndex, true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalImages, setImage]);

  // Si une seule image, affichage statique
  if (totalImages <= 1) {
    return (
      <div 
        className={`relative w-full ${className}`} 
        style={{ 
          aspectRatio: '1 / 1',
          maxWidth: width, 
          maxHeight: height 
        }}
      >
        <img
          src={getImageUrl(1)}
          alt={alt}
          className="w-full h-full object-contain"
          draggable="false"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative select-none w-full ${className}`}
      style={{
        aspectRatio: '1 / 1',
        maxWidth: width,
        maxHeight: height,
        cursor: 'grab',
        touchAction: 'none', // Géré manuellement dans handleTouchMove
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <img
        ref={imgRef}
        alt={alt}
        className="w-full h-full object-contain"
        draggable="false"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          msUserSelect: 'none',
          willChange: 'opacity',
          transform: 'translateZ(0)',
        }}
      />

      {/* Slider custom StockX - DIV pur sans input HTML */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-2/3 max-w-lg">
        <div 
          ref={sliderRef}
          onMouseDown={handleSliderMouseDown}
          className="relative h-0.5 bg-black cursor-pointer"
          style={{ touchAction: 'none' }}
        >
          {/* Thumb - position exacte de la souris pendant le drag */}
          <div
            className="absolute top-1/2 w-3 h-3 bg-white rounded-full border-2 border-black shadow-sm pointer-events-none"
            style={{
              left: isSliderDraggingRef.current 
                ? `${sliderPosition}%` 
                : `${((currentIndex - 1) / (totalImages - 1)) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
