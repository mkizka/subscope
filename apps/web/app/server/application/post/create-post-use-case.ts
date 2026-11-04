import { setTimeout } from "node:timers/promises";

import type { NewPost } from "@/app/server/application/dto/new-post";
import type { IPostCommand } from "@/app/server/application/interfaces/post-command";
import type { IPostQuery } from "@/app/server/application/interfaces/post-query";

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
    for (let i = 0; i < 5; i++) {
      if (i > 0) await setTimeout(1000);
      if (await postQuery.exists(did, uri)) break;
    }
    return uri;
  },
});
