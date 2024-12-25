import { createInjector } from "typed-inject";

import { CreateUserUseCase } from "../application/create-user-use-case.js";
import { StartIngestionUseCase } from "../application/start-ingestion-use-case.js";
import { JetstreamIngester } from "../infrastructure/jetstream.js";
import { UserRepository } from "../infrastructure/user-repository.js";

export const appInjector = createInjector()
  .provideClass("userRepository", UserRepository)
  .provideClass("createUserUseCase", CreateUserUseCase)
  .provideClass("ingester", JetstreamIngester)
  .provideClass("startIngestionUseCase", StartIngestionUseCase);
