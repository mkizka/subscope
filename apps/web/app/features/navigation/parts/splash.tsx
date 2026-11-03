export function Splash() {
  return (
    <div
      className="
        fixed inset-0 z-50 flex flex-col items-center justify-center gap-4
        bg-surface text-ink
      "
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-brand-soft"
      >
        <div className="h-full w-1/3 animate-progress bg-brand" />
      </div>
      <img src="/favicon.svg" alt="" className="size-20" />
      <div className="text-title">Subscope</div>
      <div role="status" className="text-label text-muted">
        読み込み中
      </div>
    </div>
  );
}
