import type { InviteCodeDto } from "../dto/invite-code-dto.js";

export interface IInviteCodeQuery {
  findAll: (params: {
    limit: number;
    cursor?: string;
  }) => Promise<InviteCodeDto[]>;
}
