import type { MeSubscoAdminGetInviteCodes } from "@repo/client/server";

import type { InviteCodeService } from "../../service/admin/invite-code-service.js";

export class GetInviteCodesUseCase {
  constructor(private readonly inviteCodeService: InviteCodeService) {}
  static inject = ["inviteCodeService"] as const;

  async execute(params: {
    limit: number;
    cursor?: string;
  }): Promise<MeSubscoAdminGetInviteCodes.OutputSchema> {
    const paginationResult =
      await this.inviteCodeService.findInviteCodesWithPagination({
        cursor: params.cursor,
        limit: params.limit,
      });

    return {
      cursor: paginationResult.cursor,
      codes: paginationResult.items.map((code) => ({
        code: code.code,
        expiresAt: code.expiresAt.toISOString(),
        createdAt: code.createdAt.toISOString(),
      })),
    };
  }
}
