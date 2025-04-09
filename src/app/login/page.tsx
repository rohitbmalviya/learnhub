import { Metadata } from "next";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
            <GraduationCap size={24} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to continue your learning journey
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <LoginForm />

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary font-medium hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 p-4 bg-muted/60 rounded-xl border border-border text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">Demo credentials</p>
          <p>Student: <span className="font-mono">arjun@example.com</span> / <span className="font-mono">Student@1234</span></p>
          <p>Instructor: <span className="font-mono">rahul@learnhub.dev</span> / <span className="font-mono">Instructor@1234</span></p>
        </div>
      </div>
    </div>
  );
}
