import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";

import { parseRecord } from "../../utils/record.js";
import type { Record } from "../record.js";

type StrongRef = Readonly<{
  uri: AtUri;
  cid: string;
}>;

const getStrongRef = (ref: { uri: string; cid: string } | undefined) => {
  return (
    ref && {
      uri: new AtUri(ref.uri),
      cid: ref.cid,
    }
  );
};

type PostParams = {
  uri: AtUri | string;
  cid: string;
  actorDid: string;
  text: string;
  replyRoot?: StrongRef | null;
  replyParent?: StrongRef | null;
  langs: string[] | null;
  createdAt: Date;
};

export class Post {
  readonly uri: AtUri;
  readonly cid: string;
  readonly actorDid: Did;
  readonly text: string;
  readonly replyRoot: StrongRef | null;
  readonly replyParent: StrongRef | null;
  readonly langs: string[] | null;
  readonly createdAt: Date;

  constructor(params: PostParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.actorDid = asDid(params.actorDid);
    this.text = params.text;
    this.replyRoot = params.replyRoot ?? null;
    this.replyParent = params.replyParent ?? null;
    this.langs = params.langs;
    this.createdAt = params.createdAt;
  }

  static from(record: Record) {
    const parsed = parseRecord("app.bsky.feed.post", record.json);
    return new Post({
      uri: record.uri,
      cid: record.cid,
      actorDid: record.actorDid,
      text: parsed.text,
      replyRoot: getStrongRef(parsed.reply?.root),
      replyParent: getStrongRef(parsed.reply?.parent),
      langs: parsed.langs ?? [],
      createdAt: new Date(parsed.createdAt),
    });
  }
}
