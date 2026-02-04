"use client";

import { useEffect, useRef } from "react";

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // Ensure muted/defaultMuted and inline playback flags
    v.muted = true;
    try {
      v.defaultMuted = true;
    } catch {}
    try {
      // some browsers expose playsInline property
      // @ts-ignore
      v.playsInline = true;
    } catch {}
    try {
      v.setAttribute("playsinline", "");
      v.setAttribute("webkit-playsinline", "");
      v.setAttribute("x5-playsinline", "");
    } catch (e) {
      // ignore
    }

    // Try to play (may be blocked until user gesture on some devices)
    const tryPlay = async () => {
      try {
        await v.play();
        return true;
      } catch (e) {
        return false;
      }
    };

    // initial attempt
    tryPlay();

    // play on first user interaction (pointer, touch, key)
    const onFirstGesture = async () => {
      await tryPlay();
      removeGestureListeners();
    };

    const gestureEvents: Array<[EventTarget, string]> = [
      [document, "pointerdown"],
      [document, "touchstart"],
      [document, "keydown"],
      [document, "click"],
    ];

    const addGestureListeners = () => {
      gestureEvents.forEach(([target, name]) => (target as any).addEventListener(name as string, onFirstGesture, { passive: true }));
    };
    const removeGestureListeners = () => {
      gestureEvents.forEach(([target, name]) => (target as any).removeEventListener(name as string, onFirstGesture));
    };

    addGestureListeners();

    // If tab becomes hidden/visible, try play when visible
    const onVisibility = () => {
      if (document.visibilityState === "visible") tryPlay();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Cleanup
    return () => {
      removeGestureListeners();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-cover z-0"
      style={{
        minHeight: '100%',
        minWidth: '100%',
        objectFit: 'cover',
        objectPosition: 'center',
      }}
      src="/web0001-0250.mp4"
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      disableRemotePlayback
      // ensure no controls shown
      controls={false}
    />
  );
}
