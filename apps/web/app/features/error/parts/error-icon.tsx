import { AlertTriangleIcon, FileQuestionIcon } from "lucide-react";

type Props = {
  status?: number;
};

export function ErrorIcon({ status }: Props) {
  const Icon = status === 404 ? FileQuestionIcon : AlertTriangleIcon;

  return (
    <div
      className="
        flex size-12 items-center justify-center rounded-full bg-destructive/10
      "
    >
      <Icon className="size-6 text-destructive" />
    </div>
  );
}
