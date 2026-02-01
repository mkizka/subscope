import type { Did } from "@atproto/did";
import type { InviteCode, TransactionContext } from "@repo/common/domain";
import type { Handle } from "@repo/common/utils";

import type { InviteCodeDto } from "@/server/features/xrpc/application/dto/invite-code-with-handle.js";
import type { IInviteCodeRepository } from "@/server/features/xrpc/application/interfaces/invite-code-repository.js";

type UsedByInfo = {
  did: Did;
  handle: Handle | null;
};

type StoredInviteCode = {
  inviteCode: InviteCode;
  usedBy: UsedByInfo | null;
};

export class InMemoryInviteCodeRepository implements IInviteCodeRepository {
  private inviteCodes: Map<string, StoredInviteCode> = new Map();

  add(inviteCode: InviteCode, usedBy?: UsedByInfo): void {
    this.inviteCodes.set(inviteCode.code, {
      inviteCode,
      usedBy: usedBy ?? null,
    });
  }

  setUsedBy(code: string, usedBy: UsedByInfo): void {
    const stored = this.inviteCodes.get(code);
    if (stored) {
      this.inviteCodes.set(code, {
        ...stored,
        usedBy,
      });
    }
  }

  clear(): void {
    this.inviteCodes.clear();
  }

  upsert(_params: {
    inviteCode: InviteCode;
    ctx: TransactionContext;
  }): Promise<void> {
    const existing = this.inviteCodes.get(_params.inviteCode.code);
    this.inviteCodes.set(_params.inviteCode.code, {
      inviteCode: _params.inviteCode,
      usedBy: existing?.usedBy ?? null,
    });
    return Promise.resolve();
  }

  findAll(params: {
    limit: number;
    cursor?: string;
  }): Promise<InviteCodeDto[]> {
    let entries = Array.from(this.inviteCodes.values());

    entries = entries.sort(
      (a, b) =>
        b.inviteCode.createdAt.getTime() - a.inviteCode.createdAt.getTime(),
    );

    if (params.cursor) {
      const cursorDate = new Date(params.cursor);
      entries = entries.filter(
        (entry) => entry.inviteCode.createdAt < cursorDate,
      );
    }

    return Promise.resolve(
      entries.slice(0, params.limit).map((entry) => ({
        code: entry.inviteCode.code,
        expiresAt: entry.inviteCode.expiresAt,
        createdAt: entry.inviteCode.createdAt,
        usedAt: entry.inviteCode.usedAt,
        usedBy: entry.usedBy,
      })),
    );
  }

  findFirst(code: string): Promise<InviteCode | null> {
    const stored = this.inviteCodes.get(code);
    return Promise.resolve(stored?.inviteCode ?? null);
  }
}
