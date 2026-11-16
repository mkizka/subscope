import type { Did } from "@atproto/did";

import type { ResolveDidService } from "../../services/resolve-did-service.js";

export class ResolveDidUseCase {
  constructor(private readonly resolveDidService: ResolveDidService) {}

  async execute(did: Did) {
    await this.resolveDidService.resolve(did);
  }
}
