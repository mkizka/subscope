import { InviteCode, type TransactionContext } from "@repo/common/domain";

import type { IInviteCodeRepository } from "../../../application/interfaces/repositories/invite-code-repository.js";

export class InMemoryInviteCodeRepository implements IInviteCodeRepository {
  private inviteCodes: Map<string, InviteCode> = new Map();

  add(inviteCode: InviteCode): void {
    this.inviteCodes.set(inviteCode.code, inviteCode);
  }

  clear(): void {
    this.inviteCodes.clear();
  }

  findByCode(
    _ctx: TransactionContext,
    code: string,
  ): Promise<InviteCode | null> {
    return Promise.resolve(this.inviteCodes.get(code) ?? null);
  }

  markAsUsed(_ctx: TransactionContext, code: string): Promise<void> {
    const inviteCode = this.inviteCodes.get(code);
    if (inviteCode) {
      const updated = new InviteCode({
        code: inviteCode.code,
        expiresAt: inviteCode.expiresAt,
        usedAt: new Date(),
        createdAt: inviteCode.createdAt,
      });
      this.inviteCodes.set(code, updated);
    }
    return Promise.resolve();
  }
}
