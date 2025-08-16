import type { Server } from "@repo/client/server";

import type { GetSubscribersUseCase } from "../../../../../application/use-cases/admin/get-subscribers-use-case.js";

export class GetSubscribers {
  constructor(private getSubscribersUseCase: GetSubscribersUseCase) {}
  static inject = ["getSubscribersUseCase"] as const;

  handle(server: Server) {
    server.me.subsco.admin.getSubscribers({
      handler: async ({ params }) => {
        const result = await this.getSubscribersUseCase.execute({
          limit: params.limit,
          cursor: params.cursor,
        });

        return {
          encoding: "application/json",
          body: result,
        };
      },
    });
  }
}
