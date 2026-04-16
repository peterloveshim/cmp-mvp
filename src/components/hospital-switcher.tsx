"use client";

import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentHospital } from "@/lib/hooks/use-current-hospital";

export function HospitalSwitcher() {
  const router = useRouter();
  const { hospital, clearHospital, isLoaded } = useCurrentHospital();

  if (!isLoaded || !hospital) return null;

  const handleSwitch = () => {
    clearHospital();
    router.push("/");
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>현재:</span>
        <span className="font-medium text-foreground">{hospital.name}</span>
        <span className="text-sm px-1.5 py-0.5 rounded bg-muted">
          {hospital.type === "TERTIARY" ? "상급" : "협력"}
        </span>
      </div>
      <Button variant="outline" size="sm" onClick={handleSwitch}>
        병원 전환
      </Button>
    </div>
  );
}
