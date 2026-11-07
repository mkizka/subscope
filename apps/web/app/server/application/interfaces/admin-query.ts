import type {
  GetBannedAccountsOutput,
  GetInviteCodesOutput,
  ListServerMembersOutput,
} from "@/app/server/application/dto/admin";

export interface IAdminQuery {
  listServerMembers: (
    did: string,
    cursor?: string,
  ) => Promise<ListServerMembersOutput>;
  getBannedAccounts: (
    did: string,
    cursor?: string,
  ) => Promise<GetBannedAccountsOutput>;
  getInviteCodes: (
    did: string,
    cursor?: string,
  ) => Promise<GetInviteCodesOutput>;
}
