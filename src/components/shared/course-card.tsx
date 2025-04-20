import Link from "next/link";
import { Star, Clock, BookOpen, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPaise } from "@/lib/payments";
import { SafeImage } from "./safe-image";
import { LevelBadge } from "./level-badge";
import { Button } from "@/components/ui/button";
import type { CourseCard } from "@/lib/actions/courses";

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

interface CourseCardProps {
  course: CourseCard;
  className?: string;
}

export function CourseCardBrowse({ course, className }: CourseCardProps) {
  const price = formatPaise(course.pricePaise);
  const isFree = course.pricePaise === 0;

  return (
    <article
      className={cn(
        "group rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-150 overflow-hidden flex flex-col",
        className
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-t-xl">
        <SafeImage
          src={
            course.thumbnailUrl ??
            `https://picsum.photos/seed/${course.slug}/600/400`
          }
          alt={course.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover motion-safe:group-hover:scale-[1.02] transition-transform duration-150"
        />
        {/* Level badge overlay */}
        <div className="absolute top-2 left-2">
          <LevelBadge level={course.level} />
        </div>
        {/* Price badge overlay */}
        <div className="absolute top-2 right-2">
          {isFree ? (
            <span className="text-xs font-bold px-2 py-1 rounded-sm bg-primary/15 text-primary">
              Free
            </span>
          ) : null}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Category */}
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {course.category}
        </p>

        {/* Title */}
        <h3 className="text-base font-semibold leading-snug line-clamp-2">
          <Link
            href={`/courses/${course.slug}`}
            className="hover:text-primary transition-colors"
          >
            {course.title}
          </Link>
        </h3>

        {/* Instructor */}
        <p className="text-sm text-muted-foreground">
          By {course.instructor.name}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-2">
          {course.ratingAvg > 0 && (
            <span className="flex items-center gap-1">
              <Star
                size={12}
                className="text-primary fill-current"
                aria-hidden="true"
              />
              <span className="font-medium text-foreground">
                {course.ratingAvg.toFixed(1)}
              </span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <BookOpen size={12} aria-hidden="true" />
            {course.lessonCount} lessons
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} aria-hidden="true" />
            {formatDuration(course.totalDurationSec)}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border mt-1">
          <span
            className={cn(
              "text-base font-bold",
              isFree ? "text-primary" : "text-foreground"
            )}
          >
            {price}
          </span>
          <Button size="sm" render={<Link href={`/courses/${course.slug}`} />}>
            View Course
            <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </article>
  );
}
