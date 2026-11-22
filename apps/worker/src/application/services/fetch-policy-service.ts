import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";

import type { Author } from "../dto/author.js";
import type { FetchTarget } from "../dto/fetch-target.js";
import type { Origin } from "../dto/origin.js";
import type { ParsedRecord } from "../dto/parsed-record.js";
import { getEmbedRecordUri } from "../dto/post.js";
import type { IPostQuery } from "../interfaces/queries/post-query.js";
import type { IProfileQuery } from "../interfaces/queries/profile-query.js";
import type { IAccountRepository } from "../interfaces/repositories/account-repository.js";

type Input = { parsed: ParsedRecord; author: Author; origin: Origin };

const MAX_HOP = 2;

const nextHop = (origin: Origin) =>
  origin.type === "pds" ? origin.hop + 1 : 1;

const wantedRecords = ({ parsed, author, origin }: Input): AtUri[] => {
  switch (parsed.collection) {
    case "app.bsky.feed.post": {
      const embedUri = getEmbedRecordUri(parsed.post);
      return embedUri ? [embedUri] : [];
    }
    case "app.bsky.feed.repost":
      return [new AtUri(parsed.repost.subjectUri)];
    case "app.bsky.feed.like": {
      const subjectUri = new AtUri(parsed.like.subjectUri);
      const inWindow =
        origin.type === "tapLive" ||
        !!author.tracking?.covers(parsed.like.createdAt);
      return author.isMember &&
        inWindow &&
        subjectUri.collection === "app.bsky.feed.post"
        ? [subjectUri]
        : [];
    }
    default:
      return [];
  }
};

const wantedAccounts = ({ parsed, author }: Input): Did[] => {
  switch (parsed.collection) {
    case "app.bsky.graph.follow":
      return author.isMember
        ? [author.did, parsed.follow.subjectDid]
        : [author.did];
    case "app.bsky.graph.listitem":
      return author.isMember
        ? [author.did, parsed.listItem.subjectDid]
        : [author.did];
    default:
      return [author.did];
  }
};

export class FetchPolicyService {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly profileQuery: IProfileQuery,
    private readonly postQuery: IPostQuery,
  ) {}

  async targetsForRecord({
    ctx,
    ...input
  }: Input & { ctx: TransactionContext }): Promise<FetchTarget[]> {
    const hop = nextHop(input.origin);
    const uris = hop > MAX_HOP ? [] : wantedRecords(input);
    const targets: FetchTarget[] = [];
    for (const uri of uris) {
      const exists = await this.postQuery.exists(ctx, uri);
      if (!exists) {
        targets.push({ type: "record", uri, hop });
      }
    }
    return [
      ...targets,
      ...(await this.targetsForAccounts(ctx, wantedAccounts(input))),
    ];
  }

  async targetsForAccounts(
    ctx: TransactionContext,
    dids: Did[],
  ): Promise<FetchTarget[]> {
    const targets: FetchTarget[] = [];
    for (const did of dids) {
      const account = await this.accountRepository.find({ ctx, did });
      if (!account?.handle) {
        targets.push({ type: "handle", did });
      }
      const profileExists = await this.profileQuery.exists({
        ctx,
        accountDid: did,
      });
      if (!profileExists) {
        targets.push({ type: "profile", did });
      }
    }
    return targets;
  }
}
