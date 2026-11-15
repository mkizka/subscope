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
              Subscopeでは、サーバーに登録しているアカウント、または登録アカウントからフォローされているアカウントのみが表示されます。
            </p>
            <p>そのためBlueskyと比べて、以下の違いがあります。</p>
            <ul className="list-disc pl-5">
              <li>
                いいね、リポスト、フォロワーなどの数は、多くの場合Blueskyより少なく表示されます
              </li>
              <li>検索結果に出てくる投稿やアカウントも少なくなります</li>
            </ul>
            <p>
              機能面では「限られた部分だけ表示するBluesky」です。なお、一部の機能は未実装です。
            </p>
          </section>
          <section className="space-y-1">
            <h3 className="font-bold">Subscopeの目的</h3>
            <p>
              通常、Blueskyと連携する分散SNSを作るには、Blueskyと同等の性能を持つサーバーが必要です。
            </p>
            <p>
              Subscopeは保存するデータを一部に絞ることで、サーバーの保存量を大幅に減らし、誰でも個人で運営できるBluesky連携の分散SNSを目指しています。
            </p>
          </section>
        </div>
      </dialog>
    </>
  );
}
