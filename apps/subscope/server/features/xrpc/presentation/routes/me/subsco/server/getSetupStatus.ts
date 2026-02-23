import type { Server } from "@repo/client/server";

import type { GetSetupStatusUseCase } from "@/server/features/xrpc/application/use-cases/server/get-setup-status-use-case.js";

export class GetSetupStatus {
  constructor(private readonly getSetupStatusUseCase: GetSetupStatusUseCase) {}
  static inject = ["getSetupStatusUseCase"] as const;

  handle(server: Server) {
    server.me.subsco.server.getSetupStatus({
      handler: async () => {
        const result = await this.getSetupStatusUseCase.execute();
        return {
          encoding: "application/json",
          body: result,
        };
      },
    });
  }
}
