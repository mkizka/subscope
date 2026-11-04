import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";

import type { IProfileRepository } from "../../../application/interfaces/repositories/profile-repository.js";
import type { Profile } from "../../../application/models/profile.js";
import { sanitizeDate } from "../../utils/data-sanitizer.js";

export class ProfileRepository implements IProfileRepository {
  async save({ ctx, profile }: { ctx: TransactionContext; profile: Profile }) {
    const { uri, indexedAt, ...rest } = profile;
    const data = {
      ...rest,
      createdAt: rest.createdAt ? sanitizeDate(rest.createdAt) : null,
    };
    await ctx.db
      .insert(schema.profiles)
      .values({ uri, indexedAt, ...data })
      .onConflictDoUpdate({ target: schema.profiles.uri, set: data });
  }
}
