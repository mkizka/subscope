import type { AtUri } from "@atproto/syntax";
import type { AppBskyActorProfile } from "@dawn/client";
import { lexicons } from "@dawn/client";
import type {
  IJobQueue,
  Record,
  TransactionContext,
} from "@dawn/common/domain";
import { Actor, Profile } from "@dawn/common/domain";

import type { IActorRepository } from "../interfaces/actor-repository.js";
import type { IProfileRepository } from "../interfaces/profile-repository.js";

export class IndexProfileService {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly profileRepository: IProfileRepository,
    private readonly jobQueue: IJobQueue,
  ) {}
  static inject = ["actorRepository", "profileRepository", "jobQueue"] as const;

  private assertRecord(
    json: unknown,
  ): asserts json is AppBskyActorProfile.Record {
    lexicons.assertValidRecord("app.bsky.actor.profile", json);
  }

  private createProfile(record: Record) {
    this.assertRecord(record.json);
    return new Profile({
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
  }

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const profile = this.createProfile(record);
    const exists = await this.actorRepository.exists({
      ctx,
      did: profile.did,
    });
    if (!exists) {
      const actor = new Actor({ did: profile.did });
      await Promise.all([
        this.jobQueue.add("resolveDid", profile.did),
        this.actorRepository.createOrUpdate({ ctx, actor }),
      ]);
    }
    await this.profileRepository.createOrUpdate({ ctx, profile });
  }

  async delete({ ctx, uri }: { ctx: TransactionContext; uri: AtUri }) {
    // TODO: 削除処理
  }
}
