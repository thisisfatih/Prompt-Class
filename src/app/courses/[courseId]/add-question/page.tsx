"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const schema = z.object({
  questionSentence: z.string().min(4, "Question is too short"),
  options: z.string().optional(), // ; separated
  answer: z.string().min(1, "Answer required"),
});
type Form = z.infer<typeof schema>;

export default function AddQuestionPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const inferType = (opts?: string, answer?: string) => {
    const a = (answer ?? "").trim().toLowerCase();
    if (a === "true" || a === "false") return "TRUE_FALSE" as const;
    if (opts && opts.includes(";")) return "MULTI_SELECT" as const;
    return "SHORT_ANSWER" as const;
  };

  const onSubmit = async (data: Form) => {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/courses/${courseId}/versions/append-question`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionSentence: data.questionSentence,
            options: data.options?.trim() ? data.options : undefined,
            answer: data.answer,
            questionType: inferType(data.options, data.answer),
          }),
        },
      );

      if (!res.ok) throw new Error("Failed to append question");
      const json = (await res.json()) as { newVersionNumber: number };

      toast.success("Question added to new version", {
        description: `Created v${json.newVersionNumber}`,
        duration: 2500,
      });

      // Go to the course details page for the new version
      setTimeout(() => {
        router.push(`/courses/${courseId}?v=${json.newVersionNumber}`);
      }, 500);
    } catch (e) {
      toast.error("Error", { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Add a question</h1>
      <div className="rounded-2xl border p-4 space-y-3">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
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
          <Button
            type="submit"
            className="w-full h-12 rounded-2xl"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save to new version"}
          </Button>
        </form>
      </div>
    </main>
  );
}
