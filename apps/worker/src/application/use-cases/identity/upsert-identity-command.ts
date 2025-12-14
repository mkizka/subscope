import type { IdentityEventDto } from "@repo/common/domain";

export const upsertIdentityCommandFactory = (event: IdentityEventDto) => {
  return {
    did: event.identity.did,
    handle: event.identity.handle,
    indexedAt: new Date(event.time_us / 1000),
  };
};

export type UpsertIdentityCommand = ReturnType<
  typeof upsertIdentityCommandFactory
>;
