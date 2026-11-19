import { PublicMap } from "@/components/map/public-map";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";

export default function HomePage() {
  return (
    <OnboardingGate>
      <PublicMap />
    </OnboardingGate>
  );
}
