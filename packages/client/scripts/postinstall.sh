#!/usr/bin/env bash
set -euo pipefail

ATPROTO_SHA=$(< .atproto-sha)
DOWNLOAD_DIR="./node_modules/.cache/lexicons"
LEXICONS_DIR="./lexicons"

paths=(
  # app.bsky
  "app/bsky/actor/defs.json"
  "app/bsky/actor/getProfile.json"
  "app/bsky/actor/getProfiles.json"
  "app/bsky/actor/profile.json"
  "app/bsky/embed/defs.json"
  "app/bsky/embed/external.json"
  "app/bsky/embed/images.json"
  "app/bsky/embed/record.json"
  "app/bsky/embed/recordWithMedia.json"
  "app/bsky/embed/video.json"
  "app/bsky/feed/defs.json"
  "app/bsky/feed/generator.json"
  "app/bsky/feed/getActorLikes.json"
  "app/bsky/feed/getAuthorFeed.json"
  "app/bsky/feed/getLikes.json"
  "app/bsky/feed/getPostThread.json"
  "app/bsky/feed/getPosts.json"
  "app/bsky/feed/getRepostedBy.json"
  "app/bsky/feed/getTimeline.json"
  "app/bsky/feed/like.json"
  "app/bsky/feed/post.json"
  "app/bsky/feed/postgate.json"
  "app/bsky/feed/repost.json"
  "app/bsky/feed/threadgate.json"
  "app/bsky/graph/defs.json"
  "app/bsky/graph/follow.json"
  "app/bsky/graph/getFollows.json"
  "app/bsky/labeler/defs.json"
  "app/bsky/richtext/facet.json"

  # com.atproto
  "com/atproto/label/defs.json"
  "com/atproto/moderation/defs.json"
  "com/atproto/repo/createRecord.json"
  "com/atproto/repo/defs.json"
  "com/atproto/repo/deleteRecord.json"
  "com/atproto/repo/getRecord.json"
  "com/atproto/repo/listRecords.json"
  "com/atproto/repo/strongRef.json"
  "com/atproto/sync/getBlob.json"
  "com/atproto/sync/getRepo.json"
)

rm -rf "$LEXICONS_DIR/com/atproto"
rm -rf "$LEXICONS_DIR/app/bsky"

pnpm giget "gh:bluesky-social/atproto/lexicons#$ATPROTO_SHA" $DOWNLOAD_DIR --force --preferOffline

for path in ${paths[@]}; do
  source_path="$DOWNLOAD_DIR/$path"
  target_path="$LEXICONS_DIR/$path"
  mkdir -p $(dirname $target_path)
  cp -r $source_path $target_path
done
