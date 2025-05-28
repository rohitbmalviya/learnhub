"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  Save,
  Eye,
} from "lucide-react";
import Link from "next/link";
import {
  updateCourse,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
  upsertQuiz,
  createQuestion,
  deleteQuestion,
  upsertOptions,
  togglePublish,
} from "@/lib/actions/instructor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CourseForEditor } from "@/lib/actions/instructor";
import type { ReactElement } from "react";

interface Props {
  course: CourseForEditor;
}

const CATEGORIES = [
  "Programming", "Design", "Business", "Data Science",
  "Marketing", "Photography", "Music", "Personal Development",
];

export function CourseEditorClient({ course: initialCourse }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [course, setCourse] = useState(initialCourse);

  // ── Course Info ──
  const [courseForm, setCourseForm] = useState({
    title: course.title,
    description: course.description,
    category: course.category,
    level: course.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
    pricePaise: course.pricePaise,
    thumbnailUrl: course.thumbnailUrl ?? "",
    slug: course.slug,
  });

  const handleSaveCourseInfo = () => {
    startTransition(async () => {
      const result = await updateCourse(course.id, {
        ...courseForm,
        thumbnailUrl: courseForm.thumbnailUrl || null,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Course info saved!");
      router.refresh();
    });
  };

  // ── Modules ──
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [addingModule, setAddingModule] = useState(false);

  const handleAddModule = () => {
    if (!newModuleTitle.trim()) return;
    startTransition(async () => {
      setAddingModule(true);
      const result = await createModule({
        courseId: course.id,
        title: newModuleTitle.trim(),
      });
      if (!result.success) {
        toast.error(result.error);
        setAddingModule(false);
        return;
      }
      setNewModuleTitle("");
      setAddingModule(false);
      toast.success("Module added!");
      router.refresh();
    });
  };

  const handleDeleteModule = (moduleId: string) => {
    startTransition(async () => {
      const result = await deleteModule(moduleId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Module deleted");
      router.refresh();
    });
  };

  // ── Lessons ──
  const [addLessonState, setAddLessonState] = useState<Record<string, {
    title: string; videoUrl: string; content: string; durationSec: number;
  }>>({});

  const handleAddLesson = (moduleId: string) => {
    const state = addLessonState[moduleId];
    if (!state?.title.trim()) return;
    startTransition(async () => {
      const result = await createLesson({
        moduleId,
        title: state.title.trim(),
        videoUrl: state.videoUrl || null,
        content: state.content || null,
        durationSec: state.durationSec || 0,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setAddLessonState((prev) => ({
        ...prev,
        [moduleId]: { title: "", videoUrl: "", content: "", durationSec: 0 },
      }));
      toast.success("Lesson added!");
      router.refresh();
    });
  };

  const handleDeleteLesson = (lessonId: string) => {
    startTransition(async () => {
      const result = await deleteLesson(lessonId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Lesson deleted");
      router.refresh();
    });
  };

  // ── Quiz ──
  const [quizForm, setQuizForm] = useState({
    title: course.quiz?.title ?? "",
    passingScore: course.quiz?.passingScore ?? 70,
  });

  const handleSaveQuiz = () => {
    if (!quizForm.title.trim()) {
      toast.error("Quiz title is required");
      return;
    }
    startTransition(async () => {
      const result = await upsertQuiz(course.id, {
        title: quizForm.title,
        passingScore: quizForm.passingScore,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Quiz saved!");
      router.refresh();
    });
  };

  const [newQuestionText, setNewQuestionText] = useState("");
  const [newOptions, setNewOptions] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);

  const handleAddQuestion = () => {
    if (!course.quiz?.id) {
      toast.error("Save the quiz first before adding questions");
      return;
    }
    if (!newQuestionText.trim()) {
      toast.error("Question text is required");
      return;
    }
    const correctCount = newOptions.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      toast.error("Exactly one option must be marked correct");
      return;
    }
    const validOptions = newOptions.filter((o) => o.text.trim());
    if (validOptions.length < 2) {
      toast.error("At least 2 options are required");
      return;
    }
    startTransition(async () => {
      const result = await createQuestion(course.quiz!.id, {
        text: newQuestionText.trim(),
        options: validOptions.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setNewQuestionText("");
      setNewOptions([
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ]);
      toast.success("Question added!");
      router.refresh();
    });
  };

  const handleDeleteQuestion = (questionId: string) => {
    startTransition(async () => {
      const result = await deleteQuestion(questionId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Question deleted");
      router.refresh();
    });
  };

  // ── Publish ──
  const handleTogglePublish = () => {
    startTransition(async () => {
      const result = await togglePublish(course.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setCourse((prev) => ({ ...prev, published: result.data.published }));
      toast.success(result.data.published ? "Course published!" : "Course unpublished");
    });
  };

  return (
    <Tabs defaultValue="info">
      <TabsList className="mb-6 w-full sm:w-auto">
        <TabsTrigger value="info">Course Info</TabsTrigger>
        <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
        <TabsTrigger value="quiz">Quiz</TabsTrigger>
        <TabsTrigger value="publish">Publish</TabsTrigger>
      </TabsList>

      {/* ── Tab 1: Course Info ── */}
      <TabsContent value="info">
        <div className="flex flex-col gap-5 max-w-2xl">
          <h2 className="text-lg font-semibold border-b border-border pb-2">Course Information</h2>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ci-title">Title</Label>
            <Input
              id="ci-title"
              value={courseForm.title}
              onChange={(e) => setCourseForm((p) => ({ ...p, title: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ci-slug">Slug</Label>
            <Input
              id="ci-slug"
              value={courseForm.slug}
              onChange={(e) => setCourseForm((p) => ({ ...p, slug: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ci-desc">Description</Label>
            <Textarea
              id="ci-desc"
              rows={4}
              value={courseForm.description}
              onChange={(e) => setCourseForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ci-category">Category</Label>
              <select
                id="ci-category"
                className="h-11 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={courseForm.category}
                onChange={(e) => setCourseForm((p) => ({ ...p, category: e.target.value }))}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Level</Label>
              <div className="flex gap-2">
                {(["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setCourseForm((p) => ({ ...p, level: lvl }))}
                    className={cn(
                      "flex-1 py-1.5 rounded-md border text-xs font-medium transition-all",
                      courseForm.level === lvl
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    {lvl.charAt(0) + lvl.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ci-price">Price (paise)</Label>
            <Input
              id="ci-price"
              type="number"
              min="0"
              value={courseForm.pricePaise}
              onChange={(e) => setCourseForm((p) => ({ ...p, pricePaise: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ci-thumb">Thumbnail URL</Label>
            <Input
              id="ci-thumb"
              type="url"
              placeholder="https://..."
              value={courseForm.thumbnailUrl}
              onChange={(e) => setCourseForm((p) => ({ ...p, thumbnailUrl: e.target.value }))}
            />
          </div>

          <Button onClick={handleSaveCourseInfo} disabled={isPending} className="w-fit">
            {isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
            Save Course Info
          </Button>
        </div>
      </TabsContent>

      {/* ── Tab 2: Curriculum ── */}
      <TabsContent value="curriculum">
        <div className="flex flex-col gap-6 max-w-2xl">
          <h2 className="text-lg font-semibold border-b border-border pb-2">Curriculum</h2>

          {/* Add module */}
          <div className="flex gap-2">
            <Input
              placeholder="Module title…"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddModule()}
            />
            <Button onClick={handleAddModule} disabled={isPending || addingModule || !newModuleTitle.trim()}>
              <Plus size={16} />
              Add Module
            </Button>
          </div>

          {/* Module list */}
          {course.modules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No modules yet. Add your first module above.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {course.modules.map((mod) => {
                const lessonState = addLessonState[mod.id] ?? {
                  title: "", videoUrl: "", content: "", durationSec: 0,
                };

                return (
                  <div key={mod.id} className="border border-border rounded-xl overflow-hidden">
                    {/* Module header */}
                    <div className="flex items-center justify-between bg-muted px-4 py-3">
                      <span className="text-sm font-semibold">{mod.title}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground mr-2">
                          {mod.lessons.length} lessons
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Delete module"
                          onClick={() => handleDeleteModule(mod.id)}
                          disabled={isPending}
                        >
                          <Trash2 size={13} className="text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* Lesson list */}
                    <div className="px-4 py-2 flex flex-col gap-1">
                      {mod.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-2 py-1.5 text-sm"
                        >
                          <span className="flex-1 text-sm truncate">{lesson.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {Math.floor(lesson.durationSec / 60)}m
                          </span>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label="Delete lesson"
                            onClick={() => handleDeleteLesson(lesson.id)}
                            disabled={isPending}
                          >
                            <Trash2 size={12} className="text-destructive" />
                          </Button>
                        </div>
                      ))}

                      {/* Add lesson form */}
                      <div className="border-t border-border mt-2 pt-3 flex flex-col gap-2">
                        <p className="text-xs font-semibold text-muted-foreground">Add Lesson</p>
                        <Input
                          placeholder="Lesson title"
                          value={lessonState.title}
                          onChange={(e) =>
                            setAddLessonState((prev) => ({
                              ...prev,
                              [mod.id]: { ...lessonState, title: e.target.value },
                            }))
                          }
                        />
                        <Input
                          placeholder="Video URL (optional)"
                          type="url"
                          value={lessonState.videoUrl}
                          onChange={(e) =>
                            setAddLessonState((prev) => ({
                              ...prev,
                              [mod.id]: { ...lessonState, videoUrl: e.target.value },
                            }))
                          }
                        />
                        <div className="flex gap-2 items-center">
                          <Input
                            placeholder="Duration (seconds)"
                            type="number"
                            min="0"
                            value={lessonState.durationSec || ""}
                            onChange={(e) =>
                              setAddLessonState((prev) => ({
                                ...prev,
                                [mod.id]: { ...lessonState, durationSec: parseInt(e.target.value) || 0 },
                              }))
                            }
                            className="w-40"
                          />
                          <Button
                            onClick={() => handleAddLesson(mod.id)}
                            disabled={isPending || !lessonState.title.trim()}
                          >
                            <Plus size={14} />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </TabsContent>

      {/* ── Tab 3: Quiz ── */}
      <TabsContent value="quiz">
        <div className="flex flex-col gap-6 max-w-2xl">
          <h2 className="text-lg font-semibold border-b border-border pb-2">Quiz</h2>

          {/* Quiz meta */}
          <div className="flex flex-col gap-4 bg-muted/50 rounded-xl p-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quiz-title">Quiz Title</Label>
              <Input
                id="quiz-title"
                placeholder="Final Quiz"
                value={quizForm.title}
                onChange={(e) => setQuizForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quiz-score">Passing Score (%)</Label>
              <Input
                id="quiz-score"
                type="number"
                min="1"
                max="100"
                value={quizForm.passingScore}
                onChange={(e) => setQuizForm((p) => ({ ...p, passingScore: parseInt(e.target.value) || 70 }))}
                className="w-32"
              />
            </div>
            <Button onClick={handleSaveQuiz} disabled={isPending} className="w-fit">
              <Save size={16} />
              {course.quiz ? "Update Quiz" : "Create Quiz"}
            </Button>
          </div>

          {/* Questions */}
          {course.quiz && (
            <>
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold">
                  Questions ({course.quiz.questions.length})
                </h3>
                {course.quiz.questions.map((q, qi) => (
                  <div key={q.id} className="border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">
                        Q{qi + 1}: {q.text}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Delete question"
                        onClick={() => handleDeleteQuestion(q.id)}
                        disabled={isPending}
                      >
                        <Trash2 size={13} className="text-destructive" />
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-col gap-1">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={cn(
                            "flex items-center gap-2 text-xs px-2 py-1 rounded",
                            opt.isCorrect
                              ? "bg-green-100 text-green-800"
                              : "text-muted-foreground"
                          )}
                        >
                          <span>{opt.isCorrect ? "✓" : "○"}</span>
                          <span>{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add question */}
              <div className="border border-border rounded-xl p-4 flex flex-col gap-3">
                <h3 className="text-sm font-semibold">Add Question</h3>
                <Textarea
                  placeholder="Question text…"
                  rows={2}
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                />
                <div className="flex flex-col gap-2">
                  {newOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={opt.isCorrect}
                        onChange={() =>
                          setNewOptions((prev) =>
                            prev.map((o, j) => ({ ...o, isCorrect: j === i }))
                          )
                        }
                        className="text-primary"
                        aria-label={`Mark option ${i + 1} as correct`}
                      />
                      <Input
                        placeholder={`Option ${i + 1}`}
                        value={opt.text}
                        onChange={(e) =>
                          setNewOptions((prev) =>
                            prev.map((o, j) =>
                              j === i ? { ...o, text: e.target.value } : o
                            )
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select the radio button next to the correct answer.
                </p>
                <Button
                  onClick={handleAddQuestion}
                  disabled={isPending || !newQuestionText.trim()}
                  className="w-fit"
                >
                  <Plus size={14} />
                  Add Question
                </Button>
              </div>
            </>
          )}
        </div>
      </TabsContent>

      {/* ── Tab 4: Publish ── */}
      <TabsContent value="publish">
        <div className="flex flex-col gap-6 max-w-2xl">
          <h2 className="text-lg font-semibold border-b border-border pb-2">Publish Settings</h2>

          <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Course Status</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {course.published
                    ? "Your course is live and visible to students."
                    : "Your course is a draft and not yet visible."}
                </p>
              </div>
              <Switch
                checked={course.published}
                onCheckedChange={handleTogglePublish}
                disabled={isPending}
                aria-label="Toggle course publish status"
              />
            </div>

            {course.published && (
              <Button
                variant="outline"
                className="w-fit"
                render={<Link href={`/courses/${course.slug}`} target="_blank" /> as ReactElement}
              >
                <Eye size={14} />
                Preview Course
              </Button>
            )}
          </div>

          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-destructive mb-1">Danger Zone</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Deleting a course is irreversible. All enrollments and progress will be lost.
            </p>
            <Button variant="destructive" size="sm" disabled>
              Delete Course (contact support)
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
