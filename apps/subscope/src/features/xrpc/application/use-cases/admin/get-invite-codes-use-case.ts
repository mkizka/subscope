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
      codes: paginationResult.items.map((item) => ({
        code: item.code,
        expiresAt: item.expiresAt.toISOString(),
        createdAt: item.createdAt.toISOString(),
        usedAt: item.usedAt?.toISOString(),
        usedBy: item.usedBy
          ? {
              did: item.usedBy.did,
              handle: item.usedBy.handle ?? undefined,
            }
          : undefined,
      })),
    };
  }
}
