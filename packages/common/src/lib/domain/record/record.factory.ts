import { faker } from "@faker-js/faker";

import { Record } from "./record.js";

export type RecordFactoryParams = {
  uri: string;
  cid: string;
  json: unknown;
  indexedAt?: Date;
};

export function recordFactory(params: RecordFactoryParams): Record {
  return Record.fromJson({
    uri: params.uri,
    cid: params.cid,
    json: params.json,
    indexedAt: params.indexedAt ?? faker.date.recent(),
  });
}
