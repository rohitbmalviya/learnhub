'use server'
// ============================================================
// LearnHub — Course browsing actions (public + current-user aware)
//
// getCourses()        → paginated/filtered published course list
// getCourseBySlug()   → full course detail with curriculum
// getCategories()     → distinct category list from published courses
// ============================================================

import { z } from 'zod'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { Level } from '@/generated/prisma/enums'

// ─── Input schemas ────────────────────────────────────────────────────────────

const GetCoursesSchema = z.object({
  category: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  priceFilter: z.enum(['free', 'paid']).optional(),
  search: z.string().optional(),
})

// ─── Return types ─────────────────────────────────────────────────────────────

export type CourseCard = {
  id: string
  title: string
  slug: string
  description: string
  category: string
  level: Level
  pricePaise: number
  thumbnailUrl: string | null
  ratingAvg: number
  lessonCount: number
  totalDurationSec: number
  instructor: {
    id: string
    name: string
    avatarUrl: string | null
  }
}

export type CourseDetail = CourseCard & {
  modules: Array<{
    id: string
    title: string
    position: number
    lessons: Array<{
      id: string
      title: string
      videoUrl: string | null
      content: string | null
      durationSec: number
      position: number
    }>
  }>
  instructor: {
    id: string
    name: string
    avatarUrl: string | null
    bio: string | null
  }
  isEnrolled: boolean
  quiz: { id: string; title: string } | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Aggregates total lesson count + total duration across all modules for a course id. */
async function getCourseStats(
  courseId: string
): Promise<{ lessonCount: number; totalDurationSec: number }> {
  const lessons = await db.lesson.findMany({
    where: { module: { courseId } },
    select: { durationSec: true },
  })
  return {
    lessonCount: lessons.length,
    totalDurationSec: lessons.reduce((sum, l) => sum + l.durationSec, 0),
  }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Returns a list of published courses with optional filters.
 * Includes instructor name, lesson count, and total duration.
 */
export async function getCourses(
  input: z.infer<typeof GetCoursesSchema> = {}
): Promise<CourseCard[]> {
  const parsed = GetCoursesSchema.safeParse(input)
  if (!parsed.success) return []

  const { category, level, priceFilter, search } = parsed.data

  const courses = await db.course.findMany({
    where: {
      published: true,
      ...(category ? { category } : {}),
      ...(level ? { level } : {}),
      ...(priceFilter === 'free' ? { pricePaise: 0 } : {}),
      ...(priceFilter === 'paid' ? { pricePaise: { gt: 0 } } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { description: { contains: search } },
              { category: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      instructor: {
        select: { id: true, name: true, avatarUrl: true },
      },
      modules: {
        include: {
          lessons: {
            select: { id: true, durationSec: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return courses.map((course) => {
    const allLessons = course.modules.flatMap((m) => m.lessons)
    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      category: course.category,
      level: course.level,
      pricePaise: course.pricePaise,
      thumbnailUrl: course.thumbnailUrl,
      ratingAvg: course.ratingAvg,
      lessonCount: allLessons.length,
      totalDurationSec: allLessons.reduce((s, l) => s + l.durationSec, 0),
      instructor: course.instructor,
    }
  })
}

/**
 * Returns full course detail including curriculum (modules + lessons),
 * instructor info, whether the current user is enrolled, and quiz metadata.
 * Returns null if course not found.
 * Unpublished courses are visible only to their own instructor.
 */
export async function getCourseBySlug(
  slug: string
): Promise<CourseDetail | null> {
  const session = await getSession()

  // Fetch the course without the published filter first so the owner can view drafts
  const course = await db.course.findUnique({
    where: { slug },
    include: {
      instructor: {
        select: { id: true, name: true, avatarUrl: true, bio: true },
      },
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
      quiz: {
        select: { id: true, title: true },
      },
    },
  })

  if (!course) return null

  // Unpublished courses are only visible to their own instructor
  if (!course.published) {
    const isOwner = session && session.userId === course.instructorId
    if (!isOwner) return null
  }

  // Check enrollment for current user (if logged in)
  let isEnrolled = false
  if (session) {
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: { userId: session.userId, courseId: course.id },
      },
      select: { id: true },
    })
    isEnrolled = enrollment !== null
  }

  const allLessons = course.modules.flatMap((m) => m.lessons)

  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    category: course.category,
    level: course.level,
    pricePaise: course.pricePaise,
    thumbnailUrl: course.thumbnailUrl,
    ratingAvg: course.ratingAvg,
    lessonCount: allLessons.length,
    totalDurationSec: allLessons.reduce((s, l) => s + l.durationSec, 0),
    instructor: course.instructor,
    modules: course.modules,
    isEnrolled,
    quiz: course.quiz,
  }
}

/**
 * Returns distinct category values from published courses, sorted alphabetically.
 */
export async function getCategories(): Promise<string[]> {
  const courses = await db.course.findMany({
    where: { published: true },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  })
  return courses.map((c) => c.category)
}
