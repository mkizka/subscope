import type { ReplyRule } from "@/app/features/post/post-form";

export type PostRef = { uri: string; cid: string };

export type NewPost = {
  text: string;
  images: { file: File; alt: string }[];
  reply?: { root: PostRef; parent: PostRef };
  quote?: PostRef;
  allow?: ReplyRule[];
};
