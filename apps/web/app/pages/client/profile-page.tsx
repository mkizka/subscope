import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { ProfileContainer } from "@/app/features/profile/profile-container";

type Props = {
  handle: string;
};

export function ProfilePage({ handle }: Props) {
  return (
    <ThreeColumnLayout>
      <ProfileContainer handle={handle} />
    </ThreeColumnLayout>
  );
}
