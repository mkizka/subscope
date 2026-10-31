import { setTimeout } from "node:timers/promises";

import type { IPostCommand } from "@/app/server/infrastructure/post/post-command";
import type { IPostQuery } from "@/app/server/infrastructure/post/post-query";

export interface IDeletePostUseCase {
  execute: (did: string, uri: string) => Promise<void>;
}

export const deletePostUseCaseFactory = ({
  postCommand,
  postQuery,
}: {
  postCommand: IPostCommand;
  postQuery: IPostQuery;
}): IDeletePostUseCase => ({
  async execute(did, uri) {
    if (!uri.startsWith(`at://${did}/`)) {
      throw new Error("Cannot delete another user's post");
    }
    await postCommand.delete(did, uri);
    for (let i = 0; i < 5; i++) {
      if (i > 0) await setTimeout(1000);
      if (!(await postQuery.exists(did, uri))) break;
    }
  },
});
