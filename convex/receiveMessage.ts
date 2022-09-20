import { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

export default mutation(({ db }, reason: string, messageToken: string) => {
  db.insert("messages", { reason, messageToken });
});
