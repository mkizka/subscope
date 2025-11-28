import { fakeAtUri, fakeCid, fakeDate, fakeDid } from "../../utils/fake.js";
import { Like, type LikeParams } from "./like.js";

export function likeFactory(params?: Partial<LikeParams>): Like {
  return new Like({
    uri: params?.uri ?? fakeAtUri({ collection: "app.bsky.feed.like" }),
    cid: params?.cid ?? fakeCid(),
    actorDid: params?.actorDid ?? fakeDid(),
    subjectUri:
      params?.subjectUri ?? fakeAtUri({ collection: "app.bsky.feed.post" }),
    subjectCid: params?.subjectCid ?? fakeCid(),
    createdAt: params?.createdAt ?? fakeDate(),
    indexedAt: params?.indexedAt ?? fakeDate(),
  });
}
