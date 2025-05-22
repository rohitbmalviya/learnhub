import Link from "next/link";
import {
  BookOpen,
  Users,
  BarChart2,
  PlusCircle,
  Eye,
  Edit2,
} from "lucide-react";
import {
  getInstructorStats,
  getInstructorCourses,
  getEnrollmentSeries,
} from "@/lib/actions/instructor";
import { formatPaise } from "@/lib/payments";
import { LevelBadge } from "@/components/shared/level-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnrollmentChart } from "./enrollment-chart";
import { PublishToggle } from "./publish-toggle";
import type { Metadata } from "next";
import type { ReactElement } from "react";

export const metadata: Metadata = {
  title: "Instructor Dashboard",
};

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: number;
  label: string;
}) {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon size={20} className="text-primary" />
        </div>
      </div>
      <p className="text-3xl font-bold text-primary">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

export default async function InstructorDashboardPage() {
  const [stats, courses, series] = await Promise.all([
    getInstructorStats(),
    getInstructorCourses(),
    getEnrollmentSeries(),
  ]);

  return (
    <div className="p-6 md:p-8 max-w-6xl flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your courses and track student progress
          </p>
        </div>
        <Button render={<Link href="/instructor/courses/new" /> as ReactElement}>
          <PlusCircle size={16} />
          New Course
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard icon={BookOpen} value={stats.totalCourses} label="Total Courses" />
        <StatCard icon={BarChart2} value={stats.publishedCourses} label="Published" />
        <StatCard icon={Users} value={stats.totalStudents} label="Total Students" />
      </div>

      {/* Enrollment chart */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-1">Enrollment Trend</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Last 30 days
        </p>
        <EnrollmentChart data={series} />
      </div>

      {/* My Courses table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">My Courses</h2>
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/instructor/courses/new" /> as ReactElement}
          >
            <PlusCircle size={14} />
            New
          </Button>
        </div>
        {courses.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen size={48} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No courses yet</p>
            <p className="text-sm mt-1">Create your first course to get started</p>
            <Button
              className="mt-4"
              render={<Link href="/instructor/courses/new" /> as ReactElement}
            >
              Create Course
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Level</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Students</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr
                    key={course.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium line-clamp-1">{course.title}</p>
                      <p className="text-xs text-muted-foreground">{course.category}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <LevelBadge level={course.level} />
                    </td>
                    <td className="px-4 py-3 font-semibold hidden md:table-cell">
                      {formatPaise(course.pricePaise)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1">
                        <Users size={13} className="text-muted-foreground" />
                        {course.enrollmentCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <PublishToggle
                        courseId={course.id}
                        initialPublished={course.published}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit course"
                          render={
                            <Link href={`/instructor/courses/${course.id}`} /> as ReactElement
                          }
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={course.published ? "Preview course" : "Edit course (unpublished)"}
                          render={
                            course.published
                              ? <Link href={`/courses/${course.slug}`} target="_blank" /> as ReactElement
                              : <Link href={`/instructor/courses/${course.id}`} /> as ReactElement
                          }
                        >
                          <Eye size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
