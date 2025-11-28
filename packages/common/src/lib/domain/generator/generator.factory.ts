import { faker } from "@faker-js/faker";

import { fakeAtUri, fakeCid, fakeDate, fakeDid } from "../../utils/fake.js";
import { Generator, type GeneratorParams } from "./generator.js";

export function generatorFactory(params?: Partial<GeneratorParams>): Generator {
  return new Generator({
    uri: params?.uri ?? fakeAtUri({ collection: "app.bsky.feed.generator" }),
    cid: params?.cid ?? fakeCid(),
    actorDid: params?.actorDid ?? fakeDid(),
    did: params?.did ?? fakeDid(),
    displayName: params?.displayName ?? faker.lorem.words(3),
    description: params?.description,
    avatarCid: params?.avatarCid,
    createdAt: params?.createdAt ?? fakeDate(),
    indexedAt: params?.indexedAt ?? fakeDate(),
  });
}
