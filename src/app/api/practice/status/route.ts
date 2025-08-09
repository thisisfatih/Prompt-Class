import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/practice/status?userId=...
export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  // 1) Get all courses with currentVersionId (fallback to latest if null)
  const courses = await prisma.course.findMany({
    include: { currentVersion: true, versions: { orderBy: { version: "desc" }, take: 1 } },
  });

  // Build a map: courseId -> effective currentVersionId + totalQuestions
  const effective = await Promise.all(
    courses.map(async (c) => {
      const ver = c.currentVersion ?? c.versions[0] ?? null;
      if (!ver) return null;

      const total = await prisma.courseQuestion.count({
        where: { courseId: c.courseId, courseVersionId: ver.courseVersionId },
      });

      return {
        courseId: c.courseId,
        courseVersionId: ver.courseVersionId,
        totalQuestions: total,
      };
    })
  );

  const list = effective.filter(Boolean) as {
    courseId: string;
    courseVersionId: string;
    totalQuestions: number;
  }[];

  if (list.length === 0) return NextResponse.json([]);

  // 2) Fetch all sessions for these versionIds for this user
  const sessions = await prisma.practiceSession.findMany({
    where: {
      userId,
      courseVersionId: { in: list.map((x) => x.courseVersionId) },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      sessionId: true,
      userId: true,
      courseId: true,
      courseVersionId: true,
      currentIndex: true,
      correctCount: true,
      totalQuestions: true,
      status: true,
      updatedAt: true,
    },
  });

  // 3) Reduce to latest per courseId
  const latestByCourse = new Map<string, typeof sessions[number]>();
  for (const s of sessions) {
    const prev = latestByCourse.get(s.courseId);
    if (!prev || s.updatedAt > prev.updatedAt) latestByCourse.set(s.courseId, s);
  }

  // 4) Build payload
  const payload = list.map((c) => {
    const s = latestByCourse.get(c.courseId);
    if (!s) {
      return {
        courseId: c.courseId,
        status: "NOT_STARTED" as const,
        currentIndex: 0,
        totalQuestions: c.totalQuestions,
      };
    }
    return {
      courseId: c.courseId,
      status: s.status, // "IN_PROGRESS" | "COMPLETED"
      currentIndex: s.currentIndex,
      totalQuestions: s.totalQuestions ?? c.totalQuestions,
    };
  });

  return NextResponse.json(payload);
}
