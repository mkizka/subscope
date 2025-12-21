import { AtUri } from "@atproto/syntax";

import {
  fakeAtUri,
  fakeCid,
  fakeDate,
  fakeDid,
  fakeText,
} from "../../utils/fake.js";
import { recordFactory } from "../record/record.factory.js";
import { Post, type PostParams } from "./post.js";

export function postFactory(params?: Partial<PostParams>) {
  const normalizeRef = (
    ref: { uri: AtUri | string; cid: string } | null | undefined,
  ) => {
    if (!ref) return null;
    return {
      uri: new AtUri(ref.uri.toString()),
      cid: ref.cid,
    };
  };

  const post = new Post({
    uri: params?.uri ?? fakeAtUri({ collection: "app.bsky.feed.post" }),
    cid: params?.cid ?? fakeCid(),
    actorDid: params?.actorDid ?? fakeDid(),
    text: params?.text ?? fakeText(),
    replyRoot: normalizeRef(params?.replyRoot),
    replyParent: normalizeRef(params?.replyParent),
    langs: params?.langs ?? [],
    embed: params?.embed ?? null,
    createdAt: params?.createdAt ?? fakeDate(),
    indexedAt: params?.indexedAt ?? fakeDate(),
  });

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
