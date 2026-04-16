// DB 타입 정의 — PRD 5절 데이터 모델 기반

export type HospitalType = "TERTIARY" | "PARTNER";

export type AdlType = "INDEPENDENT" | "PARTIAL" | "DEPENDENT";

export type ReferralStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "ACCEPTED"
  | "REJECTED"
  | "COMPLETED";

export type RejectReason = "NO_BED" | "SEVERITY_MISMATCH" | "OTHER";

export type Hospital = {
  id: string;
  name: string;
  type: HospitalType;
  total_beds: number;
  available_beds: number;
  tags: string[];
  created_at: string;
};

export type Referral = {
  id: string;
  from_hospital_id: string;
  to_hospital_id: string | null;
  patient_initial: string;
  age: number | null;
  gender: "M" | "F" | null;
  diagnosis: string | null;
  adl: AdlType | null;
  needs_oxygen: boolean;
  needs_isolation: boolean;
  note: string | null;
  preferred_date: string | null;
  status: ReferralStatus;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
  // 조인 결과
  from_hospital?: Hospital;
  to_hospital?: Hospital;
};

export type ReferralInsert = {
  from_hospital_id: string;
  to_hospital_id?: string | null;
  patient_initial: string;
  age?: number | null;
  gender?: "M" | "F" | null;
  diagnosis?: string | null;
  adl?: AdlType | null;
  needs_oxygen?: boolean;
  needs_isolation?: boolean;
  note?: string | null;
  preferred_date?: string | null;
  status?: ReferralStatus;
};

// sessionStorage에 저장되는 현재 병원 정보
export type CurrentHospital = {
  id: string;
  name: string;
  type: HospitalType;
};
