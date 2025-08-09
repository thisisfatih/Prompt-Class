import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await ctx.params;
  const { currentIndex, correctCount, status } = await req.json();

  const updated = await prisma.practiceSession.update({
    where: { sessionId },
    data: {
      ...(typeof currentIndex === "number" ? { currentIndex } : {}),
      ...(typeof correctCount === "number" ? { correctCount } : {}),
      ...(status === "COMPLETED" ? { status } : {}),
    },
    select: {
      sessionId: true,
      currentIndex: true,
      correctCount: true,
      status: true,
    },
  });

  return NextResponse.json(updated);
}
