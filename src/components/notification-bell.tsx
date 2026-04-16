"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  useReceivedReferrals,
  useUnreadCount,
} from "@/lib/queries/referrals";
import { useCurrentHospital } from "@/lib/hooks/use-current-hospital";
import { Badge } from "@/components/ui/badge";

export function NotificationBell() {
  const { hospital } = useCurrentHospital();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 경로 변경 시 드롭다운 닫기
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const { data: count = 0 } = useUnreadCount(hospital?.id ?? null);
  const { data: referrals = [] } = useReceivedReferrals(hospital?.id ?? null);

  // 최근 5건
  const recent = referrals.slice(0, 5);

  if (!hospital || hospital.type !== "PARTNER") return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((v) => !v)}
        aria-label="알림"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-sm">
            {count > 9 ? "9+" : count}
          </Badge>
        )}
      </Button>

      {open && (
        <>
          {/* 바깥 클릭 닫기 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-10 z-20 w-72 rounded-lg border bg-background shadow-lg">
            <div className="px-4 py-3 border-b">
              <p className="text-sm font-semibold">최근 요청</p>
            </div>
            {recent.length === 0 ? (
              <p className="px-4 py-6 text-sm text-center text-muted-foreground">
                요청이 없습니다
              </p>
            ) : (
              <ul className="divide-y">
                {recent.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/receiver/${r.id}`}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 hover:bg-muted/40 transition-colors"
                    >
                      <p className="text-sm font-medium">{r.patient_initial}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {r.from_hospital?.name ?? "—"} ·{" "}
                        <span
                          className={
                            r.status === "REQUESTED"
                              ? "text-amber-600"
                              : "text-muted-foreground"
                          }
                        >
                          {r.status === "REQUESTED" ? "대기중" : r.status}
                        </span>
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
