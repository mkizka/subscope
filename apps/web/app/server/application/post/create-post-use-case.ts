import { setTimeout } from "node:timers/promises";

import type {
  IPostCommand,
  NewPost,
} from "@/app/server/infrastructure/post/post-command";
import type { IPostQuery } from "@/app/server/infrastructure/post/post-query";

export interface ICreatePostUseCase {
  execute: (did: string, post: NewPost) => Promise<string>;
}

export const createPostUseCaseFactory = ({
  postCommand,
  postQuery,
}: {
  postCommand: IPostCommand;
  postQuery: IPostQuery;
}): ICreatePostUseCase => ({
  async execute(did, post) {
    const parentUri = post.reply?.parent.uri;
    const replyCount = parentUri
      ? await postQuery.getReplyCount(did, parentUri)
      : 0;
    const uri = await postCommand.create(did, post);
    const isIndexed = async () =>
      parentUri
        ? (await postQuery.getReplyCount(did, parentUri)) > replyCount
        : await postQuery.exists(did, uri);
    for (let i = 0; i < 20; i++) {
      if (await isIndexed()) break;
      await setTimeout(250);
    }
    return uri;
  },
});
