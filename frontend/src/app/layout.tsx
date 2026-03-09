import type { Metadata } from "next";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Nexus Solo — AI Command Center",
  description: "Multi-agent AI command center for solopreneur creator managers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="breathing-bg" />
        <TooltipProvider>
          <LayoutShell>{children}</LayoutShell>
        </TooltipProvider>
      </body>
    </html>
  );
}
