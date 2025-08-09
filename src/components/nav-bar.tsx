"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const showBack = pathname !== "/" && pathname !== "/courses";

  const handleBack = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      // simple back; optionally fallback to /courses if you want:
      // if (window.history.length <= 1) router.push("/courses"); else router.back();
      router.back();
    },
    [router],
  );

  return (
    <nav className="flex items-center justify-between gap-3 border-b pb-2">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            className="text-sm underline"
          >
            ← Back
          </button>
        )}
        <Link href="/" className="font-semibold">
          Prompt Class
        </Link>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <Link href="/courses" className="hover:underline">
          Courses
        </Link>
      </div>
    </nav>
  );
}
