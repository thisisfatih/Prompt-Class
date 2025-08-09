// src/app/courses/[courseId]/page.tsx
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { headers } from "next/headers";

type ApiCourseDetail = {
  course: {
    courseId: string;
    courseName: string;
    courseCreator: string;
    createdAt: string;
    updatedAt: string;
  };
  versions: { courseVersionId: string; version: number }[];
  selectedVersion: number;
  questions: {
    courseQuestionId: string;
    questionId: string;
    questionSentence: string;
    options: string | null;
    answer: string;
    questionType: "TRUE_FALSE" | "MULTI_SELECT" | "SHORT_ANSWER";
  }[];
};

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { courseId } = await params;
  const sp = await searchParams;
  const v = typeof sp?.v === "string" ? parseInt(sp.v, 10) : undefined;

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host")!;
  const base = `${proto}://${host}`;
  const url = v
    ? `${base}/api/courses/${courseId}?v=${v}`
    : `${base}/api/courses/${courseId}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return (
      <main className="space-y-4">
        <p className="text-sm text-red-600">Course not found.</p>
        <Link href="/courses" className="text-sm underline">
          ← Back to courses
        </Link>
      </main>
    );
  }
  const data: ApiCourseDetail = await res.json();

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{data.course.courseName}</h1>
        <Link href="/courses" className="text-sm underline">
          Back
        </Link>
      </div>
      <div className="text-xs text-muted-foreground">
        by {data.course.courseCreator}
      </div>

      {data.versions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {[...data.versions]
            .sort((a, b) => a.version - b.version)
            .map((vrow) => {
              const active = vrow.version === data.selectedVersion;
              return (
                <Link
                  key={vrow.courseVersionId}
                  href={`/courses/${data.course.courseId}?v=${vrow.version}`}
                  className={[
                    "px-3 py-1 rounded-full text-sm border",
                    active ? "bg-black text-white border-black" : "bg-white",
                  ].join(" ")}
                >
                  v{vrow.version}
                </Link>
              );
            })}
        </div>
      )}

      <Separator />

      <section className="space-y-3">
        {data.questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No questions yet in this version.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.questions.map((q, idx) => (
              <li key={q.courseQuestionId} className="p-4 rounded-2xl border">
                <div className="text-sm font-medium">
                  {idx + 1}. {q.questionSentence}
                </div>
                {q.options && (
                  <div className="text-xs mt-2">
                    <span className="text-muted-foreground">Options: </span>
                    {q.options.split(";").map((opt) => (
                      <span key={opt} className="inline-block mr-2">
                        {opt.trim()}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-xs mt-2">
                  <span className="text-muted-foreground">Answer: </span>
                  {q.answer}
                </div>
                <div className="text-[10px] mt-2 uppercase tracking-wide text-muted-foreground">
                  Type: {q.questionType}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="pt-2">
        <Link
          href={`/generate`}
          className="inline-flex items-center justify-center h-12 w-full rounded-2xl border"
        >
          Add more questions
        </Link>
      </div>
    </main>
  );
}
