/** What one field of a ground is called on the Grounds page: "Field 3", or "Single field" when the ground has just the one. */
export function fieldChipLabel(label: string): string {
  return label.trim() === "" ? "Single field" : `Field ${label.trim()}`;
}

/** The link behind a ground's address: its saved maps URL, else a Google Maps search for the address (or name). */
export function groundMapsHref(ground: {
  name: string;
  address: string | null;
  mapsUrl: string | null;
}): string {
  if (ground.mapsUrl) return ground.mapsUrl;
  const query = ground.address?.trim() || ground.name;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Orders fields the way people read them: numeric labels by number, then the rest alphabetically. */
export function compareFieldLabels(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  const aNum = a.trim() !== "" && Number.isFinite(na);
  const bNum = b.trim() !== "" && Number.isFinite(nb);
  if (aNum && bNum) return na - nb;
  if (aNum !== bNum) return aNum ? -1 : 1;
  return a.localeCompare(b);
}

/**
 * Splits a CricClubs ground string into the ground and the field within it:
 * "Nickajack Park 3" is ground "Nickajack Park" + field "3"; "Larry Bell" is a
 * single-field ground (empty label). The schedule import and the seed data both
 * use this, so they always agree on which field a name means.
 */
export function splitGroundName(raw: string): { ground: string; label: string } {
  const m = raw.trim().match(/^(.*?)\s+(\d+)$/);
  return m ? { ground: m[1], label: m[2] } : { ground: raw.trim(), label: "" };
}

type MapPlace = { name: string; address: string | null; latitude?: number | null; longitude?: number | null };

/** What Google Maps is asked to find: exact coordinates when the ground has them, else its address, else its name. */
function mapQuery(place: MapPlace): string {
  if (place.latitude != null && place.longitude != null) return `${place.latitude},${place.longitude}`;
  return place.address?.trim() || place.name;
}

/** The embeddable Google map with a pin on the ground (the keyless embed, no API key needed). */
export function groundEmbedSrc(place: MapPlace): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(mapQuery(place))}&output=embed`;
}

/** Turn-by-turn directions to the ground in Google Maps. */
export function groundDirectionsHref(place: MapPlace): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery(place))}`;
}

/** Directions to the ground in Apple Maps (opens the Maps app on iPhones and Macs). */
export function groundAppleMapsHref(place: MapPlace): string {
  return `https://maps.apple.com/?daddr=${encodeURIComponent(mapQuery(place))}`;
}

/** Directions to the ground in Waze (opens the app when installed). */
export function groundWazeHref(place: MapPlace): string {
  const where =
    place.latitude != null && place.longitude != null
      ? `ll=${encodeURIComponent(`${place.latitude},${place.longitude}`)}`
      : `q=${encodeURIComponent(place.address?.trim() || place.name)}`;
  return `https://waze.com/ul?${where}&navigate=yes`;
}
