"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { deletePhotoAction, updatePhotoDetailsAction, uploadPhotoAction } from "./actions";
import { resizeImage } from "./resize-image";

type AdminPhoto = {
  id: string;
  url: string | null;
  caption: string | null;
  title: string | null;
  body: string | null;
  matchId: string | null;
  width: number;
  height: number;
  uploaded: string;
  uploadedBy: string | null;
};

type MatchOption = { id: string; label: string };

type QueuedFile = {
  key: string;
  file: File;
  preview: string;
  caption: string;
  title: string;
  body: string;
  matchId: string;
  status: "pending" | "uploading" | "error";
  error?: string;
};

const inputClass =
  "border-line text-chalk placeholder:text-chalk-faint focus:border-clay w-full border-0 border-b-[1.5px] bg-transparent px-0.5 py-2 text-sm focus:outline-none";
const primaryButton =
  "font-data border-clay bg-clay text-on-accent hover:border-clay-bright hover:bg-clay-bright border px-5 py-3 text-xs tracking-[0.08em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const selectClass =
  "border-line bg-dugout text-chalk focus:border-clay w-full border px-2 py-2 text-sm focus:outline-none";

/** Title, text and linked match: what turns a photo into a carousel story (e.g. Man of the Match). */
function DetailFields({
  value,
  matches,
  disabled,
  onChange,
  label,
}: {
  value: { title: string; body: string; matchId: string };
  matches: MatchOption[];
  disabled: boolean;
  onChange: (change: Partial<{ title: string; body: string; matchId: string }>) => void;
  label: string;
}) {
  return (
    <>
      <input
        type="text"
        value={value.title}
        maxLength={50}
        disabled={disabled}
        placeholder="Title, e.g. Man of the Match: A. Kumar"
        aria-label={`Title for ${label}`}
        onChange={(event) => onChange({ title: event.target.value })}
        className={inputClass}
      />
      <textarea
        value={value.body}
        maxLength={500}
        rows={2}
        disabled={disabled}
        placeholder="Text (optional), e.g. 3 wickets and 41 off 22"
        aria-label={`Text for ${label}`}
        onChange={(event) => onChange({ body: event.target.value })}
        className={`${inputClass} resize-y`}
      />
      <select
        value={value.matchId}
        disabled={disabled}
        aria-label={`Linked match for ${label}`}
        onChange={(event) => onChange({ matchId: event.target.value })}
        className={selectClass}
      >
        <option value="">No linked match</option>
        {matches.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
    </>
  );
}

export function PhotoManager({
  photos,
  carouselLimit,
  uploadsEnabled,
  matches,
}: {
  photos: AdminPhoto[];
  carouselLimit: number;
  uploadsEnabled: boolean;
  matches: MatchOption[];
}) {
  return (
    <>
      <UploadPanel enabled={uploadsEnabled} matches={matches} />
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-extrabold tracking-wide uppercase">
          Library <span className="text-chalk-dim text-lg">({photos.length})</span>
        </h2>
        {photos.length === 0 ? (
          <p className="text-chalk-dim">No photos yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {photos.map((photo, index) => (
              <PhotoCard key={photo.id} photo={photo} matches={matches} inCarousel={index < carouselLimit} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function UploadPanel({ enabled, matches }: { enabled: boolean; matches: MatchOption[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const previews = useRef<string[]>([]);

  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => {
        const preview = URL.createObjectURL(file);
        previews.current.push(preview);
        return {
          key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
          file,
          preview,
          caption: "",
          title: "",
          body: "",
          matchId: "",
          status: "pending" as const,
        };
      });
    setQueue((prev) => [...prev, ...next]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const patch = (key: string, change: Partial<QueuedFile>) =>
    setQueue((prev) => prev.map((item) => (item.key === key ? { ...item, ...change } : item)));

  const uploadAll = async () => {
    setBusy(true);
    // The carousel is newest-first, so upload in reverse: the first file in the
    // queue is saved last and ends up first in the carousel.
    const todo = [...queue].reverse();
    for (const item of todo) {
      patch(item.key, { status: "uploading", error: undefined });
      try {
        const { blob, width, height } = await resizeImage(item.file);
        const body = new FormData();
        body.set("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
        body.set("width", String(width));
        body.set("height", String(height));
        body.set("caption", item.caption);
        body.set("title", item.title);
        body.set("body", item.body);
        body.set("matchId", item.matchId);
        const result = await uploadPhotoAction(body);
        if (result.ok) {
          setQueue((prev) => prev.filter((q) => q.key !== item.key));
        } else {
          patch(item.key, { status: "error", error: result.message });
        }
      } catch (error) {
        patch(item.key, {
          status: "error",
          error: error instanceof Error ? error.message : "Upload failed.",
        });
      }
    }
    setBusy(false);
    router.refresh();
  };

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-2xl font-extrabold tracking-wide uppercase">Upload</h2>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        disabled={!enabled || busy}
        onChange={(event) => addFiles(event.target.files)}
        className="text-chalk-dim file:font-data file:border-line file:text-chalk file:bg-dugout hover:file:bg-dugout-2 w-full max-w-md text-sm file:mr-4 file:cursor-pointer file:border file:px-4 file:py-3 file:text-xs file:tracking-[0.08em] file:uppercase"
      />

      {queue.length > 0 ? (
        <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {queue.map((item) => (
              <li key={item.key} className="border-line bg-dugout flex flex-col border">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img src={item.preview} alt="" className="aspect-[3/2] w-full object-cover" />
                <div className="flex flex-col gap-2 p-3">
                  <input
                    type="text"
                    value={item.caption}
                    maxLength={140}
                    disabled={busy}
                    placeholder="Caption (optional)"
                    aria-label={`Caption for ${item.file.name}`}
                    onChange={(event) => patch(item.key, { caption: event.target.value })}
                    className={inputClass}
                  />
                  <DetailFields
                    value={item}
                    matches={matches}
                    disabled={busy}
                    label={item.file.name}
                    onChange={(change) => patch(item.key, change)}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-data text-chalk-faint truncate text-[0.66rem] tracking-[0.05em]">
                      {item.status === "uploading" ? "Uploading…" : item.file.name}
                    </span>
                    {!busy ? (
                      <button
                        type="button"
                        onClick={() => setQueue((prev) => prev.filter((q) => q.key !== item.key))}
                        className="font-data text-chalk-dim hover:text-chalk shrink-0 text-xs tracking-[0.08em] uppercase"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  {item.status === "error" ? (
                    <p role="alert" className="text-clay-bright text-sm">
                      {item.error}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          <button type="button" onClick={uploadAll} disabled={busy} className={`${primaryButton} self-start`}>
            {busy ? "Uploading…" : `Upload ${queue.length} photo${queue.length === 1 ? "" : "s"}`}
          </button>
        </>
      ) : (
        <p className="text-chalk-dim text-sm">
          Choose one or more photos. They&apos;re shrunk on your device before uploading.
        </p>
      )}
    </section>
  );
}

function PhotoCard({
  photo,
  matches,
  inCarousel,
}: {
  photo: AdminPhoto;
  matches: MatchOption[];
  inCarousel: boolean;
}) {
  const router = useRouter();
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [details, setDetails] = useState({
    title: photo.title ?? "",
    body: photo.body ?? "",
    matchId: photo.matchId ?? "",
  });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const dirty =
    caption.trim() !== (photo.caption ?? "") ||
    details.title.trim() !== (photo.title ?? "") ||
    details.body.trim() !== (photo.body ?? "") ||
    details.matchId !== (photo.matchId ?? "");

  const run = async (work: () => Promise<{ ok: boolean; message?: string }>, success?: string) => {
    setPending(true);
    setMessage(null);
    const result = await work();
    setPending(false);
    setMessage(result.ok ? (success ?? null) : (result.message ?? "Something went wrong."));
    if (result.ok) router.refresh();
  };

  return (
    <li className="border-line bg-dugout flex flex-col border">
      <div className="bg-pitch-deep relative aspect-[3/2]">
        {photo.url ? (
          <Image
            src={photo.url}
            alt={photo.caption ?? "Match photo"}
            fill
            sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
            className="object-cover"
          />
        ) : null}
        <span
          className={`font-data absolute top-2 left-2 px-2 py-1 text-[0.62rem] tracking-[0.1em] uppercase ${
            inCarousel ? "bg-clay text-on-accent" : "bg-pitch-deep/80 text-chalk-dim"
          }`}
        >
          {inCarousel ? "On homepage" : "Archived"}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-3">
        <input
          type="text"
          value={caption}
          maxLength={140}
          disabled={pending}
          placeholder="Caption (optional)"
          aria-label="Caption"
          onChange={(event) => setCaption(event.target.value)}
          className={inputClass}
        />
        <DetailFields
          value={details}
          matches={matches}
          disabled={pending}
          label="this photo"
          onChange={(change) => setDetails((prev) => ({ ...prev, ...change }))}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="font-data text-chalk-faint text-[0.66rem] tracking-[0.05em] uppercase">
            {photo.uploaded}
            {photo.uploadedBy ? ` · ${photo.uploadedBy}` : ""}
          </span>
          <div className="flex shrink-0 items-center gap-4">
            {dirty ? (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(() => updatePhotoDetailsAction(photo.id, { caption, ...details }), "Saved.")
                }
                className="font-data text-clay hover:text-clay-bright text-xs tracking-[0.08em] uppercase"
              >
                Save
              </button>
            ) : null}
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (window.confirm("Delete this photo? This can't be undone.")) {
                  void run(() => deletePhotoAction(photo.id));
                }
              }}
              className="font-data text-clay-bright text-xs tracking-[0.08em] uppercase underline-offset-2 hover:underline"
            >
              Delete
            </button>
          </div>
        </div>
        {message ? (
          <p role="status" className="text-chalk-dim text-sm">
            {message}
          </p>
        ) : null}
      </div>
    </li>
  );
}
