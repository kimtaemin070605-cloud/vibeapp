# Vibe App (app1)

바이브 코딩을 위한 자동화된 환경 설정이 완료된 프로젝트입니다.

## 작업 내용

1.  **Next.js 프로젝트 생성**: `src` 디렉토리, App Router, TypeScript, Tailwind CSS 기반으로 생성되었습니다.
2.  **폰트 설정**: `Pretendard` 가 적용되었습니다. (`src/app/layout.tsx`)
3.  **시스템 가이드 추가**:
    - `.gemini/GEMINI.md`: 프로젝트 정체성 및 규칙 정의
    - `docs/coding-standards.md`: 코드 품질 가이드
    - `docs/react-guidlines.md`: React 개발 가이드
    - `docs/design-system.md`: Shadcn UI 디자인 가이드
4.  **필수 라이브러리 추가**: `package.json`에 `lucide-react`, `supabase`, `shadcn/ui` 유틸리티 등이 추가되었습니다.

## 주의 사항

- 현재 쉘 환경의 권한/인경 환경 문제로 인해 `npm install` 및 `shadcn init` 과정에서 의존성 설치가 실패하였습니다.
- **다음 명령어를 실행하여 의존성 설치를 완료해 주세요:**
  ```powershell
  pnpm install
  ```
- 이후 `shadcn` 컴포넌트를 추가하려면 아래 명령어를 사용하세요:
  ```powershell
  npx shadcn@latest init
  ```
