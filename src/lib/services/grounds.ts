import { prisma } from "@/lib/db/prisma";
import { compareFieldLabels } from "@/lib/grounds";

export type PublicGround = {
  id: string;
  name: string;
  address: string | null;
  mapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Field labels in reading order; a single-field ground has one empty label. */
  fields: { id: string; label: string }[];
};

/**
 * Every ground with its fields, for the public Grounds page. Never throws: the
 * page must render even if the database is unreachable, so a failure is logged
 * and comes back as null.
 */
export async function listGrounds(): Promise<PublicGround[] | null> {
  try {
    const rows = await prisma.ground.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        address: true,
        mapsUrl: true,
        latitude: true,
        longitude: true,
        fields: { select: { id: true, label: true } },
      },
    });
    return rows.map(toPublicGround);
  } catch (error) {
    console.error("Failed to load the grounds:", error);
    return null;
  }
}

/** One ground for its details page, or null when it doesn't exist (or the database is unreachable). */
export async function getGround(id: string): Promise<PublicGround | null> {
  try {
    const row = await prisma.ground.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        address: true,
        mapsUrl: true,
        latitude: true,
        longitude: true,
        fields: { select: { id: true, label: true } },
      },
    });
    return row ? toPublicGround(row) : null;
  } catch (error) {
    console.error("Failed to load the ground:", id, error);
    return null;
  }
}

type GroundRow = {
  id: string;
  name: string;
  address: string | null;
  mapsUrl: string | null;
  latitude: { toNumber(): number } | null;
  longitude: { toNumber(): number } | null;
  fields: { id: string; label: string }[];
};

function toPublicGround(g: GroundRow): PublicGround {
  return {
    id: g.id,
    name: g.name,
    address: g.address,
    mapsUrl: g.mapsUrl,
    latitude: g.latitude?.toNumber() ?? null,
    longitude: g.longitude?.toNumber() ?? null,
    fields: [...g.fields].sort((a, b) => compareFieldLabels(a.label, b.label)),
  };
}

/** The ground a field belongs to, or null when the field doesn't exist (or the database is unreachable). */
export async function getGroundIdForField(fieldId: string): Promise<string | null> {
  try {
    const row = await prisma.field.findUnique({ where: { id: fieldId }, select: { groundId: true } });
    return row?.groundId ?? null;
  } catch (error) {
    console.error("Failed to find the ground of field:", fieldId, error);
    return null;
  }
}
