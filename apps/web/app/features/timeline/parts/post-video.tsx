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
    if (!element) return;
    let destroy: (() => void) | undefined;
    void import("hls.js").then(({ default: Hls }) => {
      if (!Hls.isSupported()) {
        element.src = video.playlist;
        return;
      }
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
