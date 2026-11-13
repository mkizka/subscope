import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";

import { useEffect, useRef } from "react";
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

let pendingBack: Promise<void> | null = null;

function backAndWait() {
  pendingBack = new Promise<void>((resolve) => {
    window.addEventListener(
      "popstate",
      () => {
        pendingBack = null;
        resolve();
      },
      { once: true },
    );
  });
  history.back();
}

type Props = {
  images: ViewerImage[];
  index: number;
  onIndexChange: (index: number) => void;
};

export function ImageViewer({ images, index, onIndexChange }: Props) {
  const single = images.length === 1;
  const open = index >= 0;
  const onIndexChangeRef = useRef(onIndexChange);
  onIndexChangeRef.current = onIndexChange;

  useEffect(() => {
    if (!open) return;
    let started = false;
    let cancelled = false;
    let closedByPopState = false;
    const onPopState = () => {
      closedByPopState = true;
      onIndexChangeRef.current(-1);
    };
    const start = () => {
      if (cancelled) return;
      started = true;
      history.pushState("imageViewer", "");
      window.addEventListener("popstate", onPopState);
    };
    if (pendingBack) void pendingBack.then(start);
    else start();
    return () => {
      cancelled = true;
      window.removeEventListener("popstate", onPopState);
      if (started && !closedByPopState && history.state === "imageViewer") {
        backAndWait();
      }
    };
  }, [open]);

  return (
    <Lightbox
      open={open}
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
