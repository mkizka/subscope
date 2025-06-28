import { AtUri } from "@atproto/syntax";
import type { Server } from "@repo/client/server";

import type { GetPostThreadUseCase } from "../../../../../application/use-cases/feed/get-post-thread-use-case.js";
import type { AtUriService } from "../../../../../domain/service/at-uri-service.js";

export class GetPostThread {
  constructor(
    private readonly getPostThreadUseCase: GetPostThreadUseCase,
    private readonly atUriService: AtUriService,
  ) {}
  static inject = ["getPostThreadUseCase", "atUriService"] as const;

  handle(server: Server) {
    server.app.bsky.feed.getPostThread({
      handler: async ({ params }) => {
        const atUri = new AtUri(params.uri);
        const resolvedUri = await this.atUriService.resolveHostname(atUri);
        const result = await this.getPostThreadUseCase.execute({
          uri: resolvedUri,
          depth: params.depth,
          parentHeight: params.parentHeight,
        });
        return {
          encoding: "application/json",
          body: result,
        };
      },
    });
  }
}
