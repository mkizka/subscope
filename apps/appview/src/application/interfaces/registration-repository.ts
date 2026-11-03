import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";

import type { Registration } from "../../domain/models/registration.js";

export interface IRegistrationRepository {
  find: (accountDid: Did) => Promise<Registration | null>;
  save: (params: {
    registration: Registration;
    ctx: TransactionContext;
  }) => Promise<void>;
  delete: (accountDid: Did) => Promise<void>;
}
