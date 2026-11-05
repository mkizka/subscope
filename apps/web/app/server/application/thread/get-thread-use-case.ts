import type { AtUriString } from "@atproto/syntax";

import type { IThreadQuery } from "@/app/server/application/interfaces/thread-query";

export interface IGetThreadUseCase {
  execute: (
    did: string,
    uri: AtUriString,
  ) => ReturnType<IThreadQuery["findThread"]>;
}

export const getThreadUseCaseFactory = ({
  threadQuery,
}: {
  threadQuery: IThreadQuery;
}): IGetThreadUseCase => ({
  execute: (did, uri) => threadQuery.findThread(did, uri),
});
