import { User } from "@dawn/common/domain";
import { schema } from "@dawn/db";
import { eq } from "drizzle-orm";

import type { IUserRepository } from "../application/interfaces/user-repository.js";
import { db } from "./db.js";

export class UserRepository implements IUserRepository {
  async findOne({ did }: { did: string }) {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.did, did));
    if (!user) {
      return null;
    }
    return new User(user);
  }
}
