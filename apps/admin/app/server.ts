import { appFactory } from "./server/app.js";
import { injector } from "./server/injector.js";

export const app = injector.injectFunction(appFactory);
