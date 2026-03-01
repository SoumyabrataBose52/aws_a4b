import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nexus Solo — AI-Powered Creator Management",
  description:
    "The multi-agent AI command center that helps solopreneur creator managers scale their operations, automate workflows, and maximize revenue.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", overflow: "hidden" }}>{children}</div>
  );
}
