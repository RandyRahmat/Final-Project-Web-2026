"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AppSidebar from "@/components/app-sidebar";
import { useSidebarCollapsed } from "@/lib/use-sidebar-collapsed";
import { sendMessageAction } from "@/actions/message-actions";

function formatTime(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function MessagesClient({
  currentUser,
  initialConversations,
  initialPartnerId,
  initialMessages,
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedPartnerId, setSelectedPartnerId] = useState(initialPartnerId);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [sidebarCollapsed, toggleSidebarCollapsed] = useSidebarCollapsed();
  const bottomRef = useRef(null);

  const activePartner = conversations.find((c) => c.id === selectedPartnerId) || null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedPartnerId]);

  // Polling ringan tiap 5 detik untuk pesan masuk baru di percakapan aktif
  useEffect(() => {
    if (!selectedPartnerId) return;
    let cancelled = false;

    const fetchLatest = async () => {
      try {
        const res = await fetch(`/api/messages?with=${selectedPartnerId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.messages)) {
          setMessages(data.messages);
          const last = data.messages[data.messages.length - 1];
          if (last) {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === selectedPartnerId
                  ? { ...c, last_message: last.content, last_message_at: last.created_at, unread_count: 0 }
                  : c
              )
            );
          }
        }
      } catch {
        // Abaikan error jaringan sementara saat polling
      }
    };

    const interval = setInterval(fetchLatest, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedPartnerId]);

  const handleSelectPartner = async (partnerId) => {
    setSelectedPartnerId(partnerId);
    setError("");
    setLoadingChat(true);
    try {
      const res = await fetch(`/api/messages?with=${partnerId}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setConversations((prev) =>
          prev.map((c) => (c.id === partnerId ? { ...c, unread_count: 0 } : c))
        );
      }
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedPartnerId || !draft.trim() || sending) return;

    setSending(true);
    setError("");
    const textToSend = draft.trim();
    const res = await sendMessageAction(selectedPartnerId, textToSend);
    setSending(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    if (res?.message) {
      setMessages((prev) => [...prev, res.message]);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedPartnerId
            ? { ...c, last_message: res.message.content, last_message_at: res.message.created_at }
            : c
        )
      );
      setDraft("");
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#090909] text-zinc-100">
      {/* BACKGROUND ATMOSPHERE */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-64 left-1/3 h-[600px] w-[600px] rounded-full bg-white/[0.035] blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:radial-gradient(#fff_0.6px,transparent_0.6px)] [background-size:5px_5px]" />
      </div>

      <AppSidebar
        currentUser={currentUser}
        activeItem="messages"
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
        mobileMenu={mobileMenu}
        onCloseMobile={() => setMobileMenu(false)}
      />

      {/* MAIN CONTENT */}
      <div className={`relative z-10 flex min-h-screen flex-col transition-all duration-300 ${sidebarCollapsed ? "lg:ml-[78px]" : "lg:ml-[250px]"}`}>
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.06] bg-[#090909]/80 px-5 backdrop-blur-2xl sm:px-8 lg:px-12">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setMobileMenu(true)} className="text-xl text-zinc-400 hover:text-white lg:hidden" aria-label="Open menu">
              ☰
            </button>
            <div className="text-[10px] tracking-[0.2em] text-zinc-600">
              INBOX / <span className="text-zinc-300">PRIVATE MESSAGES</span>
            </div>
          </div>
          <Link href="/explore" className="rounded-full border border-white/15 px-4 py-1.5 text-[10px] uppercase tracking-[0.15em] text-zinc-300 transition hover:border-white hover:text-white">
            Cari Kreator &rarr;
          </Link>
        </header>

        <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-5 py-6 sm:px-8 lg:px-12">
          <div className="grid min-h-[calc(100vh-140px)] flex-1 grid-cols-1 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0e0e10]/80 md:grid-cols-12">
            {/* KOLOM KIRI: DAFTAR PERCAKAPAN */}
            <section className="flex flex-col border-b border-white/[0.08] md:col-span-4 md:border-b-0 md:border-r">
              <div className="border-b border-white/[0.06] px-5 py-4">
                <h1 className="text-sm font-medium tracking-wide text-white">Pesan Pribadi</h1>
                <p className="mt-0.5 text-[10px] text-zinc-500">{conversations.length} percakapan</p>
              </div>

              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <p className="text-xs text-zinc-400">Belum ada percakapan.</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-zinc-600">
                      Kunjungi profil kreator di halaman Explore atau Home lalu klik &ldquo;Kirim Pesan&rdquo;.
                    </p>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const isSelected = conv.id === selectedPartnerId;
                    return (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => handleSelectPartner(conv.id)}
                        className={`flex w-full items-center gap-3 border-b border-white/[0.04] px-5 py-3.5 text-left transition ${
                          isSelected ? "bg-white/[0.08]" : "hover:bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-zinc-800 text-xs font-semibold text-white">
                          {conv.avatar_url ? (
                            <img src={conv.avatar_url} alt={conv.display_name} className="h-full w-full object-cover" />
                          ) : (
                            conv.display_name?.charAt(0).toUpperCase() || "U"
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs font-medium text-white">{conv.display_name}</p>
                            {conv.unread_count > 0 && (
                              <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-black">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-[10px] text-zinc-500">
                            {conv.last_message || `@${conv.username} · Mulai percakapan`}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            {/* KOLOM KANAN: RUANG CHAT */}
            <section className="flex flex-col md:col-span-8">
              {activePartner ? (
                <>
                  {/* CHAT HEADER */}
                  <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
                    <Link href={`/creators/${activePartner.username}`} className="flex items-center gap-3 transition hover:opacity-80">
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-zinc-800 text-xs font-semibold text-white">
                        {activePartner.avatar_url ? (
                          <img src={activePartner.avatar_url} alt={activePartner.display_name} className="h-full w-full object-cover" />
                        ) : (
                          activePartner.display_name?.charAt(0).toUpperCase() || "U"
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">{activePartner.display_name}</p>
                        <p className="text-[10px] text-zinc-500">@{activePartner.username} &bull; {activePartner.role}</p>
                      </div>
                    </Link>

                    <Link href={`/creators/${activePartner.username}`} className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-zinc-400 transition hover:border-white/30 hover:text-white">
                      Lihat Profil ↗
                    </Link>
                  </div>

                  {/* CHAT MESSAGES LIST */}
                  <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
                    {loadingChat ? (
                      <p className="py-12 text-center text-xs text-zinc-500">Memuat percakapan...</p>
                    ) : messages.length === 0 ? (
                      <div className="py-16 text-center">
                        <p className="text-xs text-zinc-400">Belum ada pesan dengan {activePartner.display_name}.</p>
                        <p className="mt-1 text-[10px] text-zinc-600">Kirim sapaan pertamamu di bawah ini.</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMine = Number(msg.sender_id) === Number(currentUser.id);
                        return (
                          <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${isMine ? "rounded-br-sm bg-white text-black" : "rounded-bl-sm border border-white/10 bg-zinc-900 text-zinc-100"}`}>
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              <p className={`mt-1 text-right text-[9px] ${isMine ? "text-zinc-600" : "text-zinc-500"}`}>
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {/* CHAT INPUT */}
                  <div className="border-t border-white/[0.06] p-4">
                    {error && (
                      <p className="mb-2 text-[11px] text-red-400">{error}</p>
                    )}
                    <form onSubmit={handleSend} className="flex items-center gap-2.5">
                      <input
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        maxLength={1000}
                        placeholder={`Tulis pesan untuk ${activePartner.display_name}...`}
                        className="flex-1 rounded-full border border-white/10 bg-black/50 px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-white/35 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={sending || !draft.trim()}
                        className="rounded-full bg-white px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-zinc-200 disabled:opacity-40"
                      >
                        {sending ? "..." : "Kirim"}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-lg text-zinc-400">
                    ✉
                  </div>
                  <p className="mt-4 text-sm font-light text-zinc-300">Pilih percakapan untuk mulai mengobrol</p>
                  <p className="mt-1 max-w-sm text-[11px] text-zinc-600">
                    Kamu juga dapat mengirim pesan langsung melalui tombol &ldquo;Kirim Pesan&rdquo; pada halaman profil kreator.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
