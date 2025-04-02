import Link from "next/link";
import {
  Search,
  PlayCircle,
  Award,
  GraduationCap,
  ArrowRight,
  BookOpen,
  Code2,
  Palette,
  TrendingUp,
  BarChart2,
  Music,
  Camera,
  Globe,
  Users,
} from "lucide-react";
import { getCourses, getCategories } from "@/lib/actions/courses";
import { Button } from "@/components/ui/button";
import { CourseCardBrowse } from "@/components/shared/course-card";
import type { ReactElement } from "react";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Programming: Code2,
  Design: Palette,
  Business: TrendingUp,
  "Data Science": BarChart2,
  Music: Music,
  Photography: Camera,
  Marketing: Globe,
  Default: BookOpen,
};

export default async function LandingPage() {
  const [featuredCourses, categories] = await Promise.all([
    getCourses({}),
    getCategories(),
  ]);

  const displayCourses = featuredCourses.slice(0, 6);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 75% 50%, oklch(0.70 0.18 50 / 8%), transparent)",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-3 flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-semibold w-fit">
                <GraduationCap size={16} />
                500+ Courses Available
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-foreground">
                Learn Without{" "}
                <span className="text-primary">Limits</span>,
                <br />
                Grow Without Boundaries
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                Expert-led courses in programming, design, business, and more.
                Learn at your pace, earn certificates, and unlock your career
                potential.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  size="lg"
                  className="h-11 px-6 text-base"
                  render={<Link href="/courses" /> as ReactElement}
                >
                  Browse Courses
                  <ArrowRight size={18} />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 px-6 text-base"
                  render={<Link href="/register" /> as ReactElement}
                >
                  <PlayCircle size={18} />
                  Start for Free
                </Button>
              </div>
            </div>

            <div className="lg:col-span-2 hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-sm">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <GraduationCap size={20} className="text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Course Complete!</p>
                      <p className="text-xs text-muted-foreground">Advanced React Patterns</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {["Introduction", "Core Concepts", "Advanced Patterns"].map(
                      (lesson, i) => (
                        <div key={lesson} className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                              i < 2
                                ? "bg-green-100 text-green-700"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {i < 2 ? "✓" : "▶"}
                          </div>
                          <span className="text-sm font-medium">{lesson}</span>
                        </div>
                      )
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs font-semibold text-primary">67%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full">
                      <div className="h-1.5 bg-primary rounded-full w-2/3" />
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground rounded-xl px-3 py-2 shadow-lg text-sm font-semibold">
                  🏆 Certificate Earned
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-primary text-primary-foreground py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-semibold">
            <span className="flex items-center gap-2">
              <BookOpen size={16} />
              500+ Courses
            </span>
            <span className="hidden sm:block opacity-40">·</span>
            <span className="flex items-center gap-2">
              <Users size={16} />
              20,000+ Students
            </span>
            <span className="hidden sm:block opacity-40">·</span>
            <span>⭐ 4.8 Average Rating</span>
            <span className="hidden sm:block opacity-40">·</span>
            <span>100% Online, Self-paced</span>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Start Learning Today</h2>
              <p className="text-muted-foreground mt-1">
                Handpicked courses to get you started
              </p>
            </div>
            <Button
              variant="outline"
              render={<Link href="/courses" /> as ReactElement}
            >
              View all
              <ArrowRight size={16} />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCourses.map((course) => (
              <CourseCardBrowse key={course.id} course={course} />
            ))}
          </div>
          {displayCourses.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <GraduationCap size={48} className="mx-auto mb-3 opacity-40" />
              <p>Courses are being added — check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">Browse by Category</h2>
            <p className="text-muted-foreground mt-2">
              Find the perfect course for your goals
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {(categories.length > 0
              ? categories
              : [
                  "Programming",
                  "Design",
                  "Business",
                  "Data Science",
                  "Marketing",
                  "Photography",
                ]
            ).map((cat) => {
              const Icon = CATEGORY_ICONS[cat] ?? CATEGORY_ICONS.Default;
              return (
                <Link
                  key={cat}
                  href={`/courses?category=${encodeURIComponent(cat)}`}
                  className="flex flex-col items-center gap-3 rounded-xl p-4 bg-card border border-border hover:border-primary/40 hover:shadow-sm transition-all text-center group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <span className="text-sm font-medium leading-tight">{cat}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Learn in 3 Simple Steps</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              From browsing to certification — your learning journey starts here
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                step: "01",
                title: "Find Your Course",
                desc: "Browse hundreds of expert-led courses across dozens of categories. Filter by level, price, or topic.",
              },
              {
                icon: PlayCircle,
                step: "02",
                title: "Learn at Your Pace",
                desc: "Watch video lessons, complete hands-on projects, and track your progress as you go.",
              },
              {
                icon: Award,
                step: "03",
                title: "Earn Your Certificate",
                desc: "Complete the course, pass the quiz, and earn a certificate to showcase your skills.",
              },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Icon size={32} className="text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 text-xs font-bold bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center">
                    {step.slice(1)}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instructor CTA strip */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-2xl px-8 py-12 text-center text-primary-foreground"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.70 0.18 50) 0%, oklch(0.78 0.20 55) 100%)",
            }}
          >
            <GraduationCap size={48} className="mx-auto mb-4 opacity-90" />
            <h2 className="text-3xl font-bold mb-3">Share Your Knowledge</h2>
            <p className="text-primary-foreground/80 max-w-md mx-auto mb-6 leading-relaxed">
              Join our community of expert instructors. Create courses, reach
              thousands of learners, and earn from what you love.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 h-11 px-8 text-base font-semibold rounded-lg bg-white text-primary hover:bg-white/90 transition-colors"
            >
              Become an Instructor
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
