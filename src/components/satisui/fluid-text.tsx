'use client';

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface FluidTextProps {
  /**
   * The text content to display.
   */
  text: string;
  /**
   * Optional class names for the container (controls font-size, weight, color).
   */
  className?: string;
  /**
   * The maximum scale factor for the hovered character.
   * @default 2.0
   */
  maxScale?: number;
  /**
   * The radius of the distortion effect in pixels.
   * @default 200
   */
  radius?: number;
  /**
   * Physics stiffness: 0.1 (Liquid) to 0.9 (Snappy).
   * @default 0.15
   */
  stiffness?: number;
  /**
   * Duration of the fade-in animation in milliseconds.
   * @default 700
   */
  fadeDuration?: number;
}

export function FluidText({
  text,
  className,
  maxScale = 2.0,
  radius = 200,
  stiffness = 0.15,
  fadeDuration = 700,
}: FluidTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spansRef = useRef<(HTMLSpanElement | null)[]>([]);

  // Controls visual visibility (Fade in) to prevent FOUT
  const [isReady, setIsReady] = useState(false);

  // Internal high-performance state (No React Rerenders)
  const state = useRef({
    charWidths: [] as number[],
    totalNaturalWidth: 0,
    isMeasured: false,
    targetX: -9999,
    currentX: -9999,
    targetIntensity: 0,
    currentIntensity: 0,
  });

  const chars = useMemo(() => text.split(''), [text]);

  // 1. Measurement System
  useEffect(() => {
    if (!containerRef.current) return;

    const measure = () => {
      if (!containerRef.current) return;

      // Reset transforms temporarily
      spansRef.current.forEach((span) => {
        if (span) span.style.transform = 'none';
      });

      // Measure every character width
      const widths = spansRef.current
        .filter((s): s is HTMLSpanElement => s !== null)
        .map((s) => s.getBoundingClientRect().width);

      if (widths.length === 0) return;

      state.current.charWidths = widths;
      state.current.totalNaturalWidth = widths.reduce((sum, w) => sum + w, 0);
      state.current.isMeasured = true;

      // Trigger fade-in
      setIsReady(true);
    };

    // Wait for fonts to be ready
    document.fonts.ready.then(measure);

    // Handle Resize
    const observer = new ResizeObserver(measure);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [text]);

  // 2. Physics & Layout Engine
  useEffect(() => {
    let frameId: number;

    const loop = () => {
      // Optimization: Stop loop if not measured or unmounted
      if (!state.current.isMeasured || !containerRef.current) {
        frameId = requestAnimationFrame(loop);
        return;
      }

      const s = state.current;

      // --- PHYSICS ---
      // 1. Lerp Position
      const posDelta = s.targetX - s.currentX;
      s.currentX += posDelta * stiffness;

      // 2. Lerp Intensity
      const intDelta = s.targetIntensity - s.currentIntensity;
      s.currentIntensity += intDelta * 0.08;

      // --- LAYOUT ---
      let totalDesiredWidth = 0;
      const desiredScales: number[] = [];

      // Pass 1: Calculate desired width based on Mouse Proximity
      s.charWidths.forEach((w, i) => {
        // Approximate center based on accumulated natural widths
        let offset = 0;
        for (let j = 0; j < i; j++) offset += s.charWidths[j];
        const charCenter = offset + w / 2;

        const dist = Math.abs(charCenter - s.currentX);

        let desiredScale = 1.0;
        if (dist < radius) {
          const normalized = dist / radius;
          // Cosine interpolation for organic shape
          const curve = Math.cos(normalized * (Math.PI / 2));
          desiredScale = 1 + (maxScale - 1) * curve * s.currentIntensity;
        }

        desiredScales[i] = desiredScale;
        totalDesiredWidth += w * desiredScale;
      });

      // Pass 2: Calculate Normalization Factor (k)
      // Ensures content strictly fits inside the original container width
      const k =
        totalDesiredWidth === 0 ? 1 : s.totalNaturalWidth / totalDesiredWidth;

      // Pass 3: Apply Transforms
      let currentLayoutX = 0;
      spansRef.current.forEach((span, i) => {
        if (!span) return;
        const w = s.charWidths[i];
        const finalScale = desiredScales[i] * k;

        // Hardware acceleration
        span.style.transform = `translate3d(${currentLayoutX.toFixed(2)}px, 0, 0) scaleX(${finalScale.toFixed(3)})`;

        currentLayoutX += w * finalScale;
      });

      frameId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(frameId);
  }, [maxScale, radius, stiffness]);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    state.current.targetX = e.clientX - rect.left;

    // Instant snap on entry
    if (state.current.targetIntensity === 0) {
      state.current.currentX = e.clientX - rect.left;
    }
    state.current.targetIntensity = 1;
  };

  const onMouseLeave = () => {
    state.current.targetIntensity = 0;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex h-auto cursor-default select-none items-center justify-center whitespace-nowrap',
        className,
      )}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      aria-label={text}
    >
      {/* 
         LAYER 1: Animated Content
      */}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center will-change-opacity',
          isReady ? 'opacity-100' : 'opacity-0',
        )}
        style={{ transition: `opacity ${fadeDuration}ms ease-out` }}
        aria-hidden='true'
      >
        {chars.map((char, i) => (
          <span
            key={i}
            ref={(el) => {
              spansRef.current[i] = el;
            }}
            className='absolute left-0 top-0 inline-block origin-left text-center'
            style={{
              backfaceVisibility: 'hidden',
              WebkitFontSmoothing: 'antialiased',
              transformStyle: 'preserve-3d',
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </div>

      {/* 
         LAYER 2: Invisible Clone (Layout Reservation)
         This ensures the container has the correct width/height immediately.
      */}
      <span
        className='invisible opacity-0 pointer-events-none whitespace-pre leading-none'
        aria-hidden='true'
      >
        {text}
      </span>
    </div>
  );
}
