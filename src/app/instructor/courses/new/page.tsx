import { Metadata } from "next";
import { NewCourseForm } from "./new-course-form";

export const metadata: Metadata = {
  title: "Create New Course",
};

export default function NewCoursePage() {
  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Course</h1>
        <p className="text-muted-foreground mt-1">
          Fill in the details to create your course
        </p>
      </div>
      <NewCourseForm />
    </div>
  );
}
