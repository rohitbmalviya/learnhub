import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  BarChart2,
  LogOut,
  GraduationCap,
  ArrowLeft,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/instructor", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/instructor/courses", label: "My Courses", icon: BookOpen, exact: false },
  { href: "/instructor/courses/new", label: "New Course", icon: PlusCircle, exact: false },
  { href: "/instructor/analytics", label: "Analytics", icon: BarChart2, exact: false },
];

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col hidden md:flex">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-sidebar-border">
          <Link
            href="/instructor"
            className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-primary transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <GraduationCap size={14} className="text-sidebar-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">LearnHub</span>
          </Link>
          <p className="text-[10px] text-sidebar-foreground/50 mt-0.5 ml-9">
            Instructor Panel
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <ArrowLeft size={15} />
            Back to Site
          </Link>
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2.5 px-3 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-destructive"
            >
              <LogOut size={15} />
              Log out
            </Button>
          </form>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/50 truncate">{user.email}</p>
          <p className="text-xs font-medium text-sidebar-foreground/80 truncate">{user.name}</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-auto bg-background">
        {children}
      </div>
    </div>
  );
}
