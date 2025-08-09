"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type ApiCourse = {
    courseId: string;
    courseName: string;
    courseCreator: string;
    createdAt: string;
    latestVersion: number;
    currentVersion: number;
};

type UserLocal = { userId: string; name: string } | null;

type StatusRow = {
    courseId: string;
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    currentIndex: number;
    totalQuestions: number;
};

export default function PracticeIndexPage() {
    const [courses, setCourses] = useState<ApiCourse[]>([]);
    const [user, setUser] = useState<UserLocal>(null);
    const [status, setStatus] = useState<Record<string, StatusRow>>({});
    const [loading, setLoading] = useState(true);

    // load courses (server API)
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await fetch("/api/courses", { cache: "no-store" });
                if (res.ok) {
                    const json = (await res.json()) as ApiCourse[];
                    if (alive) setCourses(json);
                }
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    // read user from localStorage (UserGate populates this)
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

    // fetch statuses once we have user
    useEffect(() => {
        if (!user?.userId) return;
        let cancelled = false;
        (async () => {
            const res = await fetch(`/api/practice/status?userId=${user.userId}`, { cache: "no-store" });
            if (!res.ok) return;
            const rows = (await res.json()) as StatusRow[];
            if (cancelled) return;
            const map: Record<string, StatusRow> = {};
            for (const r of rows) map[r.courseId] = r;
            setStatus(map);
        })();
        return () => { cancelled = true; };
    }, [user?.userId]);

    const withStatus = useMemo(() => {
        return courses.map((c) => ({
            ...c,
            status: status[c.courseId]?.status ?? "NOT_STARTED",
            currentIndex: status[c.courseId]?.currentIndex ?? 0,
            totalQuestions: status[c.courseId]?.totalQuestions ?? 0,
        }));
    }, [courses, status]);

    if (loading && courses.length === 0) {
        return <main className="p-4">Loading…</main>;
    }

    return (
        <main className="space-y-4">
            <h1 className="text-xl font-semibold">Pick a course</h1>
            <ul className="space-y-3">
                {withStatus.map((c) => {
                    const s = c.status;
                    const badge =
                        s === "COMPLETED" ? (
                            <Badge variant="secondary">Completed</Badge>
                        ) : s === "IN_PROGRESS" ? (
                            <Badge>In progress</Badge>
                        ) : (
                            <Badge variant="outline">Not started</Badge>
                        );

                    return (
                        <li
                            key={c.courseId}
                            className="p-4 rounded-2xl glass shadow-soft hover:shadow-card transition-shadow"
                        >
                            <Link href={`/practice/${c.courseId}`} className="block">
                                <div className="flex items-center justify-between">
                                    <div className="text-base font-medium">{c.courseName}</div>
                                    {badge}
                                </div>
                                <Separator className="my-3" />
                                <div className="text-xs text-muted-foreground">
                                    by {c.courseCreator} • current v{c.currentVersion} (latest v{c.latestVersion})
                                </div>
                                {s !== "NOT_STARTED" && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Progress: {c.currentIndex}/{c.totalQuestions}
                                    </div>
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </main>
    );
}
