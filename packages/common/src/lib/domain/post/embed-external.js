import { getBlobCidString } from "@atproto/lex";
export class PostEmbedExternal {
  uri;
  title;
  description;
  thumbCid;
  constructor(uri, title, description, thumbCid) {
    this.uri = uri;
    this.title = title;
    this.description = description;
    this.thumbCid = thumbCid;
  }
  static from(external) {
    return new PostEmbedExternal(
      external.uri,
      external.title,
      external.description,
      getBlobCidString(external.thumb) ?? null,
    );
  }
}
