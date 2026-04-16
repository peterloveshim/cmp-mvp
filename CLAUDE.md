@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev       # 개발 서버 시작
npm run build     # 프로덕션 빌드
npm start         # 프로덕션 서버 시작
npm run lint      # ESLint 실행
```

타입 검사는 별도 스크립트가 없으므로 직접 실행:

```bash
npx tsc --noEmit  # TypeScript 타입 검사
```

## Architecture

Next.js 16 App Router 기반 프로젝트. `src/app/` 디렉터리가 라우팅의 기준이며, 모든 컴포넌트는 기본적으로 Server Component다.

- `src/app/layout.tsx` — 루트 레이아웃 (폰트·메타데이터 설정)
- `src/app/page.tsx` — 홈페이지 (`/` 경로)
- `src/app/globals.css` — 전역 스타일 (Tailwind v4 + CSS 변수)

경로 별칭: `@/*` → `./src/*`

## Tech Stack

- **Next.js 16.2.3** + **React 19.2.4** — 학습 데이터와 다를 수 있는 Breaking Changes 포함 (AGENTS.md 경고 참고)
- **TypeScript 5** strict mode
- **Tailwind CSS v4** — `@import "tailwindcss"` 방식, `@theme inline` 으로 CSS 변수 정의
- **ESLint 9** — flat config 방식 사용

## Next.js 16 Breaking Changes (필수 숙지)

### Middleware → Proxy 파일 컨벤션 변경

Next.js 16부터 `middleware.ts` 파일 컨벤션은 **deprecated**. 반드시 `proxy.ts`를 사용한다.

```
❌ src/middleware.ts  +  export function middleware(request) { ... }
✅ src/proxy.ts      +  export function proxy(request) { ... }
```

- 파일명: `middleware.ts` → `proxy.ts`
- 함수명: `export function middleware` → `export function proxy` (또는 default export)
- `config.matcher` 등 나머지 API는 동일
- 헬퍼 파일(예: `src/lib/supabase/middleware.ts`)은 Next.js 파일 컨벤션과 무관하므로 그대로 사용 가능
