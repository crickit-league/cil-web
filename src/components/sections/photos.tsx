import { listHomePhotos } from "@/lib/services/photos";
import { SeamDivider } from "@/components/seam-divider";
import { PhotoCarousel } from "./photo-carousel";

/**
 * Homepage photo carousel. Renders nothing (divider included) when there are
 * no photos, or when R2 isn't configured — the page never depends on it.
 */
export async function Photos() {
  const photos = await listHomePhotos();
  if (photos.length === 0) return null;

  return (
    <>
      <PhotoCarousel photos={photos} />
      <SeamDivider />
    </>
  );
}
