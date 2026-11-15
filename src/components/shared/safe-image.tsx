"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  unoptimized?: boolean;
}

const COURSE_IMAGE_MAP: Record<string, string> = {
  "html-css": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&q=80",
  "javascript": "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&q=80",
  "python": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80",
  "ml-engineering": "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80",
  "uiux": "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&q=80",
  "figma": "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&q=80",
  "aws": "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800&q=80",
  "docker": "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800&q=80",
  "devops": "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800&q=80",
  "rahul": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  "priya": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
};

const FALLBACK_COURSE_IMAGES = [
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80",
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
  "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80",
];

function resolveImageUrl(src: string | null | undefined): string | null | undefined {
  if (!src) return src;
  if (!src.includes("picsum.photos")) return src;

  const lower = src.toLowerCase();
  for (const [key, url] of Object.entries(COURSE_IMAGE_MAP)) {
    if (lower.includes(key)) return url;
  }

  let hash = 0;
  for (let i = 0; i < src.length; i++) {
    hash = (hash << 5) - hash + src.charCodeAt(i);
    hash |= 0;
  }
  return FALLBACK_COURSE_IMAGES[Math.abs(hash) % FALLBACK_COURSE_IMAGES.length];
}

export function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
  priority,
  unoptimized,
}: SafeImageProps) {
  const [errored, setErrored] = useState(false);
  const safeSrc = resolveImageUrl(src);
  const isPicsum = typeof safeSrc === "string" && safeSrc.includes("picsum.photos");
  const isUnoptimized = unoptimized ?? isPicsum;

  const initials = alt
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (!safeSrc || errored) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground text-sm font-medium select-none",
          className
        )}
        aria-label={alt}
        role="img"
      >
        {initials}
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={safeSrc}
        alt={alt}
        fill
        sizes={sizes ?? "(max-width: 768px) 100vw, 50vw"}
        className={className}
        onError={() => setErrored(true)}
        priority={priority}
        unoptimized={isUnoptimized}
      />
    );
  }

  return (
    <Image
      src={safeSrc}
      alt={alt}
      width={width ?? 480}
      height={height ?? 270}
      className={className}
      onError={() => setErrored(true)}
      priority={priority}
      unoptimized={isUnoptimized}
    />
  );
}
