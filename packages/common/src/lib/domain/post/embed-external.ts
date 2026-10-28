import { getBlobCidString } from "@atproto/lex";
import type { app } from "@repo/client/lex";

export class PostEmbedExternal {
  constructor(
    readonly uri: string,
    readonly title: string,
    readonly description: string,
    readonly thumbCid: string | null,
  ) {}

  static from(external: app.bsky.embed.external.External) {
    return new PostEmbedExternal(
      external.uri,
      external.title,
      external.description,
      getBlobCidString(external.thumb) ?? null,
    );
  }
}
