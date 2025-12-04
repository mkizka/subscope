import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import { faker } from "@faker-js/faker";

export const fakeDid = (): Did =>
  asDid(
    `did:plc:${faker.string.alphanumeric({ length: 24, casing: "lower" })}`,
  );

export const fakeHandle = () => faker.internet.domainName();

const validCids = [
  "bafkreihwsnuregfeqh263vgdathcprnbvatyat6h6mu7ipjhhodcdbyhoy",
  "bafkreie5cvv4h45feadgeuwhbcutmh6t2ceseocckahdoe6uat64zmz454",
  "bafkreifoybqitd5ygzaeky7hfhqx5nqx5rbhx2qzrytenfhf2c6vrqm654",
  "bafkreig5pmj5xqz6ahq3wv5p2k23jiqkhjhazn6cj3dwzgvjmtdma4r5yu",
  "bafkreiaiq7e3vjkpgncfmdjmb5j62zvn5gglzm4zvwy453pbemx4xqvdwi",
];

export const fakeCid = () =>
  validCids[Math.floor(Math.random() * validCids.length)];

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
