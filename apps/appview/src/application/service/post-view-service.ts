import { asDid } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import type { AppBskyFeedDefs } from "@dawn/client/server";
import { required } from "@dawn/common/utils";

import type { IRecordRepository } from "../interfaces/record-repository.js";
import type { ProfileViewService } from "./profile-view-service.js";

const asObject = (obj: unknown) => {
  if (typeof obj !== "object" || obj === null) {
    throw new Error("Expected object");
  }
  return obj as { [_ in string]: unknown };
};

export class PostViewService {
  constructor(
    private readonly recordRepository: IRecordRepository,
    private readonly profileViewService: ProfileViewService,
  ) {}
  static inject = ["recordRepository", "profileViewService"] as const;

  async findPostView(uris: AtUri[]) {
    const records = await this.recordRepository.findMany(uris);
    const dids = records.map((record) => asDid(record.uri.host));
    const profiles = await this.profileViewService.findProfileViewBasic(dids);
    return records.map((record) => {
      const profile = profiles.find(
        (profile) => profile.did === record.uri.host,
      );
      return {
        $type: "app.bsky.feed.defs#postView",
        uri: record.uri.toString(),
        cid: record.cid,
        author: profile ?? {
          did: record.uri.host,
          handle: "handle.invalid",
        },
        record: asObject(record.json),
        // replyCount?: number
        // repostCount?: number
        // likeCount?: number
        // quoteCount?: number
        indexedAt: required(record.indexedAt?.toISOString()),
        // viewer?: ViewerState
        // labels?: ComAtprotoLabelDefs.Label[]
        // threadgate?: ThreadgateView
      } satisfies AppBskyFeedDefs.PostView;
    });
  }
}
