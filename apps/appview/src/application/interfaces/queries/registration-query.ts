import type { Did } from "@atproto/did";

import type { Registration } from "../../../domain/models/registration.js";

export interface IRegistrationQuery {
  findMany: (params: {
    limit: number;
    cursor?: string;
    q?: string;
  }) => Promise<Registration[]>;
  count: () => Promise<number>;
  findFirstAdminDid: () => Promise<Did | undefined>;
  findFollowedAccounts: (params: {
    limit: number;
    cursor?: string;
    q?: string;
  }) => Promise<{ did: Did; memberFollowersCount: number }[]>;
  countFollowedAccounts: () => Promise<number>;
  findMemberFollowers: (params: {
    subjectDid: Did;
    limit: number;
    cursor?: string;
  }) => Promise<{ did: Did; sortAt: Date }[]>;
  countMemberFollowers: (subjectDid: Did) => Promise<number>;
}
