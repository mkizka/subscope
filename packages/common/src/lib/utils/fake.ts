import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import { faker } from "@faker-js/faker";
import { CID } from "multiformats/cid";
import * as raw from "multiformats/codecs/raw";
import { identity } from "multiformats/hashes/identity";

export const fakeDid = (): Did =>
  asDid(
    `did:plc:${faker.string.alphanumeric({ length: 24, casing: "lower" })}`,
  );

export const fakeHandle = () => faker.internet.domainName();

export const fakeCid = () => {
  const randomData = new Uint8Array(32);
  crypto.getRandomValues(randomData);

  const hash = identity.digest(randomData);
   
  return CID.create(1, raw.code, hash).toString();
};

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
