"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

/**
 * Supabase Realtime으로 referrals 테이블 변경을 구독하고
 * 이벤트 수신 시 React Query 캐시를 무효화한다.
 *
 * @param channelSuffix 채널명 접미사 — 구독 주체별로 분리해 중복 방지
 */
export function useRealtimeReferrals(channelSuffix: string | null): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!channelSuffix) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`referrals:${channelSuffix}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "referrals" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["referrals"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelSuffix, queryClient]);
}
