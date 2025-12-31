import type { Did } from "@atproto/did";
import type { ITapClient } from "@repo/common/domain";

export class AddTapRepoUseCase {
  constructor(private readonly tapClient: ITapClient) {}
  static inject = ["tapClient"] as const;

  async execute(did: Did) {
    await this.tapClient.addRepo(did);
  }
}
