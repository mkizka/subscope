import type { AtUri } from "@atproto/syntax";
import { fakeAtUri, fakeCid, fakeDate, fakeText } from "@repo/common/test";

import { Post } from "./post.js";
import { recordFactory } from "./record.factory.js";

type PostParams = {
  uri?: AtUri | string;
  cid?: string;
  replyParent?: { uri: AtUri | string; cid: string };
};

export function postFactory(params: PostParams = {}) {
  const parent = params.replyParent && {
    uri: params.replyParent.uri.toString(),
    cid: params.replyParent.cid,
  };
  const record = recordFactory({
    uri: (
      params.uri ?? fakeAtUri({ collection: "app.bsky.feed.post" })
    ).toString(),
    cid: params.cid ?? fakeCid(),
    json: {
      $type: "app.bsky.feed.post",
      text: fakeText(),
      reply: parent && { root: parent, parent },
      createdAt: fakeDate().toISOString(),
    },
  });

  return { post: Post.fromRecord(record), record };
}
