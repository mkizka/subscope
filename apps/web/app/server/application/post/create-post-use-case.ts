import { setTimeout } from "node:timers/promises";

import type {
  IPostRepository,
  NewPost,
} from "@/app/server/infrastructure/post/post-repository";

export interface ICreatePostUseCase {
  execute: (did: string, post: NewPost) => Promise<string>;
}

export const createPostUseCaseFactory = ({
  postRepository,
}: {
  postRepository: IPostRepository;
}): ICreatePostUseCase => ({
  async execute(did, post) {
    const uri = await postRepository.create(did, post);
    for (let i = 0; i < 20; i++) {
      if (await postRepository.exists(did, uri)) break;
      await setTimeout(250);
    }
    return uri;
  },
});
