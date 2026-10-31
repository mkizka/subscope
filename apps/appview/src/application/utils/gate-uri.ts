import { AtUri } from "@atproto/syntax";

export const gateUri = (
  postUri: string,
  collection: "app.bsky.feed.threadgate" | "app.bsky.feed.postgate",
) => {
  const uri = new AtUri(postUri);
  return AtUri.make(uri.host, collection, uri.rkey).toString();
};
