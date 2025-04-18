"use client";

import Link from "next/link";
import { User, LogOut, BookOpen, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/session";
import type { ReactElement } from "react";

interface HeaderUserMenuProps {
  user: SessionUser;
  logoutAction: () => Promise<void>;
}

export function HeaderUserMenu({ user, logoutAction }: HeaderUserMenuProps) {
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-2">
      {user.role === "STUDENT" && (
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/dashboard" /> as ReactElement}
        >
          <LayoutDashboard size={16} />
          <span className="hidden sm:inline">Dashboard</span>
        </Button>
      )}
      {user.role === "INSTRUCTOR" && (
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/instructor" /> as ReactElement}
        >
          <BookOpen size={16} />
          <span className="hidden sm:inline">Instructor</span>
        </Button>
      )}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary border border-primary/20">
          {initials}
        </div>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="icon-sm"
            aria-label="Log out"
          >
            <LogOut size={15} />
          </Button>
        </form>
      </div>
    </div>
  );
}
