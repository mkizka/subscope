import { AtUri } from "@atproto/syntax";
import type { AppBskyEmbedRecordWithMedia } from "@repo/client/server";

import { PostEmbedExternal } from "./embed-external.js";
import { PostEmbedImage } from "./embed-images.js";
import { PostEmbedRecord } from "./embed-record.js";

type PostEmbedRecordWithMediaParams = {
  uri: AtUri | string;
  cid: string;
  media: PostEmbedExternal | PostEmbedImage[];
};

export class PostEmbedRecordWithMedia {
  readonly uri: AtUri;
  readonly cid: string;
  readonly media: PostEmbedExternal | PostEmbedImage[];

  constructor(params: PostEmbedRecordWithMediaParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.media = params.media;
  }

  static from(embed: AppBskyEmbedRecordWithMedia.Main) {
    const media = (() => {
      if (
        embed.media.$type === "app.bsky.embed.images" &&
        "images" in embed.media
      ) {
        return PostEmbedImage.from(embed.media.images);
      }
      if (
        embed.media.$type === "app.bsky.embed.external" &&
        "external" in embed.media
      ) {
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
