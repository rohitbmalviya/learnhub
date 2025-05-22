"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { togglePublish } from "@/lib/actions/instructor";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PublishToggleProps {
  courseId: string;
  initialPublished: boolean;
}

export function PublishToggle({ courseId, initialPublished }: PublishToggleProps) {
  const [published, setPublished] = useState(initialPublished);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      const result = await togglePublish(courseId);
      if (!result.success) {
        toast.error(result.error ?? "Failed to update status");
        return;
      }
      setPublished(result.data.published);
      toast.success(result.data.published ? "Course published!" : "Course unpublished");
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={published}
        onCheckedChange={handleToggle}
        disabled={isPending}
        aria-label={published ? "Unpublish course" : "Publish course"}
      />
      <Badge
        className={cn(
          "text-xs",
          published
            ? "bg-green-100 text-green-800 hover:bg-green-100"
            : "bg-muted text-muted-foreground hover:bg-muted"
        )}
      >
        {published ? "Published" : "Draft"}
      </Badge>
    </div>
  );
}
