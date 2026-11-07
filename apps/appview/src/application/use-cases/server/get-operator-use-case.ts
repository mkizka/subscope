import type * as MeSubscoServerGetOperator from "@repo/client/me/subsco/server/getOperator";

import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetOperatorUseCase {
  constructor(
    private readonly registrationQuery: IRegistrationQuery,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(): Promise<MeSubscoServerGetOperator.$OutputBody> {
    const did = await this.registrationQuery.findFirstAdminDid();
    if (!did) {
      return {};
    }
    const operator = await this.profileViews.view(
      did,
      this.viewContextFactory.create(),
    );
    return { operator };
  }
}
