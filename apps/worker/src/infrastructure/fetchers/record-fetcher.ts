import { asDid } from "@atproto/did";
import { Client, lexToJson, XrpcResponseError } from "@atproto/lex";
import type { AtUri } from "@atproto/syntax";
import { com } from "@repo/client/lex";
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
      uri: response.uri,
      cid: required(response.cid),
      json: lexToJson(response.value),
    });
    return record;
  }

  private async getRecord(uri: AtUri) {
    const did = asDid(uri.hostname);
    const { pds } = await this.didResolver.resolve(did);
    const client = new Client(pds);
    try {
      this.metricReporter.increment("fetch_record_request_total");
      return await client.call(com.atproto.repo.getRecord, {
        repo: did,
        collection: uri.collectionSafe,
        rkey: uri.rkey,
      });
    } catch (error) {
      this.metricReporter.increment("fetch_record_error_total");
      if (
        error instanceof XrpcResponseError &&
        error.error === "RecordNotFound"
      ) {
        throw new RecordFetchError(`Record not found: ${uri.toString()}`);
      }
      throw error;
    }
  }
}
