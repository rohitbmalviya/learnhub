import { redirect } from "next/navigation";
import { getQuiz, getMyBestAttempt } from "@/lib/actions/quiz";
import { QuizClient } from "./quiz-client";
import Link from "next/link";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import type { ReactElement } from "react";

export const metadata: Metadata = {
  title: "Quiz",
};

export default async function QuizPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  let quiz;
  let bestAttempt;
  try {
    [quiz, bestAttempt] = await Promise.all([
      getQuiz(courseId),
      getMyBestAttempt(courseId),
    ]);
  } catch (err) {
    const code = err instanceof Error ? err.message : String(err);
    if (code === "QUIZ_LOCKED") {
      // Quiz locked - redirect to learning page
      redirect(`/learn/${courseId}`);
    }
    if (code === "NOT_ENROLLED" || code === "UNAUTHENTICATED") {
      redirect("/courses");
    }
    if (code === "QUIZ_NOT_FOUND") {
      redirect(`/learn/${courseId}`);
    }
    redirect("/dashboard");
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Minimal nav */}
      <nav className="sticky top-0 z-10 bg-background border-b border-border h-14 flex items-center px-4">
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-bold text-foreground hover:text-primary transition-colors"
          >
            <GraduationCap size={18} className="text-primary" />
            LearnHub
          </Link>
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={`/learn/${courseId}`} /> as ReactElement}
          >
            <ArrowLeft size={15} />
            Back to Course
          </Button>
        </div>
      </nav>

      {/* Quiz content */}
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
        <QuizClient
          quiz={quiz}
          courseId={courseId}
          initialBestAttempt={bestAttempt}
        />
      </div>
    </div>
  );
}
