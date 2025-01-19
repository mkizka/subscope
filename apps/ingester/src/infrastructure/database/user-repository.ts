import type { TransactionContext } from "@dawn/common/domain";
import { User } from "@dawn/common/domain";
import { schema } from "@dawn/db";
import { eq } from "drizzle-orm";

import type { IUserRepository } from "../../application/interfaces/user-repository.js";

export class UserRepository implements IUserRepository {
  async findOne({ ctx, did }: { ctx: TransactionContext; did: string }) {
    const [user] = await ctx.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.did, did));
    if (!user) {
      return null;
    }
    return new User(user);
  }

  async createOrUpdate({ ctx, user }: { ctx: TransactionContext; user: User }) {
    await ctx.db
      .insert(schema.users)
      .values({
        did: user.did,
        handle: user.handle,
      })
      .onDuplicateKeyUpdate({
        set: {
          handle: user.handle,
        },
      });
  }
}
