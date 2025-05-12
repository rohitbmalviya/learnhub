"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  X,
  CheckCircle2,
  Circle,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Menu,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { markLessonComplete } from "@/lib/actions/learning";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/shared/progress-bar";
import { cn } from "@/lib/utils";
import type { CourseForLearning, LessonWithCompletion } from "@/lib/actions/learning";
import type { ReactElement } from "react";

interface LearnClientProps {
  course: CourseForLearning;
  initialLesson: LessonWithCompletion;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function LearnClient({ course, initialLesson }: LearnClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeLesson, setActiveLesson] = useState(initialLesson);
  const [modules, setModules] = useState(course.modules);
  const [progress, setProgress] = useState({
    progressPercent: course.progressPercent,
    completedLessons: course.completedLessons,
    totalLessons: course.totalLessons,
    quizUnlocked: course.quizUnlocked,
  });
  const [completingLesson, setCompletingLesson] = useState(false);
  const [showMobileCurriculum, setShowMobileCurriculum] = useState(false);

  const allLessons = modules.flatMap((m) => m.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === activeLesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const navigateToLesson = useCallback((lesson: LessonWithCompletion) => {
    setActiveLesson(lesson);
    router.replace(`/learn/${course.id}?lesson=${lesson.id}`, { scroll: false });
    setShowMobileCurriculum(false);
  }, [course.id, router]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" && prevLesson) navigateToLesson(prevLesson);
      if (e.key === "ArrowRight" && nextLesson) navigateToLesson(nextLesson);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prevLesson, nextLesson, navigateToLesson]);

  const handleMarkComplete = () => {
    if (completingLesson || isPending) return;
    setCompletingLesson(true);

    startTransition(async () => {
      try {
        const result = await markLessonComplete(activeLesson.id);

        // Update local state
        setModules((prev) =>
          prev.map((mod) => ({
            ...mod,
            lessons: mod.lessons.map((lesson) =>
              lesson.id === activeLesson.id
                ? { ...lesson, completed: true }
                : lesson
            ),
          }))
        );
        setActiveLesson((prev) => ({ ...prev, completed: true }));
        setProgress({
          progressPercent: result.progressPercent,
          completedLessons: result.completedLessons,
          totalLessons: result.totalLessons,
          quizUnlocked: result.quizUnlocked,
        });

        toast.success("Lesson completed!");

        // Auto-advance to next lesson after 1.5s
        if (nextLesson) {
          setTimeout(() => {
            navigateToLesson(nextLesson);
          }, 1500);
        }
      } catch {
        toast.error("Failed to mark lesson complete. Please try again.");
      } finally {
        setCompletingLesson(false);
      }
    });
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Course title + progress */}
      <div className="p-4 border-b border-border">
        <p className="text-sm font-semibold text-foreground truncate mb-2">
          {course.title}
        </p>
        <ProgressBar
          value={progress.progressPercent}
          size="sm"
          showLabel
          label="Course progress"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {progress.completedLessons} of {progress.totalLessons} lessons
        </p>
      </div>

      {/* Module + lesson list */}
      <nav
        className="flex-1 overflow-y-auto py-2"
        aria-label="Course curriculum"
      >
        {modules.map((mod) => (
          <details key={mod.id} open className="group/details">
            <summary className="flex items-center justify-between px-4 py-2.5 cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground list-none select-none">
              <span>{mod.title}</span>
              <ChevronRight
                size={14}
                className="group-open/details:rotate-90 transition-transform"
              />
            </summary>
            <div>
              {mod.lessons.map((lesson) => {
                const isActive = lesson.id === activeLesson.id;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => navigateToLesson(lesson)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors",
                      isActive
                        ? "border-l-2 border-primary bg-primary/8 text-primary font-semibold"
                        : "hover:bg-muted/50 text-foreground"
                    )}
                  >
                    {lesson.completed ? (
                      <CheckCircle2
                        size={15}
                        className="text-green-600 shrink-0 motion-safe:transition-transform"
                        aria-label="Completed"
                      />
                    ) : isActive ? (
                      <PlayCircle
                        size={15}
                        className="text-primary shrink-0"
                        aria-label="Playing"
                      />
                    ) : (
                      <Circle
                        size={15}
                        className="text-muted-foreground shrink-0"
                        aria-label="Not started"
                      />
                    )}
                    <span
                      className={cn(
                        "flex-1 leading-snug text-xs",
                        lesson.completed && !isActive &&
                          "line-through text-muted-foreground"
                      )}
                    >
                      {lesson.title}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                      {formatDuration(lesson.durationSec)}
                    </span>
                  </button>
                );
              })}
            </div>
          </details>
        ))}
      </nav>

      {/* Quiz CTA */}
      {course.quiz && (
        <div className="p-4 border-t border-border">
          {progress.quizUnlocked ? (
            <Button
              className="w-full"
              render={
                <Link href={`/learn/${course.id}/quiz`} /> as ReactElement
              }
            >
              <GraduationCap size={16} />
              Take Final Quiz
            </Button>
          ) : (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Complete all lessons to unlock the quiz
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col fixed inset-0 z-50 bg-background overflow-hidden">
      {/* Minimal Navbar */}
      <nav className="sticky top-0 z-40 bg-background border-b border-border h-14 flex items-center px-4">
        <div className="flex items-center justify-between w-full gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-bold text-foreground hover:text-primary transition-colors shrink-0"
          >
            <GraduationCap size={18} className="text-primary" />
            LearnHub
          </Link>
          <p className="text-sm font-medium text-muted-foreground truncate hidden sm:block flex-1 text-center">
            {course.title}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile curriculum button */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setShowMobileCurriculum(true)}
              aria-label="Open curriculum"
            >
              <Menu size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/courses" /> as ReactElement}
            >
              <X size={15} />
              <span className="hidden sm:inline">Exit</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main video + lesson info */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
            {/* Video player */}
            <div className="relative aspect-video rounded-xl bg-black overflow-hidden w-full">
              {activeLesson.videoUrl ? (
                <video
                  key={activeLesson.id}
                  controls
                  className="w-full h-full"
                  poster={`https://picsum.photos/seed/${activeLesson.id}/800/450`}
                >
                  <source src={activeLesson.videoUrl} />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/60 gap-2">
                  <PlayCircle size={48} />
                  <p className="text-sm">No video for this lesson</p>
                </div>
              )}
            </div>

            {/* Lesson info */}
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground font-medium">
                {modules.find((m) =>
                  m.lessons.some((l) => l.id === activeLesson.id)
                )?.title}
              </p>
              <h1 className="text-2xl font-semibold">{activeLesson.title}</h1>

              {/* Complete + next navigation */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
                {progress.quizUnlocked && !nextLesson ? (
                  <Button
                    className="sm:w-auto"
                    render={
                      <Link href={`/learn/${course.id}/quiz`} /> as ReactElement
                    }
                  >
                    <GraduationCap size={16} />
                    Go to Quiz
                  </Button>
                ) : (
                  <Button
                    onClick={handleMarkComplete}
                    disabled={activeLesson.completed || isPending || completingLesson}
                    className="sm:w-auto"
                  >
                    {completingLesson ? (
                      <>
                        <CheckCircle2 size={16} className="text-green-400" />
                        Lesson Complete!
                      </>
                    ) : activeLesson.completed ? (
                      <>
                        <CheckCircle2 size={16} />
                        Completed
                      </>
                    ) : (
                      <>
                        Mark Complete & Next
                        <ChevronRight size={16} />
                      </>
                    )}
                  </Button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => prevLesson && navigateToLesson(prevLesson)}
                    disabled={!prevLesson}
                    aria-label="Previous lesson"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {currentIndex + 1} / {allLessons.length}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => nextLesson && navigateToLesson(nextLesson)}
                    disabled={!nextLesson}
                    aria-label="Next lesson"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>

              {/* aria-live for keyboard navigation */}
              <div aria-live="polite" className="sr-only">
                Now playing: {activeLesson.title}
              </div>
            </div>

            {/* Course complete banner */}
            {progress.progressPercent === 100 && (
              <div className="rounded-2xl p-6 border border-primary/30 bg-gradient-to-r from-primary/20 to-amber-50 flex items-center gap-4">
                <Trophy size={48} className="text-primary shrink-0" />
                <div>
                  <h2 className="text-xl font-bold text-primary">
                    You&apos;ve completed the course!
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Fantastic work. Now take the quiz to earn your certificate.
                  </p>
                  {course.quiz && (
                    <Button
                      className="mt-3"
                      render={
                        <Link href={`/learn/${course.id}/quiz`} /> as ReactElement
                      }
                    >
                      <GraduationCap size={16} />
                      Take the Final Quiz
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Lesson notes/content */}
            {activeLesson.content && (
              <div className="bg-muted rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold">Lesson Notes</h3>
                </div>
                <div
                  className="prose prose-neutral max-w-none text-sm leading-7 text-foreground"
                  style={{ maxWidth: "68ch" }}
                >
                  {activeLesson.content}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-80 shrink-0 bg-card border-l border-border overflow-hidden">
          <Sidebar />
        </aside>
      </div>

      {/* Mobile bottom bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border px-4 py-3 flex items-center justify-between z-30">
        <Button
          variant="outline"
          size="sm"
          onClick={() => prevLesson && navigateToLesson(prevLesson)}
          disabled={!prevLesson}
        >
          <ChevronLeft size={14} />
          Prev
        </Button>
        <span className="text-xs text-muted-foreground">
          {currentIndex + 1} of {allLessons.length}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => nextLesson && navigateToLesson(nextLesson)}
          disabled={!nextLesson}
        >
          Next
          <ChevronRight size={14} />
        </Button>
      </div>

      {/* Mobile curriculum drawer */}
      {showMobileCurriculum && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileCurriculum(false)}
          />
          <div className="absolute inset-y-0 right-0 w-80 bg-card shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-sm font-semibold">Curriculum</h2>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowMobileCurriculum(false)}
              >
                <X size={16} />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Sidebar />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
