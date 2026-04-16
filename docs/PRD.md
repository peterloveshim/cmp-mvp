# PRD: 환자 회송 관리 플랫폼 (CMP) MVP

> **고객 시연 및 피드백 수집용 프로토타입**
> **버전:** v3.1 (Final)
> **스택:** Next.js 16 / React 19 / Tailwind 4 / React Query / Supabase
> **작성일:** 2026-04-16

---

## 1. 프로젝트 개요

### 1.1 배경

상급종합병원 → 협력병원 환자 회송 프로세스가 전화·팩스·엑셀 중심으로 운영되어 비효율 발생. 본 MVP는 **"전화 → 클릭", "팩스 → 링크"** 전환의 최소 검증 버전.

### 1.2 목표

- **"전화 1통을 줄이는 핵심 흐름"** 을 end-to-end 로 시연 가능하게 구현
- 고객(병원 담당자)이 실제 플로우를 클릭해보며 피드백을 줄 수 있는 수준
- 배포 URL 1개 + **같은 브라우저 탭 2개**로 양측 플로우 동시 시연

### 1.3 비목표 (Out of Scope)

- 실제 인증/권한 (로그인 자체 배제)
- EMR 연동, 의료기록 저장
- 결제, 정산, 통계 대시보드
- 모바일 앱, PWA 최적화
- 복잡한 RBAC / RLS 정책

### 1.4 성공 기준

- 양 탭에서 요청 → 수용 → 완료까지 **3 클릭 이내**로 끝낼 수 있다
- 한쪽 탭의 상태 변경이 다른 탭에 **5초 이내** 반영된다
- 고객이 PRD 없이 화면만 보고 플로우를 이해할 수 있다

---

## 2. 핵심 사용자 & 시나리오

### 2.1 Persona

| 역할                    | 소속         | 주 행동                                 |
| ----------------------- | ------------ | --------------------------------------- |
| **회송 코디네이터 (A)** | 상급종합병원 | 회송 요청 등록, 협력병원 수용 여부 확인 |
| **병상 관리자 (B)**     | 협력병원     | 요청 수신, 수용/불가 클릭               |

### 2.2 "로그인 없는" 역할 전환 방식

- 첫 진입 화면에 병원 선택 카드 노출 (상급 1 + 협력 3)
- 선택 시 `sessionStorage`에 `currentHospital` 저장 → 역할별 대시보드 이동
- 상단 네비에 `현재: OO병원` + `[병원 전환]` 버튼 상시 노출

**시연 방법:** 같은 Chrome 창에서 새 탭 2개 열기

- 탭 A → 상급병원으로 입장
- 탭 B → 협력병원으로 입장
- `sessionStorage`는 탭별로 독립되어 서로 섞이지 않음
- 두 탭을 좌우로 분할 배치하면 데이터 송수신을 동시 관찰 가능

### 2.3 Core User Journey

```
[탭 1: 상급병원 A]                    [탭 2: 협력병원 B]
1. 병원 선택(A 입장)
2. 회송 요청 등록 (환자 정보 입력)
3. 협력병원 리스트 조회 (병상 현황)
4. 대상 병원 선택 → 요청 전송
                              ─▶    5. 🔔 배지 카운트 증가 (Realtime)
                                    6. 요청 상세 조회
                                    7. [수용] or [불가] 클릭
8. 상태 변경 확인 (실시간 반영)   ◀─
9. [완료] 처리
```

---

## 3. 기능 명세

### 3.1 병원 선택 (로그인 대체)

- `/` 경로 = 병원 선택 화면
- 카드 4개 (상급 1 + 협력 3) seed
- 선택 시 `sessionStorage` 저장 후 역할별 라우팅
  - 상급병원 → `/sender`
  - 협력병원 → `/receiver`
- 상단바 우측 `[병원 전환]` 버튼 → `sessionStorage` clear 후 `/` 이동

### 3.2 회송 요청 등록 (`/sender/new`)

**입력 필드 (9개):**
| 필드 | 타입 | 예시 |
|---|---|---|
| 환자 이니셜 | text | "K.M.H" |
| 나이 | number | 72 |
| 성별 | radio | M / F |
| 주상병 | text | "뇌경색 회복기" |
| ADL 점수 | select | 독립 / 부분의존 / 완전의존 |
| 산소 필요 여부 | switch | Y / N |
| 감염 격리 필요 | switch | Y / N |
| 특이사항 | textarea | 자유입력 |
| 희망 회송일 | date | 2026-04-20 |

**동작:** 제출 → Supabase `referrals` insert (status=`REQUESTED`) → 협력병원 선택 화면으로 이동

### 3.3 협력병원 리스트 (`/sender/hospitals`)

- 카드형 UI (병원명 / 가용병상 / 특수장비 태그 / 수용가능 뱃지)
- 정렬: 가용병상 내림차순
- 카드 선택 → 직전 작성 요청의 `to_hospital_id` 업데이트
- 병상 현황은 **seed 고정값** (MVP 범위상 실시간 수정 배제)

### 3.4 요청 수용/불가 (`/receiver`)

- 자기 병원 앞으로 온 요청 리스트 (status=`REQUESTED` 우선 정렬)
- 상세 모달: 환자 정보 + `[수용]` / `[불가]` 버튼
- 불가 선택 시 사유 select (병상 없음 / 중증도 부적합 / 기타)

### 3.5 상태 추적

**5단계 Status:**

```
REQUESTED → CONFIRMED → ACCEPTED → COMPLETED
                    ↘ REJECTED (종결)
```

- 타임라인 컴포넌트 (가로 스텝바)
- 양쪽 탭에서 동일 referral → 동일 상태

### 3.6 알림 (실시간)

- 상단 🔔 아이콘 + 배지 카운트
- **1차:** React Query `refetchInterval: 5000` 폴링
- **여유 시 2차:** Supabase Realtime 구독 (`postgres_changes` on `referrals`)
- 클릭 시 최근 5건 드롭다운

---

## 4. 기술 스택

| 레이어       | 선택                  | 버전                     | 비고                       |
| ------------ | --------------------- | ------------------------ | -------------------------- |
| Framework    | Next.js               | 16.x (App Router)        | Turbopack 기본             |
| UI Library   | React                 | 19.x                     | Next.js 16 peerDep         |
| Language     | TypeScript            | 5.7+                     |                            |
| Styling      | Tailwind CSS          | 4.x                      | Next.js 16 공식 지원       |
| UI Kit       | shadcn/ui             | latest (Tailwind 4 대응) | 디자인 시간 절약           |
| Server State | TanStack React Query  | 5.x                      | 폴링·캐시·낙관적 업데이트  |
| DB / Backend | Supabase              | Postgres + JS SDK v2     | Auth 미사용, DB·Realtime만 |
| Form         | react-hook-form + zod | latest                   |                            |
| 배포         | Vercel                | —                        | `git push` 즉시            |

### 4.1 Next.js 16 호환성 체크포인트

- App Router 기본, `async` Server Component 활용
- `params` / `searchParams` 는 **Promise 형태** (Next 15+ 규칙 유지)
- 클라이언트 컴포넌트에 `<QueryClientProvider>` 래핑
- Supabase는 `@supabase/ssr` 사용 (서버·클라이언트 분리)
- **⚠️ 릴리스 시점 기준 shadcn/ui, React Query 호환성 실제 검증 필요**

---

## 5. 데이터 모델 (Supabase / Postgres)

```sql
-- 병원 마스터
create table hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('TERTIARY','PARTNER')),
  total_beds int default 0,
  available_beds int default 0,
  tags text[] default '{}',  -- ['산소','격리','재활']
  created_at timestamptz default now()
);

-- 회송 요청
create table referrals (
  id uuid primary key default gen_random_uuid(),
  from_hospital_id uuid references hospitals(id),
  to_hospital_id uuid references hospitals(id),
  patient_initial text not null,
  age int,
  gender text check (gender in ('M','F')),
  diagnosis text,
  adl text check (adl in ('INDEPENDENT','PARTIAL','DEPENDENT')),
  needs_oxygen boolean default false,
  needs_isolation boolean default false,
  note text,
  preferred_date date,
  status text not null default 'REQUESTED'
    check (status in ('REQUESTED','CONFIRMED','ACCEPTED','REJECTED','COMPLETED')),
  reject_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Realtime 활성화
alter publication supabase_realtime add table referrals;

-- MVP는 RLS 비활성 (데모용). 프로덕션 전환 시 hospital_id 기반 정책 필수.
alter table hospitals disable row level security;
alter table referrals disable row level security;

-- updated_at 자동 갱신 트리거 (선택)
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger referrals_set_updated_at
  before update on referrals
  for each row execute function set_updated_at();
```

### 5.1 Seed 데이터

```sql
insert into hospitals (name, type, total_beds, available_beds, tags) values
  ('서울상급병원', 'TERTIARY', 0, 0, '{}'),
  ('강남재활병원', 'PARTNER', 30, 12, ARRAY['재활','산소']),
  ('수지요양병원', 'PARTNER', 50, 3, ARRAY['격리']),
  ('분당회복병원', 'PARTNER', 20, 8, ARRAY['재활']);
```

---

## 6. 폴더 구조 (Next.js 16 App Router)

```
app/
  layout.tsx                  # QueryClientProvider, HospitalProvider
  page.tsx                    # 병원 선택 화면
  sender/
    page.tsx                  # 보낸 요청 리스트
    new/page.tsx              # 요청 등록 폼
    hospitals/page.tsx        # 협력병원 선택
  receiver/
    page.tsx                  # 받은 요청함
    [id]/page.tsx             # 상세 + 수용/불가
components/
  ui/                         # shadcn
  hospital-switcher.tsx
  status-timeline.tsx
  notification-bell.tsx
  providers.tsx               # React Query Provider
lib/
  supabase/
    client.ts                 # 브라우저 클라이언트
    server.ts                 # 서버 클라이언트
  queries/
    referrals.ts              # useQuery / useMutation 훅
    hospitals.ts
  hooks/
    use-current-hospital.ts   # sessionStorage 래퍼
  types/
    index.ts                  # DB 타입 정의
```

---

## 7. 핵심 구현 스니펫

### 7.1 `lib/hooks/use-current-hospital.ts`

```typescript
"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "cmp_current_hospital";

export interface CurrentHospital {
  id: string;
  name: string;
  type: "TERTIARY" | "PARTNER";
}

export function useCurrentHospital() {
  const [hospital, setHospitalState] = useState<CurrentHospital | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setHospitalState(JSON.parse(raw));
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoaded(true);
  }, []);

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
```

### 7.2 `components/providers.tsx`

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 10,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### 7.3 `lib/supabase/client.ts`

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

### 7.4 `lib/queries/referrals.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useReceivedReferrals(hospitalId: string | null) {
  return useQuery({
    queryKey: ["referrals", "received", hospitalId],
    queryFn: async () => {
      if (!hospitalId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("referrals")
        .select("*, from_hospital:hospitals!from_hospital_id(*)")
        .eq("to_hospital_id", hospitalId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!hospitalId,
    refetchInterval: 5000, // 1차 구현: 폴링
  });
}

export function useUpdateReferralStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      rejectReason,
    }: {
      id: string;
      status: string;
      rejectReason?: string;
    }) => {
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
```

---

## 8. 데모 시나리오 (고객 시연용)

**준비:** Chrome 에서 탭 2개 새로 열기 (각 탭 주소창에 배포 URL 입력), 창을 좌우 분할

1. **[탭 1]** `/` 접속 → "서울상급병원" 선택
2. **[탭 2]** `/` 접속 → "강남재활병원" 선택
3. **[탭 1]** `회송 요청 등록` → 9개 필드 입력 → 제출
4. **[탭 1]** 협력병원 리스트에서 `강남재활병원` 선택 → 요청 전송
5. **[탭 2]** 🔔 배지 카운트 증가 확인 → 요청 상세 열기 → `[수용]` 클릭
6. **[탭 1]** 타임라인 `REQUESTED → ACCEPTED` 자동 반영 확인
7. **[탭 1]** `[완료]` 처리 → 양쪽 상태 `COMPLETED`

**강조 메시지:**

- **"엑셀·팩스 없이 한 화면에서 끝난다"** — 총 3 클릭
- **"멀티 병원 구조가 이미 들어있다"** — 병원 전환 시연
- **"상태가 투명하다"** — 양쪽 실시간 동기화

---

## 9. 환경 변수

`.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Vercel 배포 시 동일 키를 Project Settings → Environment Variables 에 등록.

---

## 10. 다음 단계 (2주 파일럿 확장 시)

- Supabase Auth 도입 (이메일 매직링크) + RLS 정책 작성
- 병상 현황 협력병원 측 직접 업데이트 UI
- Slack/SMS 웹훅 알림
- 요청 이력 CSV 내보내기
- 역할 기반 권한 (RBAC)
- 병원별 다국어(영어) 지원 검토
- 감사 로그 (status_history 테이블)

---

## 11. 리스크 & 대응

| 리스크                                       | 영향             | 대응                                                  |
| -------------------------------------------- | ---------------- | ----------------------------------------------------- |
| Next.js 16 / Tailwind 4 / shadcn 호환성 이슈 | 초기 세팅 지연   | 막히면 즉시 Next 15 + Tailwind 3 으로 다운그레이드    |
| Supabase Realtime 세팅 지연                  | 실시간 효과 저하 | 1차 폴링으로 대체하고 실시간은 여유 시간에            |
| UI 완성도 부족                               | 시연 임팩트 감소 | shadcn 기본 컴포넌트 그대로 사용, 커스터마이징 최소화 |
| seed 데이터 누락                             | 시연 실패        | 배포 직후 대시보드에서 데이터 존재 육안 확인 필수     |

---

## 12. 체크리스트 (개발 시작 전)

- [ ] Supabase 프로젝트 생성 완료
- [ ] Supabase URL / anon key 확보
- [ ] Vercel 계정 연동
- [ ] GitHub 레포 생성
- [ ] Node.js 20+ 설치 확인
- [ ] Next.js 16 공식 릴리스 노트 재확인
- [ ] shadcn/ui 의 Tailwind 4 대응 상태 재확인

---

**문서 끝.**
