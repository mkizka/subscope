import { toDatetimeString } from "@atproto/syntax";
import type { $OutputBody } from "@repo/client/lex/me/subsco/admin/getInviteCodes";

import type { ProfileViewService } from "../../../application/service/actor/profile-view-service.js";
import type { InviteCodeService } from "../../../application/service/admin/invite-code-service.js";

export class GetInviteCodesUseCase {
  constructor(
    private readonly inviteCodeService: InviteCodeService,
    private readonly profileViewService: ProfileViewService,
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

    const usedByDids = paginationResult.items
      .map((item) => item.usedByDid)
      .filter((did) => did !== null);
    const profiles = await this.profileViewService.findProfileView(
      usedByDids,
      null,
      { includeTakedowns: true },
    );
    const profileMap = new Map(
      profiles.map((profile) => [profile.did, profile]),
    );

    return {
      cursor: paginationResult.cursor,
      codes: paginationResult.items.map((item) => ({
        code: item.code,
        expiresAt: toDatetimeString(item.expiresAt),
        createdAt: toDatetimeString(item.createdAt),
        usedAt: item.usedAt ? toDatetimeString(item.usedAt) : undefined,
        usedBy: item.usedByDid ? profileMap.get(item.usedByDid) : undefined,
      })),
    };
  }
}
