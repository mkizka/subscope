import { AtUri } from "@atproto/syntax";
import type { Server } from "@repo/client/server";

import type { GetListUseCase } from "../../../../../application/use-cases/graph/get-list-use-case.js";
import type { AtUriService } from "../../../../../domain/service/at-uri-service.js";

export class GetList {
  constructor(
    private getListUseCase: GetListUseCase,
    private atUriService: AtUriService,
  ) {}
  static inject = ["getListUseCase", "atUriService"] as const;

  handle(server: Server) {
    server.app.bsky.graph.getList({
      handler: async ({ params }) => {
        const listUri = await this.atUriService.resolveHostname(
          new AtUri(params.list),
        );
        const result = await this.getListUseCase.execute({
          listUri: listUri.getValue(),
          limit: params.limit,
          cursor: params.cursor,
        });
        if (!result) {
          return { status: 400, message: "List not found" };
        }
        return {
          encoding: "application/json",
          body: result,
        };
      },
    });
  }
}
