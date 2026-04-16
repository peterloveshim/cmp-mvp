"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Inbox, Building2, CalendarDays } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useCurrentHospital } from "@/lib/hooks/use-current-hospital";
import { useReceivedReferrals } from "@/lib/queries/referrals";
import type { Referral, ReferralStatus } from "@/types";

const STATUS_LABEL: Record<ReferralStatus, string> = {
  REQUESTED: "요청중",
  CONFIRMED: "확인됨",
  ACCEPTED:  "수용",
  REJECTED:  "불가",
  COMPLETED: "완료",
};

const STATUS_CLASS: Record<ReferralStatus, string> = {
  REQUESTED: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-teal-100 text-teal-700",
  ACCEPTED:  "bg-teal-100 text-teal-600",
  COMPLETED: "bg-slate-100 text-slate-500",
  REJECTED:  "bg-red-100 text-red-700",
};

const ADL_LABEL: Record<string, string> = {
  INDEPENDENT: "독립",
  PARTIAL:     "부분의존",
  DEPENDENT:   "완전의존",
};

export default function ReceiverPage() {
  const router = useRouter();
  const { hospital, isLoaded } = useCurrentHospital();
  const { data: referrals = [], isLoading } = useReceivedReferrals(
    hospital?.id ?? null,
  );

  useEffect(() => {
    if (isLoaded && !hospital) router.replace("/");
    if (isLoaded && hospital?.type === "TERTIARY") router.replace("/sender");
  }, [isLoaded, hospital, router]);

  if (!isLoaded || !hospital) return null;

  // REQUESTED 우선, 나머지 최신순 (쿼리에서 이미 정렬됨)
  const pending = referrals.filter((r) => r.status === "REQUESTED");
  const others  = referrals.filter((r) => r.status !== "REQUESTED");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">받은 회송 요청</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hospital.name}으로 수신된 요청 목록
          </p>
        </div>
        {pending.length > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
            미처리 {pending.length}건
          </span>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          불러오는 중...
        </p>
      ) : referrals.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                처리 필요
              </h2>
              <div className="space-y-3">
                {pending.map((r) => (
                  <ReferralCard key={r.id} referral={r} />
                ))}
              </div>
            </section>
          )}
          {others.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                처리 완료
              </h2>
              <div className="space-y-3">
                {others.map((r) => (
                  <ReferralCard key={r.id} referral={r} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ReferralCard({ referral }: { referral: Referral }) {
  const isPending = referral.status === "REQUESTED";

  return (
    <Link href={`/receiver/${referral.id}`}>
      <Card
        className={`cursor-pointer transition-all group ${
          isPending
            ? "hover:border-primary/50 hover:shadow-sm border-amber-200"
            : "hover:border-border/80 opacity-80"
        }`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {referral.patient_initial}
                <span className="text-sm font-normal text-muted-foreground">
                  {referral.age}세 · {referral.gender === "M" ? "남" : "여"}
                </span>
              </CardTitle>
              <CardDescription className="mt-0.5">
                {referral.diagnosis}
              </CardDescription>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${STATUS_CLASS[referral.status]}`}
            >
              {STATUS_LABEL[referral.status]}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {referral.from_hospital?.name ?? "알 수 없음"}
            </span>
            {referral.preferred_date && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                희망일: {new Date(referral.preferred_date).toLocaleDateString("ko-KR")}
              </span>
            )}
            {referral.adl && (
              <span>ADL: {ADL_LABEL[referral.adl]}</span>
            )}
            <div className="flex gap-1 ml-auto">
              {referral.needs_oxygen && (
                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-xs">산소</span>
              )}
              {referral.needs_isolation && (
                <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 text-xs">격리</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 border-2 border-dashed rounded-xl">
      <Inbox className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
      <p className="text-muted-foreground font-medium">수신된 요청이 없습니다</p>
      <p className="text-sm text-muted-foreground/70 mt-1">
        상급병원에서 회송 요청을 보내면 여기에 표시됩니다
      </p>
    </div>
  );
}
