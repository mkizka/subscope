import { PenSquareIcon } from "lucide-react";
import {
  createContext,
  type ReactNode,
  use,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFetcher } from "react-router";
import { z } from "zodV4";

import type { action } from "@/app/routes/_index";

import {
  countGraphemes,
  MAX_IMAGES,
  MAX_POST_LENGTH,
  PostForm,
  REPLY_RULES,
} from "./post-form";

export const postSchema = z
  .object({
    text: z
      .string()
      .default("")
      .refine((text) => countGraphemes(text) <= MAX_POST_LENGTH),
    image: z.array(z.instanceof(File)).max(MAX_IMAGES).default([]),
    alt: z.array(z.string().default("")).default([]),
    type: z.enum(["reply", "quote"]).optional(),
    uri: z.string().optional(),
    cid: z.string().optional(),
    rootUri: z.string().optional(),
    rootCid: z.string().optional(),
    threadgate: z.boolean().default(false),
    allow: z.array(z.enum(REPLY_RULES.map(({ rule }) => rule))).default([]),
  })
  .refine(({ text, image }) => text.trim() !== "" || image.length > 0);

export type ComposeTarget = {
  type: "reply" | "quote";
  uri: string;
  cid: string;
  handle: string;
  root?: { uri: string; cid: string };
  onPosted?: () => void;
};

type OpenCompose = (target?: ComposeTarget) => void;

const ComposeContext = createContext<OpenCompose>(() => {});

export const useCompose = () => use(ComposeContext);

function PostFormDialogContainer({
  target,
  onClose,
}: {
  target?: ComposeTarget;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const fetcher = useFetcher<typeof action>();
  const uri =
    fetcher.data && "uri" in fetcher.data ? fetcher.data.uri : undefined;

  useEffect(() => ref.current?.showModal(), []);
  useEffect(() => {
    if (!uri) return;
    target?.onPosted?.();
    ref.current?.close();
  }, [uri, target]);

  return (
    <dialog ref={ref} className="modal" aria-label="投稿" onClose={onClose}>
      <div className="modal-box">
        <PostForm
          context={
            target &&
            `@${target.handle} ${target.type === "reply" ? "に返信" : "を引用"}`
          }
          onCancel={() => ref.current?.close()}
          isSubmitting={fetcher.state !== "idle"}
          error={
            fetcher.data && "error" in fetcher.data
              ? fetcher.data.error
              : undefined
          }
          onSubmit={(formData) => {
            if (target) {
              formData.set("type", target.type);
              formData.set("uri", target.uri);
              formData.set("cid", target.cid);
              formData.set("rootUri", target.root?.uri ?? "");
              formData.set("rootCid", target.root?.cid ?? "");
            }
            return fetcher.submit(formData, {
              method: "POST",
              action: "/?index",
              encType: "multipart/form-data",
            });
          }}
        />
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">閉じる</button>
      </form>
    </dialog>
  );
}

export function ComposeProvider({ children }: { children: ReactNode }) {
  const [compose, setCompose] = useState<{ target?: ComposeTarget }>();
  return (
    <ComposeContext value={(target) => setCompose({ target })}>
      {children}
      {compose && (
        <PostFormDialogContainer
          target={compose.target}
          onClose={() => setCompose(undefined)}
        />
      )}
    </ComposeContext>
  );
}

export function ComposeButton({
  className,
  children,
}: {
  className: string;
  children?: ReactNode;
}) {
  const openCompose = useCompose();
  return (
    <button
      type="button"
      className={className}
      aria-label="新規投稿"
      onClick={() => openCompose()}
    >
      <PenSquareIcon className="size-5" />
      {children}
    </button>
  );
}
