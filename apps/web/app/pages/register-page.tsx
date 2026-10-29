import { AppLayout } from "@/app/components/app-layout";
import { RegisterCardContainer } from "@/app/features/register/blocks/register-card-container";

type Props = {
  isLoggedIn: boolean;
};

export function RegisterPage({ isLoggedIn }: Props) {
  return (
    <AppLayout verticalCenter>
      <RegisterCardContainer isLoggedIn={isLoggedIn} />
    </AppLayout>
  );
}
