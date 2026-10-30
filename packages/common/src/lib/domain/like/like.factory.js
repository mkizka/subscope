import { fakeAtUri, fakeCid, fakeDate, fakeDid } from "../../utils/fake.js";
import { Like } from "./like.js";
export function likeFactory(params) {
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
