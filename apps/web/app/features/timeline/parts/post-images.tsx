import { clsx } from "clsx";
import { useState } from "react";

import { ImageViewer } from "@/app/components/ui/image-viewer";

export type PostImage = { thumb: string; fullsize: string; alt: string };

export function PostImages({ images }: { images: PostImage[] }) {
  const [index, setIndex] = useState(-1);
  const scrollable = images.length >= 5;
  return (
    <>
      <div
        className={clsx(
          "relative mt-2 gap-1",
          scrollable ? "flex snap-x snap-mandatory overflow-x-auto" : "grid",
          !scrollable && images.length > 1 && "grid-cols-2",
        )}
      >
        {images.map((image, i) => (
          <button
            key={image.thumb}
            type="button"
            className={clsx(
              "cursor-zoom-in",
              scrollable && "w-2/5 shrink-0 snap-start",
            )}
            onClick={() => setIndex(i)}
          >
            <img
              src={image.thumb}
              alt={image.alt}
              className={clsx(
                "w-full rounded-xl object-cover",
                images.length > 1 ? "aspect-square" : "max-h-[80vh]",
              )}
            />
          </button>
        ))}
      </div>
      <ImageViewer
        images={images.map((image) => ({
          src: image.fullsize,
          alt: image.alt,
        }))}
        index={index}
        onIndexChange={setIndex}
      />
    </>
  );
}
