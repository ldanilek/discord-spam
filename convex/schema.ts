import { defineSchema, defineTable, s } from "convex/schema";

export default defineSchema({
  guesses: defineTable({
    guess: s.number(),
    guesser: s.string(),
    messageToken: s.string(),
  }),
  spam: defineTable({
    message: s.string(),
    user: s.string(),
  }),
  users: defineTable({
    user: s.string(),
    team: s.union(s.string(), s.null()),
  })
});
