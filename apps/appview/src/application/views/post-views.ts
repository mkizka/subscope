import type { $Typed } from "@atproto/lex";
import { asAtUriString, AtUri, toDatetimeString } from "@atproto/syntax";
import type * as AppBskyFeedDefs from "@repo/client/app/bsky/feed/defs";
import { listRule } from "@repo/client/app/bsky/feed/threadgate";
import { mention } from "@repo/client/app/bsky/richtext/facet";
import { validateRecord } from "@repo/common/utils";

import type { RecordDto } from "../dto/record-dto.js";
import { gateUri } from "../utils/gate-uri.js";
import { asLexMap } from "../utils/lex.js";
import type { EmbedViews } from "./embed-views.js";
import { toLabelViews, toSelfLabelViews } from "./label-views.js";
import type { ListViews } from "./list-views.js";
import type { ProfileViews } from "./profile-views.js";
import type { ViewContext } from "./view-context.js";

export class PostViews {
  constructor(
    private readonly deps: {
      profileViews: ProfileViews;
      embedViews: EmbedViews;
      listViews: ListViews;
    },
  ) {}

  async postView(
    uri: string,
    ctx: ViewContext,
  ): Promise<$Typed<AppBskyFeedDefs.PostView> | undefined> {
    const post = await ctx.post(uri);
    if (!post) {
      return undefined;
    }
    const rootUri = post.replyRootUri ?? uri;
    const [record, author, stats, viewer, embed, gate, postgate, labels] =
      await Promise.all([
        ctx.record(uri),
        this.deps.profileViews.basic(post.accountDid, ctx),
        ctx.stats(uri),
        ctx.viewerPostState(uri),
        this.deps.embedViews.embedView({ post, ctx }),
        ctx.record(gateUri(rootUri, "app.bsky.feed.threadgate")),
        ctx.record(gateUri(uri, "app.bsky.feed.postgate")),
        ctx.labelsOf(uri),
      ]);
    if (!record || !author) {
      return undefined;
    }
    const [replyDisabled, threadgate, pinnedPost] = await Promise.all([
      post.violatesThreadgate ||
        (gate && this.replyDisabled({ rootUri, gate, ctx })),
      gate && rootUri === uri ? this.threadgateView(gate, ctx) : undefined,
      ctx.viewer.viewerDid
        ? this.deps.profileViews.pinnedPost(ctx.viewer.viewerDid, ctx)
        : undefined,
    ]);
    return {
      $type: "app.bsky.feed.defs#postView",
      uri: post.uri,
      cid: record.cid,
      author,
      record: asLexMap(record.json),
      embed,
      replyCount: stats?.replyCount ?? 0,
      repostCount: stats?.repostCount ?? 0,
      likeCount: stats?.likeCount ?? 0,
      quoteCount: stats?.quoteCount ?? 0,
      viewer: {
        repost: viewer.repost?.uri,
        like: viewer.like?.uri,
        pinned: pinnedPost?.uri === uri,
        replyDisabled,
        embeddingDisabled:
          postgate &&
          this.embeddingDisabled({
            authorDid: post.accountDid,
            postgate,
            ctx,
          }),
      },
      threadgate,
      labels: [...toLabelViews(labels), ...toSelfLabelViews(record)],
      indexedAt: toDatetimeString(post.indexedAt),
    };
  }

  private async threadgateView(
    gate: RecordDto,
    ctx: ViewContext,
  ): Promise<AppBskyFeedDefs.ThreadgateView> {
    const { allow } = validateRecord("app.bsky.feed.threadgate", gate);
    const lists = await Promise.all(
      (allow ?? [])
        .filter((rule) => listRule.isTypeOf(rule))
        .map((rule) => this.deps.listViews.basic(rule.list, ctx)),
    );
    return {
      uri: asAtUriString(gate.uri),
      cid: gate.cid,
      record: asLexMap(gate.json),
      lists: lists.filter((list) => list !== undefined),
    };
  }

  private embeddingDisabled({
    authorDid,
    postgate,
    ctx,
  }: {
    authorDid: string;
    postgate: RecordDto;
    ctx: ViewContext;
  }) {
    const viewerDid = ctx.viewer.viewerDid;
    if (!viewerDid) {
      return undefined;
    }
    const { embeddingRules } = validateRecord(
      "app.bsky.feed.postgate",
      postgate,
    );
    return (
      viewerDid !== authorDid &&
      !!embeddingRules?.some(
        (rule) => rule.$type === "app.bsky.feed.postgate#disableRule",
      )
    );
  }

  private async replyDisabled({
    rootUri,
    gate,
    ctx,
  }: {
    rootUri: string;
    gate: RecordDto;
    ctx: ViewContext;
  }) {
    const viewerDid = ctx.viewer.viewerDid;
    if (!viewerDid) {
      return undefined;
    }
    const ownerDid = new AtUri(rootUri).did;
    const { allow } = validateRecord("app.bsky.feed.threadgate", gate);
    if (viewerDid === ownerDid || !allow) {
      return false;
    }
    const has = (type: string) => allow.some((rule) => rule.$type === type);
    const [root, { following, followedBy }, listItems] = await Promise.all([
      ctx.record(rootUri),
      ctx.viewerState(ownerDid),
      Promise.all(
        allow
          .filter((rule) => listRule.isTypeOf(rule))
          .map((rule) => ctx.viewerListItem(rule.list)),
      ),
    ]);
    const mentioned = root
      ? validateRecord("app.bsky.feed.post", root).facets?.some((facet) =>
          facet.features.some(
            (feature) => mention.isTypeOf(feature) && feature.did === viewerDid,
          ),
        )
      : false;
    if (
      (has("app.bsky.feed.threadgate#mentionRule") && mentioned) ||
      (has("app.bsky.feed.threadgate#followingRule") && followedBy) ||
      (has("app.bsky.feed.threadgate#followerRule") && following) ||
      listItems.some(Boolean)
    ) {
      return false;
    }
    return true;
  }
}
