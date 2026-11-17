import { type Did, isDid } from "@atproto/did";
import {
  DidResolutionError,
  type IDidResolver,
  type IHandleResolver,
} from "@repo/common/interface";
import { isHandle } from "@repo/common/utils";

import type { RegisterAccountService } from "../../service/sync/register-account-service.js";

export class AccountNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountNotFound";
  }
}

export class AddMemberUseCase {
  constructor(
    private readonly atprotoHandleResolver: IHandleResolver,
    private readonly didResolver: IDidResolver,
    private readonly registerAccountService: RegisterAccountService,
  ) {}

  private async resolveDid(actor: string): Promise<Did> {
    const did =
      isHandle(actor) && !isDid(actor)
        ? await this.atprotoHandleResolver.resolve(actor)
        : actor;
    if (!isDid(did)) {
      throw new AccountNotFoundError(`Account not found: ${actor}`);
    }
    try {
      await this.didResolver.resolve(did);
    } catch (error) {
      if (error instanceof DidResolutionError) {
        throw new AccountNotFoundError(`Account not found: ${actor}`);
      }
      throw error;
    }
    return did;
  }

  async execute({ actor }: { actor: string }): Promise<void> {
    const accountDid = await this.resolveDid(actor);
    await this.registerAccountService.register({
      accountDid,
      inviteCodeRequired: false,
    });
  }
}
