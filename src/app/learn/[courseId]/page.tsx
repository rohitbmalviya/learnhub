import { redirect } from "next/navigation";
import { getCourseForLearning } from "@/lib/actions/learning";
import { LearnClient } from "./learn-client";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string }>;
}): Promise<Metadata> {
  const { courseId } = await params;
  try {
    const course = await getCourseForLearning(courseId);
    return { title: `Learning: ${course.title}` };
  } catch {
    return { title: "Course" };
  }
}

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { courseId } = await params;
  const { lesson: lessonId } = await searchParams;

  let course;
  try {
    course = await getCourseForLearning(courseId);
  } catch (err) {
    const code = err instanceof Error ? err.message : String(err);
    if (code === "NOT_ENROLLED" || code === "UNAUTHENTICATED") {
      redirect(`/courses`);
    }
    redirect("/dashboard");
  }

  // Find the active lesson: from URL or first incomplete or first lesson
  const allLessons = course.modules.flatMap((m) => m.lessons);
  let activeLessonId = lessonId;
  if (!activeLessonId) {
    const firstIncomplete = allLessons.find((l) => !l.completed);
    activeLessonId = firstIncomplete?.id ?? allLessons[0]?.id;
  }
  const activeLesson = allLessons.find((l) => l.id === activeLessonId) ?? allLessons[0];

  if (!activeLesson) {
    redirect(`/courses`);
  }

  return (
    <LearnClient
      course={course}
      initialLesson={activeLesson}
    />
  );
}
