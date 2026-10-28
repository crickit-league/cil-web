import { teamHue, teamInitials } from "@/lib/team-badge";

/**
 * A round team crest made from the team's initials on its own colour, like the
 * badges on the big T20 league sites. Teams have no logos, so this stands in; a
 * team always gets the same colour.
 */
export function TeamBadge({ name, size = 32 }: { name: string; size?: number }) {
  const hue = teamHue(name);
  return (
    <span
      aria-hidden="true"
      className="font-display inline-grid flex-none place-items-center rounded-full leading-none font-extrabold text-white shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.28)]"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        background: `linear-gradient(145deg, hsl(${hue} 80% 48%), hsl(${(hue + 24) % 360} 85% 26%))`,
      }}
    >
      {teamInitials(name)}
    </span>
  );
}
