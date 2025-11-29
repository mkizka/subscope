import { beforeEach } from "vitest";

import { clearAllInMemoryRepositories } from "./src/shared/test-utils.js";

beforeEach(() => {
  clearAllInMemoryRepositories();
});
