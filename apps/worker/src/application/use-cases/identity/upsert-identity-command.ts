import { asDid } from "@atproto/did";
import { asHandle } from "@repo/common/utils";
import type { IdentityEvent } from "@skyware/jetstream";

export const upsertIdentityCommandFactory = (event: IdentityEvent) => {
  return {
    did: asDid(event.identity.did),
    handle: event.identity.handle ? asHandle(event.identity.handle) : undefined,
    indexedAt: new Date(event.time_us / 1000),
  };
};

export type UpsertIdentityCommand = ReturnType<
  typeof upsertIdentityCommandFactory
>;
