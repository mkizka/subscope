import HlsVideo from "hls-video-element/react";
import {
  MediaControlBar,
  MediaController,
  MediaFullscreenButton,
  MediaMuteButton,
  MediaPlayButton,
  MediaTimeDisplay,
  MediaTimeRange,
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
        [--media-secondary-color:transparent]
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
      <MediaPlayButton
        slot="centered-chrome"
        className="
          size-16 rounded-full bg-black/55 p-0 backdrop-blur-sm
          [--media-button-icon-width:30px]
          [&:not([mediapaused])]:hidden
        "
      />
      <MediaControlBar
        className="
          absolute inset-x-0 bottom-0 items-center bg-linear-to-t from-black/65
          to-transparent pt-8
        "
      >
        <MediaPlayButton />
        <MediaTimeDisplay showDuration className="text-xs" />
        <MediaTimeRange className="min-w-0 flex-1" />
        <MediaMuteButton />
        <MediaFullscreenButton />
      </MediaControlBar>
    </MediaController>
  );
}
