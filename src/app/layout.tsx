import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { HospitalSwitcher } from "@/components/hospital-switcher";
import { NotificationBell } from "@/components/notification-bell";
import { ErrorBoundary } from "@/components/error-boundary";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CMP — 환자 회송 관리 플랫폼",
  description: "상급병원 ↔ 협력병원 환자 회송 요청·수용 관리 시스템 MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-muted/30">
        <Providers>
          {/* 상단 네비 */}
          <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
              <span className="font-semibold text-sm tracking-tight">
                CMP{" "}
                <span className="text-muted-foreground font-normal">
                  환자 회송 관리
                </span>
              </span>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <HospitalSwitcher />
              </div>
            </div>
          </header>

          {/* 본문 */}
          <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
