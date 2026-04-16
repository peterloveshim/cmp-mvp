"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useUpdateReferralStatus } from "@/lib/queries/referrals";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusTimeline } from "@/components/status-timeline";
import { useCurrentHospital } from "@/lib/hooks/use-current-hospital";
import { useSentReferrals } from "@/lib/queries/referrals";
import type { Referral, ReferralStatus } from "@/types";

const STATUS_LABEL: Record<ReferralStatus, string> = {
  REQUESTED: "요청중",
  CONFIRMED: "확인됨",
  ACCEPTED: "수용",
  REJECTED: "불가",
  COMPLETED: "완료",
};

const STATUS_CLASS: Record<ReferralStatus, string> = {
  REQUESTED: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-teal-100 text-teal-700",
  ACCEPTED:  "bg-teal-100 text-teal-600",
  COMPLETED: "bg-slate-100 text-slate-500",
  REJECTED:  "bg-red-100 text-red-700",
};

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

  if (!isLoaded || !hospital) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">보낸 회송 요청</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hospital.name}에서 보낸 요청 목록
          </p>
        </div>
        <Link href="/sender/new" className={buttonVariants()}>
          <PlusCircle className="h-4 w-4 mr-1.5" />
          새 요청 등록
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          불러오는 중...
        </p>
      ) : referrals.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {referrals.map((r) => (
            <ReferralCard key={r.id} referral={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReferralCard({ referral }: { referral: Referral }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">
              {referral.patient_initial}
            </CardTitle>
            <CardDescription className="mt-0.5">
              {referral.age}세 · {referral.gender === "M" ? "남" : "여"} ·{" "}
              {referral.diagnosis}
            </CardDescription>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASS[referral.status]}`}>
            {STATUS_LABEL[referral.status]}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <StatusTimeline status={referral.status} />
          <div className="text-right text-xs text-muted-foreground">
            <p>대상: {referral.to_hospital?.name ?? "미선택"}</p>
            <p>{new Date(referral.created_at).toLocaleDateString("ko-KR")}</p>
          </div>
        </div>

        {referral.status === "ACCEPTED" && (
          <CompleteButton referralId={referral.id} />
        )}

        {referral.status === "REJECTED" && referral.reject_reason && (
          <div className="mt-3 flex items-center gap-1.5 text-sm text-destructive">
            <XCircle className="h-3.5 w-3.5" />
            <span>불가 사유: {referral.reject_reason}</span>
          </div>
        )}

        {referral.status === "COMPLETED" && (
          <div className="mt-3 flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>회송 완료</span>
          </div>
        )}

        {/* 협력병원 미선택 시 선택 버튼 */}
        {!referral.to_hospital_id && referral.status === "REQUESTED" && (
          <div className="mt-3">
            <Link
              href={`/sender/hospitals?referralId=${referral.id}`}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              협력병원 선택하기
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CompleteButton({ referralId }: { referralId: string }) {
  const mutation = useUpdateReferralStatus();

  return (
    <div className="mt-3">
      <Button
        size="sm"
        onClick={() => mutation.mutate({ id: referralId, status: "COMPLETED" })}
        disabled={mutation.isPending}
      >
        <CheckCircle2 className="h-4 w-4 mr-1.5" />
        완료 처리
      </Button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 border-2 border-dashed rounded-xl">
      <Clock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
      <p className="text-muted-foreground font-medium">보낸 요청이 없습니다</p>
      <p className="text-sm text-muted-foreground/70 mt-1">
        협력병원에 회송을 요청해보세요
      </p>
      <Link href="/sender/new" className={buttonVariants({ className: "mt-4" })}>
        <PlusCircle className="h-4 w-4 mr-1.5" />
        첫 요청 등록
      </Link>
    </div>
  );
}
