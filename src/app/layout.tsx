import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProvider } from "../providers/app-provider";
import { Sidebar } from "../components/sidebar";
import { AuthGuard } from "../components/auth/auth-guard";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nutrition Staff — User Management",
  description: "Smoke test app for @kira-joo/frontend-toolkit-core and @kira-joo/frontend-toolkit-tailwind",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <AppProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
              <AuthGuard>{children}</AuthGuard>
            </main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
