import { Actor } from "@dawn/common/domain";

import type { IDidResolver } from "../application/interfaces/did-resolver.js";

export class ActorService {
  constructor(private readonly didResolver: IDidResolver) {}
  static inject = ["didResolver"] as const;

  // TODO: DBを確認する
  async resolveActor(did: string) {
    const data = await this.didResolver.resolve(did);
    return new Actor({ did, handle: data?.handle });
  }
}
