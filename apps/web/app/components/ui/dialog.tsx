import type { ComponentProps, ReactNode } from "react";

type Props = Omit<ComponentProps<"dialog">, "className" | "onClick"> & {
  title: string;
  actions: ReactNode;
};

export function Dialog({ title, actions, children, ...props }: Props) {
  return (
    <dialog
      className="
        m-auto w-lg rounded-xl bg-surface text-ink
        backdrop:bg-black/40
      "
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      {...props}
    >
      <div className="flex flex-col gap-4 p-4">
        <h2 className="text-heading">{title}</h2>
        {children}
        <div className="flex justify-end gap-2">{actions}</div>
      </div>
    </dialog>
  );
}
