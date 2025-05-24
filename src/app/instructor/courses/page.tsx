import { redirect } from "next/navigation";

// My courses list is shown on the instructor dashboard
export default function InstructorCoursesPage() {
  redirect("/instructor");
}
