import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Trophy,
  ArrowRight,
  GraduationCap,
  Star,
} from "lucide-react";
import { getStudentDashboard } from "@/lib/actions/dashboard";
import { SafeImage } from "@/components/shared/safe-image";
import { ProgressBar } from "@/components/shared/progress-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import type { ReactElement } from "react";

export const metadata: Metadata = {
  title: "My Dashboard",
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
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border flex flex-col items-center text-center gap-1">
      <Icon size={24} className="text-primary mb-1" />
      <p className="text-3xl font-bold text-primary">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function DashboardPage() {
  let dashboard;
  try {
    dashboard = await getStudentDashboard();
  } catch (err) {
    const code = err instanceof Error ? err.message : String(err);
    if (code === "UNAUTHENTICATED") {
      redirect("/login");
    }
    redirect("/login");
  }

  const { student, inProgress, completed, enrollments, totalEnrolled, totalCompleted } = dashboard;
  const quizResults = enrollments.filter((e) => e.bestAttempt !== null);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {student.name.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Keep learning — you&apos;re doing great.
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-lg font-bold text-primary border border-primary/20">
          {student.name.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} value={totalEnrolled} label="Courses Enrolled" />
        <StatCard icon={CheckCircle2} value={inProgress.reduce((s, e) => s + e.completedLessons, 0) + completed.reduce((s, e) => s + e.completedLessons, 0)} label="Lessons Complete" />
        <StatCard icon={Trophy} value={totalCompleted} label="Courses Completed" />
        <StatCard icon={Star} value={quizResults.filter((e) => e.bestAttempt?.passed).length} label="Quizzes Passed" />
      </div>

      {/* In Progress */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Pick Up Where You Left Off</h2>
          {totalEnrolled > 0 && (
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/courses" /> as ReactElement}
            >
              Browse more
            </Button>
          )}
        </div>

        {inProgress.length === 0 && completed.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <GraduationCap size={64} className="text-muted-foreground/40" />
            <div>
              <p className="text-lg font-semibold">No courses yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Explore our catalog and start learning today
              </p>
            </div>
            <Button render={<Link href="/courses" /> as ReactElement}>
              Browse Courses
              <ArrowRight size={16} />
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...inProgress, ...completed].map((enrollment) => {
              const { course, progressPercent, completedLessons, totalLessons, isCompleted, quizUnlocked, bestAttempt } = enrollment;
              return (
                <article
                  key={enrollment.enrollmentId}
                  className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-video">
                    <SafeImage
                      src={
                        course.thumbnailUrl ??
                        `https://picsum.photos/seed/${course.slug}/600/400`
                      }
                      alt={course.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover"
                    />
                    {isCompleted && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="bg-green-500 text-white rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          Completed
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <div>
                      <h3 className="text-sm font-semibold leading-snug line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        By {course.instructor.name}
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div className="flex flex-col gap-1">
                      <ProgressBar
                        value={progressPercent}
                        size="md"
                        showLabel
                        label={`Progress: ${progressPercent}%`}
                      />
                      <p className="text-xs text-muted-foreground">
                        {completedLessons} of {totalLessons} lessons
                      </p>
                    </div>

                    {/* Quiz result */}
                    {bestAttempt && (
                      <div className={cn(
                        "flex items-center gap-1.5 text-xs px-2 py-1 rounded-sm w-fit font-medium",
                        bestAttempt.passed
                          ? "bg-green-100 text-green-800"
                          : "bg-destructive/10 text-destructive"
                      )}>
                        {bestAttempt.passed ? (
                          <CheckCircle2 size={11} />
                        ) : (
                          <span>✗</span>
                        )}
                        Quiz: {bestAttempt.score}%{" "}
                        {bestAttempt.passed ? "Passed" : "Failed"}
                      </div>
                    )}

                    {/* CTA */}
                    <div className="flex items-center justify-between pt-1">
                      {quizUnlocked && !bestAttempt ? (
                        <Button
                          size="sm"
                          className="w-full"
                          render={<Link href={`/learn/${course.id}/quiz`} /> as ReactElement}
                        >
                          <GraduationCap size={14} />
                          Take Quiz
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant={isCompleted ? "secondary" : "default"}
                          className="w-full"
                          render={<Link href={`/learn/${course.id}`} /> as ReactElement}
                        >
                          {isCompleted ? "Review Course" : "Continue Learning"}
                          <ArrowRight size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Quiz Results table */}
      {quizResults.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Your Quiz Results</h2>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Course</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {quizResults.map((e) => (
                  <tr key={e.enrollmentId} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium truncate max-w-48">
                      {e.course.title}
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground">
                      {e.bestAttempt?.score}%
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={e.bestAttempt?.passed ? "default" : "destructive"}
                        className={e.bestAttempt?.passed ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                      >
                        {e.bestAttempt?.passed ? "Passed" : "Failed"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {e.bestAttempt ? formatDate(e.bestAttempt.takenAt) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
