// src/app/courses/page.tsx
import Link from "next/link";
import { headers } from "next/headers";

type ApiCourse = {
  courseId: string;
  courseName: string;
  courseCreator: string;
  createdAt: string;
  latestVersion: number;
  currentVersion: number; // NEW
};

export default async function CoursesPage() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host")!;
  const base = `${proto}://${host}`;

  const res = await fetch(`${base}/api/courses`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load courses");
  const courses: ApiCourse[] = await res.json();

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Courses</h1>
      <ul className="space-y-3">
        {courses.map((c) => (
          <li key={c.courseId}
            className="p-4 rounded-2xl glass shadow-soft hover:shadow-card transition-shadow">
            <Link href={`/courses/${c.courseId}`} className="block">
              <div className="text-base font-medium">{c.courseName}</div>
              <div className="text-xs text-muted-foreground">
                by {c.courseCreator} • v{c.latestVersion}
              </div>
              <div className="text-xs text-muted-foreground">
                by {c.courseCreator} • current v{c.currentVersion} (latest v{c.latestVersion})
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
