import { defineSchema, defineTable, s } from "convex/schema";

export default defineSchema({
  guesses: defineTable({
    guess: s.number(),
    guesser: s.string(),
    messageId: s.string(),
  }),
});
