import { type ReactNode, useRef } from "react";

import { Button } from "@/app/components/ui/button";

type Props = {
  operator?: { handle: string; displayName?: string };
  children: (open: () => void) => ReactNode;
};

export function AboutDialog({ operator, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      {children(() => ref.current?.showModal())}
      <dialog
        ref={ref}
        className="
          mx-auto mt-4 mb-auto w-lg max-w-[calc(100%-2rem)] rounded-xl
          bg-surface text-left text-ink
          backdrop:bg-black/40
          open:flex open:max-h-[85dvh] open:flex-col
          md:my-auto
        "
        aria-label="Subscopeとは"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className="flex items-center justify-between border-b border-line p-4">
          <h2 className="text-heading">Subscopeとは</h2>
          <Button
            type="button"
            variant="secondary"
            onClick={() => ref.current?.close()}
          >
            閉じる
          </Button>
        </div>
        <div className="space-y-4 overflow-y-auto p-4 text-label">
          <p>
            SubscopeはBlueskyでフォローしている人の投稿だけが流れる分散SNSです。
          </p>
          <section className="space-y-1">
            <h3 className="font-bold">仕組み</h3>
            <p>
              Subscopeにログインするとあなたのアカウントが登録され、アカウントの情報を読み込みます。このとき、あなたがフォローしている全てのアカウントの情報も読み込みます。これにより、サーバーに登録した人と、その誰かがフォローした人の投稿が表示されます。
            </p>
          </section>
          <section className="space-y-1">
            <h3 className="font-bold">Subscopeが目指すもの</h3>
            <p>
              これまでBlueskyと連携する分散SNSを作るには、Blueskyと同等に強力なサーバーが必要でした。Subscopeは上記の仕組みでサーバーに保存するデータを大幅に減らし、誰でも個人でBlueskyの仕組みを使った分散SNSを運営できることを目指しています。
            </p>
          </section>
          {operator && (
            <p className="text-caption text-muted">
              運営: {operator.displayName || operator.handle}（@
              {operator.handle}）
            </p>
          )}
        </div>
      </dialog>
    </>
  );
}
