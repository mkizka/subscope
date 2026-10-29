import { toDatetimeString } from "@atproto/syntax";
import type { $OutputBody } from "@repo/client/lex/me/subsco/admin/getInviteCodes";

import type { InviteCodeService } from "../../../application/service/admin/invite-code-service.js";

export class GetInviteCodesUseCase {
  constructor(private readonly inviteCodeService: InviteCodeService) {}

  async execute(params: {
    limit: number;
    cursor?: string;
  }): Promise<$OutputBody> {
    const paginationResult =
      await this.inviteCodeService.findInviteCodesWithPagination({
        cursor: params.cursor,
        limit: params.limit,
      });

    return {
      cursor: paginationResult.cursor,
      codes: paginationResult.items.map((item) => ({
        code: item.code,
        expiresAt: toDatetimeString(item.expiresAt),
        createdAt: toDatetimeString(item.createdAt),
        usedAt: item.usedAt ? toDatetimeString(item.usedAt) : undefined,
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
