import type { AtUri } from "@atproto/syntax";
import type { $Typed, AppBskyFeedDefs } from "@repo/client/server";

import type { AssetUrlBuilder } from "../../../infrastructure/asset-url-builder.js";
import type { IGeneratorRepository } from "../../interfaces/generator-repository.js";
import type { ProfileViewService } from "../actor/profile-view-service.js";

export class GeneratorViewService {
  constructor(
    private readonly generatorRepository: IGeneratorRepository,
    private readonly profileViewService: ProfileViewService,
    private readonly assetUrlBuilder: AssetUrlBuilder,
  ) {}
  static inject = [
    "generatorRepository",
    "profileViewService",
    "assetUrlBuilder",
  ] as const;

  async findGeneratorViews(
    uris: AtUri[],
  ): Promise<Map<string, $Typed<AppBskyFeedDefs.GeneratorView>>> {
    if (uris.length === 0) {
      return new Map();
    }

    const generators = await this.generatorRepository.findByUris(uris);

    const creatorDids = [...new Set(generators.map((g) => g.actorDid))];
    const creatorProfiles =
      await this.profileViewService.findProfileView(creatorDids);
    const creatorProfileMap = new Map(
      creatorProfiles.map((profile) => [profile.did, profile]),
    );

    const generatorViewMap = new Map<
      string,
      $Typed<AppBskyFeedDefs.GeneratorView>
    >();

    for (const generator of generators) {
      const creator = creatorProfileMap.get(generator.actorDid.toString());
      if (!creator) continue;

      const generatorView: $Typed<AppBskyFeedDefs.GeneratorView> = {
        $type: "app.bsky.feed.defs#generatorView",
        uri: generator.uri.toString(),
        cid: generator.cid,
        did: generator.did.toString(),
        creator,
        displayName: generator.displayName,
        description: generator.description,
        avatar:
          generator.avatarCid &&
          this.assetUrlBuilder.getAvatarThumbnailUrl(
            generator.actorDid.toString(),
            generator.avatarCid,
          ),
        indexedAt: generator.indexedAt.toISOString(),
      };

      generatorViewMap.set(generator.uri.toString(), generatorView);
    }

    return generatorViewMap;
  }
}
