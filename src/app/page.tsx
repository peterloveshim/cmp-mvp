"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCurrentHospital } from "@/lib/hooks/use-current-hospital";
import { useHospitals } from "@/lib/queries/hospitals";
import type { Hospital } from "@/types";

export default function HospitalSelectPage() {
  const router = useRouter();
  const { hospital, setHospital, isLoaded } = useCurrentHospital();
  const { data: hospitals = [], isLoading } = useHospitals();

  useEffect(() => {
    if (isLoaded && hospital) {
      router.replace(hospital.type === "TERTIARY" ? "/sender" : "/receiver");
    }
  }, [isLoaded, hospital, router]);

  const handleSelect = (h: Hospital) => {
    setHospital({ id: h.id, name: h.name, type: h.type });
    router.push(h.type === "TERTIARY" ? "/sender" : "/receiver");
  };

  if (!isLoaded || hospital) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground text-sm">이동 중...</p>
      </div>
    );
  }

  const tertiary = hospitals.filter((h) => h.type === "TERTIARY");
  const partners  = hospitals.filter((h) => h.type === "PARTNER");

  return (
    <div>
      {/* ── 헤더 ── */}
      <div className="-mx-4 mb-8 border-b">
        <div className="px-6 pt-2 pb-5">
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium mb-2">
            CMP 환자 회송 관리 플랫폼
          </p>
          <h1 className="text-4xl font-bold tracking-tight leading-none text-foreground">
            병원 선택
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            입장할 병원을 선택하세요. 탭별로 독립된 세션이 유지됩니다.
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
          <div className="space-y-8">
            {/* 상급병원 */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2 mb-0">
                상급종합병원
              </h2>
              <div className="border-x border-b divide-y">
                {tertiary.map((h) => (
                  <HospitalRow key={h.id} hospital={h} onSelect={handleSelect} />
                ))}
              </div>
            </div>

            {/* 협력병원 */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2 mb-0">
                협력병원
              </h2>
              <div className="border-x border-b divide-y">
                {partners.map((h) => (
                  <HospitalRow key={h.id} hospital={h} onSelect={handleSelect} />
                ))}
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-10">
          💡 시연 팁: 탭 2개를 나란히 열고 각각 다른 병원으로 입장하세요
        </p>
      </div>
    </div>
  );
}

function HospitalRow({
  hospital,
  onSelect,
}: {
  hospital: Hospital;
  onSelect: (h: Hospital) => void;
}) {
  return (
    <div
      className="px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/40 transition-colors group"
      onClick={() => onSelect(hospital)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground">{hospital.name}</p>
            <Badge
              variant={hospital.type === "TERTIARY" ? "default" : "secondary"}
              className="rounded-none"
            >
              {hospital.type === "TERTIARY" ? "상급" : "협력"}
            </Badge>
          </div>
          {hospital.type === "PARTNER" && (
            <p className="text-sm text-muted-foreground mt-0.5">
              가용 병상: {hospital.available_beds}개
              {hospital.tags.length > 0 && (
                <span className="ml-2">{hospital.tags.join(" · ")}</span>
              )}
            </p>
          )}
          {hospital.type === "TERTIARY" && (
            <p className="text-sm text-muted-foreground mt-0.5">
              회송 요청을 등록하고 협력병원의 수용 여부를 확인합니다
            </p>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
    </div>
  );
}
