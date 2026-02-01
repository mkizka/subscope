import type { AtUri } from "@atproto/syntax";
import type { $Typed, AppBskyFeedDefs } from "@repo/client/server";

import type { GeneratorViewService } from "@/server/features/xrpc/application/service/feed/generator-view-service.js";

export class GetFeedGeneratorsUseCase {
  constructor(private readonly generatorViewService: GeneratorViewService) {}
  static inject = ["generatorViewService"] as const;

  async execute(
    uris: AtUri[],
  ): Promise<$Typed<AppBskyFeedDefs.GeneratorView>[]> {
    const generatorViewMap =
      await this.generatorViewService.findGeneratorViewMap(uris);
    return uris
      .map((uri) => generatorViewMap.get(uri.toString()))
      .filter((view) => view !== undefined);
  }
}
