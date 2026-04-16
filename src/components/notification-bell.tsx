"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useReceivedReferrals,
  useUnreadCount,
} from "@/lib/queries/referrals";
import { useCurrentHospital } from "@/lib/hooks/use-current-hospital";
import { useRealtimeReferrals } from "@/lib/hooks/use-realtime-referrals";
import { Badge } from "@/components/ui/badge";

export function NotificationBell() {
  const { hospital } = useCurrentHospital();
  // 드롭다운이 열린 pathname을 기억 — pathname이 바뀌면 자동으로 닫힘 (useEffect 없이)
  const [openPathname, setOpenPathname] = useState<string | null>(null);
  const pathname = usePathname();
  const open = openPathname !== null && openPathname === pathname;
  const bellRef = useRef<HTMLButtonElement>(null);

  const { data: count = 0 } = useUnreadCount(hospital?.id ?? null);
  const { data: referrals = [] } = useReceivedReferrals(hospital?.id ?? null);

  // Realtime 구독 — 협력병원 전용 채널
  useRealtimeReferrals(
    hospital?.type === "PARTNER" ? `receiver:${hospital.id}` : null,
  );

  // 새 요청 감지: 이전 count와 비교
  const prevCountRef = useRef(count);
  useEffect(() => {
    if (prevCountRef.current === count) return;

    if (count > prevCountRef.current) {
      // Bell 진동 — DOM 직접 조작 (setState 없이 애니메이션 트리거)
      const el = bellRef.current;
      if (el) {
        el.dataset.ringing = "true";
        setTimeout(() => {
          if (el) el.dataset.ringing = "";
        }, 1000);
      }

      // amber Toast
      toast("새 회송 요청이 도착했습니다", {
        description: `미처리 요청 ${count}건`,
        duration: 5000,
        action: {
          label: "확인",
          onClick: () => setOpenPathname(pathname),
        },
        style: {
          background: "#fffbeb",
          border: "1px solid #f59e0b",
          color: "#92400e",
        },
      });
    }

    prevCountRef.current = count;
  }, [count, pathname]);

  // 최근 5건
  const recent = referrals.slice(0, 5);

  if (!hospital || hospital.type !== "PARTNER") return null;

  return (
    <div className="relative">
      <Button
        ref={bellRef}
        variant="ghost"
        size="icon"
        className="relative data-[ringing=true]:[&_svg]:animate-[ring_0.5s_ease-in-out_2]"
        onClick={() => setOpenPathname((prev) => prev === pathname ? null : pathname)}
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
            onClick={() => setOpenPathname(null)}
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
                      onClick={() => setOpenPathname(null)}
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
