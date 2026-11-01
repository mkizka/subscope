import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";

import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

export type ViewerImage = { src: string; alt: string };

const labels = {
  Lightbox: "画像の拡大表示",
  Close: "画像を閉じる",
  Previous: "前の画像",
  Next: "次の画像",
  "Zoom in": "拡大",
  "Zoom out": "縮小",
};

type Props = {
  images: ViewerImage[];
  index: number;
  onIndexChange: (index: number) => void;
};

export function ImageViewer({ images, index, onIndexChange }: Props) {
  const single = images.length === 1;
  return (
    <Lightbox
      open={index >= 0}
      index={index}
      close={() => onIndexChange(-1)}
      on={{ view: ({ index }) => onIndexChange(index) }}
      slides={images.map((image) => ({
        src: image.src,
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
  );
}
