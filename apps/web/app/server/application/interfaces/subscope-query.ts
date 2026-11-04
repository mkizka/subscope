import type { MembersDto } from "@/app/server/application/dto/members-dto";
import type { TrackedAccountsDto } from "@/app/server/application/dto/tracked-accounts-dto";

export interface ISubscopeQuery {
  isInitialized: () => Promise<boolean>;
  isRegistered: (did: string) => Promise<boolean>;
  findMembers: (q?: string) => Promise<MembersDto>;
  findTrackedAccounts: (did: string, q?: string) => Promise<TrackedAccountsDto>;
}
