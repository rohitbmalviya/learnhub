# 🎓 LearnHub — Online Learning Platform (LMS)

A full-stack learning platform: students enroll in courses, watch video lessons, track their progress and take quizzes, while instructors build courses and view enrollment analytics.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Prisma](https://img.shields.io/badge/Prisma-7-2D3748) ![Tailwind](https://img.shields.io/badge/Tailwind-v4-38BDF8)

---

## ✨ Features

- 📚 **Course catalog** — browse & filter courses by category, level, and price
- ▶️ **Video lessons** — curriculum sidebar with per-lesson completion tracking
- 📈 **Progress tracking** — the end-of-course quiz unlocks once all lessons are complete
- 📝 **Quizzes** — graded securely on the server (answers never reach the browser)
- 🧑‍🏫 **Instructor tools** — course builder (modules, lessons, quizzes) + enrollment analytics dashboard
- 🔐 **Role-based auth** — JWT sessions with Student / Instructor roles, enforced in middleware

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) · React 19 · TypeScript 5 |
| UI | Tailwind CSS v4 · shadcn/ui · Recharts |
| Database | Prisma 7 ORM · SQLite via libSQL (swappable to PostgreSQL) |
| Auth | Custom JWT (`jose`) + `bcryptjs` — route protection in `src/proxy.ts` |

## 📋 Prerequisites

| Tool | Version | Why |
|---|---|---|
| **Node.js** | **20.19+, 22.12+, or 24+** | Prisma 7 refuses to install on older versions (e.g. 20.18 fails) |
| **pnpm** | 9+ | Package manager used by this repo |

> 💡 Using **nvm**? The repo has a `.nvmrc`, so just run `nvm use` inside the project folder (run `nvm install 24` first if needed).

## 🚀 Setup (step by step)

**1. Clone and enter the project**

```bash
git clone <repo-url>
cd learnhub
```

**2. Use the right Node version**

```bash
nvm use          # reads .nvmrc → Node 24
node -v          # verify: should print v24.x (or 20.19+/22.12+)
```

**3. Install dependencies**

```bash
pnpm install
```

**4. Create your environment file**

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Keep the default `file:./prisma/dev.db` for local SQLite |
| `AUTH_SECRET` | ✅ | JWT signing secret — generate one with `openssl rand -base64 32` |

**5. Create the database and load demo data**

```bash
pnpm db:migrate   # applies Prisma migrations (creates prisma/dev.db)
pnpm db:seed      # loads 4 users, 6 courses with modules/lessons/quizzes, enrollments & progress
```

**6. Start the dev server**

```bash
pnpm dev
```

Open **http://localhost:3000** 🎉

## 🔑 Demo accounts

The seed creates two instructors and two students with realistic enrollments and progress:

| Role | Email | Password |
|---|---|---|
| Instructor | `rahul@learnhub.dev` | `Instructor@1234` |
| Instructor | `priya@learnhub.dev` | `Instructor@5678` |
| Student | `arjun@example.com` | `Student@1234` |
| Student | `meera@example.com` | `Student@5678` |

## 📜 Available scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:generate` | Regenerate the Prisma client (into `src/generated/prisma`) |
| `pnpm db:reset` | ⚠️ Drop, recreate, and re-migrate the database |

## 🗂 Project structure

```
learnhub/
├── prisma/
│   ├── schema.prisma      # User, Course, Module, Lesson, Enrollment,
│   │                      # LessonProgress, Quiz, Question, Option, QuizAttempt
│   └── seed.ts            # Demo data
├── src/
│   ├── app/
│   │   ├── courses/       # Public catalog + course detail pages ([slug])
│   │   ├── learn/         # Student player: lessons, progress, quiz ([courseId])
│   │   ├── dashboard/     # Student dashboard
│   │   ├── instructor/    # Instructor course builder & analytics
│   │   ├── login/ · register/
│   │   ├── layout.tsx     # Root layout: fonts, SEO metadata
│   │   ├── manifest.ts    # PWA manifest · robots.ts / sitemap.ts for SEO
│   │   └── icon.svg       # Favicon (+ favicon.ico, apple-icon.png)
│   ├── components/        # UI (shadcn) + layout components
│   ├── lib/
│   │   ├── actions/       # Server actions: courses, enrollment, learning, quiz, instructor, dashboard
│   │   ├── auth.ts        # Password hashing, JWT
│   │   ├── session.ts     # Session helpers
│   │   └── db.ts          # Prisma client
│   └── proxy.ts           # Route protection (Next 16 middleware)
└── .env.example           # Environment variable reference
```

**Access rules** (enforced in `src/proxy.ts`): `/courses` and the home page are public · `/dashboard` and `/learn` require login · `/instructor` requires the Instructor role.

## 🌐 SEO

- Open Graph + Twitter card metadata in `layout.tsx` (link previews on WhatsApp/LinkedIn/X)
- `robots.ts` — private areas (`/dashboard`, `/learn`, `/instructor`) excluded from indexing
- `sitemap.ts` — **dynamic**: every published course is listed automatically with its last-modified date
- Full favicon set: SVG + multi-size `.ico` + apple-touch + Android/PWA icons via `manifest.ts`

## 🔧 Troubleshooting

**`Prisma only supports Node.js versions 20.19+, 22.12+, 24.0+` during `pnpm install`**
Your Node is too old. Run `nvm use` (or `nvm install 24 && nvm use 24`) and reinstall.

**Login/session issues after changing `AUTH_SECRET`**
Old session cookies become invalid — just log in again.

**`Error: @prisma/client did not initialize yet`**
Run `pnpm db:generate`, then restart the dev server.

## ☁️ Deployment

Deploys cleanly to **Vercel**:

1. Switch the Prisma datasource to PostgreSQL (Neon/Supabase) — SQLite files don't persist on serverless
2. Set env vars: `DATABASE_URL` and `AUTH_SECRET`
3. Update the placeholder domain (`learnhub.example.com`) in `src/app/layout.tsx`, `robots.ts`, and `sitemap.ts` to your real URL, then submit the sitemap in [Google Search Console](https://search.google.com/search-console)

---

Built by **Rohit Malviya** — full-stack developer.
