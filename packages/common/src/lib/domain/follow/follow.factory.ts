import { fakeAtUri, fakeCid, fakeDate, fakeDid } from "../../utils/fake.js";
import { Follow, type FollowParams } from "./follow.js";

export function followFactory(params?: Partial<FollowParams>): Follow {
  return new Follow({
    uri: params?.uri ?? fakeAtUri({ collection: "app.bsky.graph.follow" }),
    cid: params?.cid ?? fakeCid(),
    actorDid: params?.actorDid ?? fakeDid(),
    subjectDid: params?.subjectDid ?? fakeDid(),
    createdAt: params?.createdAt ?? fakeDate(),
    indexedAt: params?.indexedAt ?? fakeDate(),
  });
}
