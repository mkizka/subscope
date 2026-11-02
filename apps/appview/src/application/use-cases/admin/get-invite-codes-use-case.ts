import { toDatetimeString } from "@atproto/syntax";
import type { $OutputBody } from "@repo/client/lex/me/subsco/admin/getInviteCodes";

import type { InviteCodeDto } from "../../../application/dto/invite-code-dto.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { IInviteCodeQuery } from "../../interfaces/queries/invite-code-query.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetInviteCodesUseCase {
  constructor(
    private readonly inviteCodeQuery: IInviteCodeQuery,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(params: {
    limit: number;
    cursor?: string;
  }): Promise<$OutputBody> {
    const paginator = createCursorPaginator<InviteCodeDto>({
      limit: params.limit,
      getCursor: (item) => item.createdAt.toISOString(),
    });
    const page = paginator.extractPage(
      await this.inviteCodeQuery.findAll({
        limit: paginator.queryLimit,
        cursor: params.cursor,
      }),
    );

    const ctx = this.viewContextFactory.create({ includeTakedowns: true });
    const codes = await Promise.all(
      page.items.map(async (item) => ({
        code: item.code,
        expiresAt: toDatetimeString(item.expiresAt),
        createdAt: toDatetimeString(item.createdAt),
        usedAt: item.usedAt ? toDatetimeString(item.usedAt) : undefined,
        usedBy: item.usedByDid
          ? await this.profileViews.view(item.usedByDid, ctx)
          : undefined,
      })),
    );

    return { cursor: page.cursor, codes };
  }
}
