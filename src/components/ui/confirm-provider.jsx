"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useBodyScrollLock } from "@/lib/body-scroll-lock";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const closeWith = useCallback((result) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setDialog(null);
    if (resolve) resolve(result);
  }, []);

  const confirm = useCallback((options) => {
    const normalized =
      typeof options === "string"
        ? { message: options }
        : options || {};

    return new Promise((resolve) => {
      if (resolverRef.current) {
        resolverRef.current(false);
      }
      resolverRef.current = resolve;
      setDialog({
        title: normalized.title || "Konfirmasi Tindakan",
        message: normalized.message || "Apakah kamu yakin ingin melanjutkan?",
        confirmText: normalized.confirmText || "Lanjutkan",
        cancelText: normalized.cancelText || "Batal",
        variant: normalized.variant || "danger",
      });
    });
  }, []);

  useBodyScrollLock(Boolean(dialog));

  useEffect(() => {
    if (!dialog) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeWith(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dialog, closeWith]);

  useEffect(() => {
    return () => {
      if (resolverRef.current) {
        resolverRef.current(false);
        resolverRef.current = null;
      }
    };
  }, []);

  const isDanger = dialog?.variant !== "gold";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {dialog && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-desc"
          onClick={() => closeWith(false)}
          className="modal-overlay fixed inset-0 z-[150] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-panel relative w-full max-w-md overflow-hidden rounded-3xl p-6 text-zinc-100 sm:p-7"
          >
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border ${isDanger ? "border-rose-500/30 bg-rose-500/10 text-rose-300" : "border-champagne-300/35 bg-champagne-400/15 text-champagne-200"}`}>
              {isDanger ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <path d="M10.3 3.9L1.8 18.2A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9 12.2l2 2 4-4.4" />
                </svg>
              )}
            </div>

            <h3 id="confirm-dialog-title" className="font-display text-2xl text-white">
              {dialog.title}
            </h3>
            <p id="confirm-dialog-desc" className="mt-2 text-xs leading-relaxed text-zinc-400">
              {dialog.message}
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                autoFocus={isDanger}
                onClick={() => closeWith(false)}
                className="btn-ghost rounded-xl px-4 py-2.5 text-[11px] font-medium tracking-wide"
              >
                {dialog.cancelText}
              </button>
              <button
                type="button"
                autoFocus={!isDanger}
                onClick={() => closeWith(true)}
                className={
                  isDanger
                    ? "rounded-xl border border-rose-400/40 bg-rose-500/20 px-4 py-2.5 text-[11px] font-semibold tracking-wide text-rose-100 transition hover:border-rose-400/70 hover:bg-rose-500/35"
                    : "btn-gold rounded-xl px-4 py-2.5 text-[11px] tracking-wide"
                }
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    return (options) => Promise.resolve(window.confirm(typeof options === "string" ? options : options?.message || ""));
  }
  return ctx;
}
