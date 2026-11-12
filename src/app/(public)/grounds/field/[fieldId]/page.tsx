import { notFound, redirect } from "next/navigation";
import { getGroundIdForField } from "@/lib/services/grounds";

// A fixture knows its field, not its ground: tapping the ground on a match card
// comes here, then on to that ground's details page with the field marked.
export default async function GroundOfFieldPage({ params }: { params: Promise<{ fieldId: string }> }) {
  const { fieldId } = await params;
  const groundId = await getGroundIdForField(fieldId);
  if (!groundId) notFound();
  redirect(`/grounds/${groundId}?field=${encodeURIComponent(fieldId)}`);
}
