import { cn } from "@/lib/utils";
import { Sprout, TrendingUp, Flame } from "lucide-react";
import type { Level } from "@/generated/prisma/enums";

const config: Record<
  Level,
  { label: string; icon: React.ComponentType<{ className?: string; size?: number }>; className: string }
> = {
  BEGINNER: {
    label: "Beginner",
    icon: Sprout,
    className: "bg-accent text-accent-foreground",
  },
  INTERMEDIATE: {
    label: "Intermediate",
    icon: TrendingUp,
    className: "bg-secondary text-secondary-foreground",
  },
  ADVANCED: {
    label: "Advanced",
    icon: Flame,
    className: "bg-primary text-primary-foreground",
  },
};

interface LevelBadgeProps {
  level: Level;
  className?: string;
}

export function LevelBadge({ level, className }: LevelBadgeProps) {
  const { label, icon: Icon, className: variantClass } = config[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-sm uppercase tracking-wide",
        variantClass,
        className
      )}
    >
      <Icon size={12} />
      {label}
    </span>
  );
}
