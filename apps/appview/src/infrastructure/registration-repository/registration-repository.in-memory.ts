import type { Did } from "@atproto/did";
import { type TransactionContext } from "@repo/common/domain";

import type { IRegistrationRepository } from "../../application/interfaces/registration-repository.js";
import type { Registration } from "../../domain/models/registration.js";

export class InMemoryRegistrationRepository implements IRegistrationRepository {
  private registrations: Map<string, Registration> = new Map();

  add(registration: Registration): void {
    this.registrations.set(registration.accountDid, registration);
  }

  find(accountDid: Did): Promise<Registration | null> {
    return Promise.resolve(this.registrations.get(accountDid) ?? null);
  }

  save(_params: {
    registration: Registration;
    ctx: TransactionContext;
  }): Promise<void> {
    this.registrations.set(
      _params.registration.accountDid,
      _params.registration,
    );
    return Promise.resolve();
  }

  delete(accountDid: Did): Promise<void> {
    this.registrations.delete(accountDid);
    return Promise.resolve();
  }
}
