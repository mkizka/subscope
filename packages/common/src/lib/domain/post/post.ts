import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

type PostParams = {
  uri: AtUri;
  actorDid: Did;
  text: string;
  langs: string[] | null;
  createdAt: Date;
};

export class Post {
  readonly uri: AtUri;
  readonly actorDid: Did;
  readonly text: string;
  readonly langs: string[] | null;
  readonly createdAt: Date;

  constructor(params: PostParams) {
    this.uri = params.uri;
    this.actorDid = params.actorDid;
    this.text = params.text;
    this.langs = params.langs;
    this.createdAt = params.createdAt;
  }
}
