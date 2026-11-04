import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import {
  fakeAtUri,
  fakeCid,
  fakeDate,
  fakeDid,
  fakeText,
} from "@repo/common/test";

import type { Post } from "./post.js";
import { recordFactory } from "./record.factory.js";

type PostParams = Partial<
  Omit<Post, "uri" | "accountDid" | "replyRoot" | "replyParent"> & {
    uri: AtUri | string;
    accountDid: string;
    replyRoot: { uri: AtUri | string; cid: string } | null;
    replyParent: { uri: AtUri | string; cid: string } | null;
  }
>;

const toRef = (ref?: { uri: AtUri | string; cid: string } | null) =>
  ref ? { uri: new AtUri(ref.uri.toString()), cid: ref.cid } : null;

export function postFactory(params: PostParams = {}) {
  const post: Post = {
    uri: new AtUri(
      (
        params.uri ?? fakeAtUri({ collection: "app.bsky.feed.post" })
      ).toString(),
    ),
    cid: params.cid ?? fakeCid(),
    accountDid: asDid(params.accountDid ?? fakeDid()),
    text: params.text ?? fakeText(),
    replyRoot: toRef(params.replyRoot),
    replyParent: toRef(params.replyParent),
    langs: params.langs ?? [],
    embed: params.embed ?? null,
    createdAt: params.createdAt ?? fakeDate(),
    indexedAt: params.indexedAt ?? fakeDate(),
  };

  const record = recordFactory({
    uri: post.uri.toString(),
    cid: post.cid,
    json: {
      $type: "app.bsky.feed.post",
      text: post.text,
      createdAt: post.createdAt.toISOString(),
    },
  });

  return { post, record };
}
