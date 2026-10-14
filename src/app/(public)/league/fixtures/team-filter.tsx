"use client";

import { useRouter } from "next/navigation";

export function TeamFilter({
  teams,
  selected,
}: {
  teams: { id: string; name: string }[];
  selected: string | null;
}) {
  const router = useRouter();

  return (
    <label className="flex flex-col gap-1.5 sm:max-w-xs">
      <span className="font-data text-chalk-dim text-[0.68rem] tracking-[0.1em] uppercase">
        Show matches for
      </span>
      <select
        value={selected ?? ""}
        onChange={(e) =>
          router.push(e.target.value ? `/league/fixtures?team=${e.target.value}` : "/league/fixtures")
        }
        className="border-line bg-dugout text-chalk focus:border-clay w-full border px-3 py-2.5 text-sm outline-none"
      >
        <option value="">All teams</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  );
}
