import type { Did } from "@atproto/did";
import type { BackfillStatus } from "@repo/db";

import type { Registration } from "../../../domain/models/registration.js";

export interface IRegistrationQuery {
  findMany: (params: {
    limit: number;
    cursor?: string;
    q?: string;
  }) => Promise<Registration[]>;
  count: () => Promise<number>;
  findTrackedAccounts: (params: {
    limit: number;
    cursor?: string;
    q?: string;
  }) => Promise<{ did: Did; registeredFollowersCount: number }[]>;
  countTrackedAccounts: () => Promise<number>;
  findRegisteredFollowers: (params: {
    subjectDid: Did;
    limit: number;
    cursor?: string;
  }) => Promise<{ did: Did; sortAt: Date }[]>;
  countRegisteredFollowers: (subjectDid: Did) => Promise<number>;
  findTrackedBackfillStatuses: (
    dids: Did[],
  ) => Promise<{ did: Did; status: BackfillStatus }[]>;
}
