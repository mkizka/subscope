import { asDid } from "@atproto/did";
import type { IdentityEvent } from "@skyware/jetstream";

export const upsertIdentityDtoFactory = (event: IdentityEvent) => {
  return {
    did: asDid(event.identity.did),
    handle: event.identity.handle,
  };
};

export type UpsertIdentityDto = ReturnType<typeof upsertIdentityDtoFactory>;
