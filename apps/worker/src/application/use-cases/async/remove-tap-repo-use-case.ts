import type { Did } from "@atproto/did";
import type { ITapClient } from "@repo/common/domain";

export class RemoveTapRepoUseCase {
  constructor(private readonly tapClient: ITapClient) {}
  static inject = ["tapClient"] as const;

  async execute(did: Did) {
    await this.tapClient.removeRepo(did);
  }
}
