import Image from "next/image";

export function CrestBadge({ size = 42 }: { size?: number }) {
  return (
    <span
      className="bg-dugout ring-line relative block flex-none overflow-hidden rounded-full ring-1"
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
