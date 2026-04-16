"use client";

import { cn } from "@/lib/utils";
import type { ReferralStatus } from "@/types";

type Step = {
  status: ReferralStatus;
  label: string;
};

const STEPS: Step[] = [
  { status: "REQUESTED", label: "요청" },
  { status: "CONFIRMED", label: "확인" },
  { status: "ACCEPTED", label: "수용" },
  { status: "COMPLETED", label: "완료" },
];

const STATUS_ORDER: Record<ReferralStatus, number> = {
  REQUESTED: 0,
  CONFIRMED: 1,
  ACCEPTED: 2,
  COMPLETED: 3,
  REJECTED: -1,
};

type StatusTimelineProps = {
  status: ReferralStatus;
};

export function StatusTimeline({ status }: StatusTimelineProps) {
  if (status === "REJECTED") {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
          불가 처리됨
        </span>
      </div>
    );
  }

  const currentOrder = STATUS_ORDER[status];

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const stepOrder = STATUS_ORDER[step.status];
        const isDone = stepOrder < currentOrder;
        const isCurrent = stepOrder === currentOrder;

        return (
          <div key={step.status} className="flex items-center">
            {/* 스텝 원 */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors",
                  isDone &&
                    "bg-primary border-primary text-primary-foreground",
                  isCurrent &&
                    "bg-primary/10 border-primary text-primary",
                  !isDone &&
                    !isCurrent &&
                    "bg-muted border-muted-foreground/30 text-muted-foreground",
                )}
              >
                {isDone ? "✓" : idx + 1}
              </div>
              <span
                className={cn(
                  "text-xs whitespace-nowrap",
                  isCurrent && "font-semibold text-primary",
                  isDone && "text-muted-foreground",
                  !isDone && !isCurrent && "text-muted-foreground/60",
                )}
              >
                {step.label}
              </span>
            </div>

            {/* 연결선 */}
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-12 mx-1 mb-5",
                  stepOrder < currentOrder ? "bg-primary" : "bg-muted",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
