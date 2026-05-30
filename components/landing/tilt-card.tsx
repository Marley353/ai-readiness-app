"use client";

import { useRef, type ReactNode, type CSSProperties } from "react";

type Props = {
  children: ReactNode;
  /** Max tilt in degrees. Default 8. */
  max?: number;
  /** Scale on hover. Default 1.02. */
  scale?: number;
  /** Add a moving glare highlight. Default true. */
  glare?: boolean;
  className?: string;
  style?: CSSProperties;
};

/**
 * TiltCard — 3D perspective tilt that follows the pointer, with an optional
 * specular glare sweep. Pure DOM transforms, no dependencies. Disabled for
 * touch / reduced-motion users (falls back to a static card).
 */
export function TiltCard({ children, max = 8, scale = 1.02, glare = true, className, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number>(0);

  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (0.5 - py) * max * 2;
    const ry = (px - 0.5) * max * 2;

    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`;
      if (glareRef.current) {
        glareRef.current.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.18), transparent 55%)`;
        glareRef.current.style.opacity = "1";
      }
    });
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(raf.current);
    el.style.transform = "perspective(1100px) rotateX(0deg) rotateY(0deg) scale(1)";
    if (glareRef.current) glareRef.current.style.opacity = "0";
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={className}
      style={{
        transformStyle: "preserve-3d",
        transition: "transform 300ms cubic-bezier(.22,1,.36,1)",
        willChange: "transform",
        position: "relative",
        ...style,
      }}
    >
      {children}
      {glare && (
        <div
          ref={glareRef}
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            opacity: 0,
            transition: "opacity 300ms ease",
            mixBlendMode: "overlay",
          }}
        />
      )}
    </div>
  );
}
