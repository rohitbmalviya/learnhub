import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { HeaderUserMenu } from "./header-user-menu";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground hover:text-primary transition-colors shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap size={18} className="text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">LearnHub</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/courses"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Courses
          </Link>
          {user?.role === "INSTRUCTOR" && (
            <Link
              href="/instructor"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Instructor
            </Link>
          )}
          {user?.role === "STUDENT" && (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              My Learning
            </Link>
          )}
        </nav>

        {/* Auth area */}
        <div className="flex items-center gap-2">
          {user ? (
            <HeaderUserMenu user={user} logoutAction={logoutAction} />
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                Sign in
              </Button>
              <Button size="sm" render={<Link href="/register" />}>
                Get Started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
