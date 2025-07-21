import type { DatabaseClient, InviteCode } from "@repo/common/domain";
import { schema } from "@repo/db";

import type { IInviteCodeRepository } from "../application/interfaces/invite-code-repository.js";

export class InviteCodeRepository implements IInviteCodeRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async save(inviteCode: InviteCode): Promise<void> {
    await this.db.insert(schema.inviteCodes).values({
      code: inviteCode.code,
      expiresAt: inviteCode.expiresAt,
      createdAt: inviteCode.createdAt,
    });
  }
}
