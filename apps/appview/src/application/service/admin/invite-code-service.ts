import type { InviteCodeDto } from "../../../application/dto/invite-code-with-handle.js";
import type { IInviteCodeRepository } from "../../../application/interfaces/invite-code-repository.js";
import {
  createCursorPaginator,
  type Page,
} from "../../../application/utils/pagination.js";

export class InviteCodeService {
  constructor(private readonly inviteCodeRepository: IInviteCodeRepository) {}
  static inject = ["inviteCodeRepository"] as const;

  async findInviteCodesWithPagination({
    cursor,
    limit,
  }: {
    cursor?: string;
    limit: number;
  }): Promise<Page<InviteCodeDto>> {
    const paginator = createCursorPaginator<InviteCodeDto>({
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
