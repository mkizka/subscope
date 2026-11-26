import type { AfterCommitContext } from "@repo/common/interface";

import type { Record } from "../../domain/record.js";
import type { IRecordRepository } from "../interfaces/repositories/record-repository.js";
import type { IndexAccountService } from "./index-account-service.js";

export class RecordSaveService {
  constructor(
    private readonly recordRepository: IRecordRepository,
    private readonly indexAccountService: IndexAccountService,
  ) {}

  async save({ ctx, record }: { ctx: AfterCommitContext; record: Record }) {
    const did = record.uri.did;
    await this.indexAccountService.upsert({ ctx, did });
    await this.recordRepository.save({ ctx, record });
  }
}
