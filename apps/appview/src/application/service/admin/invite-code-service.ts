import type { InviteCode } from "@repo/common/domain";

import type { IInviteCodeRepository } from "../../interfaces/invite-code-repository.js";
import { createCursorPaginator, type Page } from "../../utils/pagination.js";

export class InviteCodeService {
  constructor(private readonly inviteCodeRepository: IInviteCodeRepository) {}
  static inject = ["inviteCodeRepository"] as const;

  async findInviteCodesWithPagination({
    cursor,
    limit,
  }: {
    cursor?: string;
    limit: number;
  }): Promise<Page<InviteCode>> {
    const paginator = createCursorPaginator<InviteCode>({
      limit,
      getCursor: (item) => item.createdAt.toISOString(),
    });

    const inviteCodes = await this.inviteCodeRepository.findAll({
      limit: paginator.queryLimit,
      cursor,
    });

    return paginator.extractPage(inviteCodes);
  }
}
