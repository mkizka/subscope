import type { AccountEventDto } from "@repo/common/domain";

export function handleAccountCommandFactory(event: AccountEventDto) {
  return {
    did: event.account.did,
    status: event.account.status,
    active: event.account.active,
  };
}

export type HandleAccountCommand = ReturnType<
  typeof handleAccountCommandFactory
>;
