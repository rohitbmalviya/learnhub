import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Star,
  BookOpen,
  Clock,
  Lock,
  CheckCircle2,
  PlayCircle,
  Users,
  ArrowLeft,
} from "lucide-react";
import { getCourseBySlug } from "@/lib/actions/courses";
import { formatPaise } from "@/lib/payments";
import { LevelBadge } from "@/components/shared/level-badge";
import { SafeImage } from "@/components/shared/safe-image";
import { EnrollButton } from "./enroll-button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatLessonDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return { title: "Course Not Found" };
  return { title: course.title };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const price = formatPaise(course.pricePaise);
  const isFree = course.pricePaise === 0;
  const totalModules = course.modules.length;
  const totalLessons = course.lessonCount;

  return (
    <div>
      {/* Hero strip */}
      <div className="bg-foreground text-background py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8 items-start">
            {/* Left: Info */}
            <div className="md:col-span-3 flex flex-col gap-4">
              <Link
                href="/courses"
                className="inline-flex items-center gap-1 text-sm text-background/60 hover:text-background transition-colors w-fit"
              >
                <ArrowLeft size={14} />
                Back to courses
              </Link>

              {/* Category + Level */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium uppercase tracking-wide text-background/60">
                  {course.category}
                </span>
                <span className="text-background/30">·</span>
                <LevelBadge level={course.level} />
              </div>

              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                {course.title}
              </h1>
              <p className="text-background/70 leading-relaxed line-clamp-3">
                {course.description}
              </p>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-background/60">
                {course.ratingAvg > 0 && (
                  <span className="flex items-center gap-1">
                    <Star size={14} className="text-primary fill-current" />
                    <span className="font-semibold text-background">
                      {course.ratingAvg.toFixed(1)}
                    </span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <BookOpen size={14} />
                  {totalLessons} lessons
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {formatDuration(course.totalDurationSec)}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {totalModules} modules
                </span>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-xs font-semibold text-primary-foreground">
                  {course.instructor.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-background/70">
                  By{" "}
                  <span className="text-background font-medium">
                    {course.instructor.name}
                  </span>
                </span>
              </div>
            </div>

            {/* Right: Course card (desktop) */}
            <div className="md:col-span-2 hidden md:block">
              <div className="bg-card text-foreground rounded-2xl overflow-hidden shadow-2xl sticky top-20">
                <div className="relative aspect-video">
                  <SafeImage
                    src={
                      course.thumbnailUrl ??
                      `https://picsum.photos/seed/${course.slug}/600/400`
                    }
                    alt={course.title}
                    fill
                    sizes="400px"
                    className="object-cover"
                  />
                </div>
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-2xl font-bold ${isFree ? "text-primary" : "text-foreground"}`}
                    >
                      {price}
                    </span>
                    {!isFree && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPaise(Math.round(course.pricePaise * 1.3))}
                      </span>
                    )}
                  </div>
                  <EnrollButton
                    courseId={course.id}
                    isEnrolled={course.isEnrolled}
                    isFree={isFree}
                    price={price}
                  />
                  <div className="text-xs text-muted-foreground text-center">
                    {isFree
                      ? "Free access — no credit card needed"
                      : "30-day money-back guarantee"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3 flex flex-col gap-10">
          {/* What you'll learn */}
          <section>
            <h2 className="text-2xl font-bold mb-4">What You&apos;ll Learn</h2>
            <div className="bg-muted rounded-2xl p-6 grid sm:grid-cols-2 gap-2">
              {course.description
                .split(". ")
                .slice(0, 6)
                .map((point, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2
                      size={16}
                      className="text-primary shrink-0 mt-0.5"
                    />
                    <span>{point.replace(/\.$/, "")}</span>
                  </div>
                ))}
            </div>
          </section>

          {/* Curriculum */}
          <section>
            <h2 className="text-2xl font-bold mb-2">Course Curriculum</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {totalModules} modules · {totalLessons} lessons ·{" "}
              {formatDuration(course.totalDurationSec)} total
            </p>
            <Accordion multiple>
              {course.modules.map((mod) => {
                const modDuration = mod.lessons.reduce(
                  (sum, l) => sum + l.durationSec,
                  0
                );
                return (
                  <AccordionItem key={mod.id} value={mod.id}>
                    <AccordionTrigger className="px-4 py-3 bg-muted rounded-lg font-semibold text-sm">
                      <div className="flex flex-col items-start gap-0.5 text-left">
                        <span>{mod.title}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {mod.lessons.length} lessons ·{" "}
                          {formatDuration(modDuration)}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pt-1">
                      {mod.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/50 rounded-lg transition-colors"
                        >
                          {course.isEnrolled ? (
                            <PlayCircle
                              size={16}
                              className="text-primary shrink-0"
                            />
                          ) : (
                            <Lock
                              size={14}
                              className="text-muted-foreground shrink-0"
                            />
                          )}
                          <span className="flex-1">{lesson.title}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatLessonDuration(lesson.durationSec)}
                          </span>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </section>

          {/* Instructor card */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Your Instructor</h2>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center text-xl font-bold text-primary">
                  {course.instructor.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {course.instructor.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">Instructor</p>
                </div>
              </div>
              {course.instructor.bio && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {course.instructor.bio}
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Right sidebar — mobile enroll card */}
        <div className="md:col-span-2 md:hidden">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
              <SafeImage
                src={
                  course.thumbnailUrl ??
                  `https://picsum.photos/seed/${course.slug}/600/400`
                }
                alt={course.title}
                fill
                sizes="400px"
                className="object-cover"
              />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span
                className={`text-2xl font-bold ${isFree ? "text-primary" : "text-foreground"}`}
              >
                {price}
              </span>
            </div>
            <EnrollButton
              courseId={course.id}
              isEnrolled={course.isEnrolled}
              isFree={isFree}
              price={price}
            />
          </div>
        </div>
      </div>

      {/* Mobile sticky enroll bar */}
      <div className="fixed bottom-0 inset-x-0 bg-card border-t border-border p-4 md:hidden z-30">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <p className="text-sm font-semibold flex-1 truncate">{course.title}</p>
          <EnrollButton
            courseId={course.id}
            isEnrolled={course.isEnrolled}
            isFree={isFree}
            price={price}
            compact
          />
        </div>
      </div>
    </div>
  );
}
