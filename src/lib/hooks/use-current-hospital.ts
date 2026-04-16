"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { CurrentHospital } from "@/types";

const STORAGE_KEY = "cmp_current_hospital";

export function useCurrentHospital() {
  const [hospital, setHospitalState] = useState<CurrentHospital | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const pathname = usePathname();

  // pathname을 의존성으로 추가: App Router 레이아웃은 네비게이션 시 언마운트되지
  // 않으므로, 경로 변경마다 sessionStorage를 재읽어 헤더 컴포넌트도 갱신한다.
  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setHospitalState(JSON.parse(raw));
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
        setHospitalState(null);
      }
    } else {
      setHospitalState(null);
    }
    setIsLoaded(true);
  }, [pathname]);

  const setHospital = (h: CurrentHospital) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(h));
    setHospitalState(h);
  };

  const clearHospital = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setHospitalState(null);
  };

  return { hospital, setHospital, clearHospital, isLoaded };
}
