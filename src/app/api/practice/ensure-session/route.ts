import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { userId, courseId } = await req.json();
  if (!userId || !courseId) return NextResponse.json({ error: "userId and courseId required" }, { status: 400 });

  const course = await prisma.course.findUnique({
    where: { courseId },
    include: { currentVersion: true, versions: { orderBy: { version: "desc" } } },
  });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const version = course.currentVersion ?? course.versions[0];
  if (!version) return NextResponse.json({ error: "Course has no versions" }, { status: 400 });

  const total = await prisma.courseQuestion.count({
    where: { courseId, courseVersionId: version.courseVersionId }
  });

  // Try to reuse an IN_PROGRESS session for this version
  let session = await prisma.practiceSession.findFirst({
    where: { userId, courseId, courseVersionId: version.courseVersionId, status: "IN_PROGRESS" },
  });

  if (!session) {
    session = await prisma.practiceSession.create({
      data: {
        userId,
        courseId,
        courseVersionId: version.courseVersionId,
        totalQuestions: total,
      },
    });
  }

  return NextResponse.json({
    sessionId: session.sessionId,
    currentIndex: session.currentIndex,
    correctCount: session.correctCount,
    totalQuestions: session.totalQuestions,
    status: session.status,
    courseVersion: version.version,
  });
}
