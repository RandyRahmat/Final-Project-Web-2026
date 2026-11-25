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

function ForgotPasswordFlow({ email, onEmailChange, onBackToLogin }) {
  const [verifyResetState, verifyResetAction, isVerifyingReset] = useActionState(verifyAccountForResetAction, null);
  const [resetState, resetFormAction, isResetting] = useActionState(resetPasswordAction, null);

  const isResetVerified = Boolean(verifyResetState?.verified && verifyResetState?.resetToken);
  const activeError = isResetVerified ? resetState?.error : verifyResetState?.error;
  const isSubmitting = isResetVerified ? isResetting : isVerifyingReset;

  return (
    <>
      <div className="mb-6 flex flex-col items-center text-center">
        <img src="/images/aesthe-logo.png" alt="Aesthe" className="logo-glow mb-3 h-10 w-10 object-contain mix-blend-screen" />
        <h3 className="font-display text-3xl tracking-wide text-white">Pulihkan Kata Sandi</h3>
        <p className="mt-1 text-xs text-zinc-400">
          {isResetVerified
            ? `Akun ${verifyResetState.displayName} terverifikasi. Buat kata sandi baru.`
            : "Verifikasi email dan username akun untuk mengatur ulang kata sandi."}
        </p>
      </div>

      {activeError && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
          {activeError}
        </div>
      )}

      {resetState?.success ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs leading-relaxed text-emerald-300">
            {resetState.message}
          </div>
          <button type="button" onClick={onBackToLogin} className="btn-gold mt-2 w-full rounded-xl py-3 text-xs uppercase tracking-[0.2em]">
            Kembali ke Login
          </button>
        </div>
      ) : isResetVerified ? (
        <form key="forgot-reset-form" action={resetFormAction} className="space-y-4">
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

          <button type="button" onClick={onBackToLogin} className="w-full text-center text-[11px] text-zinc-400 transition hover:text-champagne-200">
            &larr; Kembali ke halaman masuk
          </button>
        </form>
      ) : (
        <form key="forgot-verify-form" action={verifyResetAction} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-zinc-400">Email Terdaftar</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              required
              placeholder="name@example.com"
              className="input-lux"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-zinc-400">Username Terdaftar</label>
            <input
              type="text"
              name="username"
              required
              autoFocus={Boolean(email.trim())}
              placeholder="Username_Terdaftar"
              className="input-lux"
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-gold mt-2 w-full rounded-xl py-3 text-xs uppercase tracking-[0.2em]">
            {isSubmitting ? "Memverifikasi..." : "Verifikasi Akun"}
          </button>

          <button type="button" onClick={onBackToLogin} className="w-full text-center text-[11px] text-zinc-400 transition hover:text-champagne-200">
            &larr; Kembali ke halaman masuk
          </button>
        </form>
      )}
    </>
  );
}

export default function WelcomePage() {
  const [step, setStep] = useState(0);
  const [authMode, setAuthMode] = useState("login");
  const [forgotSessionKey, setForgotSessionKey] = useState(0);
  const [selectedRole, setSelectedRole] = useState("Member");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const timerRef = useRef(null);

  const [loginState, loginFormAction, isLoginPending] = useActionState(loginUserAction, null);
  const [registerState, registerFormAction, isRegisterPending] = useActionState(registerUserAction, null);

  const switchAuthMode = (mode) => {
    if (mode === "forgot") {
      setForgotSessionKey((k) => k + 1);
    }
    setAuthMode(mode);
    setShowPassword(false);
  };

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
    const params = new URLSearchParams(window.location.search);
    let rafId = 0;
    if (params.get("step") === "login") {
      rafId = requestAnimationFrame(() => setStep(2));
    }
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const activeError = authMode === "login" ? loginState?.error : registerState?.error;
  const isSubmitting = authMode === "login" ? isLoginPending : isRegisterPending;

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

      {/* TOMBOL KEMBALI KE AWAL DI LUAR KARTU (DESKTOP POJOK KIRI ATAS) */}
      <button
        type="button"
        onClick={handleBackToTop}
        className={`btn-ghost fixed left-8 top-6 z-30 hidden rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.16em] transition-all duration-500 sm:inline-flex ${
          step === 2 ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        &larr; Kembali ke Awal
      </button>

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

        <section className="relative flex h-screen w-full flex-col items-center justify-center px-6 pt-14 sm:pt-0">
          <div
            className={`glass gradient-border w-full rounded-3xl transition-all duration-1000 ${
              authMode === "register" ? "max-w-[460px]" : "max-w-md"
            } ${
              step === 2 ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <div
              data-lenis-prevent
              className={`overflow-x-hidden overflow-y-auto rounded-3xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                authMode === "register"
                  ? "max-h-[88vh] p-6 sm:px-8 sm:py-6"
                  : "max-h-[82vh] p-7 sm:max-h-[86vh] sm:p-9"
              }`}
            >
              {authMode === "forgot" ? (
                <ForgotPasswordFlow
                  key={forgotSessionKey}
                  email={email}
                  onEmailChange={setEmail}
                  onBackToLogin={() => switchAuthMode("login")}
                />
              ) : (
                <>
                  <div className={`flex flex-col items-center text-center ${authMode === "register" ? "mb-4" : "mb-6"}`}>
                    {authMode === "login" && (
                      <img src="/images/aesthe-logo.png" alt="Aesthe" className="logo-glow mb-3 h-10 w-10 object-contain mix-blend-screen" />
                    )}
                    <h3 className={`font-display tracking-wide text-white ${authMode === "register" ? "text-2xl sm:text-[28px]" : "text-3xl"}`}>
                      {authMode === "login" ? "Masuk ke Akun Aesthe" : "Buat Akun Baru"}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-400">
                      {authMode === "login"
                        ? "Masukkan kredensial untuk mengelola karya dan portofolio."
                        : "Bergabung sebagai kreator atau kurator pameran."}
                    </p>
                  </div>

                  {activeError && (
                    <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs text-red-300">
                      {activeError}
                    </div>
                  )}

                  <form key={authMode === "login" ? "login-form" : "register-form"} action={authMode === "login" ? loginFormAction : registerFormAction} className={authMode === "register" ? "space-y-3" : "space-y-4"}>
                {authMode === "register" && (
                  <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] uppercase tracking-wider text-zinc-400">Display Name</label>
                        <input type="text" name="displayName" required placeholder="Display Name" className="input-lux py-2" />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] uppercase tracking-wider text-zinc-400">Username</label>
                        <input type="text" name="username" required placeholder="Username" className="input-lux py-2" />
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-baseline justify-between gap-1">
                        <label className="block text-[11px] uppercase tracking-wider text-zinc-400">Peran Akun</label>
                        <span className="text-[11px] text-zinc-400">
                          <span className="font-medium text-champagne-200">
                            {selectedRole === "Curator" ? "Curator" : "Member / Kreator"}
                          </span>
                          <span className="text-zinc-500">
                            {selectedRole === "Curator" ? " · kelola challenge" : " · unggah karya"}
                          </span>
                        </span>
                      </div>
                      <input type="hidden" name="role" value={selectedRole} />

                      <label className="mt-1.5 flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2 transition hover:border-champagne-300/35">
                        <input
                          type="checkbox"
                          checked={selectedRole === "Curator"}
                          onChange={(e) => setSelectedRole(e.target.checked ? "Curator" : "Member")}
                          className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-[#d4af6a]"
                        />
                        <span className="text-[11px] leading-snug text-zinc-300">
                          Ajukan sebagai <span className="font-medium text-champagne-200">Curator</span>{" "}
                          <span className="text-zinc-500">(verifikasi Admin)</span>
                        </span>
                      </label>
                    </div>
                  </>
                )}

                <div>
                  <label className={`block text-[11px] uppercase tracking-wider text-zinc-400 ${authMode === "register" ? "mb-1" : "mb-1.5"}`}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className={authMode === "register" ? "input-lux py-2" : "input-lux"}
                  />
                </div>

                <div>
                  <div className={`flex items-center justify-between ${authMode === "register" ? "mb-1" : "mb-1.5"}`}>
                    <label className="block text-[11px] uppercase tracking-wider text-zinc-400">Kata Sandi</label>
                    {authMode === "login" && (
                      <button type="button" onClick={() => switchAuthMode("forgot")} className="text-[11px] text-zinc-400 transition hover:text-champagne-200">
                        Lupa kata sandi?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      placeholder="Password"
                      className={authMode === "register" ? "input-lux py-2 pr-10" : "input-lux pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 transition hover:text-champagne-200 ${showPassword ? "text-champagne-200" : "text-zinc-500"}`}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12c.73-2.06 1.98-3.88 3.6-5.26" />
                          <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a11.05 11.05 0 0 1-2.16 3.19" />
                          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className={`btn-gold w-full rounded-xl text-xs uppercase tracking-[0.2em] ${authMode === "register" ? "mt-1 py-2.5" : "mt-2 py-3"}`}>
                  {isSubmitting ? "Memproses..." : authMode === "login" ? "Masuk Sekarang" : "Daftar Sekarang"}
                </button>
              </form>
              </>
            )}

            {/* FOOTER DI DALAM KARTU: PENGALIH DAFTAR/MASUK + JELAJAHI TANPA AKUN */}
            {authMode !== "forgot" && (
              <div className={`text-center ${authMode === "register" ? "mt-4" : "mt-6"}`}>
                <p className="text-xs text-zinc-400">
                  {authMode === "login" ? (
                    <>
                      Belum punya akun Aesthe?{" "}
                      <button
                        type="button"
                        onClick={() => switchAuthMode("register")}
                        className="font-medium text-champagne-200 underline-offset-4 transition hover:text-champagne-100 hover:underline"
                      >
                        Daftar di sini
                      </button>
                    </>
                  ) : (
                    <>
                      Sudah punya akun?{" "}
                      <button
                        type="button"
                        onClick={() => switchAuthMode("login")}
                        className="font-medium text-champagne-200 underline-offset-4 transition hover:text-champagne-100 hover:underline"
                      >
                        Masuk sekarang
                      </button>
                    </>
                  )}
                </p>

                <div className={`flex items-center gap-3 ${authMode === "register" ? "my-2.5" : "my-4"}`}>
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">atau</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <Link href="/home" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition hover:text-champagne-200">
                  Jelajahi tanpa akun &rarr;
                </Link>
              </div>
            )}
            </div>
          </div>

          {/* TOMBOL KEMBALI KE AWAL DI LUAR KARTU (MOBILE) */}
          <button
            type="button"
            onClick={handleBackToTop}
            className="btn-ghost mt-4 rounded-full px-5 py-2 text-[10px] uppercase tracking-[0.16em] sm:hidden"
          >
            &larr; Kembali ke Awal
          </button>
        </section>
      </div>
    </main>
  );
}