import { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

export default query(async ({ db }): Promise<[string | null, string[], Map<string, [string, number]>]> => {
  const guesses = await db.table("guesses").collect();
  let tokenToGuess = new Map();
  let sum = 0;
  for (let guess of guesses) {
    sum += guess.guess;
  }
  let avg = sum / guesses.length;
  let target = avg * 0.5;
  let closestDist = 100;
  let closestGuesser = null;
  let messageTokens = [];
  for (let guess of guesses) {
    if (guess.messageToken) {
      messageTokens.push(guess.messageToken);
      tokenToGuess.set(guess.messageToken, [guess.guesser, guess.guess]);
    }
    
    const dist = Math.abs(guess.guess - avg);
    if (dist < closestDist) {
      closestDist = dist;
      closestGuesser = guess.guesser;
    }
  }
  return [closestGuesser, messageTokens, tokenToGuess];
});
