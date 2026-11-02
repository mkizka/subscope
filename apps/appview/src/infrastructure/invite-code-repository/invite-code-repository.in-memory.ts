import type { InviteCode, TransactionContext } from "@repo/common/domain";

import type { InviteCodeDto } from "../../application/dto/invite-code-dto.js";
import type { IInviteCodeRepository } from "../../application/interfaces/invite-code-repository.js";

export class InMemoryInviteCodeRepository implements IInviteCodeRepository {
  private inviteCodes: Map<string, InviteCode> = new Map();

  add(inviteCode: InviteCode): void {
    this.inviteCodes.set(inviteCode.code, inviteCode);
  }

  clear(): void {
    this.inviteCodes.clear();
  }

  save(_params: {
    inviteCode: InviteCode;
    ctx: TransactionContext;
  }): Promise<void> {
    this.inviteCodes.set(_params.inviteCode.code, _params.inviteCode);
    return Promise.resolve();
  }

  delete(_params: { code: string; ctx: TransactionContext }): Promise<void> {
    this.inviteCodes.delete(_params.code);
    return Promise.resolve();
  }

  findAll(params: {
    limit: number;
    cursor?: string;
  }): Promise<InviteCodeDto[]> {
    let entries = Array.from(this.inviteCodes.values());

    entries = entries.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    if (params.cursor) {
      const cursorDate = new Date(params.cursor);
      entries = entries.filter((entry) => entry.createdAt < cursorDate);
    }

    return Promise.resolve(
      entries.slice(0, params.limit).map((entry) => ({
        code: entry.code,
        expiresAt: entry.expiresAt,
        createdAt: entry.createdAt,
        usedAt: entry.usedAt,
        usedByDid: null,
      })),
    );
  }

  find(params: {
    code: string;
    ctx: TransactionContext;
  }): Promise<InviteCode | null> {
    return Promise.resolve(this.inviteCodes.get(params.code) ?? null);
  }
}
