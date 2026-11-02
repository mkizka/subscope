import { isDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";

import type { IActorQuery } from "../../interfaces/queries/actor-query.js";
import type {
  ILabelRepository,
  LabelData,
} from "../../interfaces/repositories/label-repository.js";

export class IndexLabelUseCase {
  constructor(
    private readonly labelRepository: ILabelRepository,
    private readonly actorQuery: IActorQuery,
    private readonly db: DatabaseClient,
  ) {}

  async execute(label: LabelData) {
    const ctx = { db: this.db };
    if (label.neg) {
      await this.labelRepository.delete({ ctx, label });
      return;
    }
    const did = label.uri.startsWith("at://")
      ? new AtUri(label.uri).host
      : label.uri;
    if (!isDid(did) || !(await this.actorQuery.exists({ ctx, did }))) {
      return;
    }
    await this.labelRepository.upsert({ ctx, label, actorDid: did });
  }
}
