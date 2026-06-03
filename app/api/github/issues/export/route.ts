import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  createGithubIssue,
  getGithubErrorMessage,
  verifyGithubRepositoryAccess,
} from "@/lib/github-issues";
import type { FailedGithubIssue, GithubIssueTask } from "@/lib/github-issues";
import { decryptToken } from "@/lib/encryption";
import { db } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

interface ExportGithubIssuesRequest {
  repository?: string;
  tasks?: GithubIssueTask[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as ExportGithubIssuesRequest;
    const repository = body.repository?.trim();
    const tasks = body.tasks;

    if (!repository || !tasks?.length) {
      return NextResponse.json(
        { success: false, message: "Repository and tasks are required" },
        { status: 400 },
      );
    }

    const repositoryParts = repository.split("/");
    const [owner, repo] = repositoryParts;

    if (repositoryParts.length !== 2 || !owner || !repo) {
      return NextResponse.json(
        { success: false, message: "Repository must use owner/repo format" },
        { status: 400 },
      );
    }

    // @ts-expect-error id is added in jwt callback
    const userId = session.user.id as string;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { githubAccessToken: true },
    });

    if (!user?.githubAccessToken) {
      return NextResponse.json(
        { success: false, message: "GitHub not connected" },
        { status: 403 },
      );
    }

    const githubToken = decryptToken(user.githubAccessToken);

    try {
      await verifyGithubRepositoryAccess(githubToken, owner, repo);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: getGithubErrorMessage(error),
        },
        { status: 403 },
      );
    }

    const createdIssues = [];
    const failedIssues: FailedGithubIssue[] = [];

    for (const task of tasks) {
      try {
        createdIssues.push(
          await createGithubIssue(githubToken, owner, repo, task),
        );
      } catch (error) {
        failedIssues.push({
          taskId: task.id,
          title: task.title,
          error: getGithubErrorMessage(error),
        });
      }
    }

    return NextResponse.json({
      success: failedIssues.length === 0,
      createdIssues,
      failedIssues,
    });
  } catch (error) {
    console.error("Error exporting GitHub issues:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to export GitHub issues",
      },
      { status: 500 },
    );
  }
}
