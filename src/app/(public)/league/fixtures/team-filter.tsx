"use client";

import { useRouter } from "next/navigation";

type Team = { id: string; name: string };

const selectClass =
  "border-line bg-dugout text-chalk focus:border-clay w-full border px-3 py-2.5 text-sm outline-none";

function TeamSelect({
  label,
  allLabel,
  teams,
  value,
  onChange,
}: {
  label: string;
  allLabel: string;
  teams: Team[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 sm:w-64">
      <span className="font-data text-chalk-dim text-[0.68rem] tracking-[0.1em] uppercase">{label}</span>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        <option value="">{allLabel}</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Two independent filters that combine: a team's own matches, and the matches a team umpires. */
export function TeamFilter({
  teams,
  selected,
  selectedUmpiring,
}: {
  teams: Team[];
  selected: string | null;
  selectedUmpiring: string | null;
}) {
  const router = useRouter();

  const go = (next: { team: string | null; umpire: string | null }) => {
    const params = new URLSearchParams();
    if (next.team) params.set("team", next.team);
    if (next.umpire) params.set("umpire", next.umpire);
    const query = params.toString();
    router.push(query ? `/league/fixtures?${query}` : "/league/fixtures");
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
      <TeamSelect
        label="Show matches for"
        allLabel="All teams"
        teams={teams}
        value={selected}
        onChange={(id) => go({ team: id || null, umpire: selectedUmpiring })}
      />
      <TeamSelect
        label="Umpiring team"
        allLabel="All umpiring teams"
        teams={teams}
        value={selectedUmpiring}
        onChange={(id) => go({ team: selected, umpire: id || null })}
      />
    </div>
  );
}
