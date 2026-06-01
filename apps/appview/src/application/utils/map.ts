import { asDid, type Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

export const toMap = <Key, Value>(
  items: Value[],
  keyFn: (item: Value) => Key,
): Map<Key, Value> => {
  return new Map(items.map((item) => [keyFn(item), item]));
};

export const toMapByUri = <T extends { uri: AtUri | string }>(
  items: T[],
): Map<string, T> => {
  return toMap(items, (item) => item.uri.toString());
};

export const toMapByDid = <T extends { did: string }>(
  items: T[],
): Map<Did, T> => {
  return toMap(items, (item) => asDid(item.did));
};

export const toMapBySubjectUri = <T extends { subjectUri: AtUri }>(
  items: T[],
): Map<string, T> => {
  return toMap(items, (item) => item.subjectUri.toString());
};
