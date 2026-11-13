import type { $Typed } from "@atproto/lex";
import type { AtUri } from "@atproto/syntax";
import type * as AppBskyFeedDefs from "@repo/client/app/bsky/feed/defs";

import type { GeneratorViews } from "../../views/generator-views.js";
import type { ViewContextFactory, Viewer } from "../../views/view-context.js";

export class GetFeedGeneratorsUseCase {
  constructor(
    private readonly viewContextFactory: ViewContextFactory,
    private readonly generatorViews: GeneratorViews,
  ) {}

  async execute(
    uris: AtUri[],
    viewer: Viewer,
  ): Promise<$Typed<AppBskyFeedDefs.GeneratorView>[]> {
    const ctx = this.viewContextFactory.create(viewer);
    const views = await Promise.all(
      uris.map((uri) => this.generatorViews.generatorView(uri.toString(), ctx)),
    );
    return views.filter((view) => view !== undefined);
  }
}
