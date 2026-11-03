import { AtUri } from "@atproto/syntax";

import { fakeAtUri, fakeCid } from "../../utils/fake.js";
import type { Record } from "./record.js";

export type RecordFactoryParams = {
  uri: string;
  cid: string;
  json: unknown;
  indexedAt?: Date;
};

export function recordFactory(params?: Partial<RecordFactoryParams>): Record {
  return {
    uri: new AtUri(
      params?.uri ?? fakeAtUri({ collection: "app.bsky.feed.post" }).toString(),
    ),
    cid: params?.cid ?? fakeCid(),
    json: params?.json ?? {},
    indexedAt: params?.indexedAt ?? new Date(),
  };
}
