import type { Did } from "@atproto/did";
import type { Registration, TransactionContext } from "@repo/common/domain";

export interface IRegistrationRepository {
  find: (accountDid: Did) => Promise<Registration | null>;
  save: (params: {
    registration: Registration;
    ctx: TransactionContext;
  }) => Promise<void>;
  delete: (accountDid: Did) => Promise<void>;
}
