import { getBlobCidString } from "@atproto/lex";
import type { External } from "@repo/client/lex/app/bsky/embed/external";

export class PostEmbedExternal {
  constructor(
    readonly uri: string,
    readonly title: string,
    readonly description: string,
    readonly thumbCid: string | null,
  ) {}

  static from(external: External) {
    return new PostEmbedExternal(
      external.uri,
      external.title,
      external.description,
      getBlobCidString(external.thumb) ?? null,
    );
  }
}
