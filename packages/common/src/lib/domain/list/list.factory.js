import { faker } from "@faker-js/faker";
import { fakeAtUri, fakeCid, fakeDate, fakeDid } from "../../utils/fake.js";
import { List } from "./list.js";
export function listFactory(params) {
  return new List({
    uri: params?.uri ?? fakeAtUri({ collection: "app.bsky.graph.list" }),
    cid: params?.cid ?? fakeCid(),
    actorDid: params?.actorDid ?? fakeDid(),
    purpose: params?.purpose ?? "app.bsky.graph.defs#curatelist",
    name: params?.name ?? faker.lorem.words(3),
    description: params?.description,
    avatarCid: params?.avatarCid,
    createdAt: params?.createdAt ?? fakeDate(),
    indexedAt: params?.indexedAt ?? fakeDate(),
  });
}
