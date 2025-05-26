"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createCourse } from "@/lib/actions/instructor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  pricePaise: z.number().int().min(0),
  thumbnailUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

const CATEGORIES = [
  "Programming",
  "Design",
  "Business",
  "Data Science",
  "Marketing",
  "Photography",
  "Music",
  "Personal Development",
];

export function NewCourseForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">("BEGINNER");
  const [selectedCategory, setSelectedCategory] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      level: "BEGINNER",
      pricePaise: 0,
    },
  });

  const titleValue = watch("title") ?? "";

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("title", e.target.value);
    setValue("slug", generateSlug(e.target.value));
  };

  const onSubmit = async (data: FormData) => {
    setIsPending(true);
    try {
      const result = await createCourse({
        ...data,
        thumbnailUrl: data.thumbnailUrl || null,
      });
      if (!result.success) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field]) => {
            toast.error(`${field}: ${result.fieldErrors![field][0]}`);
          });
        } else {
          toast.error(result.error);
        }
        return;
      }
      toast.success("Course created! Now add modules and lessons.");
      router.push(`/instructor/courses/${result.data.courseId}`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Course Title *</Label>
        <Input
          id="title"
          placeholder="e.g. Complete React Developer Course"
          aria-invalid={!!errors.title}
          {...register("title", { onChange: handleTitleChange })}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">URL Slug *</Label>
        <Input
          id="slug"
          placeholder="e.g. complete-react-developer-course"
          aria-invalid={!!errors.slug}
          {...register("slug")}
        />
        {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
        <p className="text-xs text-muted-foreground">
          This will be the URL: /courses/your-slug
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="What will students learn? What makes this course special?"
          rows={4}
          aria-invalid={!!errors.description}
          {...register("description")}
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <Label>Category *</Label>
          <Select
            value={selectedCategory}
            onValueChange={(val) => {
              if (val === null) return;
              setSelectedCategory(val);
              setValue("category", val);
            }}
          >
            <SelectTrigger className="w-full" aria-invalid={!!errors.category}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" {...register("category")} value={selectedCategory} />
          {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
        </div>

        {/* Level */}
        <div className="flex flex-col gap-1.5">
          <Label>Level *</Label>
          <div className="flex gap-2">
            {(["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => {
                  setSelectedLevel(lvl);
                  setValue("level", lvl);
                }}
                className={cn(
                  "flex-1 py-1.5 rounded-md border text-xs font-medium transition-all",
                  selectedLevel === lvl
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                )}
              >
                {lvl.charAt(0) + lvl.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <input type="hidden" {...register("level")} value={selectedLevel} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pricePaise">Price (in Paise — 0 for free)</Label>
        <Input
          id="pricePaise"
          type="number"
          min="0"
          step="100"
          placeholder="e.g. 149900 for ₹1,499"
          aria-invalid={!!errors.pricePaise}
          {...register("pricePaise", { valueAsNumber: true })}
        />
        {errors.pricePaise && <p className="text-xs text-destructive">{errors.pricePaise.message}</p>}
        <p className="text-xs text-muted-foreground">100 paise = ₹1. Leave as 0 for a free course.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="thumbnailUrl">Thumbnail URL (optional)</Label>
        <Input
          id="thumbnailUrl"
          type="url"
          placeholder="https://..."
          aria-invalid={!!errors.thumbnailUrl}
          {...register("thumbnailUrl")}
        />
        {errors.thumbnailUrl && <p className="text-xs text-destructive">{errors.thumbnailUrl.message}</p>}
      </div>

      <Button type="submit" className="w-full h-11" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Creating course…
          </>
        ) : (
          "Create Course & Continue"
        )}
      </Button>
    </form>
  );
}
