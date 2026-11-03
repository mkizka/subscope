import { Skeleton } from "./ui/skeleton";

const rows = [
  ["w-2/5", "w-11/12", "w-3/4"],
  ["w-1/3", "w-5/6", "w-1/2"],
  ["w-1/2", "w-3/4", "w-11/12"],
];

export function PostsSkeleton() {
  return (
    <div role="status" aria-label="読み込み中">
      {rows.map((widths) => (
        <div
          key={widths.join()}
          className="flex gap-3 border-b border-line px-4 py-3"
        >
          <span className="size-10 shrink-0 rounded-full bg-surface-2" />
          <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
            {widths.map((width) => (
              <Skeleton
                key={width}
                className={`
                  h-3.5
                  ${width}
                `}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
