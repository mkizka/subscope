import { isDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { DatabaseClient, JobData } from "@repo/common/domain";

import type { IActorRepository } from "../../interfaces/repositories/actor-repository.js";
import type { ILabelRepository } from "../../interfaces/repositories/label-repository.js";

export class IndexLabelUseCase {
  constructor(
    private readonly labelRepository: ILabelRepository,
    private readonly actorRepository: IActorRepository,
    private readonly db: DatabaseClient,
  ) {}

  async execute(label: JobData["label"]) {
    const ctx = { db: this.db };
    if (label.neg) {
      await this.labelRepository.delete({ ctx, label });
      return;
    }
    const did = label.uri.startsWith("at://")
      ? new AtUri(label.uri).host
      : label.uri;
    if (!isDid(did) || !(await this.actorRepository.exists({ ctx, did }))) {
      return;
    }
    await this.labelRepository.upsert({ ctx, label, actorDid: did });
  }
}
