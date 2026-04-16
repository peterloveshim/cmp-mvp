"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Wind,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useUpdateReferralStatus,
  useSentReferrals,
} from "@/lib/queries/referrals";
import { useCurrentHospital } from "@/lib/hooks/use-current-hospital";
import { useRealtimeReferrals } from "@/lib/hooks/use-realtime-referrals";
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

const ADL_PRIORITY: Record<string, string> = {
  DEPENDENT:   "HIGH",
  PARTIAL:     "MID",
  INDEPENDENT: "LOW",
};

const PRIORITY_CLASS: Record<string, string> = {
  HIGH: "text-red-500 font-bold",
  MID:  "text-amber-500 font-semibold",
  LOW:  "text-slate-400",
};

/* 데스크탑 전용 컬럼 그리드 */
const COLS = "grid grid-cols-[5.5rem_1fr_8.5rem_5.5rem_3rem_5rem_8.5rem] gap-4 items-center";

export default function SenderPage() {
  const router = useRouter();
  const { hospital, isLoaded } = useCurrentHospital();
  const { data: referrals = [], isLoading } = useSentReferrals(
    hospital?.id ?? null,
  );

  // Realtime 구독 — 상급병원 전용 채널
  useRealtimeReferrals(
    hospital?.type === "TERTIARY" ? `sender:${hospital.id}` : null,
  );

  useEffect(() => {
    if (isLoaded && !hospital) router.replace("/");
    if (isLoaded && hospital?.type === "PARTNER") router.replace("/receiver");
  }, [isLoaded, hospital, router]);

  // 상태 변경 감지 — 이전 데이터와 비교해 Toast 표시
  const prevReferralsRef = useRef<Referral[]>([]);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (isLoading) return;

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      prevReferralsRef.current = referrals;
      return;
    }

    const prev = prevReferralsRef.current;

    for (const curr of referrals) {
      const prevItem = prev.find((r) => r.id === curr.id);
      if (!prevItem || prevItem.status === curr.status) continue;

      const name = curr.patient_initial;
      const hospital_name = curr.to_hospital?.name ?? "협력병원";

      if (curr.status === "ACCEPTED") {
        toast.success(`${name} 환자 요청이 수용되었습니다`, {
          description: `${hospital_name}이(가) 회송을 수용했습니다.`,
          duration: 6000,
        });
      } else if (curr.status === "REJECTED") {
        toast.error(`${name} 환자 요청이 반려되었습니다`, {
          description: curr.reject_reason
            ? `사유: ${curr.reject_reason}`
            : `${hospital_name}이(가) 불가 처리했습니다.`,
          duration: 6000,
        });
      }
    }

    prevReferralsRef.current = referrals;
  }, [referrals, isLoading]);

  const stats = useMemo(() => ({
    total:     referrals.length,
    pending:   referrals.filter((r) => r.status === "REQUESTED" || r.status === "CONFIRMED").length,
    accepted:  referrals.filter((r) => r.status === "ACCEPTED").length,
    completed: referrals.filter((r) => r.status === "COMPLETED").length,
    rejected:  referrals.filter((r) => r.status === "REJECTED").length,
  }), [referrals]);

  const active = useMemo(() =>
    referrals.filter(
      (r) => r.status === "REQUESTED" || r.status === "CONFIRMED" || r.status === "ACCEPTED",
    ), [referrals]);

  const closed = useMemo(() =>
    referrals.filter(
      (r) => r.status === "COMPLETED" || r.status === "REJECTED",
    ), [referrals]);

  if (!isLoaded || !hospital) return null;

  const statItems = [
    { label: "전체",   value: stats.total,    color: "text-foreground" },
    { label: "대기",   value: stats.pending,  color: stats.pending   > 0 ? "text-amber-600" : "text-foreground" },
    { label: "수용",   value: stats.accepted,  color: stats.accepted  > 0 ? "text-teal-600"  : "text-foreground" },
    { label: "완료",   value: stats.completed, color: stats.completed > 0 ? "text-slate-500" : "text-foreground" },
    { label: "불가",   value: stats.rejected,  color: stats.rejected  > 0 ? "text-red-600"   : "text-foreground" },
  ];

  return (
    <div>
      {/* ── 히어로 헤더 ── */}
      <div className="-mx-4 mb-8 border-b">
        <div className="px-4 sm:px-6 pt-2 pb-4">
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium mb-2">
            상급종합병원 회송 시스템
          </p>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight leading-none text-foreground">
                보낸 회송 요청
              </h1>
              <p className="text-muted-foreground mt-1.5 text-sm">{hospital.name}</p>
            </div>
            <Link
              href="/sender/new"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-600 text-white text-sm font-semibold transition-colors shrink-0"
            >
              <PlusCircle className="h-4 w-4" />
              새 요청 등록
            </Link>
          </div>
        </div>

        {/* 스탯 스트립 — 5칸 고정, 모바일에서 패딩·크기 축소 */}
        <div className="border-t grid grid-cols-5 divide-x bg-muted/40">
          {statItems.map(({ label, value, color }) => (
            <div key={label} className="px-2 py-3 sm:px-5 sm:py-4">
              <p className="text-muted-foreground text-sm font-medium truncate">
                {label}
              </p>
              <p className={`text-xl sm:text-3xl font-bold mt-0.5 tabular-nums ${color}`}>
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
          {active.length > 0 && (
            <Section title="진행 중" count={active.length}>
              {active.map((r) => (
                <ReferralRow key={r.id} referral={r} />
              ))}
            </Section>
          )}
          {closed.length > 0 && (
            <Section title="종결" count={closed.length} muted>
              {closed.map((r) => (
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
      {/* 데스크탑 스켈레톤 */}
      <div className={`hidden md:grid ${COLS} px-3 py-2.5 border-b bg-muted/40`}>
        {["REF", "환자", "대상 병원", "희망일", "특이", "상태", ""].map((label) => (
          <Skeleton key={label} className="h-4 w-full" />
        ))}
      </div>
      <div className="hidden md:block divide-y">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`${COLS} px-3 py-4`}>
            <Skeleton className="h-4 w-20" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-6 mx-auto" />
            <Skeleton className="h-5 w-12 mx-auto" />
            <Skeleton className="h-7 w-20 ml-auto" />
          </div>
        ))}
      </div>
      {/* 모바일 스켈레톤 */}
      <div className="md:hidden divide-y">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-3 py-4 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-14" />
            </div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
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
      {/* 섹션 타이틀 */}
      <div className="flex items-baseline gap-2.5 border-b pb-2">
        <h2 className={`text-sm font-semibold uppercase tracking-wider ${muted ? "text-muted-foreground" : "text-foreground"}`}>
          {title}
        </h2>
        <span className={`text-sm font-bold tabular-nums ${muted ? "text-muted-foreground" : "text-primary"}`}>
          {String(count).padStart(2, "0")}
        </span>
      </div>

      {/* 데스크탑 컬럼 헤더 (md 이상) */}
      <div className={`hidden md:grid ${COLS} px-3 py-2.5 border-b bg-muted/40`}>
        {[
          { key: "ref",      label: "REF",       center: false },
          { key: "patient",  label: "환자",      center: false },
          { key: "hospital", label: "대상 병원", center: true  },
          { key: "date",     label: "희망일",    center: true  },
          { key: "flag",     label: "특이",      center: true  },
          { key: "status",   label: "상태",      center: true  },
          { key: "action",   label: "",          center: true  },
        ].map(({ key, label, center }) => (
          <span
            key={key}
            className={`text-sm font-semibold uppercase tracking-wider text-muted-foreground ${center ? "text-center" : ""}`}
          >
            {label}
          </span>
        ))}
      </div>

      {/* 행 목록 */}
      <div className="divide-y">
        {children}
      </div>
    </div>
  );
}

/* ── 행 — 모바일 카드 / 데스크탑 그리드 ── */
function ReferralRow({ referral }: { referral: Referral }) {
  const refId = `REF-${referral.id.slice(0, 6).toUpperCase()}`;
  const priority = referral.adl ? ADL_PRIORITY[referral.adl] : "LOW";

  return (
    <>
      {/* ── 데스크탑 그리드 행 (md 이상) ── */}
      <div className={`hidden md:grid ${COLS} px-3 py-4 hover:bg-muted/30 transition-colors`}>
        {/* REF ID + 우선순위 */}
        <div>
          <span className="text-sm font-mono font-semibold text-foreground block leading-none">
            {refId}
          </span>
          <span className={`text-sm mt-0.5 block leading-none ${PRIORITY_CLASS[priority]}`}>
            {priority}
          </span>
        </div>

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

        {/* 대상 병원 */}
        <div className="text-sm truncate text-center">
          {referral.to_hospital?.name ?? (
            <span className="text-amber-600 font-medium">미선택</span>
          )}
        </div>

        {/* 희망일 */}
        <div className="text-sm text-muted-foreground text-center">
          {referral.preferred_date
            ? new Date(referral.preferred_date).toLocaleDateString("ko-KR", {
                month: "2-digit",
                day:   "2-digit",
              })
            : "—"}
        </div>

        {/* 특이사항 아이콘 */}
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

        {/* 액션 */}
        <div className="flex justify-center">
          <RowAction referral={referral} />
        </div>
      </div>

      {/* ── 모바일 카드 (md 미만) ── */}
      <div className="md:hidden px-3 py-4 hover:bg-muted/30 transition-colors space-y-2">
        {/* 상단: REF + 우선순위 + 상태 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-semibold text-foreground">
              {refId}
            </span>
            <span className={`text-sm ${PRIORITY_CLASS[priority]}`}>
              {priority}
            </span>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 text-sm font-medium shrink-0 ${STATUS_CLASS[referral.status]}`}>
            {STATUS_LABEL[referral.status]}
          </span>
        </div>

        {/* 환자 정보 */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-foreground">{referral.patient_initial}</span>
            <span className="text-sm text-muted-foreground">
              {referral.age}세 · {referral.gender === "M" ? "남" : "여"}
            </span>
            {referral.needs_oxygen    && <Wind        className="h-4 w-4 text-blue-500   shrink-0" />}
            {referral.needs_isolation && <ShieldAlert className="h-4 w-4 text-orange-500 shrink-0" />}
          </div>
          <p className="text-sm text-muted-foreground">{referral.diagnosis ?? "—"}</p>
        </div>

        {/* 병원 + 희망일 + 액션 */}
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-slate-700 space-y-0.5 min-w-0">
            <p className="truncate">
              {referral.to_hospital?.name ?? (
                <span className="text-amber-600 font-medium">병원 미선택</span>
              )}
            </p>
            {referral.preferred_date && (
              <p className="text-muted-foreground">
                희망일:{" "}
                {new Date(referral.preferred_date).toLocaleDateString("ko-KR", {
                  month: "2-digit",
                  day:   "2-digit",
                })}
              </p>
            )}
          </div>
          <div className="shrink-0">
            <RowAction referral={referral} />
          </div>
        </div>
      </div>
    </>
  );
}

/* ── 행 액션 (공통) ── */
/* 버튼형(병원 선택·완료 처리): border + px-3 py-1.5 text-sm 으로 통일
   상태 텍스트(대기 중·완료·불가): 아이콘 + text-sm 으로 통일               */
function RowAction({ referral }: { referral: Referral }) {
  if (referral.status === "ACCEPTED") {
    return <CompleteButton referralId={referral.id} />;
  }
  if (!referral.to_hospital_id && referral.status === "REQUESTED") {
    return (
      <Link
        href={`/sender/hospitals?referralId=${referral.id}`}
        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        <PlusCircle className="h-3.5 w-3.5 shrink-0" />
        병원 선택
      </Link>
    );
  }
  if (referral.status === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-destructive">
        <XCircle className="h-3.5 w-3.5 shrink-0" />
        {referral.reject_reason
          ? <span className="truncate max-w-[6rem]">{referral.reject_reason}</span>
          : "불가"}
      </span>
    );
  }
  if (referral.status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-teal-600">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        완료
      </span>
    );
  }
  if (referral.status === "CONFIRMED") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        대기 중
      </span>
    );
  }
  return null;
}

/* ── 완료 버튼 ── */
function CompleteButton({ referralId }: { referralId: string }) {
  const mutation = useUpdateReferralStatus();
  return (
    <Button
      variant="outline"
      className="rounded-none px-3 py-1.5 h-auto text-sm font-medium text-teal-600 border-teal-600 hover:bg-teal-50"
      onClick={() =>
        mutation.mutate(
          { id: referralId, status: "COMPLETED" },
          {
            onSuccess: () => toast.success("완료 처리되었습니다."),
            onError:   () => toast.error("처리 중 오류가 발생했습니다."),
          },
        )
      }
      disabled={mutation.isPending}
    >
      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
      완료 처리
    </Button>
  );
}

/* ── 빈 상태 ── */
function EmptyState() {
  return (
    <div className="text-center py-16 border-t border-b">
      <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
      <p className="text-muted-foreground font-medium">보낸 요청이 없습니다</p>
      <p className="text-sm text-muted-foreground mt-1">협력병원에 회송을 요청해보세요</p>
      <Link
        href="/sender/new"
        className={buttonVariants({ className: "mt-4 rounded-none" })}
      >
        <PlusCircle className="h-4 w-4 mr-1.5" />
        첫 요청 등록
      </Link>
    </div>
  );
}
