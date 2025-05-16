"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { submitQuiz } from "@/lib/actions/quiz";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/shared/progress-bar";
import { cn } from "@/lib/utils";
import type { QuizForStudent, BestAttempt, SubmitQuizResult } from "@/lib/actions/quiz";
import type { ReactElement } from "react";

interface QuizClientProps {
  quiz: QuizForStudent;
  courseId: string;
  initialBestAttempt: BestAttempt;
}

type QuizState = "idle" | "taking" | "results";

export function QuizClient({
  quiz,
  courseId,
  initialBestAttempt,
}: QuizClientProps) {
  const [quizState, setQuizState] = useState<QuizState>(
    initialBestAttempt ? "results" : "idle"
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitQuizResult | null>(null);
  const [bestAttempt, setBestAttempt] = useState(initialBestAttempt);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStart = () => {
    setAnswers({});
    setResult(null);
    setQuizState("taking");
  };

  const handleSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const allAnswered = quiz.questions.every((q) => answers[q.id]);
  const answeredCount = Object.keys(answers).length;

  const handleSubmit = async () => {
    if (!allAnswered) {
      toast.error("Please answer all questions before submitting.");
      return;
    }
    setIsSubmitting(true);
    try {
      const submittedAnswers = quiz.questions.map((q) => ({
        questionId: q.id,
        optionId: answers[q.id] ?? "",
      }));
      const res = await submitQuiz(courseId, submittedAnswers);
      setResult(res);
      if (!bestAttempt || res.score > bestAttempt.score) {
        setBestAttempt({
          attemptId: res.attemptId,
          score: res.score,
          passed: res.passed,
          takenAt: new Date(),
        });
      }
      setQuizState("results");
    } catch (err) {
      const code = err instanceof Error ? err.message : String(err);
      toast.error(
        code === "QUIZ_LOCKED"
          ? "Complete all lessons first to take the quiz."
          : "Failed to submit quiz. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Idle state — show best attempt or start prompt
  if (quizState === "idle") {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Trophy size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-muted-foreground mt-1">
            {quiz.questions.length} questions · {quiz.passingScore}% to pass
          </p>
        </div>

        {bestAttempt && (
          <div
            className={cn(
              "rounded-xl border p-4 text-center",
              bestAttempt.passed
                ? "bg-primary/10 border-primary/30"
                : "bg-destructive/10 border-destructive/30"
            )}
          >
            <p className="text-sm text-muted-foreground">Your best score</p>
            <p className="text-3xl font-bold mt-1">{bestAttempt.score}%</p>
            <p
              className={cn(
                "text-sm font-semibold mt-1",
                bestAttempt.passed ? "text-primary" : "text-destructive"
              )}
            >
              {bestAttempt.passed ? "Passed ✓" : "Not passed yet"}
            </p>
          </div>
        )}

        <Button className="w-full h-11" onClick={handleStart}>
          {bestAttempt ? "Retake Quiz" : "Start Quiz"}
          <ArrowRight size={16} />
        </Button>
      </div>
    );
  }

  // Results state
  if (quizState === "results" && result) {
    const passed = result.passed;
    return (
      <div className="flex flex-col gap-6">
        {/* Score card */}
        <div
          className={cn(
            "rounded-2xl border p-8 text-center",
            passed
              ? "bg-primary/10 border-primary/30"
              : "bg-destructive/10 border-destructive/30"
          )}
        >
          {passed ? (
            <CheckCircle2 size={48} className="text-green-600 mx-auto mb-3" />
          ) : (
            <XCircle size={48} className="text-destructive mx-auto mb-3" />
          )}
          <h2
            className={cn(
              "text-2xl font-bold mb-1",
              passed ? "text-primary" : "text-foreground"
            )}
          >
            {passed ? "Congratulations!" : "Almost There!"}
          </h2>
          <p className="text-4xl font-bold text-foreground mt-2">
            {result.score}%
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {result.correctCount} of {result.total} correct · Pass mark:{" "}
            {quiz.passingScore}%
          </p>
          {passed && (
            <p className="text-sm text-primary font-semibold mt-2">
              You&apos;ve passed! Well done.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant={passed ? "outline" : "default"}
            className="flex-1"
            onClick={handleStart}
          >
            <RotateCcw size={16} />
            {passed ? "Retake Quiz" : "Try Again"}
          </Button>
          <Button
            variant={passed ? "default" : "outline"}
            className="flex-1"
            render={<Link href="/dashboard" /> as ReactElement}
          >
            Go to Dashboard
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    );
  }

  // Return best attempt results if no new result but in results state
  if (quizState === "results" && bestAttempt && !result) {
    return (
      <div className="flex flex-col gap-6">
        <div
          className={cn(
            "rounded-2xl border p-8 text-center",
            bestAttempt.passed
              ? "bg-primary/10 border-primary/30"
              : "bg-destructive/10 border-destructive/30"
          )}
        >
          {bestAttempt.passed ? (
            <CheckCircle2 size={48} className="text-green-600 mx-auto mb-3" />
          ) : (
            <XCircle size={48} className="text-destructive mx-auto mb-3" />
          )}
          <h2 className="text-2xl font-bold mb-1 text-primary">
            {bestAttempt.passed ? "Congratulations!" : "Keep Trying!"}
          </h2>
          <p className="text-4xl font-bold text-foreground mt-2">
            {bestAttempt.score}%
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Pass mark: {quiz.passingScore}%
          </p>
        </div>
        <Button className="w-full" onClick={handleStart}>
          <RotateCcw size={16} />
          Retake Quiz
        </Button>
      </div>
    );
  }

  // Taking state
  const progressPct = Math.round((answeredCount / quiz.questions.length) * 100);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold mb-1">{quiz.title}</h1>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>{answeredCount} of {quiz.questions.length} answered</span>
          <span>{progressPct}% complete</span>
        </div>
        <ProgressBar value={progressPct} size="sm" label="Quiz progress" />
      </div>

      {/* Questions */}
      <div className="flex flex-col gap-8">
        {quiz.questions.map((question, qi) => (
          <fieldset key={question.id} className="flex flex-col gap-3">
            <legend className="text-base font-semibold text-foreground mb-2">
              <span className="text-muted-foreground font-normal mr-2">
                Q{qi + 1}.
              </span>
              {question.text}
            </legend>
            <div className="flex flex-col gap-2" role="radiogroup">
              {question.options.map((option) => {
                const isSelected = answers[question.id] === option.id;
                return (
                  <label
                    key={option.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option.id}
                      checked={isSelected}
                      onChange={() => handleSelect(question.id, option.id)}
                      className="sr-only"
                    />
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      )}
                    >
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-sm">{option.text}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {/* Submit */}
      <Button
        className="w-full h-11 mt-4"
        onClick={handleSubmit}
        disabled={!allAnswered || isSubmitting}
      >
        {isSubmitting ? "Submitting…" : "Submit Quiz"}
        {!isSubmitting && <ArrowRight size={16} />}
      </Button>
    </div>
  );
}
