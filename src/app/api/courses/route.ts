import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });

    // shape: minimal fields + latest version
    const payload = courses.map((c) => ({
      courseId: c.courseId,
      courseName: c.courseName,
      courseCreator: c.courseCreator,
      createdAt: c.createdAt,
      latestVersion: c.versions[0]?.version ?? 1,
    }));

    return NextResponse.json(payload);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const {
      courseName,
      courseCreator,
      createdBy = courseCreator,
    } = await req.json();
    if (!courseName || !courseCreator)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const course = await prisma.course.create({
      data: { courseName, courseCreator, createdBy, updatedBy: createdBy },
    });

    const version = await prisma.courseVersion.create({
      data: { courseId: course.courseId, version: 1 },
    });

    return NextResponse.json({
      courseId: course.courseId,
      courseVersionId: version.courseVersionId,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
