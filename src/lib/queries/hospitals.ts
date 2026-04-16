import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Hospital } from "@/types";

export function useHospitals() {
  return useQuery<Hospital[]>({
    queryKey: ["hospitals"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("hospitals")
        .select("*")
        .order("available_beds", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60, // 1분
  });
}

export function usePartnerHospitals() {
  return useQuery<Hospital[]>({
    queryKey: ["hospitals", "partner"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("hospitals")
        .select("*")
        .eq("type", "PARTNER")
        .order("available_beds", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60,
  });
}
