"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AppSidebar from "@/components/app-sidebar";
import { useSidebarCollapsed } from "@/lib/use-sidebar-collapsed";
import { markConversationReadAction, sendMessageAction } from "@/actions/message-actions";

function formatTime(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function mergeMessages(prev, incoming) {
  const byId = new Map();
  for (const item of prev || []) {
    if (item && item.id != null) byId.set(item.id, item);
  }
  for (const item of incoming || []) {
    if (item && item.id != null) byId.set(item.id, item);
  }
  return Array.from(byId.values()).sort((a, b) => {
    const timeDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (timeDiff !== 0) return timeDiff;
    return Number(a.id) - Number(b.id);
  });
}

function mergeConversations(prev, incoming, activePartnerId) {
  if (!Array.isArray(incoming)) return prev;
  const incomingIds = new Set(incoming.map((c) => Number(c.id)));
  const extras = (prev || []).filter((c) => !incomingIds.has(Number(c.id)));
  return [...extras, ...incoming].map((c) =>
    Number(c.id) === Number(activePartnerId) ? { ...c, unread_count: 0 } : c
  );
}

export default function MessagesClient({
  currentUser,
  initialConversations,
  initialPartnerId,
  initialMessages,
  ongoingChallengesCount = 0,
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedPartnerId, setSelectedPartnerId] = useState(initialPartnerId);
  const [messages, setMessages] = useState(initialMessages);
  const [mobileView, setMobileView] = useState(initialPartnerId ? "chat" : "list");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [sidebarCollapsed, toggleSidebarCollapsed] = useSidebarCollapsed();
  const messagesListRef = useRef(null);
  const activePartnerRef = useRef(initialPartnerId);
  const sendingRef = useRef(false);
  const selectAbortRef = useRef(null);

  const activePartner = conversations.find((c) => Number(c.id) === Number(selectedPartnerId)) || null;

  useEffect(() => {
    activePartnerRef.current = selectedPartnerId;
  }, [selectedPartnerId]);

  useEffect(() => {
    return () => {
      selectAbortRef.current?.abort();
    };
  }, []);

  // Tandai percakapan awal sebagai dibaca dari client saat benar-benar dibuka (bukan saat SSR GET/prefetch)
  useEffect(() => {
    if (!initialPartnerId) return;
    let cancelled = false;
    markConversationReadAction(initialPartnerId)
      .then(() => {
        if (!cancelled) {
          setConversations((prev) =>
            prev.map((c) => (Number(c.id) === Number(initialPartnerId) ? { ...c, unread_count: 0 } : c))
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialPartnerId]);

  // Scroll hanya di dalam container pesan (bukan seluruh window browser)
  useEffect(() => {
    const el = messagesListRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, selectedPartnerId, mobileView]);

  // Polling ringan tiap 5 detik untuk pesan masuk baru & pembaruan unread seluruh percakapan
  useEffect(() => {
    if (!selectedPartnerId) return;
    const partnerId = selectedPartnerId;
    let activeController = null;

    const fetchLatest = async () => {
      if (sendingRef.current || Number(activePartnerRef.current) !== Number(partnerId)) return;
      activeController?.abort();
      const controller = new AbortController();
      activeController = controller;

      try {
        const res = await fetch(`/api/messages?with=${partnerId}&includeConversations=1`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        if (controller.signal.aborted || Number(activePartnerRef.current) !== Number(partnerId)) return;

        if (Array.isArray(data.messages)) {
          setMessages((prev) => mergeMessages(prev, data.messages));
        }
        if (Array.isArray(data.conversations)) {
          setConversations((prev) => mergeConversations(prev, data.conversations, partnerId));
        }
      } catch {
        // Abaikan error jaringan sementara saat polling
      }
    };

    const interval = setInterval(fetchLatest, 5000);
    return () => {
      activeController?.abort();
      clearInterval(interval);
    };
  }, [selectedPartnerId]);

  const handleSelectPartner = async (partnerId) => {
    setMobileView("chat");
    if (Number(partnerId) === Number(selectedPartnerId)) return;

    selectAbortRef.current?.abort();
    const controller = new AbortController();
    selectAbortRef.current = controller;

    activePartnerRef.current = partnerId;
    setSelectedPartnerId(partnerId);
    setMessages([]);
    setDraft("");
    setError("");
    setLoadingChat(true);

    try {
      const res = await fetch(`/api/messages?with=${partnerId}&includeConversations=1`, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (controller.signal.aborted || Number(activePartnerRef.current) !== Number(partnerId)) return;

      if (!res.ok) {
        setError("Gagal memuat percakapan. Silakan coba lagi.");
        return;
      }

      const data = await res.json();
      if (controller.signal.aborted || Number(activePartnerRef.current) !== Number(partnerId)) return;

      setMessages(Array.isArray(data.messages) ? data.messages : []);
      if (Array.isArray(data.conversations)) {
        setConversations((prev) => mergeConversations(prev, data.conversations, partnerId));
      } else {
        setConversations((prev) =>
          prev.map((c) => (Number(c.id) === Number(partnerId) ? { ...c, unread_count: 0 } : c))
        );
      }
    } catch (err) {
      if (err?.name !== "AbortError" && Number(activePartnerRef.current) === Number(partnerId)) {
        setError("Gagal memuat percakapan. Periksa koneksi internetmu.");
      }
    } finally {
      if (!controller.signal.aborted && Number(activePartnerRef.current) === Number(partnerId)) {
        setLoadingChat(false);
      }
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const targetPartnerId = selectedPartnerId;
    const textToSend = draft.trim();
    if (!targetPartnerId || !textToSend || sendingRef.current) return;

    sendingRef.current = true;
    setSending(true);
    setError("");

    try {
      const res = await sendMessageAction(targetPartnerId, textToSend);

      if (res?.error) {
        if (Number(activePartnerRef.current) === Number(targetPartnerId)) {
          setError(res.error);
        }
        return;
      }

      if (res?.message) {
        setConversations((prev) => {
          const updated = prev.map((c) =>
            Number(c.id) === Number(targetPartnerId)
              ? { ...c, last_message: res.message.content, last_message_at: res.message.created_at, unread_count: 0 }
              : c
          );
          const targetConv = updated.find((c) => Number(c.id) === Number(targetPartnerId));
          if (!targetConv) return updated;
          return [targetConv, ...updated.filter((c) => Number(c.id) !== Number(targetPartnerId))];
        });

        if (Number(activePartnerRef.current) === Number(targetPartnerId)) {
          setMessages((prev) => mergeMessages(prev, [res.message]));
          setDraft("");
        }
      }
    } catch {
      if (Number(activePartnerRef.current) === Number(targetPartnerId)) {
        setError("Gagal mengirim pesan. Silakan coba lagi.");
      }
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-transparent text-zinc-100">
      <AppSidebar
        currentUser={currentUser}
        activeItem="messages"
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
        mobileMenu={mobileMenu}
        onCloseMobile={() => setMobileMenu(false)}
        challengesCount={ongoingChallengesCount}
      />

      {/* MAIN CONTENT */}
      <div className={`relative z-10 flex min-h-screen flex-col transition-all duration-300 ${sidebarCollapsed ? "lg:ml-[78px]" : "lg:ml-[250px]"}`}>
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.06] bg-[#090909]/80 px-5 backdrop-blur-md sm:px-8 lg:px-12">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setMobileMenu(true)} className="text-xl text-zinc-400 hover:text-white lg:hidden" aria-label="Open menu">
              ☰
            </button>
            <div className="text-[10px] tracking-[0.2em] text-zinc-600">
              INBOX / <span className="text-champagne-200">PRIVATE MESSAGES</span>
            </div>
          </div>
          <Link href="/explore" className="btn-ghost rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.15em]">
            Cari Kreator &rarr;
          </Link>
        </header>

        <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-4 sm:px-8 sm:py-6 lg:px-12">
          <div className="glass grid h-[calc(100dvh-110px)] grid-cols-1 overflow-hidden rounded-3xl border border-white/15 sm:h-[calc(100dvh-132px)] md:grid-cols-12">
            {/* KOLOM KIRI: DAFTAR PERCAKAPAN */}
            <section className={`${mobileView === "chat" && activePartner ? "hidden md:flex" : "flex"} min-h-0 flex-col border-b border-white/[0.08] md:col-span-4 md:border-b-0 md:border-r`}>
              <div className="shrink-0 border-b border-white/[0.06] px-5 py-4">
                <h1 className="font-display text-2xl text-white">Pesan Pribadi</h1>
                <p className="mt-0.5 text-[10px] text-zinc-500">{conversations.length} percakapan</p>
              </div>

              <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <p className="text-xs text-zinc-400">Belum ada percakapan.</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-zinc-600">
                      Kunjungi profil kreator di halaman Explore atau Home lalu klik &ldquo;Kirim Pesan&rdquo;.
                    </p>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const isSelected = Number(conv.id) === Number(selectedPartnerId);
                    return (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => handleSelectPartner(conv.id)}
                        className={`flex w-full items-center gap-3 border-b border-white/[0.05] px-5 py-3.5 text-left transition ${
                          isSelected
                            ? "border-l-2 border-l-champagne-300 bg-champagne-400/[0.12]"
                            : "hover:bg-white/[0.03]"
                        }`}
                      >
                        <div className="shrink-0 rounded-full bg-gradient-to-br from-champagne-200 via-champagne-500 to-champagne-700 p-[1.5px]">
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-xs font-semibold text-white">
                            {conv.avatar_url ? (
                              <img src={conv.avatar_url} alt={conv.display_name} className="h-full w-full object-cover" />
                            ) : (
                              conv.display_name?.charAt(0).toUpperCase() || "U"
                            )}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs font-medium text-white">{conv.display_name}</p>
                            {conv.unread_count > 0 && (
                              <span className="rounded-full bg-champagne-300 px-2 py-0.5 text-[9px] font-bold text-black">
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
            <section className={`${mobileView === "list" && conversations.length > 0 ? "hidden md:flex" : "flex"} min-h-0 flex-col md:col-span-8`}>
              {activePartner ? (
                <>
                  {/* CHAT HEADER */}
                  <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3.5 sm:px-6 sm:py-4">
                    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setMobileView("list")}
                        aria-label="Kembali ke daftar percakapan"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm text-zinc-300 transition hover:border-champagne-300/40 hover:text-white md:hidden"
                      >
                        &larr;
                      </button>

                      <Link href={`/creators/${activePartner.username}`} className="flex min-w-0 items-center gap-3 transition hover:opacity-80">
                        <div className="shrink-0 rounded-full bg-gradient-to-br from-champagne-200 via-champagne-500 to-champagne-700 p-[1.5px]">
                          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-xs font-semibold text-white">
                            {activePartner.avatar_url ? (
                              <img src={activePartner.avatar_url} alt={activePartner.display_name} className="h-full w-full object-cover" />
                            ) : (
                              activePartner.display_name?.charAt(0).toUpperCase() || "U"
                            )}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-white">{activePartner.display_name}</p>
                          <p className="truncate text-[10px] text-champagne-300/80">@{activePartner.username} &bull; {activePartner.role}</p>
                        </div>
                      </Link>
                    </div>

                    <Link href={`/creators/${activePartner.username}`} className="btn-ghost shrink-0 rounded-full px-3 py-1 text-[10px]">
                      Lihat Profil ↗
                    </Link>
                  </div>

                  {/* CHAT MESSAGES LIST */}
                  <div ref={messagesListRef} data-lenis-prevent className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
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
                            <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${isMine ? "rounded-br-sm bg-gradient-to-br from-champagne-100 to-champagne-300 text-black" : "glass rounded-bl-sm text-zinc-100"}`}>
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              <p className={`mt-1 text-right text-[9px] ${isMine ? "text-zinc-700" : "text-zinc-500"}`}>
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* CHAT INPUT */}
                  <div className="shrink-0 border-t border-white/[0.06] p-3.5 sm:p-4">
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
                        className="input-lux flex-1 rounded-full py-2.5"
                      />
                      <button
                        type="submit"
                        disabled={sending || !draft.trim()}
                        className="btn-gold rounded-full px-5 py-2.5 text-[10px] uppercase tracking-[0.18em]"
                      >
                        {sending ? "..." : "Kirim"}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-champagne-300/30 bg-champagne-400/10 text-lg text-champagne-200">
                    ✉
                  </div>
                  <p className="font-display mt-4 text-2xl text-zinc-200">Pilih percakapan untuk mulai mengobrol</p>
                  <p className="mt-1 max-w-sm text-[11px] text-zinc-500">
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
