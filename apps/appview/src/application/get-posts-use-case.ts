import { asDid } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import type { AppBskyFeedDefs } from "@dawn/client";
import type { ILoggerManager } from "@dawn/common/domain";
import { required } from "@dawn/common/utils";

import type { IRecordRepository } from "./interfaces/record-repository.js";
import type { ProfileViewService } from "./service/profile-view-service.js";

const asObject = (obj: unknown) => {
  if (typeof obj !== "object" || obj === null) {
    throw new Error("Expected object");
  }
  return obj;
};

export class GetPostsUseCase {
  private readonly logger;
  constructor(
    private readonly recordRepository: IRecordRepository,
    private readonly profileViewService: ProfileViewService,
    loggerManager: ILoggerManager,
  ) {
    this.logger = loggerManager.createLogger("getPostsUseCase");
  }
  static inject = [
    "recordRepository",
    "profileViewService",
    "loggerManager",
  ] as const;

  async execute(uris: AtUri[]): Promise<AppBskyFeedDefs.PostView[]> {
    const records = await this.recordRepository.findMany(uris);
    this.logger.info(records, "Found records");
    const dids = records.map((record) => asDid(record.uri.host));
    const profiles = await this.profileViewService.findProfileViewBasic(dids);
    this.logger.info(profiles, "Found profiles");
    return records.map((record) => {
      const author = profiles.find(
        (profile) => profile.did === record.uri.host,
      );
      return {
        uri: record.uri.toString(),
        cid: record.cid,
        author: required(author),
        record: asObject(record.json),
        // replyCount?: number
        // repostCount?: number
        // likeCount?: number
        // quoteCount?: number
        indexedAt: required(record.indexedAt?.toISOString()),
        // viewer?: ViewerState
        // labels?: ComAtprotoLabelDefs.Label[]
        // threadgate?: ThreadgateView
      };
    });
  }
}
