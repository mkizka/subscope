import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { NotificationPanelContainer } from "@/app/features/notification/blocks/notification-panel-container";

export function NotificationsPage() {
  return (
    <ThreeColumnLayout>
      <NotificationPanelContainer />
    </ThreeColumnLayout>
  );
}
