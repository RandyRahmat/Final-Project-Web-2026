"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idCounterRef = useRef(1);
  const timersRef = useRef(new Map());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const dismiss = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(({ type = "success", title, description = "", duration = 3200 }) => {
    if (!title) return;
    const id = idCounterRef.current++;

    setToasts((prev) => {
      if (prev.length >= 4) {
        const evicted = prev.slice(0, prev.length - 3);
        evicted.forEach((old) => {
          const oldTimer = timersRef.current.get(old.id);
          if (oldTimer) {
            window.clearTimeout(oldTimer);
            timersRef.current.delete(old.id);
          }
        });
      }
      return [...prev.slice(-3), { id, type, title, description, duration }];
    });

    const timer = window.setTimeout(() => {
      timersRef.current.delete(id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
    timersRef.current.set(id, timer);
  }, []);

  const api = useMemo(
    () => ({
      success: (title, description) => push({ type: "success", title, description }),
      info: (title, description) => push({ type: "info", title, description }),
      error: (title, description) => push({ type: "error", title, description, duration: 4200 }),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* TOAST STACK — diposisikan di kanan atas agar tidak pernah menimpa BackToTop atau MobileBottomNav */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 top-20 z-[170] flex flex-col items-end gap-2.5 sm:inset-x-auto sm:right-6 sm:w-[360px] lg:top-6"
      >
        {toasts.map((item) => {
          const isError = item.type === "error";
          const isInfo = item.type === "info";

          return (
            <div
              key={item.id}
              role={isError ? "alert" : "status"}
              className={`toast-in pointer-events-auto relative w-full overflow-hidden rounded-2xl border bg-[#111115]/95 px-4 py-3.5 text-zinc-100 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)] backdrop-blur-md ${
                isError
                  ? "border-rose-400/35"
                  : isInfo
                  ? "border-white/15"
                  : "border-champagne-300/35"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                    isError
                      ? "border-rose-400/35 bg-rose-500/15 text-rose-300"
                      : isInfo
                      ? "border-champagne-300/25 bg-white/[0.06] text-champagne-200"
                      : "border-champagne-300/40 bg-champagne-400/15 text-champagne-200"
                  }`}
                >
                  {isError ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      <path d="M12 8v5" />
                      <path d="M12 16h.01" />
                    </svg>
                  ) : isInfo ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      <path d="M12 3l1.8 4.8L18.5 9.5l-4.7 1.7L12 16l-1.8-4.8L5.5 9.5l4.7-1.7L12 3z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>

                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs font-medium leading-snug text-white">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 break-words text-[10px] leading-relaxed text-zinc-400">
                      {item.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  aria-label="Tutup notifikasi"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-xs text-zinc-500 transition hover:bg-white/10 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div
                style={{ animationDuration: `${item.duration}ms` }}
                className={`toast-progress absolute bottom-0 left-0 h-[2px] w-full origin-left ${
                  isError
                    ? "bg-gradient-to-r from-rose-500 to-rose-300"
                    : "bg-gradient-to-r from-champagne-500 via-champagne-300 to-champagne-100"
                }`}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

const NOOP_TOAST = {
  success: () => {},
  info: () => {},
  error: () => {},
  dismiss: () => {},
};

export function useToast() {
  return useContext(ToastContext) || NOOP_TOAST;
}
