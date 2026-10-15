// US phone numbers, shared by the umpire form (live formatting), the Zod
// schema (validation) and display. Stored as 10 bare digits: "4045550123".

/** Digits only, minus a leading US country code "1" (no US area code starts with 1), capped at 10. */
export function phoneDigits(raw: string): string {
  return raw.replace(/\D/g, "").replace(/^1/, "").slice(0, 10);
}

/** "4045550123" → "(404) 555-0123"; partial input formats as far as it goes ("40455" → "(404) 55"). */
export function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 10);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** The stored form, or null unless the input is exactly 10 digits (after dropping a leading +1). */
export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  return digits.length === 10 ? digits : null;
}
