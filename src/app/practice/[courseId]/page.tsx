"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";

type Question = {
  courseQuestionId: string;
  questionId: string;
  questionSentence: string;
  options: string | null; // semicolon-separated
  answer: string;
  questionType: "TRUE_FALSE" | "MULTI_SELECT" | "SHORT_ANSWER";
};

type ApiCourseDetail = {
  course: { courseId: string; courseName: string };
  versions: { courseVersionId: string; version: number }[];
  selectedVersion: number;
  currentVersion: number | null;
  questions: Question[];
};

type UserLocal = { userId: string; name: string } | null;

type SessionEnsure = {
  sessionId: string;
  currentIndex: number; // NEXT question to answer (0..total)
  correctCount: number;
  totalQuestions: number;
  status: "IN_PROGRESS" | "COMPLETED";
  courseVersion: number;
};

type SessionPatch = {
  sessionId: string;
  currentIndex: number;
  correctCount: number;
  status: "IN_PROGRESS" | "COMPLETED";
};

export default function PracticeRunPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();

  // data
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiCourseDetail | null>(null);

  // session
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [totalFromSession, setTotalFromSession] = useState<number | null>(null);
  const [user, setUser] = useState<UserLocal>(null);

  // quiz state (client)
  const [i, setI] = useState(0); // CURRENT question index being shown
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [choice, setChoice] = useState<string>("");
  const [done, setDone] = useState(false);

  // auto-advance
  const [countdown, setCountdown] = useState<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // helpers
  const normalize = (s: string) => s.trim().toLowerCase();
  const q = useMemo(() => (data ? data.questions[i] : null), [data, i]);
  const options = useMemo(
    () =>
      q?.options
        ? q.options
            .split(";")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    [q],
  );

  const safeTotal = totalFromSession ?? data?.questions.length ?? 0;
  const safeScore = Math.min(score, safeTotal);

  const optionClass = (opt: string) => {
    const isSelected = choice === opt;
    const isCorrect = answered && normalize(opt) === normalize(q!.answer);
    const isWrong = answered && isSelected && !isCorrect;

    if (answered) {
      if (isCorrect) return "bg-green-500 text-white border-green-500";
      if (isWrong) return "bg-red-500 text-white border-red-500";
      return "bg-white text-gray-900 border-gray-300";
    } else {
      if (isSelected)
        return "bg-primary text-primary-foreground border-primary";
      return "bg-white text-gray-900 border-gray-300";
    }
  };

  // progress: show how many have been *completed* (answered ? includes the current one)
  const completedCount = Math.min(i + (answered ? 1 : 0), safeTotal);
  const progress = safeTotal
    ? Math.round((completedCount / safeTotal) * 100)
    : 0;

  // load course
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/courses/${courseId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load course");
        const json: ApiCourseDetail = await res.json();
        if (alive) setData(json);
      } catch (e) {
        toast.error("Error", { description: (e as Error).message });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [courseId]);

  // get local user (UserGate populates this)
  useEffect(() => {
    const raw = localStorage.getItem("pc_user");
    if (raw) {
      setUser(JSON.parse(raw));
    } else {
      const id = setInterval(() => {
        const r = localStorage.getItem("pc_user");
        if (r) {
          setUser(JSON.parse(r));
          clearInterval(id);
        }
      }, 500);
      return () => clearInterval(id);
    }
  }, []);

  // ensure or resume session (server is source of truth)
  useEffect(() => {
    if (!user?.userId || !courseId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/practice/ensure-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.userId, courseId }),
        });
        if (!res.ok) throw new Error("Failed to ensure session");
        const s: SessionEnsure = await res.json();
        if (cancelled) return;

        setSessionId(s.sessionId);
        setTotalFromSession(s.totalQuestions ?? null);
        setScore(
          Math.min(
            s.correctCount ?? 0,
            s.totalQuestions ?? Number.MAX_SAFE_INTEGER,
          ),
        );

        // If the server says we’re completed or the pointer is beyond the end,
        // show results (so you won’t “lose” questions or see weird progress).
        if (
          s.status === "COMPLETED" ||
          s.currentIndex >= (s.totalQuestions ?? 0)
        ) {
          setDone(true);
          setI(Math.max(0, (s.totalQuestions ?? 1) - 1)); // display last question under the hood
          setAnswered(false);
          setChoice("");
        } else {
          // resume exactly at the next question to answer
          setI(s.currentIndex ?? 0);
          setAnswered(false);
          setChoice("");
          setDone(false);
        }
      } catch (e) {
        toast.error("Error", { description: (e as Error).message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.userId, courseId]);

  // countdown after answer
  useEffect(() => {
    if (!answered) return;
    setCountdown(5);

    if (tickRef.current) clearInterval(tickRef.current);
    if (advRef.current) clearTimeout(advRef.current);

    tickRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (tickRef.current) clearInterval(tickRef.current);
          advRef.current = setTimeout(() => goNext(), 100);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (advRef.current) clearTimeout(advRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered]);

  // persist on hide/close: write best-effort current state WITHOUT flipping to completed
  useEffect(() => {
    const onHide = () => {
      if (!sessionId || !safeTotal) return;
      const nextIndex = answered ? Math.min(i + 1, safeTotal) : i;
      fetch(`/api/practice/session/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentIndex: nextIndex,
          correctCount: Math.min(score, safeTotal),
        }),
      }).catch(() => {});
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onHide);
    };
  }, [answered, i, score, sessionId, safeTotal]);

  // --- server sync helper (reads server result and syncs local) ---
  const patchProgress = (
    nextIndex: number,
    nextScore: number,
    markDone = false,
  ) => {
    if (!sessionId) return;

    fetch(`/api/practice/session/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentIndex: nextIndex,
        correctCount: nextScore,
        ...(markDone ? { status: "COMPLETED" } : {}),
      }),
    })
      .then(async (r) => {
        if (!r.ok) return;
        const s: SessionPatch = await r.json();
        // sync local with server
        setScore(Math.min(s.correctCount, safeTotal));
        // don't move i here — we control i locally via goNext/resume
      })
      .catch(() => {});
  };

  // interactions
  const submit = () => {
    if (!q || !safeTotal) return;

    // already checked -> skip wait
    if (answered) {
      goNext();
      return;
    }

    const correct =
      q.questionType === "TRUE_FALSE"
        ? normalize(choice) === normalize(q.answer)
        : q.questionType === "MULTI_SELECT"
          ? !!choice && normalize(choice) === normalize(q.answer)
          : normalize(choice) === normalize(q.answer);

    setAnswered(true);

    const nextScore = Math.min(correct ? score + 1 : score, safeTotal);
    if (correct) toast.success("Nice! ✅", { duration: 800 });
    else
      toast.error("Not quite", {
        description: `Correct: ${q.answer}`,
        duration: 1600,
      });

    // Save resume point RIGHT NOW to the *next* question.
    const nextIndex = Math.min(i + 1, safeTotal); // 0..total
    const isFinished = nextIndex >= safeTotal; // pointer at end means finished
    patchProgress(nextIndex, nextScore, isFinished);

    // reflect optimistic score locally (server will confirm)
    setScore(nextScore);
  };

  const goNext = () => {
    if (!safeTotal) return;
    const next = i + 1;
    if (next >= safeTotal) {
      setDone(true);

      const pct = safeTotal
        ? Math.round((Math.min(score, safeTotal) / safeTotal) * 100)
        : 0;
      if (pct >= 100) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 } });
      } else if (pct >= 70) {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      }
      return;
    }

    setI(next);
    setAnswered(false);
    setChoice("");
    setCountdown(0);

    // We already saved nextIndex in submit(), so no extra patch here (prevents double advancing).
  };

  const retake = async () => {
    setI(0);
    setScore(0);
    setAnswered(false);
    setChoice("");
    setDone(false);
    setCountdown(0);

    const raw = localStorage.getItem("pc_user");
    if (!raw) return;
    const u = JSON.parse(raw) as { userId: string };
    try {
      const res = await fetch("/api/practice/ensure-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.userId, courseId }),
      });
      if (res.ok) {
        const s: SessionEnsure = await res.json();
        setSessionId(s.sessionId);
        setTotalFromSession(s.totalQuestions ?? null);
        setScore(
          Math.min(
            s.correctCount ?? 0,
            s.totalQuestions ?? Number.MAX_SAFE_INTEGER,
          ),
        );
        if (
          s.status === "COMPLETED" ||
          s.currentIndex >= (s.totalQuestions ?? 0)
        ) {
          setDone(true);
          setI(Math.max(0, (s.totalQuestions ?? 1) - 1));
        } else {
          setI(s.currentIndex ?? 0);
          setDone(false);
        }
      }
    } catch {
      // ignore
    }
  };

  // render
  if (loading) return <main className="p-4">Loading…</main>;
  if (!data) return <main className="p-4">Course not found.</main>;

  if (done) {
    const pct = safeTotal ? Math.round((safeScore / safeTotal) * 100) : 0;
    return (
      <main className="space-y-5">
        <h1 className="text-xl font-semibold">{data.course.courseName}</h1>
        <div className="p-5 rounded-2xl glass shadow-card text-center">
          <div className="text-4xl font-bold">{pct}%</div>
          <div className="text-sm text-muted-foreground mt-1">
            {safeScore} / {safeTotal} correct
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <Button className="h-12 rounded-2xl" onClick={retake}>
            Retake course
          </Button>
          <Button
            variant="secondary"
            className="h-12 rounded-2xl"
            onClick={() => router.push("/practice")}
          >
            Pick another course
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold truncate max-w-[70%]">
          {data.course.courseName}
        </h1>
        <div className="text-xs text-muted-foreground">
          Q {completedCount} / {safeTotal}
        </div>
      </div>

      <Progress value={progress} className="h-2 rounded-full" />

      <AnimatePresence mode="wait">
        <motion.div
          key={q?.courseQuestionId ?? i}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="glass p-4 rounded-2xl shadow-card space-y-4"
        >
          <div className="text-base font-medium">{q?.questionSentence}</div>

          {q?.questionType === "TRUE_FALSE" && (
            <div className="grid grid-cols-2 gap-3">
              {["True", "False"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => !answered && setChoice(opt)}
                  className={[
                    "h-12 rounded-2xl border w-full transition-colors",
                    optionClass(opt),
                  ].join(" ")}
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
                  type="button"
                  onClick={() => !answered && setChoice(opt)}
                  className={[
                    "w-full h-12 rounded-2xl border px-4 text-left transition-colors",
                    optionClass(opt),
                  ].join(" ")}
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
                onChange={(e) => !answered && setChoice(e.target.value)}
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
              {!answered
                ? "Check"
                : i + 1 === safeTotal
                  ? countdown > 0
                    ? `Finish in ${countdown}s`
                    : "Finish"
                  : countdown > 0
                    ? `Next in ${countdown}s`
                    : "Next"}
            </Button>
            {answered && countdown > 0 && (
              <p className="text-[11px] text-muted-foreground text-center mt-1">
                Auto-advancing… tap to skip
              </p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
