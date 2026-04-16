"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Inbox, Wind, ShieldAlert } from "lucide-react";
import { useCurrentHospital } from "@/lib/hooks/use-current-hospital";
import { useReceivedReferrals } from "@/lib/queries/referrals";
import { Skeleton } from "@/components/ui/skeleton";
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
  CONFIRMED: "bg-blue-100 text-blue-700",
  ACCEPTED:  "bg-teal-100 text-teal-700",
  COMPLETED: "bg-slate-100 text-slate-600",
  REJECTED:  "bg-red-100 text-red-700",
};

const COLS = "grid grid-cols-[5.5rem_1fr_8.5rem_6rem_3rem_5rem] gap-4 items-center";

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

  const stats = useMemo(() => ({
    total:     referrals.length,
    pending:   referrals.filter((r) => r.status === "REQUESTED" || r.status === "CONFIRMED").length,
    accepted:  referrals.filter((r) => r.status === "ACCEPTED").length,
    completed: referrals.filter((r) => r.status === "COMPLETED").length,
  }), [referrals]);

  // CONFIRMED는 아직 수용/거절 결정 전 — 처리 필요 섹션에 포함
  const pending = useMemo(() =>
    referrals.filter((r) => r.status === "REQUESTED" || r.status === "CONFIRMED"), [referrals]);

  // 처리 완료: 수용·완료·불가만
  const others = useMemo(() =>
    referrals.filter((r) => r.status === "ACCEPTED" || r.status === "COMPLETED" || r.status === "REJECTED"), [referrals]);

  if (!isLoaded || !hospital) return null;

  return (
    <div>
      {/* ── 헤더 ── */}
      <div className="-mx-4 mb-8 border-b">
        <div className="px-6 pt-2 pb-5">
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium mb-2">
            협력병원 병상 관리
          </p>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight leading-none text-foreground">
                받은 회송 요청
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">{hospital.name}</p>
            </div>
            {stats.pending > 0 && (
              <span className="inline-flex items-center px-3 py-1.5 bg-amber-100 text-amber-700 text-sm font-semibold shrink-0">
                대기 {stats.pending}건
              </span>
            )}
          </div>
        </div>

        {/* 스탯 스트립 */}
        <div className="border-t grid grid-cols-4 divide-x bg-muted/40">
          {[
            { label: "전체 수신", value: stats.total,     color: "text-foreground" },
            { label: "처리 필요", value: stats.pending,   color: stats.pending   > 0 ? "text-amber-600" : "text-foreground" },
            { label: "수용됨",   value: stats.accepted,   color: stats.accepted  > 0 ? "text-teal-600"  : "text-foreground" },
            { label: "완료됨",   value: stats.completed,  color: stats.completed > 0 ? "text-slate-500" : "text-foreground" },
          ].map(({ label, value, color }) => (
            <div key={label} className="px-6 py-4">
              <p className="text-muted-foreground text-sm uppercase tracking-wider font-medium">
                {label}
              </p>
              <p className={`text-3xl font-bold mt-1 tabular-nums ${color}`}>
                {String(value).padStart(2, "0")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 리스트 ── */}
      {isLoading ? (
        <TableSkeleton />
      ) : referrals.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-10">
          {pending.length > 0 && (
            <Section title="처리 필요" count={pending.length}>
              {pending.map((r) => (
                <ReferralRow key={r.id} referral={r} />
              ))}
            </Section>
          )}
          {others.length > 0 && (
            <Section title="처리 완료" count={others.length} muted>
              {others.map((r) => (
                <ReferralRow key={r.id} referral={r} />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

/* ── 스켈레톤 ── */
function TableSkeleton() {
  return (
    <div className="space-y-2">
      <div className={`${COLS} px-3 py-2.5 border-b bg-muted/40`}>
        {["REF", "환자", "요청 병원", "희망일", "특이", "상태"].map((label) => (
          <Skeleton key={label} className="h-4 w-full" />
        ))}
      </div>
      <div className="divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`${COLS} px-3 py-4`}>
            <Skeleton className="h-4 w-20" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3.5 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-6 mx-auto" />
            <Skeleton className="h-5 w-12 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 섹션 ── */
type SectionProps = {
  title: string;
  count: number;
  muted?: boolean;
  children: React.ReactNode;
};

function Section({ title, count, muted = false, children }: SectionProps) {
  return (
    <div>
      <div className="flex items-baseline gap-2.5 border-b pb-2">
        <h2 className={`text-sm font-semibold uppercase tracking-wider ${muted ? "text-muted-foreground" : "text-foreground"}`}>
          {title}
        </h2>
        <span className={`text-sm font-bold tabular-nums ${muted ? "text-muted-foreground" : "text-primary"}`}>
          {String(count).padStart(2, "0")}
        </span>
      </div>

      {/* 컬럼 헤더 */}
      <div className={`${COLS} px-3 py-2.5 border-b bg-muted/40`}>
        {[
          { key: "ref",      label: "REF",     center: false },
          { key: "patient",  label: "환자",    center: false },
          { key: "hospital", label: "요청 병원", center: true },
          { key: "date",     label: "희망일",  center: true },
          { key: "flag",     label: "특이",    center: true },
          { key: "status",   label: "상태",    center: true },
        ].map(({ key, label, center }) => (
          <span
            key={key}
            className={`text-sm font-semibold uppercase tracking-wider text-muted-foreground ${center ? "text-center" : ""}`}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="divide-y overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

/* ── 행 ── */
function ReferralRow({ referral }: { referral: Referral }) {
  const refId = `REF-${referral.id.slice(0, 6).toUpperCase()}`;
  const isPending = referral.status === "REQUESTED" || referral.status === "CONFIRMED";

  return (
    <Link href={`/receiver/${referral.id}`}>
      <div className={`${COLS} px-3 py-4 transition-colors ${isPending ? "hover:bg-amber-50" : "hover:bg-muted/30 opacity-75"}`}>
        {/* REF ID */}
        <span className="text-sm font-mono font-semibold text-foreground leading-none">
          {refId}
        </span>

        {/* 환자 정보 */}
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-foreground">{referral.patient_initial}</span>
            <span className="text-sm text-muted-foreground">
              {referral.age}세 · {referral.gender === "M" ? "남" : "여"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate">{referral.diagnosis ?? "—"}</p>
        </div>

        {/* 요청 병원 */}
        <div className="text-sm text-muted-foreground text-center truncate">
          {referral.from_hospital?.name ?? "—"}
        </div>

        {/* 희망일 */}
        <div className="text-sm text-muted-foreground text-center">
          {referral.preferred_date
            ? new Date(referral.preferred_date).toLocaleDateString("ko-KR", {
                month: "2-digit",
                day: "2-digit",
              })
            : "—"}
        </div>

        {/* 특이 아이콘 */}
        <div className="flex items-center justify-center gap-1">
          {referral.needs_oxygen    && <Wind        className="h-4 w-4 text-blue-500   shrink-0" />}
          {referral.needs_isolation && <ShieldAlert className="h-4 w-4 text-orange-500 shrink-0" />}
        </div>

        {/* 상태 배지 */}
        <div className="flex justify-center">
          <span className={`inline-flex items-center px-2 py-0.5 text-sm font-medium ${STATUS_CLASS[referral.status]}`}>
            {STATUS_LABEL[referral.status]}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── 빈 상태 ── */
function EmptyState() {
  return (
    <div className="text-center py-16 border-t border-b">
      <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
      <p className="text-muted-foreground font-medium">수신된 요청이 없습니다</p>
      <p className="text-sm text-muted-foreground mt-1">
        상급병원에서 회송 요청을 보내면 여기에 표시됩니다
      </p>
    </div>
  );
}
