import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";

type FollowParams = {
  uri: AtUri | string;
  cid: string;
  actorDid: string;
  subjectDid: string;
};

export class Follow {
  readonly uri: AtUri;
  readonly cid: string;
  readonly actorDid: Did;
  readonly subjectDid: Did;

  constructor(params: FollowParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.actorDid = asDid(params.actorDid);
    this.subjectDid = asDid(params.subjectDid);
  }
}
