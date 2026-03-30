import { AuthOnboardingFlow } from "@/components/auth/AuthOnboardingFlow";

export default function AuthPage() {
  return (
    <main className="grain min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
      <AuthOnboardingFlow />
      </div>
    </main>
  );
}
