import type { AfterCommitContext } from "@repo/common/interface";

import type { Origin } from "../../../domain/origin.js";
import type { Record } from "../../dto/record.js";

export interface IRecordIndexer {
  index: (params: {
    ctx: AfterCommitContext;
    record: Record;
    origin: Origin;
  }) => Promise<void>;
  afterDelete?: (params: {
    ctx: AfterCommitContext;
    record: Record;
  }) => void | Promise<void>;
}
