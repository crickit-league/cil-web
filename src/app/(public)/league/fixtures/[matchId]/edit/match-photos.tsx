"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { deletePhotoAction, uploadPhotoAction } from "@/app/(admin)/admin/photos/actions";
import { resizeImage } from "@/app/(admin)/admin/photos/resize-image";

export type MatchPhoto = {
  id: string;
  url: string | null;
  caption: string | null;
  title: string | null;
  width: number;
  height: number;
};

type QueuedPicture = {
  key: string;
  file: File;
  preview: string;
  title: string;
  body: string;
  status: "pending" | "uploading" | "error";
  error?: string;
};

const inputClass =
  "border-line bg-pitch text-chalk placeholder:text-chalk-faint focus:border-clay w-full min-w-0 border px-3 py-2 text-sm outline-none disabled:opacity-60";
const labelClass = "font-data text-chalk-dim text-[0.68rem] tracking-[0.1em] uppercase";
const primaryButton =
  "font-data border-clay bg-clay text-on-accent hover:border-clay-bright hover:bg-clay-bright border px-5 py-3 text-xs tracking-[0.08em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton =
  "font-data border-line text-chalk-dim hover:border-clay hover:text-chalk border px-5 py-3 text-xs tracking-[0.08em] uppercase transition-colors disabled:opacity-60";

/**
 * The pictures linked to one match: the ones already there (with Remove), and
 * "Add pictures", which opens a dialog to give each new picture a title and a
 * description before it uploads. Pictures are shrunk in the browser and uploaded
 * one at a time. Photos linked here also show in the home page carousel.
 */
export function MatchPhotos({ matchId, photos }: { matchId: string; photos: MatchPhoto[] }) {
  const router = useRouter();
  const pickerRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [queue, setQueue] = useState<QueuedPicture[]>([]);
  const [busy, setBusy] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // Free the preview URLs when the queue is replaced or the component goes away.
  const previews = useRef<string[]>([]);
  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const closeDialog = () => {
    dialogRef.current?.close();
    setQueue([]);
    if (pickerRef.current) pickerRef.current.value = "";
  };

  const onPick = (picked: FileList | null) => {
    const files = Array.from(picked ?? []);
    if (files.length === 0) return;
    const next = files.map((file) => {
      const preview = URL.createObjectURL(file);
      previews.current.push(preview);
      return {
        key: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        file,
        preview,
        title: "",
        body: "",
        status: "pending" as const,
      };
    });
    setQueue(next);
    dialogRef.current?.showModal();
  };

  const patch = (key: string, change: Partial<QueuedPicture>) =>
    setQueue((prev) => prev.map((item) => (item.key === key ? { ...item, ...change } : item)));

  const uploadAll = async () => {
    setBusy(true);
    let failed = 0;
    // Newest photo shows first, so upload in reverse: the first picture in the list ends up first.
    for (const item of [...queue].reverse()) {
      patch(item.key, { status: "uploading", error: undefined });
      try {
        const { blob, width, height } = await resizeImage(item.file);
        const form = new FormData();
        form.set("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
        form.set("width", String(width));
        form.set("height", String(height));
        form.set("caption", "");
        form.set("title", item.title);
        form.set("body", item.body);
        form.set("matchId", matchId);
        const result = await uploadPhotoAction(form);
        if (result.ok) {
          setQueue((prev) => prev.filter((q) => q.key !== item.key));
        } else {
          failed += 1;
          patch(item.key, { status: "error", error: result.message });
        }
      } catch (error) {
        failed += 1;
        patch(item.key, {
          status: "error",
          error: error instanceof Error ? error.message : "Upload failed.",
        });
      }
    }
    setBusy(false);
    router.refresh();
    // Close once everything went up; otherwise the failed pictures stay listed with their errors.
    if (failed === 0) closeDialog();
  };

  const remove = async (photo: MatchPhoto) => {
    if (!window.confirm("Remove this picture?")) return;
    setBusy(true);
    setRemoveError(null);
    const result = await deletePhotoAction(photo.id);
    setBusy(false);
    if (!result.ok) setRemoveError(result.message);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={pickerRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          id="match-photo-picker"
          onChange={(event) => onPick(event.target.files)}
        />
        <label htmlFor="match-photo-picker" className={`${primaryButton} cursor-pointer`}>
          Add pictures
        </label>
        <span className="text-chalk-faint text-xs">
          You&apos;ll add a title and description for each picture before it uploads.
        </span>
      </div>
      {removeError ? (
        <p role="alert" className="text-clay-bright text-sm">
          {removeError}
        </p>
      ) : null}

      {photos.length > 0 ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {photos.map((photo) => (
            <li key={photo.id} className="border-line bg-dugout flex flex-col border">
              <div className="bg-pitch-deep relative aspect-[4/3]">
                {photo.url ? (
                  <Image
                    src={photo.url}
                    alt={photo.title ?? photo.caption ?? "Match photo"}
                    fill
                    sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 33vw"
                    className="object-cover object-top"
                  />
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                <span className="text-chalk-dim truncate text-xs">{photo.title ?? photo.caption ?? "—"}</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(photo)}
                  className="font-data text-clay-bright shrink-0 text-[0.62rem] tracking-[0.08em] uppercase hover:underline disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-chalk-dim text-sm">No pictures for this match yet.</p>
      )}

      <dialog
        ref={dialogRef}
        aria-label="Add pictures"
        onCancel={(event) => {
          if (busy) event.preventDefault();
          else setQueue([]);
        }}
        className="border-line bg-dugout text-chalk m-auto max-h-[90vh] w-[min(40rem,calc(100vw-2rem))] border p-0 backdrop:bg-black/60"
      >
        <div className="flex max-h-[90vh] flex-col">
          <div className="border-line border-b px-5 py-4">
            <h3 className="font-display text-2xl font-extrabold tracking-wide uppercase">Add pictures</h3>
            <p className="text-chalk-dim mt-1 text-sm">
              Give each picture a title and a description (both optional).
            </p>
          </div>

          <ul className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
            {queue.map((item) => (
              <li key={item.key} className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- a local blob preview, not a hosted image */}
                <img
                  src={item.preview}
                  alt=""
                  className="bg-pitch-deep h-24 w-24 shrink-0 object-cover object-top"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <label className="flex flex-col gap-1">
                    <span className={labelClass}>Title</span>
                    <input
                      value={item.title}
                      onChange={(e) => patch(item.key, { title: e.target.value })}
                      maxLength={50}
                      disabled={busy}
                      placeholder="e.g. Man of the Match: A. Khan"
                      className={inputClass}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={labelClass}>Description</span>
                    <textarea
                      value={item.body}
                      onChange={(e) => patch(item.key, { body: e.target.value })}
                      maxLength={500}
                      rows={2}
                      disabled={busy}
                      className={inputClass}
                    />
                  </label>
                  {item.status === "uploading" ? (
                    <span className="text-chalk-faint text-xs">Uploading…</span>
                  ) : null}
                  {item.status === "error" ? (
                    <span role="alert" className="text-clay-bright text-xs">
                      {item.error}
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={busy}
                  aria-label="Remove this picture from the list"
                  onClick={() => setQueue((prev) => prev.filter((q) => q.key !== item.key))}
                  className="text-chalk-faint hover:text-clay-bright self-start px-1 text-lg leading-none disabled:opacity-60"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <div className="border-line flex flex-wrap gap-3 border-t px-5 py-4">
            <button
              type="button"
              disabled={busy || queue.length === 0}
              onClick={uploadAll}
              className={primaryButton}
            >
              {busy ? "Uploading…" : `Upload ${queue.length} ${queue.length === 1 ? "picture" : "pictures"}`}
            </button>
            <button type="button" disabled={busy} onClick={closeDialog} className={secondaryButton}>
              Cancel
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
