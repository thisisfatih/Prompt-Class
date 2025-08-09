import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await ctx.params; // ⬅️ await params
  try {
    const { courseVersionId, questionSentence, options, answer, questionType } =
      await req.json();
    if (!courseVersionId || !questionSentence || !answer || !questionType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const q = await prisma.question.create({
      data: {
        questionSentence,
        answer,
        options: options ?? null,
        questionType,
      },
    });

    const cq = await prisma.courseQuestion.create({
      data: { courseId, courseVersionId, questionId: q.questionId },
    });

    return NextResponse.json({
      courseQuestionId: cq.courseQuestionId,
      questionId: q.questionId,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
