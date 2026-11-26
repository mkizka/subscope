import type { AtUriString } from "@atproto/syntax";

import type { IThreadQuery } from "@/app/server/application/interfaces/thread-query";

export interface IGetThreadUseCase {
  execute: (
    did: string,
    uri: AtUriString,
  ) => ReturnType<IThreadQuery["findThread"]>;
}

export interface IGetReactorsUseCase {
  execute: IThreadQuery["findReactors"];
}

export const getReactorsUseCaseFactory = ({
  threadQuery,
}: {
  threadQuery: IThreadQuery;
}): IGetReactorsUseCase => ({
  execute: (did, params) => threadQuery.findReactors(did, params),
});

export interface IGetQuotesUseCase {
  execute: IThreadQuery["findQuotes"];
}

export const getQuotesUseCaseFactory = ({
  threadQuery,
}: {
  threadQuery: IThreadQuery;
}): IGetQuotesUseCase => ({
  execute: (did, params) => threadQuery.findQuotes(did, params),
});

export const getThreadUseCaseFactory = ({
  threadQuery,
}: {
  threadQuery: IThreadQuery;
}): IGetThreadUseCase => ({
  execute: (did, uri) => threadQuery.findThread(did, uri),
});
