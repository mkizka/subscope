import type { Did } from "@atproto/did";
import type { AtUriString } from "@atproto/syntax";

export type PostEmbedImageDto = {
  cid: string;
  alt: string;
  aspectRatio?: { width: number; height: number };
};

export type PostEmbedExternalDto = {
  uri: string;
  title: string;
  description: string;
  thumbCid: string | null;
};

export type PostDto = {
  uri: AtUriString;
  actorDid: Did;
  embedImages: PostEmbedImageDto[];
  embedExternal: PostEmbedExternalDto | null;
  embedRecordUri: string | null;
  replyRootUri: string | null;
  replyParentUri: string | null;
  indexedAt: Date;
};
