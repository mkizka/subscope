import { fakeAtUri, fakeCid } from "../../utils/fake.js";
import { Record } from "./record.js";
export function recordFactory(params) {
  return Record.reconstruct({
    uri:
      params?.uri ?? fakeAtUri({ collection: "app.bsky.feed.post" }).toString(),
    cid: params?.cid ?? fakeCid(),
    json: params?.json ?? {},
    indexedAt: params?.indexedAt ?? new Date(),
  });
}
