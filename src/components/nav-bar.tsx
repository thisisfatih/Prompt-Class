"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { BookOpen, Sparkles, Play } from "lucide-react";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const showBack =
    pathname !== "/" && pathname !== "/courses" && pathname !== "/practice";

  const handleBack = useCallback(() => {
    if (window.history.length <= 1) router.push("/courses");
    else router.back();
  }, [router]);

  return (
    <div className="sticky top-0 z-40">
      <nav className="glass rounded-2xl px-4 py-3 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                onClick={handleBack}
                className="text-sm underline opacity-80 hover:opacity-100"
              >
                ← Back
              </button>
            )}
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-semibold"
            >
              <Sparkles className="h-4 w-4 text-brand" />
              PC
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/courses"
              className="inline-flex items-center gap-1 hover:underline opacity-90"
            >
              <BookOpen className="h-4 w-4" /> Courses
            </Link>
            <Link
              href="/practice"
              className="inline-flex items-center gap-1 hover:underline opacity-90"
            >
              <Play className="h-4 w-4" /> Practice
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
