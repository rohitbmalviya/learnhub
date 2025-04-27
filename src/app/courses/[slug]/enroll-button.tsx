"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { enrollInCourse } from "@/lib/actions/enrollment";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { ReactElement } from "react";

interface EnrollButtonProps {
  courseId: string;
  isEnrolled: boolean;
  isFree: boolean;
  price: string;
  compact?: boolean;
}

export function EnrollButton({
  courseId,
  isEnrolled,
  isFree,
  price,
  compact = false,
}: EnrollButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  if (isEnrolled) {
    return (
      <Button
        variant="secondary"
        className={compact ? "shrink-0" : "w-full h-11"}
        render={<Link href={`/learn/${courseId}`} /> as ReactElement}
      >
        Continue Learning
        <ArrowRight size={16} />
      </Button>
    );
  }

  const handleEnroll = async () => {
    setIsPending(true);
    try {
      const result = await enrollInCourse(courseId);
      if (!result.success) {
        if (result.error === "UNAUTHENTICATED") {
          toast.error("Please sign in to enroll");
          router.push("/login");
          return;
        }
        toast.error(result.error ?? "Failed to enroll");
        return;
      }
      toast.success("Successfully enrolled! Let's start learning.");
      router.push(`/learn/${courseId}`);
    } catch (err) {
      const code = err instanceof Error ? err.message : String(err);
      if (code === "UNAUTHENTICATED") {
        toast.error("Please sign in to enroll");
        router.push("/login");
      } else {
        toast.error("Failed to enroll. Please try again.");
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      onClick={handleEnroll}
      disabled={isPending}
      className={compact ? "shrink-0" : "w-full h-11"}
    >
      {isPending ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Enrolling…
        </>
      ) : isFree ? (
        <>
          Enroll for Free
          <ArrowRight size={16} />
        </>
      ) : (
        <>
          Enroll — {price}
          <ArrowRight size={16} />
        </>
      )}
    </Button>
  );
}
