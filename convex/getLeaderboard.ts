import { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

export default query(async ({ db }): Promise<string[]> => {
  const spamDocs = await db.table("spam").collect();
  const userDocs = await db.table("users").collect();
  let userToAttribution = new Map();
  for (let userDoc of userDocs) {
    if (userDoc.team) {
      userToAttribution.set(userDoc.user, `Team ${userDoc.team}`);
    } else {
      userToAttribution.set(userDoc.user, `<@${userDoc.user}>`);
    }
  }
  let attributionCounts = new Map();
  for (let spamDoc of spamDocs) {
    const attribution = userToAttribution.get(spamDoc.user);
    const currentCount = attributionCounts.get(attribution);
    if (!currentCount) {
      attributionCounts.set(attribution, 1);
    } else {
      attributionCounts.set(attribution, currentCount + 1);
    }
  }
  let leaderboardTuples = [];
  for (let attribution of attributionCounts.keys()) {
    leaderboardTuples.push([attribution, attributionCounts.get(attribution)]);
  }
  leaderboardTuples.sort((a, b) => a[1] - b[1]);
  return leaderboardTuples.map(a => a[0]);
});
