"use client";

import { useState, useEffect, useRef, useActionState } from "react";
import Link from "next/link";
import { loginUserAction, registerUserAction, verifyAccountForResetAction, resetPasswordAction } from "@/actions/auth-actions";

const MARQUEE_COLUMNS = [
  [
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=70",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=70",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=70",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=70",
  ],
  [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=70",
    "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=600&q=70",
    "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&q=70",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=70",
  ],
  [
    "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&q=70",
    "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&q=70",
    "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=600&q=70",
    "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&q=70",
  ],
  [
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=70",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=70",
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=70",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=70",
  ],
];

export default function WelcomePage() {
  const [step, setStep] = useState(0);
  const [authMode, setAuthMode] = useState("login");
  const [selectedRole, setSelectedRole] = useState("Member");
  const timerRef = useRef(null);

  const [loginState, loginFormAction, isLoginPending] = useActionState(loginUserAction, null);
  const [registerState, registerFormAction, isRegisterPending] = useActionState(registerUserAction, null);
  const [verifyResetState, verifyResetAction, isVerifyingReset] = useActionState(verifyAccountForResetAction, null);
  const [resetState, resetFormAction, isResetting] = useActionState(resetPasswordAction, null);

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

  const isResetVerified = Boolean(verifyResetState?.verified && verifyResetState?.resetToken);
  const activeError =
    authMode === "login"
      ? loginState?.error
      : authMode === "register"
      ? registerState?.error
      : isResetVerified
      ? resetState?.error
      : verifyResetState?.error;
  const isSubmitting =
    authMode === "login"
      ? isLoginPending
      : authMode === "register"
      ? isRegisterPending
      : isResetVerified
      ? isResetting
      : isVerifyingReset;

  return (
    <main className="relative h-screen w-full overflow-hidden bg-transparent text-zinc-100 select-none">
      <div className={`pointer-events-none fixed inset-0 z-0 overflow-hidden transition-opacity duration-1000 ${step === 0 ? "opacity-[0.3]" : step === 1 ? "opacity-[0.16]" : "opacity-[0.08]"}`}>
        <div className="absolute -inset-x-[10%] -top-[25%] grid h-[150%] rotate-[-8deg] scale-110 grid-cols-3 gap-4 px-4 sm:grid-cols-4">
          {MARQUEE_COLUMNS.map((col, i) => (
            <div key={i} style={{ animationDuration: `${55 + i * 9}s` }} className={`flex flex-col gap-4 ${i % 2 === 0 ? "animate-marquee-up" : "animate-marquee-down"} ${i === 3 ? "hidden sm:flex" : ""}`}>
              {[...col, ...col].map((src, idx) => (
                <img key={idx} src={src} alt="" loading="lazy" className="aspect-[3/4] w-full rounded-2xl object-cover" />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(9,9,9,0.45)_0%,rgba(9,9,9,0.9)_65%,#090909_100%)]" />

      <header className="fixed top-6 left-1/2 z-30 -translate-x-1/2">
        <nav className="glass flex items-center gap-6 rounded-full px-6 py-2.5 text-[11px] uppercase tracking-[0.22em] text-zinc-400">
          <button type="button" onClick={handleBackToTop} className={`transition hover:text-white ${step === 0 ? "text-champagne-200 font-medium" : ""}`}>
            Beranda
          </button>
          <button type="button" onClick={handleStartLoginSequence} className={`transition hover:text-white ${step === 1 ? "text-champagne-200 font-medium" : ""}`}>
            Tentang
          </button>
          <button type="button" onClick={handleSkipToLogin} className={`transition hover:text-white ${step === 2 ? "text-champagne-200 font-medium" : ""}`}>
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
            <span className="glass animate-fade-up mb-6 rounded-full px-4 py-1.5 text-[9px] tracking-[0.4em] text-champagne-200">
              DIGITAL ART SHOWCASE &middot; 2026
            </span>

            <div className="relative flex items-center justify-center">
              <div className="animate-spin-slow absolute inset-[-20%] -z-10 rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(212,175,106,0.3),transparent_40%)] blur-2xl" />
              <img src="/images/aesthe-logo.png" alt="Logo Aesthe" className="logo-glow animate-float-slow h-36 w-36 object-contain mix-blend-screen sm:h-44 sm:w-44" />
            </div>

            <div className="mt-1 h-[1px] w-48 bg-gradient-to-r from-transparent via-champagne-300/40 to-transparent" />

            <div className="mt-5 overflow-hidden">
              <img src="/images/aesthe-text.png" alt="AESTHE" className="h-5 w-auto mix-blend-screen opacity-90 sm:h-6" />
            </div>

            <h1 className="font-display animate-fade-up mt-8 max-w-4xl text-center text-4xl leading-[1.05] sm:text-6xl lg:text-7xl" style={{ animationDelay: "150ms" }}>
              <span className="text-shimmer">Ruang pamer bagi</span> <span className="italic text-gold">imajinasi</span> <span className="text-shimmer">tanpa batas.</span>
            </h1>

            <p className="animate-fade-up mt-5 max-w-xl text-center text-xs leading-relaxed text-zinc-400 sm:text-sm" style={{ animationDelay: "300ms" }}>
              Pamerkan karya digitalmu, ikuti kompetisi yang dikurasi, dan temukan inspirasi dari kreator visual terbaik.
            </p>

            <div className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-4" style={{ animationDelay: "450ms" }}>
              <button type="button" onClick={handleStartLoginSequence} className="btn-gold rounded-full px-9 py-3.5 text-[10px] uppercase tracking-[0.35em]">
                Masuk ke Galeri &rarr;
              </button>
              <Link href="/home" className="btn-ghost rounded-full px-7 py-3.5 text-[10px] uppercase tracking-[0.3em]">
                Mode Tamu
              </Link>
            </div>
          </div>

          <div className="absolute bottom-7 inset-x-8 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-zinc-500">
            <span>ART SHOWCASE</span>
            <span>AESTHE PLATFORM &copy; 2026</span>
            <Link href="/home" className="transition hover:text-champagne-200">
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
            <div className="mb-5 flex flex-col items-center gap-2">
              <p className="eyebrow">TENTANG AESTHE</p>
            </div>

            <h2 className="font-display text-3xl leading-tight text-white sm:text-5xl lg:text-6xl">
              Ruang pamer digital bagi kreator, <span className="italic text-gold">untuk merayakan karya visual</span>{" "}
              <span className="text-zinc-500">&amp; kurasi seni modern.</span>
            </h2>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <span className="glass rounded-full px-4 py-2 text-[10px] tracking-[0.2em] text-zinc-300">✦ KURASI OLEH CURATOR</span>
              <span className="glass rounded-full px-4 py-2 text-[10px] tracking-[0.2em] text-zinc-300">◈ KOMPETISI BERHADIAH</span>
              <span className="glass rounded-full px-4 py-2 text-[10px] tracking-[0.2em] text-zinc-300">◉ KOMUNITAS KREATOR</span>
            </div>

            <div className="mt-12 flex justify-center">
              <div className="h-[2px] w-44 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full bg-gradient-to-r from-champagne-200 to-champagne-500 transition-all ease-linear ${
                    step === 1 ? "w-full duration-[3100ms]" : "w-0 duration-0"
                  }`}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex h-screen w-full flex-col items-center justify-center px-6">
          <div className={`glass gradient-border w-full max-w-md rounded-3xl p-8 transition-all duration-1000 sm:p-10 ${step === 2 ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
            <div className="mb-6 flex flex-col items-center text-center">
              <img src="/images/aesthe-logo.png" alt="Aesthe" className="logo-glow mb-3 h-10 w-10 object-contain mix-blend-screen" />
              <h3 className="font-display text-3xl tracking-wide text-white">
                {authMode === "login"
                  ? "Masuk ke Akun Aesthe"
                  : authMode === "register"
                  ? "Buat Akun Baru"
                  : "Pulihkan Kata Sandi"}
              </h3>
              <p className="mt-1 text-xs text-zinc-400">
                {authMode === "login"
                  ? "Masukkan kredensial untuk mengelola karya dan portofolio."
                  : authMode === "register"
                  ? "Bergabung sebagai kreator atau kurator pameran."
                  : isResetVerified
                  ? `Akun ${verifyResetState.displayName} terverifikasi. Buat kata sandi baru.`
                  : "Verifikasi email dan username akun untuk mengatur ulang kata sandi."}
              </p>
            </div>

            {authMode !== "forgot" && (
              <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/10 bg-black/40 p-1 text-xs">
                <button type="button" onClick={() => setAuthMode("login")} className={`rounded-lg py-2 font-medium transition ${authMode === "login" ? "chip-active" : "text-zinc-400 hover:text-white"}`}>
                  Masuk
                </button>
                <button type="button" onClick={() => setAuthMode("register")} className={`rounded-lg py-2 font-medium transition ${authMode === "register" ? "chip-active" : "text-zinc-400 hover:text-white"}`}>
                  Daftar Akun
                </button>
              </div>
            )}

            {activeError && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
                {activeError}
              </div>
            )}

            {authMode === "forgot" && resetState?.success ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs leading-relaxed text-emerald-300">
                  {resetState.message}
                </div>
                <button type="button" onClick={() => setAuthMode("login")} className="btn-gold mt-2 w-full rounded-xl py-3 text-xs uppercase tracking-[0.2em]">
                  Kembali ke Login
                </button>
              </div>
            ) : authMode === "forgot" && isResetVerified ? (
              <form action={resetFormAction} className="space-y-4">
                <input type="hidden" name="resetToken" value={verifyResetState.resetToken} />

                <div>
                  <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-zinc-400">Kata Sandi Baru</label>
                  <input type="password" name="newPassword" required minLength={6} placeholder="Minimal 6 karakter" className="input-lux" />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-zinc-400">Konfirmasi Kata Sandi</label>
                  <input type="password" name="confirmPassword" required minLength={6} placeholder="Ulangi kata sandi baru" className="input-lux" />
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-gold mt-2 w-full rounded-xl py-3 text-xs uppercase tracking-[0.2em]">
                  {isSubmitting ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
                </button>

                <button type="button" onClick={() => setAuthMode("login")} className="w-full text-center text-[11px] text-zinc-400 transition hover:text-champagne-200">
                  &larr; Kembali ke halaman masuk
                </button>
              </form>
            ) : authMode === "forgot" ? (
              <form action={verifyResetAction} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-zinc-400">Email Terdaftar</label>
                  <input type="email" name="email" required placeholder="email@email.com" className="input-lux" />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-zinc-400">Username Terdaftar</label>
                  <input type="text" name="username" required placeholder="randy_art" className="input-lux" />
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-gold mt-2 w-full rounded-xl py-3 text-xs uppercase tracking-[0.2em]">
                  {isSubmitting ? "Memverifikasi..." : "Verifikasi Akun"}
                </button>

                <button type="button" onClick={() => setAuthMode("login")} className="w-full text-center text-[11px] text-zinc-400 transition hover:text-champagne-200">
                  &larr; Kembali ke halaman masuk
                </button>
              </form>
            ) : (
            <form action={authMode === "login" ? loginFormAction : registerFormAction} className="space-y-4">
              {authMode === "register" && (
                <>
                  <div>
                    <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-zinc-400">Display Name</label>
                    <input type="text" name="displayName" required placeholder="Contoh: Randy Rahmat" className="input-lux" />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-zinc-400">Username</label>
                    <input type="text" name="username" required placeholder="randy_art" className="input-lux" />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-zinc-400">Peran Akun</label>
                    <input type="hidden" name="role" value={selectedRole} />
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button type="button" onClick={() => setSelectedRole("Member")} className={`rounded-lg border px-3 py-2 text-left transition ${selectedRole === "Member" ? "border-champagne-300/60 bg-champagne-400/10 text-white" : "border-white/10 bg-black/30 text-zinc-400"}`}>
                        <div className="font-medium">Member / Kreator</div>
                        <div className="text-[10px] text-zinc-500">Unggah &amp; ikut tantangan</div>
                      </button>
                      <button type="button" onClick={() => setSelectedRole("Curator")} className={`rounded-lg border px-3 py-2 text-left transition ${selectedRole === "Curator" ? "border-champagne-300/60 bg-champagne-400/10 text-white" : "border-white/10 bg-black/30 text-zinc-400"}`}>
                        <div className="font-medium">Curator</div>
                        <div className="text-[10px] text-zinc-500">Butuh verifikasi Admin</div>
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-zinc-400">Email</label>
                <input type="email" name="email" required placeholder="email@email.com" className="input-lux" />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-[11px] uppercase tracking-wider text-zinc-400">Kata Sandi</label>
                  {authMode === "login" && (
                    <button type="button" onClick={() => setAuthMode("forgot")} className="text-[11px] text-zinc-400 transition hover:text-champagne-200">
                      Lupa kata sandi?
                    </button>
                  )}
                </div>
                <input type="password" name="password" required placeholder="Password" className="input-lux" />
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-gold mt-2 w-full rounded-xl py-3 text-xs uppercase tracking-[0.2em]">
                {isSubmitting ? "Memproses..." : authMode === "login" ? "Masuk Sekarang" : "Daftar Akun"}
              </button>
            </form>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-zinc-500">
              <button type="button" onClick={handleBackToTop} className="transition hover:text-champagne-200">
                &uarr; Kembali ke Awal
              </button>
              <Link href="/home" className="transition hover:text-champagne-200">
                Jelajahi tanpa akun &rarr;
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}