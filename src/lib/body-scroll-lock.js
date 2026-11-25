"use client";

import { useEffect } from "react";

let lockCount = 0;
let savedOverflow = "";

export function lockBodyScroll() {
  if (typeof document === "undefined") return;
  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
}

export function unlockBodyScroll() {
  if (typeof document === "undefined") return;
  if (lockCount <= 0) {
    lockCount = 0;
    return;
  }
  lockCount -= 1;
  if (lockCount === 0) {
    document.body.style.overflow = savedOverflow;
    savedOverflow = "";
  }
}

export function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active) return;
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [active]);
}
