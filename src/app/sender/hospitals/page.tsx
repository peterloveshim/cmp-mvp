"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, BedDouble, ChevronRight, ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
    if (isLoaded && !hospital) {
      router.replace("/");
      return;
    }
    if (isLoaded && hospital?.type === "PARTNER") {
      router.replace("/receiver");
      return;
    }
    // referralId 없이 접근 시 /sender로 리다이렉트
    if (isLoaded && !referralId) {
      router.replace("/sender");
    }
  }, [isLoaded, hospital, referralId, router]);

  if (!isLoaded || !hospital || !referralId) return null;

  const handleSelect = async (partner: Hospital) => {
    await assignHospital.mutateAsync({
      referralId,
      hospitalId: partner.id,
    });
    router.push("/sender");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/sender"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          돌아가기
        </Link>
        <div>
          <h1 className="text-xl font-bold">협력병원 선택</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            회송을 요청할 협력병원을 선택하세요
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          병원 목록 불러오는 중...
        </p>
      ) : (
        <div className="space-y-3">
          {partners.map((partner) => (
            <PartnerCard
              key={partner.id}
              hospital={partner}
              isPending={assignHospital.isPending}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PartnerCard({
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
      ? "text-green-600"
      : hospital.available_beds >= 3
        ? "text-yellow-600"
        : "text-destructive";

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
      onClick={() => !isPending && onSelect(hospital)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">{hospital.name}</CardTitle>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <BedDouble className="h-4 w-4 text-muted-foreground" />
            <span>
              가용 병상:{" "}
              <span className={`font-semibold ${bedsColor}`}>
                {hospital.available_beds}개
              </span>
            </span>
          </div>
          {hospital.tags.length > 0 && (
            <div className="flex gap-1.5">
              {hospital.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
