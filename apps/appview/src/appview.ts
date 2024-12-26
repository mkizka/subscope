import { createInjector } from "typed-inject";

import { UserService } from "./domain/service/user.js";
import { JetstreamIngester } from "./infrastructure/jetstream.js";
import { UserRepository } from "./infrastructure/repositories/user.js";
import { Server } from "./presentation/server.js";

createInjector()
  .provideClass("userRepository", UserRepository)
  .provideClass("userService", UserService)
  .provideClass("ingester", JetstreamIngester)
  .injectClass(Server)
  .start();
