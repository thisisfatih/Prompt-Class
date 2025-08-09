"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Question = {
    courseQuestionId: string;
    questionId: string;
    questionSentence: string;
    options: string | null; // semicolon-separated
    answer: string;         // for MULTI_SELECT we store the single correct option as a string
    questionType: "TRUE_FALSE" | "MULTI_SELECT" | "SHORT_ANSWER";
};
type ApiCourseDetail = {
    course: { courseId: string; courseName: string };
    versions: { courseVersionId: string; version: number }[];
    selectedVersion: number;
    currentVersion: number | null;
    questions: Question[];
};

export default function PracticeRunPage() {
    const { courseId } = useParams<{ courseId: string }>();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ApiCourseDetail | null>(null);
    const [i, setI] = useState(0);
    const [score, setScore] = useState(0);
    const [answered, setAnswered] = useState(false);
    const [choice, setChoice] = useState<string>(""); // for inputs/radio
    const [done, setDone] = useState(false);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                const res = await fetch(`/api/courses/${courseId}`, { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to load course");
                const json: ApiCourseDetail = await res.json();
                if (isMounted) {
                    // shuffle questions lightly for fun? (optional)
                    setData(json);
                    setLoading(false);
                }
            } catch (e) {
                toast.error("Error", { description: (e as Error).message });
                setLoading(false);
            }
        })();
        return () => { isMounted = false; };
    }, [courseId]);

    const q = useMemo(() => (data ? data.questions[i] : null), [data, i]);
    const options = useMemo(
        () => (q?.options ? q.options.split(";").map((s) => s.trim()).filter(Boolean) : []),
        [q]
    );

    const normalize = (s: string) => s.trim().toLowerCase();

    const submit = () => {
        if (!q) return;
        if (answered) {
            // go next
            const next = i + 1;
            if (data && next >= data.questions.length) {
                setDone(true);
                toast.success("Finished!", { duration: 1200 });
            } else {
                setI(next);
                setAnswered(false);
                setChoice("");
            }
            return;
        }

        // first submit
        let correct = false;
        if (q.questionType === "TRUE_FALSE") {
            correct = normalize(choice) === normalize(q.answer);
        } else if (q.questionType === "MULTI_SELECT") {
            // we store a single correct option as string
            correct = choice && normalize(choice) === normalize(q.answer);
        } else {
            // SHORT_ANSWER: lenient compare
            correct = normalize(choice) === normalize(q.answer);
        }

        setAnswered(true);
        if (correct) {
            setScore((s) => s + 1);
            toast.success("Nice! ✅", { duration: 800 });
        } else {
            toast.error("Not quite", { description: `Correct: ${q.answer}`, duration: 1600 });
        }
    };

    const total = data?.questions.length ?? 0;
    const progress = total ? Math.round(((i + (answered ? 1 : 0)) / total) * 100) : 0;

    if (loading) return <main className="p-4">Loading…</main>;
    if (!data) return <main className="p-4">Course not found.</main>;

    if (done) {
        const pct = total ? Math.round((score / total) * 100) : 0;
        return (
            <main className="space-y-5">
                <h1 className="text-xl font-semibold">{data.course.courseName}</h1>
                <div className="p-5 rounded-2xl border text-center">
                    <div className="text-4xl font-bold">{pct}%</div>
                    <div className="text-sm text-muted-foreground mt-1">
                        {score} / {total} correct
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    <Button className="h-12 rounded-2xl" onClick={() => { setI(0); setScore(0); setAnswered(false); setChoice(""); setDone(false); }}>
                        Retake course
                    </Button>
                    <Button variant="secondary" className="h-12 rounded-2xl" onClick={() => router.push("/practice")}>
                        Pick another course
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-base font-semibold truncate max-w-[70%]">{data.course.courseName}</h1>
                <div className="text-xs text-muted-foreground">Q {i + 1}/{total}</div>
            </div>

            {/* progress bar */}
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-black transition-all" style={{ width: `${progress}%` }} />
            </div>

            {/* card */}
            <div className="p-4 rounded-2xl border space-y-4">
                <div className="text-base font-medium">{q?.questionSentence}</div>

                {/* answer UI */}
                {q?.questionType === "TRUE_FALSE" && (
                    <div className="grid grid-cols-2 gap-3">
                        {["True", "False"].map((opt) => (
                            <button
                                key={opt}
                                className={[
                                    "h-12 rounded-2xl border",
                                    choice === opt ? "bg-black text-white border-black" : "bg-white"
                                ].join(" ")}
                                onClick={() => setChoice(opt)}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                )}

                {q?.questionType === "MULTI_SELECT" && (
                    <div className="grid grid-cols-1 gap-3">
                        {options.map((opt) => (
                            <button
                                key={opt}
                                className={[
                                    "h-12 rounded-2xl border text-left px-4",
                                    choice === opt ? "bg-black text-white border-black" : "bg-white"
                                ].join(" ")}
                                onClick={() => setChoice(opt)}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                )}

                {q?.questionType === "SHORT_ANSWER" && (
                    <div className="space-y-2">
                        <Input
                            placeholder="Type your answer…"
                            value={choice}
                            onChange={(e) => setChoice(e.target.value)}
                            className="h-12 rounded-2xl"
                        />
                    </div>
                )}

                <div className="pt-2">
                    <Button
                        onClick={submit}
                        className="h-12 rounded-2xl w-full"
                        disabled={!q}
                    >
                        {answered ? (i + 1 === total ? "Finish" : "Next") : "Check"}
                    </Button>
                </div>
            </div>
        </main>
    );
}
