'use server'
// ============================================================
// LearnHub — Quiz actions
//
// getQuiz()           → questions + options WITHOUT isCorrect (client-safe)
// submitQuiz()        → grade server-side; create QuizAttempt; return results
// getMyBestAttempt()  → highest-scoring attempt for the current user+course
//
// SECURITY: isCorrect is NEVER sent to the client. All grading is server-side.
// Quiz unlock gate: only accessible when all lessons are completed.
// ============================================================

import { z } from 'zod'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { computeProgress } from '@/lib/actions/enrollment'

// ─── Input schemas ────────────────────────────────────────────────────────────

const SubmitQuizSchema = z.object({
  courseId: z.string().min(1),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        optionId: z.string().min(1),
      })
    )
    .min(1),
})

// ─── Return types ─────────────────────────────────────────────────────────────

/** Option shape without isCorrect — safe to send to client */
export type SafeOption = {
  id: string
  text: string
}

export type QuizQuestion = {
  id: string
  text: string
  position: number
  options: SafeOption[]
}

export type QuizForStudent = {
  id: string
  title: string
  passingScore: number
  questions: QuizQuestion[]
}

export type SubmitQuizResult = {
  score: number       // 0–100 percent
  passed: boolean
  correctCount: number
  total: number
  attemptId: string
}

export type BestAttempt = {
  attemptId: string
  score: number
  passed: boolean
  takenAt: Date
} | null

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function assertEnrolled(userId: string, courseId: string): Promise<void> {
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  })
  if (!enrollment) throw new Error('NOT_ENROLLED')
}

async function assertQuizUnlocked(userId: string, courseId: string): Promise<void> {
  const progress = await computeProgress(userId, courseId)
  if (progress.totalLessons === 0 || progress.completedLessons < progress.totalLessons) {
    throw new Error('QUIZ_LOCKED')
  }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Returns the quiz for a course — WITHOUT the isCorrect field on options.
 * The quiz is locked until all lessons are completed.
 * Throws 'NOT_ENROLLED' or 'QUIZ_LOCKED' when guards fail.
 */
export async function getQuiz(courseId: string): Promise<QuizForStudent> {
  const user = await requireUser()
  await assertEnrolled(user.id, courseId)
  await assertQuizUnlocked(user.id, courseId)

  const quiz = await db.quiz.findUnique({
    where: { courseId },
    include: {
      questions: {
        orderBy: { position: 'asc' },
        include: {
          options: {
            // Only select id and text — never isCorrect
            select: { id: true, text: true },
          },
        },
      },
    },
  })

  if (!quiz) {
    throw new Error('QUIZ_NOT_FOUND')
  }

  return {
    id: quiz.id,
    title: quiz.title,
    passingScore: quiz.passingScore,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      text: q.text,
      position: q.position,
      options: q.options, // already stripped of isCorrect by select
    })),
  }
}

/**
 * Grades a quiz submission server-side.
 * - Fetches options WITH isCorrect from DB (never from client input).
 * - Computes score as (correct answers / total questions) * 100, rounded.
 * - Creates a QuizAttempt row (retakes allowed — no unique constraint).
 * - Returns score, passed flag, correct count, and total.
 *
 * Throws 'NOT_ENROLLED' or 'QUIZ_LOCKED' when guards fail.
 */
export async function submitQuiz(
  courseId: string,
  answers: Array<{ questionId: string; optionId: string }>
): Promise<SubmitQuizResult> {
  const parsed = SubmitQuizSchema.safeParse({ courseId, answers })
  if (!parsed.success) {
    throw new Error('INVALID_INPUT')
  }

  const user = await requireUser()
  await assertEnrolled(user.id, courseId)
  await assertQuizUnlocked(user.id, courseId)

  // Fetch quiz with all correct answers (server-side only)
  const quiz = await db.quiz.findUnique({
    where: { courseId },
    include: {
      questions: {
        include: {
          options: {
            select: { id: true, isCorrect: true },
          },
        },
      },
    },
  })

  if (!quiz) {
    throw new Error('QUIZ_NOT_FOUND')
  }

  const total = quiz.questions.length
  if (total === 0) {
    throw new Error('QUIZ_HAS_NO_QUESTIONS')
  }

  // Build a map: questionId → Set of correct optionIds
  const correctMap = new Map<string, Set<string>>()
  for (const question of quiz.questions) {
    const correctOptionIds = new Set(
      question.options.filter((o) => o.isCorrect).map((o) => o.id)
    )
    correctMap.set(question.id, correctOptionIds)
  }

  // Grade each submitted answer
  let correctCount = 0
  for (const answer of answers) {
    const correctOptions = correctMap.get(answer.questionId)
    if (correctOptions && correctOptions.has(answer.optionId)) {
      correctCount++
    }
  }

  const score = Math.round((correctCount / total) * 100)
  const passed = score >= quiz.passingScore

  // Persist the attempt (multiple attempts allowed)
  const attempt = await db.quizAttempt.create({
    data: {
      userId: user.id,
      quizId: quiz.id,
      score,
      passed,
    },
    select: { id: true },
  })

  return {
    score,
    passed,
    correctCount,
    total,
    attemptId: attempt.id,
  }
}

/**
 * Returns the current user's best (highest-scoring) attempt for a course quiz.
 * Returns null if no attempts have been made.
 */
export async function getMyBestAttempt(courseId: string): Promise<BestAttempt> {
  const user = await requireUser()

  const quiz = await db.quiz.findUnique({
    where: { courseId },
    select: { id: true },
  })
  if (!quiz) return null

  const attempts = await db.quizAttempt.findMany({
    where: { userId: user.id, quizId: quiz.id },
    orderBy: { score: 'desc' },
    take: 1,
    select: { id: true, score: true, passed: true, takenAt: true },
  })

  if (attempts.length === 0) return null

  const best = attempts[0]
  return {
    attemptId: best.id,
    score: best.score,
    passed: best.passed,
    takenAt: best.takenAt,
  }
}
