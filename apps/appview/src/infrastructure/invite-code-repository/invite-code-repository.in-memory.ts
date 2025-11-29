import { asDid } from "@atproto/did";
import type { InviteCode, TransactionContext } from "@repo/common/domain";
import { asHandle } from "@repo/common/utils";

import type { InviteCodeDto } from "../../application/dto/invite-code-with-handle.js";
import type { IInviteCodeRepository } from "../../application/interfaces/invite-code-repository.js";

export class InMemoryInviteCodeRepository implements IInviteCodeRepository {
  private inviteCodes: Map<string, InviteCode> = new Map();
  private usedByMap: Map<string, { did: string; handle: string | null }> =
    new Map();

  add(inviteCode: InviteCode): void {
    this.inviteCodes.set(inviteCode.code, inviteCode);
  }

  setUsedBy(
    code: string,
    usedBy: { did: string; handle: string | null },
  ): void {
    this.usedByMap.set(code, usedBy);
  }

  clear(): void {
    this.inviteCodes.clear();
    this.usedByMap.clear();
  }

  async upsert(params: {
    inviteCode: InviteCode;
    ctx: TransactionContext;
  }): Promise<void> {
    this.inviteCodes.set(params.inviteCode.code, params.inviteCode);
  }

  async findAll(params: {
    limit: number;
    cursor?: string;
  }): Promise<InviteCodeDto[]> {
    let codes = Array.from(this.inviteCodes.values());

    codes = codes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (params.cursor) {
      const cursorDate = new Date(params.cursor);
      codes = codes.filter((code) => code.createdAt < cursorDate);
    }

    const results = codes.slice(0, params.limit);

    return results.map((code) => {
      const usedBy = this.usedByMap.get(code.code);
      return {
        code: code.code,
        expiresAt: code.expiresAt,
        createdAt: code.createdAt,
        usedAt: code.usedAt,
        usedBy: usedBy
          ? {
              did: asDid(usedBy.did),
              handle: usedBy.handle ? asHandle(usedBy.handle) : null,
            }
          : null,
      };
    });
  }

  async findFirst(code: string): Promise<InviteCode | null> {
    return this.inviteCodes.get(code) ?? null;
  }
}
