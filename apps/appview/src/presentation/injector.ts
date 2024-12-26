import { createInjector } from "typed-inject";

import { UserRepository } from "../infrastructure/user-repository.js";

export const appInjector = createInjector().provideClass(
  "userRepository",
  UserRepository,
);
