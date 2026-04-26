# CMP — 환자 회송 관리 플랫폼 (Care Management Platform)

> 상급종합병원 → 협력병원 환자 회송 프로세스를 **전화·팩스에서 웹 클릭으로** 전환하는 MVP 프로토타입

https://github.com/user-attachments/assets/19834200-f862-4f49-90b4-8420a15de8d4

---

## 개요

상급종합병원의 회송 코디네이터와 협력병원의 병상 관리자가 **같은 배포 URL + 브라우저 탭 2개**만으로 회송 요청 → 수용 → 완료 전 플로우를 3클릭 이내에 완수할 수 있는 고객 시연용 프로토타입입니다.

### 핵심 가치

- **"전화 1통을 줄인다"** — 팩스·엑셀 없이 한 화면에서 회송 요청부터 완료까지
- **실시간 상태 동기화** — 한쪽 탭의 변경이 5초 이내(Realtime 시 즉시) 상대 탭에 반영
- **멀티 병원 구조** — 협력병원 가용 병상·장비 현황을 한눈에 비교 후 선택

---

## 시연 방법

```
Chrome 창 하나에서 탭 2개를 좌우로 분할 배치

탭 A (상급병원)                     탭 B (협력병원)
──────────────────                  ──────────────────
/ 접속 → 서울상급병원 선택           / 접속 → 강남재활병원 선택
                                    
회송 요청 등록 (9개 필드 입력)
협력병원 리스트에서 강남재활병원 선택   🔔 배지 카운트 증가 (Realtime)
                                    요청 상세 확인 → [수용] 클릭
타임라인 ACCEPTED 자동 반영   ◀──
[완료] 처리 → COMPLETED 확인         COMPLETED 즉시 반영
```

> `sessionStorage`는 탭별로 독립되므로 두 탭에서 서로 다른 병원으로 동시 접속 가능합니다.

---

## 주요 기능

### 병원 선택 (로그인 대체)
- 첫 진입 시 병원 선택 카드 4개 (상급 1 + 협력 3) 제공
- `sessionStorage`에 현재 병원 저장 → 역할별 대시보드 이동
- 상단 네비의 `[병원 전환]` 버튼으로 언제든 역할 전환

### 회송 요청 등록 (`/sender/new`)
환자 이니셜, 나이, 성별, 주상병, ADL, 산소/격리 필요 여부, 특이사항, 희망 회송일 — 9개 필드를 react-hook-form + Zod로 검증 후 Supabase에 저장합니다.

### 협력병원 선택 (`/sender/hospitals`)
가용 병상 내림차순 정렬된 협력병원 카드 목록. 재활·산소·격리 등 특수 장비 태그를 확인하고 클릭 한 번으로 요청 전송.

### 수용 / 불가 처리 (`/receiver/[id]`)
협력병원 측에서 환자 정보 상세 확인 후 수용 또는 불가(사유 선택 포함) 처리. 처리 즉시 상급병원 탭에 Realtime으로 반영.

### 상태 타임라인
```
REQUESTED → CONFIRMED → ACCEPTED → COMPLETED
                     ↘ REJECTED
```
가로 스텝바로 현재 단계를 시각화하며 양쪽 탭에서 동일 상태를 공유합니다.

### 실시간 알림
- Supabase Realtime (`postgres_changes`) 구독으로 상태 변경 즉시 감지
- 협력병원 🔔 배지 카운트 + 벨 진동 애니메이션
- 상급병원 Toast 알림 (ACCEPTED → teal / REJECTED → red, 환자 이니셜 포함)
- React Query 5초 폴링 폴백

---

## 기술 스택

| 레이어 | 기술 | 버전 |
|--------|------|------|
| Framework | Next.js (App Router) | 16.2.4 |
| UI Runtime | React | 19.2.4 |
| Language | TypeScript strict | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Kit | shadcn/ui (Base UI) | 4.x / 1.4.x |
| UI Primitives | @base-ui/react | 1.4.0 |
| Icon | lucide-react | 1.8.0 |
| Toast | sonner | 2.0.7 |
| Server State | TanStack React Query | 5.99.0 |
| DB / Realtime | Supabase JS SDK | 2.103.2 |
| Supabase SSR | @supabase/ssr | 0.10.2 |
| Form | react-hook-form | 7.72.1 |
| Validation | Zod | 4.3.6 |
| Analytics | @vercel/analytics | 2.0.1 |
| 배포 | Vercel | — |

### 유틸리티

| 패키지 | 버전 | 역할 |
|--------|------|------|
| clsx | 2.1.1 | 조건부 클래스 조합 |
| tailwind-merge | 3.5.0 | Tailwind 클래스 충돌 병합 |
| class-variance-authority | 0.7.1 | 컴포넌트 variant 관리 |
| tw-animate-css | 1.4.0 | Tailwind 애니메이션 확장 |
| next-themes | 0.4.6 | 다크모드 지원 기반 |

---

## 폴더 구조

```
src/
├── app/
│   ├── layout.tsx              # QueryClientProvider + 네비 (HospitalSwitcher, NotificationBell)
│   ├── page.tsx                # 병원 선택 화면 (/)
│   ├── sender/
│   │   ├── page.tsx            # 보낸 요청 리스트
│   │   ├── new/page.tsx        # 요청 등록 폼
│   │   └── hospitals/page.tsx  # 협력병원 선택
│   └── receiver/
│       ├── page.tsx            # 받은 요청함
│       └── [id]/page.tsx       # 상세 + 수용/불가
├── components/
│   ├── ui/                     # shadcn/ui 기본 컴포넌트
│   ├── hospital-switcher.tsx   # 현재 병원 표시 + 전환 버튼
│   ├── status-timeline.tsx     # 5단계 가로 스텝바
│   ├── notification-bell.tsx   # 🔔 배지 + 드롭다운
│   ├── error-boundary.tsx      # 에러 바운더리
│   └── providers.tsx           # React Query Provider
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # 브라우저 클라이언트
│   │   └── server.ts           # 서버 클라이언트 (SSR)
│   ├── queries/
│   │   ├── referrals.ts        # useQuery / useMutation 훅
│   │   └── hospitals.ts        # 병원 목록 훅
│   └── hooks/
│       ├── use-current-hospital.ts      # sessionStorage 래퍼
│       └── use-realtime-referrals.ts    # Realtime 구독 훅
└── types/
    └── index.ts                # DB 타입 정의
```

---

## 로컬 실행

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경변수 설정

`.env.local` 파일을 생성하고 Supabase 프로젝트의 값을 입력합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 3. DB 초기화

Supabase 대시보드 SQL Editor에서 아래 스키마와 시드 데이터를 실행합니다.

```sql
-- 병원 테이블
create table hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('TERTIARY','PARTNER')),
  total_beds int default 0,
  available_beds int default 0,
  tags text[] default '{}',
  created_at timestamptz default now()
);

-- 회송 요청 테이블
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

-- MVP 데모용 RLS 비활성화
alter table hospitals disable row level security;
alter table referrals disable row level security;

-- 시드 데이터
insert into hospitals (name, type, total_beds, available_beds, tags) values
  ('서울상급병원', 'TERTIARY', 0, 0, '{}'),
  ('강남재활병원', 'PARTNER', 30, 12, ARRAY['재활','산소']),
  ('수지요양병원', 'PARTNER', 50, 3, ARRAY['격리']),
  ('분당회복병원', 'PARTNER', 20, 8, ARRAY['재활']);
```

### 4. 개발 서버 시작

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인합니다.

---

## 데이터 모델

### hospitals

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| name | text | 병원명 |
| type | text | `TERTIARY` / `PARTNER` |
| total_beds | int | 전체 병상 수 |
| available_beds | int | 가용 병상 수 |
| tags | text[] | `['재활', '산소', '격리']` |

### referrals

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| from_hospital_id | uuid | 상급병원 FK |
| to_hospital_id | uuid | 협력병원 FK (nullable) |
| patient_initial | text | 환자 이니셜 (예: "K.M.H") |
| age | int | 나이 |
| gender | text | `M` / `F` |
| diagnosis | text | 주상병명 |
| adl | text | `INDEPENDENT` / `PARTIAL` / `DEPENDENT` |
| needs_oxygen | boolean | 산소 필요 여부 |
| needs_isolation | boolean | 격리 필요 여부 |
| status | text | 5단계 상태값 |
| reject_reason | text | 불가 사유 |

---

## Commands

```bash
pnpm dev          # 개발 서버
pnpm build        # 프로덕션 빌드
pnpm lint         # ESLint
npx tsc --noEmit  # TypeScript 타입 검사
```

---

## 비목표 (Out of Scope)

본 MVP는 **고객 시연 및 피드백 수집**이 목적입니다. 아래 항목은 의도적으로 제외되었습니다.

- 실제 인증/로그인 (sessionStorage 기반 병원 선택으로 대체)
- EMR 연동, 의료기록 저장
- 결제, 정산, 통계 대시보드
- 복잡한 RBAC / RLS 정책
- 모바일 최적화 (데스크톱 1024px 이상 기준)
