import { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

export default mutation(({ db }, guess: number, guesser: string, messageId: string): Id<"guesses"> => {
  return db.insert("guesses", { guess, guesser, messageId });
});
