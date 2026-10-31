import type { Did } from "@atproto/did";

import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

const messages = {
  AccountTakedown: "Account has been suspended",
  AccountDeactivated: "Account is deactivated",
};

export class AccountHiddenError extends Error {
  constructor(reason: keyof typeof messages) {
    super(messages[reason]);
    this.name = reason;
  }
}

export class GetProfileUseCase {
  constructor(
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(did: Did, viewerDid?: Did | null) {
    const ctx = this.viewContextFactory.create({ viewerDid });
    const reason = await ctx.hiddenReason(did);
    if (reason) {
      throw new AccountHiddenError(reason);
    }
    return await this.profileViews.detailed(did, ctx);
  }
}
