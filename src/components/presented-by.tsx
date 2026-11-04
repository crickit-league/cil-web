import Image from "next/image";
import { titleSponsor } from "@/lib/sponsors";

// The title sponsor's "Presented by" mark, used in the footer. The logo is a white-background JPEG, so it sits
// on a white tile, trimmed a touch to hide the image's own margin.

/** Logo width in px; the tile keeps the logo's aspect ratio. */
const LOGO_WIDTH = { sm: 72, md: 96, lg: 140 } as const;

interface PresentedByProps {
  size?: keyof typeof LOGO_WIDTH;
  /** Text beside the logo. */
  label?: string;
  /** Put the label above the logo instead of beside it. */
  stacked?: boolean;
  className?: string;
}

export function PresentedBy({
  size = "md",
  label = "Presented by",
  stacked = false,
  className = "",
}: PresentedByProps) {
  if (!titleSponsor) return null;
  const width = LOGO_WIDTH[size];

  return (
    <a
      href={titleSponsor.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} ${titleSponsor.name} (opens their website)`}
      className={`inline-flex ${stacked ? "flex-col items-start gap-2" : "items-center gap-3"} ${className}`}
    >
      <span className="font-data text-chalk-dim text-[0.62rem] tracking-[0.16em] uppercase">{label}</span>
      <span className="lift block overflow-hidden rounded bg-white p-1">
        <span className="relative block aspect-[2.45/1] overflow-hidden rounded-sm" style={{ width }}>
          <Image
            src={titleSponsor.logo}
            alt=""
            fill
            sizes={`${width}px`}
            className="scale-[1.08] object-cover"
          />
        </span>
      </span>
    </a>
  );
}
