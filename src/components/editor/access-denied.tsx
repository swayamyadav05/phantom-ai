import Link from "next/link";
import { Lock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <div className="flex h-[calc(100vh-3rem)] w-full items-center justify-center bg-base">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-subtle">
          <Lock className="h-6 w-6 text-copy-muted" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold text-copy-primary">
            Access denied
          </h2>
          <p className="text-sm text-copy-muted">
            You don&apos;t have access to this project.
          </p>
        </div>
        <Link
          href="/editor"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Back to projects
        </Link>
      </div>
    </div>
  );
}
