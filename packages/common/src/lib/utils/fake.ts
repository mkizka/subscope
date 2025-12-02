import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import { faker } from "@faker-js/faker";

export const fakeDid = (): Did =>
  asDid(
    `did:plc:${faker.string.alphanumeric({ length: 24, casing: "lower" })}`,
  );

export const fakeHandle = () => faker.internet.domainName();

export const fakeCid = () =>
  `bafkrei${faker.string.alphanumeric({ length: 52, casing: "lower" })}`;

export const fakeAtUri = ({
  did,
  collection,
}: {
  did?: string;
  collection: string;
}) =>
  AtUri.make(
    did ?? fakeDid(),
    collection,
    faker.string.alphanumeric({ length: 13, casing: "lower" }),
  );

export const fakeText = () => faker.lorem.sentence();

export const fakeDate = () => faker.date.recent();

export const fakeFutureDate = () => faker.date.future();
