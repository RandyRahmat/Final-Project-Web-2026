"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

export default function SmoothScroll() {
  const lenisRef = useRef(null);
  const prevPathnameRef = useRef(null);
  const isPopStateRef = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const handlePopState = () => {
      isPopStateRef.current = true;
    };
    window.addEventListener("popstate", handlePopState);

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.95,
      // Lenis sudah memanggil prevent(node) untuk tiap elemen di composedPath(),
      // jadi cukup periksa node itu sendiri (O(D), bukan O(D^2))
      prevent: (node) => {
        if (
          document.body.style.overflow === "hidden" ||
          document.documentElement.style.overflow === "hidden"
        ) {
          return true;
        }
        if (!node || node === document.body || node === document.documentElement) {
          return false;
        }
        if (node.hasAttribute?.("data-lenis-prevent")) {
          return true;
        }
        const tag = node.tagName;
        if (tag === "TEXTAREA" || tag === "SELECT") {
          return true;
        }
        if (node.scrollHeight > node.clientHeight + 1) {
          const overflowY = window.getComputedStyle(node).overflowY;
          if (overflowY === "auto" || overflowY === "scroll") {
            return true;
          }
        }
        return false;
      },
    });

    lenisRef.current = lenis;

    const handleScrollTop = () => {
      lenis.scrollTo(0, { duration: 1.0 });
    };
    window.addEventListener("aesthe:scroll-top", handleScrollTop);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("aesthe:scroll-top", handleScrollTop);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    const lenis = lenisRef.current;
    const isInitialMount = prevPathnameRef.current === null;
    prevPathnameRef.current = pathname;

    if (!lenis) return;

    const wasPopState = isPopStateRef.current;
    isPopStateRef.current = false;

    // Jangan paksa scroll ke 0 pada initial mount, Back/Forward browser, atau URL dengan #hash
    if (!isInitialMount && !wasPopState && !window.location.hash) {
      lenis.scrollTo(0, { immediate: true, force: true });
    }

    const rafId = requestAnimationFrame(() => {
      lenis.resize();
    });

    return () => cancelAnimationFrame(rafId);
  }, [pathname]);

  return null;
}
