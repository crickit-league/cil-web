import type { Metadata } from "next";
import { Contact } from "@/components/sections/contact";

export const metadata: Metadata = {
  title: "Contact · CIL Winter League",
  description: "Email the CIL committee about registration, the site, or anything else.",
};

export default function ContactPage() {
  return <Contact />;
}
