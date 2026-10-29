import type { $Typed } from "@atproto/lex";
import type { AtUri } from "@atproto/syntax";
import type * as AppBskyFeedDefs from "@repo/client/lex/app/bsky/feed/defs";

import type { GeneratorViewService } from "../../../application/service/feed/generator-view-service.js";

export class GetFeedGeneratorsUseCase {
  constructor(private readonly generatorViewService: GeneratorViewService) {}

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
