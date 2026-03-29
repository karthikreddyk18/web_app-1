# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: JWT (jsonwebtoken + bcryptjs)

## Artifacts

### EduNode — Course Enrollment & Progress Tracker (`artifacts/course-platform`)
React + Vite frontend at `/`. Full-featured learning management system branded as **EduNode**.
- **Brand**: EduNode · Tagline: "Connecting Knowledge and Progress."
- **Theme**: "Oceanic Professional" — Primary: Navy #1E3A8A, Accent: Cyan #06B6D4, Background: Off-White #F8FAFC
- **Logo**: Hexagon (SVG) with 75% cyan progress ring inside
- JWT auth (student + instructor roles)
- Split login page: navy gradient panel + white card form
- Student dashboard with spring-animated progress bars (navy→cyan gradient) and Recharts analytics
- Course catalog with light card-based UI and soft navy-tinted shadows
- Course player with lesson completion tracking
- Confetti + slide-up enrollment modal on course-detail
- Instructor dashboard: 3-step course builder + student progress table
- Dark navy sidebar with cyan active indicator

### API Server (`artifacts/api-server`)
Express 5 REST API serving at `/api`.

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (auth, courses, enrollments, users)
│   └── course-platform/    # React + Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
│   └── src/seed.ts         # Database seed script
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- **users** — id, name, email, password_hash, role (student|instructor), created_at
- **courses** — id, title, description, thumbnail, level, category, instructor_id, modules (JSONB), created_at
- **enrollments** — id, student_id, course_id, completed_lessons (JSONB), progress_percentage, enrolled_at, last_accessed_at
- **activity_log** — id, user_id, course_id, lesson_id, minutes_studied, completed_at

## Demo Accounts (from seed)

- **Student**: student@demo.com / password123
- **Instructor**: instructor@demo.com / password123

## API Routes

- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user profile (protected)
- `GET /api/courses` — List all courses
- `GET /api/courses/:id` — Course details
- `POST /api/courses` — Create course (instructor only)
- `GET /api/enrollments` — My enrollments (protected)
- `POST /api/enrollments/:courseId` — Enroll in course (protected)
- `POST /api/enrollments/:courseId/lessons/:lessonId/complete` — Complete lesson (protected)
- `GET /api/enrollments/:courseId/progress` — Course progress (protected)
- `GET /api/users/activity` — Weekly study activity (protected)
- `GET /api/users/stats` — User stats (protected)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
- `pnpm --filter @workspace/scripts run seed` — seed demo data

## Codegen

Run: `pnpm --filter @workspace/api-spec run codegen`
