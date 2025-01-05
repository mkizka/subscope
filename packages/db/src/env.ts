import { z } from "zod";
import { fromError } from "zod-validation-error";

const schema = z.object({
  LIBSQL_DATABASE_URL: z.string().url(),
});

export const env = (() => {
  try {
    return schema.parse(process.env);
  } catch (e) {
    throw fromError(e);
  }
})();
