"use client";

import { useEffect } from "react";

export default function InteractionLayer() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let rafId = 0;
    let isScrolling = false;
    let scrollTimer = 0;

    const handleScroll = () => {
      isScrolling = true;
      if (scrollTimer) window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        isScrolling = false;
      }, 140);
    };

    const handlePointerMove = (e) => {
      if (isScrolling) return;
      const card = e.target instanceof Element ? e.target.closest(".spotlight") : null;
      if (!card) return;

      const { clientX, clientY } = e;
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${clientX - rect.left}px`);
        card.style.setProperty("--my", `${clientY - rect.top}px`);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointermove", handlePointerMove);
      if (rafId) cancelAnimationFrame(rafId);
      if (scrollTimer) window.clearTimeout(scrollTimer);
    };
  }, []);

  return null;
}
