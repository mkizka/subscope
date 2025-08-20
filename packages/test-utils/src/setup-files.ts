import { schema } from "@repo/db";
import { reset } from "drizzle-seed";
import { beforeEach } from "vitest";

import { getTestSetup } from "./setup.js";

export const setupFiles = () => {
  const { ctx } = getTestSetup();

  beforeEach(async () => {
    await reset(ctx.db, schema);
  });
};
