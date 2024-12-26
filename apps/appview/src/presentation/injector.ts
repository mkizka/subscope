import { createInjector } from "typed-inject";

import { Ingester } from "../infrastructure/ingester.js";
import { UserRepository } from "../infrastructure/user-repository.js";

export const appInjector = createInjector()
  .provideClass("userRepository", UserRepository)
  .provideClass("ingester", Ingester);
