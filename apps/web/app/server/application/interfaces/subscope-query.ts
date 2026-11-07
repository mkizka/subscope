import type { FollowedAccountsDto } from "@/app/server/application/dto/followed-accounts-dto";
import type { MembersDto } from "@/app/server/application/dto/members-dto";

export interface ISubscopeQuery {
  isInitialized: () => Promise<boolean>;
  isRegistered: (did: string) => Promise<boolean>;
  findOperator: () => Promise<
    | { did: string; handle: string; displayName?: string; avatarUrl?: string }
    | undefined
  >;
  findMembers: (q?: string) => Promise<MembersDto>;
  findFollowedAccounts: (
    did: string,
    q?: string,
  ) => Promise<FollowedAccountsDto>;
}
