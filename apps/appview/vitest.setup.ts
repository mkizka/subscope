import { setupFiles } from "@repo/test-utils";
import { beforeEach } from "vitest";

import { clearAllInMemoryRepositories } from "./src/shared/test-utils.js";

setupFiles();

beforeEach(() => {
  clearAllInMemoryRepositories();
});
