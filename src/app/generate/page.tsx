"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const courseSchema = z.object({
  courseName: z.string().min(2),
  courseCreator: z.string().min(2),
});
const questionSchema = z.object({
  questionSentence: z.string().min(4),
  options: z.string().optional(),
  answer: z.string().min(1),
});
type CourseForm = z.infer<typeof courseSchema>;
type QuestionForm = z.infer<typeof questionSchema>;
type DraftIds = { courseId: string; courseVersionId: string };

export default function GeneratePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [ids, setIds] = useState<DraftIds | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("pc_draft_ids");
    if (raw) setIds(JSON.parse(raw));
  }, []);
  useEffect(() => {
    if (ids) localStorage.setItem("pc_draft_ids", JSON.stringify(ids));
  }, [ids]);

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Generate a new course</h1>
      {step === 1 && (
        <Step1
          onNext={(v) => {
            setIds(v);
            setStep(2);
          }}
          saving={saving}
          setSaving={setSaving}
        />
      )}
      {step === 2 && ids && <Step2 ids={ids} onSaved={() => setStep(3)} />}
      {step === 3 && ids && (
        <Step3
          ids={ids}
          onAddAnother={() => setStep(2)}
          reset={() => {
            setIds(null);
            localStorage.removeItem("pc_draft_ids");
            setStep(1);
          }}
        />
      )}
    </main>
  );
}

function Step1({
  onNext,
  saving,
  setSaving,
}: {
  onNext: (ids: DraftIds) => void;
  saving: boolean;
  setSaving: (b: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseForm>({ resolver: zodResolver(courseSchema) });
  const submit = async (data: CourseForm) => {
    setSaving(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create course");
      onNext(await res.json());
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4 space-y-4">
        <form onSubmit={handleSubmit(submit)} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="courseName">Course name</Label>
            <Input id="courseName" {...register("courseName")} />
            {errors.courseName && (
              <p className="text-xs text-red-600">
                {errors.courseName.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="courseCreator">Creator name</Label>
            <Input id="courseCreator" {...register("courseCreator")} />
            {errors.courseCreator && (
              <p className="text-xs text-red-600">
                {errors.courseCreator.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full h-12 rounded-2xl"
            disabled={saving}
          >
            {saving ? "Saving…" : "Next"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Step2({ ids, onSaved }: { ids: DraftIds; onSaved: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<QuestionForm>({ resolver: zodResolver(questionSchema) });
  const inferType = (opts?: string, answer?: string) => {
    const a = (answer ?? "").trim().toLowerCase();
    if (a === "true" || a === "false") return "TRUE_FALSE";
    if (opts && opts.includes(";")) return "MULTI_SELECT";
    return "SHORT_ANSWER";
  };
  const submit = async (data: QuestionForm) => {
    try {
      const res = await fetch(`/api/courses/${ids.courseId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseVersionId: ids.courseVersionId,
          questionSentence: data.questionSentence,
          options: data.options?.trim() ? data.options : undefined,
          answer: data.answer,
          questionType: inferType(data.options, data.answer),
        }),
      });
      if (!res.ok) throw new Error("Failed to save question");
      reset();
      onSaved();
    } catch (e) {
      alert((e as Error).message);
    }
  };
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4 space-y-4">
        <form onSubmit={handleSubmit(submit)} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="questionSentence">Question</Label>
            <Textarea
              id="questionSentence"
              rows={4}
              {...register("questionSentence")}
            />
            {errors.questionSentence && (
              <p className="text-xs text-red-600">
                {errors.questionSentence.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="options">Potential answers (separate with ;)</Label>
            <Input
              id="options"
              placeholder="A;B;C;D (optional)"
              {...register("options")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="answer">Correct answer</Label>
            <Input id="answer" {...register("answer")} />
            {errors.answer && (
              <p className="text-xs text-red-600">{errors.answer.message}</p>
            )}
          </div>
          <Button type="submit" className="h-12 rounded-2xl">
            Save question
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Step3({
  ids,
  onAddAnother,
}: {
  ids: { courseId: string; courseVersionId: string };
  onAddAnother: () => void;
}) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);

  const publish = async () => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/courses/${ids.courseId}/publish`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to publish");

      toast.success("Course published!", {
        description: "You can now view it in Courses.",
        duration: 3000,
      });

      setTimeout(() => {
        router.push("/courses");
      }, 800);
    } catch (e) {
      toast.error("Error publishing course", {
        description: (e as Error).message,
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="rounded-2xl border p-4 space-y-4">
      <p className="text-sm text-muted-foreground">Add another question?</p>
      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={onAddAnother}
          className="h-12 rounded-2xl border"
        >
          Add another question
        </button>
        <button
          type="button"
          onClick={publish}
          className="h-12 rounded-2xl bg-black text-white"
          disabled={publishing}
        >
          {publishing ? "Publishing…" : "Publish course"}
        </button>
      </div>
    </div>
  );
}
