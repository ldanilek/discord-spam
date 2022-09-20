import { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

export default mutation(({ db }, user: string, team: string) => {
  const userDoc = await db.table('users').filter(q => q.eq(user, q.field('user'))).first();
  if (userDoc === null) {
    db.insert("users", { user, team });
    return;
  }
  db.patch(userDoc._id, {"team": team});
});
