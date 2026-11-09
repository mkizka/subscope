import { AlertTriangleIcon, FileQuestionIcon } from "lucide-react";

type Props = {
  status?: number;
};

export function ErrorIcon({ status }: Props) {
  const notFound = status === 404;
  const Icon = notFound ? FileQuestionIcon : AlertTriangleIcon;

  return (
    <div
      className={`
        flex size-12 items-center justify-center rounded-full
        ${notFound ? "bg-surface-2" : "bg-danger/10"}
      `}
    >
      <Icon
        className={`
          size-6
          ${notFound ? "text-muted" : "text-danger"}
        `}
      />
    </div>
  );
}
