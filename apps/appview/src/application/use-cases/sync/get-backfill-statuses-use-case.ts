import type { Did } from "@atproto/did";

import type { BackfillStatus } from "../../../domain/models/account.js";
import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";

export class GetBackfillStatusesUseCase {
  constructor(private readonly registrationQuery: IRegistrationQuery) {}

  async execute(params: { dids: Did[] }): Promise<{
    statuses: { did: Did; status: BackfillStatus; isMember: boolean }[];
  }> {
    const statuses = await this.registrationQuery.findTrackedBackfillStatuses(
      params.dids,
    );
    return { statuses };
  }
}
