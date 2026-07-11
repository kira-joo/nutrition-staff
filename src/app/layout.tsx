import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProvider } from "../providers/app-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nutrition Staff — User Management",
  description:
    "Smoke test app for @kira-joo/frontend-toolkit-core and @kira-joo/frontend-toolkit-tailwind",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
