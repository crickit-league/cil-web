import { redirect } from "next/navigation";

// Results are shown on the Fixtures page (each played match carries its
// result), so the old Results tab's URL just forwards there.
export default function ResultsPage() {
  redirect("/league/fixtures");
}
