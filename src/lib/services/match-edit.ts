import { can, ForbiddenError, type SessionUser } from "@/lib/auth/permissions";
import { listPhotosForMatch } from "@/lib/services/photos";
import { getMatchEditOptions, getPublicFixture } from "@/lib/services/schedule";

/**
 * Everything the admin edit-match page shows: the fixture, what the details
 * form offers (fields, teams) and the pictures already linked to the match.
 * Null when the match doesn't exist. Admins only; the page and the actions
 * behind it check again.
 */
export async function getMatchEditView(user: SessionUser, matchId: string) {
  if (!can(user, "manage-league")) throw new ForbiddenError();

  const fixture = await getPublicFixture(matchId);
  if (!fixture) return null;

  const [options, photos] = await Promise.all([
    getMatchEditOptions(user),
    can(user, "manage-photos") ? listPhotosForMatch(user, matchId) : Promise.resolve([]),
  ]);
  return { match: fixture.match, options, photos, canManagePhotos: can(user, "manage-photos") };
}
