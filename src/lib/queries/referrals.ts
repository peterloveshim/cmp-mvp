import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Referral, ReferralInsert, ReferralStatus } from "@/types";

// 수신 요청 목록 (협력병원용)
export function useReceivedReferrals(hospitalId: string | null) {
  return useQuery<Referral[]>({
    queryKey: ["referrals", "received", hospitalId],
    queryFn: async () => {
      if (!hospitalId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("referrals")
        .select("*, from_hospital:hospitals!from_hospital_id(*)")
        .eq("to_hospital_id", hospitalId)
        .order("status", { ascending: true }) // REQUESTED 우선
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Referral[];
    },
    enabled: !!hospitalId,
    refetchInterval: 5000, // 5초 폴링
  });
}

// 발송 요청 목록 (상급병원용)
export function useSentReferrals(hospitalId: string | null) {
  return useQuery<Referral[]>({
    queryKey: ["referrals", "sent", hospitalId],
    queryFn: async () => {
      if (!hospitalId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("referrals")
        .select("*, to_hospital:hospitals!to_hospital_id(*)")
        .eq("from_hospital_id", hospitalId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Referral[];
    },
    enabled: !!hospitalId,
    refetchInterval: 5000,
  });
}

// 단건 조회
export function useReferral(id: string | null) {
  return useQuery<Referral | null>({
    queryKey: ["referrals", id],
    queryFn: async () => {
      if (!id) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("referrals")
        .select(
          "*, from_hospital:hospitals!from_hospital_id(*), to_hospital:hospitals!to_hospital_id(*)",
        )
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Referral;
    },
    enabled: !!id,
    refetchInterval: 5000,
  });
}

// 회송 요청 등록
export function useCreateReferral() {
  const queryClient = useQueryClient();
  return useMutation<Referral, Error, ReferralInsert>({
    mutationFn: async (payload) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("referrals")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as Referral;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
    },
  });
}

// 협력병원 선택 (to_hospital_id 업데이트)
export function useAssignHospital() {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    { referralId: string; hospitalId: string }
  >({
    mutationFn: async ({ referralId, hospitalId }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("referrals")
        .update({ to_hospital_id: hospitalId })
        .eq("id", referralId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
    },
  });
}

// 상태 변경 (수용/불가/완료)
export function useUpdateReferralStatus() {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    { id: string; status: ReferralStatus; rejectReason?: string }
  >({
    mutationFn: async ({ id, status, rejectReason }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("referrals")
        .update({ status, reject_reason: rejectReason ?? null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
    },
  });
}

// 미확인 요청 수 (알림 배지용)
export function useUnreadCount(hospitalId: string | null) {
  return useQuery<number>({
    queryKey: ["referrals", "unread", hospitalId],
    queryFn: async () => {
      if (!hospitalId) return 0;
      const supabase = createClient();
      const { count, error } = await supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("to_hospital_id", hospitalId)
        .eq("status", "REQUESTED");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!hospitalId,
    refetchInterval: 5000,
  });
}
