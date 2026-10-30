import { fakeAtUri, fakeCid, fakeDate, fakeDid } from "../../utils/fake.js";
import { ListItem } from "./list-item.js";
export function listItemFactory(params) {
  return new ListItem({
    uri: params?.uri ?? fakeAtUri({ collection: "app.bsky.graph.listitem" }),
    cid: params?.cid ?? fakeCid(),
    actorDid: params?.actorDid ?? fakeDid(),
    listUri:
      params?.listUri ?? fakeAtUri({ collection: "app.bsky.graph.list" }),
    subjectDid: params?.subjectDid ?? fakeDid(),
    createdAt: params?.createdAt ?? fakeDate(),
    indexedAt: params?.indexedAt ?? fakeDate(),
  });
}
