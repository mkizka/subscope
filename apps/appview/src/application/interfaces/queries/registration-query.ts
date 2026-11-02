import type { Did } from "@atproto/did";
import type { Registration } from "@repo/common/domain";

export interface IRegistrationQuery {
  findMany: (params: {
    limit: number;
    cursor?: string;
  }) => Promise<Registration[]>;
  count: () => Promise<number>;
  findTrackedAccounts: (params: {
    limit: number;
    cursor?: string;
  }) => Promise<{ did: Did; registeredFollowersCount: number }[]>;
  countTrackedAccounts: () => Promise<number>;
}
