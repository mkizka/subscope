import { AtUri } from "@atproto/syntax";
import type { Record, TransactionContext } from "@repo/common/domain";
import { Repost } from "@repo/common/domain";

import type { IRecordFetcher } from "../../interfaces/external/record-fetcher.js";
import type { IRecordRepository } from "../../interfaces/repositories/record-repository.js";
import type { IRepostRepository } from "../../interfaces/repositories/repost-repository.js";
import type { ISubscriptionRepository } from "../../interfaces/repositories/subscription-repository.js";
import type { IIndexCollectionService } from "../../interfaces/services/index-collection-service.js";
import type { IndexActorService } from "./index-actor-service.js";
import type { IndexPostService } from "./index-post-service.js";

export class IndexRepostService implements IIndexCollectionService {
  constructor(
    private readonly repostRepository: IRepostRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly recordFetcher: IRecordFetcher,
    private readonly recordRepository: IRecordRepository,
    private readonly indexActorService: IndexActorService,
    private readonly indexPostService: IndexPostService,
  ) {}
  static inject = [
    "repostRepository",
    "subscriptionRepository",
    "recordFetcher",
    "recordRepository",
    "indexActorService",
    "indexPostService",
  ] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const repost = Repost.from(record);

    // subjectのpostを先にインデックス
    await this.indexSubjectPost(ctx, repost);

    await this.repostRepository.upsert({ ctx, repost });
  }

  private async indexSubjectPost(
    ctx: TransactionContext,
    repost: Repost,
  ): Promise<void> {
    try {
      const subjectUri = new AtUri(repost.subjectUri);

      // subjectのpostレコードを取得
      const subjectRecord = await this.recordFetcher.fetch(subjectUri);
      if (!subjectRecord || subjectRecord.collection !== "app.bsky.feed.post") {
        return;
      }

      // actorを先にインデックス
      await this.indexActorService.upsert({
        ctx,
        did: subjectRecord.actorDid,
      });

      // recordをインデックス
      await this.recordRepository.upsert({ ctx, record: subjectRecord });

      // postをインデックス
      await this.indexPostService.upsert({ ctx, record: subjectRecord });
    } catch (error) {
      // エラーが発生してもrepostのインデックスは続行
    }
  }

  async shouldSave({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<boolean> {
    const repost = Repost.from(record);
    // subscribers本人のrepostは保存
    if (await this.subscriptionRepository.isSubscriber(ctx, repost.actorDid)) {
      return true;
    }

    // repost者のフォロワーが1人以上subscribersなら保存
    return await this.subscriptionRepository.hasSubscriberFollower(
      ctx,
      repost.actorDid,
    );
  }
}
