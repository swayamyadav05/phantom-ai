import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProjectWorkspacePage({ params }: Props) {
  const { slug } = await params;
  const { userId } = await auth();
  if (!userId) notFound();

  const project = await prisma.project.findUnique({
    where: { slug },
    select: { id: true, name: true, ownerId: true },
  });

  if (!project) notFound();

  return (
    <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
      <p className="text-sm text-copy-muted">{project.name}</p>
    </div>
  );
}
