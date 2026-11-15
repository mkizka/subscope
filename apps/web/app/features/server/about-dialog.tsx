import { type ReactNode, useRef } from "react";

import { Button } from "@/app/components/ui/button";

type Props = {
  children: (open: () => void) => ReactNode;
};

export function AboutDialog({ children }: Props) {
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
            <h3 className="font-bold">Blueskyとの違い</h3>
            <p>
              登録も登録者からのフォローもされていないアカウントを表示しないため、Blueskyと比べて以下の違いがあります。
            </p>
            <ul className="list-disc pl-5">
              <li>
                いいね、リポスト、フォロワーなどの数はBlueskyより小さく表示されます
              </li>
              <li>検索結果に表示される投稿やアカウントが少なくなります</li>
              <li>いくつかの機能が未実装です</li>
            </ul>
            <p>機能面では「限られた部分だけ動作するBluesky」といえます。</p>
          </section>
          <section className="space-y-1">
            <h3 className="font-bold">Subscopeの目的</h3>
            <p>
              通常、Blueskyと連携する分散SNSを作るにはBlueskyと同等に強力なサーバーが必要です。
            </p>
            <p>
              Subscopeは一部のデータのみ保存する方針によってサーバーに保存するデータを大幅に減らし、誰でも個人でBlueskyと連携する分散SNSを運営できることを目指しています。
            </p>
          </section>
        </div>
      </dialog>
    </>
  );
}
