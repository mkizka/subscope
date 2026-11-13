import type { NewPost } from "@/app/server/application/dto/new-post";

export interface IPostCommand {
  create: (did: string, post: NewPost) => Promise<string>;
  pin: (did: string, post?: { uri: string; cid: string }) => Promise<void>;
  delete: (did: string, uri: string) => Promise<void>;
}
