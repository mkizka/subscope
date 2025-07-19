import type { AccountEvent } from "@skyware/jetstream";

export function handleAccountCommandFactory(event: AccountEvent) {
  return {
    did: event.account.did,
    status: event.account.status,
    active: event.account.active,
    indexedAt: new Date(event.time_us / 1000),
  };
}

export type HandleAccountCommand = ReturnType<
  typeof handleAccountCommandFactory
>;
