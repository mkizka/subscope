import { jsonToLex } from "@atproto/lexicon";
import type { AtUri } from "@atproto/syntax";
import type { AppBskyActorProfile } from "@dawn/client";
import client from "@dawn/client";
import type { Record, TransactionContext } from "@dawn/common/domain";
import { Profile } from "@dawn/common/domain";

import type { IProfileRepository } from "../interfaces/profile-repository.js";

export class IndexProfileService {
  constructor(private readonly profileRepository: IProfileRepository) {}
  static inject = ["profileRepository"] as const;

  private assertRecord(
    json: unknown,
  ): asserts json is AppBskyActorProfile.Record {
    client.lexicons.assertValidRecord(
      "app.bsky.actor.profile",
      jsonToLex(json),
    );
  }

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    this.assertRecord(record.json);
    const profile = new Profile({
      did: record.actorDid,
      avatar: record.json.avatar
        ? {
            cid: record.json.avatar.ref.$link,
            mimeType: record.json.avatar.mimeType,
            size: record.json.avatar.size,
          }
        : null,
      description: record.json.description ?? null,
      displayName: record.json.displayName ?? null,
      createdAt: record.json.createdAt ? new Date(record.json.createdAt) : null,
    });
    await this.profileRepository.upsert({ ctx, profile });
  }

  async delete({ ctx, uri }: { ctx: TransactionContext; uri: AtUri }) {
    // TODO: 削除処理
  }
}
