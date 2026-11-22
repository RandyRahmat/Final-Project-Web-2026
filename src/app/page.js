"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function WelcomePage() {
  const [step, setStep] = useState(0);
  const [authMode, setAuthMode] = useState("login");
  const [selectedRole, setSelectedRole] = useState("member");
  const timerRef = useRef(null);

  const handleStartLoginSequence = () => {
    setStep(1);
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setStep(2);
    }, 3200);
  };

  const handleSkipToLogin = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStep(2);
  };

  const handleBackToTop = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStep(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#0b0b0c] text-zinc-100 select-none">
      <div className="pointer-events-none fixed inset-y-0 left-1/2 z-0 w-[1px] -translate-x-1/2 bg-white/[0.06]" />

      <div className="pointer-events-none fixed left-1/2 top-1/2 z-0 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.03] blur-3xl" />

      <header className="fixed top-6 left-1/2 z-30 -translate-x-1/2">
        <nav className="flex items-center gap-6 rounded-full border border-white/10 bg-zinc-900/70 px-6 py-2.5 text-[11px] uppercase tracking-[0.22em] text-zinc-400 backdrop-blur-md">
          <button type="button" onClick={handleBackToTop} className={`transition hover:text-white ${step === 0 ? "text-white font-medium" : ""}`}>
            Beranda
          </button>
          <button type="button" onClick={handleStartLoginSequence} className={`transition hover:text-white ${step === 1 ? "text-white font-medium" : ""}`}>
            Tentang
          </button>
          <button type="button" onClick={handleSkipToLogin} className={`transition hover:text-white ${step === 2 ? "text-white font-medium" : ""}`}>
            Masuk
          </button>
        </nav>
      </header>

      <div
        className="relative z-10 h-[300vh] w-full transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateY(-${step * 100}vh)` }}
      >
        <section className="relative flex h-screen w-full flex-col items-center justify-center px-6">
          <div className="flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              <img src="/images/aesthe-logo.png" alt="Logo Aesthe" className="h-44 w-44 object-contain mix-blend-screen drop-shadow-[0_0_28px_rgba(255,255,255,0.35)] sm:h-52 sm:w-52" />
            </div>

            <div className="mt-1 h-[1px] w-48 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            <div className="mt-5 overflow-hidden">
              <img src="/images/aesthe-text.png" alt="AESTHE" className="h-5 w-auto mix-blend-screen opacity-90 sm:h-6" />
            </div>

            <button type="button" onClick={handleStartLoginSequence} className="group mt-12 flex flex-col items-center gap-3 focus:outline-none">
              <span className="rounded-full border border-white/25 bg-white/[0.04] px-10 py-3 text-xs font-medium uppercase tracking-[0.35em] text-white backdrop-blur-sm transition-all duration-300 group-hover:border-white group-hover:bg-white group-hover:text-black group-hover:shadow-[0_0_30px_rgba(255,255,255,0.35)]">
                LOGIN
              </span>
              <span className="text-[10px] uppercase tracking-[0.28em] text-zinc-500 transition-colors group-hover:text-zinc-300">
                Masuk ke Galeri
              </span>
            </button>
          </div>

          <div className="absolute bottom-7 inset-x-8 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-zinc-500">
            <span>ART SHOWCASE</span>
            <span>AESTHE PLATFORM &copy; 2026</span>
            <Link href="" className="transition hover:text-zinc-300">
              MODE TAMU
            </Link>
          </div>
        </section>

        <section
          onClick={handleSkipToLogin}
          title="Klik di mana saja untuk melewati"
          className="relative flex h-screen w-full cursor-pointer flex-col items-center justify-center px-6 text-center"
        >
          <div className={`max-w-4xl transition-all duration-1000 ${step === 1 ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
            <div className="mb-4 flex flex-col items-center gap-2">
              <span className="text-[10px] text-zinc-400">&#9662;</span>
              <p className="text-[11px] uppercase tracking-[0.35em] text-zinc-400">
                TENTANG AESTHE
              </p>
            </div>

            <h2 className="text-2xl font-light uppercase leading-relaxed tracking-[0.14em] text-white sm:text-4xl sm:leading-snug">
              RUANG PAMER DIGITAL BAGI KREATOR{" "}
              <span className="text-zinc-500">
                UNTUK MERAYAKAN KARYA VISUAL &amp; KURASI SENI MODERN
              </span>
            </h2>

            <div className="mt-12 flex justify-center">
              <div className="h-[2px] w-44 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full bg-white transition-all ease-linear ${
                    step === 1 ? "w-full duration-[3100ms]" : "w-0 duration-0"
                  }`}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex h-screen w-full flex-col items-center justify-center px-6">
          <div className={`w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/65 p-8 backdrop-blur-xl transition-all duration-1000 ${step === 2 ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
            <div className="mb-6 flex flex-col items-center text-center">
              <img src="/images/aesthe-logo.png" alt="Aesthe" className="mb-3 h-10 w-10 object-contain mix-blend-screen" />
              <h3 className="text-lg font-medium tracking-wider text-white">
                {authMode === "login" ? "Masuk ke Akun Aesthe" : "Buat Akun Baru"}
              </h3>
              <p className="mt-1 text-xs text-zinc-400">
                {authMode === "login"
                  ? "Masukkan kredensial untuk mengelola karya dan portofolio."
                  : "Bergabung sebagai kreator atau kurator pameran."}
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-lg border border-white/10 bg-black/40 p-1 text-xs">
              <button type="button" onClick={() => setAuthMode("login")} className={`rounded-md py-2 font-medium transition ${authMode === "login" ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}>
                Masuk
              </button>
              <button type="button" onClick={() => setAuthMode("register")} className={`rounded-md py-2 font-medium transition ${authMode === "register" ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}>
                Daftar Akun
              </button>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              {authMode === "register" && (
                <>
                  <div>
                    <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-zinc-400">Display Name</label>
                    <input type="text" placeholder="Display Name" className="w-full rounded-lg border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-white/40 focus:outline-none" />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-zinc-400">Username</label>
                    <input type="text" placeholder="Username" className="w-full rounded-lg border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-white/40 focus:outline-none" />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-zinc-400">Peran Akun</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button type="button" onClick={() => setSelectedRole("member")} className={`rounded-lg border px-3 py-2 text-left transition ${selectedRole === "member" ? "border-white bg-white/10 text-white" : "border-white/10 bg-black/30 text-zinc-400"}`}>
                        <div className="font-medium">Member / Kreator</div>
                        <div className="text-[10px] text-zinc-500">Unggah &amp; ikut tantangan</div>
                      </button>
                      <button type="button" onClick={() => setSelectedRole("curator")} className={`rounded-lg border px-3 py-2 text-left transition ${selectedRole === "curator" ? "border-white bg-white/10 text-white" : "border-white/10 bg-black/30 text-zinc-400"}`}>
                        <div className="font-medium">Curator</div>
                        <div className="text-[10px] text-zinc-500">Butuh verifikasi Admin</div>
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-zinc-400">Email</label>
                <input type="email" placeholder="email@email.com" className="w-full rounded-lg border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-white/40 focus:outline-none" />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-zinc-400">Kata Sandi</label>
                <input type="password" placeholder="Password" className="w-full rounded-lg border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-white/40 focus:outline-none" />
              </div>

              <button type="submit" className="mt-2 w-full rounded-lg bg-white py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-zinc-200">
                {authMode === "login" ? "Masuk Sekarang" : "Daftar Akun"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-zinc-500">
              <Link href="/explore" className="transition hover:text-white">
                Jelajahi tanpa akun &rarr;
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}