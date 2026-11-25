"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const MONTHS_SHORT_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const DAYS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function pad2(n) {
  return String(n).padStart(2, "0");
}

function parseDateTimeLocal(val) {
  if (!val || typeof val !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(val.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (month < 0 || month > 11 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  return { year, month, day, hour, minute };
}

function formatDateTimeValue({ year, month, day, hour, minute }) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}`;
}

function formatDisplayLabel(parsed) {
  if (!parsed) return "";
  return `${parsed.day} ${MONTHS_SHORT_ID[parsed.month]} ${parsed.year} · ${pad2(parsed.hour)}:${pad2(parsed.minute)}`;
}

function buildCalendarCells(viewYear, viewMonth) {
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const cells = [];

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const prevDate = new Date(viewYear, viewMonth - 1, d);
    cells.push({
      year: prevDate.getFullYear(),
      month: prevDate.getMonth(),
      day: d,
      inCurrentMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      year: viewYear,
      month: viewMonth,
      day: d,
      inCurrentMonth: true,
    });
  }

  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const nextDate = new Date(viewYear, viewMonth + 1, d);
    cells.push({
      year: nextDate.getFullYear(),
      month: nextDate.getMonth(),
      day: d,
      inCurrentMonth: false,
    });
  }

  return cells;
}

export default function LuxDateTimePicker({
  name,
  defaultValue = "",
  required = false,
  placeholder = "Pilih tanggal & jam...",
}) {
  const [value, setValue] = useState(defaultValue || "");
  const [open, setOpen] = useState(false);

  const initialView = useMemo(() => {
    const parsed = parseDateTimeLocal(defaultValue);
    if (parsed) return { year: parsed.year, month: parsed.month };
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }, [defaultValue]);

  const [viewYear, setViewYear] = useState(initialView.year);
  const [viewMonth, setViewMonth] = useState(initialView.month);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 344 });

  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const hourListRef = useRef(null);
  const minuteListRef = useRef(null);

  const parsed = useMemo(() => parseDateTimeLocal(value), [value]);
  const cells = useMemo(() => buildCalendarCells(viewYear, viewMonth), [viewYear, viewMonth]);

  const todayInfo = useMemo(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  }, []);

  const computeCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const popWidth = Math.min(348, vw - 24);
    const popHeight = 336;

    let left = rect.left;
    if (left + popWidth > vw - 12) {
      left = vw - popWidth - 12;
    }
    if (left < 12) left = 12;

    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;
    let top;
    if (spaceBelow >= popHeight + 12 || spaceBelow >= spaceAbove) {
      top = Math.min(rect.bottom + 8, vh - popHeight - 12);
    } else {
      top = Math.max(12, rect.top - popHeight - 8);
    }

    setCoords({ top, left, width: popWidth });
  }, []);

  const handleToggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const target = parsed || { year: todayInfo.year, month: todayInfo.month };
    setViewYear(target.year);
    setViewMonth(target.month);
    computeCoords();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    const handleReposition = () => computeCoords();
    const handleOutsideMouseDown = (e) => {
      if (
        triggerRef.current?.contains(e.target) ||
        popoverRef.current?.contains(e.target)
      ) {
        return;
      }
      setOpen(false);
    };
    const handleEscapeCapture = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        setOpen(false);
      }
    };

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    document.addEventListener("mousedown", handleOutsideMouseDown);
    window.addEventListener("keydown", handleEscapeCapture, true);

    // Scroll active hour/minute into center view once rendered
    const frame = requestAnimationFrame(() => {
      const activeHourEl = hourListRef.current?.querySelector('[data-active="true"]');
      const activeMinEl = minuteListRef.current?.querySelector('[data-active="true"]');
      activeHourEl?.scrollIntoView({ block: "center" });
      activeMinEl?.scrollIntoView({ block: "center" });
    });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
      document.removeEventListener("mousedown", handleOutsideMouseDown);
      window.removeEventListener("keydown", handleEscapeCapture, true);
    };
  }, [open, computeCoords]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (cell) => {
    const now = new Date();
    const hour = parsed ? parsed.hour : now.getHours();
    const minute = parsed ? parsed.minute : now.getMinutes();
    setValue(formatDateTimeValue({ year: cell.year, month: cell.month, day: cell.day, hour, minute }));
    if (!cell.inCurrentMonth) {
      setViewYear(cell.year);
      setViewMonth(cell.month);
    }
  };

  const handleSelectHour = (h) => {
    const base = parsed || {
      year: todayInfo.year,
      month: todayInfo.month,
      day: todayInfo.day,
      hour: h,
      minute: 0,
    };
    setValue(formatDateTimeValue({ ...base, hour: h }));
  };

  const handleSelectMinute = (m) => {
    const now = new Date();
    const base = parsed || {
      year: todayInfo.year,
      month: todayInfo.month,
      day: todayInfo.day,
      hour: now.getHours(),
      minute: m,
    };
    setValue(formatDateTimeValue({ ...base, minute: m }));
  };

  const handleSelectNow = () => {
    const now = new Date();
    const next = {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
      hour: now.getHours(),
      minute: now.getMinutes(),
    };
    setValue(formatDateTimeValue(next));
    setViewYear(next.year);
    setViewMonth(next.month);
  };

  const handleClear = () => {
    setValue("");
  };

  const selectedHour = parsed ? parsed.hour : null;
  const selectedMinute = parsed ? parsed.minute : null;

  return (
    <div className="relative">
      <input
        type="text"
        name={name}
        value={value}
        required={required}
        onChange={() => {}}
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-0 w-full opacity-0"
      />

      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        className={`input-lux flex cursor-pointer items-center justify-between gap-2 text-left ${
          open ? "border-champagne-300/60 shadow-[0_0_0_4px_rgba(212,175,106,0.12)]" : ""
        }`}
      >
        <span className={`truncate ${parsed ? "text-white" : "text-[#7a7a85]"}`}>
          {parsed ? formatDisplayLabel(parsed) : placeholder}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 shrink-0 transition ${open ? "text-champagne-200" : "text-champagne-300/75"}`}
        >
          <rect x="3" y="4" width="18" height="18" rx="2.5" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            data-lenis-prevent
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ top: coords.top, left: coords.left, width: coords.width }}
            className="fixed z-[220] overflow-hidden rounded-2xl border border-champagne-300/25 bg-[#101014]/98 shadow-[0_24px_70px_-12px_rgba(0,0,0,0.95),0_0_0_1px_rgba(212,175,106,0.1),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl"
          >
            <div className="flex">
              {/* KALENDER */}
              <div className="flex-1 p-3.5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    aria-label="Bulan sebelumnya"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-xs text-zinc-300 transition hover:border-champagne-300/45 hover:text-champagne-200"
                  >
                    ‹
                  </button>
                  <p className="font-display text-lg tracking-wide text-white">
                    {MONTHS_ID[viewMonth]} <span className="text-champagne-200">{viewYear}</span>
                  </p>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    aria-label="Bulan berikutnya"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-xs text-zinc-300 transition hover:border-champagne-300/45 hover:text-champagne-200"
                  >
                    ›
                  </button>
                </div>

                <div className="mb-1.5 grid grid-cols-7 text-center">
                  {DAYS_ID.map((d) => (
                    <span key={d} className="text-[9px] font-medium uppercase tracking-wider text-zinc-500">
                      {d}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-0.5">
                  {cells.map((cell) => {
                    const isSelected =
                      parsed &&
                      parsed.year === cell.year &&
                      parsed.month === cell.month &&
                      parsed.day === cell.day;
                    const isToday =
                      todayInfo.year === cell.year &&
                      todayInfo.month === cell.month &&
                      todayInfo.day === cell.day;

                    return (
                      <button
                        key={`${cell.year}-${cell.month}-${cell.day}`}
                        type="button"
                        onClick={() => handleSelectDay(cell)}
                        className={`flex h-7 w-full items-center justify-center rounded-lg text-[11px] transition ${
                          isSelected
                            ? "bg-gradient-to-br from-champagne-200 via-champagne-400 to-champagne-500 font-semibold text-black shadow-[0_0_14px_rgba(212,175,106,0.45)]"
                            : isToday
                              ? "border border-champagne-300/50 bg-champagne-400/10 font-medium text-champagne-200 hover:bg-champagne-400/20"
                              : cell.inCurrentMonth
                                ? "text-zinc-200 hover:bg-white/[0.07] hover:text-white"
                                : "text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-400"
                        }`}
                      >
                        {cell.day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PEMILIH JAM & MENIT */}
              <div className="flex w-[104px] shrink-0 flex-col border-l border-white/[0.08] bg-black/25 p-2.5">
                <div className="mb-2 grid grid-cols-2 text-center text-[9px] font-medium uppercase tracking-widest text-zinc-500">
                  <span>Jam</span>
                  <span>Mnt</span>
                </div>
                <div className="grid h-[212px] grid-cols-2 gap-1">
                  <div
                    ref={hourListRef}
                    data-lenis-prevent
                    className="h-full space-y-0.5 overflow-y-auto pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {HOURS.map((h) => {
                      const active = selectedHour === h;
                      return (
                        <button
                          key={h}
                          type="button"
                          data-active={active ? "true" : undefined}
                          onClick={() => handleSelectHour(h)}
                          className={`flex h-7 w-full items-center justify-center rounded-md text-[11px] tabular-nums transition ${
                            active
                              ? "bg-gradient-to-br from-champagne-200 to-champagne-500 font-semibold text-black shadow-[0_0_12px_rgba(212,175,106,0.4)]"
                              : "text-zinc-300 hover:bg-white/[0.07] hover:text-white"
                          }`}
                        >
                          {pad2(h)}
                        </button>
                      );
                    })}
                  </div>

                  <div
                    ref={minuteListRef}
                    data-lenis-prevent
                    className="h-full space-y-0.5 overflow-y-auto pl-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {MINUTES.map((m) => {
                      const active = selectedMinute === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          data-active={active ? "true" : undefined}
                          onClick={() => handleSelectMinute(m)}
                          className={`flex h-7 w-full items-center justify-center rounded-md text-[11px] tabular-nums transition ${
                            active
                              ? "bg-gradient-to-br from-champagne-200 to-champagne-500 font-semibold text-black shadow-[0_0_12px_rgba(212,175,106,0.4)]"
                              : "text-zinc-300 hover:bg-white/[0.07] hover:text-white"
                          }`}
                        >
                          {pad2(m)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER AKSI CEPAT */}
            <div className="flex items-center justify-between border-t border-white/[0.08] bg-black/35 px-3.5 py-2.5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 transition hover:text-red-300"
                >
                  Hapus
                </button>
                <button
                  type="button"
                  onClick={handleSelectNow}
                  className="text-[10px] uppercase tracking-[0.14em] text-champagne-200 transition hover:text-champagne-100"
                >
                  Sekarang
                </button>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-champagne-300/40 bg-champagne-400/15 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-champagne-100 transition hover:bg-champagne-300 hover:text-black"
              >
                Selesai
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
