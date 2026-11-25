"use client";

import { useEffect } from "react";

export default function InteractionLayer() {
  useEffect(() => {
    let rafId = 0;

    const handlePointerMove = (e) => {
      if (rafId) cancelAnimationFrame(rafId);
      const { clientX, clientY, target } = e;

      rafId = requestAnimationFrame(() => {
        const card = target instanceof Element ? target.closest(".spotlight") : null;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${clientX - rect.left}px`);
        card.style.setProperty("--my", `${clientY - rect.top}px`);
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return null;
}
