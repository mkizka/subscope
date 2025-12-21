import { fakeAtUri, fakeCid } from "../../utils/fake.js";
import { Record } from "./record.js";

export type RecordFactoryParams = {
  uri: string;
  cid: string;
  json: unknown;
  indexedAt?: Date;
};

export function recordFactory(params?: Partial<RecordFactoryParams>): Record {
  return Record.reconstruct({
    uri:
      params?.uri ?? fakeAtUri({ collection: "app.bsky.feed.post" }).toString(),
    cid: params?.cid ?? fakeCid(),
    json: params?.json ?? {},
    indexedAt: params?.indexedAt ?? new Date(),
  });
}
