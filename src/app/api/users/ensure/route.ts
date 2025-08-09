import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { name } = await req.json();
  const trimmed = (name ?? "").trim();
  if (!trimmed) return NextResponse.json({ error: "Name required" }, { status: 400 });

  console.info(name)

  const user = await prisma.user.upsert({
    where: { name: trimmed },
    create: { name: trimmed },
    update: {},
    select: { userId: true, name: true },
  });

  return NextResponse.json(user);
}
