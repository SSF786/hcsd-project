import { useEffect, useRef, useState } from 'react';

// ── Animated counter (numbers count up on mount) ──────────────
export function useCountUp(target, duration = 800, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) return;
    const timer = setTimeout(() => {
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setValue(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(step);
        else setValue(target);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timer);
  }, [target, duration, delay]);
  return value;
}

// ── Intersection observer — animate when element enters viewport ──
export function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ── Stagger delay helper ────────────────────────────────────────
export const staggerDelay = (i, base = 0.05) => `${base + i * 0.07}s`;

// ── Slide-in style generator ────────────────────────────────────
export const slideUp = (delay = 0, duration = 0.4) => ({
  animation: `slideInUp ${duration}s cubic-bezier(0.34,1.1,0.64,1) ${delay}s both`,
});

export const fadeIn = (delay = 0, duration = 0.35) => ({
  animation: `fadeIn ${duration}s ease ${delay}s both`,
});

export const bounceIn = (delay = 0) => ({
  animation: `bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) ${delay}s both`,
});

// ── Page transition wrapper style ──────────────────────────────
export const pageEnter = {
  animation: 'slideInUp 0.4s cubic-bezier(0.34,1.1,0.64,1) both',
};
