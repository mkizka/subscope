import type { AppBskyActorProfile } from "@atproto/api";
import { z } from "zod";

import { User } from "../domain/models/user.js";

const schema = z
  .object({
    did: z.string(),
    handle: z.string(),
    displayName: z.string().optional(),
    avatar: z.string().optional(),
    description: z.string().optional(),
  })
  .transform((data) => ({
    ...data,
    displayName: data.displayName ?? null,
    avatar: data.avatar ?? null,
    description: data.description ?? null,
  }));

export const userMapper = {
  fromATP(atpUser: AppBskyActorProfile.Record) {
    const parsed = schema.parse(atpUser);
    return new User({
      did: parsed.did,
      handle: parsed.handle,
      displayName: parsed.displayName,
      avatar: parsed.avatar,
      description: parsed.description,
    });
  },
};
