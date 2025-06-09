import type { Did } from "@atproto/did";
import type { IDidResolver } from "@dawn/common/domain";

export class ResolvePdsService {
  static inject = ["didResolver"] as const;

  constructor(private didResolver: IDidResolver) {}

  async resolve(did: Did): Promise<string> {
    const resolved = await this.didResolver.resolve(did);
    const pdsUrl = resolved.pds.toString();

    return pdsUrl;
  }
}
