import type { FeeTier } from "@/generated/prisma";

// Shared between the admin table and the Excel export so the two never
// drift apart.
export const FEE_TIER_LABEL: Record<FeeTier, string> = {
  STANDARD: "$650 Standard",
  SPONSORSHIP: "$800 Sponsorship",
};
