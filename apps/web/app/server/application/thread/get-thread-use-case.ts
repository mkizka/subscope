import type { AtUriString } from "@atproto/syntax";

import type { IThreadQuery } from "@/app/server/application/interfaces/thread-query";

export interface IGetThreadUseCase {
  execute: (
    did: string,
    uri: AtUriString,
  ) => ReturnType<IThreadQuery["findThread"]>;
}

export interface IGetReactorsUseCase {
  execute: (
    did: string,
    uri: AtUriString,
    kind: "liked-by" | "reposted-by",
    cursor?: string,
  ) => ReturnType<IThreadQuery["findReactors"]>;
}

export const getReactorsUseCaseFactory = ({
  threadQuery,
}: {
  threadQuery: IThreadQuery;
}): IGetReactorsUseCase => ({
  execute: (did, uri, kind, cursor) =>
    threadQuery.findReactors(did, uri, kind, cursor),
});

export interface IGetQuotesUseCase {
  execute: (
    did: string,
    uri: AtUriString,
    cursor?: string,
  ) => ReturnType<IThreadQuery["findQuotes"]>;
}

export const getQuotesUseCaseFactory = ({
  threadQuery,
}: {
  threadQuery: IThreadQuery;
}): IGetQuotesUseCase => ({
  execute: (did, uri, cursor) => threadQuery.findQuotes(did, uri, cursor),
});

export const getThreadUseCaseFactory = ({
  threadQuery,
}: {
  threadQuery: IThreadQuery;
}): IGetThreadUseCase => ({
  execute: (did, uri) => threadQuery.findThread(did, uri),
});
