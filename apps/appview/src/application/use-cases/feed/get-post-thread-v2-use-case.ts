import type { Did } from "@atproto/did";
import {
  type ThreadViewPost,
  threadViewPost,
} from "@repo/client/app/bsky/feed/defs";
import type * as AppBskyUnspeccedGetPostThreadV2 from "@repo/client/app/bsky/unspecced/getPostThreadV2";

import type { ResolvedAtUri } from "../../../domain/models/at-uri.js";
import {
  type GetPostThreadUseCase,
  PostNotFoundError,
} from "./get-post-thread-use-case.js";

type ThreadItem = AppBskyUnspeccedGetPostThreadV2.ThreadItem;

const MAX_PARENT_HEIGHT = 1000;

export class GetPostThreadV2UseCase {
  constructor(private readonly getPostThreadUseCase: GetPostThreadUseCase) {}

  async execute(params: {
    uri: ResolvedAtUri;
    above: boolean;
    below: number;
    branchingFactor: number;
    viewerDid?: Did;
  }): Promise<AppBskyUnspeccedGetPostThreadV2.$OutputBody> {
    const anchorUri = params.uri.getValue().toString();
    try {
      const { thread } = await this.getPostThreadUseCase.execute({
        uri: params.uri,
        depth: params.below,
        parentHeight: params.above ? MAX_PARENT_HEIGHT : 0,
        replyLimits: { nested: params.branchingFactor },
        viewerDid: params.viewerDid,
      });
      if (!threadViewPost.matches(thread)) throw new Error("Unexpected thread");
      return { thread: this.flatten(thread), hasOtherReplies: false };
    } catch (error) {
      if (!(error instanceof PostNotFoundError)) throw error;
      return {
        thread: [
          {
            uri: anchorUri,
            depth: 0,
            value: { $type: "app.bsky.unspecced.defs#threadItemNotFound" },
          },
        ],
        hasOtherReplies: false,
      };
    }
  }

  private flatten(anchor: ThreadViewPost): ThreadItem[] {
    const items: ThreadItem[] = [];
    for (
      let p = anchor.parent, depth = -1;
      threadViewPost.matches(p);
      p = p.parent, depth--
    ) {
      items.unshift(this.toItem(p, depth, 0));
    }
    const visit = (node: ThreadViewPost, depth: number) => {
      const replies = (node.replies ?? []).filter((r) =>
        threadViewPost.matches(r),
      );
      const moreReplies = Math.max(
        (node.post.replyCount ?? 0) - replies.length,
        0,
      );
      items.push(this.toItem(node, depth, moreReplies));
      for (const reply of replies) visit(reply, depth + 1);
    };
    visit(anchor, 0);
    return items;
  }

  private toItem(
    node: ThreadViewPost,
    depth: number,
    moreReplies: number,
  ): ThreadItem {
    return {
      uri: node.post.uri,
      depth,
      value: {
        $type: "app.bsky.unspecced.defs#threadItemPost",
        post: node.post,
        moreParents: false,
        moreReplies,
        opThread: false,
        hiddenByThreadgate: false,
        mutedByViewer: false,
      },
    };
  }
}
