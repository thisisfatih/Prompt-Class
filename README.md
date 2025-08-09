````markdown
# AI Course Builder & Practice Platform

A full-stack **Next.js 14 App Router** application that lets users generate, manage, and practice training courses in a Duolingo-style interface.  
Courses can be created manually or automatically via **OpenRouter** AI (e.g., GPT-4o), with support for persistent progress tracking, course versioning, and a fun mobile-friendly practice experience.

---

## ✨ Features

### Course Creation

- **Manual Creation** – Add course metadata and questions via a step-by-step form.
- **AI-Powered Generation** – Enter a topic and number of questions; AI returns a structured course instantly.
- **Automatic Versioning** – Adding questions creates a new course version while preserving history.
- **Current Version Pointer** – Easily set which version is the active one for learners.

### Practice Mode

- **Duolingo-Style UI** – Multiple choice, true/false, and short answer formats.
- **Smooth Navigation** – Auto-advance with a short countdown after each answer.
- **Gamified Feedback** – Progress bar, score tracking, and completion stats.
- **Resume Where You Left Off** – Persistent per-user course progress.
- **Course Status Badges** – “Not started”, “In progress”, and “Completed” shown on the course list.

### Backend & Data

- **Prisma + PostgreSQL (Neon)** – Typed database queries with relational integrity.
- **User Tracking** – Prompt for a name when launching; users created in DB if new.
- **Practice Sessions** – Track current question index, correct answers, and completion status.
- **Versioned Courses** – Store historical versions and roll back if needed.

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js 14 App Router](https://nextjs.org/docs/app), React, TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com)
- **Backend**: [Prisma ORM](https://www.prisma.io/), PostgreSQL (Neon)
- **AI**: [OpenRouter API](https://openrouter.ai/) with GPT-4o model
- **Hosting**: Vercel / local dev

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd <repo-name>
pnpm install
```
````

### 2. Set Environment Variables

Create a `.env` file in the root with:

```env
DATABASE_URL=<your Postgres connection string>
NODE_ENV=development
OPENROUTER_API_KEY=<your OpenRouter API key>
```

### 3. Setup Database

```bash
pnpm prisma migrate dev --name init
pnpm prisma generate
```

### 4. Run the App

```bash
pnpm dev
```

---

## 📂 Project Structure

```
src/
 ├─ app/
 │   ├─ api/                  # API routes (courses, questions, AI generation, users, practice sessions)
 │   ├─ courses/              # Pages for course listing, detail, creation
 │   ├─ practice/             # Pages for practicing courses
 │   ├─ layout.tsx            # Root layout + NavBar
 │   └─ page.tsx              # Landing page
 │
 ├─ components/               # UI components (buttons, inputs, toast, etc.)
 ├─ lib/                       # Prisma client, utilities
 └─ prisma/
     └─ schema.prisma         # Database schema
```

---

## 📊 Database Schema Highlights

- **User**
  - `userId` (UUID), `name`

- **Course**
  - `courseId` (UUID), `courseName`, `currentVersionId`

- **CourseVersion**
  - `courseVersionId` (UUID), `version` (Int), relation to `Course`

- **Question**
  - `questionId` (UUID), `questionSentence`, `questionType`, `options`, `answer`

- **CourseQuestion**
  - Links a `CourseVersion` to a `Question`

- **PracticeSession**
  - `userId`, `courseVersionId`, `currentIndex`, `correctCount`, `status`

---

## 🤖 AI Generation Prompting

When generating a course via AI:

1. The user enters a topic and number of questions.
2. The app sends a structured prompt to the OpenRouter API.
3. GPT-4o responds with JSON containing course metadata and questions.
4. Data is persisted to the database as a new course version.

---

## 📱 Practice Flow

1. **Select a course** from the practice list.
2. If in progress, resume where you left off; otherwise start at question 1.
3. **Answer questions** with instant feedback and auto-advance.
4. **See final results** and choose to retake.
5. Progress is tracked in the DB and status updates in the course list.

---

## 🧪 Development Notes

- Designed with mobile-first layout in mind.
- Built incrementally, starting with manual course creation, then AI integration, then practice tracking.
- Avoided overengineering styling — used shadcn/ui components with custom classes for a clean but playful look.
- All major features persist to the database so refreshes or returning later keeps state intact.

---

## 📜 License

MIT

```

```
