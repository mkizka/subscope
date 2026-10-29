import { asDid } from "@atproto/did";
import { Client, lexToJson, XrpcResponseError } from "@atproto/lex";
import type { AtUri } from "@atproto/syntax";
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

  async fetch(uri: AtUri): Promise<Record> {
    const { body } = await this.getRecord(uri);
    const record = Record.create({
      uri: body.uri,
      cid: required(body.cid),
      json: lexToJson(body.value),
    });
    return record;
  }

  private async getRecord(uri: AtUri) {
    const did = asDid(uri.hostname);
    const { pds } = await this.didResolver.resolve(did);
    const client = new Client(pds);
    try {
      this.metricReporter.increment("fetch_record_request_total");
      return await client.getRecord(uri.collectionSafe, uri.rkey, {
        repo: did,
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
