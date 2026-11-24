"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "aesthe_sidebar_collapsed";
const CHANGE_EVENT = "aesthe-sidebar-toggle";

function subscribe(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function getServerSnapshot() {
  return false;
}

export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleCollapsed = useCallback(() => {
    try {
      const next = !(window.localStorage.getItem(STORAGE_KEY) === "true");
      window.localStorage.setItem(STORAGE_KEY, String(next));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      // Abaikan jika localStorage tidak tersedia
    }
  }, []);

  return [collapsed, toggleCollapsed];
}
