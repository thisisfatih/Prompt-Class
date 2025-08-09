import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, ctx: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await ctx.params;
  try {
    const { courseVersionId } = (await req.json()) as { courseVersionId?: string };
    if (!courseVersionId) return NextResponse.json({ error: "courseVersionId required" }, { status: 400 });

    const version = await prisma.courseVersion.findUnique({ where: { courseVersionId } });
    if (!version || version.courseId !== courseId) {
      return NextResponse.json({ error: "Version not found for this course" }, { status: 404 });
    }

    await prisma.course.update({
      where: { courseId },
      data: { currentVersionId: courseVersionId },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
