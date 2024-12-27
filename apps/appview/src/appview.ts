import { createInjector } from "typed-inject";

import { SyncProfileUseCase } from "./application/sync-profile.js";
import { SyncUserUseCase } from "./application/sync-user.js";
import { JetstreamIngester } from "./infrastructure/jetstream.js";
import { ProfileRepository } from "./infrastructure/repositories/profile.js";
import { UserRepository } from "./infrastructure/repositories/user.js";
import { Server } from "./presentation/server.js";

createInjector()
  .provideClass("userRepository", UserRepository)
  .provideClass("syncUserUseCase", SyncUserUseCase)
  .provideClass("profileRepository", ProfileRepository)
  .provideClass("syncProfileUseCase", SyncProfileUseCase)
  .provideClass("ingester", JetstreamIngester)
  .injectClass(Server)
  .start();
