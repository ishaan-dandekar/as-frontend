import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { cn } from "@/lib/utils";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "APSIT Student Sphere | Student Project Platform",
  description:
    "A professional platform for students to collaborate, share projects, and find teammates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          "antialiased bg-app text-slate-900",
          manrope.variable,
          spaceGrotesk.variable
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
