import { toDatetimeString } from "@atproto/syntax";
import type { $OutputBody } from "@repo/client/lex/me/subsco/admin/getInviteCodes";

import type { InviteCodeService } from "../../../application/service/admin/invite-code-service.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetInviteCodesUseCase {
  constructor(
    private readonly inviteCodeService: InviteCodeService,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(params: {
    limit: number;
    cursor?: string;
  }): Promise<$OutputBody> {
    const paginationResult =
      await this.inviteCodeService.findInviteCodesWithPagination({
        cursor: params.cursor,
        limit: params.limit,
      });

    const ctx = this.viewContextFactory.create({ includeTakedowns: true });
    const codes = await Promise.all(
      paginationResult.items.map(async (item) => ({
        code: item.code,
        expiresAt: toDatetimeString(item.expiresAt),
        createdAt: toDatetimeString(item.createdAt),
        usedAt: item.usedAt ? toDatetimeString(item.usedAt) : undefined,
        usedBy: item.usedByDid
          ? await this.profileViews.view(item.usedByDid, ctx)
          : undefined,
      })),
    );

    return { cursor: paginationResult.cursor, codes };
  }
}
