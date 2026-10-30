import type { Did } from "@atproto/did";
import { Client } from "@atproto/lex";
import * as queryLabels from "@repo/client/lex/com/atproto/label/queryLabels";
import type { JobData } from "@repo/common/domain";

import type { ILabelFetcher } from "../../application/interfaces/external/label-fetcher.js";

export class LabelFetcher implements ILabelFetcher {
  private readonly client;

  constructor(moderationUrl: string) {
    this.client = new Client(moderationUrl);
  }

  async fetchByActor(did: Did) {
    const labels: JobData["label"][] = [];
    let cursor: string | undefined;
    do {
      const res = await this.client.call(queryLabels, {
        uriPatterns: [did, `at://${did}/*`],
        limit: 250,
        cursor,
      });
      for (const { src, uri, cid, val, neg, cts, exp } of res.labels) {
        labels.push({ src, uri, cid, val, neg, cts, exp });
      }
      cursor = res.cursor;
    } while (cursor);
    return labels;
  }
}
