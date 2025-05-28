import { notFound } from "next/navigation";
import { getCourseForEditor } from "@/lib/actions/instructor";
import { CourseEditorClient } from "./course-editor-client";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const course = await getCourseForEditor(id);
    return { title: `Edit: ${course.title}` };
  } catch {
    return { title: "Course Editor" };
  }
}

export default async function CourseEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let course;
  try {
    course = await getCourseForEditor(id);
  } catch (err) {
    const code = err instanceof Error ? err.message : String(err);
    if (code === "FORBIDDEN" || code === "COURSE_NOT_FOUND") {
      notFound();
    }
    notFound();
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Course</h1>
        <p className="text-muted-foreground mt-1 font-medium">{course.title}</p>
      </div>
      <CourseEditorClient course={course} />
    </div>
  );
}
