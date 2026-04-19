"use client";

import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type RevealOptions = {
  y?: number;
  x?: number;
  scale?: number;
  duration?: number;
  delay?: number;
  stagger?: number;
  ease?: string;
  start?: string;
  once?: boolean;
};

export function useScrollReveal<T extends HTMLElement>(
  options: RevealOptions = {},
): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const children = el.querySelectorAll(".gsap-reveal");
    const targets = children.length > 0 ? children : [el];

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        y: options.y ?? 30,
        x: options.x ?? 0,
        scale: options.scale ?? 1,
        opacity: 0,
        duration: options.duration ?? 0.7,
        delay: options.delay ?? 0,
        stagger: options.stagger ?? 0.1,
        ease: options.ease ?? "power3.out",
        scrollTrigger: {
          trigger: el,
          start: options.start ?? "top 85%",
          once: options.once ?? true,
        },
      });
    });

    return () => ctx.revert();
  }, [options.y, options.x, options.scale, options.duration, options.delay, options.stagger, options.ease, options.start, options.once]);

  return ref;
}

export function useCountUp(
  targetValue: number,
  options: { duration?: number; suffix?: string; start?: string } = {},
): RefObject<HTMLSpanElement | null> {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obj = { val: 0 };
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        val: targetValue,
        duration: options.duration ?? 1.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: options.start ?? "top 85%",
          once: true,
        },
        onUpdate: () => {
          el.textContent = `${Math.round(obj.val)}${options.suffix ?? ""}`;
        },
      });
    });

    return () => ctx.revert();
  }, [targetValue, options.duration, options.suffix, options.start]);

  return ref;
}

export function useParallax<T extends HTMLElement>(
  speed: number = 0.3,
): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.to(el, {
        y: () => speed * 100,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });

    return () => ctx.revert();
  }, [speed]);

  return ref;
}
