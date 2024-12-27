import { createInjector } from "typed-inject";

import { SyncUserUseCase } from "./application/sync-user.js";
import { JetstreamIngester } from "./infrastructure/jetstream.js";
import { UserRepository } from "./infrastructure/repositories/user.js";
import { Server } from "./presentation/server.js";

createInjector()
  .provideClass("userRepository", UserRepository)
  .provideClass("syncUserUseCase", SyncUserUseCase)
  .provideClass("ingester", JetstreamIngester)
  .injectClass(Server)
  .start();
