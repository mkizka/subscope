import { schema } from "@repo/db";
import { reset } from "drizzle-seed";
import { beforeEach } from "vitest";

import { testSetup } from "./setup.js";

export const setupFiles = () => {
  beforeEach(async () => {
    await reset(testSetup.ctx.db, schema);
  });
};
