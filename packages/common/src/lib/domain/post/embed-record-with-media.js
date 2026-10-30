import { AtUri } from "@atproto/syntax";
import external from "@repo/client/lex/app/bsky/embed/external";
import images from "@repo/client/lex/app/bsky/embed/images";
import { PostEmbedExternal } from "./embed-external.js";
import { PostEmbedImage } from "./embed-images.js";
import { PostEmbedRecord } from "./embed-record.js";
export class PostEmbedRecordWithMedia {
  uri;
  cid;
  media;
  constructor(params) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.media = params.media;
  }
  static from(embed) {
    const media = (() => {
      if (images.isTypeOf(embed.media)) {
        return PostEmbedImage.from(embed.media.images);
      }
      if (external.isTypeOf(embed.media)) {
        return PostEmbedExternal.from(embed.media.external);
      }
      // TODO: app.bsky.embed.videoをサポートする
      return null;
    })();
    if (!media) {
      // サポートしていない$typeの場合はapp.bsky.embed.record = 画像や動画を埋め込んでいない引用投稿として扱う
      return PostEmbedRecord.from({
        record: embed.record.record,
      });
    }
    return new PostEmbedRecordWithMedia({
      uri: embed.record.record.uri,
      cid: embed.record.record.cid,
      media: media,
    });
  }
}
