import type { Did } from "@atproto/did";
import type { TransactionContext } from "@dawn/common/domain";
import type { Handle } from "@dawn/common/utils";

import type { ActorService } from "./actor-service.js";
import type { BackfillService } from "./backfill-service.js";
import type { ResolveDidService } from "./resolve-did-service.js";

export class IndexActorService {
  constructor(
    private readonly actorService: ActorService,
    private readonly resolveDidService: ResolveDidService,
    private readonly backfillService: BackfillService,
  ) {}
  static inject = [
    "actorService",
    "resolveDidService",
    "backfillService",
  ] as const;

  async upsert({
    ctx,
    did,
    handle,
  }: {
    ctx: TransactionContext;
    did: Did;
    handle?: Handle;
  }): Promise<void> {
    const result = await this.actorService.upsert({ ctx, did, handle });
    if (result.shouldResolveDid) {
      await this.resolveDidService.schedule(did);
    }
    if (result.shouldBackfill) {
      await this.backfillService.schedule({ ctx, did });
    }
  }
}
