import type { AtUri } from "@atproto/syntax";
import type { AfterCommitContext, JobPriority } from "@repo/common/interface";
import {
  asSupportedCollection,
  RecordValidationError,
} from "@repo/common/utils";

import type { Author } from "../dto/author.js";
import type { Origin } from "../dto/origin.js";
import type { Record } from "../dto/record.js";
import type { IRegistrationQuery } from "../interfaces/queries/registration-query.js";
import type { INotificationRepository } from "../interfaces/repositories/notification-repository.js";
import type { IRecordRepository } from "../interfaces/repositories/record-repository.js";
import type { ITrackingRepository } from "../interfaces/repositories/tracking-repository.js";
import type { FetchPolicyService } from "./fetch-policy-service.js";
import type { IndexAccountService } from "./index-account-service.js";
import type { IndexJobService } from "./index-job-service.js";
import type { CollectionIndexers } from "./indexer/collection-indexer.js";
import type { NotificationPolicyService } from "./notification-policy-service.js";

export class IndexRecordService {
  constructor(
    private readonly indexers: CollectionIndexers,
    private readonly recordRepository: IRecordRepository,
    private readonly notificationRepository: INotificationRepository,
    private readonly registrationQuery: IRegistrationQuery,
    private readonly trackingRepository: ITrackingRepository,
    private readonly indexAccountService: IndexAccountService,
    private readonly fetchPolicyService: FetchPolicyService,
    private readonly notificationPolicyService: NotificationPolicyService,
    private readonly indexJobService: IndexJobService,
  ) {}

  async index({
    ctx,
    record,
    origin,
    priority,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    origin: Origin;
    priority: JobPriority;
  }): Promise<void> {
    const indexer = this.indexerFor(record);
    // Postgresには`\u0000`を含む文字列を保存できないため
    if (JSON.stringify(record.json).includes("\\u0000")) {
      throw new RecordValidationError("null character", record.uri);
    }
    const parsed = indexer.parse(record);
    const author = await this.authorOf(ctx, record);
    const shouldStore =
      (await indexer.shouldStore?.({ ctx, parsed, author, origin })) ?? true;
    if (!shouldStore) {
      return;
    }
    await this.indexAccountService.upsert({ ctx, did: author.did });
    await this.recordRepository.save({ ctx, record });
    await indexer.save?.({ ctx, parsed });

    const notifications = await this.notificationPolicyService.notificationsFor(
      { ctx, origin, indexer, parsed },
    );
    const pushes = await this.notificationRepository.save({
      ctx,
      notifications,
    });

    this.indexJobService.schedule({
      ctx,
      priority,
      fetch: await this.fetchPolicyService.targetsFor({
        ctx,
        origin,
        records: indexer.recordsToFetch?.({ parsed, author, origin }) ?? [],
        accounts: [
          author.did,
          ...(indexer.accountsToFetch?.({ parsed, author }) ?? []),
        ],
      }),
      stats: {
        posts: indexer.postsToAggregate?.(parsed) ?? [],
        accounts: indexer.accountsToAggregate?.(parsed) ?? [],
      },
      reposToSync: indexer.reposToSync?.({ parsed, author }) ?? [],
      pushes,
    });
  }

  async delete({ ctx, uri }: { ctx: AfterCommitContext; uri: AtUri }) {
    const existingRecord = await this.recordRepository.find({ ctx, uri });

    await this.recordRepository.delete({ ctx, uri });

    if (!existingRecord) {
      return;
    }
    const indexer = this.indexerFor(existingRecord);
    const parsed = indexer.parse(existingRecord);
    const author = await this.authorOf(ctx, existingRecord);
    this.indexJobService.schedule({
      ctx,
      priority: "high",
      stats: {
        posts: indexer.postsToAggregate?.(parsed) ?? [],
        accounts: indexer.accountsToAggregate?.(parsed) ?? [],
      },
      reposToSync: indexer.reposToSync?.({ parsed, author }) ?? [],
    });
  }

  private indexerFor(record: Record) {
    return this.indexers[asSupportedCollection(record.uri.collection)];
  }

  private async authorOf(
    ctx: AfterCommitContext,
    record: Record,
  ): Promise<Author> {
    const did = record.uri.did;
    return {
      did,
      isMember: await this.registrationQuery.isRegistered(ctx, did),
      tracking: await this.trackingRepository.find({ ctx, did }),
    };
  }
}
