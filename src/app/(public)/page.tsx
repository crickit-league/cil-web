import { SeamDivider } from "@/components/seam-divider";
import { Hero } from "@/components/sections/hero";
import { Format } from "@/components/sections/format";
import { Sponsors } from "@/components/sections/sponsors";
import { Contact } from "@/components/sections/contact";
import { Photos } from "@/components/sections/photos";

// The photo carousel reads the DB; refresh at most once a minute (admin changes
// also revalidate this path on demand).
export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <SeamDivider />
      <Hero />
      <SeamDivider />
      <Photos />
      <Format />
      <SeamDivider />
      <Sponsors />
      <Contact />
    </>
  );
}
