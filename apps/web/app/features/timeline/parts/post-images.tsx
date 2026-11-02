import { clsx } from "clsx";
import { useState } from "react";

import { ImageViewer } from "@/app/components/ui/image-viewer";

export type PostImage = { thumb: string; fullsize: string; alt: string };

export function PostImages({ images }: { images: PostImage[] }) {
  const [index, setIndex] = useState(-1);
  return (
    <>
      <div
        className={clsx(
          "relative mt-2 grid gap-1",
          images.length > 1 && "grid-cols-2",
        )}
      >
        {images.map((image, i) => (
          <button
            key={image.thumb}
            type="button"
            className="cursor-zoom-in"
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
