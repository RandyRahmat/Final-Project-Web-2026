"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";
import { useBodyScrollLock } from "@/lib/body-scroll-lock";
import { createArtworkAction } from "@/actions/artwork-actions";

const MAX_ARTWORK_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function openUploadModal() {
  window.dispatchEvent(new Event("aesthe:open-upload"));
}

function UploadArtworkDialog({ onClose }) {
  const router = useRouter();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [catError, setCatError] = useState(false);
  const [catRetryTick, setCatRetryTick] = useState(0);
  const [uploadPreview, setUploadPreview] = useState("");
  const [clientFileError, setClientFileError] = useState("");
  const previewUrlRef = useRef("");

  useBodyScrollLock(true);

  const clearPreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
    setUploadPreview("");
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = "";
      }
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/categories", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setCategories(data.categories || []);
          setCatError(false);
          setLoadingCats(false);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted && err?.name !== "AbortError") {
          setCatError(true);
          setLoadingCats(false);
        }
      });

    return () => controller.abort();
  }, [catRetryTick]);

  const handleRetryCategories = () => {
    setLoadingCats(true);
    setCatError(false);
    setCatRetryTick((t) => t + 1);
  };

  const handleArtworkFileChange = (e) => {
    const file = e.target.files?.[0];
    setClientFileError("");
    clearPreview();

    if (!file) return;

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      const msg = "Format gambar harus JPG, PNG, WEBP, atau GIF.";
      setClientFileError(msg);
      toast.error("Format file tidak didukung", msg);
      e.target.value = "";
      return;
    }

    if (file.size > MAX_ARTWORK_BYTES) {
      const msg = "Ukuran file gambar maksimal 8 MB.";
      setClientFileError(msg);
      toast.error("File terlalu besar", msg);
      e.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setUploadPreview(objectUrl);
  };

  const [uploadState, uploadFormAction, isUploading] = useActionState(async (prevState, formData) => {
    const file = formData.get("imageFile");
    if (file && typeof file === "object" && file.size > MAX_ARTWORK_BYTES) {
      const msg = "Ukuran file gambar maksimal 8 MB.";
      toast.error("Gagal mengunggah karya", msg);
      return { error: msg };
    }

    try {
      const res = await createArtworkAction(prevState, formData);
      if (res?.success) {
        clearPreview();
        onClose();
        toast.success("Karya berhasil dipublikasikan", "Karyamu kini tampil di galeri Aesthe.");
        router.refresh();
      } else if (res?.error) {
        toast.error("Gagal mengunggah karya", res.error);
      }
      return res;
    } catch {
      const msg = "Gagal mengunggah karya. Pastikan ukuran file ≤ 8 MB dan koneksi internetmu stabil.";
      toast.error("Gagal mengunggah karya", msg);
      return { error: msg };
    }
  }, null);

  const handleAttemptClose = useCallback(() => {
    if (isUploading) return;
    clearPreview();
    onClose();
  }, [isUploading, clearPreview, onClose]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleAttemptClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleAttemptClose]);

  const displayError = clientFileError || uploadState?.error;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-artwork-title"
      className="modal-overlay fixed inset-0 z-[155] flex items-center justify-center bg-black/80 p-5 backdrop-blur-md"
      onClick={handleAttemptClose}
    >
      <div
        data-lenis-prevent
        onClick={(e) => e.stopPropagation()}
        className="modal-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl p-7 text-zinc-100 sm:p-9"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">CREATOR STUDIO</p>
            <h2 id="upload-artwork-title" className="font-display mt-2 text-3xl text-white">
              Upload Artwork<span className="text-champagne-400">.</span>
            </h2>
          </div>
          <button
            type="button"
            disabled={isUploading}
            onClick={handleAttemptClose}
            aria-label="Tutup modal upload"
            className="text-xl text-zinc-500 transition hover:text-white disabled:opacity-40"
          >
            ×
          </button>
        </div>

        {displayError && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs text-red-300">
            {displayError}
          </div>
        )}

        <form action={uploadFormAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="upload-title" className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">
              Judul Karya
            </label>
            <input
              id="upload-title"
              type="text"
              name="title"
              required
              maxLength={150}
              placeholder="Contoh: Midnight Horizon"
              className="input-lux"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="upload-category" className="block text-[10px] uppercase tracking-wider text-zinc-400">
                Kategori
              </label>
              {catError && (
                <button
                  type="button"
                  onClick={handleRetryCategories}
                  className="text-[10px] font-medium text-champagne-300 underline underline-offset-2 hover:text-champagne-100"
                >
                  Coba Muat Ulang ↺
                </button>
              )}
            </div>
            <select
              id="upload-category"
              name="categoryId"
              required
              disabled={loadingCats || categories.length === 0}
              className="input-lux bg-zinc-950"
            >
              {loadingCats ? (
                <option value="">Memuat kategori...</option>
              ) : catError || categories.length === 0 ? (
                <option value="">Gagal memuat kategori — klik Coba Muat Ulang</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label htmlFor="upload-file" className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">
              File Gambar Karya (JPG/PNG/WEBP/GIF, maks. 8MB)
            </label>
            <input
              id="upload-file"
              type="file"
              name="imageFile"
              accept="image/jpeg,image/png,image/webp,image/gif"
              required
              onChange={handleArtworkFileChange}
              className="input-lux file:mr-3 file:rounded-md file:border-0 file:bg-champagne-200 file:px-3 file:py-1 file:text-[10px] file:font-semibold file:text-black"
            />
            {uploadPreview && (
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                <img src={uploadPreview} alt="Preview karya" className="max-h-48 w-full object-contain" />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="upload-tags" className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">
              Tags (Pisahkan dengan koma, min. 1)
            </label>
            <input
              id="upload-tags"
              type="text"
              name="tags"
              required
              placeholder="ilustrasi, cyberpunk, digital"
              className="input-lux"
            />
          </div>

          <div>
            <label htmlFor="upload-description" className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">
              Deskripsi Karya
            </label>
            <textarea
              id="upload-description"
              name="description"
              rows={3}
              required
              placeholder="Ceritakan konsep di balik karyamu..."
              className="input-lux"
            />
          </div>

          <button
            type="submit"
            disabled={isUploading || loadingCats || categories.length === 0}
            className="btn-gold mt-2 w-full rounded-xl py-3 text-[10px] tracking-[0.2em]"
          >
            {isUploading ? "MENYIMPAN KARYA..." : "PUBLISH ARTWORK"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function UploadArtworkModal() {
  const [open, setOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    const onOpen = () => {
      setSessionKey((k) => k + 1);
      setOpen(true);
    };
    window.addEventListener("aesthe:open-upload", onOpen);
    return () => window.removeEventListener("aesthe:open-upload", onOpen);
  }, []);

  if (!open) return null;

  return <UploadArtworkDialog key={sessionKey} onClose={() => setOpen(false)} />;
}
