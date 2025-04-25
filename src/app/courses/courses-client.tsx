"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, SlidersHorizontal, GraduationCap, X } from "lucide-react";
import { getCourses } from "@/lib/actions/courses";
import { CourseCardBrowse } from "@/components/shared/course-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CourseCard } from "@/lib/actions/courses";

interface Filters {
  category: string;
  level: string;
  price: string;
  search: string;
}

interface CoursesClientProps {
  initialCourses: CourseCard[];
  categories: string[];
  initialFilters: Filters;
}

const LEVELS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const PRICE_OPTIONS = [
  { value: "", label: "All" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];

export function CoursesClient({
  initialCourses,
  categories,
  initialFilters,
}: CoursesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [courses, setCourses] = useState<CourseCard[]>(initialCourses);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [searchValue, setSearchValue] = useState(initialFilters.search);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const activeFilterCount = [
    filters.category,
    filters.level,
    filters.price,
    filters.search,
  ].filter(Boolean).length;

  const applyFilters = (newFilters: Filters) => {
    setFilters(newFilters);
    startTransition(async () => {
      const params = new URLSearchParams();
      if (newFilters.category) params.set("category", newFilters.category);
      if (newFilters.level) params.set("level", newFilters.level);
      if (newFilters.price) params.set("price", newFilters.price);
      if (newFilters.search) params.set("search", newFilters.search);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });

      const results = await getCourses({
        category: newFilters.category || undefined,
        level: newFilters.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | undefined,
        priceFilter: newFilters.price as "free" | "paid" | undefined,
        search: newFilters.search || undefined,
      });
      setCourses(results);
    });
  };

  const updateFilter = (key: keyof Filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    applyFilters(newFilters);
  };

  const clearFilters = () => {
    setSearchValue("");
    applyFilters({ category: "", level: "", price: "", search: "" });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter("search", searchValue);
  };

  const FilterPanel = () => (
    <aside className="flex flex-col gap-6">
      {/* Category */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Category</h3>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => updateFilter("category", "")}
            className={cn(
              "text-left px-2 py-1.5 rounded-md text-sm transition-colors",
              !filters.category
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => updateFilter("category", cat)}
              className={cn(
                "text-left px-2 py-1.5 rounded-md text-sm transition-colors",
                filters.category === cat
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Level */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Level</h3>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => updateFilter("level", "")}
            className={cn(
              "text-left px-2 py-1.5 rounded-md text-sm transition-colors",
              !filters.level
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            All Levels
          </button>
          {LEVELS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateFilter("level", value)}
              className={cn(
                "text-left px-2 py-1.5 rounded-md text-sm transition-colors",
                filters.level === value
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Price</h3>
        <div className="flex flex-col gap-1">
          {PRICE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateFilter("price", value)}
              className={cn(
                "text-left px-2 py-1.5 rounded-md text-sm transition-colors",
                filters.price === value
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <Button variant="outline" size="sm" onClick={clearFilters}>
          <X size={14} />
          Clear filters ({activeFilterCount})
        </Button>
      )}
    </aside>
  );

  return (
    <div className="flex gap-8">
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-52 shrink-0">
        <div className="bg-card border border-border rounded-xl p-4 sticky top-20">
          <FilterPanel />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Search + mobile filter */}
        <div className="flex gap-2 mb-6">
          <form
            onSubmit={handleSearch}
            className="flex-1 relative"
            role="search"
          >
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search courses…"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9 rounded-full"
              aria-label="Search courses"
            />
          </form>
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden relative"
            onClick={() => setShowMobileFilters(true)}
            aria-label="Open filters"
          >
            <SlidersHorizontal size={16} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full text-xs w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Mobile filter sheet */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowMobileFilters(false)}
            />
            <div className="absolute inset-x-0 bottom-0 bg-card rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold">Filters</h2>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowMobileFilters(false)}
                >
                  <X size={16} />
                </Button>
              </div>
              <FilterPanel />
            </div>
          </div>
        )}

        {/* Course grid */}
        {isPending ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border overflow-hidden">
                <Skeleton className="aspect-video" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-full mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <GraduationCap size={64} className="text-muted-foreground/40" />
            <div>
              <p className="text-lg font-semibold">No courses found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your filters or search terms
              </p>
            </div>
            <Button variant="link" onClick={clearFilters} className="text-primary">
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCardBrowse key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
