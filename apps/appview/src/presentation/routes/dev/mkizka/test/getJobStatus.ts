import type { Server } from "@repo/client/server";

import type { GetJobStatusUseCase } from "../../../../../application/use-cases/job/get-job-status-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../middleware/auth-verifier-middleware.js";

export class GetJobStatus {
  constructor(
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
    private readonly getJobStatusUseCase: GetJobStatusUseCase,
  ) {}
  static inject = ["authVerifierMiddleware", "getJobStatusUseCase"] as const;

  handle(server: Server) {
    server.dev.mkizka.test.sync.getJobStatus({
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx.req),
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
