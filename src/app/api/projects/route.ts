import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const name =
    (typeof body.name === "string" ? body.name.trim() : "") ||
    "Untitled Project";
  const slugBase = toSlug(name) || "project";
  const suffix = Math.random().toString(36).slice(2, 8);
  const slug = `${slugBase}-${suffix}`;
  try {
    const project = await prisma.project.create({
      data: { ownerId: userId, name, slug },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (err: unknown) {
    // P2002 = unique constraint violation (slug collision)
    if (
      typeof err === "object" &&
      err !== null &&
      (err as { code?: string }).code === "P2002"
    ) {
      // Retry with a fresh suffix
      const retrySlug = `${slugBase}-${Math.random().toString(36).slice(2, 8)}`;
      const project = await prisma.project.create({
        data: { ownerId: userId, name, slug: retrySlug },
      });
      return NextResponse.json(project, { status: 201 });
    }
    throw err;
  }
}
