import { asDid } from "@atproto/did";
import { Client, lexToJson, XrpcResponseError } from "@atproto/lex";
import type { AtUri } from "@atproto/syntax";
import type { IDidResolver, IMetricReporter } from "@repo/common/domain";
import { DidNotFoundError, Record } from "@repo/common/domain";
import { required } from "@repo/common/utils";

import {
  type IRecordFetcher,
  RecordFetchError,
} from "../../application/interfaces/external/record-fetcher.js";

const UNRECOVERABLE_ERRORS = new Set([
  "RecordNotFound",
  "RepoNotFound",
  "RepoDeactivated",
  "RepoTakendown",
]);

const isUnrecoverable = (error: unknown) =>
  error instanceof DidNotFoundError ||
  (error instanceof XrpcResponseError &&
    (UNRECOVERABLE_ERRORS.has(error.error) ||
      error.message.startsWith("Could not find repo")));

export class RecordFetcher implements IRecordFetcher {
  constructor(
    private readonly didResolver: IDidResolver,
    private readonly metricReporter: IMetricReporter,
  ) {}

  async fetch(uri: AtUri): Promise<Record> {
    const { body } = await this.getRecord(uri).catch((error: unknown) => {
      if (isUnrecoverable(error)) {
        throw new RecordFetchError(
          `Failed to fetch ${uri.toString()}: ${String(error)}`,
        );
      }
      throw error;
    });
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
      throw error;
    }
  }
}
