import type {
  GetBannedAccountsOutput,
  GetInviteCodesOutput,
  ListRegisteredAccountsOutput,
} from "@/app/server/application/dto/admin";

export interface IAdminQuery {
  listRegisteredAccounts: (
    did: string,
    cursor?: string,
  ) => Promise<ListRegisteredAccountsOutput>;
  getBannedAccounts: (
    did: string,
    cursor?: string,
  ) => Promise<GetBannedAccountsOutput>;
  getInviteCodes: (
    did: string,
    cursor?: string,
  ) => Promise<GetInviteCodesOutput>;
}
