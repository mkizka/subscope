import type {
  GetInviteCodesOutput,
  ListServerMembersOutput,
} from "@/app/server/application/dto/admin";

export interface IAdminQuery {
  listServerMembers: (
    did: string,
    cursor?: string,
  ) => Promise<ListServerMembersOutput>;
  getInviteCodes: (
    did: string,
    cursor?: string,
  ) => Promise<GetInviteCodesOutput>;
}
