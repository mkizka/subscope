import type { Did } from "@atproto/did";
import type { BackfillStatus, Registration } from "@repo/common/domain";

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
  findTrackedBackfillStatuses: (
    dids: Did[],
  ) => Promise<{ did: Did; status: BackfillStatus }[]>;
}
