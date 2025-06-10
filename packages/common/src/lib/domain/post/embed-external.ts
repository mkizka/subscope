import type { AppBskyEmbedExternal } from "@repo/client/server";

export class PostEmbedExternal {
  constructor(
    readonly uri: string,
    readonly title: string,
    readonly description: string,
    readonly thumbCid: string | null,
  ) {}

  static from(external: AppBskyEmbedExternal.External) {
    return new PostEmbedExternal(
      external.uri,
      external.title,
      external.description,
      external.thumb ? external.thumb.toJSON().ref.$link : null,
    );
  }
}
