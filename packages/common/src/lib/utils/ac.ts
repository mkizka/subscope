import { asClass } from "@gyaku/di";

export const ac = <T>(Ctor: new (...args: never[]) => T) =>
  asClass(Ctor, { positional: true });
