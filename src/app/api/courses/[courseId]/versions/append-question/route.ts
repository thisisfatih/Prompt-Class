import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Body = {
  questionSentence: string;
  options?: string;
  answer: string;
  questionType: "TRUE_FALSE" | "MULTI_SELECT" | "SHORT_ANSWER";
};

export async function POST(
  req: Request,
  ctx: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await ctx.params;

  try {
    const { questionSentence, options, answer, questionType } =
      (await req.json()) as Body;

    if (!questionSentence || !answer || !questionType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1) Find latest version number
      const latest = await tx.courseVersion.findFirst({
        where: { courseId },
        orderBy: { version: "desc" },
      });
      const newVersionNumber = (latest?.version ?? 0) + 1;

      // 2) Create new version
      const newVersion = await tx.courseVersion.create({
        data: { courseId, version: newVersionNumber },
      });

      // 3) Copy previous version's questions (if any)
      if (latest) {
        const prevLinks = await tx.courseQuestion.findMany({
          where: {
            courseId,
            courseVersionId: latest.courseVersionId,
          },
          select: { questionId: true },
        });

        if (prevLinks.length > 0) {
          await tx.courseQuestion.createMany({
            data: prevLinks.map((l) => ({
              courseId,
              courseVersionId: newVersion.courseVersionId,
              questionId: l.questionId,
            })),
          });
        }
      }

      // 4) Create the new question
      const q = await tx.question.create({
        data: {
          questionSentence,
          answer,
          options: options ?? null,
          questionType,
        },
      });

      // 5) Link the new question to the *new* version
      const cq = await tx.courseQuestion.create({
        data: {
          courseId,
          courseVersionId: newVersion.courseVersionId,
          questionId: q.questionId,
        },
      });

      // 6) **Make the new version current**
      await tx.course.update({
        where: { courseId },
        data: { currentVersionId: newVersion.courseVersionId },
      });

      return {
        newVersionNumber,
        courseVersionId: newVersion.courseVersionId,
        courseQuestionId: cq.courseQuestionId,
        questionId: q.questionId,
      };
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
