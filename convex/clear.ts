import { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

export default mutation(async ({ db }) => {
  const guesses = await db.table("guesses").collect();
  for (let guess of guesses) {
    db.delete(guess._id);
  }
});
