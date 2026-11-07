import HlsVideo from "hls-video-element/react";
import {
  MediaControlBar,
  MediaController,
  MediaFullscreenButton,
  MediaMuteButton,
  MediaPlayButton,
  MediaTimeRange,
  MediaVolumeRange,
} from "media-chrome/react";

import type { PostVideoData } from "./post-video";

export default function PostVideoPlayer({ video }: { video: PostVideoData }) {
  return (
    <MediaController
      style={{
        aspectRatio: video.aspectRatio
          ? `${video.aspectRatio.width} / ${video.aspectRatio.height}`
          : undefined,
      }}
      className="
        mt-2 block max-h-[80vh] w-full overflow-hidden rounded-xl bg-black
        [--media-control-background:transparent]
        [--media-control-hover-background:transparent]
        [--media-primary-color:var(--color-brand)]
        [--media-range-bar-color:var(--color-brand)]
        [--media-range-thumb-background:var(--color-brand)]
      "
    >
      <HlsVideo
        slot="media"
        src={video.playlist}
        poster={video.thumbnail}
        aria-label={video.alt}
        preload="none"
        playsInline
        className="size-full"
      />
      <MediaControlBar className="absolute inset-x-0 bottom-0 items-center">
        <MediaPlayButton />
        <MediaTimeRange className="min-w-0 flex-1" />
        <MediaMuteButton />
        <MediaVolumeRange
          className="
            hidden
            sm:inline-flex
          "
        />
        <MediaFullscreenButton />
      </MediaControlBar>
    </MediaController>
  );
}
