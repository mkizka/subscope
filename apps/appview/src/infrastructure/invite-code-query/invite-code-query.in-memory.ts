import type { InviteCode } from "@repo/common/domain";

import type { InviteCodeDto } from "../../application/dto/invite-code-dto.js";
import type { IInviteCodeQuery } from "../../application/interfaces/invite-code-query.js";

export class InMemoryInviteCodeQuery implements IInviteCodeQuery {
  private inviteCodes: InviteCode[] = [];

  add(inviteCode: InviteCode): void {
    this.inviteCodes.push(inviteCode);
  }

  findAll(params: {
    limit: number;
    cursor?: string;
  }): Promise<InviteCodeDto[]> {
    const cursorDate = params.cursor ? new Date(params.cursor) : null;
    return Promise.resolve(
      this.inviteCodes
        .filter((entry) => !cursorDate || entry.createdAt < cursorDate)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, params.limit)
        .map((entry) => ({
          code: entry.code,
          expiresAt: entry.expiresAt,
          createdAt: entry.createdAt,
          usedAt: entry.usedAt,
          usedByDid: null,
        })),
    );
  }
}
