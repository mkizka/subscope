import { fakeAtUri, fakeCid, fakeDate, fakeDid } from "../../utils/fake.js";
import { FeedItem, type FeedItemParams } from "./feed-item.js";

export function feedItemFactory(params?: Partial<FeedItemParams>): FeedItem {
  return new FeedItem({
    uri: params?.uri ?? fakeAtUri({ collection: "app.bsky.feed.post" }),
    cid: params?.cid ?? fakeCid(),
    type: params?.type ?? "post",
    subjectUri: params?.subjectUri ?? null,
    actorDid: params?.actorDid ?? fakeDid(),
    sortAt: params?.sortAt ?? fakeDate(),
  });
}
