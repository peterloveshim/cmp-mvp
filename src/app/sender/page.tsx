"use client";

import { useEffect, useMemo } from "react";
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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  useUpdateReferralStatus,
  useSentReferrals,
} from "@/lib/queries/referrals";
import { useCurrentHospital } from "@/lib/hooks/use-current-hospital";
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

/* 컬럼 그리드 정의 — 섹션 헤더·행에서 공유 */
const COLS = "grid grid-cols-[5.5rem_1fr_8.5rem_5.5rem_3rem_5rem_8.5rem] gap-4 items-center";

export default function SenderPage() {
  const router = useRouter();
  const { hospital, isLoaded } = useCurrentHospital();
  const { data: referrals = [], isLoading } = useSentReferrals(
    hospital?.id ?? null,
  );

  useEffect(() => {
    if (isLoaded && !hospital) router.replace("/");
    if (isLoaded && hospital?.type === "PARTNER") router.replace("/receiver");
  }, [isLoaded, hospital, router]);

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

  return (
    <div>
      {/* ── 히어로 헤더 (슬레이트 → 틸 그라데이션) ── */}
      <div className="-mx-4 mb-8 border-b">
        <div className="px-6 pt-2 pb-5">
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium mb-2">
            상급종합병원 회송 시스템
          </p>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight leading-none text-foreground">
                보낸 회송 요청
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">{hospital.name}</p>
            </div>
            <Link
              href="/sender/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white text-sm font-semibold transition-colors shrink-0"
            >
              <PlusCircle className="h-4 w-4" />
              새 요청 등록
            </Link>
          </div>
        </div>

        {/* 스탯 스트립 */}
        <div className="border-t grid grid-cols-5 divide-x bg-muted/40">
          {[
            { label: "전체 요청", value: stats.total,    color: "text-foreground" },
            { label: "처리 대기", value: stats.pending,  color: stats.pending   > 0 ? "text-amber-600" : "text-foreground" },
            { label: "수용됨",   value: stats.accepted,  color: stats.accepted  > 0 ? "text-teal-600"  : "text-foreground" },
            { label: "완료됨",   value: stats.completed, color: stats.completed > 0 ? "text-slate-500" : "text-foreground" },
            { label: "불가",     value: stats.rejected,  color: stats.rejected  > 0 ? "text-red-600"   : "text-foreground" },
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
        <p className="text-sm text-muted-foreground text-center py-12">
          불러오는 중...
        </p>
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
      {/* 섹션 타이틀 — border-b 한 줄만 */}
      <div className="flex items-baseline gap-2.5 border-b pb-2">
        <h2 className={`text-sm font-semibold uppercase tracking-wider ${muted ? "text-muted-foreground" : "text-foreground"}`}>
          {title}
        </h2>
        <span className={`text-sm font-bold tabular-nums ${muted ? "text-muted-foreground" : "text-primary"}`}>
          {String(count).padStart(2, "0")}
        </span>
      </div>

      {/* 컬럼 헤더 — bg 명암으로 구분, border-b 1개 */}
      <div className={`${COLS} px-3 py-2.5 border-b bg-muted/40`}>
        {[
          { key: "ref",      label: "REF",      center: false },
          { key: "patient",  label: "환자",     center: false },
          { key: "hospital", label: "대상 병원", center: true  },
          { key: "date",     label: "희망일",   center: true  },
          { key: "flag",     label: "특이",     center: true  },
          { key: "status",   label: "상태",     center: true  },
          { key: "action",   label: "",         center: false },
        ].map(({ key, label, center }) => (
          <span
            key={key}
            className={`text-sm font-semibold uppercase tracking-wider text-muted-foreground ${center ? "text-center" : ""}`}
          >
            {label}
          </span>
        ))}
      </div>

      {/* 행 — divide-y 로 border-b만 */}
      <div className="divide-y">
        {children}
      </div>
    </div>
  );
}

/* ── 행 ── */
function ReferralRow({ referral }: { referral: Referral }) {
  const refId = `REF-${referral.id.slice(0, 6).toUpperCase()}`;
  const priority = referral.adl ? ADL_PRIORITY[referral.adl] : "LOW";

  return (
    <div className={`${COLS} px-3 py-4 hover:bg-muted/30 transition-colors`}>

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
              day: "2-digit",
            })
          : "—"}
      </div>

      {/* 특이사항 아이콘 */}
      <div className="flex items-center justify-center gap-1">
        {referral.needs_oxygen   && <Wind       className="h-4 w-4 text-blue-500   shrink-0" />}
        {referral.needs_isolation && <ShieldAlert className="h-4 w-4 text-orange-500 shrink-0" />}
      </div>

      {/* 상태 배지 — 라운드 없음 */}
      <div className="flex justify-center">
        <span className={`inline-flex items-center px-2 py-0.5 text-sm font-medium ${STATUS_CLASS[referral.status]}`}>
          {STATUS_LABEL[referral.status]}
        </span>
      </div>

      {/* 액션 */}
      <div className="flex justify-end">
        {referral.status === "ACCEPTED" && (
          <CompleteButton referralId={referral.id} />
        )}
        {!referral.to_hospital_id && referral.status === "REQUESTED" && (
          <Link
            href={`/sender/hospitals?referralId=${referral.id}`}
            className="inline-flex items-center px-3 py-1.5 border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            병원 선택
          </Link>
        )}
        {referral.status === "REJECTED" && referral.reject_reason && (
          <span className="text-sm text-destructive flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{referral.reject_reason}</span>
          </span>
        )}
        {referral.status === "COMPLETED" && (
          <span className="text-sm text-teal-600 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            완료
          </span>
        )}
        {referral.status === "CONFIRMED" && (
          <span className="text-sm text-muted-foreground">대기 중</span>
        )}
      </div>
    </div>
  );
}

/* ── 완료 버튼 — 라운드 없음 ── */
function CompleteButton({ referralId }: { referralId: string }) {
  const mutation = useUpdateReferralStatus();
  return (
    <Button
      size="sm"
      className="rounded-none"
      onClick={() => mutation.mutate({ id: referralId, status: "COMPLETED" })}
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
      <Clock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
      <p className="text-muted-foreground font-medium">보낸 요청이 없습니다</p>
      <p className="text-sm text-muted-foreground/70 mt-1">협력병원에 회송을 요청해보세요</p>
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
