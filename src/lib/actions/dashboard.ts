'use server'
// ============================================================
// LearnHub — Student dashboard actions
//
// getStudentDashboard() → enrolled courses w/ progress, in-progress vs completed,
//                         quiz attempt results — all in one round-trip
// ============================================================

import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { computeProgress } from '@/lib/actions/enrollment'

// ─── Return types ─────────────────────────────────────────────────────────────

export type DashboardCourse = {
  enrollmentId: string
  enrolledAt: Date
  course: {
    id: string
    title: string
    slug: string
    thumbnailUrl: string | null
    category: string
    pricePaise: number
    ratingAvg: number
    instructor: { id: string; name: string; avatarUrl: string | null }
  }
  progressPercent: number
  completedLessons: number
  totalLessons: number
  isCompleted: boolean
  quizUnlocked: boolean
  bestAttempt: {
    score: number
    passed: boolean
    takenAt: Date
  } | null
}

export type StudentDashboard = {
  student: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
  }
  enrollments: DashboardCourse[]
  inProgress: DashboardCourse[]
  completed: DashboardCourse[]
  totalEnrolled: number
  totalCompleted: number
}

// ─── Action ───────────────────────────────────────────────────────────────────

/**
 * Returns the full student dashboard payload:
 * - All enrolled courses with progress %
 * - In-progress vs completed splits
 * - Best quiz attempt per course (if any)
 */
export async function getStudentDashboard(): Promise<StudentDashboard> {
  const user = await requireUser()

  // Fetch all enrollments with full course + instructor data
  const enrollments = await db.enrollment.findMany({
    where: { userId: user.id },
    orderBy: { enrolledAt: 'desc' },
    include: {
      course: {
        include: {
          instructor: {
            select: { id: true, name: true, avatarUrl: true },
          },
          quiz: { select: { id: true } },
        },
      },
    },
  })

  // Build dashboard entries in parallel
  const dashboardCourses = await Promise.all(
    enrollments.map(async (enrollment) => {
      const courseId = enrollment.courseId
      const quizId = enrollment.course.quiz?.id ?? null

      // Progress + best quiz attempt in parallel
      const [progress, bestAttempt] = await Promise.all([
        computeProgress(user.id, courseId),
        quizId
          ? db.quizAttempt
              .findMany({
                where: { userId: user.id, quizId },
                orderBy: { score: 'desc' },
                take: 1,
                select: { score: true, passed: true, takenAt: true },
              })
              .then((rows) => rows[0] ?? null)
          : Promise.resolve(null),
      ])

      const quizUnlocked =
        progress.totalLessons > 0 &&
        progress.completedLessons === progress.totalLessons

      return {
        enrollmentId: enrollment.id,
        enrolledAt: enrollment.enrolledAt,
        course: {
          id: enrollment.course.id,
          title: enrollment.course.title,
          slug: enrollment.course.slug,
          thumbnailUrl: enrollment.course.thumbnailUrl,
          category: enrollment.course.category,
          pricePaise: enrollment.course.pricePaise,
          ratingAvg: enrollment.course.ratingAvg,
          instructor: enrollment.course.instructor,
        },
        progressPercent: progress.progressPercent,
        completedLessons: progress.completedLessons,
        totalLessons: progress.totalLessons,
        isCompleted: progress.progressPercent === 100,
        quizUnlocked,
        bestAttempt: bestAttempt
          ? {
              score: bestAttempt.score,
              passed: bestAttempt.passed,
              takenAt: bestAttempt.takenAt,
            }
          : null,
      } satisfies DashboardCourse
    })
  )

  const inProgress = dashboardCourses.filter((e) => !e.isCompleted)
  const completed = dashboardCourses.filter((e) => e.isCompleted)

  return {
    student: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
    enrollments: dashboardCourses,
    inProgress,
    completed,
    totalEnrolled: dashboardCourses.length,
    totalCompleted: completed.length,
  }
}
