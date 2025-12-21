import { asDid } from "@atproto/did";
import { lexToJson } from "@atproto/lexicon";
import type { AtUri } from "@atproto/syntax";
import { RecordNotFoundError } from "@repo/client/api";
import { AtpBaseClient } from "@repo/client/api";
import type { IDidResolver } from "@repo/common/domain";
import type { IMetricReporter } from "@repo/common/domain";
import { Record } from "@repo/common/domain";
import { required } from "@repo/common/utils";

import {
  type IRecordFetcher,
  RecordFetchError,
} from "../../application/interfaces/external/record-fetcher.js";

export class RecordFetcher implements IRecordFetcher {
  constructor(
    private readonly didResolver: IDidResolver,
    private readonly metricReporter: IMetricReporter,
  ) {}
  static inject = ["didResolver", "metricReporter"] as const;

  async fetch(uri: AtUri): Promise<Record> {
    const response = await this.getRecord(uri);
    const record = Record.create({
      uri: response.data.uri,
      cid: required(response.data.cid),
      json: lexToJson(response.data.value),
    });
    return record;
  }

  private async getRecord(uri: AtUri) {
    const did = asDid(uri.hostname);
    const { pds } = await this.didResolver.resolve(did);
    const client = new AtpBaseClient(pds);
    try {
      this.metricReporter.increment("fetch_record_request_total");
      return await client.com.atproto.repo.getRecord({
        repo: did,
        collection: uri.collection,
        rkey: uri.rkey,
      });
    } catch (error) {
      this.metricReporter.increment("fetch_record_error_total");
      if (error instanceof RecordNotFoundError) {
        throw new RecordFetchError(`Record not found: ${uri.toString()}`);
      }
      throw error;
    }
  }
}
