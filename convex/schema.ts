import { defineSchema, defineTable, s } from "convex/schema";

export default defineSchema({
  guesses: defineTable({
    guess: s.number(),
    guesser: s.string(),
    messageToken: s.string(),
  }),
  spam: defineSchema({
    message: s.string(),
    user: s.string(),
  }),
  users: defineSchema({
    user: s.string(),
    team: s.string() | null,
  })
});
