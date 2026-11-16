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
            SubscopeはBlueskyでフォローしている人だけを表示する分散SNS実装です。
          </p>
          <section className="space-y-1">
            <h3 className="font-bold">Blueskyとの違い</h3>
            <p>
              表示されるのは登録しているアカウントとそのフォロー先だけです。その分いいねやフォロワーなどの数は少なめになります。検索で見つかる投稿やアカウントも少なくなります。また一部の機能はまだありません。
            </p>
          </section>
          <section className="space-y-1">
            <h3 className="font-bold">Subscopeの目的</h3>
            <p>
              Blueskyと連携するSNSを普通に作るとBluesky並みに大きなサーバーが必要です。Subscopeは保存するデータを絞ってサーバー代をできるだけ抑えています。
            </p>
            <p>
              またBlueskyのシステムにはなるべく頼らない作りにしています※。Blueskyを離れたくなったときに誰でも自分でサーバーを持てることを目指しています。
            </p>
            <p className="text-caption text-muted">
              ※今はリレーとplc.directoryとモデレーションにBlueskyのものを使っています。詳しい人なら自前のものに置き換えられます。
            </p>
          </section>
        </div>
      </dialog>
    </>
  );
}
