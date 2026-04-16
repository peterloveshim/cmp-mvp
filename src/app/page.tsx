"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrentHospital } from "@/lib/hooks/use-current-hospital";
import { useHospitals } from "@/lib/queries/hospitals";
import type { Hospital } from "@/types";

export default function HospitalSelectPage() {
  const router = useRouter();
  const { hospital, setHospital, isLoaded } = useCurrentHospital();
  const { data: hospitals = [], isLoading } = useHospitals();

  // 이미 병원이 선택된 경우 대시보드로 리다이렉트
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
  const partners = hospitals.filter((h) => h.type === "PARTNER");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold tracking-tight">병원 선택</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          입장할 병원을 선택하세요. 탭별로 독립된 세션이 유지됩니다.
        </p>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground text-sm">
          병원 목록 불러오는 중...
        </p>
      ) : (
        <div className="space-y-6">
          {/* 상급병원 */}
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              상급종합병원
            </h2>
            <div className="space-y-2">
              {tertiary.map((h) => (
                <HospitalCard key={h.id} hospital={h} onSelect={handleSelect} />
              ))}
            </div>
          </div>

          {/* 협력병원 */}
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              협력병원
            </h2>
            <div className="space-y-2">
              {partners.map((h) => (
                <HospitalCard key={h.id} hospital={h} onSelect={handleSelect} />
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground mt-10">
        💡 시연 팁: 탭 2개를 나란히 열고 각각 다른 병원으로 입장하세요
      </p>
    </div>
  );
}

function HospitalCard({
  hospital,
  onSelect,
}: {
  hospital: Hospital;
  onSelect: (h: Hospital) => void;
}) {
  return (
    <Card
      className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
      onClick={() => onSelect(hospital)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">{hospital.name}</CardTitle>
            <Badge variant={hospital.type === "TERTIARY" ? "default" : "secondary"}>
              {hospital.type === "TERTIARY" ? "상급" : "협력"}
            </Badge>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        {hospital.type === "PARTNER" && (
          <CardDescription className="flex items-center gap-3 mt-1">
            <span>가용 병상: {hospital.available_beds}개</span>
            {hospital.tags.length > 0 && (
              <span className="flex gap-1">
                {hospital.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-muted px-1.5 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </span>
            )}
          </CardDescription>
        )}
      </CardHeader>
      {hospital.type === "TERTIARY" && (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            회송 요청을 등록하고 협력병원의 수용 여부를 확인합니다
          </p>
        </CardContent>
      )}
    </Card>
  );
}
