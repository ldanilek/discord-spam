import { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

export default query(async ({ db }, reason: string): Promise<string[]> => {
  const messageDocs = await db.table("messages").filter(q => q.eq(q.field("reason"), reason)).collect();
  return messageDocs.map(d => d.messageToken);
});
