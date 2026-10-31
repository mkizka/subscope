import type { AtUriString } from "@atproto/syntax";

import type { IThreadRepository } from "@/app/server/infrastructure/thread/thread-repository";

export interface IGetThreadUseCase {
  execute: (
    did: string,
    uri: AtUriString,
  ) => ReturnType<IThreadRepository["findThread"]>;
}

export const getThreadUseCaseFactory = ({
  threadRepository,
}: {
  threadRepository: IThreadRepository;
}): IGetThreadUseCase => ({
  execute: (did, uri) => threadRepository.findThread(did, uri),
});
