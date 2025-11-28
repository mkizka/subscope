import { fakeAtUri, fakeCid, fakeDate, fakeDid } from "../../utils/fake.js";
import { Repost, type RepostParams } from "./repost.js";

export function repostFactory(params?: Partial<RepostParams>): Repost {
  return new Repost({
    uri: params?.uri ?? fakeAtUri({ collection: "app.bsky.feed.repost" }),
    cid: params?.cid ?? fakeCid(),
    actorDid: params?.actorDid ?? fakeDid(),
    subjectUri:
      params?.subjectUri ?? fakeAtUri({ collection: "app.bsky.feed.post" }),
    subjectCid: params?.subjectCid ?? fakeCid(),
    createdAt: params?.createdAt ?? fakeDate(),
    indexedAt: params?.indexedAt ?? fakeDate(),
  });
}
