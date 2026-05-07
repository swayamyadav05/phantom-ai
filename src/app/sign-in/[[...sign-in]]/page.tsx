import Image from "next/image";
import { SignIn } from "@clerk/nextjs";
import { Cpu, Users, FileText } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-base flex">
      {/* Left panel — 50% on lg+, hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 flex-col bg-elevated px-16 py-14">
        {/* Logo */}
        <Image
          src="/name-logo.svg"
          alt="Phantom AI"
          width={160}
          height={160}
        />

        {/* Hero + features */}
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-4xl font-bold text-copy-primary leading-tight mb-5">
            Design systems at the
            <br />
            speed of thought.
          </h1>
          <p className="text-copy-secondary leading-relaxed mb-12">
            Describe your architecture in plain English. Phantom AI
            maps it to a shared canvas your whole team can refine in
            real time.
          </p>

          <ul className="space-y-8">
            <li className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-accent-dim flex items-center justify-center shrink-0 mt-0.5">
                <Cpu className="h-4 w-4 text-brand" />
              </div>
              <div>
                <p className="text-copy-primary font-medium text-sm mb-1">
                  AI Architecture Generation
                </p>
                <p className="text-copy-muted text-sm leading-relaxed">
                  Describe your system, AI maps it to nodes and edges
                  on a live canvas.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-subtle flex items-center justify-center shrink-0 mt-0.5">
                <Users className="h-4 w-4 text-brand" />
              </div>
              <div>
                <p className="text-copy-primary font-medium text-sm mb-1">
                  Real-time Collaboration
                </p>
                <p className="text-copy-muted text-sm leading-relaxed">
                  Live cursors, presence indicators, and shared node
                  editing across your team.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-subtle flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="h-4 w-4 text-brand" />
              </div>
              <div>
                <p className="text-copy-primary font-medium text-sm mb-1">
                  Instant Spec Generation
                </p>
                <p className="text-copy-muted text-sm leading-relaxed">
                  Export a complete Markdown technical spec directly
                  from the canvas graph.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Right panel — Clerk form, full width on mobile */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-base">
        <SignIn />
      </div>
    </div>
  );
}
