export type TextLinkDto = {
  byteStart: number;
  byteEnd: number;
  uri?: string;
  did?: string;
};

export type TimelinePostDto = {
  uri: string;
  cid: string;
  viewerLike?: string;
  viewerRepost?: string;
  replyRoot?: { uri: string; cid: string };
  replyParentUri?: string;
  authorAvatar?: string;
  authorDisplayName?: string;
  authorHandle: string;
  text?: string;
  links?: TextLinkDto[];
  replyCount?: number;
  repostCount?: number;
  likeCount?: number;
  createdAt?: string;
  images?: {
    thumb: string;
    fullsize: string;
    alt: string;
    aspectRatio?: { width: number; height: number };
  }[];
  video?: {
    playlist: string;
    thumbnail?: string;
    alt?: string;
    aspectRatio?: { width: number; height: number };
  };
  external?: {
    uri: string;
    title: string;
    description: string;
    thumb?: string;
  };
  quote?: {
    authorAvatar?: string;
    authorDisplayName?: string;
    authorHandle: string;
    text?: string;
    links?: TextLinkDto[];
    images?: {
      thumb: string;
      fullsize: string;
      alt: string;
      aspectRatio?: { width: number; height: number };
    }[];
    video?: {
      playlist: string;
      thumbnail?: string;
      alt?: string;
      aspectRatio?: { width: number; height: number };
    };
    threadPath?: string;
    external?: {
      uri: string;
      title: string;
      description: string;
      thumb?: string;
    };
  };
  quoteUnavailable?: "notFound" | "blocked" | "detached";
  quotedFeed?: {
    avatar?: string;
    displayName: string;
    creatorHandle: string;
    description?: string;
  };
  reasonRepost?: { byDisplayName?: string; byHandle: string };
};
