import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MermaidEditorClient } from "./components/mermaid-editor-client";
import { DOC_ROUTES } from "@/lib/routes";

export default async function UpdateMermaidPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  // @ts-expect-error id is added to the session in the session callback
  if (!session?.user?.id) {
    redirect(DOC_ROUTES.IMPORT.ROOT);
  }

  const { id: generationId } = await params;

  const generation = await db.generation.findFirst({
    where: {
      id: generationId,
      // @ts-expect-error id is added to the session in the session callback
      userId: session.user.id,
    },
  });

  if (!generation || !generation.githubGeneration) {
    redirect(DOC_ROUTES.IMPORT.ROOT);
  }

  return (
    <div className="container py-28 lg:py-42 mx-auto px-4">
      <MermaidEditorClient
        generationId={generation.id}
        initialMermaidCode={generation.githubGeneration}
        userInput={generation.userInput}
      />
    </div>
  );
}
