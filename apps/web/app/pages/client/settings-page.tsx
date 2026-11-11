import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { SettingsContainer } from "@/app/features/settings/settings-container";

type Props = {
  accountUrl: string | null;
};

export function SettingsPage({ accountUrl }: Props) {
  return (
    <ThreeColumnLayout>
      <SettingsContainer accountUrl={accountUrl} />
    </ThreeColumnLayout>
  );
}
