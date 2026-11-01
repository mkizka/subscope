import { useState } from "react";

import { ImageViewer } from "@/app/components/ui/image-viewer";

export type PostImage = { thumb: string; fullsize: string; alt: string };

export function PostImages({ images }: { images: PostImage[] }) {
  const [index, setIndex] = useState(-1);
  return (
    <>
      <div className="relative mt-2 grid grid-cols-2 gap-1">
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
              className="aspect-square w-full rounded-xl object-cover"
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
