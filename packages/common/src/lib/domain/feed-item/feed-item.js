import { AtUri } from "@atproto/syntax";
export class FeedItem {
  uri;
  cid;
  type;
  subjectUri;
  actorDid;
  sortAt;
  constructor(params) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.type = params.type;
    this.subjectUri = params.subjectUri;
    this.actorDid = params.actorDid;
    this.sortAt = params.sortAt;
  }
  static fromPost(post) {
    return new FeedItem({
      uri: post.uri,
      cid: post.cid,
      type: "post",
      subjectUri: null,
      actorDid: post.actorDid,
      sortAt: post.sortAt,
    });
  }
  static fromRepost(repost) {
    return new FeedItem({
      uri: repost.uri,
      cid: repost.cid,
      type: "repost",
      subjectUri: repost.subjectUri.toString(),
      actorDid: repost.actorDid,
      sortAt: repost.sortAt,
    });
  }
}
