import type { TransactionContext } from "@repo/common/interface";

import type { Author } from "../../dto/author.js";
import { type Follow, parseFollow } from "../../dto/follow.js";
import type { Record } from "../../dto/record.js";
import { getSortAt } from "../../dto/sort-at.js";
import type { IFollowRepository } from "../../interfaces/repositories/follow-repository.js";
import type { Notification } from "../../interfaces/repositories/notification-repository.js";
import type { IndexAccountService } from "../index-account-service.js";
import type { ICollectionIndexer } from "./collection-indexer.js";

export class FollowIndexer implements ICollectionIndexer<Follow> {
  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly indexAccountService: IndexAccountService,
  ) {}

  parse(record: Record) {
    return parseFollow(record);
  }

  async save({ ctx, parsed }: { ctx: TransactionContext; parsed: Follow }) {
    await this.indexAccountService.upsert({ ctx, did: parsed.subjectDid });
    await this.followRepository.save({ ctx, follow: parsed });
  }

  accountsToFetch({ parsed, author }: { parsed: Follow; author: Author }) {
    return author.isMember ? [parsed.subjectDid] : [];
  }

  notificationCandidates({ parsed }: { parsed: Follow }): Notification[] {
    return [
      {
        recordUri: parsed.uri,
        recipientDid: parsed.subjectDid,
        authorDid: parsed.accountDid,
        reason: "follow",
        reasonSubject: null,
        sortAt: getSortAt(parsed),
      },
    ];
  }

  accountsToAggregate(parsed: Follow) {
    return [parsed.accountDid, parsed.subjectDid];
  }

  reposToSync({ parsed, author }: { parsed: Follow; author: Author }) {
    return author.isMember ? [parsed.subjectDid] : [];
  }
}
