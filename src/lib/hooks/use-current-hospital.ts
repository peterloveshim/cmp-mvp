"use client";

import { useEffect, useReducer } from "react";
import { usePathname } from "next/navigation";
import type { CurrentHospital } from "@/types";

const STORAGE_KEY = "cmp_current_hospital";

function readStorage(): CurrentHospital | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CurrentHospital;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

type State = { hospital: CurrentHospital | null; isLoaded: boolean };
type Action =
  | { type: "sync" }
  | { type: "set"; payload: CurrentHospital }
  | { type: "clear" };

function reducer(_: State, action: Action): State {
  if (action.type === "sync") {
    return { hospital: readStorage(), isLoaded: true };
  }
  if (action.type === "set") {
    return { hospital: action.payload, isLoaded: true };
  }
  return { hospital: null, isLoaded: true };
}

function initState(): State {
  // 서버/클라이언트 hydration 초기 상태를 동일하게 유지해 hydration mismatch 방지.
  // sessionStorage는 useEffect에서 읽는다.
  return { hospital: null, isLoaded: false };
}

export function useCurrentHospital() {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const pathname = usePathname();

  // pathname을 의존성으로 추가: App Router 레이아웃은 네비게이션 시 언마운트되지
  // 않으므로, 경로 변경마다 sessionStorage를 재읽어 헤더 컴포넌트도 갱신한다.
  useEffect(() => {
    dispatch({ type: "sync" });
  }, [pathname]);

  const setHospital = (h: CurrentHospital) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(h));
    dispatch({ type: "set", payload: h });
  };

  const clearHospital = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    dispatch({ type: "clear" });
  };

  return { hospital: state.hospital, setHospital, clearHospital, isLoaded: state.isLoaded };
}
