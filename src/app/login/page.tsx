import type { Metadata } from "next";
import { LoginCard } from "@/components/auth/login-card";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Sign in — ${brand.name}`,
  description: "Sign in to manage your land listings and development groups.",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <main id="main" className="login-page">
      <LoginCard />
    </main>
  );
}
