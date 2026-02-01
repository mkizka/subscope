import type { Subscription } from "@repo/common/domain";

import type { ISubscriptionRepository } from "@/server/features/xrpc/application/interfaces/subscription-repository.js";
import {
  createCursorPaginator,
  type Page,
} from "@/server/features/xrpc/application/utils/pagination.js";

export class SubscriptionService {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = ["subscriptionRepository"] as const;

  async findSubscribersWithPagination({
    cursor,
    limit,
  }: {
    cursor?: string;
    limit: number;
  }): Promise<Page<Subscription>> {
    const paginator = createCursorPaginator<Subscription>({
      limit,
      getCursor: (item) => item.createdAt.toISOString(),
    });

    const results = await this.subscriptionRepository.findMany({
      limit: paginator.queryLimit,
      cursor,
    });

    return paginator.extractPage(results);
  }
}
