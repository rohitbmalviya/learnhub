"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import { toast } from "sonner";
import { Loader2, GraduationCap, BookOpen } from "lucide-react";
import { registerAction } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["STUDENT", "INSTRUCTOR"]),
});

type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"STUDENT" | "INSTRUCTOR">("STUDENT");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "STUDENT" },
  });

  const handleRoleChange = (role: "STUDENT" | "INSTRUCTOR") => {
    setSelectedRole(role);
    setValue("role", role);
  };

  const onSubmit = async (data: FormData) => {
    setIsPending(true);
    try {
      const result = await registerAction(data);
      if (!result.success) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            setError(field as keyof FormData, { message: messages[0] });
          });
        } else {
          toast.error(result.error);
        }
        return;
      }
      toast.success("Account created! Welcome to LearnHub.");
      if (result.data.role === "INSTRUCTOR") {
        router.push("/instructor");
      } else {
        router.push("/dashboard");
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Role picker */}
      <div className="flex flex-col gap-1.5">
        <Label>I want to</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleRoleChange("STUDENT")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition-all cursor-pointer",
              selectedRole === "STUDENT"
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            )}
          >
            <BookOpen size={20} />
            Learn
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange("INSTRUCTOR")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition-all cursor-pointer",
              selectedRole === "INSTRUCTOR"
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            )}
          >
            <GraduationCap size={20} />
            Teach
          </button>
        </div>
        {/* Hidden input for RHF */}
        <input type="hidden" {...register("role")} value={selectedRole} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          placeholder="Jane Doe"
          autoComplete="name"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-11 mt-2"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Creating account…
          </>
        ) : (
          `Create ${selectedRole === "INSTRUCTOR" ? "Instructor" : "Student"} Account`
        )}
      </Button>
    </form>
  );
}
