import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

export type PostImage = { thumb: string; fullsize: string; alt: string };

const labels = {
  Lightbox: "画像の拡大表示",
  Close: "画像を閉じる",
  Previous: "前の画像",
  Next: "次の画像",
  "Zoom in": "拡大",
  "Zoom out": "縮小",
};

export function PostImages({ images }: { images: PostImage[] }) {
  const [index, setIndex] = useState(-1);
  const single = images.length === 1;
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
              className="aspect-square w-full rounded-sm object-cover"
            />
          </button>
        ))}
      </div>
      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        on={{ view: ({ index }) => setIndex(index) }}
        slides={images.map((image) => ({
          src: image.fullsize,
          alt: image.alt,
          description: image.alt,
        }))}
        plugins={single ? [Captions, Zoom] : [Captions, Counter, Zoom]}
        labels={labels}
        carousel={{ finite: true }}
        zoom={{ maxZoomPixelRatio: 3 }}
        controller={{ closeOnBackdropClick: true }}
        styles={{ container: { backgroundColor: "rgb(0 0 0 / 0.7)" } }}
        captions={{ descriptionTextAlign: "center" }}
        render={{
          buttonPrev: single ? () => null : undefined,
          buttonNext: single ? () => null : undefined,
        }}
      />
    </>
  );
}
