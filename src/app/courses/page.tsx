import { Metadata } from "next";
import { Suspense } from "react";
import { getCourses, getCategories } from "@/lib/actions/courses";
import { CoursesClient } from "./courses-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Browse Courses",
};

interface SearchParams {
  category?: string;
  level?: string;
  price?: string;
  search?: string;
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const [courses, categories] = await Promise.all([
    getCourses({
      category: params.category,
      level: params.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | undefined,
      priceFilter: params.price as "free" | "paid" | undefined,
      search: params.search,
    }),
    getCategories(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Browse Courses</h1>
        <p className="text-muted-foreground mt-1">
          {courses.length} course{courses.length !== 1 ? "s" : ""} available
          {params.search ? ` for "${params.search}"` : ""}
        </p>
      </div>
      <Suspense fallback={<CoursesSkeleton />}>
        <CoursesClient
          initialCourses={courses}
          categories={categories}
          initialFilters={{
            category: params.category ?? "",
            level: params.level ?? "",
            price: params.price ?? "",
            search: params.search ?? "",
          }}
        />
      </Suspense>
    </div>
  );
}

function CoursesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border overflow-hidden">
          <Skeleton className="aspect-video" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-full mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}
