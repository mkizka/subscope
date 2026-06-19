import { asClass } from "@gyaku/di";

export const ac = <T>(Ctor: new (...args: never[]) => T) => {
  const factory = asClass(Ctor, { positional: true });
  return (deps?: Record<string, unknown>) => factory(deps ?? {});
};
