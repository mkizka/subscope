import type { Server } from "@repo/client/server";

import type { AuthVerifierService } from "../../../../../application/service/request/auth-verifier-service.js";
import type { GetJobStatusUseCase } from "../../../../../application/use-cases/job/get-job-status-use-case.js";

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
