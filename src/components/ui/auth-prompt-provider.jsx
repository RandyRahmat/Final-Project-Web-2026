"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { useBodyScrollLock } from "@/lib/body-scroll-lock";

const AuthPromptContext = createContext(null);

export function AuthPromptProvider({ children }) {
  const [prompt, setPrompt] = useState(null);

  const close = useCallback(() => {
    setPrompt(null);
  }, []);

  const openAuthPrompt = useCallback((options) => {
    const normalized =
      typeof options === "string"
        ? { title: options }
        : options || {};

    setPrompt({
      title: normalized.title || "Masuk untuk Melanjutkan",
      message:
        normalized.message ||
        "Masuk sebagai Member Aesthe untuk memberi reaksi, menyimpan karya ke moodboard, mengikuti kreator, dan berpartisipasi di challenge.",
    });
  }, []);

  useBodyScrollLock(Boolean(prompt));

  useEffect(() => {
    if (!prompt) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [prompt, close]);

  return (
    <AuthPromptContext.Provider value={openAuthPrompt}>
      {children}

      {prompt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-prompt-title"
          onClick={close}
          className="modal-overlay fixed inset-0 z-[165] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-panel gradient-border relative w-full max-w-sm rounded-3xl p-7 text-center text-zinc-100 sm:p-8"
          >
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-champagne-300/30 bg-champagne-400/10">
              <img src="/images/aesthe-logo.png" alt="Aesthe" className="logo-glow h-9 w-9 object-contain mix-blend-screen" />
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-champagne-300/25 bg-champagne-400/10 px-3 py-0.5 text-[9px] font-medium uppercase tracking-[0.22em] text-champagne-200">
              Mode Tamu
            </span>

            <h3 id="auth-prompt-title" className="font-display mt-3.5 text-3xl leading-tight text-white">
              {prompt.title}
            </h3>

            <p className="mt-2.5 text-xs leading-relaxed text-zinc-400">
              {prompt.message}
            </p>

            <div className="mt-7 flex flex-col gap-2">
              <Link
                href="/?step=login"
                onClick={close}
                className="btn-gold w-full rounded-full py-3 text-[11px] uppercase tracking-[0.2em]"
              >
                Login Sekarang →
              </Link>

              <button
                type="button"
                onClick={close}
                className="w-full rounded-full py-2.5 text-xs text-zinc-400 transition hover:bg-white/[0.04] hover:text-champagne-100"
              >
                Tetap dalam Mode Tamu
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthPromptContext.Provider>
  );
}

export function useAuthPrompt() {
  const ctx = useContext(AuthPromptContext);
  return ctx || (() => {});
}
