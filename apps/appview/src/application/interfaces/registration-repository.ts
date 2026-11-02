import type { Did } from "@atproto/did";
import type { Registration, TransactionContext } from "@repo/common/domain";

export interface IRegistrationRepository {
  find: (actorDid: Did) => Promise<Registration | null>;
  save: (params: {
    registration: Registration;
    ctx: TransactionContext;
  }) => Promise<void>;
  delete: (actorDid: Did) => Promise<void>;
}
