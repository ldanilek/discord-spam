import { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

export default mutation(({ db }, user: string, message: string) => {
  db.insert("spam", { user, message });
});
