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
    const uri = await postCommand.create(did, post);
    for (let i = 0; i < 20; i++) {
      if (await postQuery.exists(did, uri)) break;
      await setTimeout(250);
    }
    return uri;
  },
});
