import { AtUri } from "@atproto/syntax";
import type { Server } from "@repo/client/server";

import type { GetPostThreadUseCase } from "../../../../../application/use-cases/feed/get-post-thread-use-case.js";
import type { AtUriService } from "../../../../../domain/service/at-uri-service.js";
import type { AuthVerifierMiddleware } from "../../../../middleware/auth-verifier-middleware.js";

export class GetPostThread {
  constructor(
    private readonly getPostThreadUseCase: GetPostThreadUseCase,
    private readonly atUriService: AtUriService,
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}
  static inject = [
    "getPostThreadUseCase",
    "atUriService",
    "authVerifierMiddleware",
  ] as const;

  handle(server: Server) {
    server.app.bsky.feed.getPostThread({
      handler: async ({ params, req }) => {
        const atUri = new AtUri(params.uri);
        const [resolvedUri, viewerDid] = await Promise.all([
          this.atUriService.resolveHostname(atUri),
          this.authVerifierMiddleware.getViewerDid(req),
        ]);
        const result = await this.getPostThreadUseCase.execute({
          uri: resolvedUri,
          depth: params.depth,
          parentHeight: params.parentHeight,
          // TODO: nullを渡せるようにする
          viewerDid: viewerDid || undefined,
        });
        return {
          encoding: "application/json",
          body: result,
        };
      },
    });
  }
}
