'use server'
// ============================================================
// LearnHub — Learning actions (enrolled-student-scoped)
//
// getCourseForLearning()  → curriculum + per-lesson completion + progress + quizUnlocked
// markLessonComplete()    → upsert LessonProgress; return new progress + quizUnlocked
// getLesson()             → single lesson (enrolled-only)
// ============================================================

import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { computeProgress } from '@/lib/actions/enrollment'

// ─── Return types ─────────────────────────────────────────────────────────────

export type LessonWithCompletion = {
  id: string
  title: string
  videoUrl: string | null
  content: string | null
  durationSec: number
  position: number
  completed: boolean
}

export type ModuleWithLessons = {
  id: string
  title: string
  position: number
  lessons: LessonWithCompletion[]
}

export type CourseForLearning = {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  instructor: { id: string; name: string; avatarUrl: string | null }
  modules: ModuleWithLessons[]
  progressPercent: number
  completedLessons: number
  totalLessons: number
  quizUnlocked: boolean
  quiz: { id: string; title: string } | null
}

export type LessonDetail = {
  id: string
  title: string
  videoUrl: string | null
  content: string | null
  durationSec: number
  position: number
  completed: boolean
  moduleId: string
  moduleTitle: string
  courseId: string
}

export type MarkCompleteResult = {
  progressPercent: number
  completedLessons: number
  totalLessons: number
  quizUnlocked: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Verifies the user is enrolled in the given course. */
async function assertEnrolled(userId: string, courseId: string): Promise<void> {
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  })
  if (!enrollment) {
    throw new Error('NOT_ENROLLED')
  }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Returns the full learning view for an enrolled student:
 * - Curriculum (modules + lessons) with per-lesson completed flag
 * - Computed progress%
 * - quizUnlocked: true only when completedLessons === totalLessons && totalLessons > 0
 * - Quiz metadata (if exists)
 *
 * Throws 'NOT_ENROLLED' if the user has no enrollment for this course.
 */
export async function getCourseForLearning(
  courseId: string
): Promise<CourseForLearning> {
  const user = await requireUser()
  await assertEnrolled(user.id, courseId)

  const [course, progressData] = await Promise.all([
    db.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: { select: { id: true, name: true, avatarUrl: true } },
        modules: {
          orderBy: { position: 'asc' },
          include: {
            lessons: {
              orderBy: { position: 'asc' },
              select: {
                id: true,
                title: true,
                videoUrl: true,
                content: true,
                durationSec: true,
                position: true,
              },
            },
          },
        },
        quiz: { select: { id: true, title: true } },
      },
    }),
    computeProgress(user.id, courseId),
  ])

  if (!course) {
    throw new Error('COURSE_NOT_FOUND')
  }

  // Fetch all completed lesson IDs for this user in this course in one query
  const completedProgress = await db.lessonProgress.findMany({
    where: {
      userId: user.id,
      completed: true,
      lesson: { module: { courseId } },
    },
    select: { lessonId: true },
  })
  const completedSet = new Set(completedProgress.map((p) => p.lessonId))

  const modules: ModuleWithLessons[] = course.modules.map((mod) => ({
    id: mod.id,
    title: mod.title,
    position: mod.position,
    lessons: mod.lessons.map((lesson) => ({
      ...lesson,
      completed: completedSet.has(lesson.id),
    })),
  }))

  const quizUnlocked =
    progressData.totalLessons > 0 &&
    progressData.completedLessons === progressData.totalLessons

  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    thumbnailUrl: course.thumbnailUrl,
    instructor: course.instructor,
    modules,
    progressPercent: progressData.progressPercent,
    completedLessons: progressData.completedLessons,
    totalLessons: progressData.totalLessons,
    quizUnlocked,
    quiz: course.quiz,
  }
}

/**
 * Marks a lesson as complete (upserts LessonProgress).
 * Returns updated progress metrics and whether the quiz is now unlocked.
 * Throws 'NOT_ENROLLED' if not enrolled in the parent course.
 */
export async function markLessonComplete(
  lessonId: string
): Promise<MarkCompleteResult> {
  const user = await requireUser()

  // Resolve the courseId by traversing Lesson → Module → Course
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, module: { select: { courseId: true } } },
  })
  if (!lesson) {
    throw new Error('LESSON_NOT_FOUND')
  }

  const courseId = lesson.module.courseId
  await assertEnrolled(user.id, courseId)

  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: {
      userId: user.id,
      lessonId,
      completed: true,
      completedAt: new Date(),
    },
    update: {
      completed: true,
      completedAt: new Date(),
    },
  })

  const progress = await computeProgress(user.id, courseId)
  const quizUnlocked =
    progress.totalLessons > 0 &&
    progress.completedLessons === progress.totalLessons

  return {
    progressPercent: progress.progressPercent,
    completedLessons: progress.completedLessons,
    totalLessons: progress.totalLessons,
    quizUnlocked,
  }
}

/**
 * Returns a single lesson's full detail for an enrolled student.
 * Throws 'NOT_ENROLLED' if not enrolled.
 */
export async function getLesson(lessonId: string): Promise<LessonDetail> {
  const user = await requireUser()

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        select: { id: true, title: true, courseId: true },
      },
    },
  })
  if (!lesson) {
    throw new Error('LESSON_NOT_FOUND')
  }

  await assertEnrolled(user.id, lesson.module.courseId)

  // Check completion state
  const progress = await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    select: { completed: true },
  })

  return {
    id: lesson.id,
    title: lesson.title,
    videoUrl: lesson.videoUrl,
    content: lesson.content,
    durationSec: lesson.durationSec,
    position: lesson.position,
    completed: progress?.completed ?? false,
    moduleId: lesson.module.id,
    moduleTitle: lesson.module.title,
    courseId: lesson.module.courseId,
  }
}
