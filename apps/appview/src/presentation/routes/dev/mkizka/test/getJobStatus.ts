import type { Server } from "@dawn/client/server";

import type { GetJobStatusUseCase } from "../../../../../application/get-job-status-use-case.js";
import type { AuthVerifierService } from "../../../../../application/service/auth-verifier-service.js";

export class GetJobStatus {
  constructor(
    private readonly authVerifierService: AuthVerifierService,
    private readonly getJobStatusUseCase: GetJobStatusUseCase,
  ) {}
  static inject = ["authVerifierService", "getJobStatusUseCase"] as const;

  handle(server: Server) {
    server.dev.mkizka.test.sync.getJobStatus({
      auth: (ctx) => this.authVerifierService.loginRequired(ctx.req),
      handler: async ({ auth }) => {
        const result = await this.getJobStatusUseCase.execute(
          auth.credentials.did,
        );
        return {
          encoding: "application/json",
          body: result,
        };
      },
    });
  }
}
