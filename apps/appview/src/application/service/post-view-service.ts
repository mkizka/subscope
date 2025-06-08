import type { AtUri } from "@atproto/syntax";
import type { AppBskyFeedDefs } from "@dawn/client/server";
import { required } from "@dawn/common/utils";

import type { IPostRepository } from "../interfaces/post-repository.js";
import type { IRecordRepository } from "../interfaces/record-repository.js";
import type { EmbedViewService } from "./embed-view-service.js";
import type { ProfileViewService } from "./profile-view-service.js";

const asObject = (obj: unknown) => {
  if (typeof obj !== "object" || obj === null) {
    throw new Error("Expected object");
  }
  return obj as { [_ in string]: unknown };
};

export class PostViewService {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly recordRepository: IRecordRepository,
    private readonly embedViewService: EmbedViewService,
    private readonly profileViewService: ProfileViewService,
  ) {}
  static inject = [
    "postRepository",
    "recordRepository",
    "embedViewService",
    "profileViewService",
  ] as const;

  async findPostView(uris: AtUri[]) {
    const posts = await this.postRepository.findByUris(uris);
    const records = await this.recordRepository.findMany(uris);
    const dids = posts.map((post) => post.actorDid);
    const profiles = await this.profileViewService.findProfileViewBasic(dids);

    return posts.map((post) => {
      const record = records.find(
        (r) => r.uri.toString() === post.uri.toString(),
      );
      const profile = profiles.find((profile) => profile.did === post.actorDid);
      const embed = this.embedViewService.toView(post.embed, post.actorDid);
      return {
        $type: "app.bsky.feed.defs#postView",
        uri: post.uri.toString(),
        cid: post.cid,
        author: profile ?? {
          did: post.actorDid,
          handle: "handle.invalid",
        },
        record: asObject(record?.json),
        embed,
        // replyCount?: number
        // repostCount?: number
        // likeCount?: number
        // quoteCount?: number
        indexedAt: required(record?.indexedAt?.toISOString()),
        // viewer?: ViewerState
        // labels?: ComAtprotoLabelDefs.Label[]
        // threadgate?: ThreadgateView
      } satisfies AppBskyFeedDefs.PostView;
    });
  }
}
