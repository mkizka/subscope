import { type ComponentType, useEffect, useState } from "react";

export type PostVideoData = {
  playlist: string;
  thumbnail?: string;
  alt?: string;
  aspectRatio?: { width: number; height: number };
};

export function PostVideo({ video }: { video: PostVideoData }) {
  const [Player, setPlayer] = useState<ComponentType<{
    video: PostVideoData;
  }> | null>(null);
  useEffect(() => {
    void import("./post-video-player").then((m) => setPlayer(() => m.default));
  }, []);
  if (!Player) {
    return (
      <div
        style={{
          aspectRatio: video.aspectRatio
            ? `${video.aspectRatio.width} / ${video.aspectRatio.height}`
            : undefined,
        }}
        className="mt-2 max-h-[80vh] w-full rounded-xl bg-black"
      />
    );
  }
  return <Player video={video} />;
}
