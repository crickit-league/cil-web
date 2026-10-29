import Image from "next/image";

export function CrestBadge({ size = 42 }: { size?: number }) {
  return (
    <span
      className="bg-dugout ring-clay/70 relative block flex-none overflow-hidden rounded-full shadow-[0_0_18px_-4px_color-mix(in_srgb,var(--clay)_70%,transparent)] ring-2"
      style={{ width: size, height: size }}
    >
      <Image
        src="/img/logo1.jpeg"
        alt="Crick-It Inter League crest"
        fill
        sizes={`${size}px`}
        className="scale-110 object-cover"
      />
    </span>
  );
}
