import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PawWalk — On-demand dog walking, booked in seconds",
  description:
    "Find trusted local dog walkers, book a walk, and pay securely — all from your phone. Live GPS tracking on every walk.",
  openGraph: {
    title: "PawWalk",
    description: "On-demand dog walking, booked in seconds.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
