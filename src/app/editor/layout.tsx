import { EditorShell } from "@/components/editor/editor-shell";
import { getEditorProjects } from "@/lib/projects";

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { owned, shared } = await getEditorProjects();
  return (
    <EditorShell ownedProjects={owned} sharedProjects={shared}>
      {children}
    </EditorShell>
  );
}
