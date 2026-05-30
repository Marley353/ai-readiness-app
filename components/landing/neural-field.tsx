"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

type Props = {
  /** Base hue for nodes/lines. Accepts an array for multi-tone fields. */
  colors?: string[];
  /** Density divisor — lower = more particles. Default 14000 (px² per particle). */
  density?: number;
  /** Max distance (px) at which two nodes draw a connecting line. */
  linkDistance?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * NeuralField — a performant, dependency-free animated particle network.
 * Nodes drift slowly and connect with distance-faded lines, evoking a
 * living neural mesh. Reacts subtly to the pointer. Honours
 * prefers-reduced-motion by rendering a single static frame.
 */
export function NeuralField({
  colors = ["110, 231, 255", "167, 139, 250", "94, 234, 212"],
  density = 14000,
  linkDistance = 140,
  className,
  style,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const pointer = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let particles: Particle[] = [];

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;

    const build = () => {
      const parent = canvas.parentElement;
      w = parent?.clientWidth ?? window.innerWidth;
      h = parent?.clientHeight ?? window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(28, Math.min(120, Math.floor((w * h) / density)));
      particles = Array.from({ length: count }, () => ({
        x: rand(0, w),
        y: rand(0, h),
        vx: rand(-0.18, 0.18),
        vy: rand(-0.18, 0.18),
        r: rand(0.8, 2.2),
      }));
    };

    const colorAt = (i: number) => colors[i % colors.length];

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Connecting lines
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);
          if (dist < linkDistance) {
            const alpha = (1 - dist / linkDistance) * 0.5;
            ctx.strokeStyle = `rgba(${colorAt(i)}, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }

      // Nodes
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.fillStyle = `rgba(${colorAt(i)}, 0.9)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        // soft halo
        ctx.fillStyle = `rgba(${colorAt(i)}, 0.08)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const step = () => {
      const { x: mx, y: my, active } = pointer.current;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Pointer interaction — gentle attraction within radius
        if (active) {
          const dx = mx - p.x;
          const dy = my - p.y;
          const d = Math.hypot(dx, dy);
          if (d < 160 && d > 0.5) {
            const f = (160 - d) / 160 * 0.04;
            p.x += (dx / d) * f * 6;
            p.y += (dy / d) * f * 6;
          }
        }

        // Wrap around edges
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
      }
      draw();
      rafRef.current = requestAnimationFrame(step);
    };

    build();
    if (reduce) {
      draw(); // single static frame
    } else {
      rafRef.current = requestAnimationFrame(step);
    }

    const onResize = () => build();
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
    };
    const onLeave = () => { pointer.current.active = false; };

    window.addEventListener("resize", onResize);
    canvas.parentElement?.addEventListener("pointermove", onMove);
    canvas.parentElement?.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      canvas.parentElement?.removeEventListener("pointermove", onMove);
      canvas.parentElement?.removeEventListener("pointerleave", onLeave);
    };
  }, [colors, density, linkDistance]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", ...style }}
    />
  );
}
