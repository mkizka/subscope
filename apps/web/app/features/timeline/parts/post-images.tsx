import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";

export type PostImage = { thumb: string; fullsize: string; alt: string };

export function PostImages({ images }: { images: PostImage[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const image = index === null ? undefined : images[index];
  const move = (delta: number) => {
    if (index === null) return;
    const next = index + delta;
    if (next >= 0 && next < images.length) setIndex(next);
  };
  return (
    <>
      <div className="relative mt-2 grid grid-cols-2 gap-1">
        {images.map((image, i) => (
          <button
            key={image.thumb}
            type="button"
            className="cursor-zoom-in"
            onClick={() => {
              setIndex(i);
              ref.current?.showModal();
            }}
          >
            <img
              src={image.thumb}
              alt={image.alt}
              className="aspect-square w-full rounded-sm object-cover"
            />
          </button>
        ))}
      </div>
      <dialog
        ref={ref}
        className="modal bg-black/70 text-white"
        aria-label="画像の拡大表示"
        onClose={() => setIndex(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") move(-1);
          if (e.key === "ArrowRight") move(1);
        }}
      >
        {image && index !== null && (
          <>
            <figure
              className="
                col-start-1 row-start-1 flex flex-col items-center gap-2 px-14
              "
            >
              <img
                src={image.fullsize}
                alt={image.alt}
                className="max-h-[calc(100dvh-8rem)] object-contain"
              />
              {image.alt && (
                <figcaption className="text-sm whitespace-pre-wrap">
                  {image.alt}
                </figcaption>
              )}
            </figure>
            {images.length > 1 && (
              <span className="fixed top-4 left-4 text-sm">
                {index + 1} / {images.length}
              </span>
            )}
            <form method="dialog">
              <button
                type="submit"
                aria-label="画像を閉じる"
                className="btn fixed top-2 right-2 btn-circle btn-ghost"
              >
                <XIcon />
              </button>
            </form>
            {index > 0 && (
              <button
                type="button"
                aria-label="前の画像"
                className="
                  btn fixed top-1/2 left-2 btn-circle -translate-y-1/2 btn-ghost
                "
                onClick={() => move(-1)}
              >
                <ChevronLeftIcon />
              </button>
            )}
            {index < images.length - 1 && (
              <button
                type="button"
                aria-label="次の画像"
                className="
                  btn fixed top-1/2 right-2 btn-circle -translate-y-1/2
                  btn-ghost
                "
                onClick={() => move(1)}
              >
                <ChevronRightIcon />
              </button>
            )}
          </>
        )}
        <form method="dialog" className="modal-backdrop">
          <button type="submit">閉じる</button>
        </form>
      </dialog>
    </>
  );
}
