"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, BedDouble, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useCurrentHospital } from "@/lib/hooks/use-current-hospital";
import { usePartnerHospitals } from "@/lib/queries/hospitals";
import { useAssignHospital } from "@/lib/queries/referrals";
import type { Hospital } from "@/types";

export default function HospitalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralId = searchParams.get("referralId");

  const { hospital, isLoaded } = useCurrentHospital();
  const { data: partners = [], isLoading } = usePartnerHospitals();
  const assignHospital = useAssignHospital();

  useEffect(() => {
    if (isLoaded && !hospital) { router.replace("/"); return; }
    if (isLoaded && hospital?.type === "PARTNER") { router.replace("/receiver"); return; }
    if (isLoaded && !referralId) router.replace("/sender");
  }, [isLoaded, hospital, referralId, router]);

  if (!isLoaded || !hospital || !referralId) return null;

  const handleSelect = async (partner: Hospital) => {
    await assignHospital.mutateAsync({ referralId, hospitalId: partner.id });
    router.push("/sender");
  };

  return (
    <div>
      {/* ── 헤더 ── */}
      <div className="-mx-4 mb-8 border-b">
        <div className="px-6 pt-2 pb-5">
          <Link
            href="/sender"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            돌아가기
          </Link>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium mb-2">
            협력병원 선택
          </p>
          <h1 className="text-4xl font-bold tracking-tight leading-none text-foreground">
            병원 선택
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            회송을 요청할 협력병원을 선택하세요
          </p>
        </div>
      </div>

      {/* ── 병원 목록 ── */}
      <div className="max-w-2xl mx-auto">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            병원 목록 불러오는 중...
          </p>
        ) : (
          <div className="border divide-y">
            {partners.map((partner) => (
              <PartnerRow
                key={partner.id}
                hospital={partner}
                isPending={assignHospital.isPending}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PartnerRow({
  hospital,
  isPending,
  onSelect,
}: {
  hospital: Hospital;
  isPending: boolean;
  onSelect: (h: Hospital) => void;
}) {
  const bedsColor =
    hospital.available_beds >= 10
      ? "text-teal-600"
      : hospital.available_beds >= 3
        ? "text-amber-600"
        : "text-destructive";

  return (
    <div
      className="px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/40 transition-colors group"
      onClick={() => !isPending && onSelect(hospital)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{hospital.name}</p>
          {hospital.tags.length > 0 && (
            <div className="flex gap-1.5 mt-1">
              {hospital.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="rounded-none text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-1.5 text-sm">
          <BedDouble className="h-4 w-4 text-muted-foreground" />
          <span>
            가용 병상:{" "}
            <span className={`font-semibold ${bedsColor}`}>
              {hospital.available_beds}개
            </span>
          </span>
        </div>
        <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
          선택 →
        </span>
      </div>
    </div>
  );
}
