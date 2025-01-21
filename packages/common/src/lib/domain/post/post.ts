import { Did } from "@atproto/did";

type PostParams = {
  rkey: string;
  actorDid: Did;
  text: string;
  langs: string[] | null;
  createdAt: Date;
};

export class Post {
  readonly rkey: string;
  readonly actorDid: Did;
  readonly text: string;
  readonly langs: string[] | null;
  readonly createdAt: Date;

  constructor(params: PostParams) {
    this.rkey = params.rkey;
    this.actorDid = params.actorDid;
    this.text = params.text;
    this.langs = params.langs;
    this.createdAt = params.createdAt;
  }
}
