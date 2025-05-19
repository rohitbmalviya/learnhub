'use server'
// ============================================================
// LearnHub — Instructor actions (requireRole INSTRUCTOR)
//
// ALL mutations are scoped to the logged-in instructor's own courses.
// No DB-level row security — every query filters instructorId === user.id.
//
// Course management:
//   getInstructorCourses()   → my courses + enrollment counts
//   getInstructorStats()     → aggregate stats for dashboard header
//   getEnrollmentSeries()    → daily enrollment counts for recharts
//   createCourse()
//   updateCourse()
//   togglePublish()
//   getCourseForEditor()     → full course with modules/lessons/quiz
//
// Module management:
//   createModule()
//   updateModule()
//   deleteModule()
//
// Lesson management:
//   createLesson()
//   updateLesson()
//   deleteLesson()
//
// Quiz management:
//   upsertQuiz()
//   createQuestion()
//   updateQuestion()
//   deleteQuestion()
//   upsertOptions()          → replace all options for a question
// ============================================================

import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { Role, Level } from '@/generated/prisma/enums'

// ─── Validation schemas ───────────────────────────────────────────────────────

const CreateCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  pricePaise: z.number().int().min(0).default(0),
  thumbnailUrl: z.string().url().optional().nullable(),
})

const UpdateCourseSchema = CreateCourseSchema.partial()

const CreateModuleSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1, 'Module title is required'),
  position: z.number().int().min(1).optional(),
})

const UpdateModuleSchema = z.object({
  title: z.string().min(1).optional(),
  position: z.number().int().min(1).optional(),
})

const CreateLessonSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(1, 'Lesson title is required'),
  videoUrl: z.string().url().optional().nullable(),
  content: z.string().optional().nullable(),
  durationSec: z.number().int().min(0).default(0),
  position: z.number().int().min(1).optional(),
})

const UpdateLessonSchema = CreateLessonSchema.omit({ moduleId: true }).partial()

const UpsertQuizSchema = z.object({
  title: z.string().min(1, 'Quiz title is required'),
  passingScore: z.number().int().min(1).max(100).default(70),
})

const CreateQuestionSchema = z.object({
  text: z.string().min(1, 'Question text is required'),
  position: z.number().int().min(1).optional(),
  options: z
    .array(
      z.object({
        text: z.string().min(1),
        isCorrect: z.boolean(),
      })
    )
    .min(2, 'At least 2 options required')
    .refine(
      (opts) => opts.filter((o) => o.isCorrect).length === 1,
      'Exactly one option must be marked correct'
    ),
})

const UpdateQuestionSchema = z.object({
  text: z.string().min(1).optional(),
  position: z.number().int().min(1).optional(),
})

const UpsertOptionsSchema = z
  .array(
    z.object({
      id: z.string().optional(), // existing option id; omit for new
      text: z.string().min(1),
      isCorrect: z.boolean(),
    })
  )
  .min(2, 'At least 2 options required')
  .refine(
    (opts) => opts.filter((o) => o.isCorrect).length === 1,
    'Exactly one option must be marked correct'
  )

// ─── Return types ─────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export type InstructorCourse = {
  id: string
  title: string
  slug: string
  description: string
  category: string
  level: Level
  pricePaise: number
  thumbnailUrl: string | null
  published: boolean
  ratingAvg: number
  createdAt: Date
  enrollmentCount: number
}

export type InstructorStats = {
  totalCourses: number
  publishedCourses: number
  totalStudents: number
}

export type EnrollmentSeriesPoint = {
  date: string  // "YYYY-MM-DD" for recharts label
  count: number
}

export type CourseForEditor = {
  id: string
  title: string
  slug: string
  description: string
  category: string
  level: Level
  pricePaise: number
  thumbnailUrl: string | null
  published: boolean
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
  quiz: {
    id: string
    title: string
    passingScore: number
    questions: Array<{
      id: string
      text: string
      position: number
      options: Array<{ id: string; text: string; isCorrect: boolean }>
    }>
  } | null
}

// ─── Scope helpers ────────────────────────────────────────────────────────────

/** Resolves a course that belongs to the current instructor. Throws if not found/owned. */
async function getOwnedCourse(courseId: string, instructorId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, instructorId: true },
  })
  if (!course || course.instructorId !== instructorId) {
    throw new Error('FORBIDDEN')
  }
  return course
}

/** Resolves a module belonging to an instructor's course. */
async function getOwnedModule(moduleId: string, instructorId: string) {
  const module = await db.module.findUnique({
    where: { id: moduleId },
    include: { course: { select: { instructorId: true } } },
  })
  if (!module || module.course.instructorId !== instructorId) {
    throw new Error('FORBIDDEN')
  }
  return module
}

/** Resolves a lesson belonging to an instructor's course. */
async function getOwnedLesson(lessonId: string, instructorId: string) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: { include: { course: { select: { instructorId: true } } } },
    },
  })
  if (!lesson || lesson.module.course.instructorId !== instructorId) {
    throw new Error('FORBIDDEN')
  }
  return lesson
}

/** Resolves a quiz belonging to an instructor's course. */
async function getOwnedQuiz(quizId: string, instructorId: string) {
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: { course: { select: { instructorId: true } } },
  })
  if (!quiz || quiz.course.instructorId !== instructorId) {
    throw new Error('FORBIDDEN')
  }
  return quiz
}

/** Resolves a question belonging to an instructor's quiz. */
async function getOwnedQuestion(questionId: string, instructorId: string) {
  const question = await db.question.findUnique({
    where: { id: questionId },
    include: {
      quiz: { include: { course: { select: { instructorId: true } } } },
    },
  })
  if (!question || question.quiz.course.instructorId !== instructorId) {
    throw new Error('FORBIDDEN')
  }
  return question
}

// ─── Course actions ────────────────────────────────────────────────────────────

/**
 * Returns all courses owned by the current instructor with enrollment counts.
 */
export async function getInstructorCourses(): Promise<InstructorCourse[]> {
  const user = await requireRole(Role.INSTRUCTOR)

  const courses = await db.course.findMany({
    where: { instructorId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { enrollments: true } },
    },
  })

  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    category: course.category,
    level: course.level,
    pricePaise: course.pricePaise,
    thumbnailUrl: course.thumbnailUrl,
    published: course.published,
    ratingAvg: course.ratingAvg,
    createdAt: course.createdAt,
    enrollmentCount: course._count.enrollments,
  }))
}

/**
 * Returns aggregate stats for the instructor dashboard header.
 */
export async function getInstructorStats(): Promise<InstructorStats> {
  const user = await requireRole(Role.INSTRUCTOR)

  const [totalCourses, publishedCourses, totalStudents] = await Promise.all([
    db.course.count({ where: { instructorId: user.id } }),
    db.course.count({ where: { instructorId: user.id, published: true } }),
    db.enrollment.count({ where: { course: { instructorId: user.id } } }),
  ])

  return { totalCourses, publishedCourses, totalStudents }
}

/**
 * Returns daily enrollment counts for the past 30 days, suitable for recharts.
 * Uses enrolledAt date grouped by day.
 */
export async function getEnrollmentSeries(): Promise<EnrollmentSeriesPoint[]> {
  const user = await requireRole(Role.INSTRUCTOR)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const enrollments = await db.enrollment.findMany({
    where: {
      course: { instructorId: user.id },
      enrolledAt: { gte: thirtyDaysAgo },
    },
    select: { enrolledAt: true },
    orderBy: { enrolledAt: 'asc' },
  })

  // Group by date string "YYYY-MM-DD"
  const countByDate = new Map<string, number>()
  for (const e of enrollments) {
    const dateKey = e.enrolledAt.toISOString().slice(0, 10)
    countByDate.set(dateKey, (countByDate.get(dateKey) ?? 0) + 1)
  }

  // Fill all 30 days (so chart has no gaps)
  const series: EnrollmentSeriesPoint[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateKey = d.toISOString().slice(0, 10)
    series.push({ date: dateKey, count: countByDate.get(dateKey) ?? 0 })
  }

  return series
}

/**
 * Returns a full course with modules, lessons, and quiz for the editor view.
 */
export async function getCourseForEditor(
  courseId: string
): Promise<CourseForEditor> {
  const user = await requireRole(Role.INSTRUCTOR)
  await getOwnedCourse(courseId, user.id)

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
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
        include: {
          questions: {
            orderBy: { position: 'asc' },
            include: {
              options: {
                select: { id: true, text: true, isCorrect: true },
              },
            },
          },
        },
      },
    },
  })

  if (!course) throw new Error('COURSE_NOT_FOUND')

  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    category: course.category,
    level: course.level,
    pricePaise: course.pricePaise,
    thumbnailUrl: course.thumbnailUrl,
    published: course.published,
    modules: course.modules,
    quiz: course.quiz
      ? {
          id: course.quiz.id,
          title: course.quiz.title,
          passingScore: course.quiz.passingScore,
          questions: course.quiz.questions.map((q) => ({
            id: q.id,
            text: q.text,
            position: q.position,
            options: q.options,
          })),
        }
      : null,
  }
}

/**
 * Creates a new course owned by the current instructor.
 */
export async function createCourse(
  input: z.infer<typeof CreateCourseSchema>
): Promise<ActionResult<{ courseId: string; slug: string }>> {
  const user = await requireRole(Role.INSTRUCTOR)

  const parsed = CreateCourseSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>
    return { success: false, error: 'Validation failed', fieldErrors }
  }

  // Check slug uniqueness
  const existing = await db.course.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  })
  if (existing) {
    return { success: false, error: 'A course with this slug already exists' }
  }

  try {
    const course = await db.course.create({
      data: {
        ...parsed.data,
        thumbnailUrl: parsed.data.thumbnailUrl ?? null,
        instructorId: user.id,
        published: false,
      },
      select: { id: true, slug: true },
    })
    return { success: true, data: { courseId: course.id, slug: course.slug } }
  } catch (err) {
    console.error('[createCourse]', err)
    return { success: false, error: 'Failed to create course. Please try again.' }
  }
}

/**
 * Updates mutable fields on an existing instructor-owned course.
 */
export async function updateCourse(
  courseId: string,
  input: z.infer<typeof UpdateCourseSchema>
): Promise<ActionResult<{ courseId: string }>> {
  const user = await requireRole(Role.INSTRUCTOR)
  await getOwnedCourse(courseId, user.id)

  const parsed = UpdateCourseSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>
    return { success: false, error: 'Validation failed', fieldErrors }
  }

  // If slug is changing, check uniqueness
  if (parsed.data.slug) {
    const existing = await db.course.findFirst({
      where: { slug: parsed.data.slug, id: { not: courseId } },
      select: { id: true },
    })
    if (existing) {
      return { success: false, error: 'A course with this slug already exists' }
    }
  }

  try {
    await db.course.update({
      where: { id: courseId },
      data: {
        ...parsed.data,
        thumbnailUrl:
          parsed.data.thumbnailUrl !== undefined
            ? parsed.data.thumbnailUrl
            : undefined,
      },
    })
    return { success: true, data: { courseId } }
  } catch (err) {
    console.error('[updateCourse]', err)
    return { success: false, error: 'Failed to update course. Please try again.' }
  }
}

/**
 * Toggles the published status of a course.
 */
export async function togglePublish(
  courseId: string
): Promise<ActionResult<{ published: boolean }>> {
  const user = await requireRole(Role.INSTRUCTOR)
  await getOwnedCourse(courseId, user.id)

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { published: true },
  })
  if (!course) {
    return { success: false, error: 'Course not found' }
  }

  const updated = await db.course.update({
    where: { id: courseId },
    data: { published: !course.published },
    select: { published: true },
  })

  return { success: true, data: { published: updated.published } }
}

// ─── Module actions ────────────────────────────────────────────────────────────

/**
 * Creates a new module in an instructor-owned course.
 * Position defaults to (current max + 1) if not supplied.
 */
export async function createModule(
  input: z.infer<typeof CreateModuleSchema>
): Promise<ActionResult<{ moduleId: string }>> {
  const user = await requireRole(Role.INSTRUCTOR)

  const parsed = CreateModuleSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>
    return { success: false, error: 'Validation failed', fieldErrors }
  }

  await getOwnedCourse(parsed.data.courseId, user.id)

  let position = parsed.data.position
  if (!position) {
    const lastModule = await db.module.findFirst({
      where: { courseId: parsed.data.courseId },
      orderBy: { position: 'desc' },
      select: { position: true },
    })
    position = (lastModule?.position ?? 0) + 1
  }

  try {
    const module = await db.module.create({
      data: {
        courseId: parsed.data.courseId,
        title: parsed.data.title,
        position,
      },
      select: { id: true },
    })
    return { success: true, data: { moduleId: module.id } }
  } catch (err) {
    console.error('[createModule]', err)
    return { success: false, error: 'Failed to create module.' }
  }
}

/**
 * Updates a module (title and/or position).
 */
export async function updateModule(
  moduleId: string,
  input: z.infer<typeof UpdateModuleSchema>
): Promise<ActionResult<{ moduleId: string }>> {
  const user = await requireRole(Role.INSTRUCTOR)

  const parsed = UpdateModuleSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>
    return { success: false, error: 'Validation failed', fieldErrors }
  }

  await getOwnedModule(moduleId, user.id)

  await db.module.update({
    where: { id: moduleId },
    data: parsed.data,
  })

  return { success: true, data: { moduleId } }
}

/**
 * Deletes a module (cascades to lessons via schema).
 */
export async function deleteModule(
  moduleId: string
): Promise<ActionResult<void>> {
  const user = await requireRole(Role.INSTRUCTOR)
  await getOwnedModule(moduleId, user.id)

  await db.module.delete({ where: { id: moduleId } })

  return { success: true, data: undefined }
}

// ─── Lesson actions ────────────────────────────────────────────────────────────

/**
 * Creates a new lesson in an instructor-owned module.
 * Position defaults to (current max + 1) if not supplied.
 */
export async function createLesson(
  input: z.infer<typeof CreateLessonSchema>
): Promise<ActionResult<{ lessonId: string }>> {
  const user = await requireRole(Role.INSTRUCTOR)

  const parsed = CreateLessonSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>
    return { success: false, error: 'Validation failed', fieldErrors }
  }

  await getOwnedModule(parsed.data.moduleId, user.id)

  let position = parsed.data.position
  if (!position) {
    const lastLesson = await db.lesson.findFirst({
      where: { moduleId: parsed.data.moduleId },
      orderBy: { position: 'desc' },
      select: { position: true },
    })
    position = (lastLesson?.position ?? 0) + 1
  }

  try {
    const lesson = await db.lesson.create({
      data: {
        moduleId: parsed.data.moduleId,
        title: parsed.data.title,
        videoUrl: parsed.data.videoUrl ?? null,
        content: parsed.data.content ?? null,
        durationSec: parsed.data.durationSec,
        position,
      },
      select: { id: true },
    })
    return { success: true, data: { lessonId: lesson.id } }
  } catch (err) {
    console.error('[createLesson]', err)
    return { success: false, error: 'Failed to create lesson.' }
  }
}

/**
 * Updates a lesson's fields.
 */
export async function updateLesson(
  lessonId: string,
  input: z.infer<typeof UpdateLessonSchema>
): Promise<ActionResult<{ lessonId: string }>> {
  const user = await requireRole(Role.INSTRUCTOR)

  const parsed = UpdateLessonSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>
    return { success: false, error: 'Validation failed', fieldErrors }
  }

  await getOwnedLesson(lessonId, user.id)

  await db.lesson.update({
    where: { id: lessonId },
    data: {
      ...parsed.data,
      videoUrl: parsed.data.videoUrl !== undefined ? parsed.data.videoUrl : undefined,
      content: parsed.data.content !== undefined ? parsed.data.content : undefined,
    },
  })

  return { success: true, data: { lessonId } }
}

/**
 * Deletes a lesson (cascades to LessonProgress via schema).
 */
export async function deleteLesson(
  lessonId: string
): Promise<ActionResult<void>> {
  const user = await requireRole(Role.INSTRUCTOR)
  await getOwnedLesson(lessonId, user.id)

  await db.lesson.delete({ where: { id: lessonId } })

  return { success: true, data: undefined }
}

// ─── Quiz management actions ───────────────────────────────────────────────────

/**
 * Creates or updates the quiz for an instructor-owned course (upsert by courseId).
 */
export async function upsertQuiz(
  courseId: string,
  input: z.infer<typeof UpsertQuizSchema>
): Promise<ActionResult<{ quizId: string }>> {
  const user = await requireRole(Role.INSTRUCTOR)
  await getOwnedCourse(courseId, user.id)

  const parsed = UpsertQuizSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>
    return { success: false, error: 'Validation failed', fieldErrors }
  }

  const quiz = await db.quiz.upsert({
    where: { courseId },
    create: {
      courseId,
      title: parsed.data.title,
      passingScore: parsed.data.passingScore,
    },
    update: {
      title: parsed.data.title,
      passingScore: parsed.data.passingScore,
    },
    select: { id: true },
  })

  return { success: true, data: { quizId: quiz.id } }
}

/**
 * Creates a question with its options for an instructor-owned quiz.
 */
export async function createQuestion(
  quizId: string,
  input: z.infer<typeof CreateQuestionSchema>
): Promise<ActionResult<{ questionId: string }>> {
  const user = await requireRole(Role.INSTRUCTOR)
  await getOwnedQuiz(quizId, user.id)

  const parsed = CreateQuestionSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>
    return { success: false, error: 'Validation failed', fieldErrors }
  }

  let position = parsed.data.position
  if (!position) {
    const lastQuestion = await db.question.findFirst({
      where: { quizId },
      orderBy: { position: 'desc' },
      select: { position: true },
    })
    position = (lastQuestion?.position ?? 0) + 1
  }

  try {
    const question = await db.question.create({
      data: {
        quizId,
        text: parsed.data.text,
        position,
        options: {
          create: parsed.data.options.map((opt) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
          })),
        },
      },
      select: { id: true },
    })
    return { success: true, data: { questionId: question.id } }
  } catch (err) {
    console.error('[createQuestion]', err)
    return { success: false, error: 'Failed to create question.' }
  }
}

/**
 * Updates a question's text and/or position.
 */
export async function updateQuestion(
  questionId: string,
  input: z.infer<typeof UpdateQuestionSchema>
): Promise<ActionResult<{ questionId: string }>> {
  const user = await requireRole(Role.INSTRUCTOR)
  await getOwnedQuestion(questionId, user.id)

  const parsed = UpdateQuestionSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>
    return { success: false, error: 'Validation failed', fieldErrors }
  }

  await db.question.update({
    where: { id: questionId },
    data: parsed.data,
  })

  return { success: true, data: { questionId } }
}

/**
 * Deletes a question and all its options (cascades via schema).
 */
export async function deleteQuestion(
  questionId: string
): Promise<ActionResult<void>> {
  const user = await requireRole(Role.INSTRUCTOR)
  await getOwnedQuestion(questionId, user.id)

  await db.question.delete({ where: { id: questionId } })

  return { success: true, data: undefined }
}

/**
 * Replaces all options for a question.
 * Deletes existing options and creates new ones atomically in a transaction.
 * Validates exactly one isCorrect = true.
 */
export async function upsertOptions(
  questionId: string,
  options: z.infer<typeof UpsertOptionsSchema>
): Promise<ActionResult<void>> {
  const user = await requireRole(Role.INSTRUCTOR)
  await getOwnedQuestion(questionId, user.id)

  const parsed = UpsertOptionsSchema.safeParse(options)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  try {
    await db.$transaction([
      db.option.deleteMany({ where: { questionId } }),
      db.option.createMany({
        data: parsed.data.map((opt) => ({
          questionId,
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
      }),
    ])
    return { success: true, data: undefined }
  } catch (err) {
    console.error('[upsertOptions]', err)
    return { success: false, error: 'Failed to update options.' }
  }
}
