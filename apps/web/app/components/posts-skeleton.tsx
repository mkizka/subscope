import { Skeleton } from "./ui/skeleton";

type Media = "image" | "quote";

const rows: { body: string[]; media?: Media }[] = [
  { body: ["w-11/12", "w-3/4"] },
  { body: ["w-5/6"], media: "image" },
  { body: ["w-full", "w-1/2"], media: "quote" },
  { body: ["w-3/4", "w-11/12", "w-1/3"] },
  { body: ["w-5/6", "w-2/3"] },
  { body: ["w-1/2"], media: "image" },
];

export function PostsSkeleton() {
  return (
    <div role="status" aria-label="読み込み中">
      {rows.map(({ body, media }) => (
        <div
          key={`${body.join()}${media}`}
          className="flex gap-3 border-b border-line px-4 py-3"
        >
          <Skeleton className="size-10 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-1/2" />
            {body.map((width) => (
              <Skeleton
                key={width}
                className={`
                  h-3.5
                  ${width}
                `}
              />
            ))}
            {media === "image" && (
              <Skeleton className="h-32 w-full rounded-xl" />
            )}
            {media === "quote" && (
              <div
                className="
                  flex flex-col gap-2 rounded-xl border border-line px-3 py-2
                "
              >
                <Skeleton className="h-3.5 w-2/5" />
                <Skeleton className="h-3.5 w-11/12" />
              </div>
            )}
            <div className="flex gap-7">
              <Skeleton className="h-3.5 w-7" />
              <Skeleton className="h-3.5 w-7" />
              <Skeleton className="h-3.5 w-7" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
