import { Server } from "./application/server.js";
import { appInjector } from "./presentation/injector.js";

appInjector.injectClass(Server).start();
