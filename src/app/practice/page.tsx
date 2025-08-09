import Link from "next/link";
import { headers } from "next/headers";

type ApiCourse = {
    courseId: string;
    courseName: string;
    courseCreator: string;
    createdAt: string;
    latestVersion: number;
    currentVersion: number;
};

export default async function PracticeIndexPage() {
    const h = await headers();
    const proto = h.get("x-forwarded-proto") ?? "http";
    const host = h.get("host")!;
    const base = `${proto}://${host}`;

    const res = await fetch(`${base}/api/courses`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load courses");
    const courses: ApiCourse[] = await res.json();

    return (
        <main className="space-y-4">
            <h1 className="text-xl font-semibold">Pick a course</h1>
            <ul className="space-y-3">
                {courses.map((c) => (
                    <li key={c.courseId} className="p-4 rounded-2xl border">
                        <Link href={`/practice/${c.courseId}`} className="block">
                            <div className="text-base font-medium">{c.courseName}</div>
                            <div className="text-xs text-muted-foreground">
                                current v{c.currentVersion} (latest v{c.latestVersion})
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </main>
    );
}
