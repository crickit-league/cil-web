import { SeamDivider } from "@/components/seam-divider";
import { Hero } from "@/components/sections/hero";
import { Format } from "@/components/sections/format";
import { Contact } from "@/components/sections/contact";

export default function HomePage() {
  return (
    <>
      <SeamDivider />
      <Hero />
      <SeamDivider />
      <Format />
      <SeamDivider />
      <Contact />
    </>
  );
}
