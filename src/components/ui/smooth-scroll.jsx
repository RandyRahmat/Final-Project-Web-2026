"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

export default function SmoothScroll() {
  const lenisRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.95,
      prevent: (node) => {
        if (document.body.style.overflow === "hidden" || document.documentElement.style.overflow === "hidden") {
          return true;
        }
        let el = node;
        while (el && el !== document.body && el !== document.documentElement) {
          if (el.hasAttribute?.("data-lenis-prevent")) return true;
          const overflowY = window.getComputedStyle(el).overflowY;
          if ((overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight) {
            return true;
          }
          el = el.parentElement;
        }
        return false;
      },
    });

    lenisRef.current = lenis;

    const ro = new ResizeObserver(() => {
      lenis.resize();
    });
    ro.observe(document.body);

    return () => {
      ro.disconnect();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;

    lenis.scrollTo(0, { immediate: true, force: true });
    lenis.resize();

    const rafId = requestAnimationFrame(() => {
      lenis.resize();
    });

    return () => cancelAnimationFrame(rafId);
  }, [pathname]);

  return null;
}
