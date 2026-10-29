import { auth } from "@/lib/auth";
import { HOME_CAROUSEL_PHOTO_LIMIT, listPhotoMatchOptions, listPhotosForAdmin } from "@/lib/services/photos";
import { isStorageConfigured } from "@/lib/storage/r2";
import { PhotoManager } from "./photo-manager";

export default async function PhotosPage() {
  const session = await auth();
  const [photos, matches] = await Promise.all([
    listPhotosForAdmin(session!.user),
    listPhotoMatchOptions(session!.user),
  ]);

  return (
    <section className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">Photos</h1>
        <p className="text-chalk-dim mt-1 text-sm">
          The {HOME_CAROUSEL_PHOTO_LIMIT} most recently uploaded photos appear in the homepage carousel,
          newest first. Older photos stay here but drop off the carousel. Give a photo a title, some text and
          a linked match (for example a Man of the Match shot) and the carousel shows them with it.
        </p>
      </div>

      {isStorageConfigured() ? null : (
        <p role="alert" className="border-clay text-clay-bright border p-4 text-sm">
          Photo storage (Cloudflare R2) isn&apos;t configured yet, so uploads are disabled. See{" "}
          <code className="font-data">docs/service-setup.md</code>.
        </p>
      )}

      <PhotoManager
        carouselLimit={HOME_CAROUSEL_PHOTO_LIMIT}
        uploadsEnabled={isStorageConfigured()}
        matches={matches}
        photos={photos.map((p) => ({
          id: p.id,
          url: p.url,
          caption: p.caption,
          title: p.title,
          body: p.body,
          matchId: p.matchId,
          width: p.width,
          height: p.height,
          uploaded: p.createdAt.toLocaleDateString(),
          uploadedBy: p.uploadedBy,
        }))}
      />
    </section>
  );
}
