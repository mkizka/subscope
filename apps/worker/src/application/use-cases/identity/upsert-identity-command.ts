import type { IdentityEventDto } from "@repo/common/domain";

export const upsertIdentityCommandFactory = (event: IdentityEventDto) => {
  return {
    did: event.identity.did,
    handle: event.identity.handle,
    status: event.identity.status,
  };
};

export type UpsertIdentityCommand = ReturnType<
  typeof upsertIdentityCommandFactory
>;
