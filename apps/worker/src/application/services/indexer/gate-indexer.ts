import { AtUri } from "@atproto/syntax";
import type { AfterCommitContext } from "@repo/common/interface";
import { validateRecord } from "@repo/common/utils";

import type { Origin } from "../../../domain/origin.js";
import type { Record } from "../../dto/record.js";
import type { IRecordIndexer } from "../../interfaces/services/record-indexer.js";
import type { RecordSaveService } from "../record-save-service.js";

export class GateIndexer implements IRecordIndexer {
  constructor(private readonly recordSaveService: RecordSaveService) {}

  async index({
    ctx,
    record,
    origin,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    origin: Origin;
  }) {
    const gate = validateRecord(
      record.uri.collection === "app.bsky.feed.threadgate"
        ? "app.bsky.feed.threadgate"
        : "app.bsky.feed.postgate",
      record,
    );
    const postUri = new AtUri(gate.post);
    const isGateOfOwnPost =
      postUri.host === record.uri.did &&
      postUri.collection === "app.bsky.feed.post" &&
      postUri.rkey === record.uri.rkey;
    if (!isGateOfOwnPost) {
      return;
    }
    await this.recordSaveService.save({ ctx, record, origin });
  }
}
