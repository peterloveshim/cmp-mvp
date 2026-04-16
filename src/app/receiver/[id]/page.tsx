"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Stethoscope,
  CalendarDays,
  Building2,
  CheckCircle2,
  XCircle,
  Wind,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusTimeline } from "@/components/status-timeline";
import { useCurrentHospital } from "@/lib/hooks/use-current-hospital";
import { useReferral, useUpdateReferralStatus } from "@/lib/queries/referrals";
import type { ReferralStatus } from "@/types";

const ADL_LABEL: Record<string, string> = {
  INDEPENDENT: "독립",
  PARTIAL:     "부분의존",
  DEPENDENT:   "완전의존",
};

const REJECT_REASONS = [
  { value: "병상 없음",     label: "병상 없음" },
  { value: "중증도 부적합", label: "중증도 부적합" },
  { value: "기타",          label: "기타" },
];

const STATUS_CLASS: Record<ReferralStatus, string> = {
  REQUESTED: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  ACCEPTED:  "bg-teal-100 text-teal-700",
  COMPLETED: "bg-slate-100 text-slate-600",
  REJECTED:  "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<ReferralStatus, string> = {
  REQUESTED: "요청중",
  CONFIRMED: "확인됨",
  ACCEPTED:  "수용",
  COMPLETED: "완료",
  REJECTED:  "불가",
};

export default function ReferralDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;

  const { hospital, isLoaded } = useCurrentHospital();
  const { data: referral, isLoading, isError } = useReferral(id);
  const updateStatus = useUpdateReferralStatus();

  const [rejectReason, setRejectReason] = useState<string>(REJECT_REASONS[0].value);
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    if (isLoaded && !hospital) router.replace("/");
    if (isLoaded && hospital?.type === "TERTIARY") router.replace("/sender");
  }, [isLoaded, hospital, router]);

  useEffect(() => {
    if (!isLoading && (isError || referral === null)) {
      router.replace("/receiver");
    }
  }, [isLoading, isError, referral, router]);

  // 상세 페이지 진입 시 REQUESTED → CONFIRMED 자동 전환
  useEffect(() => {
    if (referral?.status === "REQUESTED") {
      updateStatus.mutate({ id: referral.id, status: "CONFIRMED" });
    }
  // referral.id 기준으로만 실행 (최초 로드 시 1회)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referral?.id]);

  if (!isLoaded || !hospital) return null;

  // 로딩 스켈레톤
  if (isLoading) return <DetailSkeleton />;

  if (!referral) return null;

  const isProcessed =
    referral.status === "ACCEPTED" ||
    referral.status === "REJECTED" ||
    referral.status === "COMPLETED";

  const handleAccept = async () => {
    try {
      await updateStatus.mutateAsync({ id: referral.id, status: "ACCEPTED" });
      toast.success("수용 완료되었습니다.", {
        description: `${referral.patient_initial} 환자 회송을 수용했습니다.`,
      });
      router.push("/receiver");
    } catch {
      toast.error("처리 중 오류가 발생했습니다.", {
        description: "잠시 후 다시 시도해주세요.",
      });
    }
  };

  const handleReject = async () => {
    try {
      await updateStatus.mutateAsync({
        id: referral.id,
        status: "REJECTED",
        rejectReason,
      });
      toast.info("불가 처리되었습니다.", {
        description: `사유: ${rejectReason}`,
      });
      router.push("/receiver");
    } catch {
      toast.error("처리 중 오류가 발생했습니다.", {
        description: "잠시 후 다시 시도해주세요.",
      });
    }
  };

  const handleRevert = async () => {
    try {
      await updateStatus.mutateAsync({ id: referral.id, status: "CONFIRMED" });
      toast.success("결정이 취소되었습니다.", {
        description: "다시 수용 또는 불가를 선택해주세요.",
      });
    } catch {
      toast.error("처리 중 오류가 발생했습니다.", {
        description: "잠시 후 다시 시도해주세요.",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* ── 헤더 ── */}
      <div className="-mx-4 mb-8 border-b">
        <div className="px-6 pt-2 pb-5">
          <Link
            href="/receiver"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            목록으로
          </Link>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium mb-2">
            회송 요청 상세
          </p>
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 leading-none">
                <h1 className="text-4xl font-bold tracking-tight text-foreground">
                  {referral.patient_initial}
                </h1>
                <span className={`inline-flex items-center px-2 py-0.5 text-sm font-medium ${STATUS_CLASS[referral.status]}`}>
                  {STATUS_LABEL[referral.status]}
                </span>
              </div>
              <p className="text-muted-foreground mt-2 text-sm">
                {referral.from_hospital?.name ?? "알 수 없음"} 에서 요청
                &nbsp;·&nbsp;
                {new Date(referral.created_at).toLocaleDateString("ko-KR")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 상태 타임라인 ── */}
      <div className="mb-6 pb-6 border-b">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          진행 상태
        </p>
        <StatusTimeline status={referral.status} />
        {referral.status === "REJECTED" && referral.reject_reason && (
          <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5">
            <XCircle className="h-4 w-4" />
            불가 사유: {referral.reject_reason}
          </p>
        )}
      </div>

      {/* ── 환자 정보 ── */}
      <div className="mb-6 pb-6 border-b">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <User className="h-4 w-4" />
          환자 정보
        </p>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <InfoItem label="이니셜" value={referral.patient_initial} />
            <InfoItem label="나이"   value={`${referral.age}세`} />
            <InfoItem label="성별"   value={referral.gender === "M" ? "남성" : "여성"} />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoItem
              label="주상병"
              value={referral.diagnosis ?? "—"}
              icon={<Stethoscope className="h-3.5 w-3.5" />}
            />
            <InfoItem
              label="ADL 점수"
              value={referral.adl ? ADL_LABEL[referral.adl] : "—"}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">산소 필요</span>
              <span className={`font-medium ${referral.needs_oxygen ? "text-blue-600" : "text-muted-foreground"}`}>
                {referral.needs_oxygen ? "필요" : "불필요"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-orange-500" />
              <span className="text-muted-foreground">감염 격리</span>
              <span className={`font-medium ${referral.needs_isolation ? "text-orange-600" : "text-muted-foreground"}`}>
                {referral.needs_isolation ? "필요" : "불필요"}
              </span>
            </div>
          </div>

          {referral.preferred_date && (
            <>
              <Separator />
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">희망 회송일</span>
                <span className="font-medium">
                  {new Date(referral.preferred_date).toLocaleDateString("ko-KR")}
                </span>
              </div>
            </>
          )}

          {referral.note && (
            <>
              <Separator />
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">특이사항</p>
                <p className="text-foreground">{referral.note}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── 요청 병원 ── */}
      <div className="mb-8 pb-6 border-b">
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">요청 병원</span>
          <span className="font-medium">{referral.from_hospital?.name ?? "알 수 없음"}</span>
        </div>
      </div>

      {/* ── 수용/불가 버튼 ── */}
      {!isProcessed && (
        <div className="space-y-3">
          {!showRejectForm ? (
            <div className="flex gap-3">
              <Button
                className="flex-1 rounded-none"
                onClick={handleAccept}
                disabled={updateStatus.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                수용
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-none"
                onClick={() => setShowRejectForm(true)}
                disabled={updateStatus.isPending}
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                불가
              </Button>
            </div>
          ) : (
            <div className="border p-4 bg-red-50/50 space-y-3">
              <p className="text-sm font-medium text-red-700">불가 사유를 선택해주세요</p>
              <Select
                value={rejectReason}
                onValueChange={(v) => v && setRejectReason(v)}
              >
                <SelectTrigger className="bg-white rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REJECT_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-none"
                  onClick={() => setShowRejectForm(false)}
                  disabled={updateStatus.isPending}
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 rounded-none"
                  onClick={handleReject}
                  disabled={updateStatus.isPending}
                >
                  {updateStatus.isPending ? "처리 중..." : "불가 확정"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 처리 완료 상태 메시지 ── */}
      {isProcessed && referral.status === "ACCEPTED" && (
        <div className="border border-teal-200 bg-teal-50">
          <div className="flex items-center gap-2 px-4 py-3 text-teal-700 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            수용 완료된 요청입니다.
          </div>
          <div className="border-t border-teal-200 px-4 py-2.5">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-auto py-1 px-2 text-sm"
              onClick={handleRevert}
              disabled={updateStatus.isPending}
            >
              ↩ 결정 취소 (확인됨으로 되돌리기)
            </Button>
          </div>
        </div>
      )}
      {isProcessed && referral.status === "COMPLETED" && (
        <div className="flex items-center gap-2 p-4 bg-slate-100 text-slate-600 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          회송이 완료된 요청입니다.
        </div>
      )}
      {isProcessed && referral.status === "REJECTED" && (
        <div className="border border-red-200 bg-red-50">
          <div className="flex items-center gap-2 px-4 py-3 text-red-700 text-sm">
            <XCircle className="h-4 w-4 shrink-0" />
            불가 처리된 요청입니다.
          </div>
          <div className="border-t border-red-200 px-4 py-2.5">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-auto py-1 px-2 text-sm"
              onClick={handleRevert}
              disabled={updateStatus.isPending}
            >
              ↩ 결정 취소 (확인됨으로 되돌리기)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 상세 스켈레톤 ── */
function DetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="-mx-4 mb-8 border-b">
        <div className="px-6 pt-2 pb-5">
          <Skeleton className="h-4 w-20 mb-3" />
          <Skeleton className="h-3.5 w-32 mb-2" />
          <div className="flex items-end justify-between gap-4">
            <div>
              <Skeleton className="h-10 w-40 mb-2" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 pb-6 border-b space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-full" />
      </div>

      <div className="mb-6 pb-6 border-b space-y-4">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3.5 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
        <Skeleton className="h-px w-full" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-muted-foreground flex items-center gap-1 mb-0.5">
        {icon}
        {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
