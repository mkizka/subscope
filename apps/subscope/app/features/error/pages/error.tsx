import { AppLayout } from "@/app/components/layout";
import { ErrorCard } from "@/app/features/error/blocks/error-card";

type Props = {
  title: string;
  details: string;
  status?: number;
  stack?: string;
};

export function ErrorPage({ title, details, status, stack }: Props) {
  return (
    <AppLayout verticalCenter>
      <ErrorCard
        title={title}
        details={details}
        status={status}
        stack={stack}
      />
    </AppLayout>
  );
}
