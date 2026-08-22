import { useId } from "react";

// A row of cricket-ball-seam stitches, used as the section divider
// throughout the site instead of a plain rule.
export function SeamDivider() {
  const patternId = useId();

  return (
    <svg
      className="text-line h-[22px] w-full"
      viewBox="0 0 240 20"
      preserveAspectRatio="none"
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <pattern id={patternId} width="24" height="20" patternUnits="userSpaceOnUse">
          <line x1="12" y1="3" x2="7" y2="10" stroke="currentColor" strokeWidth="1.6" />
          <line x1="12" y1="3" x2="17" y2="10" stroke="currentColor" strokeWidth="1.6" />
          <line x1="12" y1="17" x2="7" y2="10" stroke="currentColor" strokeWidth="1.6" />
          <line x1="12" y1="17" x2="17" y2="10" stroke="currentColor" strokeWidth="1.6" />
        </pattern>
      </defs>
      <rect width="240" height="20" fill={`url(#${patternId})`} />
    </svg>
  );
}
