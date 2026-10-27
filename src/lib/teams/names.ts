import { normalizeName } from "@/lib/import/cricclubs-matches";

// A team's name lives in exactly one place: TeamEntry.displayName (per series,
// sponsor prefix and all). Team.name is the canonical cross-season key and is
// never displayed; NameAlias holds every other spelling an import may use.
// These helpers are the one way imports resolve a name in a file to a team.

export type NamedTeam = {
  id: string; // TeamEntry id
  /** Every name this team is known by: display name, canonical Team name, aliases. */
  names: string[];
};

/** All the names a team entry answers to, in the shape the loaders select. */
export function namesOf(entry: {
  displayName: string;
  team: { name: string; aliases: { rawName: string }[] };
}): string[] {
  return [entry.displayName, entry.team.name, ...entry.team.aliases.map((a) => a.rawName)];
}

/** Normalised name → team. Later teams win on a clash; renameTeam refuses names that would clash. */
export function indexTeamNames<T extends NamedTeam>(teams: T[]): Map<string, T> {
  const byName = new Map<string, T>();
  for (const team of teams) {
    for (const name of team.names) byName.set(normalizeName(name), team);
  }
  return byName;
}

export function findTeamByName<T extends NamedTeam>(byName: Map<string, T>, name: string): T | undefined {
  return byName.get(normalizeName(name));
}

export type RenamePlan =
  | { kind: "unchanged" }
  | { kind: "taken"; by: string }
  | {
      kind: "rename";
      from: string;
      to: string;
      /** Normalised old name to save as a NameAlias, or null if the team already answers to it. */
      aliasToAdd: string | null;
    };

/**
 * Decides what renaming a team entry does, without touching the database.
 * The new name must not be any name another team in the series answers to
 * (display, canonical or alias), or imports couldn't tell the two apart. The
 * old display name is kept as an alias so CricClubs files that still use it
 * keep matching — unless it's already the canonical name or an alias.
 */
export function planRename(input: {
  currentDisplayName: string;
  newName: string;
  canonicalName: string;
  aliases: string[];
  otherTeams: { displayName: string; names: string[] }[];
}): RenamePlan {
  const to = input.newName.trim().replace(/\s+/g, " ");
  if (to === input.currentDisplayName) return { kind: "unchanged" };

  const key = normalizeName(to);
  const clash = input.otherTeams.find((t) => t.names.some((n) => normalizeName(n) === key));
  if (clash) return { kind: "taken", by: clash.displayName };

  const oldKey = normalizeName(input.currentDisplayName);
  const known = new Set([normalizeName(input.canonicalName), ...input.aliases.map(normalizeName)]);
  return {
    kind: "rename",
    from: input.currentDisplayName,
    to,
    // A case-only change ("Sharks" → "SHARKS") normalises the same, so needs no alias.
    aliasToAdd: oldKey === key || known.has(oldKey) ? null : oldKey,
  };
}

export type NameResolution<T extends NamedTeam> = {
  /** Name as given → the team it means. */
  matched: Map<string, T>;
  /** Names that match no team, in first-seen order. */
  unmatched: string[];
  /** Teams more than one different name resolved to (e.g. an old and a new spelling in one file). */
  collisions: { team: T; names: string[] }[];
};

/** Resolves a file's team names against a series' teams, as every import does. */
export function resolveTeamNames<T extends NamedTeam>(names: string[], teams: T[]): NameResolution<T> {
  const byName = indexTeamNames(teams);
  const matched = new Map<string, T>();
  const unmatched: string[] = [];
  const namesByTeam = new Map<string, { team: T; names: string[] }>();

  for (const name of names) {
    if (matched.has(name) || unmatched.includes(name)) continue;
    const team = findTeamByName(byName, name);
    if (!team) {
      unmatched.push(name);
      continue;
    }
    matched.set(name, team);
    const seen = namesByTeam.get(team.id) ?? { team, names: [] };
    seen.names.push(name);
    namesByTeam.set(team.id, seen);
  }

  return {
    matched,
    unmatched,
    collisions: [...namesByTeam.values()].filter((c) => c.names.length > 1),
  };
}
