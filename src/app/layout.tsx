import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/components/Providers";
import AppShell from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";

const appSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  display: "swap",
});

const appDisplay = localFont({
  src: "./fonts/GeistVF.woff",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var saved=localStorage.getItem('theme');var system=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var theme=(saved==='dark'||saved==='light')?saved:system;document.documentElement.setAttribute('data-theme',theme);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={cn(
  "antialiased bg-app text-slate-900 transition-colors duration-300",
  appSans.variable,
  appDisplay.variable
)}
      >
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
