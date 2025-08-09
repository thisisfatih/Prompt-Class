import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, ctx: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await ctx.params;
  try {
    const url = new URL(req.url);
    const vParam = url.searchParams.get("v");
    const versionFromQuery = vParam ? parseInt(vParam, 10) : undefined;

    const course = await prisma.course.findUnique({
      where: { courseId },
      include: { currentVersion: true, versions: { orderBy: { version: "desc" } } },
    });
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const defaultVersion = course.currentVersion?.version ?? (course.versions[0]?.version ?? 1);
    const selectedVersion = versionFromQuery ?? defaultVersion;

    const selectedVersionRow =
      course.versions.find((v) => v.version === selectedVersion) ?? course.versions[0];

    const questions = selectedVersionRow
      ? await prisma.courseQuestion.findMany({
          where: { courseId, courseVersionId: selectedVersionRow.courseVersionId },
          include: { question: true },
          orderBy: { courseQuestionId: "asc" },
        })
      : [];

    return NextResponse.json({
      course: {
        courseId: course.courseId,
        courseName: course.courseName,
        courseCreator: course.courseCreator,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      },
      versions: course.versions.map((v) => ({
        courseVersionId: v.courseVersionId,
        version: v.version,
      })),
      selectedVersion,
      currentVersion: course.currentVersion?.version ?? null, // ← expose current
      questions: questions.map((cq) => ({
        courseQuestionId: cq.courseQuestionId,
        questionId: cq.questionId,
        questionSentence: cq.question.questionSentence,
        options: cq.question.options,
        answer: cq.question.answer,
        questionType: cq.question.questionType,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
