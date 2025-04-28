'use server'
// ============================================================
// LearnHub — Enrollment actions (student-scoped)
//
// enrollInCourse()    → one-click enroll; mock purchase for paid courses
// getMyEnrollments()  → enrolled courses with computed progress %
// ============================================================

import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'

// ─── Return types ─────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export type EnrolledCourse = {
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
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Computes progress% for a user+course pair.
 * completedLessons = LessonProgress(completed=true) → Lesson → Module → courseId
 * totalLessons     = all Lessons in that course
 */
export async function computeProgress(
  userId: string,
  courseId: string
): Promise<{ completedLessons: number; totalLessons: number; progressPercent: number }> {
  const [completedLessons, totalLessons] = await Promise.all([
    db.lessonProgress.count({
      where: {
        userId,
        completed: true,
        lesson: { module: { courseId } },
      },
    }),
    db.lesson.count({
      where: { module: { courseId } },
    }),
  ])

  const progressPercent =
    totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100)

  return { completedLessons, totalLessons, progressPercent }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Enroll the current user in a course.
 * - If pricePaise > 0: mock purchase always succeeds (no real payment gateway).
 * - Creates Enrollment row; if already enrolled, returns success without error.
 */
export async function enrollInCourse(
  courseId: string
): Promise<ActionResult<{ enrollmentId: string; alreadyEnrolled: boolean }>> {
  const user = await requireUser()

  // Verify course exists and is published
  const course = await db.course.findUnique({
    where: { id: courseId, published: true },
    select: { id: true, pricePaise: true, title: true },
  })
  if (!course) {
    return { success: false, error: 'Course not found or not available' }
  }

  // Check for existing enrollment
  const existing = await db.enrollment.findUnique({
    where: {
      userId_courseId: { userId: user.id, courseId },
    },
    select: { id: true },
  })
  if (existing) {
    return {
      success: true,
      data: { enrollmentId: existing.id, alreadyEnrolled: true },
    }
  }

  // For paid courses: mock purchase succeeds in dev (no external gateway)
  // In production, replace this with a real payment check before creating enrollment
  if (course.pricePaise > 0) {
    // Mock: simulate a 100 ms "purchase" call — always succeeds
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  try {
    const enrollment = await db.enrollment.create({
      data: { userId: user.id, courseId },
      select: { id: true },
    })
    return {
      success: true,
      data: { enrollmentId: enrollment.id, alreadyEnrolled: false },
    }
  } catch (err) {
    console.error('[enrollInCourse]', err)
    return { success: false, error: 'Failed to enroll. Please try again.' }
  }
}

/**
 * Returns all enrollments for the current user with computed progress %.
 */
export async function getMyEnrollments(): Promise<EnrolledCourse[]> {
  const user = await requireUser()

  const enrollments = await db.enrollment.findMany({
    where: { userId: user.id },
    orderBy: { enrolledAt: 'desc' },
    include: {
      course: {
        include: {
          instructor: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      },
    },
  })

  // Compute progress for each enrollment in parallel
  const results = await Promise.all(
    enrollments.map(async (enrollment) => {
      const progress = await computeProgress(user.id, enrollment.courseId)
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
      }
    })
  )

  return results
}
