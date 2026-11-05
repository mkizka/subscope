import { useEffect, useRef } from "react";

export type PostVideoData = {
  playlist: string;
  thumbnail?: string;
  alt?: string;
  aspectRatio?: { width: number; height: number };
};

export function PostVideo({ video }: { video: PostVideoData }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || element.canPlayType("application/vnd.apple.mpegurl")) {
      return;
    }
    let destroy: (() => void) | undefined;
    void import("hls.js").then(({ default: Hls }) => {
      if (!Hls.isSupported()) return;
      const hls = new Hls();
      hls.loadSource(video.playlist);
      hls.attachMedia(element);
      destroy = () => hls.destroy();
    });
    return () => destroy?.();
  }, [video.playlist]);
  return (
    <video
      ref={ref}
      src={video.playlist}
      poster={video.thumbnail}
      aria-label={video.alt}
      controls
      playsInline
      preload="none"
      style={{
        aspectRatio: video.aspectRatio
          ? `${video.aspectRatio.width} / ${video.aspectRatio.height}`
          : undefined,
      }}
      className="relative mt-2 max-h-[80vh] w-full rounded-xl bg-black"
    />
  );
}
