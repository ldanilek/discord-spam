import { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

export default query(async ({ db }): Promise<[string | null, string[]]> => {
  const guesses = await db.table("guesses").collect();
  let sum = 0;
  for (let guess of guesses) {
    sum += guess.guess;
  }
  let avg = sum / guesses.length;
  let target = avg * 0.5;
  let closestDist = 100;
  let closestGuesser = null;
  let messageIds = [];
  for (let guess of guesses) {
    if (guess.messageId) {
      messageIds.push(guess.messageId);
    }
    
    const dist = Math.abs(guess.guess - avg);
    if (dist < closestDist) {
      closestDist = dist;
      closestGuesser = guess.guesser;
    }
  }
  return [closestGuesser, messageIds];
});
