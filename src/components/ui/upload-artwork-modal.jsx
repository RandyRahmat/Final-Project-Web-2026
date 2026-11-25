"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";
import { createArtworkAction } from "@/actions/artwork-actions";

export function openUploadModal() {
  window.dispatchEvent(new Event("aesthe:open-upload"));
}

export default function UploadArtworkModal() {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [uploadPreview, setUploadPreview] = useState("");

  const closeModal = useCallback(() => {
    setOpen(false);
    setUploadPreview("");
  }, []);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
    };
    window.addEventListener("aesthe:open-upload", onOpen);
    return () => window.removeEventListener("aesthe:open-upload", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    const controller = new AbortController();
    fetch("/api/categories", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { categories: [] }))
      .then((data) => {
        if (!controller.signal.aborted) {
          setCategories(data.categories || []);
          setLoadingCats(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadingCats(false);
      });

    return () => {
      controller.abort();
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeModal]);

  const handleArtworkFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setUploadPreview("");
      return;
    }
    setUploadPreview(URL.createObjectURL(file));
  };

  const [uploadState, uploadFormAction, isUploading] = useActionState(async (prevState, formData) => {
    const res = await createArtworkAction(prevState, formData);
    if (res?.success) {
      closeModal();
      toast.success("Karya berhasil dipublikasikan", "Karyamu kini tampil di galeri Aesthe.");
      router.refresh();
    } else if (res?.error) {
      toast.error("Gagal mengunggah karya", res.error);
    }
    return res;
  }, null);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-artwork-title"
      className="modal-overlay fixed inset-0 z-[155] flex items-center justify-center bg-black/80 p-5 backdrop-blur-md"
      onClick={closeModal}
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
            onClick={closeModal}
            aria-label="Tutup modal upload"
            className="text-xl text-zinc-500 transition hover:text-white"
          >
            ×
          </button>
        </div>

        {uploadState?.error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs text-red-300">
            {uploadState.error}
          </div>
        )}

        <form action={uploadFormAction} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Judul Karya</label>
            <input
              type="text"
              name="title"
              required
              placeholder="Contoh: Midnight Horizon"
              className="input-lux"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Kategori</label>
            <select
              name="categoryId"
              required
              disabled={loadingCats && categories.length === 0}
              className="input-lux bg-zinc-950"
            >
              {categories.length === 0 ? (
                <option value="">Memuat kategori...</option>
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
            <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">
              File Gambar Karya (JPG/PNG/WEBP/GIF, maks. 8MB)
            </label>
            <input
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
            <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">
              Tags (Pisahkan dengan koma, min. 1)
            </label>
            <input
              type="text"
              name="tags"
              required
              placeholder="ilustrasi, cyberpunk, digital"
              className="input-lux"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Deskripsi Karya</label>
            <textarea
              name="description"
              rows={3}
              required
              placeholder="Ceritakan konsep di balik karyamu..."
              className="input-lux"
            />
          </div>

          <button
            type="submit"
            disabled={isUploading || categories.length === 0}
            className="btn-gold mt-2 w-full rounded-xl py-3 text-[10px] tracking-[0.2em]"
          >
            {isUploading ? "MENYIMPAN KARYA..." : "PUBLISH ARTWORK"}
          </button>
        </form>
      </div>
    </div>
  );
}
